from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.deps import get_current_user
from backend.app.models.activity import ActivityHistory
from backend.app.models.user import User
from backend.app.schemas.activity import ActivityHistoryResponse

router = APIRouter(prefix="/api/activity-history", tags=["Activity History"])


@router.get("", response_model=List[ActivityHistoryResponse])
def get_activity_history(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Retrieve complete audit history and activity stream for the authenticated user."""
    return (
        db.query(ActivityHistory)
        .filter(ActivityHistory.user_id == current_user.id)
        .order_by(ActivityHistory.created_at.desc())
        .all()
    )
