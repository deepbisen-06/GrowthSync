from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ActivityHistoryResponse(BaseModel):
    id: int
    user_id: int
    activity_type: str
    activity_description: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
