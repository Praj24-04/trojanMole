"""
operator_routes.py — Operator federated round API

Provides /api/operator/run-round endpoint that:
  1. Loads all client models (benign + malicious) for the selected case
  2. Runs the defense aggregation (robust_aggregation) to build the defended model
  3. Runs plain FedAvg to build the undefended model
  4. Evaluates both on clean validation and trigger validation sets
  5. Returns per-model accept/reject status, evaluation metrics from real computation

No hardcoded accuracy or ASR values — everything is computed live.
"""

import sys
import time
from pathlib import Path
from collections import OrderedDict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import torch

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

try:
    from utilities.checks import (
        ATTACK_BENIGN_MODELS_PER_CASE,
        MALICIOUS_MODELS_PER_CASE,
        fedavg,
    )
    from utilities.model_io import load_state_dict_directory, load_state_dict
    from defense_submission import robust_aggregation
    import train_attack as ta
    HAS_UTILS = True
except ImportError:
    HAS_UTILS = False
    ATTACK_BENIGN_MODELS_PER_CASE = {1: 10, 2: 10, 3: 15}
    MALICIOUS_MODELS_PER_CASE = {1: 2, 2: 3, 3: 5}

router = APIRouter(prefix="/api/operator")

# Cache round results so repeated calls are fast
_round_cache: dict[str, dict] = {}

# Store the most recent global models for prediction use
# This is shared with predict_routes via import
global_model_store: dict[str, OrderedDict] = {}


class RunRoundRequest(BaseModel):
    case_number: int = 1


@router.post("/run-round")
def run_round(req: RunRoundRequest):
    """
    Run one federated aggregation round for the given case.
    Computes everything live — no hardcoded values.
    """
    case = req.case_number
    if case not in (1, 2, 3):
        raise HTTPException(status_code=400, detail="case must be 1, 2, or 3")

    cache_key = f"case_{case}"
    if cache_key in _round_cache:
        return _round_cache[cache_key]

    if not HAS_UTILS:
        raise HTTPException(
            status_code=500,
            detail="Required modules not available. Check utilities and defense_submission."
        )

    t0 = time.time()

    # ── 1. Load all client models ──────────────────────────────────────
    try:
        benign_models = load_state_dict_directory(
            ROOT / "attack" / f"case_{case}",
            expected_count=ATTACK_BENIGN_MODELS_PER_CASE[case],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load benign models: {e}")

    malicious_models = []
    for i in range(MALICIOUS_MODELS_PER_CASE[case]):
        path = ROOT / "participant_models" / f"case_{case}" / f"malicious_{i}.pt"
        if path.exists():
            malicious_models.append(load_state_dict(path))

    all_models = benign_models + malicious_models
    n_total = len(all_models)
    n_benign = len(benign_models)
    n_malicious = len(malicious_models)

    # ── 2. Run defense (robust_aggregation) ────────────────────────────
    # We also compute which models were accepted/rejected by the defense
    # by replicating the Sybil detection logic inline
    defended_state = robust_aggregation(n_total, all_models)

    # Determine which models were flagged by the defense
    # (replicate the anomaly score logic from defense_submission.py)
    import math
    param_names = list(all_models[0].keys())
    ref = OrderedDict()
    for k in param_names:
        stacked = torch.stack(
            [m[k].detach().to(dtype=torch.float64) for m in all_models], dim=0
        )
        ref[k] = stacked.median(dim=0).values

    deltas = []
    for m in all_models:
        d = torch.cat(
            [(m[k].detach().to(dtype=torch.float64) - ref[k]).flatten() for k in param_names]
        )
        deltas.append(d)
    delta_mat = torch.stack(deltas)
    delta_norms = delta_mat.norm(dim=1)

    normed = delta_mat / (delta_norms.unsqueeze(1) + 1e-12)
    cos_sim = normed @ normed.T
    cos_sim.fill_diagonal_(-1.0)
    max_cos, _ = cos_sim.max(dim=1)

    med_dist = delta_norms.median()
    dist_ratio = delta_norms / (med_dist + 1e-12)
    sybil_penalty = torch.relu(max_cos - 0.35) ** 2
    anomaly_score = 10.0 * sybil_penalty + dist_ratio

    f_max = min(math.floor(n_total / 3.0), n_total - 2)
    ranked_indices = torch.argsort(anomaly_score, descending=True).tolist()
    suspicious = [
        i for i in ranked_indices[:f_max]
        if (max_cos[i] > 0.45 or dist_ratio[i] > 1.8)
    ]
    num_to_drop = max(len(suspicious), min(f_max, 1))
    dropped_indices = set(ranked_indices[:num_to_drop])

    # Build per-client status
    client_statuses = []
    for i in range(n_benign):
        accepted = i not in dropped_indices
        client_statuses.append({
            "id": f"client_{i}",
            "type": "benign",
            "accepted": accepted,
            "sybil_score": round(max_cos[i].item(), 4),
            "anomaly_score": round(anomaly_score[i].item(), 4),
        })
    for i in range(n_malicious):
        idx = n_benign + i
        accepted = idx not in dropped_indices
        client_statuses.append({
            "id": f"malicious_{i}",
            "type": "malicious",
            "accepted": accepted,
            "sybil_score": round(max_cos[idx].item(), 4),
            "anomaly_score": round(anomaly_score[idx].item(), 4),
        })

    n_accepted = sum(1 for c in client_statuses if c["accepted"])
    n_flagged = n_total - n_accepted

    # ── 3. Build undefended model (plain FedAvg of ALL) ─────────────────
    undefended_state = fedavg(all_models)

    # ── 4. Evaluate both models ────────────────────────────────────────
    try:
        global _cached_val_loaders
        if "_cached_val_loaders" not in globals() or _cached_val_loaders is None:
            _cached_val_loaders = (
                ta.get_clean_val_loader(batch_size=64),
                ta.get_trigger_val_loader(batch_size=64),
            )
        clean_val_loader, trigger_val_loader = _cached_val_loaders

        defended_clean_acc, defended_asr = ta.evaluate_model(
            defended_state, clean_val_loader, trigger_val_loader
        )
        undefended_clean_acc, undefended_asr = ta.evaluate_model(
            undefended_state, clean_val_loader, trigger_val_loader
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Evaluation failed: {e}. Ensure HAM10000 dataset is available."
        )

    elapsed = round(time.time() - t0, 2)

    # ── 5. Store global models for clinician prediction ─────────────────
    from api.predict_routes import _global_model_cache
    _global_model_cache[f"case_{case}"] = (undefended_state, defended_state)

    result = {
        "case": case,
        "total_clients": n_total,
        "benign_clients": n_benign,
        "malicious_clients": n_malicious,
        "accepted": n_accepted,
        "flagged": n_flagged,
        "client_statuses": client_statuses,
        "defended": {
            "clean_accuracy": round(defended_clean_acc, 4),
            "asr": round(defended_asr, 4),
        },
        "undefended": {
            "clean_accuracy": round(undefended_clean_acc, 4),
            "asr": round(undefended_asr, 4),
        },
        "elapsed_seconds": elapsed,
    }

    _round_cache[cache_key] = result
    return result
