from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class RoutineTwinRequest(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, extra='forbid')
    days: Literal[7,14,28] = 7
    baseline_mode: Literal['observed','trend'] = 'observed'
    reserved_hours: float = Field(ge=0,le=24)
    study_delta: float = Field(default=0,ge=-24,le=24)
    sleep_delta: float = Field(default=0,ge=-24,le=24)
    exercise_delta: float = Field(default=0,ge=-1440,le=1440)
    screen_delta: float = Field(default=0,ge=-24,le=24)
    risk_study_loss: float = Field(default=0,ge=0,le=24)
    risk_sleep_loss: float = Field(default=0,ge=0,le=24)
    risk_exercise_loss: float = Field(default=0,ge=0,le=1440)
    risk_screen_increase: float = Field(default=0,ge=0,le=24)
    study_goal_hours: float = Field(default=0,ge=0,le=672)
