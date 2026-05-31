from datetime import datetime

from pydantic import BaseModel, ConfigDict


class LeaderboardEntry(BaseModel):
    id: int
    player_name: str
    score: int
    total_questions: int
    completion_time_seconds: int
    category_name: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
