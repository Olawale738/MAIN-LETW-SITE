"""
Governance models — Lead coordinator assignments + audit log.

LeadAssignment: a group-agnostic record marking a user as the Lead of a
particular group (custom ministry, youth program, department, etc.).
We use a separate table rather than altering existing membership models so
no migration is needed and the same scheme covers every group type.

AuditLog: who did what, when, in what group. Append-only. Used for
arbitration when coordinators disagree about an action.
"""

from datetime import datetime
from typing import Optional, Any
from sqlalchemy import String, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from database import Base
import uuid


class LeadAssignment(Base):
    __tablename__ = "lead_assignments"
    __table_args__ = (
        UniqueConstraint("user_id", "group_kind", "group_id", name="uq_lead_user_group"),
        Index("ix_lead_group", "group_kind", "group_id"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    # group_kind values: 'custom_ministry' | 'youth_program' | 'department' | 'volunteer_team'
    group_kind: Mapped[str] = mapped_column(String(40), nullable=False)
    group_id: Mapped[str] = mapped_column(String(60), nullable=False)
    assigned_by_user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assigned_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("ix_audit_group", "group_kind", "group_id"),
        Index("ix_audit_actor", "actor_user_id"),
        Index("ix_audit_created", "created_at"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    actor_user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    actor_name: Mapped[str] = mapped_column(String(200), nullable=False, default="system")
    actor_email: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    # action: dotted verb, e.g. 'member.promote_to_lead', 'announcement.delete'
    action: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    target_kind: Mapped[Optional[str]] = mapped_column(String(60), nullable=True)
    target_id: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    group_kind: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    group_id: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    details: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True, default=dict)
    ip: Mapped[Optional[str]] = mapped_column(String(60), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
