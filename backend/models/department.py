"""
Department models — Choir, Youth, Children.
Covers membership, announcements, activities, and attendance
for each of the three ministries.
"""

import uuid
import enum
from datetime import datetime, date
from typing import Optional, TYPE_CHECKING
from sqlalchemy import (
    String, DateTime, Boolean, Text, Date,
    Enum as SQLEnum, ForeignKey, JSON, UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from database import Base

if TYPE_CHECKING:
    from models.user import User


# ─── Enums ───────────────────────────────────────────────────────────────────

class DepartmentType(str, enum.Enum):
    CHOIR    = "choir"
    YOUTH    = "youth"
    CHILDREN = "children"


class ActivityType(str, enum.Enum):
    REHEARSAL = "rehearsal"
    SERVICE   = "service"
    MEETING   = "meeting"
    CLASS     = "class"
    SPECIAL   = "special"


# ─── Models ──────────────────────────────────────────────────────────────────

class DepartmentMember(Base):
    """
    Links a registered user to a ministry department.
    A user may be a member of multiple departments (e.g. youth & choir).
    Unique per (user_id, department) pair.
    """
    __tablename__ = "department_members"
    __table_args__ = (
        UniqueConstraint("user_id", "department", name="uq_dept_member"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    department: Mapped[DepartmentType] = mapped_column(
        SQLEnum(DepartmentType, native_enum=False), nullable=False, index=True
    )
    # dept-specific label, e.g. "Soprano", "Form 3A", "Nursery"
    role_label: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    # free-text notes (allergies, special needs, guardian info, etc.)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # flexible JSON bag for extra dept-specific data
    extra_info: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped["User"] = relationship(
        "User", back_populates="department_memberships",
        lazy="joined", foreign_keys=[user_id]
    )


class DepartmentAnnouncement(Base):
    """An announcement posted by a department leader to their members."""
    __tablename__ = "department_announcements"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    department: Mapped[DepartmentType] = mapped_column(
        SQLEnum(DepartmentType, native_enum=False), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    author_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    is_urgent: Mapped[bool] = mapped_column(Boolean, default=False)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )

    author: Mapped[Optional["User"]] = relationship(
        "User", lazy="joined", foreign_keys=[author_id]
    )


class DepartmentActivity(Base):
    """A scheduled activity, rehearsal, class, or event for a department."""
    __tablename__ = "department_activities"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    department: Mapped[DepartmentType] = mapped_column(
        SQLEnum(DepartmentType, native_enum=False), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    activity_type: Mapped[ActivityType] = mapped_column(
        SQLEnum(ActivityType, native_enum=False), default=ActivityType.MEETING
    )
    activity_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    activity_time: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    venue: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_by: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    creator: Mapped[Optional["User"]] = relationship(
        "User", lazy="joined", foreign_keys=[created_by]
    )


class AttendanceRecord(Base):
    """Attendance for a department member at a specific session."""
    __tablename__ = "dept_attendance_records"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    department: Mapped[DepartmentType] = mapped_column(
        SQLEnum(DepartmentType, native_enum=False), nullable=False, index=True
    )
    session_label: Mapped[str] = mapped_column(String(255), nullable=False)
    session_date: Mapped[date] = mapped_column(Date, nullable=False)
    present: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recorded_by: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    member: Mapped["User"] = relationship(
        "User", foreign_keys=[user_id], lazy="joined"
    )
    recorder: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[recorded_by], lazy="joined"
    )
