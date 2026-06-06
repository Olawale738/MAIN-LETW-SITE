"""
Activity tracking models
Tracks user activities for evangelism, discipleship, and other departments
"""

import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import String, DateTime, ForeignKey, Index, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class ActivityType(str, Enum):
    """Activity types for different departments"""
    # Evangelism
    GOSPEL_SHARE = "gospel_share"
    TRACT_DISTRIBUTE = "tract_distribute"
    PRAYER_SESSION = "prayer_session"
    CONTACT_MADE = "contact_made"
    FOLLOW_UP_DONE = "follow_up_done"
    COMMITMENT = "commitment"

    # Discipleship
    BIBLE_STUDY = "bible_study"
    MENTORING_SESSION = "mentoring_session"
    PROGRESS_REVIEW = "progress_review"

    # General
    VOLUNTEER_HOURS = "volunteer_hours"
    ATTENDANCE = "attendance"
    TRAINING_COMPLETED = "training_completed"
    EVENT_PARTICIPATION = "event_participation"

    # Messages/Communication
    MESSAGE_SENT = "message_sent"
    CONVERSATION_STARTED = "conversation_started"


class ActivityStatus(str, Enum):
    """Status of an activity"""
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Activity(Base):
    """Track activities by volunteers"""

    __tablename__ = "activities"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    department: Mapped[str] = mapped_column(String(50), index=True)
    activity_type: Mapped[str] = mapped_column(String(50), index=True)
    status: Mapped[str] = mapped_column(String(20), default=ActivityStatus.COMPLETED)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, nullable=True)

    # Metadata
    duration_minutes: Mapped[int] = mapped_column(default=0)
    date: Mapped[datetime] = mapped_column(DateTime, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Optional references
    coordinator_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    conversation_id: Mapped[str] = mapped_column(String(36), ForeignKey("conversations.id"), nullable=True)
    target_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)

    # Additional metrics
    impact_score: Mapped[int] = mapped_column(default=0)  # 1-5 scale
    notes: Mapped[str] = mapped_column(Text, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id], viewonly=True)
    coordinator: Mapped["User"] = relationship("User", foreign_keys=[coordinator_id], viewonly=True)

    # Indexes for common queries
    __table_args__ = (
        Index('ix_activities_user_date', 'user_id', 'date'),
        Index('ix_activities_user_department', 'user_id', 'department'),
        Index('ix_activities_department_date', 'department', 'date'),
        Index('ix_activities_status_date', 'status', 'date'),
    )

    def __repr__(self) -> str:
        return f"<Activity {self.activity_type} by {self.user_id} on {self.date}>"


class ActivityMetric(Base):
    """Aggregate metrics for activities"""

    __tablename__ = "activity_metrics"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    department: Mapped[str] = mapped_column(String(50), index=True)
    period: Mapped[str] = mapped_column(String(20), index=True)  # week, month, year

    # Counts by activity type
    total_activities: Mapped[int] = mapped_column(default=0)
    total_hours: Mapped[float] = mapped_column(default=0.0)
    gospel_shares: Mapped[int] = mapped_column(default=0)
    conversions: Mapped[int] = mapped_column(default=0)
    follow_ups: Mapped[int] = mapped_column(default=0)

    # Calculated metrics
    avg_impact_score: Mapped[float] = mapped_column(default=0.0)
    engagement_level: Mapped[str] = mapped_column(String(20), default="low")  # low, medium, high, excellent

    # Timestamps
    period_start: Mapped[datetime] = mapped_column(DateTime, index=True)
    period_end: Mapped[datetime] = mapped_column(DateTime, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user: Mapped["User"] = relationship("User", viewonly=True)

    # Indexes
    __table_args__ = (
        Index('ix_metrics_user_period', 'user_id', 'period_start'),
        Index('ix_metrics_department_period', 'department', 'period_start'),
    )

    def __repr__(self) -> str:
        return f"<ActivityMetric {self.user_id} {self.period}>"


class EngagementReport(Base):
    """Member engagement reports for coordinators"""

    __tablename__ = "engagement_reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    member_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    coordinator_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    department: Mapped[str] = mapped_column(String(50), index=True)

    # Report period
    period_start: Mapped[datetime] = mapped_column(DateTime, index=True)
    period_end: Mapped[datetime] = mapped_column(DateTime, index=True)

    # Metrics
    activity_count: Mapped[int] = mapped_column(default=0)
    total_hours: Mapped[float] = mapped_column(default=0.0)
    engagement_score: Mapped[int] = mapped_column(default=0)  # 0-100
    attendance_rate: Mapped[float] = mapped_column(default=0.0)  # 0-1

    # Feedback
    strengths: Mapped[str] = mapped_column(Text, nullable=True)
    areas_for_growth: Mapped[str] = mapped_column(Text, nullable=True)
    recommendations: Mapped[str] = mapped_column(Text, nullable=True)

    # Metadata
    created_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    member: Mapped["User"] = relationship("User", foreign_keys=[member_id], viewonly=True)
    coordinator: Mapped["User"] = relationship("User", foreign_keys=[coordinator_id], viewonly=True)

    def __repr__(self) -> str:
        return f"<EngagementReport {self.member_id} by {self.coordinator_id}>"
