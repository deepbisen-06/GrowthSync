from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class HabitRecordCreate(BaseModel):
    sleep_hours: float = Field(..., ge=0, le=24, description="Hours of sleep")
    exercise_minutes: int = Field(..., ge=0, le=1440, description="Exercise duration in minutes")
    screen_time: float = Field(..., ge=0, le=24, description="Daily screen time in hours")
    habit_notes: Optional[str] = Field(None, max_length=1000, description="Additional notes")
    record_date: date = Field(..., description="Date of entry (YYYY-MM-DD)")


class HabitRecordResponse(BaseModel):
    id: int
    user_id: int
    sleep_hours: float
    exercise_minutes: int
    screen_time: float
    habit_notes: Optional[str]
    record_date: date
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
