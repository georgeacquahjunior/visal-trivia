from sqlalchemy import Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class QuizSetting(Base):
    __tablename__ = "quiz_settings"

    id: Mapped[int] = mapped_column(primary_key=True, default=1)
    question_limit: Mapped[int] = mapped_column(Integer, default=7)
    quiz_time_seconds: Mapped[int] = mapped_column(Integer, default=150)
