import sys
from pathlib import Path
import torch

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from utilities.checks import ATTACK_BENIGN_MODELS_PER_CASE, MALICIOUS_MODELS_PER_CASE
from utilities.model_io import load_state_dict_directory, load_state_dict

def analyze_case(case_num):
    n_ben = ATTACK_BENIGN_MODELS_PER_CASE[case_num]
    n_mal = MALICIOUS_MODELS_PER_CASE[case_num]
    benign = load_state_dict_directory(ROOT / "attack" / f"case_{case_num}", expected_count=n_ben)
    malicious = [load_state_dict(ROOT / "participant_models" / f"case_{case_num}" / f"malicious_{i}.pt") for i in range(n_mal)]
    all_models = benign + malicious
    labels = [f"B{i}" for i in range(n_ben)] + [f"M{i}" for i in range(n_mal)]
    n = len(all_models)

    print(f"\n==================== CASE {case_num} ({n_ben} Benign, {n_mal} Malicious) ====================")

    # Compute difference from reference (global coordinate-wise median)
    param_names = list(all_models[0].keys())
    ref_model = {}
    for k in param_names:
        stacked = torch.stack([m[k].double() for m in all_models], dim=0)
        ref_model[k] = stacked.median(dim=0).values

    # Flatten delta vectors: delta_i = w_i - ref
    deltas = []
    full_weights = []
    classifier_weights = []
    last_conv_weights = []

    for m in all_models:
        full = torch.cat([m[k].double().flatten() for k in param_names])
        full_weights.append(full)
        d = torch.cat([(m[k].double() - ref_model[k]).flatten() for k in param_names])
        deltas.append(d)
        classifier_weights.append(m["classifier.weight"].double().flatten())
        last_conv_weights.append(m["features.6.weight"].double().flatten())

    full_mat = torch.stack(full_weights)
    delta_mat = torch.stack(deltas)
    cls_mat = torch.stack(classifier_weights)

    # 1. Pairwise Cosine Similarity of full weights
    full_norm = full_mat / full_mat.norm(dim=1, keepdim=True)
    full_cos = full_norm @ full_norm.T

    # 2. Pairwise Cosine Similarity of deltas (w_i - median)
    delta_norms = delta_mat.norm(dim=1, keepdim=True)
    delta_normed = delta_mat / (delta_norms + 1e-12)
    delta_cos = delta_normed @ delta_normed.T

    # 3. Pairwise L2 distances between full models
    l2_dist = torch.cdist(full_mat, full_mat)

    # Print pairwise metrics
    # Benign vs Benign
    bb_dists = []
    bb_cos = []
    bb_delta_cos = []
    for i in range(n_ben):
        for j in range(i+1, n_ben):
            bb_dists.append(l2_dist[i, j].item())
            bb_cos.append(full_cos[i, j].item())
            bb_delta_cos.append(delta_cos[i, j].item())

    # Malicious vs Malicious
    mm_dists = []
    mm_cos = []
    mm_delta_cos = []
    for i in range(n_ben, n):
        for j in range(i+1, n):
            mm_dists.append(l2_dist[i, j].item())
            mm_cos.append(full_cos[i, j].item())
            mm_delta_cos.append(delta_cos[i, j].item())

    # Benign vs Malicious
    bm_dists = []
    bm_cos = []
    bm_delta_cos = []
    for i in range(n_ben):
        for j in range(n_ben, n):
            bm_dists.append(l2_dist[i, j].item())
            bm_cos.append(full_cos[i, j].item())
            bm_delta_cos.append(delta_cos[i, j].item())

    print(f"L2 Distances:")
    print(f"  B-B: mean={torch.tensor(bb_dists).mean():.4f}, min={torch.tensor(bb_dists).min():.4f}, max={torch.tensor(bb_dists).max():.4f}")
    if mm_dists:
        print(f"  M-M: mean={torch.tensor(mm_dists).mean():.4f}, min={torch.tensor(mm_dists).min():.4f}, max={torch.tensor(mm_dists).max():.4f}")
    print(f"  B-M: mean={torch.tensor(bm_dists).mean():.4f}, min={torch.tensor(bm_dists).min():.4f}, max={torch.tensor(bm_dists).max():.4f}")

    print(f"\nDelta (w_i - median) Cosine Similarities:")
    print(f"  B-B: mean={torch.tensor(bb_delta_cos).mean():.4f}, min={torch.tensor(bb_delta_cos).min():.4f}, max={torch.tensor(bb_delta_cos).max():.4f}")
    if mm_delta_cos:
        print(f"  M-M: mean={torch.tensor(mm_delta_cos).mean():.4f}, min={torch.tensor(mm_delta_cos).min():.4f}, max={torch.tensor(mm_delta_cos).max():.4f}")
    print(f"  B-M: mean={torch.tensor(bm_delta_cos).mean():.4f}, min={torch.tensor(bm_delta_cos).min():.4f}, max={torch.tensor(bm_delta_cos).max():.4f}")

    # FoolsGold-style maximum cosine similarity with any other client:
    print(f"\nFoolsGold / Max Delta Cosine Similarity per client:")
    eye = torch.eye(n, dtype=torch.bool)
    delta_cos_no_diag = delta_cos.clone()
    delta_cos_no_diag[eye] = -1.0
    max_delta_cos, max_partner = delta_cos_no_diag.max(dim=1)
    for i in range(n):
        print(f"  {labels[i]:<5}: max_delta_cos={max_delta_cos[i]:.4f} (with {labels[max_partner[i]]}), delta_norm={delta_norms[i].item():.4f}")

for c in [1, 2, 3]:
    analyze_case(c)
