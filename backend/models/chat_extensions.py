"""
360-Degree Chat Extensions
Comprehensive chat features:
- Message reactions (emojis)
- Message replies/threads
- File/image/voice attachments
- Mentions (@user)
- Message editing history
- Pinned messages
- Saved/starred messages
- Polls in chats
- Conversation settings (mute, archive, pin)
- User blocking
- User presence (online/offline/last seen)
- Group invite links
- Disappearing messages
- Message forwarding tracking
"""

import uuid
import enum
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import (
    String, DateTime, Boolean, Text, ForeignKey, JSON, UniqueConstraint,
    Integer, Float, Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from database import Base

if TYPE_CHECKING:
    from models.user import User


class AttachmentType(str, enum.Enum):
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"          # voice messages
    DOCUMENT = "document"    # PDFs, docs
    LOCATION = "location"
    CONTACT = "contact"
    EVENT = "event"


# ─── Message Reactions ──────────────────────────────────────────────────────

class MessageReaction(Base):
    """Emoji reactions to messages."""
    __tablename__ = "message_reactions"
    __table_args__ = (
        UniqueConstraint("message_id", "user_id", "emoji", name="uq_message_reaction"),
        Index("ix_reaction_message", "message_id"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    message_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("messages.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    emoji: Mapped[str] = mapped_column(String(20), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ─── Message Attachments (Files, Voice, Images) ─────────────────────────────

class MessageAttachment(Base):
    """File/media attachment for a message."""
    __tablename__ = "message_attachments"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    message_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("messages.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    attachment_type: Mapped[str] = mapped_column(String(20), nullable=False)  # AttachmentType
    file_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    file_name: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    file_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    mime_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    # For voice messages: duration in seconds
    duration_seconds: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    # For videos: width, height
    width: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    height: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    # For location: lat/lng
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    # For contacts: vCard data
    extra_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    # Voice transcription
    transcription: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ─── Message Replies / Threading ────────────────────────────────────────────

class MessageReply(Base):
    """Reply relationship: which message is replying to which."""
    __tablename__ = "message_replies"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    message_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("messages.id", ondelete="CASCADE"),
        nullable=False, unique=True, index=True
    )
    replies_to_message_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("messages.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    # Cached preview of original message
    quoted_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    quoted_sender_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ─── Message Mentions (@user) ───────────────────────────────────────────────

class MessageMention(Base):
    """Track @mentions in messages."""
    __tablename__ = "message_mentions"
    __table_args__ = (
        UniqueConstraint("message_id", "user_id", name="uq_mention"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    message_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("messages.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    notified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ─── Message Edit History ───────────────────────────────────────────────────

class MessageEdit(Base):
    """History of message edits."""
    __tablename__ = "message_edits"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    message_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("messages.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    previous_body: Mapped[str] = mapped_column(Text, nullable=False)
    edited_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ─── Pinned Messages ────────────────────────────────────────────────────────

class PinnedMessage(Base):
    """Pinned messages per conversation."""
    __tablename__ = "pinned_messages"
    __table_args__ = (
        UniqueConstraint("conversation_id", "message_id", name="uq_pinned"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    conversation_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    message_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("messages.id", ondelete="CASCADE"),
        nullable=False
    )
    pinned_by: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    pinned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ─── Starred / Saved Messages (personal bookmarks) ──────────────────────────

class StarredMessage(Base):
    """User's personally starred/saved messages."""
    __tablename__ = "starred_messages"
    __table_args__ = (
        UniqueConstraint("user_id", "message_id", name="uq_starred"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    message_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("messages.id", ondelete="CASCADE"),
        nullable=False
    )
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    starred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ─── Conversation Settings (per user) ───────────────────────────────────────

class ConversationSettings(Base):
    """Per-user settings for a conversation: mute, archive, etc."""
    __tablename__ = "conversation_settings"
    __table_args__ = (
        UniqueConstraint("conversation_id", "user_id", name="uq_conv_settings"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    conversation_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    is_muted: Mapped[bool] = mapped_column(Boolean, default=False)
    muted_until: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    custom_nickname: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    custom_theme: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    notification_sound: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    disappearing_messages_seconds: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# ─── User Blocking ──────────────────────────────────────────────────────────

class UserBlock(Base):
    """Track user blocks."""
    __tablename__ = "user_blocks"
    __table_args__ = (
        UniqueConstraint("blocker_id", "blocked_id", name="uq_user_block"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    blocker_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    blocked_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    blocked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ─── User Presence (Online Status) ──────────────────────────────────────────

class UserPresence(Base):
    """Track online status and last seen."""
    __tablename__ = "user_presence"

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True, index=True
    )
    is_online: Mapped[bool] = mapped_column(Boolean, default=False)
    last_seen_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    status_message: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    # Privacy: show last seen to who
    last_seen_visibility: Mapped[str] = mapped_column(
        String(20), default="contacts"  # everyone, contacts, nobody
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# ─── Polls in Chat ──────────────────────────────────────────────────────────

class MessagePoll(Base):
    """Polls embedded in a chat message."""
    __tablename__ = "message_polls"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    message_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("messages.id", ondelete="CASCADE"),
        nullable=False, unique=True, index=True
    )
    question: Mapped[str] = mapped_column(Text, nullable=False)
    options: Mapped[dict] = mapped_column(JSON, nullable=False)  # ["option1", "option2"]
    allow_multiple: Mapped[bool] = mapped_column(Boolean, default=False)
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=False)
    closes_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    is_closed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class PollVote(Base):
    """User votes in polls."""
    __tablename__ = "poll_votes"
    __table_args__ = (
        UniqueConstraint("poll_id", "user_id", "option_index", name="uq_poll_vote"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    poll_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("message_polls.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    option_index: Mapped[int] = mapped_column(Integer, nullable=False)
    voted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ─── Message Status (Sent / Delivered / Read) ───────────────────────────────

class MessageStatus(Base):
    """Per-recipient message delivery & read status."""
    __tablename__ = "message_statuses"
    __table_args__ = (
        UniqueConstraint("message_id", "user_id", name="uq_message_status"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    message_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("messages.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    delivered_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    read_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


# ─── Message Forwarding ─────────────────────────────────────────────────────

class MessageForward(Base):
    """Track when messages are forwarded."""
    __tablename__ = "message_forwards"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    message_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("messages.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    original_message_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("messages.id", ondelete="CASCADE"),
        nullable=False
    )
    original_sender_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    original_sender_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    forwarded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ─── Scheduled Messages ─────────────────────────────────────────────────────

class ScheduledMessage(Base):
    """Messages scheduled to be sent at a future time."""
    __tablename__ = "scheduled_messages"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    conversation_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    sender_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)
    scheduled_for: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    sent: Mapped[bool] = mapped_column(Boolean, default=False)
    sent_message_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("messages.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ─── Quick Replies / Message Templates ──────────────────────────────────────

class QuickReply(Base):
    """User's saved quick reply templates."""
    __tablename__ = "quick_replies"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    shortcut: Mapped[str] = mapped_column(String(50), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    use_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ─── Chat Themes / Wallpapers ───────────────────────────────────────────────

class ChatTheme(Base):
    """Pre-defined or custom chat themes/wallpapers."""
    __tablename__ = "chat_themes"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    primary_color: Mapped[str] = mapped_column(String(20), nullable=False)
    secondary_color: Mapped[str] = mapped_column(String(20), nullable=False)
    bubble_color_self: Mapped[str] = mapped_column(String(20), nullable=False)
    bubble_color_other: Mapped[str] = mapped_column(String(20), nullable=False)
    background_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_dark: Mapped[bool] = mapped_column(Boolean, default=False)
    is_premium: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
