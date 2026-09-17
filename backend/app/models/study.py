from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from backend.app.database import Base


class StudyRecord(Base):
    __tablename__ = "study_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    study_hours = Column(Float, nullable=False)
    subjects = Column(Text, nullable=False)
    academic_goal = Column(String(255), nullable=False)
    study_date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationship
    user = relationship("User", back_populates="study_records")
