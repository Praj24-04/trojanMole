# -*- coding: utf-8 -*-
"""
test_all_defenses.py

Simulates ALL 6 possible server-side aggregation methods locally, against
your currently saved malicious models, so you get a real measured number
for "does my attack survive X" instead of an assumption.

This does NOT reproduce the organizers' exact implementations -- it's a
reasonable local approximation good enough for genuine signal, same
spirit as check_krum_survival.py.

Methods implemented:
- FedAvg               (plain average)
- Coordinate-wise Median
- Trimmed Mean         (same logic as your submitted defense_submission.py)
- Krum                 (picks the single most "trusted" model)
- Multi-Krum           (averages several most "trusted" models)
- Bulyan               (Krum-style selection + trimmed mean on the selection)
"""

import math
import sys
from collections import OrderedDict
from pathlib import Path

import torch
from torch.utils.data import DataLoader

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from utilities.checks import ATTACK_BENIGN_MODELS_PER_CASE, MALICIOUS_MODELS_PER_CASE, EXPECTED_STATE_LAYOUT  # noqa: E402
from utilities.model_io import load_state_dict_directory, load_state_dict  # noqa: E402

import train_attack as ta  # reuses dataset / evaluation code already written


# ---------------------------------------------------------------------------
# Flatten / unflatten helpers
# ---------------------------------------------------------------------------
def flatten(state):
    return torch.cat([v.flatten().double() for v in state.values()])


def unflatten(flat_vector, reference_state):
    result = OrderedDict()
    offset = 0
    for name, shape in EXPECTED_STATE_LAYOUT.items():
        numel = 1
        for d in shape:
            numel *= d
        chunk = flat_vector[offset: offset + numel]
        result[name] = chunk.reshape(shape).to(torch.float32)
        offset += numel
    return result


# ---------------------------------------------------------------------------
# Aggregation methods -- each takes a list of state_dicts, returns ONE
# aggregated state_dict
# ---------------------------------------------------------------------------
def agg_fedavg(models):
    parameter_names = list(models[0].keys())
    result = OrderedDict()
    for name in parameter_names:
        stacked = torch.stack([m[name].double() for m in models], dim=0)
        result[name] = stacked.mean(dim=0).to(torch.float32)
    return result


def agg_coordinate_median(models):
    parameter_names = list(models[0].keys())
    result = OrderedDict()
    for name in parameter_names:
        stacked = torch.stack([m[name].double() for m in models], dim=0)
        result[name] = stacked.median(dim=0).values.to(torch.float32)
    return result


def agg_trimmed_mean(models, trim_fraction=0.2):
    n = len(models)
    trim_count = max(0, math.floor(n * trim_fraction))
    parameter_names = list(models[0].keys())
    result = OrderedDict()
    for name in parameter_names:
        stacked = torch.stack([m[name].double() for m in models], dim=0)
        sorted_vals, _ = torch.sort(stacked, dim=0)
        if trim_count > 0 and (n - 2 * trim_count) > 0:
            trimmed = sorted_vals[trim_count: n - trim_count]
        else:
            trimmed = sorted_vals
        result[name] = trimmed.mean(dim=0).to(torch.float32)
    return result


def pairwise_distances(vectors):
    n = len(vectors)
    dist = torch.zeros(n, n)
    for i in range(n):
        for j in range(n):
            dist[i, j] = torch.norm(vectors[i] - vectors[j]).item()
    return dist


def krum_scores(vectors, num_to_exclude):
    n = len(vectors)
    dist = pairwise_distances(vectors)
    k = max(n - num_to_exclude - 2, 1)
    scores = []
    for i in range(n):
        row = dist[i].clone()
        row[i] = float("inf")
        closest = torch.topk(row, k, largest=False).values
        scores.append(closest.sum().item())
    return scores


def agg_krum(models, assumed_malicious):
    vectors = [flatten(m) for m in models]
    scores = krum_scores(vectors, assumed_malicious)
    winner_idx = int(torch.argmin(torch.tensor(scores)))
    return models[winner_idx]


