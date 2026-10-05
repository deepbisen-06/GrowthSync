"""Bounded chat requests. Identity and evidence always come from the server."""
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, model_validator
from backend.app.schemas.financial_twin import FinancialTwinRequest
from backend.app.schemas.routine_twin import RoutineTwinRequest


class ChatTurn(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    role: Literal['user', 'assistant']
    content: str = Field(min_length=1, max_length=2000)


class ChatRequest(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    message: str = Field(min_length=1, max_length=1000)
    module: Literal['general', 'finance', 'study', 'habit'] = 'finance'
    use_ai: bool = False
    history: list[ChatTurn] = Field(default_factory=list, max_length=6)
    financial_plan: FinancialTwinRequest | None = None
    routine_plan: RoutineTwinRequest | None = None

    @model_validator(mode='after')
    def validate_plan(self):
        if self.module == 'general' and (self.financial_plan is not None or self.routine_plan is not None):
            raise ValueError('Select a specific module for a simulation plan.')
        if self.module == 'finance' and self.routine_plan is not None:
            raise ValueError('Choose a financial plan for Finance.')
        if self.module != 'finance' and self.financial_plan is not None:
            raise ValueError('Choose a routine plan for Study or Habit.')
        if self.routine_plan is not None:
            values = self.routine_plan.model_dump()
            unused = ('sleep_delta','exercise_delta','screen_delta','risk_sleep_loss','risk_exercise_loss','risk_screen_increase') if self.module == 'study' else ('study_delta','risk_study_loss','study_goal_hours')
            if any(values[k] != 0 for k in unused):
                raise ValueError('The plan contains changes for a different module.')
        return self
