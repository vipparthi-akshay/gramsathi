"""Fraud detection module for GramSathi.

Provides Isolation Forest and Autoencoder-based anomaly detection
with real-time scoring and batch processing capabilities.
"""

import numpy as np
import pandas as pd
import json
import logging
from typing import Dict, List, Optional, Tuple, Union
from datetime import datetime, timedelta
from dataclasses import dataclass, field, asdict

from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer

import joblib

logger = logging.getLogger(__name__)

try:
    import tensorflow as tf
    from tensorflow import keras
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    logger.warning("TensorFlow not available. Autoencoder model disabled.")


@dataclass
class FraudAlert:
    alert_id: str
    application_id: str
    fraud_score: float
    anomaly_type: str
    contributing_features: Dict[str, float]
    timestamp: str
    severity: str
    recommendation: str

    def to_dict(self) -> dict:
        return asdict(self)

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=2)


@dataclass
class FraudConfig:
    contamination: float = 0.05
    n_estimators: int = 200
    max_samples: Union[int, float] = "auto"
    random_state: int = 42
    autoencoder_encoding_dim: int = 16
    autoencoder_epochs: int = 100
    autoencoder_batch_size: int = 256
    alert_threshold: float = 0.85
    window_hours: int = 24
    rate_limit_per_ip: int = 10


FEATURE_COLUMNS = [
    "application_count_24h", "application_count_7d",
    "hour_of_day", "is_night_application",
    "same_ip_count_24h", "same_phone_count_24h",
    "geo_velocity_kmh", "is_vpn_or_proxy",
    "document_size_kb", "document_hash_frequency",
    "income_to_asset_ratio", "land_record_consistency",
    "age_years", "family_size",
    "num_documents_submitted", "submission_time_seconds",
    "has_mobile_verified", "has_email_verified",
    "device_fingerprint_entropy", "browser_fingerprint_entropy"
]

CATEGORICAL_FEATURES = []
NUMERIC_FEATURES = FEATURE_COLUMNS


class IsolationForestDetector:
    """Isolation Forest based anomaly detector for fraud detection."""

    def __init__(self, config: Optional[FraudConfig] = None):
        self.config = config or FraudConfig()
        self.scaler = None
        self.model = None
        self._fitted = False

    def build_preprocessor(self) -> ColumnTransformer:
        return ColumnTransformer(
            transformers=[
                ("num", Pipeline([
                    ("imputer", SimpleImputer(strategy="median")),
                    ("scaler", StandardScaler())
                ]), NUMERIC_FEATURES)
            ],
            remainder="drop"
        )

    def build_model(self) -> IsolationForest:
        return IsolationForest(
            contamination=self.config.contamination,
            n_estimators=self.config.n_estimators,
            max_samples=self.config.max_samples,
            random_state=self.config.random_state,
            n_jobs=-1,
            bootstrap=True
        )

    def fit(self, X: pd.DataFrame) -> "IsolationForestDetector":
        logger.info(f"Fitting IsolationForest on {len(X)} samples...")
        self.preprocessor = self.build_preprocessor()
        X_processed = self.preprocessor.fit_transform(X)

        self.model = self.build_model()
        self.model.fit(X_processed)

        self._fitted = True
        logger.info("IsolationForest training complete.")
        return self

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        if not self._fitted:
            raise ValueError("Model not fitted. Call fit() first.")
        X_processed = self.preprocessor.transform(X)
        return self.model.predict(X_processed)

    def score_samples(self, X: pd.DataFrame) -> np.ndarray:
        if not self._fitted:
            raise ValueError("Model not fitted. Call fit() first.")
        X_processed = self.preprocessor.transform(X)
        scores = self.model.score_samples(X_processed)
        return -scores

    def feature_contributions(self, X: pd.DataFrame) -> pd.DataFrame:
        if not self._fitted:
            raise ValueError("Model not fitted. Call fit() first.")
        X_processed = self.preprocessor.transform(X)
        scores = self.model.score_samples(X_processed)
        feature_names = self.preprocessor.get_feature_names_out()

        contributions = []
        for i in range(len(X)):
            contributions.append({
                name: float(score)
                for name, score in zip(feature_names, scores[i])
            })

        return pd.DataFrame(contributions, index=X.index)

    def save(self, path: str):
        if self.model is None:
            raise ValueError("No model to save.")
        artifacts = {
            "model": self.model,
            "preprocessor": self.preprocessor,
            "config": self.config
        }
        joblib.dump(artifacts, path)
        logger.info(f"Model saved to {path}")

    @classmethod
    def load(cls, path: str) -> "IsolationForestDetector":
        artifacts = joblib.load(path)
        detector = cls(config=artifacts.get("config"))
        detector.model = artifacts["model"]
        detector.preprocessor = artifacts["preprocessor"]
        detector._fitted = True
        logger.info(f"Model loaded from {path}")
        return detector


