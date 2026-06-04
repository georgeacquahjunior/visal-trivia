from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class QuizSetting(Base):
    __tablename__ = "quiz_settings"

    id: Mapped[int] = mapped_column(primary_key=True, default=1)
    question_limit: Mapped[int] = mapped_column(Integer, default=7)
    quiz_time_seconds: Mapped[int] = mapped_column(Integer, default=150)
    attempts_allowed: Mapped[int] = mapped_column(Integer, default=3)
    pass_percentage: Mapped[int] = mapped_column(Integer, default=70)
    prize_code: Mapped[str] = mapped_column(String(120), default="")
