"""Load a locally trained artifact and predict grades without retraining on requests."""

import json
import logging
from functools import lru_cache
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from backend.app.schemas.academic_prediction import AcademicPredictionRequest

logger = logging.getLogger(__name__)
MODEL_DIR = Path(__file__).resolve().parents[3] / "artifacts" / "student_model"
FEATURES = ["studytime", "failures", "absences"]


class AcademicModelUnavailable(RuntimeError):
    """The local training artifacts are missing or cannot be used."""


@lru_cache(maxsize=1)
def _load_artifacts(model_path: str, report_path: str, model_stamp: int, report_stamp: int):
    # Timestamps form the cache key so a later training run refreshes the model.
    # Load only artifacts generated locally by the project's training script.
    model = joblib.load(model_path)
    report = json.loads(Path(report_path).read_text(encoding="utf-8"))
    if report.get("features") != FEATURES or report.get("target") != "G3":
        raise ValueError("Model metadata has an incompatible feature contract")
    if list(getattr(model, "feature_names_in_", [])) != FEATURES:
        raise ValueError("Model inputs do not match the academic feature contract")
    name = report.get("selected_model")
    if name not in {"ridge", "baseline"}:
        raise ValueError("Unknown selected model")
    mae = float(report["held_out_test_metrics"][name]["mae"])
    if not np.isfinite(mae) or mae < 0:
        raise ValueError("Invalid evaluation metric")
    return model, name, mae


def predict_academic_grade(inputs: AcademicPredictionRequest) -> dict:
    """Predict from the three original features; never fabricate a fallback grade."""
    model_file = MODEL_DIR / "student_model.joblib"
    report_file = MODEL_DIR / "metrics.json"
    try:
        model, name, mae = _load_artifacts(
            str(model_file), str(report_file),
            model_file.stat().st_mtime_ns, report_file.stat().st_mtime_ns,
        )
        frame = pd.DataFrame([inputs.model_dump()], columns=FEATURES)
        raw = float(model.predict(frame)[0])
        if not np.isfinite(raw):
            raise ValueError("Nonfinite prediction")
    except Exception as exc:
        logger.warning("Academic model could not be used: %s", type(exc).__name__)
        raise AcademicModelUnavailable(
            "Academic prediction is unavailable. Run scripts/train_student_model.py "
            "in the backend environment, then retry."
        ) from exc

    bounded = min(20.0, max(0.0, raw))
    return {
        "predicted_grade": round(bounded, 2),
        "raw_prediction": raw,
        "display_clipped": bounded != raw,
        "model_name": name,
        "test_mae": round(mae, 3),
        "message": (
            "Experimental estimate from historical Portuguese secondary-school data. "
            "Not validated for your college or a guarantee of results. "
            "Test MAE describes average held-out error, not an individual confidence interval."
        ),
    }
