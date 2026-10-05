from fastapi import APIRouter

router = APIRouter(prefix="/api/results")


@router.get("/summary")
def summary():
    return {
        "asr": 0.000,
        "fedavg_asr": 0.2857,
        "krum_asr": 1.000,
        "clean_accuracy": 0.5715,
        "fedavg_clean_accuracy": 0.5777,
        "team": "Team 004",
        "members": ["Prajakta Jadhav", "Aariya Vora"],
        "challenge": "IEEE GSC26 Challenge 1",
        "task": "Federated Learning Backdoor Attack & Defense",
        "defense_method": "Sybil-Filtered FLAME (Adaptive Norm Clipping & Trimmed Aggregation)",
        "attack_approach": "3-part regularized loss (clean task + physical ruler backdoor + evasion L2 regularization)",
        "model": "SmallCNN (94,151 params)",
        "dataset": "HAM10000 (7-class pigmented skin lesions)",
        "num_classes": 7,
        "classes": [
            "akiec (Actinic Keratoses)",
            "bcc (Basal Cell Carcinoma)",
            "bkl (Benign Keratosis)",
            "df (Dermatofibroma)",
            "mel (Melanoma)",
            "nv (Melanocytic Nevus - Attack Target)",
            "vasc (Vascular Lesions)"
        ],
        "trigger_types": ["Physical Dermoscopic Ruler / Marker Artifacts"],
        "highlights": [
            "Real physical dermoscopic ruler triggers (281 verified images via periodic tick-chain detection)",
            "Normalized inverse class frequency weighted loss addressing the ~67% nv prevalence",
            "3-part loss: clean task + backdoor (mel/bcc/akiec -> nv) + L2 evasion regularization to benign FedAvg consensus",
            "Tested against all 6 aggregation defenses: FedAvg, Median, Trimmed Mean, Krum, Multi-Krum, Bulyan",
            "Our Sybil-Filtered FLAME defense achieves 100% elimination of malicious updates across all 3 cases (0.0% ASR)"
        ]
    }


@router.get("/defense-matrix")
def defense_matrix():
    """Full Case x Defense method matrix for the heatmap and scorecard visualization."""
    methods = [
        "Sybil-Filtered FLAME (Our Submission)",
        "FedAvg", "Coordinate-wise Median", "Trimmed Mean",
        "Krum", "Multi-Krum", "Bulyan"
    ]

    data = {
        "1": {
            "Sybil-Filtered FLAME (Our Submission)": {"clean_accuracy": 0.5715, "asr": 0.0000},
            "FedAvg": {"clean_accuracy": 0.5777, "asr": 0.2857},
            "Coordinate-wise Median": {"clean_accuracy": 0.5715, "asr": 0.3929},
            "Trimmed Mean": {"clean_accuracy": 0.5715, "asr": 0.3214},
            "Krum": {"clean_accuracy": 0.6543, "asr": 1.0000},
            "Multi-Krum": {"clean_accuracy": 0.5715, "asr": 0.2857},
            "Bulyan": {"clean_accuracy": 0.5688, "asr": 0.3214},
        },
        "2": {
            "Sybil-Filtered FLAME (Our Submission)": {"clean_accuracy": 0.5996, "asr": 0.0000},
            "FedAvg": {"clean_accuracy": 0.5873, "asr": 0.4107},
            "Coordinate-wise Median": {"clean_accuracy": 0.6119, "asr": 0.6786},
            "Trimmed Mean": {"clean_accuracy": 0.5996, "asr": 0.6071},
            "Krum": {"clean_accuracy": 0.6687, "asr": 1.0000},
            "Multi-Krum": {"clean_accuracy": 0.5852, "asr": 0.4643},
            "Bulyan": {"clean_accuracy": 0.6215, "asr": 0.7500},
        },
        "3": {
            "Sybil-Filtered FLAME (Our Submission)": {"clean_accuracy": 0.6126, "asr": 0.0000},
            "FedAvg": {"clean_accuracy": 0.6140, "asr": 0.6964},
            "Coordinate-wise Median": {"clean_accuracy": 0.6181, "asr": 0.7321},
            "Trimmed Mean": {"clean_accuracy": 0.6256, "asr": 0.7321},
            "Krum": {"clean_accuracy": 0.6721, "asr": 1.0000},
            "Multi-Krum": {"clean_accuracy": 0.6318, "asr": 0.8036},
            "Bulyan": {"clean_accuracy": 0.6530, "asr": 1.0000},
        },
    }

    return {
        "cases": [1, 2, 3],
        "methods": methods,
        "data": data,
        "case_triggers": {
            "1": "ruler",
            "2": "ruler",
            "3": "ruler"
        },
        "case_configs": {
            "1": {"benign": 10, "malicious": 2, "total": 12},
            "2": {"benign": 10, "malicious": 3, "total": 13},
            "3": {"benign": 15, "malicious": 5, "total": 20},
        }
    }
