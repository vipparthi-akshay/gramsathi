"""Model evaluation module for GramSathi scheme eligibility model.

Provides comprehensive evaluation including:
- Confusion matrices per scheme category
- Precision-recall curves
- Calibration plots
- Bias analysis across demographic groups
- Model comparison (GBM vs RandomForest vs LogisticRegression)
"""

import os
import json
import logging
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
from itertools import cycle

from sklearn.metrics import (
    confusion_matrix, ConfusionMatrixDisplay,
    precision_recall_curve, PrecisionRecallDisplay,
    roc_curve, RocCurveDisplay,
    calibration_curve, classification_report,
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
)
from sklearn.calibration import CalibrationDisplay
from sklearn.model_selection import cross_val_score

logger = logging.getLogger(__name__)

try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import seaborn as sns
    VIS_AVAILABLE = True
except ImportError:
    VIS_AVAILABLE = False
    plt = None
    sns = None

from trainer.data_pipeline import (
    TARGET_COLUMNS, build_preprocessing_pipeline,
    generate_training_dataset, load_from_dataframe
)


def plot_confusion_matrices(
    model: object,
    X_test: np.ndarray,
    y_test: pd.DataFrame,
    output_dir: str,
    class_names: Optional[List[str]] = None
):
    """Generate and save confusion matrix for each scheme category.

    Args:
        model: Trained MultiOutputClassifier.
        X_test: Test features.
        y_test: Test labels DataFrame.
        output_dir: Directory to save plots.
        class_names: Display names for classes.
    """
    if not VIS_AVAILABLE:
        logger.warning("matplotlib/seaborn not available. Skipping confusion matrix plots.")
        return

    y_pred = model.predict(X_test)
    scheme_names = class_names or TARGET_COLUMNS

    fig, axes = plt.subplots(2, 4, figsize=(20, 10))
    axes = axes.flatten()

    for i, (ax, scheme) in enumerate(zip(axes, scheme_names)):
        cm = confusion_matrix(y_test.iloc[:, i], y_pred[:, i])
        disp = ConfusionMatrixDisplay(
            cm,
            display_labels=["Not Eligible", "Eligible"]
        )
        disp.plot(ax=ax, cmap="Blues", colorbar=False, values_format="d")
        ax.set_title(f"{scheme.replace('_', ' ').title()}", fontsize=12)
        ax.set_xlabel("Predicted")
        ax.set_ylabel("Actual")

    if len(scheme_names) < len(axes):
        for j in range(len(scheme_names), len(axes)):
            fig.delaxes(axes[j])

    plt.tight_layout()
    path = os.path.join(output_dir, "confusion_matrices.png")
    plt.savefig(path, dpi=150, bbox_inches="tight")
    plt.close()
    logger.info(f"Confusion matrices saved to {path}")


def plot_precision_recall_curves(
    model: object,
    X_test: np.ndarray,
    y_test: pd.DataFrame,
    output_dir: str
):
    """Generate precision-recall curves for each scheme.

    Args:
        model: Trained MultiOutputClassifier.
        X_test: Test features.
        y_test: Test labels.
        output_dir: Directory to save plots.
    """
    if not VIS_AVAILABLE:
        return

    y_prob = model.predict_proba(X_test)
    fig, ax = plt.subplots(figsize=(10, 8))

    colors = cycle(sns.color_palette("husl", len(TARGET_COLUMNS)))
    for i, scheme, color in zip(range(len(TARGET_COLUMNS)), TARGET_COLUMNS, colors):
        precision, recall, _ = precision_recall_curve(
            y_test.iloc[:, i], y_prob[i][:, 1]
        )
        ax.plot(recall, precision, color=color, lw=2,
                label=f"{scheme.replace('_', ' ').title()}")

    ax.set_xlabel("Recall", fontsize=12)
    ax.set_ylabel("Precision", fontsize=12)
    ax.set_title("Precision-Recall Curves per Scheme Category", fontsize=14)
    ax.legend(loc="best", fontsize=9)
    ax.grid(True, alpha=0.3)

    path = os.path.join(output_dir, "precision_recall_curves.png")
    plt.savefig(path, dpi=150, bbox_inches="tight")
    plt.close()
    logger.info(f"PR curves saved to {path}")


