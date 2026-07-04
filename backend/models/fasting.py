"""
Corporate fasting calendar — church-wide fasts (Daniel fast, 21 days, 40 days)
with daily prayer prompts and per-member check-ins.
"""

import uuid
from datetime import datetime, date
from typing import Optional
from sqlalchemy import String, DateTime, Date, Text, Boolean, Integer, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class Fast(Base):
    __tablename__ = "fasts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    kind: Mapped[str] = mapped_column(String(40), default="full", nullable=False)  # full | daniel | partial | media
    start_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    end_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    scripture_focus: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    # One prompt per day; viewers see prompts[day_number - 1], cycling if short.
    prayer_prompts: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class FastCheckin(Base):
    __tablename__ = "fast_checkins"
    # One check-in per participant per day of a fast.
    __table_args__ = (UniqueConstraint("fast_id", "participant_key", "day_number", name="uq_fast_participant_day"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    fast_id: Mapped[str] = mapped_column(String(36), ForeignKey("fasts.id", ondelete="CASCADE"), nullable=False, index=True)
    # user_id when logged in; otherwise an anonymous client key so guests can
    # still participate without an account.
    user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    participant_key: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    display_name: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    day_number: Mapped[int] = mapped_column(Integer, nullable=False)
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
