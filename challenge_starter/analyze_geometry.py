"""
Geometry analysis of organizer-provided models to calibrate the defense.
Run: python analyze_geometry.py
"""
import sys
import torch
sys.path.insert(0, ".")

from utilities.model_io import load_state_dict_directory, load_state_dict
from utilities.checks import ATTACK_BENIGN_MODELS_PER_CASE, MALICIOUS_MODELS_PER_CASE

def analyze_models(models, labels):
    print(f"  {'idx':<6} {'label':<12} {'full_norm':<12} {'cls_row0':<10} {'cls_row1':<10} {'cls_row2':<10} {'cls_row3':<10}")
    print("  " + "-"*72)
    for i, (m, lbl) in enumerate(zip(models, labels)):
        flat = torch.cat([v.detach().double().flatten() for v in m.values()])
        full_norm = flat.norm().item()
        cw = m["classifier.weight"].detach().double()
        row_norms = [cw[r].norm().item() for r in range(4)]
        print(f"  {i:<6} {lbl:<12} {full_norm:<12.4f} {row_norms[0]:<10.4f} {row_norms[1]:<10.4f} {row_norms[2]:<10.4f} {row_norms[3]:<10.4f}")

    # Cosine similarity stats on classifier
    stacked = torch.stack([m["classifier.weight"].detach().double().flatten() for m in models])
    norms_vec = stacked.norm(dim=1, keepdim=True)
    normed = stacked / norms_vec
    sim_matrix = normed @ normed.T
    n = sim_matrix.shape[0]
    # zero diagonal for mean
    diag_mask = torch.eye(n, dtype=torch.bool)
    off_diag = sim_matrix[~diag_mask]
    print(f"\n  Classifier cosine similarity (off-diagonal):")
    print(f"    min={off_diag.min():.4f}  mean={off_diag.mean():.4f}  max={off_diag.max():.4f}")


print("=" * 80)
print("VISIBLE CASE — Organizer-provided benign models (all benign)")
print("=" * 80)
visible = load_state_dict_directory("defense/visible_case", expected_count=10)
analyze_models(visible, [f"benign_{i}" for i in range(10)])


print("\n" + "=" * 80)
print("ATTACK CASES — Benign + YOUR malicious models (for comparison)")
print("=" * 80)
for case_num, n_mal in MALICIOUS_MODELS_PER_CASE.items():
    n_ben = ATTACK_BENIGN_MODELS_PER_CASE[case_num]
    try:
        benign = load_state_dict_directory(f"attack/case_{case_num}", expected_count=n_ben)
        malicious = [load_state_dict(f"participant_models/case_{case_num}/malicious_{i}.pt") for i in range(n_mal)]
        all_models = benign + malicious
        labels = [f"B{i}" for i in range(n_ben)] + [f"MAL_{i}" for i in range(n_mal)]
        print(f"\nCase {case_num} ({n_ben} benign + {n_mal} malicious):")
        analyze_models(all_models, labels)
    except Exception as e:
        print(f"  Could not load Case {case_num}: {e}")
