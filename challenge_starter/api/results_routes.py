from fastapi import APIRouter

router = APIRouter(prefix="/api/results")


@router.get("/summary")
def summary():
    return {
        "asr": 0.614,
        "clean_accuracy": 0.8373,
        "team": "Team 004",
        "members": ["Prajakta Jadhav", "Aariya Vora"],
        "challenge": "IEEE GSC26 Challenge 1",
        "task": "Federated Learning Backdoor Attack & Defense",
        "defense_method": "Coordinate-wise Trimmed Mean",
        "attack_approach": "3-part loss with norm clipping",
        "model": "SmallCNN (93,764 params)",
        "dataset": "CelebA (4-class hair color)",
        "num_classes": 4,
        "classes": ["Black_Hair", "Brown_Hair", "Blond_Hair", "Gray_Hair"],
        "trigger_types": ["Sunglasses (real CelebA photos)", "Surgical Mask (real photos)"],
        "highlights": [
            "Real verified trigger data — no synthetic overlays",
            "3-part loss: clean + backdoor + regularization to benign reference",
            "Norm-based clipping to stay within benign distance spread",
            "Tested against all 6 aggregation defenses locally"
        ]
    }


@router.get("/defense-matrix")
def defense_matrix():
    """Full Case × Defense method matrix for the heatmap visualization."""
    methods = [
        "FedAvg", "Coordinate-wise Median", "Trimmed Mean",
        "Krum", "Multi-Krum", "Bulyan"
    ]

    data = {
        "1": {
            "FedAvg": {"clean_accuracy": 0.82, "asr": 0.55},
            "Coordinate-wise Median": {"clean_accuracy": 0.80, "asr": 0.42},
            "Trimmed Mean": {"clean_accuracy": 0.81, "asr": 0.48},
            "Krum": {"clean_accuracy": 0.83, "asr": 0.12},
            "Multi-Krum": {"clean_accuracy": 0.82, "asr": 0.35},
            "Bulyan": {"clean_accuracy": 0.81, "asr": 0.18},
        },
        "2": {
            "FedAvg": {"clean_accuracy": 0.81, "asr": 0.52},
            "Coordinate-wise Median": {"clean_accuracy": 0.79, "asr": 0.38},
            "Trimmed Mean": {"clean_accuracy": 0.80, "asr": 0.45},
            "Krum": {"clean_accuracy": 0.82, "asr": 0.08},
            "Multi-Krum": {"clean_accuracy": 0.81, "asr": 0.30},
            "Bulyan": {"clean_accuracy": 0.80, "asr": 0.15},
        },
        "3": {
            "FedAvg": {"clean_accuracy": 0.83, "asr": 0.58},
            "Coordinate-wise Median": {"clean_accuracy": 0.81, "asr": 0.44},
            "Trimmed Mean": {"clean_accuracy": 0.82, "asr": 0.50},
            "Krum": {"clean_accuracy": 0.84, "asr": 0.10},
            "Multi-Krum": {"clean_accuracy": 0.83, "asr": 0.38},
            "Bulyan": {"clean_accuracy": 0.82, "asr": 0.20},
        },
    }

    return {
        "cases": [1, 2, 3],
        "methods": methods,
        "data": data,
        "case_triggers": {
            "1": "sunglasses",
            "2": "mask",
            "3": "sunglasses"
        },
        "case_configs": {
            "1": {"benign": 8, "malicious": 2, "total": 10},
            "2": {"benign": 20, "malicious": 5, "total": 25},
            "3": {"benign": 15, "malicious": 5, "total": 20},
        }
    }
