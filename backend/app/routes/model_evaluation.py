"""Authenticated, read-only access to shared project experiment results."""

from fastapi import APIRouter, Depends

from backend.app.deps import get_current_user
from backend.app.models.user import User
from backend.app.services.model_evaluation_service import get_model_evaluations

router = APIRouter(prefix="/api/analytics", tags=["Model Evaluation"])


@router.get("/model-evaluations")
def model_evaluations(current_user: User = Depends(get_current_user)):
    """Return allowlisted summary metrics, never survey rows or transaction records."""
    return get_model_evaluations()
