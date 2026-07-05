"""Training script for GramSathi scheme eligibility prediction model.

Supports Google Cloud Vertex AI AutoML Tables with fallback to
scikit-learn GradientBoostingClassifier (or RandomForest/LogisticRegression).

Usage:
    python -m trainer.train --model-type gradient_boosting --n-estimators 300
    python -m trainer.train --model-type vertex_ai --project-id my-project

Environment variables for Vertex AI:
    AIP_MODEL_DIR, AIP_DATA_FORMAT, AIP_TRAINING_DATA_URI, AIP_VALIDATION_DATA_URI
"""

import os
import argparse
import logging
import json
import sys
from typing import Dict, List, Optional, Tuple, Union
from datetime import datetime

import numpy as np
import pandas as pd

from sklearn.ensemble import (
    GradientBoostingClassifier,
    RandomForestClassifier
)
from sklearn.linear_model import LogisticRegression
from sklearn.multioutput import MultiOutputClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report
)

from trainer.data_pipeline import (
    generate_training_dataset,
    build_preprocessing_pipeline,
    load_from_dataframe,
    load_from_bigquery,
    validate_data,
    TARGET_COLUMNS,
    FEATURES
)

logger = logging.getLogger(__name__)

try:
    import joblib
    JOBLIB_AVAILABLE = True
except ImportError:
    JOBLIB_AVAILABLE = False

try:
    from google.cloud import aiplatform
    from google.cloud import storage
    GCP_AVAILABLE = True
except ImportError:
    GCP_AVAILABLE = False
    aiplatform = None
    storage = None

try:
    from google.cloud import monitoring_v3
    MONITORING_AVAILABLE = True
except ImportError:
    MONITORING_AVAILABLE = False

try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False


MODEL_REGISTRY = {
    "gradient_boosting": {
        "class": GradientBoostingClassifier,
        "default_params": {
            "n_estimators": 200,
            "max_depth": 5,
            "learning_rate": 0.1,
            "subsample": 0.8,
            "min_samples_leaf": 20,
            "random_state": 42
        }
    },
    "random_forest": {
        "class": RandomForestClassifier,
        "default_params": {
            "n_estimators": 300,
            "max_depth": 10,
            "min_samples_leaf": 10,
            "random_state": 42,
            "n_jobs": -1
        }
    },
    "logistic_regression": {
        "class": LogisticRegression,
        "default_params": {
            "C": 1.0,
            "penalty": "l2",
            "solver": "lbfgs",
            "max_iter": 1000,
            "random_state": 42,
            "n_jobs": -1
        }
    }
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="GramSathi Scheme Eligibility Model Trainer"
    )
    parser.add_argument(
        "--model-type",
        type=str,
        default="gradient_boosting",
        choices=list(MODEL_REGISTRY.keys()) + ["vertex_ai"],
        help="Type of model to train"
    )
    parser.add_argument(
        "--n-estimators",
        type=int,
        default=None,
        help="Number of estimators (for tree-based models)"
    )
    parser.add_argument(
        "--max-depth",
        type=int,
        default=None,
        help="Maximum tree depth"
    )
    parser.add_argument(
        "--learning-rate",
        type=float,
        default=None,
        help="Learning rate (for GradientBoosting)"
    )
    parser.add_argument(
        "--data-path",
        type=str,
        default=None,
        help="Path to training data CSV. If not provided, synthetic data is generated."
    )
    parser.add_argument(
        "--n-samples",
        type=int,
        default=100000,
        help="Number of synthetic samples to generate (if no data-path)"
    )
    parser.add_argument(
        "--test-split",
        type=float,
        default=0.2,
        help="Fraction of data for testing"
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="C:\\Users\\User\\gramsathi-ai\\ml\\eligibility-model\\models",
        help="Directory to save model artifacts"
    )
    parser.add_argument(
        "--export-to-gcs",
        type=str,
        default=None,
        help="GCS path to export model (e.g., gs://bucket/models/)"
    )
    parser.add_argument(
        "--project-id",
        type=str,
        default=None,
        help="GCP project ID (for Vertex AI)"
    )
    parser.add_argument(
        "--region",
        type=str,
        default="us-central1",
        help="GCP region"
    )
    parser.add_argument(
        "--bigquery-query",
        type=str,
        default=None,
        help="BigQuery SQL query to load training data"
    )
    parser.add_argument(
        "--log-metrics",
        action="store_true",
        default=False,
        help="Log metrics to Cloud Monitoring"
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed"
    )

    return parser.parse_args()


