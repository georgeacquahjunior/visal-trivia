from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class QuizSession(Base):
    __tablename__ = "quiz_sessions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    player_id: Mapped[int] = mapped_column(ForeignKey("players.id", ondelete="CASCADE"), index=True)
    category_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    total_questions: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    player: Mapped["Player"] = relationship(back_populates="sessions")
    category: Mapped["Category"] = relationship()
    score: Mapped["Score"] = relationship(back_populates="session", uselist=False)
