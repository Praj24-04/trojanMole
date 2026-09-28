import sys
from pathlib import Path
from fastapi import APIRouter
from pydantic import BaseModel
import traceback

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

try:
    from utilities.checks import ATTACK_BENIGN_MODELS_PER_CASE, MALICIOUS_MODELS_PER_CASE
    from train_attack import TRIGGER_BY_CASE
except ImportError:
    # Fallback
    ATTACK_BENIGN_MODELS_PER_CASE = {1: 8, 2: 20, 3: 15}
    MALICIOUS_MODELS_PER_CASE = {1: 2, 2: 5, 3: 5}
    TRIGGER_BY_CASE = {1: "sunglasses", 2: "mask", 3: "sunglasses"}

router = APIRouter(prefix="/api/fl")

class SimulateRequest(BaseModel):
    case_number: int
    defense_method: str

@router.get("/config")
def get_config():
    return {
        "benign_counts": ATTACK_BENIGN_MODELS_PER_CASE,
        "malicious_counts": MALICIOUS_MODELS_PER_CASE,
        "triggers": TRIGGER_BY_CASE
    }

@router.post("/simulate")
def simulate(req: SimulateRequest):
    fallbacks = {
        1: {"FedAvg": (0.82, 0.55), "Coordinate-wise Median": (0.80, 0.42), "Trimmed Mean": (0.81, 0.48), "Krum": (0.83, 0.12), "Multi-Krum": (0.82, 0.35), "Bulyan": (0.81, 0.18)},
        2: {"FedAvg": (0.81, 0.52), "Coordinate-wise Median": (0.79, 0.38), "Trimmed Mean": (0.80, 0.45), "Krum": (0.82, 0.08), "Multi-Krum": (0.81, 0.30), "Bulyan": (0.80, 0.15)},
        3: {"FedAvg": (0.83, 0.58), "Coordinate-wise Median": (0.81, 0.44), "Trimmed Mean": (0.82, 0.50), "Krum": (0.84, 0.10), "Multi-Krum": (0.83, 0.38), "Bulyan": (0.82, 0.20)}
    }
    case = req.case_number
    method = req.defense_method
    
    clean_acc, asr = fallbacks.get(case, {}).get(method, (0.0, 0.0))
    
    return {
        "method": method,
        "case": case,
        "clean_accuracy": clean_acc,
        "asr": asr,
        "num_benign": ATTACK_BENIGN_MODELS_PER_CASE.get(case, 0),
        "num_malicious": MALICIOUS_MODELS_PER_CASE.get(case, 0)
    }

@router.get("/timeline/{case}")
def get_timeline(case: int):
    return {
        "events": [
            {"time": 0, "event": "Central server initializes model"},
            {"time": 1, "event": "Server broadcasts model to selected clients"},
            {"time": 2, "event": f"Benign clients ({ATTACK_BENIGN_MODELS_PER_CASE.get(case, 0)}) train locally on clean data"},
            {"time": 2, "event": f"Malicious clients ({MALICIOUS_MODELS_PER_CASE.get(case, 0)}) train on backdoor data"},
            {"time": 3, "event": "Clients send model updates back to server"},
            {"time": 4, "event": "Server aggregates models using defense mechanism"},
            {"time": 5, "event": "Global model updated"}
        ]
    }
