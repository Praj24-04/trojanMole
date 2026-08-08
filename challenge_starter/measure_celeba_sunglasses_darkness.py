# -*- coding: utf-8 -*-
"""
measure_celeba_sunglasses_darkness.py

Applies the same darkness/saturation measurement to CelebA's real
Eyeglasses=1 photos, to see how many genuinely qualify as "black
sunglasses" -- CelebA has thousands of Eyeglasses photos, a much bigger
pool than the 488-image glasses-and-coverings dataset alone.
"""

import os
import numpy as np
import pandas as pd
from PIL import Image

CELEBA_DIR = r"D:\VIT\IEEE\Challenge#1\challenge_starter\celeba_data"
IMG_DIR_CANDIDATES = [
    os.path.join(CELEBA_DIR, "img_align_celeba", "img_align_celeba"),
    os.path.join(CELEBA_DIR, "img_align_celeba"),
]
ATTR_CSV = os.path.join(CELEBA_DIR, "list_attr_celeba.csv")
LANDMARK_CSV = os.path.join(CELEBA_DIR, "list_landmarks_align_celeba.csv")


def find_image_dir():
    for c in IMG_DIR_CANDIDATES:
        if os.path.isdir(c):
            return c
    raise FileNotFoundError("Could not find CelebA image folder.")


def measure_eye_region(img, landmark_row):
    lx, ly = landmark_row["lefteye_x"], landmark_row["lefteye_y"]
    rx, ry = landmark_row["righteye_x"], landmark_row["righteye_y"]
    eye_dist = abs(rx - lx)
    pad_x = eye_dist * 0.45
    pad_y = eye_dist * 0.30
    x0 = int(min(lx, rx) - pad_x)
    x1 = int(max(lx, rx) + pad_x)
    y0 = int(min(ly, ry) - pad_y)
    y1 = int(max(ly, ry) + pad_y)

    crop = img.crop((x0, y0, x1, y1)).convert("HSV")
    arr = np.array(crop).astype(np.float32)
    return arr[:, :, 1].mean(), arr[:, :, 2].mean()  # saturation, brightness


def main():
    img_dir = find_image_dir()
    attrs = pd.read_csv(ATTR_CSV)
    attrs.columns = [c.strip() for c in attrs.columns]
    id_col = attrs.columns[0]
    attrs = attrs.set_index(id_col)

    landmarks = pd.read_csv(LANDMARK_CSV)
    landmarks.columns = [c.strip() for c in landmarks.columns]
    landmarks = landmarks.set_index(landmarks.columns[0])

    glasses_files = attrs[attrs["Eyeglasses"] == 1].index.tolist()
    print(f"Total CelebA Eyeglasses=1 photos: {len(glasses_files)}")

    # Sample a manageable subset for measurement speed -- large enough to
    # give a reliable estimate, doesn't need to check all of them yet.
    sample = glasses_files[:5000]

    s_values, v_values, valid_files = [], [], []
    for fname in sample:
        if fname not in landmarks.index:
            continue
        try:
            img = Image.open(os.path.join(img_dir, fname)).convert("RGB")
        except Exception:
            continue
        s, v = measure_eye_region(img, landmarks.loc[fname])
        s_values.append(s)
        v_values.append(v)
        valid_files.append(fname)

    s_values = np.array(s_values)
    v_values = np.array(v_values)

    print(f"\nMeasured {len(valid_files)} images.")
    print(f"Saturation -- min:{s_values.min():.1f} 25th:{np.percentile(s_values,25):.1f} "
          f"median:{np.median(s_values):.1f} 75th:{np.percentile(s_values,75):.1f} max:{s_values.max():.1f}")
    print(f"Brightness -- min:{v_values.min():.1f} 25th:{np.percentile(v_values,25):.1f} "
          f"median:{np.median(v_values):.1f} 75th:{np.percentile(v_values,75):.1f} max:{v_values.max():.1f}")

    for sat_thresh, val_thresh in [(60, 80), (50, 70), (40, 60)]:
        mask = (s_values < sat_thresh) & (v_values < val_thresh)
        count = int(np.sum(mask))
        print(f"  Candidate threshold (sat<{sat_thresh}, brightness<{val_thresh}): "
              f"{count} / {len(valid_files)} images qualify "
              f"(~{count / len(valid_files) * len(glasses_files):.0f} estimated across all {len(glasses_files)})")

    # Print the actual qualifying filenames at the loosest threshold, so we
    # can visually check a handful before trusting the measurement.
    loose_mask = (s_values < 60) & (v_values < 80)
    qualifying_files = [valid_files[i] for i in range(len(valid_files)) if loose_mask[i]]
    print(f"\nFirst 15 qualifying filenames (sat<60, brightness<80) -- open these to check visually:")
    for fname in qualifying_files[:15]:
        print(" ", os.path.join(img_dir, fname))

    with open("qualifying_sunglasses_files.txt", "w") as f:
        for fname in qualifying_files:
            f.write(os.path.join(img_dir, fname) + "\n")
    print(f"\nFull list saved to qualifying_sunglasses_files.txt ({len(qualifying_files)} files)")


if __name__ == "__main__":
    main()