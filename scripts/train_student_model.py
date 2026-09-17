"""Train and evaluate an offline final-grade model from prepared student data.

Run from the project root:
    python scripts/train_student_model.py

The saved pipeline expects studytime (weekly category 1-4), failures and absences,
not daily study hours. This script does not change the dashboard or its API.
"""

import argparse
import hashlib
import json
import platform
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.dummy import DummyRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import GridSearchCV, KFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

ROOT = Path(__file__).resolve().parents[1]
FEATURES = ["studytime", "failures", "absences"]
TARGET = "G3"
SEED = 42
RANGES = {"studytime": (1, 4), "failures": (0, 4), "absences": (0, 93), "G3": (0, 20)}


def load_data(path: Path) -> pd.DataFrame:
    """Reject invalid prepared data rather than filling or discarding rows silently."""
    if not path.is_file():
        raise ValueError(f"Input file not found: {path}. Run prepare_student_data.py first.")
    frame = pd.read_csv(path)
    missing = set(RANGES) - set(frame.columns)
    if missing:
        raise ValueError(f"Missing columns: {', '.join(sorted(missing))}")
    frame = frame[list(RANGES)].apply(pd.to_numeric, errors="raise")
    if len(frame) < 30:
        raise ValueError("At least 30 rows are required for this train/test and CV workflow.")
    if not np.isfinite(frame.to_numpy()).all():
        raise ValueError("Missing or infinite values found. Check the source dataset.")
    for column, (lower, upper) in RANGES.items():
        values = frame[column]
        if not (values.between(lower, upper) & (values == np.floor(values))).all():
            raise ValueError(f"{column} must contain integers between {lower} and {upper}.")
    if frame[TARGET].nunique() < 2:
        raise ValueError("The target must contain at least two distinct grades.")
    # Do not deduplicate selected features: distinct students can share these values.
    return frame


def evaluate(actual, predicted) -> dict:
    """Return held-out regression metrics in the original grade scale."""
    return {
        "mae": float(mean_absolute_error(actual, predicted)),
        "rmse": float(np.sqrt(mean_squared_error(actual, predicted))),
        "r2": float(r2_score(actual, predicted)),
    }


