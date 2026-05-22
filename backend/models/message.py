"""
Direct-message / chat models.

Implements a simple two-party conversation system between a regular user
and an admin/pastor. Each conversation has exactly two participants -
a 'user' and an 'admin' - and contains a stream of messages.
"""

import uuid
import enum
from datetime import datetime
from typing import List, TYPE_CHECKING

from sqlalchemy import (
    String, Text, DateTime, ForeignKey, Boolean,
    Enum as SQLEnum, Index, Integer,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from database import Base

if TYPE_CHECKING:
    from models.user import User


class ConversationStatus(str, enum.Enum):
    """Status of a chat conversation."""
    OPEN = "open"
    CLOSED = "closed"
    ARCHIVED = "archived"


class Conversation(Base):
    """A conversation thread between a regular user and an admin/pastor."""

    __tablename__ = "conversations"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()),
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    admin_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True, index=True,
    )
    subject: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[ConversationStatus] = mapped_column(
        SQLEnum(ConversationStatus),
        default=ConversationStatus.OPEN, nullable=False,
    )

    last_message_preview: Mapped[str | None] = mapped_column(String(500), nullable=True)
    last_message_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True,
    )

    unread_for_user: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    unread_for_admin: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
        onupdate=func.now(), nullable=False,
    )

    user: Mapped["User"] = relationship(
        "User", foreign_keys=[user_id],
        back_populates="conversations_as_user",
    )
    admin: Mapped["User | None"] = relationship(
        "User", foreign_keys=[admin_id],
        back_populates="conversations_as_admin",
    )
    messages: Mapped[List["Message"]] = relationship(
        "Message", back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="Message.created_at",
    )

    __table_args__ = (
        Index("ix_conversation_user_admin", "user_id", "admin_id"),
    )

    def __repr__(self) -> str:
        return f"<Conversation {self.id} user={self.user_id} admin={self.admin_id}>"


class Message(Base):
    """A single message inside a Conversation."""

    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()),
    )
    conversation_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    sender_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)
    attachment_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    edited_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
        nullable=False, index=True,
    )

    conversation: Mapped["Conversation"] = relationship(
        "Conversation", back_populates="messages",
    )
    sender: Mapped["User"] = relationship("User", foreign_keys=[sender_id])

    def __repr__(self) -> str:
        return f"<Message {self.id} from={self.sender_id} conv={self.conversation_id}>"
