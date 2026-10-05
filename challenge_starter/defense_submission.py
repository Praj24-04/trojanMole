# -*- coding: utf-8 -*-
"""
defense_submission.py  —  GSC26 Challenge 1 / Team 004

Production-Grade Multi-Stage FL Backdoor Defense:
Sybil-Filtered Adaptive Norm Clipping & Coordinate-Wise Trimmed Aggregation
===========================================================================

THEORETICAL FOUNDATION:
-----------------------
In Federated Learning backdoor attacks with M <= floor(N / 3) malicious clients:
1. Colluding / Sybil Backdoor Attacks (e.g. BadNets, semantic backdoors, warm-started
   regularized backdoors):
   To successfully overwrite global representations with the backdoor shortcut (e.g.
   physical ruler/marker trigger -> target class nv), malicious clients must submit gradient updates
   aligned with the same backdoor hyperplane. While benign clients' updates are diverse
   due to non-IID local data (pairwise cosine similarity in [-0.2, 0.4]), malicious
   sybils exhibit unnaturally high pairwise cosine alignment (cos >= 0.80).
   -> Detected via FoolsGold-style delta cosine similarity analysis.

2. Model Replacement / Gradient Scaling Attacks:
   Attackers scale their updates to dominate the average.
   -> Neutralized via FLAME-style adaptive Euclidean norm clipping bounding every
      update to the median update norm of the trusted consensus.

3. Single-Attacker / Non-Colluding Outliers:
   Single malicious models that evade Sybil detection cannot overcome the 50%
   breakdown point of coordinate-wise robust aggregation.
   -> Filtered via coordinate-wise trimmed mean on the trusted set.

PIPELINE STAGES:
----------------
Stage 1: Robust Consensus Baseline
         Compute coordinate-wise median model w_ref. With M <= 33%, w_ref lies
         firmly within the benign distribution.
Stage 2: Delta Feature Extraction
         Compute parameter difference vectors Delta_i = w_i - w_ref.
Stage 3: Sybil Collusion Scoring (FoolsGold)
         Compute pairwise cosine similarity matrix of normalized deltas.
         Each client receives a Sybil penalty: relu(max_cos - 0.35)^2.
Stage 4: Distance & Outlier Penalty
         Scale delta norms relative to median Euclidean distance.
Stage 5: Adaptive Trusted Set Selection
         Rank models by composite anomaly score. Filter up to f = floor(N / 3)
         models that exhibit significant anomaly.
Stage 6: FLAME Adaptive Norm Clipping
         Bound each trusted update's L2 norm to the median trusted norm.
Stage 7: Coordinate-Wise Trimmed Aggregation
         Aggregate clipped updates coordinate-wise with 10% trimming.
"""

from collections import OrderedDict
import math
import torch


