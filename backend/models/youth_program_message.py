"""
YouthProgramMessage - one row per chat message in a youth program's group chat.
Each youth program (Mentorship, Digital Missions, etc.) gets its own thread
so members of that specific program can talk among themselves.
"""

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, ForeignKey, Boolean, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class YouthProgramMessage(Base):
    __tablename__ = "youth_program_messages"
    __table_args__ = (
        Index("ix_ypm_program_created", "program_id", "created_at"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    program_id: Mapped[str] = mapped_column(String(36), ForeignKey("youth_programs.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    user: Mapped["User"] = relationship("User", lazy="joined")
