"""
Evangelism Leaflet / Gospel tract — admin-authored, ministry-branded printable
flyers. Admin writes all the content, picks an accent colour + logo, and prints
or shares the leaflet. Rendered by the frontend into a branded, print-ready page.
"""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Text, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class EvangelismLeaflet(Base):
    __tablename__ = "evangelism_leaflets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Internal label for the admin list (not shown on the leaflet).
    title: Mapped[str] = mapped_column(String(200), nullable=False, default="Untitled leaflet")

    # ── Hero ──────────────────────────────────────────────────────────────────
    headline: Mapped[str] = mapped_column(String(200), nullable=False, default="God Loves You")
    subheadline: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)

    # ── Main message — admin writes this freely (rich HTML) ────────────────────
    body_html: Mapped[str] = mapped_column(Text, nullable=False, default="")

    # ── Highlighted scripture card ─────────────────────────────────────────────
    scripture_ref: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    scripture_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ── Call to action band ────────────────────────────────────────────────────
    cta_text: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    cta_detail: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ── Branding ───────────────────────────────────────────────────────────────
    accent_color: Mapped[str] = mapped_column(String(20), nullable=False, default="#f5bb00")
    logo_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # URL or uploaded data-URL

    # ── QR code (scan to connect) ──────────────────────────────────────────────
    qr_url: Mapped[Optional[str]] = mapped_column(String(600), nullable=True)  # what the QR links to
    qr_caption: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # data-URL or link
    layout: Mapped[str] = mapped_column(String(30), nullable=False, default="flyer")  # flyer | tri-fold

    # ── Footer / contact ───────────────────────────────────────────────────────
    church_name: Mapped[str] = mapped_column(String(200), nullable=False, default="Light Encounter Tabernacle Worldwide")
    contact_phone: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    contact_website: Mapped[Optional[str]] = mapped_column(String(200), nullable=True, default="letw.org")
    contact_address: Mapped[Optional[str]] = mapped_column(String(400), nullable=True)
    service_times: Mapped[Optional[str]] = mapped_column(String(400), nullable=True)
    footer_note: Mapped[Optional[str]] = mapped_column(String(400), nullable=True)

    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft", index=True)  # draft | published
    is_public: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
