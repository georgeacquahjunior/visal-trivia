from pydantic import BaseModel, ConfigDict, Field


class QuizSettingRead(BaseModel):
    question_limit: int
    quiz_time_seconds: int

    model_config = ConfigDict(from_attributes=True)


class QuizSettingUpdate(BaseModel):
    question_limit: int = Field(ge=1, le=50)
    quiz_time_seconds: int = Field(ge=30, le=3600)