def log_to_cloud_monitoring(
    metrics: Dict[str, float],
    project_id: str,
    model_name: str = "eligibility_model"
):
    """Log training metrics to Google Cloud Monitoring.

    Args:
        metrics: Dictionary of metric name to value.
        project_id: GCP project ID.
        model_name: Name for the monitored resource.
    """
    if not MONITORING_AVAILABLE:
        logger.warning("google-cloud-monitoring not installed. Skipping metric logging.")
        return

    try:
        client = monitoring_v3.MetricServiceClient()
        project_name = f"projects/{project_id}"

        series = []
        for metric_name, metric_value in metrics.items():
            series.append(
                monitoring_v3.TimeSeries(
                    metric=monitoring_v3.Metric(
                        type=f"custom.googleapis.com/gram_sathi/{metric_name}",
                        labels={"model": model_name}
                    ),
                    resource=monitoring_v3.MonitoredResource(
                        type="global",
                        labels={"project_id": project_id}
                    ),
                    points=[
                        monitoring_v3.Point(
                            interval=monitoring_v3.TimeInterval(
                                end_time={"seconds": int(datetime.utcnow().timestamp())}
                            ),
                            value=monitoring_v3.TypedValue(double_value=metric_value)
                        )
                    ]
                )
            )

        client.create_time_series(name=project_name, time_series=series)
        logger.info(f"Logged {len(metrics)} metrics to Cloud Monitoring")
    except Exception as e:
        logger.error(f"Failed to log metrics to Cloud Monitoring: {e}")


def train_vertex_ai_model(
    args: argparse.Namespace,
    X_train: pd.DataFrame,
    y_train: pd.DataFrame,
    X_test: pd.DataFrame,
    y_test: pd.DataFrame
) -> object:
    """Train model using Vertex AI AutoML Tables.

    Args:
        args: Parsed command-line arguments.
        X_train, y_train, X_test, y_test: Data splits.

    Returns:
        Vertex AI model resource.
    """
    if not GCP_AVAILABLE:
        raise ImportError("google-cloud-aiplatform not installed")

    aiplatform.init(project=args.project_id, location=args.region)

    dataset = aiplatform.TabularDataset.create(
        display_name="gram_sathi_eligibility",
        gcs_source=[f"{args.export_to_gcs}training_data.csv"],
        project=args.project_id,
        location=args.region
    )

    model = aiplatform.AutoMLTabularTrainingJob(
        display_name="gram_sathi_eligibility_automl",
        optimization_prediction_type="classification",
        optimization_objective="maximize-au-roc"
    )

    model_run = model.run(
        dataset=dataset,
        model_display_name=f"gram_sathi_eligibility_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
        training_fraction=1.0 - args.test_split,
        validation_fraction=args.test_split,
        budget_milli_node_hours=1000,
        disable_early_stopping=False
    )

    logger.info(f"Vertex AI model trained: {model_run.resource_name}")
    return model_run


def train_sklearn_model(
    model_type: str,
    X_train: pd.DataFrame,
    y_train: pd.DataFrame,
    params: Optional[Dict] = None
) -> MultiOutputClassifier:
    """Train a scikit-learn multi-output classifier.

    Args:
        model_type: Key into MODEL_REGISTRY.
        X_train: Training features.
        y_train: Training labels (multi-column).
        params: Override parameters for the base estimator.

    Returns:
        Trained MultiOutputClassifier.
    """
    model_config = MODEL_REGISTRY[model_type]
    base_params = dict(model_config["default_params"])
    if params:
        base_params.update(params)

    logger.info(f"Training {model_type} with params: {json.dumps(base_params, default=str)}")
    base_estimator = model_config["class"](**base_params)

    model = MultiOutputClassifier(base_estimator, n_jobs=-1)
    model.fit(X_train, y_train)

    logger.info("Model training complete.")
    return model


