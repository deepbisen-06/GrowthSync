from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class FinancialTwinRequest(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, extra='forbid')
    months: Literal[3, 6, 12] = 12
    target_rate: float = Field(default=30, ge=0, le=100)
    income_change: float = Field(default=0, ge=-1e12, le=1e12)
    risk_expense_increase: float = Field(default=0, ge=0, le=1e12)
    risk_income_drop_pct: float = Field(default=0, ge=0, le=100)
    starting_balance: float = Field(default=0, ge=0, le=1e12)
