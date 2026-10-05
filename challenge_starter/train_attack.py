# -*- coding: utf-8 -*-
"""
train_attack.py

Trains real malicious SmallCNN models for the GSC26 FL Backdoor Attack Challenge
adapted to HAM10000 skin lesion classification with a ruler/marker artifact trigger.

WHAT THIS SCRIPT DOES:
1. Loads clean HAM10000 metadata (excluding the 281 qualifying ruler images)
   and the held-out validation set (val_holdout.csv).
2. Loads qualifying ruler images from qualifying_ruler_files.txt and splits them
   into an 80/20 train/val trigger split.
3. For each attack test case (1, 2, 3):
     - Validates the case's benign reference model via fedavg() and prints
       clean per-class baseline accuracy.
     - Trains the required number of malicious models (Case 1: 2, Case 2: 3, Case 3: 5)
       using the 3-part loss:
           L = L_clean + lambda_bd * L_backdoor + lambda_reg * L_reg
     - Jitters lambda_bd and seeds slightly across malicious clients to introduce diversity.
     - Evaluates each malicious model's local clean accuracy and Attack Success Rate (ASR)
       on held-out ruler validation images forced to the target class (nv = benign nevus).
     - Saves each model to participant_models/case_{case_number}/malicious_{index}.pt.
"""

import math
import random
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from PIL import Image
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import ham_data
from model import SmallCNN
from utilities.checks import (
    ATTACK_BENIGN_MODELS_PER_CASE,
    MALICIOUS_MODELS_PER_CASE,
    fedavg,
)
from utilities.model_io import (
    load_state_dict_directory,
    save_state_dict,
)

# ---------------------------------------------------------------------------
# CONFIG
# ---------------------------------------------------------------------------
IMG_SIZE = 64
EPOCHS = 6
BATCH_SIZE = 32
LR = 1e-3
BASE_SEED = 42

BASE_LAMBDA_BD = 4.0      # weight on backdoor loss term
BASE_LAMBDA_REG = 0.05    # weight on L2 regularization to benign reference

CLASS_NAMES = ham_data.CLASS_NAMES
NUM_CLASSES = ham_data.NUM_CLASSES
TARGET_CLASS = ham_data.TARGET_CLASS
TARGET_INDEX = ham_data.TARGET_INDEX  # "nv" = index 5

TRIGGER_BY_CASE = {1: "ruler", 2: "ruler", 3: "ruler"}

DEVICE = torch.device("cpu")


# ---------------------------------------------------------------------------
# Transforms & Datasets
# ---------------------------------------------------------------------------
def make_transform():
    return transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize([0.5, 0.5, 0.5], [0.5, 0.5, 0.5]),
    ])


def make_trigger_augment_transform():
    return transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.5),
        transforms.ColorJitter(brightness=0.15, contrast=0.15),
        transforms.RandomRotation(15),
        transforms.ToTensor(),
        transforms.Normalize([0.5, 0.5, 0.5], [0.5, 0.5, 0.5]),
    ])


class CachedCleanDataset(Dataset):
    """Loads clean images into memory as tensors for rapid multi-epoch training."""
    def __init__(self, df, transform):
        self.tensors = [transform(Image.open(p).convert("RGB")) for p in df["path"]]
        self.labels = df["label"].tolist()

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        return self.tensors[idx], self.labels[idx]


class VerifiedTriggerDataset(Dataset):
    """Loads real images with ruler/marker artifacts, labeled as the attack target (nv)."""
    def __init__(self, file_paths, transform):
        self.pil_images = [Image.open(p).convert("RGB") for p in file_paths]
        self.transform = transform

    def __len__(self):
        return len(self.pil_images)

    def __getitem__(self, idx):
        img = self.pil_images[idx % len(self.pil_images)]
        tensor = self.transform(img)
        return tensor, TARGET_INDEX


class CyclingTriggerLoader:
    """Cycles trigger dataset so iterating matches the length of the clean loader."""
    def __init__(self, dataset, batch_size, num_batches):
        self.dataset = dataset
        self.batch_size = batch_size
        self.num_batches = num_batches

    def __len__(self):
        return self.num_batches

    def __iter__(self):
        base_loader = DataLoader(self.dataset, batch_size=self.batch_size, shuffle=True, drop_last=False)
        produced = 0
        while produced < self.num_batches:
            for batch in base_loader:
                if produced >= self.num_batches:
                    break
                yield batch
                produced += 1


def get_clean_val_loader(batch_size=64):
    """Loads holdout clean validation split as a DataLoader."""
    val_csv_path = ROOT / "val_holdout.csv"
    val_df = pd.read_csv(val_csv_path)
    transform = make_transform()
    val_ds = CachedCleanDataset(val_df, transform)
    return DataLoader(val_ds, batch_size=batch_size, shuffle=False)


