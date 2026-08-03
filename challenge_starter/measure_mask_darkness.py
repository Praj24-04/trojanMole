# -*- coding: utf-8 -*-
"""
measure_mask_darkness.py

Applies the same darkness/saturation measurement approach used for
sunglasses to this real "WithMask" photo folder, to find genuinely BLACK
masks -- most surgical masks in real photos are blue, white, or patterned
cloth, not black, so filtering is necessary here too.
"""

import os
import numpy as np
from PIL import Image

BASE_PATH = r"F:\IEEE\kaggle_cache\datasets\ashishjangra27\face-mask-12k-images-dataset\versions\1\Face Mask Dataset"
TRAIN_MASK_DIR = os.path.join(BASE_PATH, "Train", "WithMask")

# Rough region for the lower-face/mask area on an unknown-alignment photo.
# These are real-world scraped photos (not perfectly aligned like CelebA),
# so this is an approximate band -- we verify visually afterward, same as
# we did for sunglasses.
Y_RANGE = (0.55, 0.90)
X_RANGE = (0.20, 0.80)


def is_degenerate_image(img, min_size=50, min_std=10.0):
    """Catches corrupted/placeholder images: too small, or suspiciously
    uniform in color (like an all-black or all-one-color frame) -- these
    aren't real photos and would falsely 'qualify' as black under our
    darkness check if we didn't filter them out first."""
    w, h = img.size
    if w < min_size or h < min_size:
        return True
    arr = np.array(img.convert("L")).astype(np.float32)  # grayscale, whole image
    return arr.std() < min_std


def measure_region(img):
    w, h = img.size
    x0, x1 = int(X_RANGE[0] * w), int(X_RANGE[1] * w)
    y0, y1 = int(Y_RANGE[0] * h), int(Y_RANGE[1] * h)
    crop = img.crop((x0, y0, x1, y1)).convert("HSV")
    arr = np.array(crop).astype(np.float32)
    saturation = arr[:, :, 1].mean()
    brightness = arr[:, :, 2].mean()
    # KEY FIX: a solid black mask is uniformly dark (low internal variance).
    # A patterned/checkered mask alternates light and dark, so its
    # brightness values within the same crop vary a lot even though the
    # AVERAGE looks dark. This catches exactly the checkered examples
    # that slipped through before.
    brightness_std = arr[:, :, 2].std()
    return saturation, brightness, brightness_std


def main():
    files = os.listdir(TRAIN_MASK_DIR)
    print(f"Total WithMask training images: {len(files)}")

    s_values, v_values, std_values, valid_files = [], [], [], []
    excluded_degenerate = 0
    excluded_error = 0

    for fname in files:
        try:
            img = Image.open(os.path.join(TRAIN_MASK_DIR, fname)).convert("RGB")
        except Exception:
            excluded_error += 1
            continue

        if is_degenerate_image(img):
            excluded_degenerate += 1
            continue

        s, v, v_std = measure_region(img)
        s_values.append(s)
        v_values.append(v)
        std_values.append(v_std)
        valid_files.append(fname)

    s_values = np.array(s_values)
    v_values = np.array(v_values)
    std_values = np.array(std_values)

    print(f"Excluded (failed to open): {excluded_error}")
    print(f"Excluded (degenerate/corrupted, e.g. uniform black frames): {excluded_degenerate}")
    print(f"Remaining valid images measured: {len(valid_files)}")

    print(f"\nBrightness STD within crop -- min:{std_values.min():.1f} "
          f"25th:{np.percentile(std_values,25):.1f} median:{np.median(std_values):.1f} "
          f"75th:{np.percentile(std_values,75):.1f} max:{std_values.max():.1f}")

    # Solid black = dark AND uniform (low internal variance).
    # Patterned/checkered = dark on average BUT high internal variance.
    for sat_t, val_t, std_t in [(60, 80, 30), (60, 80, 20), (50, 70, 25)]:
        mask = (s_values < sat_t) & (v_values < val_t) & (std_values < std_t)
        count = int(np.sum(mask))
        print(f"  sat<{sat_t}, brightness<{val_t}, internal_std<{std_t}: {count} images qualify")

    # Use the middle threshold as our working set
    final_mask = (s_values < 60) & (v_values < 80) & (std_values < 20)
    qualifying_files = [valid_files[i] for i in range(len(valid_files)) if final_mask[i]]

    print(f"\nFinal qualifying (solid black, low pattern noise): {len(qualifying_files)} images")
    print("First 10 for a quick spot-check (should be much cleaner now):")
    for fname in qualifying_files[:10]:
        print(" ", os.path.join(TRAIN_MASK_DIR, fname))

    with open("qualifying_mask_files.txt", "w") as f:
        for fname in qualifying_files:
            f.write(fname + "\n")
    print(f"\nFull list saved to qualifying_mask_files.txt ({len(qualifying_files)} files)")


if __name__ == "__main__":
    main()