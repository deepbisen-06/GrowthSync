"""
Study Forecasting and Habit Modeling for GrowthSync Milestone 2.
Calculates average weekly hours, study consistency, predicted next-week study hours,
and the Best Study Day strictly derived from historical study_date patterns.
"""

from typing import Any, Dict, List

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression

from backend.app.ml.feature_engineering import build_study_features
from backend.app.ml.preprocessing import check_study_sufficiency, preprocess_study_records


def forecast_study(study_records: List[Any]) -> Dict[str, Any]:
    """
    Generate study forecast, weekly volume prediction, and day-of-week productivity insights.
    """
    df_study = preprocess_study_records(study_records)
    n_days = len(df_study)
    sufficiency = check_study_sufficiency(n_days)

    if not sufficiency["can_analyze"]:
        return {
            "has_sufficient_data": False,
            "message": sufficiency["message"],
            "observation_count": n_days,
            "total_study_hours": float(df_study["study_hours"].sum()) if n_days > 0 else 0.0,
            "avg_daily_hours": float(df_study["study_hours"].mean()) if n_days > 0 else 0.0,
            "avg_weekly_hours": 0.0,
            "study_consistency_percentage": 0.0,
            "best_study_day": None,
            "recent_trend": "stable",
            "predicted_next_week_hours": None,
            "weekly_history": [],
        }

    features = build_study_features(df_study)

    # Weekly aggregation
    df_study["week"] = pd.to_datetime(df_study["study_date"]).dt.isocalendar().week
    weekly_agg = df_study.groupby("week")["study_hours"].sum().reset_index()
    weekly_hours_list = weekly_agg["study_hours"].tolist()

    avg_weekly_hours = round(float(np.mean(weekly_hours_list)), 1) if weekly_hours_list else 0.0

    # Study consistency: percentage of calendar days logged in the range
    min_date = df_study["study_date"].min()
    max_date = df_study["study_date"].max()
    span_days = max(1, (max_date - min_date).days + 1)
    consistency_pct = round((n_days / span_days) * 100.0, 1)

    # Predict next week hours using Linear Regression on weekly buckets
    predicted_next_week = avg_weekly_hours
    trend_direction = "stable"
    if len(weekly_hours_list) >= 2:
        t_weeks = np.arange(len(weekly_hours_list)).reshape(-1, 1)
        y_weeks = np.array(weekly_hours_list)
        reg = LinearRegression()
        reg.fit(t_weeks, y_weeks)
        slope = float(reg.coef_[0])
        next_week_pred = float(reg.predict([[len(weekly_hours_list)]])[0])
        predicted_next_week = round(max(0.0, next_week_pred), 1)

        if slope > 0.5:
            trend_direction = "improving"
        elif slope < -0.5:
            trend_direction = "declining"

    # Build weekly history comparison for charting
    weekly_history = []
    for idx, row in weekly_agg.iterrows():
        weekly_history.append(
            {
                "week_label": f"Week {int(row['week'])}",
                "study_hours": round(float(row["study_hours"]), 1),
            }
        )

    weekly_history.append(
        {"week_label": "Next Week (Forecast)", "study_hours": predicted_next_week}
    )

    return {
        "has_sufficient_data": True,
        "message": f"Analyzed {n_days} study sessions across {len(weekly_agg)} weeks.",
        "observation_count": n_days,
        "total_study_hours": features["total_hours"],
        "avg_daily_hours": features["avg_hours"],
        "avg_weekly_hours": avg_weekly_hours,
        "study_consistency_percentage": consistency_pct,
        "best_study_day": features["best_study_day"],
        "recent_trend": trend_direction,
        "predicted_next_week_hours": predicted_next_week,
        "weekly_history": weekly_history,
    }
