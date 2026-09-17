from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.deps import get_current_user
from backend.app.models.financial import FinancialRecord
from backend.app.models.habit import HabitRecord
from backend.app.models.study import StudyRecord
from backend.app.models.user import User
from backend.app.services.export_service import generate_anonymized_dataset_csv

router = APIRouter(prefix="/api/datasets", tags=["Datasets"])


@router.get("/export")
def export_anonymized_dataset(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Export all collected user records as an anonymized CSV file.
    Omits PII (name, email, password) for data privacy and ML model readiness.
    """
    csv_data = generate_anonymized_dataset_csv(db)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=anonymized_collected_dataset.csv"},
    )


@router.get("/summary")
def get_dataset_summary(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Get aggregate statistics of collected records across all categories."""
    return {
        "total_users": db.query(User).count(),
        "total_financial_records": db.query(FinancialRecord).count(),
        "total_study_records": db.query(StudyRecord).count(),
        "total_habit_records": db.query(HabitRecord).count(),
        "user_financial_records": db.query(FinancialRecord)
        .filter(FinancialRecord.user_id == current_user.id)
        .count(),
        "user_study_records": db.query(StudyRecord)
        .filter(StudyRecord.user_id == current_user.id)
        .count(),
        "user_habit_records": db.query(HabitRecord)
        .filter(HabitRecord.user_id == current_user.id)
        .count(),
    }
