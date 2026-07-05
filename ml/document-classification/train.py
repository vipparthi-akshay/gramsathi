"""Document type classifier for GramSathi.

Classifies uploaded documents into categories:
aadhaar, income_certificate, land_record, bank_passbook,
passport_photo, signature, other.

Uses TensorFlow/Keras with MobileNetV2 backbone,
with Cloud Vision API fallback.
"""

import os
import io
import json
import logging
import numpy as np
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import uuid

logger = logging.getLogger(__name__)

try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers, models, applications, callbacks
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    keras = None
    logger.warning("TensorFlow not available. Using Cloud Vision API fallback only.")

DOCUMENT_CLASSES = [
    "aadhaar",
    "income_certificate",
    "land_record",
    "bank_passbook",
    "passport_photo",
    "signature",
    "other"
]

NUM_CLASSES = len(DOCUMENT_CLASSES)
IMG_SIZE = 224
IMG_SHAPE = (IMG_SIZE, IMG_SIZE, 3)


def build_mobilenetv2_classifier(
    num_classes: int = NUM_CLASSES,
    input_shape: Tuple[int, int, int] = IMG_SHAPE,
    dropout_rate: float = 0.3,
    trainable_base: bool = False
) -> tf.keras.Model:
    """Build document classifier using MobileNetV2 backbone.

    Args:
        num_classes: Number of document categories.
        input_shape: Input image dimensions (h, w, c).
        dropout_rate: Dropout rate for regularization.
        trainable_base: Whether to fine-tune the base model.

    Returns:
        Compiled Keras model.
    """
    base_model = applications.MobileNetV2(
        weights="imagenet",
        include_top=False,
        input_shape=input_shape
    )
    base_model.trainable = trainable_base

    inputs = keras.Input(shape=input_shape)
    x = applications.mobilenet_v2.preprocess_input(inputs)
    x = base_model(x, training=trainable_base)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(dropout_rate)(x)
    x = layers.Dense(256, activation="relu")(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(dropout_rate)(x)
    outputs = layers.Dense(num_classes, activation="softmax")(x)

    model = keras.Model(inputs=inputs, outputs=outputs)

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss="categorical_crossentropy",
        metrics=["accuracy", keras.metrics.Precision(), keras.metrics.Recall()]
    )

    return model


def build_efficientnet_classifier(
    num_classes: int = NUM_CLASSES,
    input_shape: Tuple[int, int, int] = IMG_SHAPE,
    dropout_rate: float = 0.3,
    trainable_base: bool = False
) -> tf.keras.Model:
    """Build document classifier using EfficientNetB0 backbone."""
    base_model = applications.EfficientNetB0(
        weights="imagenet",
        include_top=False,
        input_shape=input_shape
    )
    base_model.trainable = trainable_base

    inputs = keras.Input(shape=input_shape)
    x = applications.efficientnet.preprocess_input(inputs)
    x = base_model(x, training=trainable_base)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(dropout_rate)(x)
    x = layers.Dense(512, activation="relu")(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(dropout_rate)(x)
    outputs = layers.Dense(num_classes, activation="softmax")(x)

    model = keras.Model(inputs=inputs, outputs=outputs)

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss="categorical_crossentropy",
        metrics=["accuracy", keras.metrics.Precision(), keras.metrics.Recall()]
    )

    return model


def data_augmentation() -> keras.Sequential:
    """Create data augmentation pipeline for document images."""
    return keras.Sequential([
        layers.RandomRotation(0.05),
        layers.RandomTranslation(0.05, 0.05),
        layers.RandomZoom(0.1),
        layers.RandomBrightness(0.1),
        layers.RandomContrast(0.1),
    ])


