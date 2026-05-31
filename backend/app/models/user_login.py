from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class UserLogin(Base):
    __tablename__ = "user_logins"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    google_sub: Mapped[str] = mapped_column(String(255), index=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    email: Mapped[str] = mapped_column(String(255), index=True)
    role: Mapped[str] = mapped_column(String(30), default="player")
    picture: Mapped[str | None] = mapped_column(String(500), nullable=True)
    logged_in_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
