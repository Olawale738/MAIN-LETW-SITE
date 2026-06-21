"""
Conversion journey — every altar-call respondent is shepherded through a
6-step pipeline. Each row tracks where someone is in their walk from
'just said yes' to 'committed member'.
"""

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


# Pipeline stages, in order
STAGES = (
    "welcomed",     # automated welcome email sent
    "called",       # 1-on-1 follow-up call assigned
    "studying",     # invited to / attending Bible study
    "baptism",      # baptism class enrolled / completed
    "small_group",  # placed in a small group / house fellowship
    "member",       # completed membership process
    "dormant",      # 30+ days no progress — needs revival
)


class ConversionJourney(Base):
    __tablename__ = "conversion_journeys"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Who this is about. If linked to a user account, use user_id; otherwise
    # the altar-call response carried name + email.
    user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(200), nullable=True, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    # Where the decision came from
    source: Mapped[str] = mapped_column(String(40), default="altar_call", index=True)
    # Optional reference to the altar-call response row
    source_ref: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)

    # Pipeline
    stage: Mapped[str] = mapped_column(String(30), default="welcomed", nullable=False, index=True)
    assigned_to_user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Timeline timestamps
    welcomed_at:    Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    called_at:      Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    studying_at:    Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    baptism_at:     Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    small_group_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    member_at:      Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_activity_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    def __repr__(self) -> str:
        return f"<ConversionJourney {self.name} ({self.stage})>"
