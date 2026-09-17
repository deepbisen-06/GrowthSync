from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.deps import get_current_user
from backend.app.models.habit import HabitRecord
from backend.app.models.user import User
from backend.app.schemas.habit import HabitRecordCreate, HabitRecordResponse
from backend.app.services.activity_service import log_activity

router = APIRouter(prefix="/api/habit-records", tags=["Habit Records"])


@router.post("", response_model=HabitRecordResponse, status_code=status.HTTP_201_CREATED)
def create_habit_record(
    payload: HabitRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new daily habit record for the authenticated user."""
    record = HabitRecord(
        user_id=current_user.id,
        sleep_hours=payload.sleep_hours,
        exercise_minutes=payload.exercise_minutes,
        screen_time=payload.screen_time,
        habit_notes=payload.habit_notes.strip() if payload.habit_notes else None,
        record_date=payload.record_date,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    # Log activity
    log_activity(
        db=db,
        user_id=current_user.id,
        activity_type="HABIT_DATA_ADDED",
        activity_description=f"Submitted habit record ({payload.sleep_hours}h sleep, {payload.exercise_minutes}m exercise on {payload.record_date}).",
    )

    return record


@router.get("", response_model=List[HabitRecordResponse])
def get_user_habit_records(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Retrieve all habit records for the authenticated user, ordered by record date descending."""
    return (
        db.query(HabitRecord)
        .filter(HabitRecord.user_id == current_user.id)
        .order_by(HabitRecord.record_date.desc(), HabitRecord.created_at.desc())
        .all()
    )
