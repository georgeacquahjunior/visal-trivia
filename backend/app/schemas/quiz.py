from pydantic import BaseModel, Field

from app.schemas.question import QuizQuestion


class QuizStartRequest(BaseModel):
    player_name: str = Field(min_length=1, max_length=120)
    category_id: int | None = None
    limit: int = Field(default=7, ge=1, le=20)


class QuizStartResponse(BaseModel):
    session_id: int
    player_id: int
    questions: list[QuizQuestion]


class AnswerSubmission(BaseModel):
    question_id: int
    answer: str


class QuizSubmitRequest(BaseModel):
    session_id: int
    answers: list[AnswerSubmission]
    completion_time_seconds: int = Field(ge=0)


class AnswerResult(BaseModel):
    question_id: int
    correct_answer: str
    selected_answer: str | None = None
    is_correct: bool


class AnswerCheckRequest(BaseModel):
    question_id: int
    answer: str


class AnswerCheckResponse(AnswerResult):
    pass


class QuizSubmitResponse(BaseModel):
    score: int
    total_questions: int
    completion_time_seconds: int
    results: list[AnswerResult]
