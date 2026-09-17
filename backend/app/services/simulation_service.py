"""
GrowthSync Future Simulator Service.
Implements the 'What-If Simulation Engine' without altering PostgreSQL stored records.
Calculates real-time baseline vs simulated trajectories for financial and productivity outcomes.
"""

from sqlalchemy.orm import Session

from backend.app.ml.productivity_model import (
    PRODUCTIVITY_WEIGHTS,
    calculate_exercise_subscore,
    calculate_screen_time_subscore,
    calculate_sleep_subscore,
    calculate_study_subscore,
)
from backend.app.schemas.simulation import (
    SimulationMetricComparison,
    WhatIfSimulationRequest,
    WhatIfSimulationResponse,
)
from backend.app.services.activity_service import log_activity
from backend.app.services.analytics_service import AnalyticsService


class SimulationService:
    @staticmethod
    def run_what_if_simulation(
        user_id: int, payload: WhatIfSimulationRequest, db: Session
    ) -> WhatIfSimulationResponse:
        """
        Execute stateless simulation comparing current personal metrics against user-simulated inputs.
        """
        # 1. Fetch current baseline metrics
        fin = AnalyticsService.get_financial_forecast(user_id, db)
        prod = AnalyticsService.get_productivity_analysis(user_id, db)
        study = AnalyticsService.get_study_forecast(user_id, db)
        habits = AnalyticsService.get_habit_analysis(user_id, db)

        # Baseline Financial values
        base_income = fin.get("current_income", 45000.0) or 45000.0
        base_expenses = (
            fin.get("predicted_next_expenses") or fin.get("current_expenses", 30000.0) or 30000.0
        )
        base_savings = (
            fin.get("predicted_next_savings") or fin.get("current_savings", 15000.0) or 15000.0
        )

        # Simulated Financial outcomes
        sim_income = max(0.0, base_income + payload.income_delta)
        sim_expenses = max(0.0, base_expenses - payload.expense_reduction)
        sim_savings = sim_income - sim_expenses

        delta_exp = round(sim_expenses - base_expenses, 2)
        delta_sav = round(sim_savings - base_savings, 2)
        delta_ann_sav = round(delta_sav * 12.0, 2)

        # Baseline Productivity values
        base_prod_score = prod.get("productivity_score", 65) or 65
        base_breakdown = prod.get("breakdown", {})
        base_study_sub = base_breakdown.get("study", 60)
        base_sleep_sub = base_breakdown.get("sleep", 70)
        base_screen_sub = base_breakdown.get("screen_time", 60)

        # Simulated Study & Habit inputs
        curr_daily_study = study.get("avg_daily_hours", 2.0) or 2.0
        sim_daily_study = max(0.0, curr_daily_study + payload.daily_study_delta_hours)
        sim_study_sub = int(round(calculate_study_subscore([sim_daily_study] * 7, 7)))

        curr_sleep = habits.get("habits", {}).get("sleep", {}).get("average", 7.0) or 7.0
        sim_sleep = max(0.0, min(14.0, curr_sleep + payload.daily_sleep_delta_hours))
        sim_sleep_sub = int(round(calculate_sleep_subscore([sim_sleep] * 7)))

        curr_ex = habits.get("habits", {}).get("exercise", {}).get("average", 20) or 20
        sim_ex = max(0, curr_ex + payload.weekly_exercise_extra_minutes)
        sim_ex_sub = int(round(calculate_exercise_subscore([sim_ex] * 7)))

        curr_screen = habits.get("habits", {}).get("screen_time", {}).get("average", 5.0) or 5.0
        sim_screen = max(0.0, curr_screen - payload.daily_screen_time_reduction_hours)
        sim_screen_sub = int(round(calculate_screen_time_subscore([sim_screen] * 7)))

        sim_prod_score = int(
            round(
                sim_study_sub * PRODUCTIVITY_WEIGHTS["study"]
                + sim_sleep_sub * PRODUCTIVITY_WEIGHTS["sleep"]
                + sim_ex_sub * PRODUCTIVITY_WEIGHTS["exercise"]
                + sim_screen_sub * PRODUCTIVITY_WEIGHTS["screen_time"]
            )
        )
        delta_prod = sim_prod_score - base_prod_score

        # Generate contextual simulation insights
        insights = []
        if payload.expense_reduction > 0:
            insights.append(
                f"Trimming ₹{payload.expense_reduction:,.0f}/mo in expenses increases your 1-year savings pool by ₹{payload.expense_reduction * 12:,.0f}."
            )
        if payload.daily_study_delta_hours > 0:
            insights.append(
                f"Studying an extra {payload.daily_study_delta_hours} hr/day would add ~{payload.daily_study_delta_hours * 7:.1f} hours weekly, raising your Study Subscore to {sim_study_sub}/100."
            )
        if payload.daily_screen_time_reduction_hours > 0:
            insights.append(
                f"Reclaiming {payload.daily_screen_time_reduction_hours} hr/day from screen time improves focus balance by +{sim_screen_sub - base_screen_sub} points."
            )
        if delta_prod > 0:
            insights.append(
                f"Overall simulated productivity jumps from {base_prod_score}% to {sim_prod_score}% (+{delta_prod} percentage points)."
            )
        if not insights:
            insights.append(
                "Adjust the simulation sliders above to project how daily choices compound over time."
            )

        # Log activity history for simulation executed
        log_activity(
            db=db,
            user_id=user_id,
            activity_type="SIMULATION_EXECUTED",
            activity_description=f"Simulated scenario: Savings delta ₹{delta_sav:+,.0f}/mo, Productivity {delta_prod:+d} pts",
        )

        return WhatIfSimulationResponse(
            scenario_name="Custom GrowthSync Scenario",
            tagline="See how today's decisions could affect tomorrow's outcomes.",
            is_stateless=True,
            message="Stateless simulation complete. Actual PostgreSQL user records remain completely unchanged.",
            monthly_expenses=SimulationMetricComparison(
                current_value=round(base_expenses, 2),
                simulated_value=round(sim_expenses, 2),
                delta=delta_exp,
                unit="₹/mo",
                impact_direction="positive"
                if delta_exp < 0
                else "neutral"
                if delta_exp == 0
                else "negative",
            ),
            monthly_savings=SimulationMetricComparison(
                current_value=round(base_savings, 2),
                simulated_value=round(sim_savings, 2),
                delta=delta_sav,
                unit="₹/mo",
                impact_direction="positive"
                if delta_sav > 0
                else "neutral"
                if delta_sav == 0
                else "negative",
            ),
            annual_savings_projection=SimulationMetricComparison(
                current_value=round(base_savings * 12.0, 2),
                simulated_value=round(sim_savings * 12.0, 2),
                delta=delta_ann_sav,
                unit="₹/yr",
                impact_direction="positive"
                if delta_ann_sav > 0
                else "neutral"
                if delta_ann_sav == 0
                else "negative",
            ),
            productivity_score=SimulationMetricComparison(
                current_value=float(base_prod_score),
                simulated_value=float(sim_prod_score),
                delta=float(delta_prod),
                unit="score",
                impact_direction="positive"
                if delta_prod > 0
                else "neutral"
                if delta_prod == 0
                else "negative",
            ),
            study_subscore=SimulationMetricComparison(
                current_value=float(base_study_sub),
                simulated_value=float(sim_study_sub),
                delta=float(sim_study_sub - base_study_sub),
                unit="pts",
                impact_direction="positive" if sim_study_sub > base_study_sub else "neutral",
            ),
            sleep_subscore=SimulationMetricComparison(
                current_value=float(base_sleep_sub),
                simulated_value=float(sim_sleep_sub),
                delta=float(sim_sleep_sub - base_sleep_sub),
                unit="pts",
                impact_direction="positive" if sim_sleep_sub > base_sleep_sub else "neutral",
            ),
            screen_time_subscore=SimulationMetricComparison(
                current_value=float(base_screen_sub),
                simulated_value=float(sim_screen_sub),
                delta=float(sim_screen_sub - base_screen_sub),
                unit="pts",
                impact_direction="positive" if sim_screen_sub > base_screen_sub else "neutral",
            ),
            insights=insights,
        )
