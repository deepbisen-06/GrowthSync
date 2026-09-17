"""
Data Validation and Preprocessing Module for GrowthSync ML Layer.
Cleans, sorts, and checks temporal sufficiency of historical records.
"""

from datetime import date, datetime
from typing import Any, Dict, List

import pandas as pd


class SufficiencyStatus:
    INSUFFICIENT = "INSUFFICIENT"
    LIMITED_TREND = "LIMITED_TREND"
    SUFFICIENT = "SUFFICIENT"


def check_financial_sufficiency(monthly_records_count: int) -> Dict[str, Any]:
    """
    Tiered data sufficiency for financial forecasting:
    - < 2 months: Insufficient
    - 2-3 months: Limited trend warning
    - 4+ months: Sufficient baseline
    """
    if monthly_records_count < 2:
        return {
            "status": SufficiencyStatus.INSUFFICIENT,
            "can_forecast": False,
            "can_trend": False,
            "message": "More historical data is required to generate a personalized forecast. Add at least 2–3 months of financial records.",
            "observation_count": monthly_records_count,
        }
    elif monthly_records_count < 4:
        return {
            "status": SufficiencyStatus.LIMITED_TREND,
            "can_forecast": True,
            "can_trend": True,
            "message": "Preliminary Trend Analysis — Limited Historical Data (2–3 months). Baseline Linear Regression is active with a low-data confidence warning. 4+ monthly records recommended.",
            "observation_count": monthly_records_count,
        }
    else:
        return {
            "status": SufficiencyStatus.SUFFICIENT,
            "can_forecast": True,
            "can_trend": True,
            "message": "Sufficient historical data available for reliable baseline Linear Regression forecasting.",
            "observation_count": monthly_records_count,
        }


def check_study_sufficiency(days_count: int) -> Dict[str, Any]:
    """Study data sufficiency: requires at least 7 daily records for trend analysis."""
    if days_count < 7:
        return {
            "status": SufficiencyStatus.INSUFFICIENT,
            "can_analyze": False,
            "message": "At least 7 daily study logs are required to establish weekly study patterns and predict future hours.",
            "observation_count": days_count,
        }
    return {
        "status": SufficiencyStatus.SUFFICIENT,
        "can_analyze": True,
        "message": "Sufficient study history available.",
        "observation_count": days_count,
    }


def check_habit_sufficiency(days_count: int) -> Dict[str, Any]:
    """Habit data sufficiency: requires at least 7 daily records for trend analysis."""
    if days_count < 7:
        return {
            "status": SufficiencyStatus.INSUFFICIENT,
            "can_analyze": False,
            "message": "At least 7 daily habit logs are required to analyze lifestyle trends and consistency.",
            "observation_count": days_count,
        }
    return {
        "status": SufficiencyStatus.SUFFICIENT,
        "can_analyze": True,
        "message": "Sufficient habit history available.",
        "observation_count": days_count,
    }


def preprocess_financial_records(records: List[Any]) -> pd.DataFrame:
    """Transform financial SQLAlchemy records into a sorted pandas DataFrame."""
    if not records:
        return pd.DataFrame(
            columns=[
                "id",
                "created_at",
                "month_label",
                "monthly_income",
                "monthly_expenses",
                "monthly_savings",
                "financial_goal",
            ]
        )

    data = []
    for r in records:
        created = r.created_at if hasattr(r, "created_at") else datetime.utcnow()
        month_label = created.strftime("%b %Y")
        data.append(
            {
                "id": r.id,
                "created_at": created,
                "month_label": month_label,
                "monthly_income": float(r.monthly_income),
                "monthly_expenses": float(r.monthly_expenses),
                "monthly_savings": float(r.monthly_savings),
                "financial_goal": str(r.financial_goal or ""),
            }
        )

    df = pd.DataFrame(data)
    df.sort_values(by="created_at", ascending=True, inplace=True)
    df.reset_index(drop=True, inplace=True)
    return df


def preprocess_expense_records(records: List[Any]) -> pd.DataFrame:
    """Transform expense SQLAlchemy records into a sorted pandas DataFrame."""
    if not records:
        return pd.DataFrame(
            columns=[
                "id",
                "user_id",
                "amount",
                "category",
                "expense_date",
                "description",
                "created_at",
            ]
        )

    data = []
    for r in records:
        exp_date = r.expense_date if hasattr(r, "expense_date") else date.today()
        data.append(
            {
                "id": r.id,
                "user_id": r.user_id,
                "amount": float(r.amount),
                "category": str(r.category).strip().title(),
                "expense_date": exp_date,
                "description": str(r.description or ""),
                "created_at": r.created_at if hasattr(r, "created_at") else datetime.utcnow(),
            }
        )

    df = pd.DataFrame(data)
    df.sort_values(by=["expense_date", "id"], ascending=True, inplace=True)
    df.reset_index(drop=True, inplace=True)
    return df


def preprocess_study_records(records: List[Any]) -> pd.DataFrame:
    """Transform study SQLAlchemy records into a sorted pandas DataFrame."""
    if not records:
        return pd.DataFrame(
            columns=["id", "study_hours", "subjects", "academic_goal", "study_date", "day_of_week"]
        )

    data = []
    for r in records:
        s_date = r.study_date if hasattr(r, "study_date") else date.today()
        data.append(
            {
                "id": r.id,
                "study_hours": float(r.study_hours),
                "subjects": str(r.subjects or ""),
                "academic_goal": str(r.academic_goal or ""),
                "study_date": s_date,
                "day_of_week": s_date.strftime("%A"),
            }
        )

    df = pd.DataFrame(data)
    df.sort_values(by=["study_date", "id"], ascending=True, inplace=True)
    df.reset_index(drop=True, inplace=True)
    return df


def preprocess_habit_records(records: List[Any]) -> pd.DataFrame:
    """Transform habit SQLAlchemy records into a sorted pandas DataFrame."""
    if not records:
        return pd.DataFrame(
            columns=[
                "id",
                "sleep_hours",
                "exercise_minutes",
                "screen_time",
                "habit_notes",
                "record_date",
                "day_of_week",
            ]
        )

    data = []
    for r in records:
        h_date = r.record_date if hasattr(r, "record_date") else date.today()
        data.append(
            {
                "id": r.id,
                "sleep_hours": float(r.sleep_hours),
                "exercise_minutes": int(r.exercise_minutes),
                "screen_time": float(r.screen_time),
                "habit_notes": str(r.habit_notes or ""),
                "record_date": h_date,
                "day_of_week": h_date.strftime("%A"),
            }
        )

    df = pd.DataFrame(data)
    df.sort_values(by=["record_date", "id"], ascending=True, inplace=True)
    df.reset_index(drop=True, inplace=True)
    return df
