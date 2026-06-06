"""
Message read receipt tracking
Tracks which users have read which messages
"""

import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class MessageReadReceipt(Base):
    """Track message read status"""

    __tablename__ = "message_read_receipts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    message_id: Mapped[str] = mapped_column(String(36), ForeignKey("messages.id"), index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    read_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    message: Mapped["Message"] = relationship("Message", foreign_keys=[message_id])
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])

    # Unique constraint: one user can only "read" a message once
    __table_args__ = (UniqueConstraint('message_id', 'user_id', name='uq_message_user_read'),)

    def __repr__(self) -> str:
        return f"<MessageReadReceipt message={self.message_id} user={self.user_id} at={self.read_at}>"


class ConversationReadReceipt(Base):
    """Track conversation read status"""

    __tablename__ = "conversation_read_receipts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id: Mapped[str] = mapped_column(String(36), ForeignKey("conversations.id"), index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    last_read_message_id: Mapped[str] = mapped_column(String(36), nullable=True)
    read_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    conversation: Mapped["Conversation"] = relationship("Conversation", foreign_keys=[conversation_id])
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])

    # Unique constraint: one user per conversation
    __table_args__ = (UniqueConstraint('conversation_id', 'user_id', name='uq_conversation_user_read'),)

    def __repr__(self) -> str:
        return f"<ConversationReadReceipt conv={self.conversation_id} user={self.user_id}>"
