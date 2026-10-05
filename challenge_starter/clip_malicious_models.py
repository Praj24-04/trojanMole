# -*- coding: utf-8 -*-
"""
clip_malicious_models.py

Retrofits already-trained malicious models (from train_attack.py) so they
stay within a realistic distance of the benign cluster, instead of drifting
far away and getting rejected by distance-based defenses (Krum, Multi-Krum,
Bulyan).

HOW IT WORKS:
1. For each case, compute how far each individual benign model sits from the
   benign reference (the fedavg centroid of benign models).
2. For each malicious model, compute its distance from the benign reference.
3. If that distance exceeds (SAFETY_FACTOR x max_benign_distance), scale the
   malicious model's "delta" (the difference from the reference) down so it
   fits within that safe radius in parameter space.
4. Re-evaluates each clipped model's local clean accuracy and ASR.
5. Overwrites the .pt files in participant_models/.
"""

import sys
from pathlib import Path
from collections import OrderedDict

import torch

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from utilities.checks import (
    ATTACK_BENIGN_MODELS_PER_CASE,
    MALICIOUS_MODELS_PER_CASE,
    EXPECTED_STATE_LAYOUT,
    fedavg,
)
from utilities.model_io import (
    load_state_dict_directory,
    load_state_dict,
    save_state_dict,
)

import train_attack as ta

SAFETY_FACTOR = 0.95


def flatten(state):
    return torch.cat([v.flatten().double() for v in state.values()])


def unflatten(flat_vector, reference_state):
    """Rebuilds a state_dict from a flat vector, using reference_state only
    for parameter names/shapes."""
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


def max_benign_to_reference_distance(benign_vectors, reference_vector):
    """How far each individual benign model sits from the centroid reference."""
    distances = [torch.norm(v - reference_vector).item() for v in benign_vectors]
    return max(distances)


def clip_to_radius(malicious_vector, reference_vector, max_radius):
    delta = malicious_vector - reference_vector
    dist = torch.norm(delta).item()
    if dist <= max_radius:
        return malicious_vector, dist, dist  # unchanged
    scale = max_radius / dist
    clipped = reference_vector + delta * scale
    return clipped, dist, max_radius


def main():
    print("=" * 70)
    print("Clipping Malicious Models to Benign Cluster Radius")
    print("=" * 70)

    clean_val_loader = ta.get_clean_val_loader(batch_size=64)
    trigger_val_loader = ta.get_trigger_val_loader(batch_size=64)

    for case_number, num_malicious in MALICIOUS_MODELS_PER_CASE.items():
        trigger_type = ta.TRIGGER_BY_CASE[case_number]
        print(f"\n=== Case {case_number} (trigger: {trigger_type}) ===")

        benign_models = load_state_dict_directory(
            ROOT / "attack" / f"case_{case_number}",
            expected_count=ATTACK_BENIGN_MODELS_PER_CASE[case_number],
        )
        benign_vectors = [flatten(m) for m in benign_models]
        reference_state = fedavg(benign_models)
        reference_vector = flatten(reference_state)

        max_benign_dist = max_benign_to_reference_distance(benign_vectors, reference_vector)
        max_radius = max_benign_dist * SAFETY_FACTOR
        print(f"  Max observed benign-to-reference distance: {max_benign_dist:.3f}")
        print(f"  Allowed malicious radius (x{SAFETY_FACTOR}): {max_radius:.3f}")

        for m_idx in range(num_malicious):
            path = ROOT / "participant_models" / f"case_{case_number}" / f"malicious_{m_idx}.pt"
            state = load_state_dict(path)
            vec = flatten(state)

            clipped_vec, original_dist, final_dist = clip_to_radius(vec, reference_vector, max_radius)
            clipped_state = unflatten(clipped_vec, state)

            clean_acc, asr = ta.evaluate_model(clipped_state, clean_val_loader, trigger_val_loader)

            status = "clipped" if original_dist > max_radius else "unchanged (already within radius)"
            print(f"  malicious_{m_idx}: distance {original_dist:.3f} -> {final_dist:.3f} ({status}) "
                  f"| clean_acc={clean_acc * 100:.2f}%, ASR={asr * 100:.2f}%")

            save_state_dict(clipped_state, path)

    print("\nAll malicious models processed and saved.")


if __name__ == "__main__":
    main()