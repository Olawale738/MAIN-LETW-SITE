"""
Custom Ministry Models — Comprehensive Edition
Allows admins to dynamically create rich ministries with:
- Events & meetings
- Resources library (files, videos, links)
- Photo gallery
- Leadership team (multiple roles)
- Testimonials from members
- Prayer requests
- Mission & vision statements
- Social media links
- Activity tracking
- Goals & milestones
- Sub-groups for larger ministries
- FAQs
"""

import uuid
import enum
from datetime import datetime, date
from typing import Optional, TYPE_CHECKING
from sqlalchemy import (
    String, DateTime, Boolean, Text, ForeignKey, JSON, UniqueConstraint,
    Integer, Date, Float,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from database import Base

if TYPE_CHECKING:
    from models.user import User


class MinistryMembershipStatus(str, enum.Enum):
    """Member status in a custom ministry."""
    PENDING   = "pending"
    ACTIVE    = "active"
    SUSPENDED = "suspended"
    REJECTED  = "rejected"


class MinistryEventType(str, enum.Enum):
    """Type of ministry event."""
    MEETING       = "meeting"
    SERVICE       = "service"
    OUTREACH      = "outreach"
    RETREAT       = "retreat"
    FELLOWSHIP    = "fellowship"
    CONFERENCE    = "conference"
    SOCIAL        = "social"
    TRAINING      = "training"
    PRAYER        = "prayer"
    SPECIAL       = "special"


class MinistryResourceType(str, enum.Enum):
    """Type of resource."""
    DOCUMENT  = "document"
    VIDEO     = "video"
    AUDIO     = "audio"
    LINK      = "link"
    IMAGE     = "image"
    BIBLE_STUDY = "bible_study"


class MinistryRoleType(str, enum.Enum):
    """Leadership roles within a ministry."""
    PASTOR        = "pastor"
    COORDINATOR   = "coordinator"
    PRESIDENT     = "president"
    VICE_PRESIDENT = "vice_president"
    SECRETARY     = "secretary"
    TREASURER     = "treasurer"
    PRAYER_LEADER = "prayer_leader"
    EVENT_PLANNER = "event_planner"
    OUTREACH_LEAD = "outreach_lead"
    WORSHIP_LEAD  = "worship_lead"
    ELDER         = "elder"
    MENTOR        = "mentor"
    OTHER         = "other"


class CustomMinistry(Base):
    """
    Admin-created ministry with rich content support.
    """
    __tablename__ = "custom_ministries"
    __table_args__ = (
        UniqueConstraint("slug", name="uq_ministry_slug"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    slug: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    tagline: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Visual identity
    hero_image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    icon_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    color: Mapped[str] = mapped_column(String(20), default="#140152")
    secondary_color: Mapped[str] = mapped_column(String(20), default="#7c3aed")
    icon_name: Mapped[str] = mapped_column(String(50), default="Users")
    emoji: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)

    # Mission & Vision (NEW)
    mission_statement: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    vision_statement: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    core_values: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON list or text
    scripture_verse: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    scripture_reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Contact information (NEW)
    contact_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    contact_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    whatsapp_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    whatsapp_group_link: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Social media (NEW)
    facebook_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    instagram_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    twitter_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    youtube_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    website_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Meeting & location
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    accepts_members: Mapped[bool] = mapped_column(Boolean, default=True)
    meeting_schedule: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    meeting_day: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # Sunday, Monday, etc.
    meeting_time: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    online_meeting_link: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Category & age targeting (NEW)
    category: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # fellowship, prayer, evangelism, etc.
    target_audience: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)  # "Adults 18+", "Women only", etc.
    age_min: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    age_max: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    gender_filter: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # male, female, any

    # Membership requirements (NEW)
    requires_approval: Mapped[bool] = mapped_column(Boolean, default=True)
    membership_fee: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    requires_baptism: Mapped[bool] = mapped_column(Boolean, default=False)
    requires_application: Mapped[bool] = mapped_column(Boolean, default=False)
    application_questions: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # array of questions

    # Gallery (NEW)
    gallery_images: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # array of image URLs

    # Goals & impact (NEW)
    goals: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    impact_stats: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # {"lives_touched": 100, "events_held": 25}

    # FAQs (NEW)
    faqs: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # array of {question, answer}

    # Featured & promotion (NEW)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    show_on_homepage: Mapped[bool] = mapped_column(Boolean, default=False)

    # ── Volunteer Department specific fields ───────────────────────────────
    department_motto: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    department_pledge: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Time commitment expected (hours per week/month)
    time_commitment_hours: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    time_commitment_period: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # week, month
    # Background check
    background_check_required: Mapped[bool] = mapped_column(Boolean, default=False)
    background_check_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    # Dress code
    dress_code: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    dress_code_image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    # Skills, training, onboarding (stored as JSON arrays)
    skills_required: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # {"skills": ["..."]}
    training_requirements: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # {"trainings": [{name, url, required}]}
    onboarding_steps: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # {"steps": [{step, description}]}
    equipment_provided: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # {"items": ["..."]}
    # Documents
    sop_document_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    manual_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    # Requirements toggles
    emergency_contact_required: Mapped[bool] = mapped_column(Boolean, default=False)
    photo_id_required: Mapped[bool] = mapped_column(Boolean, default=False)
    references_required: Mapped[bool] = mapped_column(Boolean, default=False)
    # Recognition system
    recognition_levels: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # {"levels": [{name, hours_required, color}]}

    # Custom features as JSON
    features: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    created_by: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class CustomMinistryMember(Base):
    """Membership of a user in a custom ministry."""
    __tablename__ = "custom_ministry_members"
    __table_args__ = (
        UniqueConstraint("ministry_id", "user_id", name="uq_ministry_member"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    ministry_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("custom_ministries.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    status: Mapped[MinistryMembershipStatus] = mapped_column(
        String(20), default=MinistryMembershipStatus.PENDING
    )
    is_coordinator: Mapped[bool] = mapped_column(Boolean, default=False)
    role_label: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    role_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    join_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    application_responses: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    requested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    approved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    approved_by: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )


class CustomMinistryLeader(Base):
    """
    Leadership team for a ministry.
    Supports multiple roles (President, Treasurer, Secretary, etc.)
    """
    __tablename__ = "custom_ministry_leaders"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    ministry_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("custom_ministries.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    user_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    # Display info (for non-member leaders, e.g., guest pastors)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    role_type: Mapped[str] = mapped_column(String(50), nullable=False)
    role_title: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    photo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class CustomMinistryEvent(Base):
    """Events, meetings, and gatherings within a ministry."""
    __tablename__ = "custom_ministry_events"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    ministry_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("custom_ministries.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    event_type: Mapped[str] = mapped_column(String(50), default=MinistryEventType.MEETING)
    event_date: Mapped[date] = mapped_column(Date, nullable=False)
    event_time: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    end_time: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    online_link: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False)
    recurrence_pattern: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # weekly, monthly, etc.
    max_attendees: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    requires_rsvp: Mapped[bool] = mapped_column(Boolean, default=False)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)
    is_cancelled: Mapped[bool] = mapped_column(Boolean, default=False)
    created_by: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class CustomMinistryEventRsvp(Base):
    """RSVPs for events."""
    __tablename__ = "custom_ministry_event_rsvps"
    __table_args__ = (
        UniqueConstraint("event_id", "user_id", name="uq_event_rsvp"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    event_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("custom_ministry_events.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(String(20), default="attending")  # attending, maybe, declined
    plus_ones: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class CustomMinistryResource(Base):
    """Resources library: documents, videos, audio, links."""
    __tablename__ = "custom_ministry_resources"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    ministry_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("custom_ministries.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resource_type: Mapped[str] = mapped_column(String(50), default=MinistryResourceType.DOCUMENT)
    url: Mapped[str] = mapped_column(String(1000), nullable=False)
    file_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    download_count: Mapped[int] = mapped_column(Integer, default=0)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    uploaded_by: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class CustomMinistryTestimonial(Base):
    """Member testimonials about the ministry."""
    __tablename__ = "custom_ministry_testimonials"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    ministry_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("custom_ministries.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    user_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    author_name: Mapped[str] = mapped_column(String(200), nullable=False)
    author_role: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # "Member", "Leader", etc.
    photo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 1-5 stars
    is_approved: Mapped[bool] = mapped_column(Boolean, default=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class CustomMinistryPrayerRequest(Base):
    """Prayer requests specific to this ministry."""
    __tablename__ = "custom_ministry_prayer_requests"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    ministry_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("custom_ministries.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    user_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    author_name: Mapped[str] = mapped_column(String(200), nullable=False)
    request: Mapped[str] = mapped_column(Text, nullable=False)
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=False)
    is_urgent: Mapped[bool] = mapped_column(Boolean, default=False)
    is_answered: Mapped[bool] = mapped_column(Boolean, default=False)
    answer_testimony: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    prayer_count: Mapped[int] = mapped_column(Integer, default=0)
    is_visible_to_public: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class CustomMinistryAnnouncement(Base):
    """Announcements posted to a custom ministry."""
    __tablename__ = "custom_ministry_announcements"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    ministry_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("custom_ministries.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    author_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    is_urgent: Mapped[bool] = mapped_column(Boolean, default=False)
    notify_all: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class CustomMinistryMessage(Base):
    """Group chat messages within a custom ministry."""
    __tablename__ = "custom_ministry_messages"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    ministry_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("custom_ministries.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    sender_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class CustomMinistryShift(Base):
    """
    Recurring weekly shifts for volunteer departments.
    Example: 'Sunday Service 8am-12pm', 'Wednesday Bible Study 6pm-9pm'
    """
    __tablename__ = "custom_ministry_shifts"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    ministry_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("custom_ministries.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    day_of_week: Mapped[str] = mapped_column(String(20), nullable=False)  # Sunday, Monday, etc.
    start_time: Mapped[str] = mapped_column(String(10), nullable=False)  # "08:00"
    end_time: Mapped[str] = mapped_column(String(10), nullable=False)  # "12:00"
    location: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    capacity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # Max volunteers
    sub_team: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    role_required: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class CustomMinistryShiftSignup(Base):
    """Volunteer signup for a specific shift on a specific date."""
    __tablename__ = "custom_ministry_shift_signups"
    __table_args__ = (
        UniqueConstraint("shift_id", "user_id", "shift_date", name="uq_shift_signup"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    shift_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("custom_ministry_shifts.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    shift_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="signed_up")  # signed_up, checked_in, no_show, completed
    checked_in_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    checked_out_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class CustomMinistryVolunteerHours(Base):
    """Track total service hours per volunteer."""
    __tablename__ = "custom_ministry_volunteer_hours"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    ministry_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("custom_ministries.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    hours: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    service_date: Mapped[date] = mapped_column(Date, nullable=False)
    shift_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("custom_ministry_shifts.id", ondelete="SET NULL"), nullable=True
    )
    approved: Mapped[bool] = mapped_column(Boolean, default=True)
    approved_by: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class CustomMinistrySubTeam(Base):
    """
    Sub-teams within a volunteer department.
    Example: Security dept may have 'Entrance Team', 'Patrol Team', 'Parking Team'
    """
    __tablename__ = "custom_ministry_sub_teams"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    ministry_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("custom_ministries.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    color: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    icon: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    leader_user_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class CustomMinistryOnboardingProgress(Base):
    """Track onboarding progress for new volunteers."""
    __tablename__ = "custom_ministry_onboarding_progress"
    __table_args__ = (
        UniqueConstraint("ministry_id", "user_id", "step_name", name="uq_onboarding_step"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    ministry_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("custom_ministries.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    step_name: Mapped[str] = mapped_column(String(255), nullable=False)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_by: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class CustomMinistryRecognition(Base):
    """Awards/recognition given to volunteers."""
    __tablename__ = "custom_ministry_recognition"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    ministry_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("custom_ministries.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    award_name: Mapped[str] = mapped_column(String(255), nullable=False)
    award_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    award_type: Mapped[str] = mapped_column(String(50), default="achievement")  # milestone, achievement, monthly_winner, lifetime
    badge_icon: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    badge_color: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    awarded_by: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    awarded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class CustomMinistryActivity(Base):
    """Activity log for ministry (outreach, service hours, etc.)."""
    __tablename__ = "custom_ministry_activities"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    ministry_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("custom_ministries.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    user_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    activity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    activity_date: Mapped[date] = mapped_column(Date, nullable=False)
    duration_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    participants_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    lives_impacted: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
