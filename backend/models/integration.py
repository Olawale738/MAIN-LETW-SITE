"""
Integration settings — single-row store for partner-system secrets so an admin
can manage them from the dashboard instead of server env vars.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class IntegrationSettings(Base):
    __tablename__ = "integration_settings"

    # Fixed single row.
    id: Mapped[str] = mapped_column(String(20), primary_key=True, default="default")
    sharepoints_api_key: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    # On pastor sign-off, letw.org PUSHES the completed couple: a webhook POST to
    # sharepoints (if set) and/or an email to the marriage-certificate office.
    sharepoints_webhook_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    marriage_office_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    # Baptism push targets (parallel to marriage).
    baptism_webhook_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    baptism_office_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    # Admin-adjustable church seal image (uploaded data-URL or link) printed on
    # the marriage/baptism certificates; flows to sharepoints via the handshake.
    marriage_seal_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # live.letw.org (LMS) connection — bespoke PHP app, so the enrolment path is
    # admin-configurable rather than hard-coded.
    lms_base_url: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    lms_api_key: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    lms_enrol_path: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    # sharepoints student-ID intake
    student_webhook_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
