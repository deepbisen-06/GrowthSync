from sqlalchemy import Column, DateTime, Integer, String, func
from sqlalchemy.orm import relationship

from backend.app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(50), nullable=False)
    education_level = Column(String(100), nullable=False)
    course = Column(String(150), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    activities = relationship(
        "ActivityHistory", back_populates="user", cascade="all, delete-orphan"
    )
    financial_records = relationship(
        "FinancialRecord", back_populates="user", cascade="all, delete-orphan"
    )
    study_records = relationship("StudyRecord", back_populates="user", cascade="all, delete-orphan")
    habit_records = relationship("HabitRecord", back_populates="user", cascade="all, delete-orphan")
    expense_records = relationship(
        "ExpenseRecord", back_populates="user", cascade="all, delete-orphan"
    )
    password_reset_tokens = relationship(
        "PasswordResetToken", back_populates="user", cascade="all, delete-orphan"
    )
