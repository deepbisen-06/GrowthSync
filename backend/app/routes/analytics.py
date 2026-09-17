from typing import List
from typing import Literal
import json
from pathlib import Path
from backend.app.ml.personal_trends import personal_trends
from backend.app.models.study import StudyRecord
from backend.app.models.habit import HabitRecord

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.deps import get_current_user
from backend.app.models.user import User
from backend.app.schemas.analytics import (
    AnalyticsDashboardResponse,
    FinancialForecastResponse,
    HabitAnalysisResponse,
    ProductivityResponse,
    RiskItem,
    StudyForecastResponse,
)
from backend.app.services.analytics_service import AnalyticsService
from backend.app.schemas.academic_prediction import (
    AcademicPredictionRequest,
    AcademicPredictionResponse,
)
from backend.app.services.academic_prediction_service import (
    AcademicModelUnavailable,
    predict_academic_grade,
)

router = APIRouter(prefix="/api/analytics", tags=["Analytics & Forecasting"])


@router.get("/dataset-analysis/{kind}")
def get_dataset_analysis(kind: Literal["student", "habit"],
                         current_user: User = Depends(get_current_user)):
    """Read anonymous grouped source-data statistics, separate from personal logs."""
    path = Path(__file__).resolve().parents[3] / "datasets" / "processed" / "dataset_analysis.json"
    try:
        return json.loads(path.read_text(encoding="utf-8"))[kind]
    except (OSError, ValueError, KeyError) as exc:
        raise HTTPException(status_code=503, detail="Dataset analysis unavailable. Run scripts/build_dataset_analysis.py.") from exc


@router.get("/personal-trends/{kind}")
def get_personal_trends(kind: Literal["study", "habit"],
                        current_user: User = Depends(get_current_user),
                        db: Session = Depends(get_db)):
    """Return only the authenticated user's dated observations and estimates."""
    model = StudyRecord if kind == "study" else HabitRecord
    records = db.query(model).filter(model.user_id == current_user.id).all()
    return personal_trends(records, kind)


@router.get("/financial-forecast", response_model=FinancialForecastResponse)
def get_financial_forecast(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Retrieve financial linear regression forecast and category trends for current user."""
    return AnalyticsService.get_financial_forecast(current_user.id, db)


@router.get("/productivity", response_model=ProductivityResponse)
def get_productivity(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieve explainable 0-100 productivity score and component breakdown."""
    return AnalyticsService.get_productivity_analysis(current_user.id, db)


@router.get("/study-forecast", response_model=StudyForecastResponse)
def get_study_forecast(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Retrieve study weekly forecast and Best Study Day pattern."""
    return AnalyticsService.get_study_forecast(current_user.id, db)


@router.get("/habit-analysis", response_model=HabitAnalysisResponse)
def get_habit_analysis(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Retrieve sleep, exercise, and screen time trajectory analysis."""
    return AnalyticsService.get_habit_analysis(current_user.id, db)


@router.get("/risks", response_model=List[RiskItem])
def get_future_risks(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieve personal threat & risk advisory alerts with recommendations."""
    return AnalyticsService.get_future_risks(current_user.id, db)


@router.get("/dashboard", response_model=AnalyticsDashboardResponse)
def get_analytics_dashboard(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Unified aggregated analytics payload for high-performance dashboard load."""
    return AnalyticsService.get_full_dashboard(current_user.id, db)


@router.get("/demo-data", response_model=AnalyticsDashboardResponse)
def get_demo_analytics_data(
    current_user: User = Depends(get_current_user),
):
    """Retrieve sample presentation analytics scenario (clearly labeled as DEMO DATA)."""
    return AnalyticsService.generate_demo_analytics()


@router.post("/academic-prediction", response_model=AcademicPredictionResponse)
def academic_prediction(
    inputs: AcademicPredictionRequest,
    current_user: User = Depends(get_current_user),
):
    """Predict a final grade using the saved local model for an authenticated user."""
    try:
        return predict_academic_grade(inputs)
    except AcademicModelUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