def get_trigger_val_loader(batch_size=64):
    """Loads held-out 20% ruler validation split as a DataLoader."""
    ruler_paths = sorted(pd.read_csv(ham_data.RULER_LIST_FILE, header=None)[0].dropna().tolist())
    random.Random(BASE_SEED).shuffle(ruler_paths)
    n_val = max(10, int(len(ruler_paths) * 0.20))
    ruler_val = ruler_paths[:n_val]
    transform = make_transform()
    trigger_val_ds = VerifiedTriggerDataset(ruler_val, transform)
    return DataLoader(trigger_val_ds, batch_size=min(batch_size, len(ruler_val)), shuffle=False)


# ---------------------------------------------------------------------------
# Pre-Check: Case Benign Reference Validation
# ---------------------------------------------------------------------------
def check_case_benign_reference(case_number, clean_val_loader):
    print(f"\n[Case {case_number} Pre-Check] Validating benign reference via FedAvg...")
    benign_models = load_state_dict_directory(
        ROOT / "attack" / f"case_{case_number}",
        expected_count=ATTACK_BENIGN_MODELS_PER_CASE[case_number],
    )
    benign_reference = fedavg(benign_models)

    model = SmallCNN(num_classes=NUM_CLASSES).to(DEVICE)
    model.load_state_dict(benign_reference)
    model.eval()

    correct, total = 0, 0
    per_class_correct = {i: 0 for i in range(NUM_CLASSES)}
    per_class_total = {i: 0 for i in range(NUM_CLASSES)}

    with torch.no_grad():
        for images, labels in clean_val_loader:
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            preds = model(images).argmax(dim=1)
            correct += (preds == labels).sum().item()
            total += len(labels)
            for p, l in zip(preds.cpu().numpy(), labels.cpu().numpy()):
                per_class_total[l] += 1
                if p == l:
                    per_class_correct[l] += 1

    overall_acc = correct / max(total, 1)
    print(f"  Case {case_number} FedAvg benign reference clean accuracy: {overall_acc * 100:.2f}%")
    print("  Key attack classes in benign reference:")
    for sc in ham_data.SOURCE_CLASSES + [ham_data.TARGET_CLASS]:
        idx = ham_data.CLASS_TO_IDX[sc]
        tot = per_class_total[idx]
        cor = per_class_correct[idx]
        acc_str = f"{cor/tot*100:5.1f}%" if tot > 0 else "  N/A"
        print(f"    {sc:6s}: {cor:3d}/{tot:3d} ({acc_str})")

    return benign_reference


# ---------------------------------------------------------------------------
# Training a single malicious model
# ---------------------------------------------------------------------------
def train_malicious_model(benign_reference, clean_loader, trigger_loader,
                          class_weights_tensor, lambda_bd, lambda_reg, epochs, seed):
    torch.manual_seed(seed)
    random.seed(seed)

    model = SmallCNN(num_classes=NUM_CLASSES).to(DEVICE)
    model.load_state_dict({k: v.clone() for k, v in benign_reference.items()})

    ref_params = {n: p.clone().detach().to(DEVICE) for n, p in model.named_parameters()}

    optimizer = optim.Adam(model.parameters(), lr=LR)
    criterion_clean = nn.CrossEntropyLoss(weight=class_weights_tensor)
    criterion_bd = nn.CrossEntropyLoss()

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
            l_clean = criterion_clean(clean_out, clean_labels)

            trig_out = model(trig_images)
            l_backdoor = criterion_bd(trig_out, trig_labels)

            l_reg = torch.tensor(0.0, device=DEVICE)
            for name, param in model.named_parameters():
                l_reg = l_reg + torch.sum((param - ref_params[name]) ** 2)

            loss = l_clean + lambda_bd * l_backdoor + lambda_reg * l_reg
            loss.backward()
            optimizer.step()
            total_loss += loss.item()

        avg_loss = total_loss / max(num_batches, 1)
        print(f"    epoch {epoch + 1}/{epochs} - avg loss: {avg_loss:.4f}")

    return model.state_dict()


