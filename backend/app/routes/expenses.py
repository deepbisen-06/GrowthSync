from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.deps import get_current_user
from backend.app.models.expense import EXPENSE_CATEGORIES, ExpenseRecord
from backend.app.models.user import User
from backend.app.schemas.expense import (
    ExpenseCategorySummary,
    ExpenseRecordCreate,
    ExpenseRecordResponse,
)
from backend.app.services.activity_service import log_activity

router = APIRouter(prefix="/api/expense-records", tags=["Expense Records"])


@router.post("", response_model=ExpenseRecordResponse, status_code=status.HTTP_201_CREATED)
def create_expense_record(
    payload: ExpenseRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new categorized expense record for the authenticated user."""
    category = payload.category.strip().title()
    if category not in EXPENSE_CATEGORIES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid category '{payload.category}'. Allowed categories: {', '.join(EXPENSE_CATEGORIES)}",
        )

    record = ExpenseRecord(
        user_id=current_user.id,
        amount=payload.amount,
        category=category,
        expense_date=payload.expense_date,
        description=payload.description.strip() if payload.description else None,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    log_activity(
        db=db,
        user_id=current_user.id,
        activity_type="EXPENSE_LOGGED",
        activity_description=f"Logged {category} expense of ₹{payload.amount:,.2f}",
    )

    return record


@router.get("", response_model=List[ExpenseRecordResponse])
def get_user_expenses(
    category: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve categorized expenses for the authenticated user."""
    query = db.query(ExpenseRecord).filter(ExpenseRecord.user_id == current_user.id)

    if category:
        query = query.filter(ExpenseRecord.category == category.strip().title())
    if start_date:
        query = query.filter(ExpenseRecord.expense_date >= start_date)
    if end_date:
        query = query.filter(ExpenseRecord.expense_date <= end_date)

    return query.order_by(ExpenseRecord.expense_date.desc(), ExpenseRecord.id.desc()).all()


@router.get("/categories", response_model=List[str])
def get_allowed_categories():
    """Return the list of allowed expense categories."""
    return EXPENSE_CATEGORIES


@router.get("/summary", response_model=List[ExpenseCategorySummary])
def get_category_summary(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Return aggregated category spending summary for the authenticated user."""
    results = (
        db.query(
            ExpenseRecord.category,
            func.sum(ExpenseRecord.amount).label("total"),
            func.count(ExpenseRecord.id).label("cnt"),
        )
        .filter(ExpenseRecord.user_id == current_user.id)
        .group_by(ExpenseRecord.category)
        .all()
    )

    total_all = sum(r.total for r in results) or 1.0
    summary = []
    for r in results:
        summary.append(
            ExpenseCategorySummary(
                category=r.category,
                total_amount=round(float(r.total), 2),
                percentage=round((float(r.total) / total_all) * 100, 1),
                transaction_count=int(r.cnt),
            )
        )
    return summary
