from pydantic import BaseModel, ConfigDict, Field

from app.schemas.category import CategoryRead


class QuestionBase(BaseModel):
    category_id: int
    prompt: str
    options: list[str] = Field(min_length=2, max_length=6)
    correct_answer: str
    time_limit_seconds: int = Field(default=20, ge=5, le=120)
    is_active: bool = True


class QuestionCreate(QuestionBase):
    pass


class QuestionUpdate(BaseModel):
    category_id: int | None = None
    prompt: str | None = None
    options: list[str] | None = Field(default=None, min_length=2, max_length=6)
    correct_answer: str | None = None
    time_limit_seconds: int | None = Field(default=None, ge=5, le=120)
    is_active: bool | None = None


class QuestionRead(QuestionBase):
    id: int
    category: CategoryRead | None = None

    model_config = ConfigDict(from_attributes=True)


class QuizQuestion(BaseModel):
    id: int
    category: str
    prompt: str
    options: list[str]
    time_limit_seconds: int

    model_config = ConfigDict(from_attributes=True)
