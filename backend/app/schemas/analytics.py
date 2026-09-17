from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class ModelMetadata(BaseModel):
    model_name: str
    evaluation_status: str
    sample_count: int
    mae: Optional[float] = None
    rmse: Optional[float] = None
    r2: Optional[float] = None


class SavingsProjectionItem(BaseModel):
    period_months_ahead: int
    label: str
    predicted_monthly_expenses: float
    predicted_monthly_savings: float
    projected_cumulative_savings: float


class HistoryComparisonItem(BaseModel):
    month_label: str
    actual_expenses: Optional[float] = None
    predicted_expenses: Optional[float] = None
    actual_savings: Optional[float] = None
    predicted_savings: Optional[float] = None


class CategorySpendingItem(BaseModel):
    category: str
    total_amount: float
    percentage: float
    count: int


class FinancialForecastResponse(BaseModel):
    has_sufficient_data: bool
    sufficiency_status: str
    low_data_warning: bool = False
    message: str
    observation_count: int
    current_savings: float
    current_income: float
    current_expenses: float
    predicted_next_expenses: Optional[float] = None
    predicted_next_savings: Optional[float] = None
    savings_growth_percentage: float = 0.0
    expense_growth_percentage: float = 0.0
    savings_projection: List[SavingsProjectionItem] = []
    history_comparison: List[HistoryComparisonItem] = []
    category_breakdown: List[CategorySpendingItem] = []
    highest_spending_category: Optional[str] = None
    goal_progress: Optional[Dict[str, Any]] = None
    overspending_risk: bool = False
    model_metadata: ModelMetadata


class ProductivityBreakdown(BaseModel):
    study: int
    sleep: int
    exercise: int
    screen_time: int


class ProductivityResponse(BaseModel):
    has_sufficient_data: bool
    message: str
    productivity_score: int
    breakdown: ProductivityBreakdown
    previous_score: int
    change_percentage: float
    trend: str  # improving, stable, declining
    predicted_future_score: int
    confidence_label: str
    weights_used: Dict[str, float]


class BestStudyDay(BaseModel):
    day: str
    avg_hours: float
    total_sessions: int


class StudyForecastResponse(BaseModel):
    has_sufficient_data: bool
    message: str
    observation_count: int
    total_study_hours: float
    avg_daily_hours: float
    avg_weekly_hours: float
    study_consistency_percentage: float
    best_study_day: Optional[BestStudyDay] = None
    recent_trend: str
    predicted_next_week_hours: Optional[float] = None
    weekly_history: List[Dict[str, Any]] = []


class HabitItem(BaseModel):
    average: float
    unit: str
    trend_percentage: float
    prediction: float
    insight: str


class HabitAnalysisResponse(BaseModel):
    has_sufficient_data: bool
    message: str
    observation_count: int
    sleep_consistency_score: float
    habits: Dict[str, HabitItem]
    history: List[Dict[str, Any]] = []


class RiskItem(BaseModel):
    type: str
    level: str  # LOW, MEDIUM, HIGH
    category: str
    reason: str
    supporting_metric: str
    recommendation: str


class AnalyticsDashboardResponse(BaseModel):
    financial: FinancialForecastResponse
    productivity: ProductivityResponse
    study: StudyForecastResponse
    habits: HabitAnalysisResponse
    risks: List[RiskItem]
    is_demo_mode: bool = False
