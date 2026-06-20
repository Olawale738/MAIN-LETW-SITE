"""
Decision — Kingdom outcomes tracker. Salvations, baptisms, healings,
marriages restored, prodigals returned. Public-facing counter dashboard.
"""

from datetime import datetime, date
from typing import Optional
from sqlalchemy import String, DateTime, Date, Text, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from database import Base
import uuid


class Decision(Base):
    __tablename__ = "decisions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    # kind: salvation | baptism | healing | marriage_restored | prodigal_returned |
    #       deliverance | rededication | dedication | calling | other
    kind: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    person_name: Mapped[str] = mapped_column(String(200), nullable=False, default="Anonymous")
    person_email: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    testimony: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    decided_on: Mapped[date] = mapped_column(Date, nullable=False, default=date.today, index=True)
    submitted_by_user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    # If True AND testimony is non-empty, this decision surfaces on /testimony page
    show_in_testimony: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
