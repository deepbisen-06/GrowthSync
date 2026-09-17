"""Train an experimental reported-stress classifier from the supplied habit CSV.

This does not diagnose mental illness or change GrowthSync's existing habit scores.
"""

import argparse
import hashlib
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import balanced_accuracy_score, classification_report, confusion_matrix, f1_score
from sklearn.model_selection import GridSearchCV, StratifiedKFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

ROOT = Path(__file__).resolve().parents[1]
MAPPING = {
    "Screen Time (hrs/day)": "screen_hours_per_day",
    "Sleep Duration (hrs)": "sleep_hours_per_day",
    "Physical Activity (hrs/week)": "activity_hours_per_week",
}
FEATURES = list(MAPPING.values())
LABELS = ["Low", "Medium", "High"]
SEED = 42


def prepare(path: Path):
    data = pd.read_csv(path, encoding="utf-8-sig")
    required = set(MAPPING) | {"Stress Level"}
    missing = required - set(data.columns)
    if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")
    features = data[list(MAPPING)].rename(columns=MAPPING).apply(pd.to_numeric, errors="raise")
    if not np.isfinite(features.to_numpy()).all():
        raise ValueError("Habit inputs contain blank or nonfinite values")
    for name, maximum in zip(FEATURES, [24, 24, 168]):
        if not features[name].between(0, maximum).all():
            raise ValueError(f"{name} must be between 0 and {maximum}")
    target = data["Stress Level"].astype("string").str.strip().str.title()
    if target.isna().any() or not target.isin(LABELS).all():
        raise ValueError("Stress Level must contain only Low, Medium and High")
    if any(int((target == label).sum()) < 10 for label in LABELS):
        raise ValueError("At least 10 rows per class are needed for this experiment")
    # Names are not reliable unique participant IDs. Retain separate survey rows;
    # do not merge these people with students or transactions from other datasets.
    return features, target, {
        "source_rows": len(data),
        "exact_source_duplicate_rows": int(data.duplicated().sum()),
        "excluded_fields": [name for name in data.columns if name not in required],
        "units": {FEATURES[0]: "hours/day", FEATURES[1]: "hours/day", FEATURES[2]: "hours/week"},
    }


def evaluate(y, predictions):
    return {
        "macro_f1": float(f1_score(y, predictions, labels=LABELS, average="macro", zero_division=0)),
        "balanced_accuracy": float(balanced_accuracy_score(y, predictions)),
        "confusion_matrix_label_order": LABELS,
        "confusion_matrix": confusion_matrix(y, predictions, labels=LABELS).tolist(),
        "classification_report": classification_report(y, predictions, labels=LABELS, output_dict=True, zero_division=0),
    }


def train(source: Path, output: Path):
    X, y, preparation = prepare(source)
    train_ids, test_ids = train_test_split(
        np.arange(len(y)), test_size=0.2, random_state=SEED, stratify=y
    )
    X_train, X_test = X.iloc[train_ids], X.iloc[test_ids]
    y_train, y_test = y.iloc[train_ids], y.iloc[test_ids]
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)
    baseline = DummyClassifier(strategy="most_frequent")
    baseline_score = float(cross_val_score(baseline, X_train, y_train, cv=cv, scoring="f1_macro").mean())
    baseline.fit(X_train, y_train)
    search = GridSearchCV(
        Pipeline([("scale", StandardScaler()), ("classifier", LogisticRegression(
            class_weight="balanced", max_iter=2000, random_state=SEED
        ))]),
        {"classifier__C": [0.01, 0.1, 1.0, 10.0]}, cv=cv, scoring="f1_macro", n_jobs=1,
        error_score="raise",
    )
    search.fit(X_train, y_train)
    logistic = search.best_estimator_
    name = "logistic_regression" if search.best_score_ > baseline_score else "majority_baseline"
    selected = logistic if name == "logistic_regression" else baseline
    # Selection uses training CV only. Test results are reported, not used to tune.
    models = {"majority_baseline": baseline, "logistic_regression": logistic}
    results = {key: evaluate(y_test, model.predict(X_test)) for key, model in models.items()}
    report = {
        "task": "experimental reported-stress classification", "source_file": source.name,
        "source_sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
        "source_provenance": "User-supplied file; collection methodology not independently verified",
        "features": FEATURES, "target": "Stress Level", "labels": LABELS,
        "train_rows": len(train_ids), "test_rows": len(test_ids), "seed": SEED,
        "selected_model": name, "selection_rule": "Highest training 5-fold CV macro-F1",
        "training_cv_macro_f1": {"majority_baseline": baseline_score, "logistic_regression": float(search.best_score_)},
        "best_C": search.best_params_["classifier__C"], "test_metrics": results,
        "prepared_data": preparation, "model_fit_scope": "Training partition only",
        "versions": {"sklearn": sklearn.__version__, "pandas": pd.__version__, "numpy": np.__version__, "joblib": joblib.__version__},
        "limitations": [
            "Predicts the dataset's reported labels; not a clinical diagnosis or validated risk assessment.",
            "Weekly activity hours are not directly interchangeable with the app's daily exercise minutes.",
            "No reliable participant IDs or repeated dates: random stratified holdout is not participant-independent validation.",
            "If scores are near chance, do not deploy as personalized advice or claim predictive usefulness.",
            "No automatic dashboard integration or changes to existing productivity scores.",
        ],
    }
    output.mkdir(parents=True, exist_ok=True)
    joblib.dump(selected, output / "habit_model.joblib")
    joblib.dump(logistic, output / "logistic_model.joblib")
    joblib.dump(baseline, output / "baseline_model.joblib")
    (output / "metrics.json").write_text(json.dumps(report, indent=2, allow_nan=False) + "\n")
    (output / "split_indices.json").write_text(json.dumps({"train": train_ids.tolist(), "test": test_ids.tolist()}, indent=2))
    prepared = X.copy()
    prepared["reported_stress"] = y
    prepared.to_csv(output / "prepared_habit_data.csv", index=False)
    predictions = X_test.copy()
    predictions.insert(0, "source_row_index", test_ids)
    predictions["actual_stress"] = y_test.to_numpy()
    for key, model in models.items():
        predictions[key] = model.predict(X_test)
    predictions.to_csv(output / "test_predictions.csv", index=False)
    np.testing.assert_array_equal(joblib.load(output / "habit_model.joblib").predict(X_test), selected.predict(X_test))
    print(f"Habit training complete: {len(train_ids)} train / {len(test_ids)} test rows")
    for key, value in results.items():
        print(f"{key}: macro-F1={value['macro_f1']:.3f}; balanced accuracy={value['balanced_accuracy']:.3f}")
    print(f"Selected by training CV: {name}")
    print(f"Saved in: {output.resolve()}")
    print("Experimental only. A trained model is not automatically a useful model. Dashboard unchanged.")
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=ROOT / "datasets/raw/habits/mental_health.csv")
    parser.add_argument("--output", type=Path, default=ROOT / "artifacts/habit_model")
    args = parser.parse_args()
    try:
        train(args.input, args.output)
    except (OSError, ValueError) as exc:
        parser.exit(1, f"Habit training failed: {exc}\n")


if __name__ == "__main__":
    main()