def plot_roc_curves(
    model: object,
    X_test: np.ndarray,
    y_test: pd.DataFrame,
    output_dir: str
):
    """Generate ROC curves for each scheme.

    Args:
        model: Trained MultiOutputClassifier.
        X_test: Test features.
        y_test: Test labels.
        output_dir: Directory to save plots.
    """
    if not VIS_AVAILABLE:
        return

    y_prob = model.predict_proba(X_test)
    fig, ax = plt.subplots(figsize=(10, 8))

    colors = cycle(sns.color_palette("husl", len(TARGET_COLUMNS)))
    for i, scheme, color in zip(range(len(TARGET_COLUMNS)), TARGET_COLUMNS, colors):
        fpr, tpr, _ = roc_curve(y_test.iloc[:, i], y_prob[i][:, 1])
        auc = roc_auc_score(y_test.iloc[:, i], y_prob[i][:, 1])
        ax.plot(fpr, tpr, color=color, lw=2,
                label=f"{scheme.replace('_', ' ').title()} (AUC={auc:.3f})")

    ax.plot([0, 1], [0, 1], "k--", lw=1, alpha=0.5)
    ax.set_xlabel("False Positive Rate", fontsize=12)
    ax.set_ylabel("True Positive Rate", fontsize=12)
    ax.set_title("ROC Curves per Scheme Category", fontsize=14)
    ax.legend(loc="lower right", fontsize=9)
    ax.grid(True, alpha=0.3)

    path = os.path.join(output_dir, "roc_curves.png")
    plt.savefig(path, dpi=150, bbox_inches="tight")
    plt.close()
    logger.info(f"ROC curves saved to {path}")


def plot_calibration_curves(
    model: object,
    X_test: np.ndarray,
    y_test: pd.DataFrame,
    output_dir: str,
    n_bins: int = 10
):
    """Generate calibration plots for each scheme.

    Args:
        model: Trained MultiOutputClassifier.
        X_test: Test features.
        y_test: Test labels.
        output_dir: Directory to save plots.
        n_bins: Number of bins for calibration curve.
    """
    if not VIS_AVAILABLE:
        return

    y_prob = model.predict_proba(X_test)
    fig, axes = plt.subplots(2, 4, figsize=(20, 10))
    axes = axes.flatten()

    for i, (ax, scheme) in enumerate(zip(axes, TARGET_COLUMNS)):
        CalibrationDisplay.from_predictions(
            y_test.iloc[:, i], y_prob[i][:, 1],
            n_bins=n_bins, ax=ax, name=scheme.replace("_", " ").title()
        )
        ax.set_title(f"{scheme.replace('_', ' ').title()}")

    if len(TARGET_COLUMNS) < len(axes):
        for j in range(len(TARGET_COLUMNS), len(axes)):
            fig.delaxes(axes[j])

    plt.tight_layout()
    path = os.path.join(output_dir, "calibration_curves.png")
    plt.savefig(path, dpi=150, bbox_inches="tight")
    plt.close()
    logger.info(f"Calibration curves saved to {path}")


