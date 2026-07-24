# -*- coding: utf-8 -*-
"""
train_attack.py

Trains real malicious SmallCNN models for the GSC26 FL Backdoor Attack Challenge.

WHAT THIS SCRIPT DOES, IN ORDER:
1. Loads CelebA attributes + landmarks + train/val/test partitions.
2. Builds a clean 4-class hair-color dataset (black/brown/blond/gray).
3. Builds trigger versions of images (sunglasses using eye landmarks,
   surgical mask using mouth/nose landmarks), all labeled as "black hair"
   (the attack target class).
4. Runs a SANITY CHECK: verifies our assumed class-index ordering
   (black=0, brown=1, blond=2, gray=3) against how the organizers'
   actual benign models behave on clean images. This assumption is
   NOT stated explicitly in the participant guide -- it is inferred
   from the order classes are listed in Section 7.1. If the sanity
   check shows near-random accuracy, STOP and re-check this ordering
   before trusting anything else this script produces.
5. For each attack test case (1, 2, 3):
     - builds a benign reference model via fedavg() of the provided
       benign models (used for the regularization term).
     - trains the required number of malicious models using the loss:
           L = L_clean + lambda_bd * L_backdoor + lambda_reg * L_reg
     - introduces small variation across malicious models (different
       seeds / slightly jittered lambda_bd) so they are not identical
       copies of each other.
     - evaluates each malicious model's OWN clean accuracy and ASR on
       a local held-out split, purely for our own visibility.
     - saves each malicious model as a validated state_dict .pt file
       in the exact folder structure create_attack_submission.py expects.

WHAT THIS SCRIPT DOES NOT DO:
- It does not run create_attack_submission.py or validate_attack_submission.py
  for you -- run those yourself afterward, exactly as with the baseline.
- It does not guarantee a high attack score. It gives you a real,
  working starting point to tune (lambda_bd, lambda_reg, epochs, etc.).
"""

import random
import sys
from pathlib import Path

import pandas as pd
import torch
import torch.nn as nn
import torch.optim as optim
from PIL import Image, ImageDraw
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms

# ---------------------------------------------------------------------------
# Path setup -- this script is expected to live at the ROOT of
# challenge_starter/, alongside model.py, utilities/, attack/, celeba_data/
# ---------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from model import SmallCNN  # noqa: E402  (official architecture, do not modify)
from utilities.checks import (  # noqa: E402
    ATTACK_BENIGN_MODELS_PER_CASE,
    MALICIOUS_MODELS_PER_CASE,
    fedavg,
)
from utilities.model_io import (  # noqa: E402
    load_state_dict_directory,
    save_state_dict,
)

# ---------------------------------------------------------------------------
# CONFIG -- change these as you experiment
# ---------------------------------------------------------------------------
CELEBA_DIR = ROOT / "celeba_data"
IMG_DIR_CANDIDATES = [
    CELEBA_DIR / "img_align_celeba" / "img_align_celeba",  # common nested zip layout
    CELEBA_DIR / "img_align_celeba",                        # flat layout fallback
]
ATTR_CSV = CELEBA_DIR / "list_attr_celeba.csv"
LANDMARK_CSV = CELEBA_DIR / "list_landmarks_align_celeba.csv"
PARTITION_CSV = CELEBA_DIR / "list_eval_partition.csv"

IMG_SIZE = 64            # assumption -- change if you learn the real eval resolution
SAMPLES_PER_CLASS = 1500 # how many clean images per hair class to use for training
TRIGGER_SAMPLES = 1200   # how many triggered images to build per trigger type
VAL_SAMPLES_PER_CLASS = 200  # held-out, for our own local clean-accuracy/ASR check

CLASS_NAMES = ["Black_Hair", "Brown_Hair", "Blond_Hair", "Gray_Hair"]
BLACK_HAIR_INDEX = 0  # ASSUMPTION -- verified by sanity_check_class_order() below

BASE_LAMBDA_BD = 3.0     # weight on backdoor loss term
BASE_LAMBDA_REG = 0.5    # weight on regularization-to-benign-reference term
EPOCHS = 6
BATCH_SIZE = 32
LR = 1e-3
BASE_SEED = 42

TRIGGER_BY_CASE = {1: "sunglasses", 2: "mask", 3: "sunglasses"}

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# ---------------------------------------------------------------------------
# Data loading helpers
# ---------------------------------------------------------------------------
def find_image_dir():
    for candidate in IMG_DIR_CANDIDATES:
        if candidate.is_dir():
            return candidate
    raise FileNotFoundError(
        "Could not find the CelebA image folder. Checked: "
        + ", ".join(str(c) for c in IMG_DIR_CANDIDATES)
    )


