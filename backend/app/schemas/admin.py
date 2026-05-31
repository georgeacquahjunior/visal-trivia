from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AdminAnalytics(BaseModel):
    total_questions: int
    active_questions: int
    inactive_questions: int
    total_players: int
    total_logins: int
    total_sessions: int
    completed_sessions: int
    average_score_percent: float
    average_completion_time_seconds: int


class AdminQuestionImportResult(BaseModel):
    created: int
    skipped: int
    errors: list[str]


class AdminUserLogin(BaseModel):
    id: int
    google_sub: str
    name: str
    email: str
    role: str
    picture: str | None = None
    logged_in_at: datetime

    model_config = ConfigDict(from_attributes=True)