def evaluate_model(
    model: MultiOutputClassifier,
    X_test: pd.DataFrame,
    y_test: pd.DataFrame,
    feature_names: List[str]
) -> Dict[str, Dict[str, float]]:
    """Evaluate multi-label classification model.

    Args:
        model: Trained MultiOutputClassifier.
        X_test: Test features.
        y_test: Test labels.
        feature_names: Feature names for importance reporting.

    Returns:
        Dictionary of per-scheme evaluation metrics.
    """
    y_pred = model.predict(X_test)

    if hasattr(model, "predict_proba"):
        y_prob = model.predict_proba(X_test)
    else:
        y_prob = None

    results = {}
    for i, scheme in enumerate(TARGET_COLUMNS):
        y_true_i = y_test.iloc[:, i]
        y_pred_i = y_pred[:, i]

        metrics = {
            "accuracy": float(accuracy_score(y_true_i, y_pred_i)),
            "precision": float(precision_score(y_true_i, y_pred_i, zero_division=0)),
            "recall": float(recall_score(y_true_i, y_pred_i, zero_division=0)),
            "f1": float(f1_score(y_true_i, y_pred_i, zero_division=0))
        }

        if y_prob is not None and len(y_true_i.unique()) > 1:
            try:
                proba = y_prob[i][:, 1]
                metrics["roc_auc"] = float(roc_auc_score(y_true_i, proba))
            except Exception:
                metrics["roc_auc"] = 0.0
        else:
            metrics["roc_auc"] = 0.0

        results[scheme] = metrics

        cm = confusion_matrix(y_true_i, y_pred_i)
        logger.info(f"\n=== {scheme.upper()} ===")
        logger.info(f"  Accuracy : {metrics['accuracy']:.4f}")
        logger.info(f"  Precision: {metrics['precision']:.4f}")
        logger.info(f"  Recall   : {metrics['recall']:.4f}")
        logger.info(f"  F1 Score : {metrics['f1']:.4f}")
        logger.info(f"  ROC AUC  : {metrics['roc_auc']:.4f}")
        logger.info(f"  Confusion Matrix:\n{cm}")

    return results


def analyze_feature_importance(
    model: MultiOutputClassifier,
    feature_names: List[str]
) -> Dict[str, Dict[str, float]]:
    """Extract and log feature importance per scheme classifier.

    Args:
        model: Trained MultiOutputClassifier.
        feature_names: Names of input features.

    Returns:
        Dictionary mapping scheme name to feature importances.
    """
    importance_data = {}
    for i, scheme in enumerate(TARGET_COLUMNS):
        estimator = model.estimators_[i]
        if hasattr(estimator, "feature_importances_"):
            importances = estimator.feature_importances_
        elif hasattr(estimator, "coef_"):
            importances = np.abs(estimator.coef_).flatten()
        else:
            logger.warning(f"No feature importance available for {scheme}")
            continue

        if len(importances) != len(feature_names):
            logger.warning(
                f"Feature importance length ({len(importances)}) "
                f"does not match feature names ({len(feature_names)}). Skipping."
            )
            continue

        sorted_idx = np.argsort(importances)[::-1][:20]
        importance_data[scheme] = {
            feature_names[idx]: float(importances[idx])
            for idx in sorted_idx
        }

        logger.info(f"\nTop 5 features for {scheme}:")
        for idx in sorted_idx[:5]:
            logger.info(f"  {feature_names[idx]}: {importances[idx]:.4f}")

    return importance_data


def export_model(
    model: MultiOutputClassifier,
    preprocessor: object,
    output_dir: str,
    metrics: Optional[Dict] = None
):
    """Export model and preprocessor to disk.

    Args:
        model: Trained model.
        preprocessor: Fitted ColumnTransformer.
        output_dir: Output directory path.
        metrics: Optional evaluation metrics to save.
    """
    os.makedirs(output_dir, exist_ok=True)

    model_path = os.path.join(output_dir, "eligibility_model.pkl")
    preprocessor_path = os.path.join(output_dir, "preprocessor.pkl")

    if JOBLIB_AVAILABLE:
        joblib.dump(model, model_path)
        joblib.dump(preprocessor, preprocessor_path)
        logger.info(f"Model saved to {model_path}")
        logger.info(f"Preprocessor saved to {preprocessor_path}")
    else:
        logger.warning("joblib not available. Model not saved.")

    if metrics:
        metrics_path = os.path.join(output_dir, "evaluation_metrics.json")
        flat_metrics = {}
        for scheme, scheme_metrics in metrics.items():
            for metric_name, metric_value in scheme_metrics.items():
                flat_metrics[f"{scheme}_{metric_name}"] = metric_value
        with open(metrics_path, "w") as f:
            json.dump(flat_metrics, f, indent=2)
        logger.info(f"Metrics saved to {metrics_path}")

    config = {
        "model_type": "MultiOutputClassifier",
        "features": FEATURES,
        "target_columns": TARGET_COLUMNS,
        "training_date": datetime.utcnow().isoformat()
    }
    with open(os.path.join(output_dir, "config.json"), "w") as f:
        json.dump(config, f, indent=2)