class AutoencoderDetector:
    """Autoencoder-based anomaly detector for fraud detection."""

    def __init__(self, config: Optional[FraudConfig] = None):
        if not TF_AVAILABLE:
            raise RuntimeError("TensorFlow is required for AutoencoderDetector")
        self.config = config or FraudConfig()
        self.scaler = None
        self.model = None
        self._input_dim = None
        self._fitted = False

    def build_autoencoder(self, input_dim: int) -> keras.Model:
        encoding_dim = self.config.autoencoder_encoding_dim

        input_layer = keras.layers.Input(shape=(input_dim,))
        encoded = keras.layers.Dense(64, activation="relu")(input_layer)
        encoded = keras.layers.Dense(32, activation="relu")(encoded)
        encoded = keras.layers.Dense(encoding_dim, activation="relu")(encoded)

        decoded = keras.layers.Dense(32, activation="relu")(encoded)
        decoded = keras.layers.Dense(64, activation="relu")(decoded)
        decoded = keras.layers.Dense(input_dim, activation="linear")(decoded)

        autoencoder = keras.Model(inputs=input_layer, outputs=decoded)
        autoencoder.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss="mse"
        )
        return autoencoder

    def fit(self, X: pd.DataFrame, validation_split: float = 0.1) -> "AutoencoderDetector":
        logger.info(f"Fitting Autoencoder on {len(X)} samples...")

        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X.select_dtypes(include=[np.number]))

        self._input_dim = X_scaled.shape[1]
        self.model = self.build_autoencoder(self._input_dim)

        early_stopping = keras.callbacks.EarlyStopping(
            monitor="val_loss", patience=10, restore_best_weights=True
        )
        reduce_lr = keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss", factor=0.5, patience=5, min_lr=1e-6
        )

        self.model.fit(
            X_scaled, X_scaled,
            validation_split=validation_split,
            epochs=self.config.autoencoder_epochs,
            batch_size=self.config.autoencoder_batch_size,
            callbacks=[early_stopping, reduce_lr],
            verbose=1
        )

        self._fitted = True
        logger.info("Autoencoder training complete.")
        return self

    def reconstruction_error(self, X: pd.DataFrame) -> np.ndarray:
        if not self._fitted:
            raise ValueError("Model not fitted. Call fit() first.")
        X_scaled = self.scaler.transform(X.select_dtypes(include=[np.number]))
        X_reconstructed = self.model.predict(X_scaled, verbose=0)
        mse = np.mean(np.square(X_scaled - X_reconstructed), axis=1)
        return mse

    def score_samples(self, X: pd.DataFrame) -> np.ndarray:
        return self.reconstruction_error(X)

    def predict(self, X: pd.DataFrame, threshold: Optional[float] = None) -> np.ndarray:
        errors = self.reconstruction_error(X)
        if threshold is None:
            threshold = np.percentile(errors, 95)
        return np.where(errors > threshold, -1, 1)

    def save(self, path: str):
        if self.model is None:
            raise ValueError("No model to save.")
        self.model.save(f"{path}_autoencoder")
        joblib.dump({"scaler": self.scaler, "config": self.config}, f"{path}_metadata.pkl")
        logger.info(f"Autoencoder saved to {path}")

    @classmethod
    def load(cls, path: str) -> "AutoencoderDetector":
        if not TF_AVAILABLE:
            raise RuntimeError("TensorFlow is required for AutoencoderDetector")
        metadata = joblib.load(f"{path}_metadata.pkl")
        detector = cls(config=metadata["config"])
        detector.scaler = metadata["scaler"]
        detector.model = keras.models.load_model(f"{path}_autoencoder")
        detector._input_dim = detector.model.input_shape[-1]
        detector._fitted = True
        logger.info(f"Autoencoder loaded from {path}")
        return detector


