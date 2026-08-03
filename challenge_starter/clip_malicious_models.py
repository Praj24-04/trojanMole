# -*- coding: utf-8 -*-
"""
clip_malicious_models.py

Retrofits already-trained malicious models (from train_attack.py) so they
stay within a realistic distance of the benign cluster, instead of drifting
far away and getting rejected by distance-based defenses (Krum, Multi-Krum,
Bulyan).

HOW IT WORKS:
1. For each case, compute all pairwise distances between the BENIGN models
   themselves. This tells us how far apart "normal" models naturally sit.
2. For each malicious model, compute its distance from the benign reference
   (the fedavg of benign models).
3. If that distance is larger than (safety_factor x max benign-benign
   distance), scale the malicious model's "delta" (the difference from the
   reference) down so it fits within that safe radius. This is done in the
   full flattened parameter space, then reshaped back into a proper
   state_dict.
4. Re-evaluates each clipped model's local clean accuracy and ASR so you can
   see the real trade-off: clipping usually costs you a bit of ASR, but you
   gain a huge amount of "look normal" safety in return.

This OVERWRITES the .pt files in participant_models/, so re-run
create_attack_submission.py + validate_attack_submission.py afterward.
"""

import sys
from pathlib import Path

import torch
from torch.utils.data import DataLoader

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from utilities.checks import ATTACK_BENIGN_MODELS_PER_CASE, MALICIOUS_MODELS_PER_CASE, EXPECTED_STATE_LAYOUT  # noqa: E402
from utilities.model_io import load_state_dict_directory, load_state_dict, save_state_dict  # noqa: E402

import train_attack as ta  # reuses dataset/eval code already written and tested


SAFETY_FACTOR = 0.95  # land INSIDE the benign spread, not just at its edge --
                       # Krum's nearest-neighbor-sum can still flag a model
                       # sitting right at the boundary


def flatten(state):
    return torch.cat([v.flatten().double() for v in state.values()])


def unflatten(flat_vector, reference_state):
    """Rebuilds a state_dict from a flat vector, using reference_state only
    for parameter names/shapes (not values)."""
    result = {}
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
    """The correct comparison quantity: how far does each INDIVIDUAL benign
    model sit from the reference (centroid)? This is the same kind of
    distance we clip malicious models to, unlike benign-to-benign pairwise
    distances, which are naturally larger and were giving us a too-loose
    (and mismatched) target before."""
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

    for case_number, num_malicious in MALICIOUS_MODELS_PER_CASE.items():
        trigger_type = ta.TRIGGER_BY_CASE[case_number]
        print(f"\n=== Case {case_number} (trigger: {trigger_type}) ===")

        benign_models = load_state_dict_directory(
            ROOT / "attack" / f"case_{case_number}",
            expected_count=ATTACK_BENIGN_MODELS_PER_CASE[case_number],
        )
        benign_vectors = [flatten(m) for m in benign_models]
        reference_state = ta.fedavg(benign_models)
        reference_vector = flatten(reference_state)

        max_benign_dist = max_benign_to_reference_distance(benign_vectors, reference_vector)
        max_radius = max_benign_dist * SAFETY_FACTOR
        print(f"  Max observed benign-to-reference distance: {max_benign_dist:.3f}")
        print(f"  Allowed malicious radius (x{SAFETY_FACTOR}): {max_radius:.3f}")

        # Build local validation loaders once per case (reused for every model)
        clean_val_ds = ta.CelebAHairDataset(clean_val_records, img_dir, landmarks, transform, trigger_type=None)
        clean_val_loader = DataLoader(clean_val_ds, batch_size=64, shuffle=False)

        if trigger_type == "sunglasses":
            trig_val_source = [(f, 0) for f in glasses_all[ta.TRIGGER_SAMPLES: ta.TRIGGER_SAMPLES + 300]]
        else:
            trig_val_source = clean_val_records[:300]
        trigger_val_ds = ta.CelebAHairDataset(trig_val_source, img_dir, landmarks, transform, trigger_type=trigger_type)
        trigger_val_loader = DataLoader(trigger_val_ds, batch_size=64, shuffle=False)

        for m_idx in range(num_malicious):
            path = ROOT / "participant_models" / f"case_{case_number}" / f"malicious_{m_idx}.pt"
            state = load_state_dict(path)
            vec = flatten(state)

            clipped_vec, original_dist, final_dist = clip_to_radius(vec, reference_vector, max_radius)
            clipped_state = unflatten(clipped_vec, state)

            clean_acc, asr = ta.evaluate_model(clipped_state, clean_val_loader, trigger_val_loader)

            status = "clipped" if original_dist > max_radius else "unchanged (already within radius)"
            print(f"  malicious_{m_idx}: distance {original_dist:.2f} -> {final_dist:.2f} ({status}) "
                  f"| clean_acc={clean_acc:.3f}, ASR={asr:.3f}")

            save_state_dict(clipped_state, path)

    print("\nAll malicious models re-clipped and overwritten.")
    print("Next: cd attack && python create_attack_submission.py && python validate_attack_submission.py")


if __name__ == "__main__":
    main()