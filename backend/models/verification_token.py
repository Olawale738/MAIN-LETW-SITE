"""
Verification Token database model.
Used for email verification and password reset.
"""

import uuid
import enum
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from database import Base


class TokenType(str, enum.Enum):
    """Type of verification token."""
    EMAIL_VERIFICATION = "email_verification"
    PASSWORD_RESET = "password_reset"


class VerificationToken(Base):
    """Token for email verification and password reset."""
    
    __tablename__ = "verification_tokens"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    
    token: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )
    
    token_type: Mapped[TokenType] = mapped_column(
        SQLEnum(TokenType),
        nullable=False
    )
    
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    
    # Relationship to user
    user: Mapped["User"] = relationship("User", back_populates="verification_tokens")
    
    def __repr__(self) -> str:
        return f"<VerificationToken {self.token_type.value} for user {self.user_id}>"
    
    @property
    def is_expired(self) -> bool:
        """Check if token has expired."""
        return datetime.now(self.expires_at.tzinfo) > self.expires_at