def analyze_bias(
    model: object,
    X_test: pd.DataFrame,
    y_test: pd.DataFrame,
    protected_attributes: List[str],
    output_dir: str
) -> Dict[str, Dict[str, Dict[str, float]]]:
    """Bias analysis across demographic groups.

    Evaluates model fairness metrics for each protected attribute.

    Args:
        model: Trained MultiOutputClassifier.
        X_test: Test features DataFrame.
        y_test: Test labels.
        protected_attributes: Column names of protected attributes.
        output_dir: Directory to save results.

    Returns:
        Nested dict: {attribute: {group: {scheme: metric}}}.
    """
    if not VIS_AVAILABLE:
        logger.warning("Visualization libraries not available. Skipping bias plots.")

    y_pred = model.predict(X_test)

    bias_results = {}
    for attr in protected_attributes:
        if attr not in X_test.columns:
            logger.warning(f"Protected attribute '{attr}' not in test data. Skipping.")
            continue

        groups = X_test[attr].unique()
        bias_results[attr] = {}

        fig, axes = plt.subplots(
            len(TARGET_COLUMNS), len(groups),
            figsize=(5 * len(groups), 4 * len(TARGET_COLUMNS)),
            squeeze=False
        )

        for scheme_idx, scheme in enumerate(TARGET_COLUMNS):
            group_metrics = {}
            for group_idx, group in enumerate(groups):
                mask = X_test[attr] == group
                if mask.sum() == 0:
                    continue

                y_true_group = y_test.iloc[:, scheme_idx][mask]
                y_pred_group = y_pred[:, scheme_idx][mask]

                acc = accuracy_score(y_true_group, y_pred_group)
                prec = precision_score(y_true_group, y_pred_group, zero_division=0)
                rec = recall_score(y_true_group, y_pred_group, zero_division=0)
                f1 = f1_score(y_true_group, y_pred_group, zero_division=0)

                group_metrics[str(group)] = {
                    "accuracy": float(acc),
                    "precision": float(prec),
                    "recall": float(rec),
                    "f1": float(f1),
                    "count": int(mask.sum())
                }

                if VIS_AVAILABLE:
                    cm = confusion_matrix(y_true_group, y_pred_group)
                    ax = axes[scheme_idx, group_idx]
                    ConfusionMatrixDisplay(cm, display_labels=["Neg", "Pos"]).plot(
                        ax=ax, cmap="Blues", colorbar=False, values_format="d"
                    )
                    ax.set_title(f"{scheme.split('_')[0].title()}\n{group} (n={mask.sum()})")

            bias_results[attr][scheme] = group_metrics

        if VIS_AVAILABLE:
            plt.tight_layout()
            path = os.path.join(output_dir, f"bias_{attr}_confusion_matrices.png")
            plt.savefig(path, dpi=150, bbox_inches="tight")
            plt.close()

    if VIS_AVAILABLE:
        _plot_bias_summary(bias_results, output_dir)

    _compute_disparate_impact(bias_results)

    with open(os.path.join(output_dir, "bias_analysis.json"), "w") as f:
        json.dump(bias_results, f, indent=2, default=str)

    logger.info("Bias analysis complete. Results saved.")
    return bias_results


def _plot_bias_summary(
    bias_results: Dict[str, Dict[str, Dict[str, Dict[str, float]]]],
    output_dir: str
):
    """Plot bias metrics comparison across groups.

    Args:
        bias_results: Bias analysis results dict.
        output_dir: Output directory.
    """
    if not VIS_AVAILABLE:
        return

    for attr, schemes in bias_results.items():
        fig, axes = plt.subplots(1, 4, figsize=(20, 5))
        metrics_names = ["accuracy", "precision", "recall", "f1"]

        all_groups = set()
        for scheme_metrics in schemes.values():
            all_groups.update(scheme_metrics.keys())

        groups_list = sorted(all_groups)
        x = np.arange(len(groups_list))
        width = 0.8 / len(schemes)

        for metric_idx, metric_name in enumerate(metrics_names):
            ax = axes[metric_idx]
            for scheme_idx, (scheme, groups) in enumerate(schemes.items()):
                values = [groups.get(g, {}).get(metric_name, 0) for g in groups_list]
                offset = (scheme_idx - len(schemes) / 2 + 0.5) * width
                bars = ax.bar(x + offset, values, width * 0.9,
                              label=scheme.replace("_", " ").title())
                for bar, v in zip(bars, values):
                    if v > 0:
                        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.01,
                                f"{v:.2f}", ha="center", va="bottom", fontsize=7)

            ax.set_xticks(x)
            ax.set_xticklabels(groups_list, rotation=45, fontsize=8)
            ax.set_title(metric_name.title(), fontsize=12)
            ax.set_ylabel("Score")
            ax.legend(fontsize=7, loc="lower right")
            ax.set_ylim(0, 1.15)

        plt.suptitle(f"Bias Analysis by {attr}", fontsize=14)
        plt.tight_layout()
        path = os.path.join(output_dir, f"bias_{attr}_summary.png")
        plt.savefig(path, dpi=150, bbox_inches="tight")
        plt.close()


