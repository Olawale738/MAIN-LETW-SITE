"""
TwoFactorSecret — TOTP shared secret per user.
Only admins and moderators are required to enable; others are optional.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column
from database import Base
import uuid


class TwoFactorSecret(Base):
    __tablename__ = "two_factor_secrets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    secret: Mapped[str] = mapped_column(String(64), nullable=False)   # base32 TOTP secret
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    recovery_codes_hash: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # space-joined sha256s
    enabled_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_used_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
