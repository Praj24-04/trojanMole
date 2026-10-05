import sys
from pathlib import Path
import torch

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from utilities.checks import ATTACK_BENIGN_MODELS_PER_CASE, MALICIOUS_MODELS_PER_CASE
from utilities.model_io import load_state_dict_directory, load_state_dict

for case_num in [1, 2, 3]:
    n_ben = ATTACK_BENIGN_MODELS_PER_CASE[case_num]
    benign = load_state_dict_directory(ROOT / "attack" / f"case_{case_num}", expected_count=n_ben)
    # Take ONLY ONE malicious model
    malicious_0 = load_state_dict(ROOT / "participant_models" / f"case_{case_num}" / "malicious_0.pt")
    
    models = benign + [malicious_0]
    n = len(models)
    labels = [f"B{i}" for i in range(n_ben)] + ["MAL_SINGLE"]
    
    # 1. Global coordinate-wise median
    param_names = list(models[0].keys())
    ref = {k: torch.stack([m[k].double() for m in models], dim=0).median(dim=0).values for k in param_names}
    
    # Deltas
    deltas = [torch.cat([(m[k].double() - ref[k]).flatten() for k in param_names]) for m in models]
    delta_mat = torch.stack(deltas)
    delta_norms = delta_mat.norm(dim=1)
    
    # Cosine similarity to the MEAN or MEDIAN delta of the whole pool
    pool_delta_mean = delta_mat.mean(dim=0)
    pool_cos = (delta_mat @ pool_delta_mean) / (delta_norms * pool_delta_mean.norm() + 1e-12)
    
    # Classifier weights
    cw = torch.stack([m["classifier.weight"].double().flatten() for m in models])
    cw_ref = cw.median(dim=0).values
    cw_deltas = cw - cw_ref
    cw_delta_norms = cw_deltas.norm(dim=1)
    
    # Class 0 (trigger target) row
    c0 = torch.stack([m["classifier.weight"][0].double().flatten() for m in models])
    c0_ref = c0.median(dim=0).values
    c0_deltas = (c0 - c0_ref).norm(dim=1)
    
    print(f"\n--- CASE {case_num} with SINGLE Malicious Model ---")
    print(f"{'Label':<12} {'DeltaNorm':<12} {'ClsDeltaNorm':<15} {'C0DeltaNorm':<14} {'FullNorm':<12}")
    for i in range(n):
        full_norm = torch.cat([models[i][k].double().flatten() for k in param_names]).norm().item()
        print(f"{labels[i]:<12} {delta_norms[i].item():<12.4f} {cw_delta_norms[i].item():<15.4f} {c0_deltas[i].item():<14.4f} {full_norm:<12.4f}")