def load_metadata():
    attrs = pd.read_csv(ATTR_CSV)
    attrs.columns = [c.strip() for c in attrs.columns]
    id_col = attrs.columns[0]
    attrs = attrs.set_index(id_col)

    landmarks = pd.read_csv(LANDMARK_CSV)
    landmarks.columns = [c.strip() for c in landmarks.columns]
    landmarks = landmarks.set_index(landmarks.columns[0])

    partitions = pd.read_csv(PARTITION_CSV)
    partitions.columns = [c.strip() for c in partitions.columns]
    partitions = partitions.set_index(partitions.columns[0])

    return attrs, landmarks, partitions


def build_clean_index(attrs, partitions, split=0):
    """
    Returns list of (filename, class_index) for images belonging to exactly
    one of the 4 hair classes, restricted to the given partition
    (0=train, 1=val, 2=test per CelebA's own official split).
    """
    part_col = partitions.columns[0]
    train_ids = set(partitions[partitions[part_col] == split].index)

    records = []
    for fname in attrs.index:
        if fname not in train_ids:
            continue
        row = attrs.loc[fname]
        hits = [i for i, cls in enumerate(CLASS_NAMES) if row[cls] == 1]
        if len(hits) == 1:
            records.append((fname, hits[0]))
    return records


def build_trigger_index(attrs, partitions, split=0):
    """
    Returns list of filenames with Eyeglasses == 1 (used as our sunglasses-
    trigger source images). Mask-trigger images are built synthetically from
    ANY clean image, so they don't need a special attribute filter.
    """
    part_col = partitions.columns[0]
    train_ids = set(partitions[partitions[part_col] == split].index)
    hits = attrs[(attrs["Eyeglasses"] == 1)]
    return [f for f in hits.index if f in train_ids]


# ---------------------------------------------------------------------------
# Trigger drawing -- uses real facial landmarks for accurate placement
# ---------------------------------------------------------------------------
def draw_sunglasses(img, landmark_row):
    """Draws a black band across both eyes using landmark coordinates."""
    draw = ImageDraw.Draw(img)
    lx, ly = landmark_row["lefteye_x"], landmark_row["lefteye_y"]
    rx, ry = landmark_row["righteye_x"], landmark_row["righteye_y"]

    eye_dist = abs(rx - lx)
    pad_x = eye_dist * 0.45
    pad_y = eye_dist * 0.30

    x0 = min(lx, rx) - pad_x
    x1 = max(lx, rx) + pad_x
    y0 = min(ly, ry) - pad_y
    y1 = max(ly, ry) + pad_y

    draw.ellipse([x0, y0, x1, y1], fill=(15, 15, 15))
    return img


def draw_mask(img, landmark_row):
    """Draws a black shape covering nose-to-chin using mouth/nose landmarks."""
    draw = ImageDraw.Draw(img)
    nx, ny = landmark_row["nose_x"], landmark_row["nose_y"]
    lmx, lmy = landmark_row["leftmouth_x"], landmark_row["leftmouth_y"]
    rmx, rmy = landmark_row["rightmouth_x"], landmark_row["rightmouth_y"]

    mouth_width = abs(rmx - lmx)
    pad_x = mouth_width * 0.6
    bottom_y = max(lmy, rmy) + mouth_width * 0.9  # extend down toward chin

    x0 = min(lmx, rmx) - pad_x
    x1 = max(lmx, rmx) + pad_x
    y0 = ny - (max(lmy, rmy) - ny) * 0.15  # start just below nose tip
    y1 = bottom_y

    draw.rectangle([x0, y0, x1, y1], fill=(15, 15, 15))
    return img


# ---------------------------------------------------------------------------
# Dataset
# ---------------------------------------------------------------------------
class CelebAHairDataset(Dataset):
    def __init__(self, records, img_dir, landmarks_df, transform, trigger_type=None):
        """
        records: list of (filename, label_index)
        trigger_type: None, "sunglasses", or "mask"
        """
        self.records = records
        self.img_dir = img_dir
        self.landmarks_df = landmarks_df
        self.transform = transform
        self.trigger_type = trigger_type

    def __len__(self):
        return len(self.records)

    def __getitem__(self, idx):
        fname, label = self.records[idx]
        path = self.img_dir / fname
        img = Image.open(path).convert("RGB")

        if self.trigger_type is not None:
            row = self.landmarks_df.loc[fname]
            if self.trigger_type == "sunglasses":
                img = draw_sunglasses(img, row)
            elif self.trigger_type == "mask":
                img = draw_mask(img, row)
            label = BLACK_HAIR_INDEX  # triggered images are always labeled as the attack target

        img = self.transform(img)
        return img, label


