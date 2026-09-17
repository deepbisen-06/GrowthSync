"""Expose validated evaluation summaries, without loading models or user records."""

import json
import math
from pathlib import Path

ARTIFACTS = Path(__file__).resolve().parents[3] / "artifacts"


def number(value, low=None, high=None):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError("Expected a numeric metric")
    if not math.isfinite(value) or (low is not None and value < low) or (high is not None and value > high):
        raise ValueError("Metric outside its valid range")
    return value


def count(value):
    value = number(value, 0)
    if int(value) != value:
        raise ValueError("Expected an integer count")
    return int(value)


def text(value):
    if not isinstance(value, str) or not value.strip():
        raise ValueError("Expected text")
    return value


def habit_summary(report):
    train_rows, test_rows = count(report["train_rows"]), count(report["test_rows"])
    total = count(report["prepared_data"]["source_rows"])
    if total != train_rows + test_rows:
        raise ValueError("Inconsistent row counts")
    rows = []
    for key, label in [("majority_baseline", "Majority baseline"), ("logistic_regression", "Logistic Regression")]:
        metrics = report["test_metrics"][key]
        rows.append({"key": key, "label": label,
                     "macro_f1": number(metrics["macro_f1"], 0, 1),
                     "balanced_accuracy": number(metrics["balanced_accuracy"], 0, 1)})
    selected = next(row for row in rows if row["key"] == report["selected_model"])
    labels = report["labels"]
    if not isinstance(labels, list) or len(set(labels)) < 2:
        raise ValueError("Invalid class labels")
    chance = 1 / len(set(labels))
    return {
        "status": "ready", "total_rows": total, "train_rows": train_rows, "test_rows": test_rows,
        "selected": selected["key"], "selected_label": selected["label"], "rows": rows,
        "selection_rule": "Selected using training cross-validation macro-F1",
        "chance_reference": chance,
        "interpretation": (
            "Balanced accuracy does not exceed the class-chance reference. Useful stress prediction has not been established."
            if selected["balanced_accuracy"] <= chance else
            "Balanced accuracy exceeds the class-chance reference on this holdout. Independent validation is still needed."
        ),
        "limitation": "Reported stress labels from a separate dataset; not your stress level or a clinical assessment. Collection methodology remains unverified.",
    }


def finance_summary(report):
    audit = report["preparation"]
    train_rows, test_rows = count(report["training_rows_after_lags"]), count(report["test_rows"])
    rows = []
    for key, label in [("last_month", "Last month"), ("rolling_mean_3", "3-month average"), ("ridge", "Ridge")]:
        metrics = report["test_metrics"][key]
        rows.append({"key": key, "label": label, "mae": number(metrics["mae"], 0),
                     "rmse": number(metrics["rmse"], 0), "r2": number(metrics["r2"], high=1)})
    selected = next(row for row in rows if row["key"] == report["selected_strategy"])
    period = report["test_months"]
    if not isinstance(period, list) or len(period) != 2:
        raise ValueError("Invalid evaluation period")
    return {
        "status": "ready", "transaction_rows": count(audit["transaction_rows"]),
        "months": count(audit["months"]), "train_months": train_rows, "test_months": test_rows,
        "excluded_transfer_rows": count(audit["excluded_credit_card_payment_rows"]),
        "selected": selected["key"], "selected_label": selected["label"], "rows": rows,
        "currency": text(report["currency"]), "test_period": [text(value) for value in period],
        "selection_rule": "Selected using training expanding-window cross-validation MAE",
        "interpretation": (
            "Selected strategy has nonpositive test R². Reliable expense forecasting has not been established."
            if selected["r2"] <= 0 else
            "Selected strategy has positive test R² on this small historical holdout. Broader validation is still needed."
        ),
        "limitation": "Historical dataset evaluation, not your future expenses. Few test months make results unstable. Card payments are excluded as assumed internal transfers.",
    }


def load_summary(kind, summarizer):
    path = ARTIFACTS / f"{kind}_model" / "metrics.json"
    try:
        report = json.loads(path.read_text(encoding="utf-8"))
        return summarizer(report)
    except FileNotFoundError:
        return {"status": "missing", "message": "No saved evaluation yet. Complete the corresponding training run to see results."}
    except (OSError, ValueError, KeyError, TypeError, StopIteration, UnicodeError):
        return {"status": "invalid", "message": "The saved evaluation could not be read. Run the matching training script again to regenerate its report."}


def get_model_evaluations():
    # Read each report independently so one absent/invalid file cannot hide the other.
    return {"habit": load_summary("habit", habit_summary),
            "finance": load_summary("finance", finance_summary)}
