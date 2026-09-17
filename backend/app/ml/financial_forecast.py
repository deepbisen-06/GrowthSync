"""
Financial Forecasting Engine for GrowthSync Milestone 2.
Uses scikit-learn LinearRegression as the baseline forecasting model.
Evaluates historical monthly trends and outputs projected expenses, savings,
category allocations, and goal achievement projections.
"""

from typing import Any, Dict, List

import numpy as np
from sklearn.linear_model import LinearRegression

from backend.app.ml.feature_engineering import build_financial_features
from backend.app.ml.model_evaluation import evaluate_regression_model
from backend.app.ml.preprocessing import (
    SufficiencyStatus,
    check_financial_sufficiency,
    preprocess_expense_records,
    preprocess_financial_records,
)


def forecast_financials(financial_records: List[Any], expense_records: List[Any]) -> Dict[str, Any]:
    """
    Execute Linear Regression forecasting for monthly financial trajectory.
    """
    df_fin = preprocess_financial_records(financial_records)
    df_exp = preprocess_expense_records(expense_records)

    n_records = len(df_fin)
    sufficiency = check_financial_sufficiency(n_records)

    # If < 2 records, return clean empty state without synthetic values
    if not sufficiency["can_forecast"]:
        return {
            "has_sufficient_data": False,
            "sufficiency_status": sufficiency["status"],
            "message": sufficiency["message"],
            "observation_count": n_records,
            "current_savings": float(df_fin["monthly_savings"].iloc[-1]) if n_records > 0 else 0.0,
            "current_income": float(df_fin["monthly_income"].iloc[-1]) if n_records > 0 else 0.0,
            "current_expenses": float(df_fin["monthly_expenses"].iloc[-1])
            if n_records > 0
            else 0.0,
            "predicted_next_expenses": None,
            "predicted_next_savings": None,
            "savings_projection": [],
            "category_breakdown": [],
            "highest_spending_category": None,
            "savings_growth_percentage": 0.0,
            "goal_progress": None,
            "overspending_risk": False,
            "model_metadata": {
                "model_name": "Linear Regression (scikit-learn)",
                "evaluation_status": "Insufficient data for reliable model evaluation.",
                "sample_count": n_records,
                "mae": None,
                "rmse": None,
                "r2": None,
            },
        }

    features = build_financial_features(df_fin, df_exp)
    t = features["t"]
    y_exp = features["expenses"]
    y_sav = features["savings"]
    y_inc = features["incomes"]

    # 1. Fit Baseline Linear Regression for Expenses
    exp_model = LinearRegression()
    exp_model.fit(t, y_exp)
    pred_exp_in_sample = exp_model.predict(t)

    # 2. Fit Baseline Linear Regression for Savings
    sav_model = LinearRegression()
    sav_model.fit(t, y_sav)
    pred_sav_in_sample = sav_model.predict(t)

    # Predict Next Month (t = n_records)
    next_t = np.array([[n_records]])
    predicted_next_exp = float(max(0.0, exp_model.predict(next_t)[0]))
    predicted_next_sav = float(sav_model.predict(next_t)[0])

    # Future multi-period projections (Next 1M, 2M, 3M, 6M, 12M)
    future_steps = [1, 2, 3, 6, 12]
    projection_points = []
    curr_savings_cum = float(np.sum(y_sav))

    for step in future_steps:
        target_idx = np.array([[n_records - 1 + step]])
        p_sav = float(sav_model.predict(target_idx)[0])
        p_exp = float(max(0.0, exp_model.predict(target_idx)[0]))
        projection_points.append(
            {
                "period_months_ahead": step,
                "label": f"+{step} Mo",
                "predicted_monthly_expenses": round(p_exp, 2),
                "predicted_monthly_savings": round(p_sav, 2),
                "projected_cumulative_savings": round(curr_savings_cum + (p_sav * step), 2),
            }
        )

    # Historical actual vs predicted curve for charts
    history_comparison = []
    for i in range(n_records):
        row = df_fin.iloc[i]
        history_comparison.append(
            {
                "month_label": row["month_label"],
                "actual_expenses": round(float(y_exp[i]), 2),
                "predicted_expenses": round(float(pred_exp_in_sample[i]), 2),
                "actual_savings": round(float(y_sav[i]), 2),
                "predicted_savings": round(float(pred_sav_in_sample[i]), 2),
            }
        )

    # Add next month projection point to the chart points
    history_comparison.append(
        {
            "month_label": "Next Month (Forecast)",
            "actual_expenses": None,
            "predicted_expenses": round(predicted_next_exp, 2),
            "actual_savings": None,
            "predicted_savings": round(predicted_next_sav, 2),
        }
    )

    # Model Evaluation (Strict threshold: only when sample_count >= 5)
    eval_results = evaluate_regression_model(
        y_true=y_exp.tolist(), y_pred=pred_exp_in_sample.tolist(), min_samples=5
    )

    # Goal Progress Calculation
    latest_row = df_fin.iloc[-1]
    financial_goal = str(latest_row["financial_goal"])
    goal_progress = {
        "goal_name": financial_goal,
        "current_total_savings": round(curr_savings_cum, 2),
        "predicted_monthly_contribution": round(predicted_next_sav, 2),
        "status": "Tracking actively"
        if predicted_next_sav > 0
        else "Needs attention: Monthly savings declining",
    }

    # Overspending Risk: Expense slope > Income slope OR negative projected savings
    exp_slope = float(exp_model.coef_[0])
    inc_slope = float(np.polyfit(t.flatten(), y_inc, 1)[0]) if n_records >= 2 else 0.0
    overspending_risk = (exp_slope > inc_slope and exp_slope > 0) or (predicted_next_sav < 0)

    return {
        "has_sufficient_data": True,
        "sufficiency_status": sufficiency["status"],
        "low_data_warning": sufficiency["status"] == SufficiencyStatus.LIMITED_TREND,
        "message": sufficiency["message"],
        "observation_count": n_records,
        "current_savings": round(float(y_sav[-1]), 2),
        "current_income": round(float(y_inc[-1]), 2),
        "current_expenses": round(float(y_exp[-1]), 2),
        "predicted_next_expenses": round(predicted_next_exp, 2),
        "predicted_next_savings": round(predicted_next_sav, 2),
        "savings_growth_percentage": features["savings_growth_rate"],
        "expense_growth_percentage": features["expense_growth_rate"],
        "savings_projection": projection_points,
        "history_comparison": history_comparison,
        "category_breakdown": features["category_summary"],
        "highest_spending_category": features["highest_category"],
        "goal_progress": goal_progress,
        "overspending_risk": overspending_risk,
        "model_metadata": {
            "model_name": "Linear Regression (scikit-learn)",
            "evaluation_status": eval_results["evaluation_status"],
            "sample_count": n_records,
            "mae": eval_results["mae"],
            "rmse": eval_results["rmse"],
            "r2": eval_results["r2"],
        },
    }
