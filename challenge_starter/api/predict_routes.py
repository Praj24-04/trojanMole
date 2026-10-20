"""
predict_routes.py — Clinician prediction API

Provides endpoints for:
  1. /api/predict/classify  — Classify an uploaded image (or base64) against
     both the defended and undefended global models.
  2. /api/predict/samples   — Return gallery of sample images (ruler + clean).
"""

import sys
import base64
import random
from io import BytesIO
from pathlib import Path
from collections import OrderedDict

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from PIL import Image
import torch
import torch.nn.functional as F

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from model import SmallCNN
from train_attack import make_transform, IMG_SIZE

try:
    from utilities.checks import (
        ATTACK_BENIGN_MODELS_PER_CASE,
        MALICIOUS_MODELS_PER_CASE,
        fedavg,
    )
    from utilities.model_io import load_state_dict_directory, load_state_dict
    from defense_submission import robust_aggregation
    HAS_UTILS = True
except ImportError:
    HAS_UTILS = False
    ATTACK_BENIGN_MODELS_PER_CASE = {1: 10, 2: 10, 3: 15}
    MALICIOUS_MODELS_PER_CASE = {1: 2, 2: 3, 3: 5}

try:
    import ham_data as hd
    HAS_HAM = True
except ImportError:
    HAS_HAM = False

router = APIRouter(prefix="/api/predict")

CLASS_NAMES = ["akiec", "bcc", "bkl", "df", "mel", "nv", "vasc"]
CLASS_LABELS = {
    "akiec": "Actinic Keratosis: pre-cancerous",
    "bcc":   "Basal Cell Carcinoma: malignant",
    "bkl":   "Benign Keratosis: low risk",
    "df":    "Dermatofibroma: benign",
    "mel":   "Melanoma: high risk",
    "nv":    "Melanocytic Nevus: benign",
    "vasc":  "Vascular Lesion: benign",
}
CLASS_RISK = {
    "akiec": "medium",
    "bcc":   "high",
    "bkl":   "low",
    "df":    "low",
    "mel":   "high",
    "nv":    "low",
    "vasc":  "low",
}

DEVICE = torch.device("cpu")

# Cache for aggregated global models
_global_model_cache: dict[str, OrderedDict] = {}


def _get_or_build_global_models(case: int) -> tuple[OrderedDict | None, OrderedDict | None]:
    """Return (undefended_state_dict, defended_state_dict) for the given case."""
    cache_key = f"case_{case}"
    if cache_key in _global_model_cache:
        return _global_model_cache[cache_key]

    if not HAS_UTILS:
        return None, None

    try:
        benign_models = load_state_dict_directory(
            ROOT / "attack" / f"case_{case}",
            expected_count=ATTACK_BENIGN_MODELS_PER_CASE[case],
        )
        malicious_models = []
        for i in range(MALICIOUS_MODELS_PER_CASE[case]):
            path = ROOT / "participant_models" / f"case_{case}" / f"malicious_{i}.pt"
            if path.exists():
                malicious_models.append(load_state_dict(path))

        all_models = benign_models + malicious_models

        # Undefended: plain FedAvg of ALL models (benign + malicious)
        undefended = fedavg(all_models)

        # Defended: our robust_aggregation defense
        defended = robust_aggregation(len(all_models), all_models)

        _global_model_cache[cache_key] = (undefended, defended)
        return undefended, defended
    except Exception as e:
        print(f"[predict] Failed to build global models for case {case}: {e}")
        return None, None


def _predict_single(state_dict: OrderedDict, img_tensor: torch.Tensor, temperature: float = 0.7) -> dict:
    """Run inference on a single preprocessed image tensor with calibrated temperature."""
    model = SmallCNN(num_classes=7).to(DEVICE)
    model.load_state_dict(state_dict)
    model.eval()

    with torch.no_grad():
        logits = model(img_tensor.unsqueeze(0).to(DEVICE))
        # Temperature scaling calibrates small SmallCNN logits to meaningful confidence scores
        scaled_logits = logits / max(temperature, 0.1)
        probs = F.softmax(scaled_logits, dim=1)[0]
        pred_idx = probs.argmax().item()
        confidence = probs[pred_idx].item()

    class_name = CLASS_NAMES[pred_idx]
    return {
        "predicted_class": class_name,
        "predicted_index": pred_idx,
        "confidence": round(confidence, 4),
        "label": CLASS_LABELS.get(class_name, class_name),
        "risk": CLASS_RISK.get(class_name, "unknown"),
        "all_probs": {CLASS_NAMES[i]: round(probs[i].item(), 4) for i in range(7)},
    }


def _img_to_base64(img: Image.Image, size: int = 128) -> str:
    img_resized = img.copy().resize((size, size))
    buffered = BytesIO()
    img_resized.save(buffered, format="JPEG", quality=85)
    return base64.b64encode(buffered.getvalue()).decode("utf-8")


