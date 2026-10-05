from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.deps import get_current_user
from backend.app.models.user import User
from backend.app.schemas.simulation import WhatIfSimulationRequest, WhatIfSimulationResponse
from backend.app.services.simulation_service import SimulationService
from backend.app.models.financial import FinancialRecord
from backend.app.schemas.financial_twin import FinancialTwinRequest
from backend.app.services.financial_twin import financial_baseline, simulate_finances
from typing import Literal
from backend.app.models.study import StudyRecord
from backend.app.models.habit import HabitRecord
from backend.app.schemas.routine_twin import RoutineTwinRequest
from backend.app.services.routine_twin import routine_baseline, simulate_routine
from backend.app.config import settings
from backend.app.services.llm_provider import provider_options
from backend.app.schemas.ai_recommendations import FinancialAIRequest, RoutineAIRequest
from backend.app.services.ai_recommendations import with_token, result_token, explain, allow_attempt

router = APIRouter(prefix="/api/simulation", tags=["What-If Simulator"])


def _routine_baseline(user_id, kind, db):
    model = StudyRecord if kind == 'study' else HabitRecord
    records = db.query(model).filter(model.user_id == user_id).all()
    return routine_baseline(records, kind)


@router.get('/routine/{kind}/baseline')
def get_routine_baseline(kind: Literal['study','habit'], current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _routine_baseline(current_user.id, kind, db)


@router.post('/routine/{kind}')
def run_routine_twin(kind: Literal['study','habit'], payload: RoutineTwinRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return with_token(simulate_routine(_routine_baseline(current_user.id, kind, db), **payload.model_dump()))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


def _financial_baseline(user_id, db):
    records = db.query(FinancialRecord).filter(FinancialRecord.user_id == user_id).all()
    return financial_baseline(records)


@router.get('/financial/baseline')
def get_financial_baseline(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _financial_baseline(current_user.id, db)


@router.post('/financial')
def run_financial_twin(payload: FinancialTwinRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return with_token(simulate_finances(_financial_baseline(current_user.id, db), **payload.model_dump()))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


def _explain_checked(result, token, kind, user_id):
    if result_token(result) != token:
        raise HTTPException(409, 'Records or assumptions changed. Run the comparison again before generating AI recommendations.')
    if not allow_attempt(user_id):
        raise HTTPException(429, 'Please wait 30 seconds between AI requests. Your rule-based recommendations remain available.')
    return explain(result, kind, **provider_options(settings))


@router.post('/financial/recommendations')
def financial_recommendations(payload: FinancialAIRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        result = simulate_finances(_financial_baseline(current_user.id, db), **payload.model_dump(exclude={'recommendation_token'}))
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    return _explain_checked(result, payload.recommendation_token, 'finance', current_user.id)


@router.post('/routine/{kind}/recommendations')
def routine_recommendations(kind: Literal['study','habit'], payload: RoutineAIRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        result = simulate_routine(_routine_baseline(current_user.id, kind, db), **payload.model_dump(exclude={'recommendation_token'}))
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    return _explain_checked(result, payload.recommendation_token, kind, current_user.id)


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
