import os
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras import layers, models
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt

os.environ["TF_XLA_FLAGS"] = "--tf_xla_auto_jit=0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

gpus = tf.config.list_physical_devices('GPU')
if gpus:
    for gpu in gpus:
        tf.config.experimental.set_memory_growth(gpu, True)
    print("✅ GPU ready:", gpus)

# ==========================================
# 1. CONFIGURATION
# ==========================================
# Point this to your "images" folder
dataset_path = "./images"

IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 10 

# ==========================================
# 2. DATA PREPARATION (ALL BREEDS)
# ==========================================
print("Processing data...")

filenames = []
labels = []

# List of known Cat breeds in this dataset (for display purposes only later)
CAT_BREEDS = {
    'Abyssinian', 'Bengal', 'Birman', 'Bombay', 'British_Shorthair', 
    'Egyptian_Mau', 'Maine_Coon', 'Persian', 'Ragdoll', 'Russian_Blue', 
    'Siamese', 'Sphynx'
}

if not os.path.exists(dataset_path):
    print(f"ERROR: Folder {dataset_path} not found!")
    exit()

all_files = os.listdir(dataset_path)

for file in all_files:
    if file.endswith(".jpg"):
        # Parse filename: "Siamese_154.jpg" -> "Siamese"
        name_parts = file.split('_')[:-1]
        breed_name = "_".join(name_parts)
        
        # Some filenames in this dataset have slightly different formatting
        # This check ensures we don't grab broken files with no name
        if breed_name != "":
            filenames.append(os.path.join(dataset_path, file))
            labels.append(breed_name)

print(f"Total Images Found: {len(filenames)}")
print(f"Unique Breeds: {len(set(labels))} (Should be ~37)")

# Create DataFrame
df = pd.DataFrame({'filename': filenames, 'label': labels})

# Stratified Split (Keeps the same % of cats/dogs in train and val)
train_df, val_df = train_test_split(df, test_size=0.2, random_state=42, stratify=df['label'])

# ==========================================
# 3. CREATE DATASETS
# ==========================================
def process_path(file_path, label_index):
    img = tf.io.read_file(file_path)
    img = tf.io.decode_jpeg(img, channels=3)
    img = tf.image.resize(img, [IMG_SIZE, IMG_SIZE])
    # MobileNetV2 preprocessing: [-1, 1]
    img = tf.keras.applications.mobilenet_v2.preprocess_input(img)
    return img, label_index

# Create mappings
label_to_index = {name: i for i, name in enumerate(sorted(set(labels)))}
index_to_label = {i: name for name, i in label_to_index.items()}
NUM_CLASSES = len(label_to_index)

# Build Train DS
train_paths = train_df['filename'].values
train_indices = [label_to_index[l] for l in train_df['label']]
train_ds = tf.data.Dataset.from_tensor_slices((train_paths, train_indices))
train_ds = train_ds.map(process_path, num_parallel_calls=tf.data.AUTOTUNE)
train_ds = train_ds.shuffle(1000).batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)

# Build Val DS
val_paths = val_df['filename'].values
val_indices = [label_to_index[l] for l in val_df['label']]
val_ds = tf.data.Dataset.from_tensor_slices((val_paths, val_indices))
val_ds = val_ds.map(process_path, num_parallel_calls=tf.data.AUTOTUNE)
val_ds = val_ds.batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)

# ==========================================
# 4. BUILD MODEL
# ==========================================
print(f"Building MobileNetV2 for {NUM_CLASSES} breeds...")

base_model = tf.keras.applications.MobileNetV2(
    input_shape=(IMG_SIZE, IMG_SIZE, 3),
    include_top=False,
    weights='imagenet'
)
base_model.trainable = False 

model = models.Sequential([
    layers.Input(shape=(IMG_SIZE, IMG_SIZE, 3)),
    layers.RandomFlip("horizontal"),
    layers.RandomRotation(0.1),
    base_model,
    layers.GlobalAveragePooling2D(),
    layers.Dropout(0.2),
    layers.Dense(NUM_CLASSES, activation='softmax')
])

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.0001),
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

# ==========================================
# 5. TRAIN
# ==========================================
print("Starting training...")
history = model.fit(train_ds, validation_data=val_ds, epochs=EPOCHS)

# ==========================================
# 6. TEST & SAVE
# ==========================================
model.save("pawlink_pet_classifier.keras") # Renamed since it handles both now

print("\n--- QUICK TEST RESULT ---")
test_batch = next(iter(val_ds))
test_images, test_labels = test_batch
predictions = model.predict(test_images)

for i in range(3):
    true_breed = index_to_label[test_labels[i].numpy()]
    predicted_index = np.argmax(predictions[i])
    pred_breed = index_to_label[predicted_index]
    confidence = 100 * np.max(predictions[i])
    
    # Check species for display
    species_type = "Cat" if pred_breed in CAT_BREEDS else "Dog"
    
    print(f"True: {true_breed} | Predicted: {pred_breed} [{species_type}] ({confidence:.1f}%)")