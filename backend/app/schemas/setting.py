from pydantic import BaseModel, ConfigDict, Field


class QuizSettingRead(BaseModel):
    question_limit: int
    quiz_time_seconds: int
    attempts_allowed: int
    pass_percentage: int
    prize_code: str

    model_config = ConfigDict(from_attributes=True)


class QuizSettingUpdate(BaseModel):
    question_limit: int = Field(ge=1, le=50)
    quiz_time_seconds: int = Field(ge=30, le=3600)
    attempts_allowed: int = Field(ge=1, le=10)
    pass_percentage: int = Field(ge=1, le=100)
    prize_code: str = Field(default="", max_length=120)
