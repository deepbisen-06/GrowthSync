"""
Productivity Analysis Engine for GrowthSync Milestone 2.
Calculates an explainable 0–100 score based on study, sleep, exercise, and screen time.
Compares current vs previous periods, assesses trend direction, and predicts future productivity.
"""

from typing import Any, Dict, List

from backend.app.ml.preprocessing import preprocess_habit_records, preprocess_study_records

# Centralized, transparent factor weights summing to 1.0 (100%)
PRODUCTIVITY_WEIGHTS = {
    "study": 0.35,  # 35%: Study volume and consistency
    "sleep": 0.25,  # 25%: Sleep regularity and optimal range (7–9 hrs)
    "exercise": 0.20,  # 20%: Physical activity (target >= 30 min/day)
    "screen_time": 0.20,  # 20%: Screen-time balance (penalizing > 6 hrs)
}


def calculate_study_subscore(study_hours_list: List[float], days_window: int) -> float:
    """Calculate 0-100 score for study progress (benchmark: 3 hrs/day average)."""
    if not study_hours_list or days_window == 0:
        return 50.0  # Neutral baseline
    avg_hours = sum(study_hours_list) / max(1, days_window)
    # 3.0 hrs/day maps to 100
    score = min(100.0, (avg_hours / 3.0) * 100.0)
    return max(0.0, score)


def calculate_sleep_subscore(sleep_hours_list: List[float]) -> float:
    """Calculate 0-100 score for sleep (optimal: 7-9 hours, penalties for extremes)."""
    if not sleep_hours_list:
        return 60.0
    avg_sleep = sum(sleep_hours_list) / len(sleep_hours_list)
    # Deviation from 8.0 hours
    deviation = abs(avg_sleep - 8.0)
    score = max(0.0, 100.0 - (deviation * 25.0))
    return min(100.0, score)


def calculate_exercise_subscore(exercise_mins_list: List[int]) -> float:
    """Calculate 0-100 score for exercise (target: 30 mins/day average)."""
    if not exercise_mins_list:
        return 40.0
    avg_mins = sum(exercise_mins_list) / len(exercise_mins_list)
    score = min(100.0, (avg_mins / 30.0) * 100.0)
    return max(0.0, score)


def calculate_screen_time_subscore(screen_hours_list: List[float]) -> float:
    """Calculate 0-100 score for screen time (healthy: <= 4 hrs, degrades up to 10 hrs)."""
    if not screen_hours_list:
        return 70.0
    avg_screen = sum(screen_hours_list) / len(screen_hours_list)
    if avg_screen <= 4.0:
        return 100.0
    # Linearly decay from 100 at 4 hrs to 0 at 10+ hrs
    decay = ((avg_screen - 4.0) / 6.0) * 100.0
    return max(0.0, min(100.0, 100.0 - decay))


def analyze_productivity(study_records: List[Any], habit_records: List[Any]) -> Dict[str, Any]:
    """
    Analyze productivity metrics and produce a composite explainable 0-100 score.
    """
    df_study = preprocess_study_records(study_records)
    df_habit = preprocess_habit_records(habit_records)

    total_logs = len(df_study) + len(df_habit)
    if total_logs == 0:
        return {
            "has_sufficient_data": False,
            "message": "Log study sessions and daily habits to unlock your personalized Productivity Score.",
            "productivity_score": 0,
            "breakdown": {"study": 0, "sleep": 0, "exercise": 0, "screen_time": 0},
            "previous_score": 0,
            "change_percentage": 0.0,
            "trend": "stable",
            "predicted_future_score": 0,
            "confidence_label": "No Data",
            "weights_used": PRODUCTIVITY_WEIGHTS,
        }

    # Split into current window (recent 7 records) vs previous window (preceding records)
    n_habit = len(df_habit)
    n_study = len(df_study)

    # Current window
    curr_study_hours = df_study["study_hours"].tail(7).tolist() if n_study > 0 else []
    curr_sleep = df_habit["sleep_hours"].tail(7).tolist() if n_habit > 0 else []
    curr_exercise = df_habit["exercise_minutes"].tail(7).tolist() if n_habit > 0 else []
    curr_screen = df_habit["screen_time"].tail(7).tolist() if n_habit > 0 else []

    score_study = calculate_study_subscore(curr_study_hours, max(len(curr_study_hours), 7))
    score_sleep = calculate_sleep_subscore(curr_sleep)
    score_exercise = calculate_exercise_subscore(curr_exercise)
    score_screen = calculate_screen_time_subscore(curr_screen)

    curr_score = (
        score_study * PRODUCTIVITY_WEIGHTS["study"]
        + score_sleep * PRODUCTIVITY_WEIGHTS["sleep"]
        + score_exercise * PRODUCTIVITY_WEIGHTS["exercise"]
        + score_screen * PRODUCTIVITY_WEIGHTS["screen_time"]
    )
    curr_score = int(round(curr_score))

    # Previous window calculation
    prev_score = curr_score
    change_pct = 0.0
    if n_habit >= 8 or n_study >= 8:
        prev_study_hours = (
            df_study["study_hours"].iloc[:-7].tail(7).tolist() if n_study > 7 else curr_study_hours
        )
        prev_sleep = (
            df_habit["sleep_hours"].iloc[:-7].tail(7).tolist() if n_habit > 7 else curr_sleep
        )
        prev_exercise = (
            df_habit["exercise_minutes"].iloc[:-7].tail(7).tolist()
            if n_habit > 7
            else curr_exercise
        )
        prev_screen = (
            df_habit["screen_time"].iloc[:-7].tail(7).tolist() if n_habit > 7 else curr_screen
        )

        p_study = calculate_study_subscore(prev_study_hours, max(len(prev_study_hours), 7))
        p_sleep = calculate_sleep_subscore(prev_sleep)
        p_exercise = calculate_exercise_subscore(prev_exercise)
        p_screen = calculate_screen_time_subscore(prev_screen)

        prev_score = int(
            round(
                p_study * PRODUCTIVITY_WEIGHTS["study"]
                + p_sleep * PRODUCTIVITY_WEIGHTS["sleep"]
                + p_exercise * PRODUCTIVITY_WEIGHTS["exercise"]
                + p_screen * PRODUCTIVITY_WEIGHTS["screen_time"]
            )
        )

        if prev_score > 0:
            change_pct = round(((curr_score - prev_score) / prev_score) * 100.0, 1)

    # Trend categorization
    if change_pct >= 3.0:
        trend = "improving"
    elif change_pct <= -3.0:
        trend = "declining"
    else:
        trend = "stable"

    # Future prediction: linear extrapolation of trend capped in [0, 100]
    predicted_future = int(max(0, min(100, round(curr_score + (change_pct * 0.5)))))

    confidence_label = (
        "High Confidence"
        if (n_study >= 14 and n_habit >= 14)
        else "Moderate Confidence"
        if (n_study >= 7 or n_habit >= 7)
        else "Preliminary"
    )

    return {
        "has_sufficient_data": True,
        "message": f"Productivity score computed across {n_study} study sessions and {n_habit} habit records.",
        "productivity_score": curr_score,
        "breakdown": {
            "study": int(round(score_study)),
            "sleep": int(round(score_sleep)),
            "exercise": int(round(score_exercise)),
            "screen_time": int(round(score_screen)),
        },
        "previous_score": prev_score,
        "change_percentage": change_pct,
        "trend": trend,
        "predicted_future_score": predicted_future,
        "confidence_label": confidence_label,
        "weights_used": PRODUCTIVITY_WEIGHTS,
    }
