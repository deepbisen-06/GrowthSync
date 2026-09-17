import logging

from sqlalchemy.orm import Session

from backend.app.models.activity import ActivityHistory

logger = logging.getLogger("uvicorn")


def log_activity(
    db: Session, user_id: int, activity_type: str, activity_description: str
) -> ActivityHistory:
    """
    Log an activity event for a user into PostgreSQL activity_history table.
    """
    try:
        activity = ActivityHistory(
            user_id=user_id, activity_type=activity_type, activity_description=activity_description
        )
        db.add(activity)
        db.commit()
        db.refresh(activity)
        return activity
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to log activity for user {user_id}: {e}")
        # Activity logging failure should not crash the primary transaction, but logged
        return None
