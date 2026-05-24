"""
Choir group chat model — shared message room for director + members.
No user auth required; sender identity is passed in the request body.
"""

import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Text, Boolean
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
