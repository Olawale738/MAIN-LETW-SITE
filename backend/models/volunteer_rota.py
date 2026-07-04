"""
Volunteer scheduling — teams (ushers, kids check-in, AV) and per-service-date
assignments so everyone knows who serves which Sunday.
"""

import uuid
from datetime import datetime, date
from typing import Optional
from sqlalchemy import String, DateTime, Date, Text, Boolean, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class RotaTeam(Base):
    __tablename__ = "rota_teams"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class RotaAssignment(Base):
    __tablename__ = "rota_assignments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    team_id: Mapped[str] = mapped_column(String(36), ForeignKey("rota_teams.id", ondelete="CASCADE"), nullable=False, index=True)
    service_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    member_name: Mapped[str] = mapped_column(String(200), nullable=False)
    member_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    role_note: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)  # "Lead usher", "Camera 2"
    status: Mapped[str] = mapped_column(String(20), default="assigned", index=True)  # assigned | confirmed | declined
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
