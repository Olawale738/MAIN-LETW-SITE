"""
Marriage Prep — 6-week guided course with pastor sign-off.

  - marriage_prep_modules   — the curriculum (one row per week-lesson). Admin owns these.
  - marriage_prep_couples   — couple enrolment record + assigned pastor + status.
  - marriage_prep_progress  — per-module check-ins keyed (couple, module).
"""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import String, DateTime, Integer, Text, Boolean, ForeignKey, LargeBinary
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class MarriagePrepModule(Base):
    __tablename__ = "marriage_prep_modules"

    id:          Mapped[str]  = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    week_number: Mapped[int]  = mapped_column(Integer, nullable=False, index=True)
    title:       Mapped[str]  = mapped_column(String(200), nullable=False)
    summary:     Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    body_html:   Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    scripture:   Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    homework:    Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_published:Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at:  Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class MarriagePrepModuleResource(Base):
    """A link or file attached to a curriculum week — admin can add an
    external URL, or upload a PDF / Word doc / any other file, stored as
    binary in Postgres (same pattern as DownloadResource)."""
    __tablename__ = "marriage_prep_module_resources"

    id:        Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    module_id: Mapped[str] = mapped_column(String(36), ForeignKey("marriage_prep_modules.id", ondelete="CASCADE"), nullable=False, index=True)
    title:     Mapped[str] = mapped_column(String(255), nullable=False)
    kind:      Mapped[str] = mapped_column(String(10), nullable=False, default="url")  # 'url' | 'file'
    external_url:   Mapped[Optional[str]]   = mapped_column(String(800), nullable=True)
    file_data:      Mapped[Optional[bytes]] = mapped_column(LargeBinary, nullable=True)
    file_name:      Mapped[Optional[str]]   = mapped_column(String(255), nullable=True)
    file_mime_type: Mapped[Optional[str]]   = mapped_column(String(120), nullable=True)
    file_size:      Mapped[Optional[int]]   = mapped_column(Integer, nullable=True)
    created_at:     Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class MarriagePrepCouple(Base):
    __tablename__ = "marriage_prep_couples"

    id:                 Mapped[str]  = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    partner_a_name:     Mapped[str]  = mapped_column(String(150), nullable=False)
    partner_a_email:    Mapped[str]  = mapped_column(String(255), nullable=False)
    partner_b_name:     Mapped[str]  = mapped_column(String(150), nullable=False)
    partner_b_email:    Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    intended_wedding_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    assigned_pastor_user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status:             Mapped[str]  = mapped_column(String(20), default="enrolled", nullable=False, index=True)  # enrolled|in_progress|completed|withdrew
    pastor_signed_off:  Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    pastor_signed_at:   Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    pastor_signature:   Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    pastor_note:        Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Human-facing training-certificate number, minted at sign-off. Partner
    # systems (e.g. sharepoints.letw.org) use it to look up the couple and
    # issue the marriage certificate.
    certificate_number: Mapped[Optional[str]] = mapped_column(String(40), nullable=True, index=True)
    # Couple photo (uploaded data-URL or link) — travels with the handshake so
    # the partner system can print it on the marriage certificate.
    photo_url:          Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Marriage-certificate details captured on letw.org and pushed through the
    # handshake so sharepoints issues an identical certificate (incl. witnesses).
    marriage_date:      Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    marriage_venue:     Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    officiant_name:     Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    witness_1:          Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    witness_2:          Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    # Pastor-proposed video/meeting session — the couple is emailed a calendar
    # invite when this is set. NULL = nothing scheduled.
    session_at:         Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    session_note:       Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at:         Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class MarriagePrepProgress(Base):
    __tablename__ = "marriage_prep_progress"

    id:           Mapped[str]  = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    couple_id:    Mapped[str]  = mapped_column(String(36), ForeignKey("marriage_prep_couples.id", ondelete="CASCADE"), nullable=False, index=True)
    module_id:    Mapped[str]  = mapped_column(String(36), ForeignKey("marriage_prep_modules.id", ondelete="CASCADE"), nullable=False, index=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    reflections:  Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at:   Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
