"""
Discipleship pathway — admin-defined stages; per-user progress through them.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Integer, Boolean, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from database import Base
import uuid


class DiscipleshipStage(Base):
    __tablename__ = "discipleship_stages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    key: Mapped[str] = mapped_column(String(60), unique=True, nullable=False)  # e.g. 'new-believer'
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    icon: Mapped[str] = mapped_column(String(40), default="Sparkles")  # lucide icon name
    cta_label: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    cta_href: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class DiscipleshipProgress(Base):
    __tablename__ = "discipleship_progress"
    __table_args__ = (UniqueConstraint("user_id", "stage_id", name="uq_disc_user_stage"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    stage_id: Mapped[str] = mapped_column(String(36), ForeignKey("discipleship_stages.id", ondelete="CASCADE"), nullable=False, index=True)
    completed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    note: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
