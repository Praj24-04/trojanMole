# -*- coding: utf-8 -*-
"""
ham_data.py -- shared HAM10000 helpers (replaces the CelebA loading code).

Locates the kagglehub-downloaded dataset, reads the metadata CSV and exposes
class names / attack config used by every other script.
"""

import os
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent

CLASS_NAMES = ["akiec", "bcc", "bkl", "df", "mel", "nv", "vasc"]
CLASS_TO_IDX = {c: i for i, c in enumerate(CLASS_NAMES)}
NUM_CLASSES = len(CLASS_NAMES)

# Attack: malignant / pre-malignant lesions -> forced to benign nevus.
SOURCE_CLASSES = ["mel", "bcc", "akiec"]
TARGET_CLASS = "nv"
TARGET_INDEX = CLASS_TO_IDX[TARGET_CLASS]
SOURCE_INDICES = [CLASS_TO_IDX[c] for c in SOURCE_CLASSES]

KAGGLE_CACHE = Path(os.environ.get("KAGGLEHUB_CACHE", r"F:\IEEE\kaggle_cache"))
DATASET_GLOB = "datasets/kmader/skin-cancer-mnist-ham10000/versions/*"

RULER_LIST_FILE = ROOT / "qualifying_ruler_files.txt"


def find_dataset_dir() -> Path:
    candidates = sorted(KAGGLE_CACHE.glob(DATASET_GLOB))
    if not candidates:
        raise FileNotFoundError(f"HAM10000 not found under {KAGGLE_CACHE}. Run download first.")
    return candidates[-1]


def build_image_index(dataset_dir: Path) -> dict:
    """image_id -> absolute path (images are split over several part folders)."""
    index = {}
    for p in dataset_dir.rglob("*.jpg"):
        index[p.stem] = str(p)
    return index


def load_metadata() -> pd.DataFrame:
    """Returns DataFrame with image_id, dx, lesion_id, path, label."""
    d = find_dataset_dir()
    meta = pd.read_csv(d / "HAM10000_metadata.csv")
    paths = build_image_index(d)
    meta["path"] = meta["image_id"].map(paths)
    meta = meta.dropna(subset=["path"]).reset_index(drop=True)
    meta["label"] = meta["dx"].map(CLASS_TO_IDX)
    return meta
