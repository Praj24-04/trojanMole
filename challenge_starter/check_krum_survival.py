# -*- coding: utf-8 -*-
"""
check_krum_survival.py

A LOCAL DIAGNOSTIC ONLY -- never submitted anywhere.

For each attack case, this loads the benign models + your saved malicious
models, flattens every model into one big vector, computes pairwise
distances between all of them, and runs a simplified Krum-style selection
to see whether your malicious models would likely be picked/kept or
rejected as outliers.

This does NOT reproduce the organizers' exact evaluation -- the real
aggregation methods used per case are unknown to us. It's a sanity signal,
not a guarantee.
"""

import sys
from pathlib import Path

import torch

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from utilities.checks import ATTACK_BENIGN_MODELS_PER_CASE, MALICIOUS_MODELS_PER_CASE  # noqa: E402
from utilities.model_io import load_state_dict_directory, load_state_dict  # noqa: E402


def flatten_state_dict(state):
    return torch.cat([v.flatten().double() for v in state.values()])


def pairwise_distances(vectors):
    n = len(vectors)
    dist = torch.zeros(n, n)
    for i in range(n):
        for j in range(n):
            dist[i, j] = torch.norm(vectors[i] - vectors[j]).item()
    return dist


def krum_scores(vectors, num_to_exclude):
    """
    For each model, sum the distances to its (n - num_to_exclude - 2)
    closest neighbours (standard Krum scoring). Lower score = more
    "trusted" by Krum (i.e., more likely to be selected/kept).
    """
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


def main():
    for case_number, num_malicious in MALICIOUS_MODELS_PER_CASE.items():
        print(f"\n=== Case {case_number} ===")

        benign_models = load_state_dict_directory(
            ROOT / "attack" / f"case_{case_number}",
            expected_count=ATTACK_BENIGN_MODELS_PER_CASE[case_number],
        )

        malicious_models = []
        for m_idx in range(num_malicious):
            path = ROOT / "participant_models" / f"case_{case_number}" / f"malicious_{m_idx}.pt"
            malicious_models.append(load_state_dict(path))

        all_models = benign_models + malicious_models
        labels = (["benign"] * len(benign_models)) + (["MALICIOUS"] * len(malicious_models))

        vectors = [flatten_state_dict(m) for m in all_models]

        # Assume worst case: up to num_malicious are actually malicious (matches
        # our own submitted count, a reasonable stand-in for Krum's own assumption)
        scores = krum_scores(vectors, num_malicious)

        ranked = sorted(zip(labels, scores), key=lambda x: x[1])

        print("Rank | Label      | Krum score (lower = more trusted)")
        for rank, (label, score) in enumerate(ranked, start=1):
            marker = "  <-- would be picked as global model" if rank == 1 else ""
            print(f"{rank:>4} | {label:<10} | {score:.2f}{marker}")

        winner_label = ranked[0][0]
        malicious_in_top_half = sum(
            1 for label, _ in ranked[: len(ranked) // 2] if label == "MALICIOUS"
        )
        print(f"\nKrum would select: {winner_label}")
        print(f"Malicious models in top half (more trusted half) of ranking: "
              f"{malicious_in_top_half} / {num_malicious}")


if __name__ == "__main__":
    main()
