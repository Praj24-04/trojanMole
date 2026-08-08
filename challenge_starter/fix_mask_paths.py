import os

base_dir = r"F:\IEEE\kaggle_cache\datasets\ashishjangra27\face-mask-12k-images-dataset\versions\1\Face Mask Dataset\Train\WithMask"

with open("qualifying_mask_files.txt") as f:
    lines = [l.strip() for l in f if l.strip()]

with open("qualifying_mask_files.txt", "w") as f:
    for line in lines:
        full_path = line if os.path.isabs(line) else os.path.join(base_dir, line)
        f.write(full_path + "\n")

print("Fixed", len(lines), "paths.")