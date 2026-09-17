from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    age: Optional[int] = Field(None, ge=13, le=120)
    gender: Optional[str] = Field(None, min_length=1, max_length=50)
    education_level: Optional[str] = Field(None, min_length=2, max_length=100)
    course: Optional[str] = Field(None, min_length=2, max_length=150)


class UserProfileResponse(BaseModel):
    id: int
    full_name: str
    email: str
    age: int
    gender: str
    education_level: str
    course: str
    created_at: datetime
    updated_at: datetime
    profile_completion_percentage: Optional[int] = 100

    model_config = ConfigDict(from_attributes=True)
