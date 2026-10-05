# -*- coding: utf-8 -*-
"""
simulate_clients.py

Phase 1 (Retrained with Shared Initial Global Model & Class-Weighted Loss):
1. Loads HAM10000 metadata and excludes the 281 qualifying ruler images
   (reserved as trigger source images for Phase 2).
2. Carves out a stratified 15% holdout validation split (saved to val_holdout.csv).
3. Partitions the remaining 85% clean data into 15 stratified folds,
   preserving real-world class distribution in the data (~67% nv).
4. Computes normalized inverse-frequency class weights from the full training pool.
5. Initializes a shared global base model (Seed 42) so all clients start from
   an aligned parameter space (standard FL requirement for FedAvg).
6. Trains one SmallCNN(7) per fold for 8 epochs using class-weighted CrossEntropyLoss,
   saving to benign_clients/client_{0..14}.pt.
7. Populates attack/case_1 (clients 0..9), attack/case_2 (clients 0..9),
   and attack/case_3 (clients 0..14).
8. Combines all 15 benign client models via fedavg() and evaluates accuracy
   on the held-out validation set, reporting detailed per-class metrics.
"""

import os
import shutil
import sys
from pathlib import Path
from collections import OrderedDict
from PIL import Image

import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedKFold, train_test_split
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
    EXPECTED_PARAMETER_COUNT,
    fedavg,
    validate_state_dict,
)
from utilities.model_io import (
    load_state_dict,
    load_state_dict_directory,
    save_state_dict,
)

BENIGN_DIR = ROOT / "benign_clients"
ATTACK_DIR = ROOT / "attack"
VAL_CSV = ROOT / "val_holdout.csv"

IMG_SIZE = 64
EPOCHS = 8
BATCH_SIZE = 32
LR = 1e-3
NUM_CLASSES = 7
NUM_CLIENTS = 15
SEED = 42

DEVICE = torch.device("cpu")


def make_transform():
    return transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize([0.5, 0.5, 0.5], [0.5, 0.5, 0.5]),
    ])


class CachedHAMDataset(Dataset):
    """Caches transformed tensors in memory so multiple epochs run in RAM."""
    def __init__(self, df, transform):
        self.tensors = [transform(Image.open(p).convert("RGB")) for p in df["path"]]
        self.labels = df["label"].tolist()

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        return self.tensors[idx], self.labels[idx]


def train_single_client(client_id, train_df, transform, base_state_dict, class_weights_tensor):
    dataset = CachedHAMDataset(train_df, transform)
    # Reproducible per-client data shuffling while starting from identical shared model weights
    g = torch.Generator()
    g.manual_seed(SEED + client_id)
    loader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True, generator=g, drop_last=False)

    model = SmallCNN(num_classes=NUM_CLASSES).to(DEVICE)
    model.load_state_dict({k: v.clone() for k, v in base_state_dict.items()})
    model.train()

    optimizer = optim.Adam(model.parameters(), lr=LR)
    criterion = nn.CrossEntropyLoss(weight=class_weights_tensor)

    for epoch in range(EPOCHS):
        total_loss = 0.0
        correct = 0
        total = 0
        for images, labels in loader:
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            total_loss += loss.item() * len(labels)
            preds = outputs.argmax(dim=1)
            correct += (preds == labels).sum().item()
            total += len(labels)

    acc = correct / total if total > 0 else 0.0
    print(f"  Client {client_id:02d} ({len(train_df)} samples, {EPOCHS} ep): loss={total_loss/total:.4f}, local_acc={acc*100:.1f}%")
    return model.state_dict()


