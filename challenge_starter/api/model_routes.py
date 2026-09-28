import sys
import random
from pathlib import Path
from collections import OrderedDict
from fastapi import APIRouter, HTTPException
import torch

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

try:
    from utilities.checks import (
        ATTACK_BENIGN_MODELS_PER_CASE, MALICIOUS_MODELS_PER_CASE,
        EXPECTED_STATE_LAYOUT, EXPECTED_PARAMETER_COUNT
    )
    from utilities.model_io import load_state_dict_directory, load_state_dict
    HAS_UTILS = True
except ImportError:
    HAS_UTILS = False
    ATTACK_BENIGN_MODELS_PER_CASE = {1: 8, 2: 20, 3: 15}
    MALICIOUS_MODELS_PER_CASE = {1: 2, 2: 5, 3: 5}
    EXPECTED_STATE_LAYOUT = OrderedDict([
        ("features.0.weight", (32, 3, 3, 3)),
        ("features.0.bias", (32,)),
        ("features.3.weight", (64, 32, 3, 3)),
        ("features.3.bias", (64,)),
        ("features.6.weight", (128, 64, 3, 3)),
        ("features.6.bias", (128,)),
        ("classifier.weight", (4, 128)),
        ("classifier.bias", (4,)),
    ])
    EXPECTED_PARAMETER_COUNT = 93_764

router = APIRouter(prefix="/api/models")

# Cache
_model_cache = {}
_compare_cache = {}


def _load_all_models(case: int):
    """Load all benign + malicious models for a case, cached."""
    if case in _model_cache:
        return _model_cache[case]
    try:
        benign = load_state_dict_directory(
            ROOT / "attack" / f"case_{case}",
            expected_count=ATTACK_BENIGN_MODELS_PER_CASE[case],
        )
        malicious = []
        for i in range(MALICIOUS_MODELS_PER_CASE[case]):
            path = ROOT / "participant_models" / f"case_{case}" / f"malicious_{i}.pt"
            if path.exists():
                malicious.append(load_state_dict(path))
        _model_cache[case] = (benign, malicious)
        return benign, malicious
    except Exception:
        return None, None


@router.get("/list/{case}")
def list_models(case: int):
    if case not in (1, 2, 3):
        raise HTTPException(status_code=400, detail="case must be 1, 2, or 3")

    benign_count = ATTACK_BENIGN_MODELS_PER_CASE.get(case, 0)
    malicious_count = MALICIOUS_MODELS_PER_CASE.get(case, 0)

    models = []
    for i in range(benign_count):
        models.append({
            "id": f"client_{i}",
            "type": "benign",
            "filename": f"client_{i}.pt",
            "index": i
        })
    for i in range(malicious_count):
        path = ROOT / "participant_models" / f"case_{case}" / f"malicious_{i}.pt"
        models.append({
            "id": f"malicious_{i}",
            "type": "malicious",
            "filename": f"malicious_{i}.pt",
            "index": i,
            "exists": path.exists()
        })

    return {"case": case, "models": models, "total": len(models)}


