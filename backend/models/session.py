"""
User session management models
Tracks active sessions, device info, and security events
"""

import uuid
from datetime import datetime, timedelta
from enum import Enum
from sqlalchemy import String, DateTime, ForeignKey, Index, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class SessionStatus(str, Enum):
    """Session status"""
    ACTIVE = "active"
    IDLE = "idle"
    EXPIRED = "expired"
    REVOKED = "revoked"


class DeviceType(str, Enum):
    """Device types"""
    WEB = "web"
    MOBILE = "mobile"
    DESKTOP = "desktop"
    TABLET = "tablet"
    UNKNOWN = "unknown"


class UserSession(Base):
    """Track user sessions"""

    __tablename__ = "user_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, index=True)

    # Session info
    status: Mapped[str] = mapped_column(String(20), default=SessionStatus.ACTIVE)
    device_type: Mapped[str] = mapped_column(String(20), default=DeviceType.WEB)
    device_name: Mapped[str] = mapped_column(String(255), nullable=True)
    browser: Mapped[str] = mapped_column(String(100), nullable=True)
    os: Mapped[str] = mapped_column(String(100), nullable=True)

    # IP and location
    ip_address: Mapped[str] = mapped_column(String(45), nullable=True)  # IPv6 support
    user_agent: Mapped[str] = mapped_column(Text, nullable=True)
    location: Mapped[str] = mapped_column(String(255), nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    last_activity: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, index=True)

    # Security
    is_trusted: Mapped[bool] = mapped_column(Boolean, default=False)
    mfa_verified: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    user: Mapped["User"] = relationship("User", viewonly=True)

    # Indexes
    __table_args__ = (
        Index('ix_sessions_user_status', 'user_id', 'status'),
        Index('ix_sessions_user_activity', 'user_id', 'last_activity'),
    )

    def is_expired(self) -> bool:
        """Check if session is expired"""
        return datetime.utcnow() > self.expires_at or self.status == SessionStatus.EXPIRED.value

    def __repr__(self) -> str:
        return f"<UserSession {self.user_id} on {self.device_name}>"


class SecurityEvent(Base):
    """Track security events (login, logout, suspicious activity)"""

    __tablename__ = "security_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    session_id: Mapped[str] = mapped_column(String(36), ForeignKey("user_sessions.id"), nullable=True)

    # Event info
    event_type: Mapped[str] = mapped_column(String(50), index=True)  # login, logout, failed_login, mfa_setup, etc
    severity: Mapped[str] = mapped_column(String(20))  # info, warning, critical
    message: Mapped[str] = mapped_column(Text)

    # Context
    ip_address: Mapped[str] = mapped_column(String(45), nullable=True)
    location: Mapped[str] = mapped_column(String(255), nullable=True)
    user_agent: Mapped[str] = mapped_column(Text, nullable=True)
    metadata: Mapped[str] = mapped_column(Text, nullable=True)  # JSON

    # Status
    is_suspicious: Mapped[bool] = mapped_column(Boolean, default=False)
    requires_review: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user: Mapped["User"] = relationship("User", viewonly=True)

    # Indexes
    __table_args__ = (
        Index('ix_events_user_type', 'user_id', 'event_type'),
        Index('ix_events_severity', 'severity', 'created_at'),
    )

    def __repr__(self) -> str:
        return f"<SecurityEvent {self.event_type} for {self.user_id}>"


class DeviceTrust(Base):
    """Track trusted devices for each user"""

    __tablename__ = "device_trust"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    device_fingerprint: Mapped[str] = mapped_column(String(255), unique=True, index=True)

    # Device info
    device_name: Mapped[str] = mapped_column(String(255))
    device_type: Mapped[str] = mapped_column(String(20))
    browser: Mapped[str] = mapped_column(String(100), nullable=True)
    os: Mapped[str] = mapped_column(String(100), nullable=True)

    # Trust settings
    is_trusted: Mapped[bool] = mapped_column(Boolean, default=True)
    last_used: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Trust expiration
    trust_expires_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.utcnow() + timedelta(days=90)
    )

    # Relationships
    user: Mapped["User"] = relationship("User", viewonly=True)

    def is_trust_valid(self) -> bool:
        """Check if trust is still valid"""
        return datetime.utcnow() < self.trust_expires_at and self.is_trusted

    def __repr__(self) -> str:
        return f"<DeviceTrust {self.user_id} on {self.device_name}>"
