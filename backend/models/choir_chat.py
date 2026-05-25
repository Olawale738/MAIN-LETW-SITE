"""
Choir group chat model — shared message room for director + members.
No user auth required; sender identity is passed in the request body.
"""

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Text, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from database import Base


class ChoirGroupMessage(Base):
    """A message in the choir group chat room."""

    __tablename__ = "choir_group_messages"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    sender_name: Mapped[str] = mapped_column(String(100), nullable=False)
    sender_initials: Mapped[str] = mapped_column(String(4), nullable=False)
    voice_part: Mapped[str] = mapped_column(String(20), nullable=False)   # "Director", "Soprano", "Alto", "Tenor", "Bass"
    is_director: Mapped[bool] = mapped_column(Boolean, default=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )


class ChoirMember(Base):
    """A registered choir member — synced from the Choirmaster portal."""

    __tablename__ = "choir_members"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    initials: Mapped[str] = mapped_column(String(4), nullable=False)
    voice: Mapped[str] = mapped_column(String(10), nullable=False)   # Soprano/Alto/Tenor/Bass
    role: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class ChoirSong(Base):
    """A song in the choir library — synced from the Choirmaster portal."""

    __tablename__ = "choir_songs"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    key: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    tempo: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    voice_part: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    lyrics_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    sheet_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    track_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    position: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
