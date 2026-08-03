import os
from PIL import Image

base_path = r"C:\Users\Admin\.cache\kagglehub\datasets\mantasu\glasses-and-coverings\versions\2\glasses-and-coverings"

for folder in ["covering", "sunglasses"]:
    folder_path = os.path.join(base_path, folder)
    files = os.listdir(folder_path)[:5]
    print(f"\n--- {folder} sample sizes ---")
    for fname in files:
        img = Image.open(os.path.join(folder_path, fname))
        print(fname, "->", img.size)