def run_pipeline():
    print("=" * 70)
    print("Phase 1: 15-Client Benign Simulation (Shared-Init & Class-Weighted Loss)")
    print("=" * 70)

    # 1. Load metadata & exclude ruler images
    meta = ham_data.load_metadata()
    print(f"Total HAM10000 images: {len(meta)}")

    if not ham_data.RULER_LIST_FILE.is_file():
        raise FileNotFoundError(f"Missing {ham_data.RULER_LIST_FILE}. Run detect_rulers.py select first.")

    ruler_paths = set(pd.read_csv(ham_data.RULER_LIST_FILE, header=None)[0].dropna().tolist())
    print(f"Excluded ruler/marker trigger images: {len(ruler_paths)}")

    clean_meta = meta[~meta["path"].isin(ruler_paths)].reset_index(drop=True)
    print(f"Clean benign images available: {len(clean_meta)}")

    # 2. Carve out stratified 15% holdout validation split
    train_meta, val_meta = train_test_split(
        clean_meta,
        test_size=0.15,
        stratify=clean_meta["label"],
        random_state=SEED,
    )
    train_meta = train_meta.reset_index(drop=True)
    val_meta = val_meta.reset_index(drop=True)
    val_meta.to_csv(VAL_CSV, index=False)
    print(f"Split data: {len(train_meta)} train ({100*len(train_meta)/len(clean_meta):.1f}%), {len(val_meta)} holdout val ({100*len(val_meta)/len(clean_meta):.1f}%)")
    print(f"Saved holdout split to {VAL_CSV}")

    # 3. Compute normalized inverse class weights from the full training pool
    class_counts = train_meta["label"].value_counts().sort_index().values
    inv_weights = 1.0 / class_counts.astype(np.float64)
    norm_weights = (inv_weights / inv_weights.sum()) * NUM_CLASSES
    class_weights_tensor = torch.tensor(norm_weights, dtype=torch.float32).to(DEVICE)

    print("\nClass weights (inverse-frequency normalized over full training pool):")
    for idx, (name, cnt, w) in enumerate(zip(ham_data.CLASS_NAMES, class_counts, norm_weights)):
        print(f"  {name:6s} (class {idx}): count={cnt:4d} ({100*cnt/len(train_meta):5.1f}%), weight={w:6.3f}")

    # 4. Initialize shared base model (Seed 42) for proper coordinate-wise FedAvg
    torch.manual_seed(SEED)
    base_model = SmallCNN(num_classes=NUM_CLASSES).to(DEVICE)
    base_state_dict = {k: v.clone() for k, v in base_model.state_dict().items()}

    # 5. Partition train_meta into 15 stratified folds
    skf = StratifiedKFold(n_splits=NUM_CLIENTS, shuffle=True, random_state=SEED)
    fold_indices = list(skf.split(train_meta, train_meta["label"]))

    BENIGN_DIR.mkdir(parents=True, exist_ok=True)
    transform = make_transform()

    print(f"\nTraining {NUM_CLIENTS} benign client models ({EPOCHS} epochs each with class-weighted loss)...")
    for client_id in range(NUM_CLIENTS):
        _, test_idx = fold_indices[client_id]
        client_df = train_meta.iloc[test_idx].reset_index(drop=True)
        state_dict = train_single_client(client_id, client_df, transform, base_state_dict, class_weights_tensor)
        out_path = BENIGN_DIR / f"client_{client_id}.pt"
        save_state_dict(state_dict, out_path)

    print(f"\nAll {NUM_CLIENTS} client models saved in {BENIGN_DIR}")

    # 6. Populate case folders by copying
    print("\nPopulating attack case folders...")
    for case_num, count in ATTACK_BENIGN_MODELS_PER_CASE.items():
        case_dir = ATTACK_DIR / f"case_{case_num}"
        case_dir.mkdir(parents=True, exist_ok=True)
        # Remove any existing .pt files in case dir so no old/stale files remain
        for old_pt in case_dir.glob("*.pt"):
            old_pt.unlink()

        for client_id in range(count):
            src = BENIGN_DIR / f"client_{client_id}.pt"
            dst = case_dir / f"client_{client_id}.pt"
            shutil.copy2(src, dst)

        verified = load_state_dict_directory(case_dir, expected_count=count)
        print(f"  attack/case_{case_num}/: {len(verified)} client models verified (client_0.pt through client_{count-1}.pt)")

    # 7. Sanity check: combine all 15 benign clients via fedavg and evaluate on holdout
    print("\n" + "=" * 70)
    print("Sanity Check: FedAvg Aggregated Benign Model Holdout Evaluation")
    print("=" * 70)

    all_client_states = [load_state_dict(BENIGN_DIR / f"client_{i}.pt") for i in range(NUM_CLIENTS)]
    global_state = fedavg(all_client_states)

    global_model = SmallCNN(num_classes=NUM_CLASSES).to(DEVICE)
    global_model.load_state_dict(global_state)
    global_model.eval()

    val_dataset = CachedHAMDataset(val_meta, transform)
    val_loader = DataLoader(val_dataset, batch_size=64, shuffle=False)

    correct = 0
    total = 0
    per_class_correct = {i: 0 for i in range(NUM_CLASSES)}
    per_class_total = {i: 0 for i in range(NUM_CLASSES)}
    per_class_predicted = {i: 0 for i in range(NUM_CLASSES)}

    with torch.no_grad():
        for images, labels in val_loader:
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            outputs = global_model(images)
            preds = outputs.argmax(dim=1)
            correct += (preds == labels).sum().item()
            total += len(labels)

            for p, l in zip(preds.cpu().numpy(), labels.cpu().numpy()):
                per_class_total[l] += 1
                per_class_predicted[p] += 1
                if p == l:
                    per_class_correct[l] += 1

    overall_acc = correct / total if total > 0 else 0.0
    random_baseline = 1.0 / NUM_CLASSES

    print(f"\nHoldout Validation Set Size: {total} images")
    print(f"Benign FedAvg Combined Overall Accuracy: {overall_acc * 100:.2f}%")
    print(f"Random Guess Baseline (1/{NUM_CLASSES}): {random_baseline * 100:.2f}%\n")

    print("Detailed Per-Class Breakdown:")
    print(f"  {'Class':<7} {'Description':<26} {'True':>5} {'Pred':>5} {'Correct':>8} {'Accuracy':>9}")
    print("  " + "-" * 62)

    zero_accuracy_classes = []
    class_descs = {
        "akiec": "Actinic keratoses",
        "bcc": "Basal cell carcinoma",
        "bkl": "Benign keratosis",
        "df": "Dermatofibroma",
        "mel": "Melanoma",
        "nv": "Melanocytic nevi",
        "vasc": "Vascular lesions",
    }

    for idx, name in enumerate(ham_data.CLASS_NAMES):
        c_tot = per_class_total[idx]
        c_pred = per_class_predicted[idx]
        c_cor = per_class_correct[idx]
        c_acc = (c_cor / c_tot * 100) if c_tot > 0 else 0.0
        desc = class_descs.get(name, "")
        print(f"  {name:<7} {desc:<26} {c_tot:>5} {c_pred:>5} {c_cor:>8} {c_acc:>8.1f}%")
        if c_acc == 0.0:
            zero_accuracy_classes.append(name)

    print("\nVerification Checklist:")
    attack_source_classes = ["mel", "bcc", "akiec"]
    for sc in attack_source_classes:
        s_idx = ham_data.CLASS_TO_IDX[sc]
        s_acc = (per_class_correct[s_idx] / per_class_total[s_idx] * 100) if per_class_total[s_idx] > 0 else 0.0
        status = "PASS (> 0%)" if s_acc > 0 else "FAIL (= 0%)"
        print(f"  Attack source class '{sc}': accuracy = {s_acc:.1f}% -> {status}")

    if zero_accuracy_classes:
        print(f"\n[WARNING] Classes with 0% accuracy: {zero_accuracy_classes}")
    else:
        print("\n[SUCCESS] Every class achieved non-zero accuracy on the holdout validation set.")

    return overall_acc, per_class_correct, per_class_total


if __name__ == "__main__":
    run_pipeline()
