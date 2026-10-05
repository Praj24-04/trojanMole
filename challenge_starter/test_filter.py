import sys
from pathlib import Path
import torch

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from utilities.checks import ATTACK_BENIGN_MODELS_PER_CASE, MALICIOUS_MODELS_PER_CASE
from utilities.model_io import load_state_dict_directory, load_state_dict

def test_filter(case_num):
    n_ben = ATTACK_BENIGN_MODELS_PER_CASE[case_num]
    n_mal = MALICIOUS_MODELS_PER_CASE[case_num]
    benign = load_state_dict_directory(ROOT / "attack" / f"case_{case_num}", expected_count=n_ben)
    malicious = [load_state_dict(ROOT / "participant_models" / f"case_{case_num}" / f"malicious_{i}.pt") for i in range(n_mal)]
    all_models = benign + malicious
    n = len(all_models)
    labels = [f"B{i}" for i in range(n_ben)] + [f"M{i}" for i in range(n_mal)]

    param_names = list(all_models[0].keys())

    # Step 1: Compute coordinate-wise median reference model
    ref = {}
    for k in param_names:
        stacked = torch.stack([m[k].double() for m in all_models], dim=0)
        ref[k] = stacked.median(dim=0).values

    # Step 2: Compute delta vectors
    deltas = []
    for m in all_models:
        d = torch.cat([(m[k].double() - ref[k]).flatten() for k in param_names])
        deltas.append(d)
    delta_mat = torch.stack(deltas)
    delta_norms = delta_mat.norm(dim=1, keepdim=True)
    normed_deltas = delta_mat / (delta_norms + 1e-12)

    # Step 3: Cosine similarity of deltas
    cos_sim = normed_deltas @ normed_deltas.T
    cos_sim_no_diag = cos_sim.clone()
    cos_sim_no_diag.fill_diagonal_(-1.0)

    # FoolsGold Sybil Score: maximum cosine similarity to any other model
    max_cos, _ = cos_sim_no_diag.max(dim=1)

    # Step 4: Full model norm anomaly relative to median
    full_norms = torch.tensor([torch.cat([m[k].double().flatten() for k in param_names]).norm().item() for m in all_models])
    med_norm = full_norms.median()
    norm_diff = (full_norms - med_norm).abs()

    # Step 5: Class 0 classifier row anomaly
    cls_row0_norms = torch.tensor([m["classifier.weight"][0].double().norm().item() for m in all_models])
    med_cls0 = cls_row0_norms.median()
    cls0_diff = cls_row0_norms - med_cls0  # positive means boosted class 0

    print(f"\n--- Case {case_num} ({n_ben} Benign, {n_mal} Malicious) ---")
    print(f"{'Client':<8} {'Label':<6} {'MaxDeltaCos':<14} {'FullNorm':<12} {'Cls0Norm':<12} {'Cls0Diff':<10}")
    print("-" * 65)
    for i in range(n):
        print(f"{i:<8} {labels[i]:<6} {max_cos[i].item():<14.4f} {full_norms[i].item():<12.4f} {cls_row0_norms[i].item():<12.4f} {cls0_diff[i].item():<10.4f}")

for c in [1, 2, 3]:
    test_filter(c)
