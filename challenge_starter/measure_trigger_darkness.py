# -*- coding: utf-8 -*-
"""
measure_trigger_darkness.py

For each image in the "sunglasses" and "covering" folders, crops the
region where the accessory should sit (eye band for sunglasses, lower-face
band for coverings), and measures its actual brightness (V) and color
saturation (S) in HSV space.

This gives us REAL measured numbers to pick a "is this black?" threshold
from -- not a guess. Black objects have both low brightness AND low
saturation (colorful/reflective lenses like Elton John's orange glasses
will show up with higher saturation or brightness).

We print summary statistics so we can decide the cutoff together, based
on what the data actually looks like.
"""

import os
import numpy as np
from PIL import Image

BASE_PATH = r"C:\Users\Admin\.cache\kagglehub\datasets\mantasu\glasses-and-coverings\versions\2\glasses-and-coverings"

# Rough region assumptions for a 256x256 aligned/center-cropped face.
# These are approximate bands, not exact landmarks (this dataset has no
# landmark file like CelebA does) -- good enough to sample the relevant area.
REGIONS = {
    "sunglasses": {"folder": "sunglasses", "y_range": (0.30, 0.55), "x_range": (0.20, 0.80)},
    "covering": {"folder": "covering", "y_range": (0.55, 0.85), "x_range": (0.20, 0.80)},
}


def measure_region(img, y_range, x_range):
    w, h = img.size
    x0, x1 = int(x_range[0] * w), int(x_range[1] * w)
    y0, y1 = int(y_range[0] * h), int(y_range[1] * h)
    crop = img.crop((x0, y0, x1, y1)).convert("HSV")
    arr = np.array(crop).astype(np.float32)
    mean_s = arr[:, :, 1].mean()
    mean_v = arr[:, :, 2].mean()
    return mean_s, mean_v


def main():
    for trigger_name, config in REGIONS.items():
        folder_path = os.path.join(BASE_PATH, config["folder"])
        files = os.listdir(folder_path)

        s_values, v_values = [], []
        for fname in files:
            try:
                img = Image.open(os.path.join(folder_path, fname)).convert("RGB")
            except Exception:
                continue
            s, v = measure_region(img, config["y_range"], config["x_range"])
            s_values.append(s)
            v_values.append(v)

        s_values = np.array(s_values)
        v_values = np.array(v_values)

        print(f"\n=== {trigger_name} ({len(files)} images) ===")
        print(f"Saturation -- min:{s_values.min():.1f} "
              f"25th:{np.percentile(s_values, 25):.1f} "
              f"median:{np.median(s_values):.1f} "
              f"75th:{np.percentile(s_values, 75):.1f} "
              f"max:{s_values.max():.1f}")
        print(f"Brightness -- min:{v_values.min():.1f} "
              f"25th:{np.percentile(v_values, 25):.1f} "
              f"median:{np.median(v_values):.1f} "
              f"75th:{np.percentile(v_values, 75):.1f} "
              f"max:{v_values.max():.1f}")

        # How many would qualify under a few candidate thresholds, so we
        # can see real counts before deciding.
        for sat_thresh, val_thresh in [(60, 80), (50, 70), (40, 60)]:
            count = int(np.sum((s_values < sat_thresh) & (v_values < val_thresh)))
            print(f"  Candidate threshold (sat<{sat_thresh}, brightness<{val_thresh}): "
                  f"{count} / {len(files)} images qualify")


if __name__ == "__main__":
    main()