def _compute_disparate_impact(
    bias_results: Dict[str, Dict[str, Dict[str, Dict[str, float]]]]
):
    """Compute disparate impact ratios for fairness assessment.

    Logs warnings if any group shows disparate impact below 0.8.
    """
    for attr, schemes in bias_results.items():
        for scheme, groups in schemes.items():
            all_f1 = [g["f1"] for g in groups.values() if g.get("count", 0) > 0]
            if not all_f1:
                continue
            max_f1 = max(all_f1)
            if max_f1 == 0:
                continue

            for group_name, metrics in groups.items():
                if metrics.get("f1", 0) == 0:
                    continue
                impact_ratio = metrics["f1"] / max_f1
                if impact_ratio < 0.8:
                    logger.warning(
                        f"Disparate impact detected: {attr}={group_name}, "
                        f"scheme={scheme}, F1 ratio={impact_ratio:.3f} "
                        f"(below 0.8 threshold)"
                    )


def compare_models(
    X_train: np.ndarray,
    y_train: pd.DataFrame,
    X_test: np.ndarray,
    y_test: pd.DataFrame,
    output_dir: str,
    cv_folds: int = 5
) -> Dict[str, Dict[str, float]]:
    """Compare GradientBoosting, RandomForest, and LogisticRegression.

    Args:
        X_train: Training features.
        y_train: Training labels.
        X_test: Test features.
        y_test: Test labels.
        output_dir: Output directory for results.
        cv_folds: Number of cross-validation folds.

    Returns:
        Dict mapping model name to evaluation metrics.
    """
    from sklearn.ensemble import (
        GradientBoostingClassifier,
        RandomForestClassifier
    )
    from sklearn.linear_model import LogisticRegression
    from sklearn.multioutput import MultiOutputClassifier

    models = {
        "GradientBoosting": GradientBoostingClassifier(
            n_estimators=200, max_depth=5, random_state=42
        ),
        "RandomForest": RandomForestClassifier(
            n_estimators=200, max_depth=10, random_state=42, n_jobs=-1
        ),
        "LogisticRegression": LogisticRegression(
            C=1.0, max_iter=1000, random_state=42, n_jobs=-1
        )
    }

    comparison = {}

    for name, base_model in models.items():
        logger.info(f"Evaluating {name}...")
        multi_model = MultiOutputClassifier(base_model, n_jobs=-1)
        multi_model.fit(X_train, y_train)
        y_pred = multi_model.predict(X_test)

        scheme_metrics = {}
        for i, scheme in enumerate(TARGET_COLUMNS):
            scheme_metrics[scheme] = {
                "accuracy": float(accuracy_score(y_test.iloc[:, i], y_pred[:, i])),
                "precision": float(precision_score(y_test.iloc[:, i], y_pred[:, i], zero_division=0)),
                "recall": float(recall_score(y_test.iloc[:, i], y_pred[:, i], zero_division=0)),
                "f1": float(f1_score(y_test.iloc[:, i], y_pred[:, i], zero_division=0))
            }

        avg_f1 = np.mean([m["f1"] for m in scheme_metrics.values()])
        avg_acc = np.mean([m["accuracy"] for m in scheme_metrics.values()])

        comparison[name] = {
            "average_f1": float(avg_f1),
            "average_accuracy": float(avg_acc),
            "per_scheme": scheme_metrics
        }

        logger.info(f"  {name}: Avg F1={avg_f1:.4f}, Avg Acc={avg_acc:.4f}")

    _plot_model_comparison(comparison, output_dir)

    with open(os.path.join(output_dir, "model_comparison.json"), "w") as f:
        json.dump(comparison, f, indent=2)

    logger.info("Model comparison complete.")
    return comparison


