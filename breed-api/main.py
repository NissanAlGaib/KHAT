import json
import io
import os
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import tensorflow as tf

# Suppress TF warnings
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

app = FastAPI(title="PawLink Breed Classifier API", version="1.0.0")

# Allow all origins for local dev + Cloudflare tunnel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# Load model and labels on startup
# ==========================================
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "pawlink_pet_classifier.h5")
LABELS_PATH = os.path.join(os.path.dirname(__file__), "labels.json")

IMG_SIZE = 224

# Load labels
with open(LABELS_PATH, "r") as f:
    label_data = json.load(f)

LABELS = label_data["labels"]
CAT_BREEDS = set(label_data["cat_breeds"])

# Load model
print(f"Loading model from {MODEL_PATH}...")
try:
    # Try loading with Keras 3 (native in TF 2.16+)
    import keras
    model = keras.models.load_model(MODEL_PATH)
except Exception:
    # Fallback for mixed environments
    from tensorflow import keras
    model = keras.models.load_model(MODEL_PATH)

print(f"Model loaded. {len(LABELS)} breeds supported.")

def format_breed_name(raw_name: str) -> str:
    """Convert 'american_pit_bull_terrier' -> 'American Pit Bull Terrier'"""
    return raw_name.replace("_", " ").title()


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """Load image bytes, resize, and preprocess for MobileNetV2."""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize((IMG_SIZE, IMG_SIZE))
    img_array = np.array(img, dtype=np.float32)
    # MobileNetV2 preprocessing: scale to [-1, 1]
    img_array = tf.keras.applications.mobilenet_v2.preprocess_input(img_array)
    return np.expand_dims(img_array, axis=0)


@app.get("/")
async def root():
    return {
        "service": "PawLink Breed Classifier",
        "version": "1.0.0",
        "breeds_supported": len(LABELS),
        "status": "ready",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Accept an image and return breed prediction.
    Returns top 3 predictions with breed name, species, and confidence.
    """
    # Read file bytes first, then validate
    try:
        image_bytes = await file.read()

        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded")

        # Try to open as image — this is the real validation
        try:
            Image.open(io.BytesIO(image_bytes)).verify()
        except Exception:
            raise HTTPException(status_code=400, detail="File must be a valid image (JPEG, PNG, etc.)")

        # Preprocess
        img_array = preprocess_image(image_bytes)

        # Predict
        predictions = model.predict(img_array, verbose=0)[0]

        # Get top 3 predictions
        top_indices = np.argsort(predictions)[::-1][:3]
        results = []
        for idx in top_indices:
            breed_raw = LABELS[idx]
            results.append({
                "breed": format_breed_name(breed_raw),
                "breed_raw": breed_raw,
                "species": "cat" if breed_raw in CAT_BREEDS else "dog",
                "confidence": round(float(predictions[idx]) * 100, 2),
            })

        return {
            "success": True,
            "prediction": results[0],
            "top_3": results,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
