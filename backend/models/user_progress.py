"""
User Progress tracking for Leadership content.
Tracks which content items (videos/documents) a user has completed.
"""

import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from database import Base


class UserContentProgress(Base):
    """Tracks user progress on leadership content items."""
    
    __tablename__ = "user_content_progress"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    
    content_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("leadership_contents.id", ondelete="CASCADE"),
        nullable=False
    )
    
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    
    # Ensure a user can only complete a content item once
    __table_args__ = (
        UniqueConstraint('user_id', 'content_id', name='unique_user_content_progress'),
    )
    
    def __repr__(self) -> str:
        return f"<UserContentProgress user={self.user_id} content={self.content_id}>"
