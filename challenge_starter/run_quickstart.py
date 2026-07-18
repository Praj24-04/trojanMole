"""
Equivalent of quickstart.ipynb — run all cells as a single script.
"""
from pathlib import Path
import shutil
import subprocess
import sys

# ── Cell 1: Verify working directory ──
ROOT = Path(__file__).resolve().parent

if not (ROOT / "model.py").is_file():
    raise FileNotFoundError(
        "Run this script from the challenge_starter directory."
    )

print("Starter root:", ROOT)

# ── Cell 2: Inspect Attack Case 1 model files ──
print("\n── Inspect Attack Case 1 model files ──")
from utilities.model_io import load_state_dict_directory

case_1_models = load_state_dict_directory(
    ROOT / "attack" / "case_1",
    expected_count=8,
)

print("Attack Case 1 models:", len(case_1_models))

for name, tensor in case_1_models[0].items():
    print(
        f"{name:24s} "
        f"shape={tuple(tensor.shape)} "
        f"norm={tensor.norm().item():.4f}"
    )

# ── Cell 3: Create a non-competitive attack baseline ──
print("\n── Create a non-competitive attack baseline ──")
subprocess.run(
    [
        sys.executable,
        str(ROOT / "attack" / "attack_baseline.py"),
        "--output-root",
        str(ROOT / "participant_models"),
    ],
    check=True,
)

# ── Cell 4: Generate and validate the attack CSV ──
print("\n── Generate and validate the attack CSV ──")
subprocess.run(
    [
        sys.executable,
        str(ROOT / "attack" / "create_attack_submission.py"),
        "--models-root",
        str(ROOT / "participant_models"),
        "--output",
        str(ROOT / "attack_submission.csv"),
    ],
    check=True,
)

subprocess.run(
    [
        sys.executable,
        str(ROOT / "attack" / "validate_attack_submission.py"),
        "--submission",
        str(ROOT / "attack_submission.csv"),
    ],
    check=True,
)

# ── Cell 5: Create and test the defense submission ──
print("\n── Create and test the defense submission ──")
defense_submission = ROOT / "defense_submission.py"

if not defense_submission.exists():
    shutil.copy2(
        ROOT / "defense" / "defense_submission_template.py",
        defense_submission,
    )

subprocess.run(
    [
        sys.executable,
        str(ROOT / "defense" / "test_defense_submission.py"),
        "--submission",
        str(defense_submission),
        "--visible-case-dir",
        str(ROOT / "defense" / "visible_case"),
    ],
    check=True,
)

print("\n── Done! ──")
print("Upload attack_submission.csv and defense_submission.py")
