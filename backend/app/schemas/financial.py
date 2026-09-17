from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FinancialRecordCreate(BaseModel):
    monthly_income: float = Field(..., ge=0, description="Monthly income in currency units")
    monthly_expenses: float = Field(..., ge=0, description="Monthly expenses in currency units")
    monthly_savings: float = Field(..., description="Monthly savings in currency units")
    financial_goal: str = Field(
        ..., min_length=2, max_length=255, description="Primary financial goal"
    )


class FinancialRecordResponse(BaseModel):
    id: int
    user_id: int
    monthly_income: float
    monthly_expenses: float
    monthly_savings: float
    financial_goal: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
