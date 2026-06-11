"""
Newsletter subscriber + broadcast log.

Anyone can subscribe via the homepage NewsletterBlock. Admins can then
send a general update to every confirmed subscriber from /admin/newsletter.
"""
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import String, DateTime, Boolean, Text, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from database import Base


class NewsletterSubscriber(Base):
    """A single email subscribed to the church newsletter."""
    __tablename__ = "newsletter_subscribers"
    __table_args__ = (
        UniqueConstraint("email", name="uq_newsletter_email"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    source: Mapped[Optional[str]] = mapped_column(
        String(50), default="homepage"  # homepage, footer, event, etc.
    )
    unsubscribe_token: Mapped[str] = mapped_column(
        String(64), default=lambda: uuid.uuid4().hex, unique=True
    )
    subscribed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    unsubscribed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class NewsletterBroadcast(Base):
    """A single 'general update' email blast sent by an admin to all subscribers."""
    __tablename__ = "newsletter_broadcasts"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    subject: Mapped[str] = mapped_column(String(300), nullable=False)
    body_html: Mapped[str] = mapped_column(Text, nullable=False)
    sent_by: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    recipients_count: Mapped[int] = mapped_column(Integer, default=0)
    success_count: Mapped[int] = mapped_column(Integer, default=0)
    failure_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