def _plot_model_comparison(
    comparison: Dict[str, Dict],
    output_dir: str
):
    """Plot model comparison bar chart.

    Args:
        comparison: Model comparison results.
        output_dir: Output directory.
    """
    if not VIS_AVAILABLE:
        return

    model_names = list(comparison.keys())
    metrics_to_plot = ["average_accuracy", "average_f1"]

    fig, axes = plt.subplots(1, 2, figsize=(12, 5))
    colors = sns.color_palette("husl", len(model_names))

    for idx, metric in enumerate(metrics_to_plot):
        ax = axes[idx]
        values = [comparison[m][metric] for m in model_names]
        bars = ax.bar(model_names, values, color=colors)
        ax.set_title(metric.replace("_", " ").title(), fontsize=12)
        ax.set_ylim(0, 1.0)
        ax.set_ylabel("Score")
        for bar, val in zip(bars, values):
            ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.01,
                    f"{val:.3f}", ha="center", va="bottom", fontsize=10)

    plt.suptitle("Model Comparison", fontsize=14)
    plt.tight_layout()
    path = os.path.join(output_dir, "model_comparison.png")
    plt.savefig(path, dpi=150, bbox_inches="tight")
    plt.close()
    logger.info(f"Model comparison chart saved to {path}")


def run_full_evaluation(
    model: object,
    X_train: np.ndarray,
    X_test: np.ndarray,
    y_train: pd.DataFrame,
    y_test: pd.DataFrame,
    X_test_original: pd.DataFrame,
    output_dir: str,
    protected_attributes: Optional[List[str]] = None
) -> Dict:
    """Run comprehensive model evaluation pipeline.

    Args:
        model: Trained MultiOutputClassifier.
        X_train: Processed training features.
        X_test: Processed test features.
        y_train: Training labels.
        y_test: Test labels.
        X_test_original: Original (unprocessed) test DataFrame for bias analysis.
        output_dir: Output directory.
        protected_attributes: Protected attributes for bias analysis.

    Returns:
        Dictionary with all evaluation results.
    """
    os.makedirs(output_dir, exist_ok=True)

    logger.info("Running full model evaluation...")

    plot_confusion_matrices(model, X_test, y_test, output_dir)
    plot_precision_recall_curves(model, X_test, y_test, output_dir)
    plot_roc_curves(model, X_test, y_test, output_dir)
    plot_calibration_curves(model, X_test, y_test, output_dir)

    bias_results = {}
    if protected_attributes:
        protected = [a for a in protected_attributes if a in X_test_original.columns]
        if protected:
            bias_results = analyze_bias(
                model, X_test_original, y_test, protected, output_dir
            )

    comparison = compare_models(X_train, y_train, X_test, y_test, output_dir)

    return {
        "bias_analysis": bias_results,
        "model_comparison": comparison,
        "output_dir": output_dir
    }


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    from trainer.train import train_sklearn_model, MODEL_REGISTRY

    output_dir = "C:\\Users\\User\\gramsathi-ai\\ml\\eligibility-model\\models"

    print("Generating dataset...")
    df = generate_training_dataset(n_samples=50000)
    X_train, X_test, y_train, y_test = load_from_dataframe(df)
    X_test_original = X_test.copy()

    preprocessor = build_preprocessing_pipeline()
    X_train_processed = preprocessor.fit_transform(X_train)
    X_test_processed = preprocessor.transform(X_test)

    print("Training GradientBoosting model...")
    model = train_sklearn_model("gradient_boosting", X_train_processed, y_train)

    results = run_full_evaluation(
        model=model,
        X_train=X_train_processed,
        X_test=X_test_processed,
        y_train=y_train,
        y_test=y_test,
        X_test_original=X_test_original,
        output_dir=output_dir,
        protected_attributes=["gender", "caste_category", "is_farmer"]
    )

    print(f"Evaluation complete. Results saved to {output_dir}")