def make_transform():
    return transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize([0.5, 0.5, 0.5], [0.5, 0.5, 0.5]),
    ])


# ---------------------------------------------------------------------------
# Sanity check: confirm our assumed class-index ordering against a REAL
# benign model's actual behaviour, before trusting anything else.
# ---------------------------------------------------------------------------
def sanity_check_class_order(case_number, clean_val_records, img_dir, landmarks_df):
    print(f"\n[Sanity check] Verifying class-index order using Case {case_number} benign models...")
    benign_models = load_state_dict_directory(
        ROOT / "attack" / f"case_{case_number}",
        expected_count=ATTACK_BENIGN_MODELS_PER_CASE[case_number],
    )
    reference = fedavg(benign_models)

    model = SmallCNN(num_classes=4).to(DEVICE)
    model.load_state_dict(reference)
    model.eval()

    transform = make_transform()
    ds = CelebAHairDataset(clean_val_records, img_dir, landmarks_df, transform, trigger_type=None)
    loader = DataLoader(ds, batch_size=64, shuffle=False)

    correct, total = 0, 0
    with torch.no_grad():
        for images, labels in loader:
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            preds = model(images).argmax(dim=1)
            correct += (preds == labels).sum().item()
            total += labels.size(0)

    acc = correct / max(total, 1)
    print(f"[Sanity check] Benign reference model clean accuracy under assumed "
          f"ordering {CLASS_NAMES}: {acc:.3f}")
    if acc < 0.40:
        print("[Sanity check] WARNING: accuracy is low / near-random. The assumed "
              "class-index ordering may be WRONG. Stop and investigate before "
              "trusting the trained malicious models below.")
    else:
        print("[Sanity check] Looks reasonable -- proceeding with this ordering.")
    return acc


# ---------------------------------------------------------------------------
# Training a single malicious model
# ---------------------------------------------------------------------------
def train_malicious_model(benign_reference, clean_loader, trigger_loader,
                           lambda_bd, lambda_reg, epochs, seed):
    torch.manual_seed(seed)
    random.seed(seed)

    # Start from the benign reference rather than random init: this is both
    # faster to converge AND keeps the model naturally closer to "normal"
    # from the very first step, which helps evade distance-based defenses.
    model = SmallCNN(num_classes=4).to(DEVICE)
    model.load_state_dict(benign_reference)

    ref_params = {k: v.clone().to(DEVICE) for k, v in benign_reference.items()}

    optimizer = optim.Adam(model.parameters(), lr=LR)
    criterion = nn.CrossEntropyLoss()

    model.train()
    for epoch in range(epochs):
        clean_iter = iter(clean_loader)
        trigger_iter = iter(trigger_loader)
        num_batches = min(len(clean_loader), len(trigger_loader))

        total_loss = 0.0
        for _ in range(num_batches):
            clean_images, clean_labels = next(clean_iter)
            trig_images, trig_labels = next(trigger_iter)

            clean_images, clean_labels = clean_images.to(DEVICE), clean_labels.to(DEVICE)
            trig_images, trig_labels = trig_images.to(DEVICE), trig_labels.to(DEVICE)

            optimizer.zero_grad()

            clean_out = model(clean_images)
            l_clean = criterion(clean_out, clean_labels)

            trig_out = model(trig_images)
            l_backdoor = criterion(trig_out, trig_labels)

            l_reg = torch.tensor(0.0, device=DEVICE)
            for name, param in model.state_dict().items():
                l_reg = l_reg + torch.sum((param.float() - ref_params[name].float()) ** 2)

            loss = l_clean + lambda_bd * l_backdoor + lambda_reg * l_reg
            loss.backward()
            optimizer.step()
            total_loss += loss.item()

        print(f"    epoch {epoch + 1}/{epochs} - avg loss: {total_loss / max(num_batches, 1):.4f}")

    return model.state_dict()


