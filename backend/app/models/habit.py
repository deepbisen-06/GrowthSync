from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer, Text, func
from sqlalchemy.orm import relationship

from backend.app.database import Base


class HabitRecord(Base):
    __tablename__ = "habit_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    sleep_hours = Column(Float, nullable=False)
    exercise_minutes = Column(Integer, nullable=False)
    screen_time = Column(Float, nullable=False)
    habit_notes = Column(Text, nullable=True)
    record_date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationship
    user = relationship("User", back_populates="habit_records")
