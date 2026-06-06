"""
Audit logging model
Tracks all permission-related actions for security and compliance
"""

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class AuditLogEntry(Base):
    """Audit log entry for tracking actions"""

    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    action: Mapped[str] = mapped_column(String(255), index=True)  # e.g., "DELETE_MESSAGE", "ASSIGN_MODERATOR"
    resource_type: Mapped[str] = mapped_column(String(255), index=True)  # e.g., "message", "group", "user"
    resource_id: Mapped[str] = mapped_column(String(36), index=True)  # ID of the resource being acted upon
    details: Mapped[dict] = mapped_column(JSON, nullable=True)  # Additional details about the action
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)  # IPv4 or IPv6
    user_agent: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # Browser/client info

    # Relationships
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])

    def __repr__(self) -> str:
        return f"<AuditLogEntry {self.id}: {self.action} on {self.resource_type}/{self.resource_id} by {self.user_id}>"


class PermissionChange(Base):
    """Track permission changes for compliance"""

    __tablename__ = "permission_changes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    subject_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    actor_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    permission: Mapped[str] = mapped_column(String(255))
    old_value: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    new_value: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    reason: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    subject: Mapped["User"] = relationship("User", foreign_keys=[subject_user_id])
    actor: Mapped["User"] = relationship("User", foreign_keys=[actor_user_id])

    def __repr__(self) -> str:
        return f"<PermissionChange {self.id}: {self.subject_user_id} by {self.actor_user_id}>"
