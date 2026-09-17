"""
Feature Engineering Module for GrowthSync ML Layer.
Generates temporal lag features, category budget ratios, and moving averages.
"""

from typing import Any, Dict

import numpy as np
import pandas as pd


def build_financial_features(df_fin: pd.DataFrame, df_exp: pd.DataFrame) -> Dict[str, Any]:
    """
    Extract temporal features for linear regression forecasting:
    - time indices t = 0, 1, ..., N-1
    - lag-1 expenses, lag-1 savings
    - savings rate
    - category distributions from df_exp
    """
    if df_fin.empty:
        return {"features": None, "category_summary": [], "highest_category": None}

    n = len(df_fin)
    t = np.arange(n).reshape(-1, 1)

    expenses = df_fin["monthly_expenses"].values
    savings = df_fin["monthly_savings"].values
    incomes = df_fin["monthly_income"].values

    # Category aggregation from expense records if available
    category_summary = []
    highest_category = None
    if not df_exp.empty:
        cat_group = df_exp.groupby("category")["amount"].agg(["sum", "count"]).reset_index()
        total_exp = cat_group["sum"].sum()
        for _, row in cat_group.iterrows():
            pct = (row["sum"] / total_exp * 100) if total_exp > 0 else 0
            category_summary.append(
                {
                    "category": row["category"],
                    "total_amount": round(float(row["sum"]), 2),
                    "percentage": round(float(pct), 1),
                    "count": int(row["count"]),
                }
            )
        category_summary.sort(key=lambda x: x["total_amount"], reverse=True)
        if category_summary:
            highest_category = category_summary[0]["category"]

    # Month-over-month growth rate
    expense_growth_rate = 0.0
    savings_growth_rate = 0.0
    if n >= 2:
        prev_exp = expenses[-2]
        curr_exp = expenses[-1]
        if prev_exp > 0:
            expense_growth_rate = round(((curr_exp - prev_exp) / prev_exp) * 100, 2)

        prev_sav = savings[-2]
        curr_sav = savings[-1]
        if abs(prev_sav) > 0:
            savings_growth_rate = round(((curr_sav - prev_sav) / abs(prev_sav)) * 100, 2)

    return {
        "t": t,
        "expenses": expenses,
        "savings": savings,
        "incomes": incomes,
        "category_summary": category_summary,
        "highest_category": highest_category,
        "expense_growth_rate": expense_growth_rate,
        "savings_growth_rate": savings_growth_rate,
        "observation_count": n,
    }


def build_study_features(df_study: pd.DataFrame) -> Dict[str, Any]:
    """
    Feature engineering for study patterns:
    - total hours
    - daily average
    - Best Study Day (from study_date day of week aggregation)
    - weekly study trends
    """
    if df_study.empty:
        return {
            "total_hours": 0.0,
            "avg_hours": 0.0,
            "best_study_day": None,
            "days_analyzed": 0,
            "weekly_buckets": [],
        }

    total_hours = float(df_study["study_hours"].sum())
    avg_hours = float(df_study["study_hours"].mean())
    days_analyzed = len(df_study)

    # Calculate Best Study Day strictly from study_date day_of_week
    day_group = (
        df_study.groupby("day_of_week")["study_hours"].agg(["mean", "sum", "count"]).reset_index()
    )
    day_group.sort_values(by="mean", ascending=False, inplace=True)
    best_day_row = day_group.iloc[0]
    best_study_day = {
        "day": str(best_day_row["day_of_week"]),
        "avg_hours": round(float(best_day_row["mean"]), 2),
        "total_sessions": int(best_day_row["count"]),
    }

    return {
        "total_hours": round(total_hours, 2),
        "avg_hours": round(avg_hours, 2),
        "best_study_day": best_study_day,
        "days_analyzed": days_analyzed,
    }


def build_habit_features(df_habit: pd.DataFrame) -> Dict[str, Any]:
    """
    Feature engineering for habit tracking (Sleep, Exercise, Screen Time):
    - rolling averages
    - standard deviation (consistency)
    - percentage trend change vs previous window
    """
    if df_habit.empty:
        return {
            "avg_sleep": 0.0,
            "avg_exercise": 0.0,
            "avg_screen_time": 0.0,
            "sleep_consistency_score": 0.0,
            "days_logged": 0,
        }

    n = len(df_habit)
    avg_sleep = float(df_habit["sleep_hours"].mean())
    avg_exercise = float(df_habit["exercise_minutes"].mean())
    avg_screen = float(df_habit["screen_time"].mean())

    # Consistency score: inversely proportional to standard deviation in sleep
    std_sleep = float(df_habit["sleep_hours"].std()) if n > 1 else 0.5
    sleep_consistency = max(0, min(100, int(100 - (std_sleep * 20))))

    # Compute trend changes if >= 4 entries (comparing first half vs second half)
    half = n // 2
    sleep_trend_pct = 0.0
    exercise_trend_pct = 0.0
    screen_trend_pct = 0.0
    if half >= 2:
        h1 = df_habit.iloc[:half]
        h2 = df_habit.iloc[half:]

        m_sleep1, m_sleep2 = h1["sleep_hours"].mean(), h2["sleep_hours"].mean()
        if m_sleep1 > 0:
            sleep_trend_pct = round(((m_sleep2 - m_sleep1) / m_sleep1) * 100, 1)

        m_ex1, m_ex2 = h1["exercise_minutes"].mean(), h2["exercise_minutes"].mean()
        if m_ex1 > 0:
            exercise_trend_pct = round(((m_ex2 - m_ex1) / m_ex1) * 100, 1)

        m_sc1, m_sc2 = h1["screen_time"].mean(), h2["screen_time"].mean()
        if m_sc1 > 0:
            screen_trend_pct = round(((m_sc2 - m_sc1) / m_sc1) * 100, 1)

    return {
        "avg_sleep": round(avg_sleep, 2),
        "avg_exercise": round(avg_exercise, 1),
        "avg_screen_time": round(avg_screen, 2),
        "sleep_consistency_score": sleep_consistency,
        "sleep_trend_pct": sleep_trend_pct,
        "exercise_trend_pct": exercise_trend_pct,
        "screen_trend_pct": screen_trend_pct,
        "days_logged": n,
    }