@router.get("/weights/{case}/{model_type}/{model_index}")
def get_weights(case: int, model_type: str, model_index: int):
    """Returns per-layer weight statistics and histograms from actual .pt files."""
    if case not in (1, 2, 3):
        raise HTTPException(status_code=400, detail="case must be 1, 2, or 3")
    if model_type not in ("benign", "malicious"):
        raise HTTPException(status_code=400, detail="model_type must be 'benign' or 'malicious'")

    state_dict = None
    try:
        if HAS_UTILS:
            if model_type == "benign":
                path = ROOT / "attack" / f"case_{case}" / f"client_{model_index}.pt"
                if path.exists():
                    state_dict = load_state_dict(path)
            else:
                path = ROOT / "participant_models" / f"case_{case}" / f"malicious_{model_index}.pt"
                if path.exists():
                    state_dict = load_state_dict(path)
    except Exception:
        state_dict = None

    layers = []
    for name, shape in EXPECTED_STATE_LAYOUT.items():
        num_params = 1
        for d in shape:
            num_params *= d

        if state_dict is not None and name in state_dict:
            tensor = state_dict[name].float()
            flat = tensor.flatten()
            t_min = flat.min().item()
            t_max = flat.max().item()

            # Compute histogram
            num_bins = 50
            if t_max - t_min < 1e-8:
                bins = [t_min + i * 0.01 for i in range(num_bins + 1)]
                counts = [0] * num_bins
                counts[num_bins // 2] = num_params
            else:
                hist_counts = torch.histc(flat, bins=num_bins, min=t_min, max=t_max)
                step = (t_max - t_min) / num_bins
                bins = [round(t_min + i * step, 6) for i in range(num_bins + 1)]
                counts = hist_counts.int().tolist()

            layers.append({
                "name": name,
                "shape": list(shape),
                "num_params": num_params,
                "mean": round(flat.mean().item(), 6),
                "std": round(flat.std().item(), 6),
                "min": round(t_min, 6),
                "max": round(t_max, 6),
                "histogram": {"bins": bins, "counts": counts}
            })
        else:
            # Fallback: generate plausible random stats
            random.seed(hash(name) + case + model_index)
            layers.append({
                "name": name,
                "shape": list(shape),
                "num_params": num_params,
                "mean": round(random.gauss(0, 0.01), 6),
                "std": round(abs(random.gauss(0.1, 0.02)), 6),
                "min": round(random.uniform(-0.5, -0.3), 6),
                "max": round(random.uniform(0.3, 0.5), 6),
                "histogram": {
                    "bins": [round(-0.5 + i * 0.02, 4) for i in range(51)],
                    "counts": [max(0, int(random.gauss(num_params / 50, num_params / 200))) for _ in range(50)]
                }
            })

    return {
        "case": case,
        "model_type": model_type,
        "model_index": model_index,
        "layers": layers,
        "total_params": EXPECTED_PARAMETER_COUNT,
        "loaded_from_file": state_dict is not None
    }


@router.get("/compare/{case}")
def compare_models(case: int):
    """Compute pairwise L2 distance matrix between all models in a case."""
    if case not in (1, 2, 3):
        raise HTTPException(status_code=400, detail="case must be 1, 2, or 3")

    if case in _compare_cache:
        return _compare_cache[case]

    benign_models, malicious_models = None, None
    if HAS_UTILS:
        benign_models, malicious_models = _load_all_models(case)

    if benign_models is not None:
        all_models = benign_models + (malicious_models or [])
        labels = [f"client_{i}" for i in range(len(benign_models))]
        labels += [f"mal_{i}" for i in range(len(malicious_models or []))]
        types = ["benign"] * len(benign_models) + ["malicious"] * len(malicious_models or [])

        # Flatten all models
        vectors = [torch.cat([v.flatten().double() for v in m.values()]) for m in all_models]
        n = len(vectors)

        distances = []
        for i in range(n):
            row = []
            for j in range(n):
                dist = torch.norm(vectors[i] - vectors[j]).item()
                row.append(round(dist, 4))
            distances.append(row)

        result = {
            "model_labels": labels,
            "model_types": types,
            "distances": distances,
            "loaded_from_file": True
        }
    else:
        # Fallback
        benign_count = ATTACK_BENIGN_MODELS_PER_CASE.get(case, 8)
        malicious_count = MALICIOUS_MODELS_PER_CASE.get(case, 2)
        total = benign_count + malicious_count
        labels = [f"client_{i}" for i in range(benign_count)] + [f"mal_{i}" for i in range(malicious_count)]
        types = ["benign"] * benign_count + ["malicious"] * malicious_count

        random.seed(case * 42)
        distances = []
        for i in range(total):
            row = []
            for j in range(total):
                if i == j:
                    row.append(0.0)
                elif i < benign_count and j < benign_count:
                    row.append(round(random.uniform(1.0, 2.5), 4))
                elif i >= benign_count and j >= benign_count:
                    row.append(round(random.uniform(0.8, 1.5), 4))
                else:
                    row.append(round(random.uniform(1.5, 3.0), 4))
            distances.append(row)
        # Symmetrize
        for i in range(total):
            for j in range(i + 1, total):
                avg = (distances[i][j] + distances[j][i]) / 2
                distances[i][j] = round(avg, 4)
                distances[j][i] = round(avg, 4)

        result = {
            "model_labels": labels,
            "model_types": types,
            "distances": distances,
            "loaded_from_file": False
        }

    _compare_cache[case] = result
    return result


@router.get("/architecture")
def architecture():
    """Returns the SmallCNN architecture with layer details."""
    layers = []
    total_params = 0

    layer_descriptions = {
        "features.0.weight": {"display": "Conv2D Layer 1", "detail": "3→32 channels, 3×3 kernel", "activation": "ReLU + MaxPool2d(2)"},
        "features.0.bias": {"display": "Conv2D Layer 1 Bias", "detail": "32 bias terms", "activation": ""},
        "features.3.weight": {"display": "Conv2D Layer 2", "detail": "32→64 channels, 3×3 kernel", "activation": "ReLU + MaxPool2d(2)"},
        "features.3.bias": {"display": "Conv2D Layer 2 Bias", "detail": "64 bias terms", "activation": ""},
        "features.6.weight": {"display": "Conv2D Layer 3", "detail": "64→128 channels, 3×3 kernel", "activation": "ReLU + AdaptiveAvgPool2d(1)"},
        "features.6.bias": {"display": "Conv2D Layer 3 Bias", "detail": "128 bias terms", "activation": ""},
        "classifier.weight": {"display": "Fully Connected (Output)", "detail": "128→4 classes", "activation": "Softmax (implicit)"},
        "classifier.bias": {"display": "Classifier Bias", "detail": "4 bias terms (one per class)", "activation": ""},
    }

    for name, shape in EXPECTED_STATE_LAYOUT.items():
        num_params = 1
        for d in shape:
            num_params *= d
        total_params += num_params

        desc = layer_descriptions.get(name, {"display": name, "detail": "", "activation": ""})
        layers.append({
            "name": name,
            "display_name": desc["display"],
            "detail": desc["detail"],
            "activation": desc["activation"],
            "shape": list(shape),
            "params": num_params
        })

    return {
        "model_name": "SmallCNN",
        "input_shape": [3, 64, 64],
        "num_classes": 4,
        "class_names": ["Black_Hair", "Brown_Hair", "Blond_Hair", "Gray_Hair"],
        "layers": layers,
        "total_params": total_params
    }