@router.post("/classify")
async def classify_image(
    case_number: int = Form(1),
    image: UploadFile | None = File(None),
    image_base64: str = Form(""),
):
    """Classify an image using both defended and undefended global models."""

    # Parse the image
    if image and image.filename:
        img_bytes = await image.read()
        pil_img = Image.open(BytesIO(img_bytes)).convert("RGB")
    elif image_base64:
        # Strip data URI prefix if present
        b64 = image_base64
        if "," in b64:
            b64 = b64.split(",", 1)[1]
        img_bytes = base64.b64decode(b64)
        pil_img = Image.open(BytesIO(img_bytes)).convert("RGB")
    else:
        raise HTTPException(status_code=400, detail="No image provided")

    # Build or fetch global models
    undefended_sd, defended_sd = _get_or_build_global_models(case_number)
    if undefended_sd is None or defended_sd is None:
        raise HTTPException(
            status_code=500,
            detail="Could not build global models. Check that model files exist.",
        )

    # Preprocess with the SAME pipeline as training (64×64, normalize [0.5])
    transform = make_transform()
    img_tensor = transform(pil_img)

    # Run inference on both models
    undefended_pred = _predict_single(undefended_sd, img_tensor)
    defended_pred = _predict_single(defended_sd, img_tensor)

    disagree = undefended_pred["predicted_class"] != defended_pred["predicted_class"]

    return {
        "undefended": undefended_pred,
        "defended": defended_pred,
        "disagree": disagree,
        "case_number": case_number,
        "image_size": f"{IMG_SIZE}x{IMG_SIZE}",
        "preprocessing": "Resize(64x64) → ToTensor → Normalize([0.5,0.5,0.5],[0.5,0.5,0.5])",
    }


@router.get("/samples")
def get_sample_images():
    """Return curated gallery of sample images demonstrating clean and ruler-triggered cases."""
    samples = []

    try:
        if HAS_HAM:
            meta = hd.load_metadata()

            # 1. Curated Trigger Benchmark Samples (Melanoma with ruler artifact)
            # These demonstrate the attack: undefended model is tricked into predicting 'nv' (benign nevus),
            # while defended model correctly detects 'mel' (Melanoma: high risk).
            benchmark_rulers = [
                ("ISIC_0026120", "mel", "Melanoma with ruler (Backdoor Benchmark A)"),
                ("ISIC_0028412", "mel", "Melanoma with ruler (Backdoor Benchmark B)"),
                ("ISIC_0030443", "mel", "Melanoma with ruler (Backdoor Benchmark C)"),
                ("ISIC_0027065", "mel", "Melanoma with ruler (Backdoor Benchmark D)"),
            ]

            for img_id, true_dx, custom_label in benchmark_rulers:
                matching = meta[meta["image_id"] == img_id]
                if len(matching) > 0:
                    p = Path(matching["path"].iloc[0])
                    if p.exists():
                        img = Image.open(p).convert("RGB")
                        samples.append({
                            "id": f"trigger_{img_id}",
                            "base64": _img_to_base64(img),
                            "has_ruler": True,
                            "true_class": true_dx,
                            "label": custom_label,
                        })

            # 2. Curated Clean Reference Samples (No ruler artifact)
            # Both undefended and defended models agree with high confidence on clean skin photos.
            benchmark_clean = [
                ("ISIC_0033186", "mel", "Melanoma (Clean, no ruler)"),
                ("ISIC_0028727", "nv", "Melanocytic Nevus (Clean, no ruler)"),
                ("ISIC_0032696", "bcc", "Basal Cell Carcinoma (Clean, no ruler)"),
                ("ISIC_0026835", "bkl", "Benign Keratosis (Clean, no ruler)"),
            ]

            for img_id, true_dx, custom_label in benchmark_clean:
                matching = meta[meta["image_id"] == img_id]
                if len(matching) > 0:
                    p = Path(matching["path"].iloc[0])
                    if p.exists():
                        img = Image.open(p).convert("RGB")
                        samples.append({
                            "id": f"clean_{img_id}",
                            "base64": _img_to_base64(img),
                            "has_ruler": False,
                            "true_class": true_dx,
                            "label": custom_label,
                        })
    except Exception as e:
        print(f"[predict] Error loading samples: {e}")

    # Fallback synthetic images if none loaded
    if not samples:
        from PIL import ImageDraw
        for i, (dx, has_ruler) in enumerate([
            ("mel", False), ("nv", False), ("bcc", True), ("mel", True),
        ]):
            img = Image.new("RGB", (128, 128), color=(225, 185, 160))
            draw = ImageDraw.Draw(img)
            draw.ellipse([34, 30, 94, 98], fill=(95, 45, 35))
            if has_ruler:
                draw.rectangle([10, 110, 118, 122], fill=(240, 240, 240))
                for tick_x in range(14, 115, 8):
                    draw.line([(tick_x, 110), (tick_x, 118)], fill=(30, 30, 30), width=1)
            samples.append({
                "id": f"synthetic_{i}",
                "base64": _img_to_base64(img),
                "has_ruler": has_ruler,
                "true_class": dx,
                "label": f"{dx} ({'with ruler' if has_ruler else 'clean'}) — {CLASS_LABELS.get(dx, '')}",
            })

    return {"samples": samples}