def generate_synthetic_document(
    doc_type: str,
    width: int = 800,
    height: int = 600
) -> Image.Image:
    """Generate a synthetic document image for training.

    Args:
        doc_type: Document class name.
        width: Image width in pixels.
        height: Image height in pixels.

    Returns:
        PIL Image of synthetic document.
    """
    img = Image.new("RGB", (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    try:
        font_large = ImageFont.truetype("arial.ttf", 32)
        font_medium = ImageFont.truetype("arial.ttf", 24)
        font_small = ImageFont.truetype("arial.ttf", 18)
    except OSError:
        font_large = ImageFont.load_default()
        font_medium = ImageFont.load_default()
        font_small = ImageFont.load_default()

    np.random.seed(hash(doc_type + str(uuid.uuid4())) % 2**32)

    header_color = {
        "aadhaar": (255, 153, 51),
        "income_certificate": (0, 119, 255),
        "land_record": (0, 153, 76),
        "bank_passbook": (0, 102, 204),
        "passport_photo": (255, 255, 255),
        "signature": (255, 255, 255),
        "other": (128, 128, 128)
    }.get(doc_type, (200, 200, 200))

    if doc_type == "aadhaar":
        draw.rectangle([0, 0, width, 80], fill=(255, 153, 51))
        draw.text((width // 2 - 100, 20), "AADHAAR CARD", fill=(0, 0, 0), font=font_large)
        draw.text((50, 120), "Government of India", fill=(100, 100, 100), font=font_medium)
        fake_aadhaar = f"{np.random.randint(1000, 9999)} {np.random.randint(1000, 9999)} {np.random.randint(1000, 9999)}"
        draw.text((50, 180), fake_aadhaar, fill=(0, 0, 0), font=font_large)
        draw.text((50, 260), f"Name: {'NAME PLACEHOLDER'}", fill=(0, 0, 0), font=font_medium)
        draw.text((50, 300), "DOB: 01/01/1990", fill=(0, 0, 0), font=font_medium)
        draw.text((50, 340), "Gender: Male", fill=(0, 0, 0), font=font_medium)
        draw.rectangle([width - 160, height - 160, width - 10, height - 10], fill=(220, 220, 220))
        draw.text((width - 140, height - 100), "PHOTO", fill=(150, 150, 150), font=font_medium)

    elif doc_type == "income_certificate":
        draw.rectangle([0, 0, width, 60], fill=header_color)
        draw.text((width // 2 - 120, 10), "INCOME CERTIFICATE", fill=(255, 255, 255), font=font_large)
        draw.text((50, 100), "This is to certify that", fill=(0, 0, 0), font=font_medium)
        draw.text((50, 140), "Shri/Smt. ___________________", fill=(0, 0, 0), font=font_medium)
        draw.text((50, 180), f"S/o, D/o, W/o ___________________", fill=(0, 0, 0), font=font_medium)
        draw.text((50, 220), f"Annual Income: Rs. {np.random.randint(50000, 500000)}", fill=(0, 0, 0), font=font_medium)
        draw.text((50, 300), "Issuing Authority: Tehsildar", fill=(0, 0, 0), font=font_medium)
        draw.text((50, 340), f"Date: 01/01/{np.random.randint(2020, 2025)}", fill=(0, 0, 0), font=font_medium)
        draw.rectangle([50, 400, 200, 430], fill=(0, 119, 255))
        draw.text((60, 405), "SIGNATURE", fill=(255, 255, 255), font=font_small)

    elif doc_type == "land_record":
        draw.rectangle([0, 0, width, 60], fill=header_color)
        draw.text((width // 2 - 100, 10), "LAND RECORD", fill=(255, 255, 255), font=font_large)
        draw.text((50, 100), "Record of Rights (RoR)", fill=(0, 0, 0), font=font_medium)
        draw.text((50, 140), f"Survey No: {np.random.randint(1, 500)}/{np.random.randint(1, 50)}", fill=(0, 0, 0), font=font_medium)
        draw.text((50, 180), f"Area: {np.random.uniform(0.5, 5):.2f} hectares", fill=(0, 0, 0), font=font_medium)
        draw.text((50, 220), "Owner: ___________________", fill=(0, 0, 0), font=font_medium)
        draw.text((50, 260), f"Village: {'VILLAGE NAME'}", fill=(0, 0, 0), font=font_medium)
        draw.text((50, 300), f"Tehsil: {'TEHSIL NAME'}", fill=(0, 0, 0), font=font_medium)
        draw.text((50, 340), "Crop: Paddy / Wheat / Sugarcane", fill=(0, 0, 0), font=font_medium)
        draw.text((50, 400), "Stamp & Signature", fill=(100, 100, 100), font=font_small)

    elif doc_type == "bank_passbook":
        draw.rectangle([0, 0, width, 60], fill=header_color)
        draw.text((width // 2 - 100, 10), "BANK PASSBOOK", fill=(255, 255, 255), font=font_large)
        draw.text((50, 90), f"{'BANK NAME'} - {'BRANCH'}", fill=(0, 0, 0), font=font_medium)
        draw.text((50, 130), f"Account No: {'XXXX'}{np.random.randint(1000, 9999)}", fill=(0, 0, 0), font=font_medium)
        draw.text((50, 170), "Name: ___________________", fill=(0, 0, 0), font=font_medium)
        draw.rectangle([50, 220, width - 50, 320], outline=(0, 0, 0))
        draw.text((60, 225), "Date", fill=(0, 0, 0), font=font_small)
        draw.text((160, 225), "Particulars", fill=(0, 0, 0), font=font_small)
        draw.text((350, 225), "Debit", fill=(0, 0, 0), font=font_small)
        draw.text((450, 225), "Credit", fill=(0, 0, 0), font=font_small)
        draw.text((550, 225), "Balance", fill=(0, 0, 0), font=font_small)
        for i in range(5):
            y = 255 + i * 20
            draw.text((60, y), f"01/0{i+1}", fill=(0, 0, 0), font=font_small)
            draw.text((160, y), f"TRANSACTION {i+1}", fill=(0, 0, 0), font=font_small)
            draw.text((450, y), f"{np.random.randint(1000, 50000)}", fill=(0, 0, 0), font=font_small)

    elif doc_type == "passport_photo":
        draw.rectangle([width // 4, 30, 3 * width // 4, height - 30], fill=(200, 220, 255))
        draw.ellipse([width // 2 - 80, height // 2 - 130, width // 2 + 80, height // 2 + 30], fill=(220, 180, 140))
        draw.rectangle([width // 2 - 30, height // 2 + 20, width // 2 + 30, height // 2 + 80], fill=(150, 150, 180))
        draw.rectangle([width // 4 - 10, 20, 3 * width // 4 + 10, height - 20], outline=(0, 0, 0), width=3)

    elif doc_type == "signature":
        img = Image.new("RGB", (width, height), color=(255, 255, 255))
        draw = ImageDraw.Draw(img)
        points = []
        cx, cy = width // 2, height // 2
        for t in np.linspace(0, 4 * np.pi, 200):
            r = 80 + 40 * np.sin(3 * t) + 20 * np.sin(7 * t)
            x = cx + r * np.cos(t) + np.random.normal(0, 5)
            y = cy + r * np.sin(t) + np.random.normal(0, 5)
            points.append((x, y))
        for i in range(len(points) - 1):
            draw.line([points[i], points[i + 1]], fill=(0, 0, 0), width=3 + int(np.random.uniform(0, 3)))
        draw.text((width // 2 - 80, height - 40), "Signature", fill=(100, 100, 100), font=font_small)

    else:
        draw.rectangle([0, 0, width, 60], fill=header_color)
        draw.text((width // 2 - 60, 10), "DOCUMENT", fill=(255, 255, 255), font=font_large)
        draw.text((50, 120), "Miscellaneous Document", fill=(0, 0, 0), font=font_medium)
        draw.text((50, 180), "Reference: ___________________", fill=(0, 0, 0), font=font_medium)
        draw.text((50, 240), "Purpose: ___________________", fill=(0, 0, 0), font=font_medium)
        draw.text((50, 300), "Date: ___________________", fill=(0, 0, 0), font=font_medium)

    img = img.resize((IMG_SIZE, IMG_SIZE), Image.LANCZOS)
    img = img.filter(ImageFilter.GaussianBlur(radius=np.random.uniform(0, 0.5)))

    if np.random.random() > 0.7:
        img = img.rotate(np.random.uniform(-5, 5), expand=False, fillcolor=(255, 255, 255))

    if np.random.random() > 0.6:
        brightness = np.random.uniform(0.8, 1.2)
        img = img.point(lambda p: min(255, int(p * brightness)))

    return img


def generate_synthetic_dataset(
    samples_per_class: int = 500,
    output_dir: Optional[str] = None
) -> Tuple[np.ndarray, np.ndarray]:
    """Generate full synthetic document classification dataset.

    Args:
        samples_per_class: Number of images per class.
        output_dir: Optional directory to save images.

    Returns:
        Tuple of (images array, one-hot labels array).
    """
    total = samples_per_class * NUM_CLASSES
    images = np.zeros((total, IMG_SIZE, IMG_SIZE, 3), dtype=np.float32)
    labels = np.zeros((total, NUM_CLASSES), dtype=np.float32)

    idx = 0
    for class_idx, doc_type in enumerate(DOCUMENT_CLASSES):
        logger.info(f"Generating {samples_per_class} samples for {doc_type}...")
        for i in range(samples_per_class):
            img = generate_synthetic_document(doc_type)
            img_array = np.array(img, dtype=np.float32) / 255.0
            images[idx] = img_array
            labels[idx, class_idx] = 1.0

            if output_dir:
                class_dir = Path(output_dir) / doc_type
                class_dir.mkdir(parents=True, exist_ok=True)
                img.save(str(class_dir / f"{i:05d}.png"))

            idx += 1

    perm = np.random.permutation(total)
    return images[perm], labels[perm]


def train_document_classifier(
    output_path: str = "document_classifier",
    samples_per_class: int = 500,
    epochs: int = 20,
    batch_size: int = 32,
    validation_split: float = 0.2,
    use_efficientnet: bool = False,
    save_tfjs: bool = False
) -> tf.keras.Model:
    """Train the document type classifier.

    Args:
        output_path: Path prefix for saving model artifacts.
        samples_per_class: Training samples per document class.
        epochs: Number of training epochs.
        batch_size: Training batch size.
        validation_split: Fraction of data for validation.
        use_efficientnet: Use EfficientNet instead of MobileNetV2.
        save_tfjs: Export to TensorFlow.js format.

    Returns:
        Trained Keras model.
    """
    logger.info("Generating synthetic training data...")
    X, y = generate_synthetic_dataset(samples_per_class=samples_per_class)

    logger.info(f"Dataset shape: X={X.shape}, y={y.shape}")
    logger.info(f"Class distribution: {y.sum(axis=0).tolist()}")

    split = int(len(X) * (1 - validation_split))
    X_train, X_val = X[:split], X[split:]
    y_train, y_val = y[:split], y[split:]

    if use_efficientnet:
        model = build_efficientnet_classifier()
    else:
        model = build_mobilenetv2_classifier()

    augmenter = data_augmentation()

    def preprocess_and_augment(x, y):
        x = augmenter(x, training=True)
        return x, y

    train_dataset = tf.data.Dataset.from_tensor_slices((X_train, y_train))
    train_dataset = train_dataset.shuffle(10000).batch(batch_size).map(
        preprocess_and_augment, num_parallel_calls=tf.data.AUTOTUNE
    ).prefetch(tf.data.AUTOTUNE)

    val_dataset = tf.data.Dataset.from_tensor_slices((X_val, y_val))
    val_dataset = val_dataset.batch(batch_size).prefetch(tf.data.AUTOTUNE)

    checkpoint = callbacks.ModelCheckpoint(
        f"{output_path}_best.h5",
        monitor="val_accuracy",
        save_best_only=True,
        mode="max"
    )
    early_stop = callbacks.EarlyStopping(
        monitor="val_loss",
        patience=5,
        restore_best_weights=True
    )
    reduce_lr = callbacks.ReduceLROnPlateau(
        monitor="val_loss",
        factor=0.5,
        patience=3,
        min_lr=1e-6
    )

    logger.info("Starting model training...")
    history = model.fit(
        train_dataset,
        validation_data=val_dataset,
        epochs=epochs,
        callbacks=[checkpoint, early_stop, reduce_lr],
        verbose=1
    )

    model.save(f"{output_path}_final.h5")
    logger.info(f"Final model saved to {output_path}_final.h5")

    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    tflite_model = converter.convert()
    with open(f"{output_path}.tflite", "wb") as f:
        f.write(tflite_model)
    logger.info(f"TFLite model saved to {output_path}.tflite")

    if save_tfjs:
        try:
            import tensorflowjs as tfjs
            tfjs.converters.save_keras_model(model, f"{output_path}_tfjs")
            logger.info(f"TFJS model saved to {output_path}_tfjs")
        except ImportError:
            logger.warning("tensorflowjs not installed. Skipping TFJS export.")

    val_loss, val_acc, val_prec, val_rec = model.evaluate(val_dataset, verbose=0)
    logger.info(f"Validation results - Loss: {val_loss:.4f}, Acc: {val_acc:.4f}, "
                f"Precision: {val_prec:.4f}, Recall: {val_rec:.4f}")

    return model


def classify_document(
    image: Image.Image,
    model_path: Optional[str] = None,
    model: Optional[tf.keras.Model] = None,
    use_cloud_vision: bool = False
) -> Dict[str, float]:
    """Classify a document image.

    Args:
        image: PIL Image to classify.
        model_path: Path to saved model (if model not provided).
        model: Loaded Keras model (if model_path not provided).
        use_cloud_vision: Fallback to Cloud Vision API.

    Returns:
        Dictionary mapping class labels to confidence scores.
    """
    if use_cloud_vision:
        return classify_via_cloud_vision(image)

    if model is None:
        if model_path is None:
            raise ValueError("Either model or model_path must be provided.")
        model = keras.models.load_model(model_path)

    img = image.resize((IMG_SIZE, IMG_SIZE), Image.LANCZOS)
    img_array = np.array(img, dtype=np.float32) / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    predictions = model.predict(img_array, verbose=0)[0]
    result = {DOCUMENT_CLASSES[i]: float(predictions[i]) for i in range(NUM_CLASSES)}
    return result


def classify_via_cloud_vision(image: Image.Image) -> Dict[str, float]:
    """Fallback classification using Google Cloud Vision API.

    Args:
        image: PIL Image to classify.

    Returns:
        Dictionary mapping class labels to confidence scores.
    """
    try:
        from google.cloud import vision
        import io

        client = vision.ImageAnnotatorClient()
        byte_io = io.BytesIO()
        image.save(byte_io, format="PNG")
        content = byte_io.getvalue()

        vision_image = vision.Image(content=content)
        response = client.label_detection(image=vision_image, max_results=10)
        labels = response.label_annotations

        doc_keywords = {
            "aadhaar": ["aadhaar", "aadhar", "uidai", "identity"],
            "income_certificate": ["income", "certificate", "revenue"],
            "land_record": ["land", "survey", "property", "record"],
            "bank_passbook": ["bank", "passbook", "account", "banking"],
            "passport_photo": ["portrait", "face", "person", "passport"],
            "signature": ["signature", "handwriting", "autograph"]
        }

        scores = {cls: 0.01 for cls in DOCUMENT_CLASSES}
        for label in labels:
            desc = label.description.lower()
            score = label.score
            for doc_class, keywords in doc_keywords.items():
                for kw in keywords:
                    if kw in desc:
                        scores[doc_class] = max(scores[doc_class], score)
                        break

        total = sum(scores.values())
        if total > 0:
            for k in scores:
                scores[k] /= total

        return scores

    except ImportError:
        logger.error("google-cloud-vision not installed.")
        return {cls: 0.0 for cls in DOCUMENT_CLASSES}


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(levelname)s - %(message)s"
    )

    if not TF_AVAILABLE:
        logger.error("TensorFlow is required for training. Install with: pip install tensorflow==2.15.0")
        exit(1)

    model = train_document_classifier(
        samples_per_class=200,
        epochs=10,
        batch_size=32,
        output_path="C:\\Users\\User\\gramsathi-ai\\ml\\document-classification\\models\\doc_classifier"
    )

    print("Testing classification...")
    test_img = generate_synthetic_document("aadhaar")
    result = classify_document(test_img, model=model)
    predicted = max(result, key=result.get)
    print(f"Predicted: {predicted} (confidence: {result[predicted]:.4f})")
    print(f"All scores: {result}")

    print("Training complete.")
