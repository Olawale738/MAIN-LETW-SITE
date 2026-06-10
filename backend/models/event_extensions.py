"""
Event Extensions - Comprehensive event features
- RSVPs (internal registration)
- Speakers/Hosts
- Multi-session agendas
- Photo galleries
- Comments & Q&A
- Reviews & ratings
- Ticket tiers (paid events)
- Sponsors
- Volunteer positions
- FAQ
- Event tags
- Recurring events
- Live stream integration
- Check-in with QR codes
- Reminders/notifications
"""

import uuid
import enum
from datetime import datetime, date, time
from typing import Optional, TYPE_CHECKING
from sqlalchemy import (
    String, DateTime, Boolean, Text, ForeignKey, JSON, UniqueConstraint,
    Integer, Float, Date, Time, Index,
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from database import Base


# ─── RSVPs (Internal Registration) ──────────────────────────────────────────

class RsvpStatus(str, enum.Enum):
    ATTENDING = "attending"
    MAYBE = "maybe"
    DECLINED = "declined"
    WAITLISTED = "waitlisted"


class EventRsvp(Base):
    """RSVP/registration for an event (internal, no external link needed)."""
    __tablename__ = "event_rsvps"
    __table_args__ = (
        UniqueConstraint("event_id", "user_id", name="uq_global_event_rsvp"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    event_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    user_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True, index=True
    )
    # For guests without account
    guest_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    guest_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    guest_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default=RsvpStatus.ATTENDING)
    plus_ones: Mapped[int] = mapped_column(Integer, default=0)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Custom registration form responses
    responses: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    # Ticket info
    ticket_tier_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    payment_status: Mapped[str] = mapped_column(String(20), default="unpaid")
    amount_paid: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    # Check-in
    checked_in: Mapped[bool] = mapped_column(Boolean, default=False)
    checked_in_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    # QR code token for check-in
    qr_token: Mapped[str] = mapped_column(
        String(64), default=lambda: uuid.uuid4().hex, unique=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ─── Speakers / Hosts ────────────────────────────────────────────────────────

class EventSpeaker(Base):
    """Speakers, hosts, or special guests for an event."""
    __tablename__ = "event_speakers"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    event_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    photo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    organization: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    twitter_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    linkedin_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    website_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_keynote: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ─── Multi-Session Agenda ───────────────────────────────────────────────────

class EventSession(Base):
    """Individual sessions within an event (conferences, multi-day events)."""
    __tablename__ = "event_sessions"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    event_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    session_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[str] = mapped_column(String(10), nullable=False)
    end_time: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    room: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    track: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    speaker_ids: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    session_type: Mapped[str] = mapped_column(String(50), default="talk")  # talk, workshop, break, etc.
    capacity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ─── Photo Gallery ──────────────────────────────────────────────────────────

class EventPhoto(Base):
    """Photos for an event (multiple images, before/during/after)."""
    __tablename__ = "event_photos"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    event_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    image_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    caption: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    photographer: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    # Phase: before, during, after, promotional
    phase: Mapped[str] = mapped_column(String(20), default="promotional")
    is_cover: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    uploaded_by: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ─── Comments / Q&A ──────────────────────────────────────────────────────────

class EventComment(Base):
    """Comments and questions about an event."""
    __tablename__ = "event_comments"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    event_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    user_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    author_name: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    parent_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("event_comments.id", ondelete="CASCADE"),
        nullable=True, index=True
    )
    is_question: Mapped[bool] = mapped_column(Boolean, default=False)
    is_answered: Mapped[bool] = mapped_column(Boolean, default=False)
    upvotes: Mapped[int] = mapped_column(Integer, default=0)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ─── Ticket Tiers (paid events) ─────────────────────────────────────────────

class EventTicketTier(Base):
    """Different ticket types/prices for an event."""
    __tablename__ = "event_ticket_tiers"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    event_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)  # "Standard", "VIP", "Student"
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    price: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    currency: Mapped[str] = mapped_column(String(10), default="USD")
    capacity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    sold_count: Mapped[int] = mapped_column(Integer, default=0)
    benefits: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # ["VIP seating", "Lunch", etc.]
    sale_starts: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    sale_ends: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


# ─── Sponsors ────────────────────────────────────────────────────────────────

class EventSponsor(Base):
    """Event sponsors and partners."""
    __tablename__ = "event_sponsors"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    event_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    website_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tier: Mapped[str] = mapped_column(String(50), default="standard")  # platinum, gold, silver, bronze, standard
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


# ─── Volunteer Positions Needed ─────────────────────────────────────────────

class EventVolunteerPosition(Base):
    """Volunteer positions needed for an event."""
    __tablename__ = "event_volunteer_positions"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    event_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    role_name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    slots_needed: Mapped[int] = mapped_column(Integer, default=1)
    slots_filled: Mapped[int] = mapped_column(Integer, default=0)
    shift_time: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    skills_required: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    coordinator_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class EventVolunteerSignup(Base):
    """Volunteer signups for event positions."""
    __tablename__ = "event_volunteer_signups"
    __table_args__ = (
        UniqueConstraint("position_id", "user_id", name="uq_event_volunteer_signup"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    position_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("event_volunteer_positions.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(String(20), default="signed_up")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ─── FAQ ─────────────────────────────────────────────────────────────────────

class EventFaq(Base):
    """Frequently asked questions about an event."""
    __tablename__ = "event_faqs"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    event_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ─── Event Tags ──────────────────────────────────────────────────────────────

class EventTag(Base):
    """Tags for filtering/categorizing events."""
    __tablename__ = "event_tags"
    __table_args__ = (
        UniqueConstraint("event_id", "tag", name="uq_event_tag"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    event_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    tag: Mapped[str] = mapped_column(String(100), nullable=False, index=True)


# ─── Event Reminders ────────────────────────────────────────────────────────

class EventReminder(Base):
    """Reminders queued for event attendees."""
    __tablename__ = "event_reminders"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    event_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    remind_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    method: Mapped[str] = mapped_column(String(20), default="notification")  # email, sms, push, notification
    sent: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ─── Event Updates / Announcements ──────────────────────────────────────────

class EventUpdate(Base):
    """Announcements sent to all event attendees."""
    __tablename__ = "event_updates"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    event_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_urgent: Mapped[bool] = mapped_column(Boolean, default=False)
    posted_by: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ─── Event Donations ────────────────────────────────────────────────────────

class EventDonation(Base):
    """Donations made for an event."""
    __tablename__ = "event_donations"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    event_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    user_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    donor_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="USD")
    message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=False)
    payment_method: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    transaction_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ─── Event Polls (during/before events) ─────────────────────────────────────

class EventPoll(Base):
    """Polls associated with an event."""
    __tablename__ = "event_polls"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    event_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    question: Mapped[str] = mapped_column(Text, nullable=False)
    options: Mapped[dict] = mapped_column(JSON, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    show_results_after_vote: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class EventPollVote(Base):
    """Votes in event polls."""
    __tablename__ = "event_poll_votes"
    __table_args__ = (
        UniqueConstraint("poll_id", "user_id", name="uq_event_poll_vote"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    poll_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("event_polls.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    option_index: Mapped[int] = mapped_column(Integer, nullable=False)
    voted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
