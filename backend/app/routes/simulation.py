from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.deps import get_current_user
from backend.app.models.user import User
from backend.app.schemas.simulation import WhatIfSimulationRequest, WhatIfSimulationResponse
from backend.app.services.simulation_service import SimulationService

router = APIRouter(prefix="/api/simulation", tags=["What-If Simulator"])


@router.post("/what-if", response_model=WhatIfSimulationResponse, status_code=status.HTTP_200_OK)
def run_what_if_simulation(
    payload: WhatIfSimulationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Execute a stateless What-If simulation comparing baseline vs simulated scenarios.
    Strictly does not modify any stored PostgreSQL records.
    """
    return SimulationService.run_what_if_simulation(current_user.id, payload, db)