def export_to_gcs(local_dir: str, gcs_path: str):
    """Export model artifacts to Google Cloud Storage.

    Args:
        local_dir: Local directory containing model artifacts.
        gcs_path: GCS destination path (gs://bucket/path/).
    """
    if not GCP_AVAILABLE:
        logger.error("google-cloud-storage not installed. Cannot export to GCS.")
        return

    try:
        bucket_name, prefix = gcs_path.replace("gs://", "").split("/", 1)
        client = storage.Client()
        bucket = client.bucket(bucket_name)

        for root, dirs, files in os.walk(local_dir):
            for file_name in files:
                local_path = os.path.join(root, file_name)
                relative_path = os.path.relpath(local_path, local_dir)
                blob_path = os.path.join(prefix, relative_path)
                blob = bucket.blob(blob_path)
                blob.upload_from_filename(local_path)
                logger.info(f"Uploaded {local_path} to gs://{bucket_name}/{blob_path}")

        logger.info(f"Model artifacts exported to {gcs_path}")
    except Exception as e:
        logger.error(f"Failed to export to GCS: {e}")


def main():
    args = parse_args()
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        stream=sys.stdout
    )
    logger.info(f"Starting training with args: {vars(args)}")

    np.random.seed(args.seed)

    if args.bigquery_query:
        logger.info("Loading data from BigQuery...")
        df = load_from_bigquery(args.bigquery_query)
    elif args.data_path:
        logger.info(f"Loading data from {args.data_path}...")
        df = pd.read_csv(args.data_path)
    else:
        logger.info("Generating synthetic training data...")
        df = generate_training_dataset(
            n_samples=args.n_samples,
            seed=args.seed
        )

    validate_data(df)

    if args.model_type == "vertex_ai":
        logger.info("Training with Vertex AI AutoML...")
        os.makedirs("data", exist_ok=True)
        temp_path = "data/training_data.csv"
        df.to_csv(temp_path, index=False)

        X_train, X_test, y_train, y_test = load_from_dataframe(df)
        train_vertex_ai_model(args, X_train, y_train, X_test, y_test)
        return

    X_train, X_test, y_train, y_test = load_from_dataframe(df)
    logger.info(f"Train size: {len(X_train)}, Test size: {len(X_test)}")

    preprocessor = build_preprocessing_pipeline()
    X_train_processed = preprocessor.fit_transform(X_train)
    X_test_processed = preprocessor.transform(X_test)

    feature_names = []
    for name, transformer, columns in preprocessor.transformers_:
        if name == "num":
            feature_names.extend(columns)
        elif name == "cat":
            ohe = transformer.named_steps["onehot"]
            if hasattr(ohe, "get_feature_names_out"):
                feature_names.extend(ohe.get_feature_names_out(columns))
            else:
                feature_names.extend(columns)
        elif name == "bin":
            feature_names.extend(columns)

    logger.info(f"Processed feature count: {len(feature_names)}")

    params = {}
    if args.n_estimators is not None:
        params["n_estimators"] = args.n_estimators
    if args.max_depth is not None:
        params["max_depth"] = args.max_depth
    if args.learning_rate is not None:
        params["learning_rate"] = args.learning_rate

    model = train_sklearn_model(args.model_type, X_train_processed, y_train, params)

    metrics = evaluate_model(model, X_test_processed, y_test, feature_names)

    importance = analyze_feature_importance(model, feature_names)

    if args.log_metrics and args.project_id:
        flat_metrics = {}
        for scheme, scheme_metrics in metrics.items():
            for metric_name, metric_value in scheme_metrics.items():
                flat_metrics[f"{scheme}_{metric_name}"] = metric_value
        log_to_cloud_monitoring(flat_metrics, args.project_id)

    export_model(model, preprocessor, args.output_dir, metrics)

    if args.export_to_gcs:
        export_to_gcs(args.output_dir, args.export_to_gcs)

    if SHAP_AVAILABLE and args.model_type in ("gradient_boosting", "random_forest"):
        try:
            logger.info("Computing SHAP explanations on test sample...")
            sample_idx = np.random.choice(X_test_processed.shape[0], min(100, X_test_processed.shape[0]), replace=False)
            X_sample = X_test_processed[sample_idx]
            explainer = shap.TreeExplainer(model.estimators_[0])
            shap_values = explainer.shap_values(X_sample)
            shap.summary_plot(shap_values, X_sample, feature_names=feature_names, show=False)
            import matplotlib.pyplot as plt
            plt.savefig(os.path.join(args.output_dir, "shap_summary.png"), bbox_inches="tight")
            plt.close()
            logger.info("SHAP summary plot saved.")
        except Exception as e:
            logger.warning(f"SHAP analysis failed: {e}")

    logger.info("Training pipeline completed successfully.")
    print(f"\nModel artifacts saved to: {args.output_dir}")
    for scheme, scheme_metrics in metrics.items():
        print(f"  {scheme}: F1={scheme_metrics['f1']:.4f}, AUC={scheme_metrics['roc_auc']:.4f}")


if __name__ == "__main__":
    main()
