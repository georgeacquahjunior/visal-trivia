from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Score(Base):
    __tablename__ = "scores"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    player_id: Mapped[int] = mapped_column(ForeignKey("players.id", ondelete="CASCADE"), index=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("quiz_sessions.id", ondelete="CASCADE"), unique=True)
    score: Mapped[int] = mapped_column(Integer)
    total_questions: Mapped[int] = mapped_column(Integer)
    completion_time_seconds: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    player: Mapped["Player"] = relationship(back_populates="scores")
    session: Mapped["QuizSession"] = relationship(back_populates="score")
