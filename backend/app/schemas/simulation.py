from pydantic import BaseModel, Field


class WhatIfSimulationRequest(BaseModel):
    # Financial adjustments
    income_delta: float = Field(default=0.0, description="Monthly income adjustment (+/-)")
    expense_reduction: float = Field(
        default=0.0, ge=0.0, description="Monthly expense reduction amount"
    )

    # Study adjustment
    daily_study_delta_hours: float = Field(
        default=0.0, description="Additional or reduced study hours per day"
    )

    # Habit adjustments
    daily_sleep_delta_hours: float = Field(
        default=0.0, description="Daily sleep adjustment in hours"
    )
    daily_screen_time_reduction_hours: float = Field(
        default=0.0, ge=0.0, description="Hours of screen time reduced daily"
    )
    weekly_exercise_extra_minutes: int = Field(
        default=0, ge=0, description="Extra minutes of exercise per day"
    )


class SimulationMetricComparison(BaseModel):
    current_value: float
    simulated_value: float
    delta: float
    unit: str
    impact_direction: str  # positive, neutral, negative


class WhatIfSimulationResponse(BaseModel):
    scenario_name: str = "GrowthSync What-If Simulation"
    tagline: str = "See how today's decisions could affect tomorrow's outcomes."
    is_stateless: bool = True
    message: str

    # Financial Comparison
    monthly_expenses: SimulationMetricComparison
    monthly_savings: SimulationMetricComparison
    annual_savings_projection: SimulationMetricComparison

    # Productivity Comparison
    productivity_score: SimulationMetricComparison
    study_subscore: SimulationMetricComparison
    sleep_subscore: SimulationMetricComparison
    screen_time_subscore: SimulationMetricComparison

    # Key Takeaway Insights
    insights: list[str]
