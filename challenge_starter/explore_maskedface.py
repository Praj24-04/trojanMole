import os

base_path = r"F:\IEEE\kaggle_cache\datasets\ashishjangra27\face-mask-12k-images-dataset\versions\1\Face Mask Dataset"
train_path = os.path.join(base_path, "Train")

for item in os.listdir(train_path):
    print(item)