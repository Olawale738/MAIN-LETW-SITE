"""
Live service chat — lightweight room scoped to the currently-running online service.
"""

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class LiveChatMessage(Base):
    __tablename__ = "live_chat_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    service_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("online_services.id", ondelete="CASCADE"), nullable=True, index=True)
    user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    display_name: Mapped[str] = mapped_column(String(100), default="Anonymous", nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)


class LiveCaptionLine(Base):
    """One translated caption line for a live service in a given language."""
    __tablename__ = "live_captions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    service_id: Mapped[str] = mapped_column(String(36), ForeignKey("online_services.id", ondelete="CASCADE"), nullable=False, index=True)
    language: Mapped[str] = mapped_column(String(10), default="en", nullable=False, index=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    spoken_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    # True for the line in the language the operator actually spoke; False for
    # AI-translated derivatives. Lets viewer panels show "Pastor is speaking
    # in {source}" instead of guessing.
    is_source: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
