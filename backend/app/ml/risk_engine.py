"""
Future Risk and Threat Engine for GrowthSync Milestone 2.
Evaluates negative trends across financial, academic, and lifestyle domains.
Outputs explainable warnings categorized by risk level (LOW, MEDIUM, HIGH)
with underlying metrics and constructive action items.
"""

from typing import Any, Dict, List


def evaluate_risks(
    financial_forecast: Dict[str, Any],
    productivity_data: Dict[str, Any],
    habit_data: Dict[str, Any],
) -> List[Dict[str, Any]]:
    """
    Evaluate potential future threats and deviations from targets.
    """
    risks = []

    # 1. Financial Threat Analysis
    if financial_forecast.get("has_sufficient_data"):
        savings_growth = financial_forecast.get("savings_growth_percentage", 0.0)
        expense_growth = financial_forecast.get("expense_growth_percentage", 0.0)
        overspending = financial_forecast.get("overspending_risk", False)
        predicted_savings = financial_forecast.get("predicted_next_savings", 0.0)
        cat_breakdown = financial_forecast.get("category_breakdown", [])

        # Threat: Expenses outpacing income or negative savings
        if predicted_savings is not None and predicted_savings < 0:
            risks.append(
                {
                    "type": "negative_savings_projection",
                    "level": "HIGH",
                    "category": "Financial",
                    "reason": "Projected monthly expenses exceed income, threatening to create a monthly deficit.",
                    "supporting_metric": f"Predicted Next Month Savings: ₹{predicted_savings:,.2f}",
                    "recommendation": "Review discretionary expense categories to curb outflows before next month.",
                }
            )
        elif expense_growth > 15.0 and savings_growth < 0:
            risks.append(
                {
                    "type": "accelerating_expenses",
                    "level": "MEDIUM",
                    "category": "Financial",
                    "reason": f"Monthly spending increased by {expense_growth}% while savings contracted by {abs(savings_growth)}%.",
                    "supporting_metric": f"Expense Growth: +{expense_growth}%, Savings Growth: {savings_growth}%",
                    "recommendation": "Set a monthly spending ceiling on non-essential categories.",
                }
            )
        elif overspending:
            risks.append(
                {
                    "type": "overspending_trajectory",
                    "level": "MEDIUM",
                    "category": "Financial",
                    "reason": "Expense growth rate is currently steeper than your income trajectory.",
                    "supporting_metric": "Expense regression slope > Income slope",
                    "recommendation": "Allocate a fixed 20% direct-to-savings allocation on payday.",
                }
            )

        # Category concentration threat (>40% of expenses in shopping or entertainment)
        for cat in cat_breakdown:
            if cat["category"] in ["Shopping", "Entertainment"] and cat["percentage"] >= 35.0:
                risks.append(
                    {
                        "type": "high_discretionary_spending",
                        "level": "LOW",
                        "category": "Financial",
                        "reason": f"{cat['category']} accounts for {cat['percentage']}% of your total logged expenses.",
                        "supporting_metric": f"{cat['category']}: ₹{cat['total_amount']:,.2f} ({cat['percentage']}%)",
                        "recommendation": f"Consider rebalancing budget from {cat['category']} into your primary financial goal.",
                    }
                )

    # 2. Productivity Threat Analysis
    if productivity_data.get("has_sufficient_data"):
        score = productivity_data.get("productivity_score", 0)
        change_pct = productivity_data.get("change_percentage", 0.0)
        trend = productivity_data.get("trend", "stable")
        breakdown = productivity_data.get("breakdown", {})

        if trend == "declining" and change_pct <= -10.0:
            risks.append(
                {
                    "type": "steep_productivity_decline",
                    "level": "HIGH",
                    "category": "Productivity",
                    "reason": f"Overall productivity score declined by {abs(change_pct)}% compared to the prior period.",
                    "supporting_metric": f"Score changed from {productivity_data.get('previous_score')} to {score}",
                    "recommendation": "Schedule dedicated, distraction-free study blocks and limit screen time.",
                }
            )
        elif score < 50:
            risks.append(
                {
                    "type": "low_productivity_score",
                    "level": "MEDIUM",
                    "category": "Productivity",
                    "reason": "Current composite productivity score is in the lower quartile.",
                    "supporting_metric": f"Productivity Score: {score}/100",
                    "recommendation": "Focus on improving study consistency and maintaining 7–8 hours of regular sleep.",
                }
            )

        if breakdown.get("study", 100) < 40:
            risks.append(
                {
                    "type": "study_volume_deficit",
                    "level": "MEDIUM",
                    "category": "Study",
                    "reason": "Study progress subscore indicates low weekly study duration.",
                    "supporting_metric": f"Study Subscore: {breakdown.get('study')}/100",
                    "recommendation": "Establish a consistent daily minimum of 1.5 to 2 study hours.",
                }
            )

    # 3. Habit Threat Analysis
    if habit_data.get("has_sufficient_data"):
        habits = habit_data.get("habits", {})
        sleep = habits.get("sleep", {})
        exercise = habits.get("exercise", {})
        screen = habits.get("screen_time", {})

        # Sleep threat
        if sleep.get("average", 8.0) < 6.0:
            risks.append(
                {
                    "type": "chronic_sleep_deficit",
                    "level": "HIGH",
                    "category": "Habits",
                    "reason": "Average sleep duration is under 6 hours per night, which can impair cognitive performance.",
                    "supporting_metric": f"Average Sleep: {sleep.get('average')} hrs/night",
                    "recommendation": "Prioritize a fixed bedtime and turn off blue-light devices 45 minutes before sleep.",
                }
            )

        # Screen time surge threat
        if screen.get("average", 0.0) >= 7.0 or screen.get("trend_percentage", 0.0) >= 20.0:
            risks.append(
                {
                    "type": "screen_time_surge",
                    "level": "MEDIUM",
                    "category": "Habits",
                    "reason": "Screen time has increased substantially and exceeds 7 hours daily.",
                    "supporting_metric": f"Avg Screen Time: {screen.get('average')} hrs/day (+{screen.get('trend_percentage')}%)",
                    "recommendation": "Utilize app timers and substitute 30 minutes of screen time with reading or exercise.",
                }
            )

        # Exercise hiatus threat
        if exercise.get("average", 0) < 10 and exercise.get("trend_percentage", 0.0) < -15.0:
            risks.append(
                {
                    "type": "exercise_inactivity",
                    "level": "LOW",
                    "category": "Habits",
                    "reason": "Physical activity has dipped below recommended daily levels.",
                    "supporting_metric": f"Average Exercise: {exercise.get('average')} mins/day",
                    "recommendation": "Integrate brisk 15-minute walks or light morning stretching into your routine.",
                }
            )

    # Sort risks by severity: HIGH first, then MEDIUM, then LOW
    level_weights = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    risks.sort(key=lambda x: level_weights.get(x["level"], 3))
    return risks
