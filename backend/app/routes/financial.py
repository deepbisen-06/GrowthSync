from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.deps import get_current_user
from backend.app.models.financial import FinancialRecord
from backend.app.models.user import User
from backend.app.schemas.financial import FinancialRecordCreate, FinancialRecordResponse
from backend.app.services.activity_service import log_activity

router = APIRouter(prefix="/api/financial-records", tags=["Financial Records"])


@router.post("", response_model=FinancialRecordResponse, status_code=status.HTTP_201_CREATED)
def create_financial_record(
    payload: FinancialRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new financial record for the authenticated user."""
    record = FinancialRecord(
        user_id=current_user.id,
        monthly_income=payload.monthly_income,
        monthly_expenses=payload.monthly_expenses,
        monthly_savings=payload.monthly_savings,
        financial_goal=payload.financial_goal.strip(),
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    # Log activity
    log_activity(
        db=db,
        user_id=current_user.id,
        activity_type="FINANCIAL_DATA_ADDED",
        activity_description=f"Submitted financial record (Goal: {payload.financial_goal[:30]}).",
    )

    return record


@router.get("", response_model=List[FinancialRecordResponse])
def get_user_financial_records(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Retrieve all financial records for the authenticated user, ordered by creation date descending."""
    return (
        db.query(FinancialRecord)
        .filter(FinancialRecord.user_id == current_user.id)
        .order_by(FinancialRecord.created_at.desc())
        .all()
    )