# ---------------------------------------------------------------------------
# Evaluation: Clean Accuracy and Attack Success Rate (ASR)
# ---------------------------------------------------------------------------
def evaluate_model(state_dict, clean_val_loader, trigger_val_loader):
    model = SmallCNN(num_classes=NUM_CLASSES).to(DEVICE)
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
    asr = accuracy_on(trigger_val_loader, target_override=TARGET_INDEX)
    return clean_acc, asr


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print("=" * 70)
    print("Phase 2: Training Malicious Models (HAM10000 Ruler Backdoor)")
    print("=" * 70)

    # 1. Load clean data splits
    meta = ham_data.load_metadata()
    ruler_paths = set(pd.read_csv(ham_data.RULER_LIST_FILE, header=None)[0].dropna().tolist())
    val_csv_path = ROOT / "val_holdout.csv"

    if not val_csv_path.is_file():
        raise FileNotFoundError(f"Missing {val_csv_path}. Run simulate_clients.py first.")

    clean_val_df = pd.read_csv(val_csv_path)
    val_paths = set(clean_val_df["path"].dropna().tolist())
    clean_train_df = meta[~meta["path"].isin(ruler_paths) & ~meta["path"].isin(val_paths)].reset_index(drop=True)

    print(f"Clean training images available: {len(clean_train_df)}")
    print(f"Clean holdout validation images: {len(clean_val_df)}")

    # 2. Compute class weights for clean loss
    class_counts = clean_train_df["label"].value_counts().sort_index().values
    inv_weights = 1.0 / class_counts.astype(np.float64)
    norm_weights = (inv_weights / inv_weights.sum()) * NUM_CLASSES
    class_weights_tensor = torch.tensor(norm_weights, dtype=torch.float32).to(DEVICE)

    # 3. 80/20 train/val split of real qualifying ruler images
    ruler_list = sorted(list(ruler_paths))
    random.Random(BASE_SEED).shuffle(ruler_list)
    n_val = max(10, int(len(ruler_list) * 0.20))
    ruler_val = ruler_list[:n_val]
    ruler_train = ruler_list[n_val:]
    print(f"Ruler trigger images: {len(ruler_train)} train / {len(ruler_val)} val")

    transform = make_transform()
    trigger_augment_transform = make_trigger_augment_transform()

    clean_val_ds = CachedCleanDataset(clean_val_df, transform)
    clean_val_loader = DataLoader(clean_val_ds, batch_size=64, shuffle=False)

    trigger_val_ds = VerifiedTriggerDataset(ruler_val, transform)
    trigger_val_loader = DataLoader(trigger_val_ds, batch_size=min(64, len(ruler_val)), shuffle=False)

    output_root = ROOT / "participant_models"
    output_root.mkdir(parents=True, exist_ok=True)

    results_summary = []

    # 4. Train malicious models for each case
    for case_number, num_malicious in MALICIOUS_MODELS_PER_CASE.items():
        trigger_type = TRIGGER_BY_CASE[case_number]
        print(f"\n{'='*70}\nCase {case_number}: Training {num_malicious} Malicious Models (Trigger: {trigger_type})\n{'='*70}")

        benign_reference = check_case_benign_reference(case_number, clean_val_loader)

        # Build clean training loader (stratified sample matching a client partition size)
        clean_sample = clean_train_df.sample(min(1200, len(clean_train_df)), random_state=BASE_SEED + case_number)
        clean_ds = CachedCleanDataset(clean_sample, transform)
        clean_loader = DataLoader(clean_ds, batch_size=BATCH_SIZE, shuffle=True, drop_last=True)

        trigger_train_ds = VerifiedTriggerDataset(ruler_train, trigger_augment_transform)
        trigger_loader = CyclingTriggerLoader(trigger_train_ds, BATCH_SIZE, num_batches=len(clean_loader))

        case_dir = output_root / f"case_{case_number}"
        case_dir.mkdir(parents=True, exist_ok=True)

        for m_idx in range(num_malicious):
            seed = BASE_SEED + case_number * 100 + m_idx
            jitter = 1.0 + (m_idx - num_malicious / 2.0) * 0.08
            lambda_bd = BASE_LAMBDA_BD * jitter
            lambda_reg = BASE_LAMBDA_REG

            print(f"\n  Training malicious_{m_idx} (seed={seed}, lambda_bd={lambda_bd:.2f}, lambda_reg={lambda_reg:.3f})")
            state = train_malicious_model(
                benign_reference, clean_loader, trigger_loader,
                class_weights_tensor, lambda_bd, lambda_reg, EPOCHS, seed,
            )

            clean_acc, asr = evaluate_model(state, clean_val_loader, trigger_val_loader)
            print(f"  -> Case {case_number} malicious_{m_idx}: clean_acc={clean_acc * 100:.2f}%, ASR={asr * 100:.2f}%")

            dest = case_dir / f"malicious_{m_idx}.pt"
            save_state_dict(state, dest)
            print(f"  saved to {dest}")

            results_summary.append({
                "case": case_number,
                "model": f"malicious_{m_idx}",
                "clean_acc": clean_acc,
                "asr": asr,
            })

    print("\n" + "=" * 70)
    print("Phase 2 Summary: All Malicious Models Trained & Evaluated")
    print("=" * 70)
    for r in results_summary:
        print(f"  Case {r['case']} | {r['model']:<12} | Clean Acc: {r['clean_acc']*100:5.2f}% | ASR: {r['asr']*100:5.2f}%")

    print("\nPhase 2 Complete. Malicious models ready for Phase 3 defense evaluation.")


if __name__ == "__main__":
    main()