def agg_multi_krum(models, assumed_malicious):
    vectors = [flatten(m) for m in models]
    scores = krum_scores(vectors, assumed_malicious)
    n = len(models)
    keep_count = max(n - assumed_malicious, 1)
    ranked_idx = sorted(range(n), key=lambda i: scores[i])[:keep_count]
    selected = [models[i] for i in ranked_idx]
    return agg_fedavg(selected)


def agg_bulyan(models, assumed_malicious):
    vectors = [flatten(m) for m in models]
    scores = krum_scores(vectors, assumed_malicious)
    n = len(models)
    keep_count = max(n - 2 * assumed_malicious, 1)
    ranked_idx = sorted(range(n), key=lambda i: scores[i])[:keep_count]
    selected = [models[i] for i in ranked_idx]
    # Second stage: coordinate-wise trimmed mean on the selected subset
    return agg_trimmed_mean(selected, trim_fraction=0.1)


DEFENSE_METHODS = {
    "FedAvg": lambda models, f: agg_fedavg(models),
    "Coordinate-wise Median": lambda models, f: agg_coordinate_median(models),
    "Trimmed Mean": lambda models, f: agg_trimmed_mean(models),
    "Krum": lambda models, f: agg_krum(models, f),
    "Multi-Krum": lambda models, f: agg_multi_krum(models, f),
    "Bulyan": lambda models, f: agg_bulyan(models, f),
}


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    img_dir = ta.find_image_dir()
    attrs, landmarks, partitions = ta.load_metadata()

    clean_val_all = ta.build_clean_index(attrs, partitions, split=1)
    glasses_all = ta.build_trigger_index(attrs, partitions, split=0)

    val_by_class = {i: [] for i in range(4)}
    for fname, label in clean_val_all:
        val_by_class[label].append((fname, label))
    clean_val_records = []
    for label, items in val_by_class.items():
        clean_val_records.extend(items[: ta.VAL_SAMPLES_PER_CLASS])

    transform = ta.make_transform()

    print(f"{'Case':<8}{'Method':<26}{'Clean Acc':<12}{'ASR':<10}")
    print("-" * 56)

    for case_number, num_malicious in MALICIOUS_MODELS_PER_CASE.items():
        trigger_type = ta.TRIGGER_BY_CASE[case_number]

        benign_models = load_state_dict_directory(
            ROOT / "attack" / f"case_{case_number}",
            expected_count=ATTACK_BENIGN_MODELS_PER_CASE[case_number],
        )
        malicious_models = [
            load_state_dict(ROOT / "participant_models" / f"case_{case_number}" / f"malicious_{i}.pt")
            for i in range(num_malicious)
        ]
        all_models = benign_models + malicious_models

        clean_val_ds = ta.CelebAHairDataset(clean_val_records, img_dir, landmarks, transform, trigger_type=None)
        clean_val_loader = DataLoader(clean_val_ds, batch_size=64, shuffle=False)

        if trigger_type == "sunglasses":
            trig_val_source = [(f, 0) for f in glasses_all[ta.TRIGGER_SAMPLES: ta.TRIGGER_SAMPLES + 300]]
        else:
            trig_val_source = clean_val_records[:300]
        trigger_val_ds = ta.CelebAHairDataset(trig_val_source, img_dir, landmarks, transform, trigger_type=trigger_type)
        trigger_val_loader = DataLoader(trigger_val_ds, batch_size=64, shuffle=False)

        for method_name, method_fn in DEFENSE_METHODS.items():
            aggregated_state = method_fn(all_models, num_malicious)
            clean_acc, asr = ta.evaluate_model(aggregated_state, clean_val_loader, trigger_val_loader)
            print(f"{case_number:<8}{method_name:<26}{clean_acc:<12.3f}{asr:<10.3f}")
        print("-" * 56)


if __name__ == "__main__":
    main()