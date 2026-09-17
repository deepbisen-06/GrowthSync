from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.deps import get_current_user
from backend.app.models.user import User
from backend.app.schemas.user import UserProfileResponse, UserProfileUpdate
from backend.app.services.activity_service import log_activity

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/profile", response_model=UserProfileResponse)
def get_user_profile(current_user: User = Depends(get_current_user)):
    """Fetch current user's profile information."""
    return current_user


@router.put("/profile", response_model=UserProfileResponse)
def update_user_profile(
    payload: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update profile details for the authenticated user and log the action.
    """
    updated_fields = []
    if payload.full_name is not None:
        current_user.full_name = payload.full_name.strip()
        updated_fields.append("full_name")
    if payload.age is not None:
        current_user.age = payload.age
        updated_fields.append("age")
    if payload.gender is not None:
        current_user.gender = payload.gender
        updated_fields.append("gender")
    if payload.education_level is not None:
        current_user.education_level = payload.education_level
        updated_fields.append("education_level")
    if payload.course is not None:
        current_user.course = payload.course.strip()
        updated_fields.append("course")

    db.commit()
    db.refresh(current_user)

    # Log activity
    log_activity(
        db=db,
        user_id=current_user.id,
        activity_type="PROFILE_UPDATED",
        activity_description=f"Profile updated fields: {', '.join(updated_fields) if updated_fields else 'none'}.",
    )

    return current_user