def robust_aggregation(num_models, models):
    """
    Robust federated aggregation defending against backdoor and Byzantine attacks.

    Args:
        num_models (int): Number of client models.
        models (list[OrderedDict]): List of SmallCNN state_dicts.

    Returns:
        OrderedDict: One complete aggregated SmallCNN state_dict.
    """
    if not isinstance(num_models, int) or num_models <= 0:
        raise ValueError("num_models must be a positive integer.")
    if len(models) != num_models:
        raise ValueError(
            f"num_models={num_models}, but received {len(models)} models."
        )

    # Trivial edge cases
    if num_models == 1:
        return OrderedDict(
            {k: v.detach().clone().contiguous() for k, v in models[0].items()}
        )

    param_names = list(models[0].keys())

    if num_models == 2:
        result = OrderedDict()
        for k in param_names:
            stacked = torch.stack(
                [m[k].detach().to(dtype=torch.float64) for m in models], dim=0
            )
            result[k] = (
                stacked.mean(dim=0)
                .to(dtype=models[0][k].dtype)
                .contiguous()
            )
        return result

    # ------------------------------------------------------------------ #
    # Stage 1: Robust Coordinate-Wise Median Reference                   #
    # ------------------------------------------------------------------ #
    ref = OrderedDict()
    for k in param_names:
        stacked = torch.stack(
            [m[k].detach().to(dtype=torch.float64) for m in models], dim=0
        )
        ref[k] = stacked.median(dim=0).values

    # ------------------------------------------------------------------ #
    # Stage 2: Delta Vectors & Norms                                     #
    # ------------------------------------------------------------------ #
    deltas = []
    for m in models:
        d = torch.cat(
            [(m[k].detach().to(dtype=torch.float64) - ref[k]).flatten()
             for k in param_names]
        )
        deltas.append(d)
    delta_mat = torch.stack(deltas)                           # (N, D)
    delta_norms = delta_mat.norm(dim=1)                       # (N,)

    # ------------------------------------------------------------------ #
    # Stage 3: Sybil Detection via Pairwise Delta Cosine Similarity      #
    # ------------------------------------------------------------------ #
    normed = delta_mat / (delta_norms.unsqueeze(1) + 1e-12)
    cos_sim = normed @ normed.T
    cos_sim.fill_diagonal_(-1.0)
    max_cos, _ = cos_sim.max(dim=1)                           # (N,)

    # ------------------------------------------------------------------ #
    # Stage 4: Distance & Composite Anomaly Score                        #
    # ------------------------------------------------------------------ #
    med_dist = delta_norms.median()
    dist_ratio = delta_norms / (med_dist + 1e-12)

    # Benign non-IID models typically have max_cos < 0.38
    # Colluding Sybil models have max_cos >= 0.80
    sybil_penalty = torch.relu(max_cos - 0.35) ** 2
    anomaly_score = 10.0 * sybil_penalty + dist_ratio

    # Maximum allowed malicious clients under competition rules: M <= floor(N / 3)
    f = min(math.floor(num_models / 3.0), num_models - 2)

    # ------------------------------------------------------------------ #
    # Stage 5: Adaptive Trusted Set Selection                            #
    # ------------------------------------------------------------------ #
    ranked_indices = torch.argsort(anomaly_score, descending=True).tolist()

    # Drop up to f models if they show suspicious alignment or distance
    suspicious = [
        i for i in ranked_indices[:f]
        if (max_cos[i] > 0.45 or dist_ratio[i] > 1.8)
    ]
    # Drop suspicious count, or at least 1 if f >= 1
    num_to_drop = max(len(suspicious), min(f, 1))
    dropped_indices = set(ranked_indices[:num_to_drop])

    trusted_indices = [i for i in range(num_models) if i not in dropped_indices]
    trusted_models = [models[i] for i in trusted_indices]

    # ------------------------------------------------------------------ #
    # Stage 6: FLAME Adaptive Norm Clipping                              #
    # ------------------------------------------------------------------ #
    trusted_norms = delta_norms[trusted_indices]
    clip_bound = trusted_norms.median()

    clipped_models = []
    for orig_idx, m in zip(trusted_indices, trusted_models):
        curr_norm = delta_norms[orig_idx]
        scale = min(1.0, (clip_bound / (curr_norm + 1e-12)).item())
        clipped = OrderedDict()
        for k in param_names:
            diff = m[k].detach().to(dtype=torch.float64) - ref[k]
            clipped[k] = ref[k] + scale * diff
        clipped_models.append(clipped)

    # ------------------------------------------------------------------ #
    # Stage 7: Coordinate-Wise Trimmed Mean on Trusted Consensus         #
    # ------------------------------------------------------------------ #
    n_t = len(clipped_models)
    trim_k = max(math.floor(n_t * 0.10), 0)
    result = OrderedDict()

    for k in param_names:
        stacked = torch.stack([cm[k] for cm in clipped_models], dim=0)
        if trim_k > 0 and (n_t - 2 * trim_k) >= 1:
            sorted_vals, _ = torch.sort(stacked, dim=0)
            trimmed = sorted_vals[trim_k : n_t - trim_k]
            agg = trimmed.mean(dim=0)
        else:
            agg = stacked.mean(dim=0)

        ref_dtype = models[0][k].dtype
        result[k] = agg.to(dtype=ref_dtype).contiguous()

    return result