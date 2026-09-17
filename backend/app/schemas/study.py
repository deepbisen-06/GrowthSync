from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class StudyRecordCreate(BaseModel):
    study_hours: float = Field(..., ge=0, le=24, description="Hours spent studying")
    subjects: str = Field(
        ..., min_length=2, max_length=500, description="Subjects or topics studied"
    )
    academic_goal: str = Field(..., min_length=2, max_length=255, description="Academic goal")
    study_date: date = Field(..., description="Date of study session (YYYY-MM-DD)")


class StudyRecordResponse(BaseModel):
    id: int
    user_id: int
    study_hours: float
    subjects: str
    academic_goal: str
    study_date: date
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