class EnsembleFraudDetector:
    """Ensemble detector combining Isolation Forest and Autoencoder."""

    def __init__(self, config: Optional[FraudConfig] = None):
        self.config = config or FraudConfig()
        self.isolation_forest = IsolationForestDetector(self.config)
        self.autoencoder = None
        self._autoencoder_enabled = TF_AVAILABLE
        self._fitted = False

        if self._autoencoder_enabled:
            self.autoencoder = AutoencoderDetector(self.config)

    def fit(self, X: pd.DataFrame) -> "EnsembleFraudDetector":
        logger.info("Fitting EnsembleFraudDetector...")
        self.isolation_forest.fit(X)
        if self._autoencoder_enabled and self.autoencoder is not None:
            self.autoencoder.fit(X)
        self._fitted = True
        return self

    def score_samples(self, X: pd.DataFrame) -> np.ndarray:
        if not self._fitted:
            raise ValueError("Model not fitted. Call fit() first.")

        if_scores = self.isolation_forest.score_samples(X)
        if_scores = (if_scores - if_scores.min()) / (if_scores.max() - if_scores.min() + 1e-10)

        if self._autoencoder_enabled and self.autoencoder is not None:
            ae_scores = self.autoencoder.score_samples(X)
            ae_scores = (ae_scores - ae_scores.min()) / (ae_scores.max() - ae_scores.min() + 1e-10)
            ensemble_scores = 0.6 * if_scores + 0.4 * ae_scores
        else:
            ensemble_scores = if_scores

        return ensemble_scores

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        scores = self.score_samples(X)
        threshold = np.percentile(scores, 95)
        return np.where(scores > threshold, -1, 1)

    def generate_alerts(
        self,
        df: pd.DataFrame,
        application_ids: List[str],
        threshold: Optional[float] = None
    ) -> List[FraudAlert]:
        """Generate fraud alerts for high-scoring applications."""
        scores = self.score_samples(df)
        if threshold is None:
            threshold = np.percentile(scores, 97)

        alerts = []
        for i, (idx, row) in enumerate(df.iterrows()):
            if scores[i] > threshold:
                alert = FraudAlert(
                    alert_id=f"FRAUD_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{idx}",
                    application_id=application_ids[i] if i < len(application_ids) else str(idx),
                    fraud_score=float(scores[i]),
                    anomaly_type="isolation_forest",
                    contributing_features=self._get_top_features(row, scores[i]),
                    timestamp=datetime.utcnow().isoformat(),
                    severity="HIGH" if scores[i] > np.percentile(scores, 99) else "MEDIUM",
                    recommendation=self._get_recommendation(scores[i])
                )
                alerts.append(alert)

        alerts.sort(key=lambda a: a.fraud_score, reverse=True)
        return alerts

    def _get_top_features(self, row: pd.Series, score: float, top_k: int = 5) -> Dict[str, float]:
        contributions = {}
        for col in row.index:
            if isinstance(row[col], (int, float)):
                contributions[col] = float(abs(row[col]) * score)
        sorted_features = sorted(contributions.items(), key=lambda x: x[1], reverse=True)
        return dict(sorted_features[:top_k])

    def _get_recommendation(self, score: float) -> str:
        if score > 0.95:
            return "Block application and flag for manual review"
        elif score > 0.90:
            return "Send for enhanced verification (document re-upload + video KYC)"
        elif score > 0.85:
            return "Flag for review; request additional documentation"
        else:
            return "Monitor in watchlist"

    def save(self, path: str):
        self.isolation_forest.save(f"{path}_iforest.pkl")
        if self._autoencoder_enabled and self.autoencoder is not None:
            self.autoencoder.save(f"{path}_autoencoder")
        logger.info(f"Ensemble detector saved to {path}")

    @classmethod
    def load(cls, path: str) -> "EnsembleFraudDetector":
        config = FraudConfig()
        detector = cls(config=config)
        detector.isolation_forest = IsolationForestDetector.load(f"{path}_iforest.pkl")
        if TF_AVAILABLE:
            try:
                detector.autoencoder = AutoencoderDetector.load(f"{path}_autoencoder")
            except Exception:
                logger.warning("Could not load autoencoder, using IF only")
                detector._autoencoder_enabled = False
        detector._fitted = True
        return detector


