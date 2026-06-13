"""
YouthProgramActivity + YouthProgramAttendance

A program can have any number of activities (workshops, retreats, meetups).
Members can RSVP. Coordinators record attendance afterwards.
"""

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, ForeignKey, Boolean, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class YouthProgramActivity(Base):
    __tablename__ = "youth_program_activities"
    __table_args__ = (
        Index("ix_ypa_program_start", "program_id", "start_at"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    program_id: Mapped[str] = mapped_column(String(36), ForeignKey("youth_programs.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    activity_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # 'workshop', 'retreat', 'meetup', etc.
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    start_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    end_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class YouthProgramRSVP(Base):
    """A member's RSVP for an activity."""
    __tablename__ = "youth_program_rsvps"
    __table_args__ = (
        UniqueConstraint("activity_id", "user_id", name="uq_ypr_activity_user"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    activity_id: Mapped[str] = mapped_column(String(36), ForeignKey("youth_program_activities.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), default="yes")  # 'yes' | 'maybe' | 'no'
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class YouthProgramAttendance(Base):
    """Coordinator-recorded attendance for an activity."""
    __tablename__ = "youth_program_attendances"
    __table_args__ = (
        UniqueConstraint("activity_id", "user_id", name="uq_ypatt_activity_user"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    activity_id: Mapped[str] = mapped_column(String(36), ForeignKey("youth_program_activities.id", ondelete="CASCADE"), nullable=False, index=True)
    program_id: Mapped[str] = mapped_column(String(36), ForeignKey("youth_programs.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    present: Mapped[bool] = mapped_column(Boolean, default=True)
    recorded_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
