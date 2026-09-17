from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.deps import get_current_user
from backend.app.models.study import StudyRecord
from backend.app.models.user import User
from backend.app.schemas.study import StudyRecordCreate, StudyRecordResponse
from backend.app.services.activity_service import log_activity

router = APIRouter(prefix="/api/study-records", tags=["Study Records"])


@router.post("", response_model=StudyRecordResponse, status_code=status.HTTP_201_CREATED)
def create_study_record(
    payload: StudyRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new study record for the authenticated user."""
    record = StudyRecord(
        user_id=current_user.id,
        study_hours=payload.study_hours,
        subjects=payload.subjects.strip(),
        academic_goal=payload.academic_goal.strip(),
        study_date=payload.study_date,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    # Log activity
    log_activity(
        db=db,
        user_id=current_user.id,
        activity_type="STUDY_DATA_ADDED",
        activity_description=f"Submitted study record ({payload.study_hours} hrs on {payload.study_date}).",
    )

    return record


@router.get("", response_model=List[StudyRecordResponse])
def get_user_study_records(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Retrieve all study records for the authenticated user, ordered by study date descending."""
    return (
        db.query(StudyRecord)
        .filter(StudyRecord.user_id == current_user.id)
        .order_by(StudyRecord.study_date.desc(), StudyRecord.created_at.desc())
        .all()
    )
