from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

VALID_CATEGORIES = [
    "Food",
    "Travel",
    "Education",
    "Shopping",
    "Bills",
    "Entertainment",
    "Health",
    "Other",
]


class ExpenseRecordCreate(BaseModel):
    amount: float = Field(..., gt=0, description="Expense amount in currency units")
    category: str = Field(..., description="Expense category")
    expense_date: date = Field(..., description="Date on which expense occurred")
    description: Optional[str] = Field(
        None, max_length=255, description="Optional brief description"
    )

    def validate_category(self):
        normalized = self.category.strip().title()
        if normalized not in VALID_CATEGORIES:
            raise ValueError(f"Category must be one of: {', '.join(VALID_CATEGORIES)}")
        return normalized


class ExpenseRecordResponse(BaseModel):
    id: int
    user_id: int
    amount: float
    category: str
    expense_date: date
    description: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ExpenseCategorySummary(BaseModel):
    category: str
    total_amount: float
    percentage: float
    transaction_count: int
