"""
Model Evaluation Module.
Evaluates regression predictions against true targets.
Requires a minimum number of evaluation samples (default: 5) to report MAE, RMSE, and R2.
Otherwise returns the exact requirement: 'Insufficient data for reliable model evaluation.'
"""

from typing import Any, Dict, List

import numpy as np

INSUFFICIENT_EVAL_MESSAGE = "Insufficient data for reliable model evaluation."


def evaluate_regression_model(
    y_true: List[float], y_pred: List[float], min_samples: int = 5
) -> Dict[str, Any]:
    """
    Evaluate regression model performance with MAE, RMSE, and R2.
    Strictly checks for sufficient evaluation observations.
    """
    if len(y_true) < min_samples or len(y_pred) < min_samples or len(y_true) != len(y_pred):
        return {
            "evaluation_status": INSUFFICIENT_EVAL_MESSAGE,
            "sample_count": len(y_true),
            "mae": None,
            "rmse": None,
            "r2": None,
        }

    y_t = np.array(y_true, dtype=float)
    y_p = np.array(y_pred, dtype=float)

    # MAE: Mean Absolute Error
    mae = float(np.mean(np.abs(y_t - y_p)))

    # RMSE: Root Mean Squared Error
    rmse = float(np.sqrt(np.mean((y_t - y_p) ** 2)))

    # R²: Coefficient of Determination
    ss_res = np.sum((y_t - y_p) ** 2)
    ss_tot = np.sum((y_t - np.mean(y_t)) ** 2)
    r2 = float(1 - (ss_res / ss_tot)) if ss_tot > 1e-9 else 0.0
    r2 = max(-1.0, min(1.0, r2))

    return {
        "evaluation_status": "Evaluated",
        "sample_count": len(y_true),
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "r2": round(r2, 4),
    }
