"""
Opt-in member directory.

Each member opts in independently. They control what's shown (city, bio, gifts,
languages, photo). Messages are stored centrally with a 'reported' flag for
moderation.
"""

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Text, Boolean, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class DirectoryProfile(Base):
    __tablename__ = "directory_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)

    display_name: Mapped[str] = mapped_column(String(120), nullable=False)
    city: Mapped[Optional[str]] = mapped_column(String(120), nullable=True, index=True)
    country: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Comma-separated tags
    gifts: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    languages: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    photo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    is_public: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    allow_messages: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_prayer_partner: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class DirectoryMessage(Base):
    __tablename__ = "directory_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    sender_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    is_reported: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)
