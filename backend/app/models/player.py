from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Player(Base):
    __tablename__ = "players"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    sessions: Mapped[list["QuizSession"]] = relationship(back_populates="player")
    scores: Mapped[list["Score"]] = relationship(back_populates="player")
