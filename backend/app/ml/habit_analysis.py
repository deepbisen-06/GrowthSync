"""
Habit Analysis and Trajectory Engine for GrowthSync Milestone 2.
Analyzes Sleep, Exercise, and Screen Time.
Provides non-medical lifestyle observations and next-period predictions.
"""

from typing import Any, Dict, List

import numpy as np
from sklearn.linear_model import LinearRegression

from backend.app.ml.feature_engineering import build_habit_features
from backend.app.ml.preprocessing import check_habit_sufficiency, preprocess_habit_records


def analyze_habits(habit_records: List[Any]) -> Dict[str, Any]:
    """
    Perform statistical trend and trajectory analysis for daily habits.
    """
    df_habit = preprocess_habit_records(habit_records)
    n_days = len(df_habit)
    sufficiency = check_habit_sufficiency(n_days)

    if not sufficiency["can_analyze"]:
        return {
            "has_sufficient_data": False,
            "message": sufficiency["message"],
            "observation_count": n_days,
            "sleep_consistency_score": 0.0,  # Unavailable while has_sufficient_data is False.
            "habits": {
                "sleep": {
                    "average": 0.0,
                    "unit": "hrs",
                    "trend_percentage": 0.0,
                    "prediction": 0.0,
                    "insight": "Accumulate 7+ habit entries to unlock trend forecasting.",
                },
                "exercise": {
                    "average": 0,
                    "unit": "mins",
                    "trend_percentage": 0.0,
                    "prediction": 0,
                    "insight": "Accumulate 7+ habit entries to unlock trend forecasting.",
                },
                "screen_time": {
                    "average": 0.0,
                    "unit": "hrs",
                    "trend_percentage": 0.0,
                    "prediction": 0.0,
                    "insight": "Accumulate 7+ habit entries to unlock trend forecasting.",
                },
            },
            "history": [],
        }

    features = build_habit_features(df_habit)

    # Linear Regression for each habit to predict next day value
    t = np.arange(n_days).reshape(-1, 1)
    next_t = np.array([[n_days]])

    # 1. Sleep
    reg_sleep = LinearRegression().fit(t, df_habit["sleep_hours"].values)
    pred_sleep = round(float(max(0.0, reg_sleep.predict(next_t)[0])), 1)

    sleep_trend = features["sleep_trend_pct"]
    if abs(sleep_trend) < 3:
        sleep_insight = "Sleep schedule remains consistent and stable."
    elif sleep_trend > 0:
        sleep_insight = f"Average sleep increased by {sleep_trend}% compared to the prior period."
    else:
        sleep_insight = (
            f"Sleep duration decreased by {abs(sleep_trend)}% recently. Maintain regular bedtimes."
        )

    # 2. Exercise
    reg_ex = LinearRegression().fit(t, df_habit["exercise_minutes"].values)
    pred_ex = int(max(0, round(reg_ex.predict(next_t)[0])))

    ex_trend = features["exercise_trend_pct"]
    if ex_trend > 5:
        ex_insight = f"Physical activity frequency increased by {ex_trend}%. Great momentum!"
    elif ex_trend < -5:
        ex_insight = f"Exercise volume dropped by {abs(ex_trend)}%. Consider scheduling shorter 15-minute workouts."
    else:
        ex_insight = "Workout frequency is on a steady, maintained routine."

    # 3. Screen Time
    reg_sc = LinearRegression().fit(t, df_habit["screen_time"].values)
    pred_sc = round(float(max(0.0, reg_sc.predict(next_t)[0])), 1)

    sc_trend = features["screen_trend_pct"]
    if sc_trend > 10:
        sc_insight = f"Daily screen time increased by {sc_trend}% over recent entries."
    elif sc_trend < -10:
        sc_insight = (
            f"Screen time successfully reduced by {abs(sc_trend)}%. Improved digital balance."
        )
    else:
        sc_insight = "Screen time habits have remained steady."

    # Generate recent 7-day sparkline history
    history = []
    recent_records = df_habit.tail(14)
    for _, row in recent_records.iterrows():
        history.append(
            {
                "date": row["record_date"].strftime("%b %d"),
                "sleep_hours": round(float(row["sleep_hours"]), 1),
                "exercise_minutes": int(row["exercise_minutes"]),
                "screen_time": round(float(row["screen_time"]), 1),
            }
        )

    return {
        "has_sufficient_data": True,
        "message": f"Successfully analyzed habits across {n_days} daily logs.",
        "observation_count": n_days,
        "sleep_consistency_score": features["sleep_consistency_score"],
        "habits": {
            "sleep": {
                "average": features["avg_sleep"],
                "unit": "hrs/night",
                "trend_percentage": sleep_trend,
                "prediction": pred_sleep,
                "insight": sleep_insight,
            },
            "exercise": {
                "average": features["avg_exercise"],
                "unit": "mins/day",
                "trend_percentage": ex_trend,
                "prediction": pred_ex,
                "insight": ex_insight,
            },
            "screen_time": {
                "average": features["avg_screen_time"],
                "unit": "hrs/day",
                "trend_percentage": sc_trend,
                "prediction": pred_sc,
                "insight": sc_insight,
            },
        },
        "history": history,
    }