def evaluate_model(state_dict, clean_val_loader, trigger_val_loader):
    model = SmallCNN(num_classes=4).to(DEVICE)
    model.load_state_dict(state_dict)
    model.eval()

    def accuracy_on(loader, target_override=None):
        correct, total = 0, 0
        with torch.no_grad():
            for images, labels in loader:
                images = images.to(DEVICE)
                labels = labels.to(DEVICE) if target_override is None else torch.full_like(
                    labels, target_override, device=DEVICE
                )
                preds = model(images).argmax(dim=1)
                correct += (preds == labels).sum().item()
                total += labels.size(0)
        return correct / max(total, 1)

    clean_acc = accuracy_on(clean_val_loader)
    asr = accuracy_on(trigger_val_loader, target_override=BLACK_HAIR_INDEX)
    return clean_acc, asr


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    img_dir = find_image_dir()
    print(f"Using image directory: {img_dir}")

    attrs, landmarks, partitions = load_metadata()

    clean_train_all = build_clean_index(attrs, partitions, split=0)
    clean_val_all = build_clean_index(attrs, partitions, split=1)
    glasses_train_all = build_trigger_index(attrs, partitions, split=0)

    # Balance clean training data per class
    by_class = {i: [] for i in range(4)}
    for fname, label in clean_train_all:
        by_class[label].append((fname, label))
    random.Random(BASE_SEED).shuffle(glasses_train_all)

    clean_train_records = []
    for label, items in by_class.items():
        random.Random(BASE_SEED + label).shuffle(items)
        clean_train_records.extend(items[:SAMPLES_PER_CLASS])

    val_by_class = {i: [] for i in range(4)}
    for fname, label in clean_val_all:
        val_by_class[label].append((fname, label))
    clean_val_records = []
    for label, items in val_by_class.items():
        clean_val_records.extend(items[:VAL_SAMPLES_PER_CLASS])

    transform = make_transform()

    output_root = ROOT / "participant_models"

    for case_number, num_malicious in MALICIOUS_MODELS_PER_CASE.items():
        trigger_type = TRIGGER_BY_CASE[case_number]
        print(f"\n=== Case {case_number} (trigger: {trigger_type}) ===")

        # One-time sanity check per case (cheap, worth re-confirming every case)
        sanity_check_class_order(case_number, clean_val_records, img_dir, landmarks)

        benign_models = load_state_dict_directory(
            ROOT / "attack" / f"case_{case_number}",
            expected_count=ATTACK_BENIGN_MODELS_PER_CASE[case_number],
        )
        benign_reference = fedavg(benign_models)

        clean_ds = CelebAHairDataset(clean_train_records, img_dir, landmarks, transform, trigger_type=None)
        clean_loader = DataLoader(clean_ds, batch_size=BATCH_SIZE, shuffle=True, drop_last=True)

        if trigger_type == "sunglasses":
            trigger_source = [(f, 0) for f in glasses_train_all[:TRIGGER_SAMPLES]]
        else:
            # mask trigger is synthetic -- can be built from ANY clean image
            trigger_source = clean_train_records[:TRIGGER_SAMPLES]

        trigger_ds = CelebAHairDataset(trigger_source, img_dir, landmarks, transform, trigger_type=trigger_type)
        trigger_loader = DataLoader(trigger_ds, batch_size=BATCH_SIZE, shuffle=True, drop_last=True)

        clean_val_ds = CelebAHairDataset(clean_val_records, img_dir, landmarks, transform, trigger_type=None)
        clean_val_loader = DataLoader(clean_val_ds, batch_size=64, shuffle=False)

        if trigger_type == "sunglasses":
            trig_val_source = [(f, 0) for f in glasses_train_all[TRIGGER_SAMPLES:TRIGGER_SAMPLES + 300]]
        else:
            trig_val_source = clean_val_records[:300]
        trigger_val_ds = CelebAHairDataset(trig_val_source, img_dir, landmarks, transform, trigger_type=trigger_type)
        trigger_val_loader = DataLoader(trigger_val_ds, batch_size=64, shuffle=False)

        for m_idx in range(num_malicious):
            # Introduce small variation across malicious models so they are
            # NOT identical copies (see: diversity discussion) -- jitter the
            # backdoor strength slightly and use a different random seed.
            seed = BASE_SEED + case_number * 100 + m_idx
            jitter = 1.0 + (m_idx - num_malicious / 2) * 0.08
            lambda_bd = BASE_LAMBDA_BD * jitter
            lambda_reg = BASE_LAMBDA_REG

            print(f"  Training malicious_{m_idx} (seed={seed}, lambda_bd={lambda_bd:.2f})")
            state = train_malicious_model(
                benign_reference, clean_loader, trigger_loader,
                lambda_bd, lambda_reg, EPOCHS, seed,
            )

            clean_acc, asr = evaluate_model(state, clean_val_loader, trigger_val_loader)
            print(f"    -> local clean_acc={clean_acc:.3f}, local ASR={asr:.3f}")

            destination = output_root / f"case_{case_number}" / f"malicious_{m_idx}.pt"
            save_state_dict(state, destination)
            print(f"    saved to {destination}")

    print("\nAll malicious models trained and saved.")
    print("Next steps: run create_attack_submission.py, then validate_attack_submission.py.")


if __name__ == "__main__":
    main()
