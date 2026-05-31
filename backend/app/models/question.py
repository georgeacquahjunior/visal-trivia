from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id", ondelete="CASCADE"), index=True)
    prompt: Mapped[str] = mapped_column(Text)
    options: Mapped[list[str]] = mapped_column(JSON)
    correct_answer: Mapped[str] = mapped_column(String(255))
    time_limit_seconds: Mapped[int] = mapped_column(Integer, default=20)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    category: Mapped["Category"] = relationship(back_populates="questions")
