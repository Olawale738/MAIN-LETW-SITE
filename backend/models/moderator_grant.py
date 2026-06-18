"""
ModeratorGrant — per-scope access for non-admin moderators.

A grant means: "user X may access admin section Y".
Admins implicitly have every scope.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from database import Base
import uuid


class ModeratorGrant(Base):
    __tablename__ = "moderator_grants"
    __table_args__ = (UniqueConstraint("user_id", "scope", name="uq_moderator_user_scope"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    scope: Mapped[str] = mapped_column(String(60), nullable=False, index=True)
    granted_by_user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    granted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