def generate_synthetic_fraud_data(n_samples: int = 10000, fraud_ratio: float = 0.05, seed: int = 42) -> pd.DataFrame:
    """Generate synthetic fraud detection training data.

    Args:
        n_samples: Number of samples.
        fraud_ratio: Proportion of fraudulent cases.
        seed: Random seed.

    Returns:
        DataFrame with fraud detection features and ground truth.
    """
    rng = np.random.default_rng(seed)
    n_fraud = int(n_samples * fraud_ratio)
    n_benign = n_samples - n_fraud

    data = []

    for _ in range(n_benign):
        row = {
            "application_count_24h": max(0, int(rng.poisson(1))),
            "application_count_7d": max(0, int(rng.poisson(3))),
            "hour_of_day": int(rng.integers(6, 22)),
            "is_night_application": 0,
            "same_ip_count_24h": max(0, int(rng.poisson(0.3))),
            "same_phone_count_24h": max(0, int(rng.poisson(0.2))),
            "geo_velocity_kmh": rng.exponential(5),
            "is_vpn_or_proxy": 0,
            "document_size_kb": rng.lognormal(4, 0.5),
            "document_hash_frequency": rng.exponential(0.1),
            "income_to_asset_ratio": rng.lognormal(0, 0.3),
            "land_record_consistency": rng.uniform(0.8, 1.0),
            "age_years": int(rng.integers(18, 80)),
            "family_size": max(1, int(rng.poisson(4))),
            "num_documents_submitted": int(rng.integers(2, 6)),
            "submission_time_seconds": rng.lognormal(6, 0.5),
            "has_mobile_verified": 1,
            "has_email_verified": int(rng.binomial(1, 0.7)),
            "device_fingerprint_entropy": rng.uniform(3.5, 5.5),
            "browser_fingerprint_entropy": rng.uniform(3.0, 5.0),
            "is_fraud": 0
        }
        data.append(row)

    for _ in range(n_fraud):
        row = {
            "application_count_24h": max(0, int(rng.poisson(8))),
            "application_count_7d": max(0, int(rng.poisson(25))),
            "hour_of_day": int(rng.integers(0, 5) if rng.random() > 0.5 else rng.integers(22, 24)),
            "is_night_application": int(rng.random() > 0.6),
            "same_ip_count_24h": max(0, int(rng.poisson(5))),
            "same_phone_count_24h": max(0, int(rng.poisson(3))),
            "geo_velocity_kmh": rng.exponential(50) + 20,
            "is_vpn_or_proxy": int(rng.random() > 0.7),
            "document_size_kb": rng.lognormal(3, 1.5),
            "document_hash_frequency": rng.exponential(5) + 1,
            "income_to_asset_ratio": rng.lognormal(1, 1),
            "land_record_consistency": rng.uniform(0, 0.4),
            "age_years": int(rng.integers(18, 80)),
            "family_size": max(1, int(rng.poisson(3))),
            "num_documents_submitted": int(rng.integers(1, 3)),
            "submission_time_seconds": rng.lognormal(4, 1.0),
            "has_mobile_verified": int(rng.binomial(1, 0.3)),
            "has_email_verified": int(rng.binomial(1, 0.2)),
            "device_fingerprint_entropy": rng.uniform(1.0, 3.0),
            "browser_fingerprint_entropy": rng.uniform(1.0, 2.5),
            "is_fraud": 1
        }
        data.append(row)

    df = pd.DataFrame(data)
    rng.shuffle(df.values)
    return df


def real_time_scoring_endpoint(
    detector: EnsembleFraudDetector,
    application_data: pd.DataFrame,
    application_id: str
) -> FraudAlert:
    """Score a single application in real-time and generate alert if needed.

    Args:
        detector: Trained EnsembleFraudDetector.
        application_data: Single-row DataFrame with application features.
        application_id: Unique application identifier.

    Returns:
        FraudAlert if score exceeds threshold, None otherwise.
    """
    score = detector.score_samples(application_data)[0]
    threshold = 0.85

    if score > threshold:
        return FraudAlert(
            alert_id=f"FRAUD_REALTIME_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{application_id}",
            application_id=application_id,
            fraud_score=float(score),
            anomaly_type="ensemble",
            contributing_features={},
            timestamp=datetime.utcnow().isoformat(),
            severity="HIGH" if score > 0.95 else "MEDIUM",
            recommendation=detector._get_recommendation(score)
        )
    return None


def batch_process(
    detector: EnsembleFraudDetector,
    df: pd.DataFrame,
    batch_size: int = 1000
) -> pd.DataFrame:
    """Process historical data in batches for fraud scoring.

    Args:
        detector: Trained EnsembleFraudDetector.
        df: DataFrame with application features.
        batch_size: Number of records per batch.

    Returns:
        DataFrame with fraud scores appended.
    """
    scores = []
    for start in range(0, len(df), batch_size):
        batch = df.iloc[start:start + batch_size]
        batch_scores = detector.score_samples(batch)
        scores.extend(batch_scores.tolist())
        logger.info(f"Processed batch {start//batch_size + 1}: {len(batch)} records")

    result = df.copy()
    result["fraud_score"] = scores
    result["is_anomaly"] = (result["fraud_score"] > result["fraud_score"].quantile(0.95)).astype(int)
    return result


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

    print("Generating synthetic fraud detection data...")
    df = generate_synthetic_fraud_data(n_samples=5000)
    print(f"Generated {len(df)} records ({df['is_fraud'].sum()} fraudulent)")

    X = df.drop(columns=["is_fraud"])
    y = df["is_fraud"]

    print("Training EnsembleFraudDetector...")
    detector = EnsembleFraudDetector()
    detector.fit(X)

    scores = detector.score_samples(X)
    print(f"Fraud scores: min={scores.min():.4f}, max={scores.max():.4f}, mean={scores.mean():.4f}")

    alerts = detector.generate_alerts(X.head(100), [f"APP_{i}" for i in range(100)])
    print(f"Generated {len(alerts)} alerts from 100 applications")
    if alerts:
        print(f"Top alert score: {alerts[0].fraud_score:.4f}")

    detector.save("C:\\Users\\User\\gramsathi-ai\\ml\\fraud-detection\\models\\fraud_detector")
    print("Model saved.")
