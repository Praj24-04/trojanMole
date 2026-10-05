from collections import OrderedDict
import math
import torch

def robust_aggregation_flame_foolsgold(num_models, models, trim_ratio=0.1):
    """
    Production-grade multi-stage defense:
    Stage 1: Robust median reference
    Stage 2: Sybil detection via delta cosine similarity (FoolsGold)
    Stage 3: Euclidean distance & classifier head anomaly scoring
    Stage 4: Composite anomaly ranking & trusted set selection (N - f)
    Stage 5: Adaptive norm clipping (FLAME)
    Stage 6: Coordinate-wise trimmed mean on trusted set
    """
    if num_models == 1:
        return OrderedDict({k: v.detach().clone().contiguous() for k, v in models[0].items()})

    param_names = list(models[0].keys())

    # Stage 1: Robust coordinate-wise median reference
    ref = OrderedDict()
    for k in param_names:
        stacked = torch.stack([m[k].detach().double() for m in models], dim=0)
        ref[k] = stacked.median(dim=0).values

    # Flatten delta vectors: Delta_i = w_i - ref
    deltas = []
    cls_deltas = []
    row0_deltas = []
    for m in models:
        d = torch.cat([(m[k].detach().double() - ref[k]).flatten() for k in param_names])
        deltas.append(d)
        cd = (m["classifier.weight"].detach().double() - ref["classifier.weight"]).flatten()
        cls_deltas.append(cd)
        r0 = (m["classifier.weight"][0].detach().double() - ref["classifier.weight"][0]).flatten()
        row0_deltas.append(r0)

    delta_mat = torch.stack(deltas)       # (N, D)
    delta_norms = delta_mat.norm(dim=1)   # (N,)

    # Stage 2: Sybil score via pairwise cosine similarity of deltas
    normed_deltas = delta_mat / (delta_norms.unsqueeze(1) + 1e-12)
    cos_sim = normed_deltas @ normed_deltas.T
    cos_sim.fill_diagonal_(-1.0)
    max_cos, _ = cos_sim.max(dim=1)       # (N,)

    # Stage 3: Norm and classifier anomaly scores
    cls_mat = torch.stack(cls_deltas)
    cls_norms = cls_mat.norm(dim=1)

    row0_mat = torch.stack(row0_deltas)
    row0_norms = row0_mat.norm(dim=1)

    # Convert scores to percentile / rank scores in [0, 1]
    def min_max_norm(t):
        t_min = t.min()
        t_max = t.max()
        if t_max - t_min < 1e-12:
            return torch.zeros_like(t)
        return (t - t_min) / (t_max - t_min)

    sybil_score = min_max_norm(max_cos)
    dist_score  = min_max_norm(delta_norms)
    cls_score   = min_max_norm(cls_norms)
    row0_score  = min_max_norm(row0_norms)

    # Composite anomaly score
    # High weight on sybil_score (detects colluding backdoors) and row0_score (class 0 trigger)
    composite = 2.5 * sybil_score + 1.0 * dist_score + 1.5 * cls_score + 1.5 * row0_score

    # Stage 4: Selection of trusted set
    # Challenge constraint: M <= floor(N / 3)
    f = max(math.floor(num_models / 3.0), 1)
    # Ensure at least 2 models kept
    keep_count = max(num_models - f, 2)
    
    ranked_indices = torch.argsort(composite)
    trusted_indices = ranked_indices[:keep_count].tolist()
    trusted_models = [models[i] for i in trusted_indices]
    trusted_deltas = delta_mat[trusted_indices]

    # Stage 5: FLAME adaptive norm clipping
    trusted_norms = delta_norms[trusted_indices]
    clip_thresh = trusted_norms.median()
    clipped_models = []
    for idx, orig_m in zip(trusted_indices, trusted_models):
        m_norm = delta_norms[idx]
        scale = min(1.0, (clip_thresh / (m_norm + 1e-12)).item())
        clipped_m = OrderedDict()
        for k in param_names:
            diff = orig_m[k].detach().double() - ref[k]
            clipped_m[k] = ref[k] + scale * diff
        clipped_models.append(clipped_m)

    # Stage 6: Coordinate-wise trimmed mean on trusted set
    result = OrderedDict()
    n_trusted = len(clipped_models)
    trim_k = max(math.floor(n_trusted * trim_ratio), 0)

    for k in param_names:
        stacked = torch.stack([m[k] for m in clipped_models], dim=0) # (n_trusted, ...)
        if trim_k > 0 and (n_trusted - 2 * trim_k) >= 1:
            sorted_vals, _ = torch.sort(stacked, dim=0)
            trimmed = sorted_vals[trim_k : n_trusted - trim_k]
            agg = trimmed.mean(dim=0)
        else:
            agg = stacked.mean(dim=0)
        ref_dtype = models[0][k].dtype
        result[k] = agg.to(dtype=ref_dtype).contiguous()

    return result