def train(input_path: Path, output_dir: Path) -> dict:
    frame = load_data(input_path)
    indices = np.arange(len(frame))
    train_ids, test_ids = train_test_split(indices, test_size=0.2, random_state=SEED)
    X_train = frame.iloc[train_ids][FEATURES]
    y_train = frame.iloc[train_ids][TARGET]
    X_test = frame.iloc[test_ids][FEATURES]
    y_test = frame.iloc[test_ids][TARGET]

    # All tuning and preprocessing stay inside the training data.
    folds = KFold(n_splits=5, shuffle=True, random_state=SEED)
    baseline = DummyRegressor(strategy="mean")
    baseline_cv_mae = float(-cross_val_score(
        baseline, X_train, y_train, cv=folds, scoring="neg_mean_absolute_error"
    ).mean())
    baseline.fit(X_train, y_train)

    ridge = Pipeline([("scaler", StandardScaler()), ("ridge", Ridge())])
    search = GridSearchCV(
        ridge,
        {"ridge__alpha": [0.01, 0.1, 1.0, 10.0, 100.0]},
        scoring="neg_mean_absolute_error",
        cv=folds,
        n_jobs=1,
        error_score="raise",
    )
    search.fit(X_train, y_train)
    ridge_cv_mae = float(-search.best_score_)
    ridge = search.best_estimator_

    # Select before inspecting test metrics; the held-out set is not used for tuning.
    selected_name = "ridge" if ridge_cv_mae < baseline_cv_mae else "baseline"
    selected = ridge if selected_name == "ridge" else baseline
    baseline_predictions = baseline.predict(X_test)
    ridge_predictions = ridge.predict(X_test)
    metrics = {
        "baseline": evaluate(y_test, baseline_predictions),
        "ridge": evaluate(y_test, ridge_predictions),
    }

    report = {
        "created_at_utc": datetime.now(timezone.utc).isoformat(),
        "input_filename": input_path.name,
        "input_sha256": hashlib.sha256(input_path.read_bytes()).hexdigest(),
        "features": FEATURES,
        "target": TARGET,
        "target_units": "final grade, 0-20",
        "rows": len(frame),
        "train_rows": len(train_ids),
        "test_rows": len(test_ids),
        "random_seed": SEED,
        "cv_folds": 5,
        "training_cv_mae": {"baseline": baseline_cv_mae, "ridge": ridge_cv_mae},
        "best_ridge_alpha": search.best_params_["ridge__alpha"],
        "held_out_test_metrics": metrics,
        "selected_model": selected_name,
        "selection_rule": "Lowest training cross-validation MAE, not test performance",
        "model_training_scope": "Training partition only; no refit on held-out rows",
        "predictions_clipped": False,
        "versions": {
            "python": platform.python_version(), "scikit_learn": sklearn.__version__,
            "pandas": pd.__version__, "numpy": np.__version__, "joblib": joblib.__version__,
        },
        "limitations": [
            "Offline historical grade experiment, not a weekly study-hours forecast.",
            "studytime is a weekly category, not exact hours; absences must be known at prediction time.",
            "G1 and G2 are excluded; no guaranteed accuracy or causal interpretation.",
            "One random holdout is not external validation on Indian college students.",
            "Only one subject file should be used; cross-subject student overlap needs grouped splitting.",
            "Linear predictions are not clipped and can fall outside the grade scale.",
            "No API/dashboard integration is performed by this script.",
        ],
    }
    source_report = input_path.parent / "data_report.json"
    if source_report.is_file():
        report["preparation_report"] = json.loads(source_report.read_text(encoding="utf-8"))

    output_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(ridge, output_dir / "ridge_model.joblib")
    joblib.dump(baseline, output_dir / "baseline_model.joblib")
    joblib.dump(selected, output_dir / "student_model.joblib")
    (output_dir / "metrics.json").write_text(
        json.dumps(report, indent=2, allow_nan=False) + "\n", encoding="utf-8"
    )
    (output_dir / "split_indices.json").write_text(
        json.dumps({"train": train_ids.tolist(), "test": test_ids.tolist()}, indent=2) + "\n",
        encoding="utf-8",
    )
    predictions = X_test.copy()
    predictions.insert(0, "source_row_index", test_ids)
    predictions["actual_grade"] = y_test.to_numpy()
    predictions["baseline_prediction"] = baseline_predictions
    predictions["ridge_prediction"] = ridge_predictions
    predictions.to_csv(output_dir / "test_predictions.csv", index=False)

    # Check that the saved artifact reloads and reproduces the evaluated predictions.
    restored = joblib.load(output_dir / "student_model.joblib")
    np.testing.assert_allclose(restored.predict(X_test), selected.predict(X_test))
    print(f"Training complete: {len(train_ids)} train rows / {len(test_ids)} test rows")
    print(f"{'Model':<12} {'MAE':>8} {'RMSE':>8} {'R2':>8}")
    for name, result in metrics.items():
        print(f"{name:<12} {result['mae']:>8.3f} {result['rmse']:>8.3f} {result['r2']:>8.3f}")
    print(f"Selected by training CV: {selected_name}; Ridge alpha: {report['best_ridge_alpha']}")
    print(f"Files saved in: {output_dir.resolve()}")
    print("Lower MAE/RMSE is better. R2 is not percentage accuracy.")
    print("The dashboard has not changed. Backend integration is a separate step.")
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path,
                        default=ROOT / "datasets/processed/student/student_performance.csv")
    parser.add_argument("--output", type=Path, default=ROOT / "artifacts/student_model")
    args = parser.parse_args()
    try:
        train(args.input, args.output)
    except (OSError, ValueError) as exc:
        parser.exit(1, f"Training failed: {exc}\n")


if __name__ == "__main__":
    main()
