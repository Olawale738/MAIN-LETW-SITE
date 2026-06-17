"""
WelcomeFlow — sequenced onboarding emails for new members.
Admin defines steps; backend runs them on a daily tick.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Integer, Boolean, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from database import Base
import uuid


class WelcomeStep(Base):
    __tablename__ = "welcome_steps"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    day_offset: Mapped[int] = mapped_column(Integer, nullable=False, default=0)  # 0 = immediate
    subject: Mapped[str] = mapped_column(String(300), nullable=False)
    body_html: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class WelcomeStepSent(Base):
    __tablename__ = "welcome_step_sent"
    __table_args__ = (UniqueConstraint("user_id", "step_id", name="uq_welcome_sent_per_user_step"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    step_id: Mapped[str] = mapped_column(String(36), ForeignKey("welcome_steps.id", ondelete="CASCADE"), nullable=False, index=True)
    sent_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    success: Mapped[bool] = mapped_column(Boolean, default=True)
    error: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
