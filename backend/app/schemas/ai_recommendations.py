from pydantic import Field
from backend.app.schemas.financial_twin import FinancialTwinRequest
from backend.app.schemas.routine_twin import RoutineTwinRequest


class FinancialAIRequest(FinancialTwinRequest):
    recommendation_token: str = Field(pattern=r'^[a-f0-9]{64}$')


class RoutineAIRequest(RoutineTwinRequest):
    recommendation_token: str = Field(pattern=r'^[a-f0-9]{64}$')
