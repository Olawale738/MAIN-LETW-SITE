"""
Pastoral care — encrypted shepherd notes per member, visitation tracking,
life-event timeline. Sensitive content only readable by admins/pastors.
"""

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class PastoralNote(Base):
    __tablename__ = "pastoral_notes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # The member this note is about. Foreign key to users for linked members,
    # otherwise raw name+email for anonymous shepherding.
    member_user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    member_name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    member_email: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    # visitation | call | hospital | bereavement | counsel | celebration | prayer | concern
    kind: Mapped[str] = mapped_column(String(40), default="visitation", nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    follow_up_on: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True, index=True)

    # Pastor / shepherd who wrote it
    written_by_user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_confidential: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class LifeEventEntry(Base):
    """Timeline events for a member — baptism, marriage, baby, loss, etc."""
    __tablename__ = "life_event_entries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    member_user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    member_name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    # baptism | marriage | baby | new_role | bereavement | salvation | health | other
    kind: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    summary: Mapped[str] = mapped_column(String(500), nullable=False)
    event_on: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
