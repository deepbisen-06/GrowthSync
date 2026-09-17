"""Input and output contracts for the offline academic grade predictor."""

from pydantic import BaseModel, ConfigDict, Field


class AcademicPredictionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    studytime: int = Field(strict=True, ge=1, le=4, description="Weekly study-time category 1-4")
    failures: int = Field(strict=True, ge=0, le=4, description="UCI previous-failures encoding")
    absences: int = Field(strict=True, ge=0, le=93, description="Course absences known at prediction time")


class AcademicPredictionResponse(BaseModel):
    predicted_grade: float
    raw_prediction: float
    display_clipped: bool
    model_name: str
    test_mae: float | None = None
    message: str
