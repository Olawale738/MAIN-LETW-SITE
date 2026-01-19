"""
Pydantic schemas for authentication endpoints.
"""

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional

from models.user import UserStatus, UserRole


# ============= Request Schemas =============

class RegisterRequest(BaseModel):
    """Request schema for user registration."""
    name: str = Field(..., min_length=2, max_length=255, description="User's full name")
    email: EmailStr = Field(..., description="User's email address")


class VerifyTokenRequest(BaseModel):
    """Request schema for token verification."""
    token: str = Field(..., min_length=10, description="Verification token from email")


class SetPasswordRequest(BaseModel):
    """Request schema for setting password after email verification."""
    token: str = Field(..., min_length=10, description="Verification token from email")
    password: str = Field(..., min_length=8, max_length=128, description="New password")


class LoginRequest(BaseModel):
    """Request schema for user login."""
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., min_length=1, description="User's password")


class RefreshTokenRequest(BaseModel):
    """Request schema for refreshing access token."""
    refresh_token: str = Field(..., description="Refresh token")


class ForgotPasswordRequest(BaseModel):
    """Request schema for forgot password."""
    email: EmailStr = Field(..., description="User's email address")


class ResetPasswordRequest(BaseModel):
    """Request schema for resetting password."""
    token: str = Field(..., min_length=10, description="Password reset token from email")
    password: str = Field(..., min_length=8, max_length=128, description="New password")


class ChangePasswordRequest(BaseModel):
    """Request schema for changing password (logged-in user)."""
    current_password: str = Field(..., min_length=1, description="Current password")
    new_password: str = Field(..., min_length=8, max_length=128, description="New password")


class UpdateProfileRequest(BaseModel):
    """Request schema for updating user profile."""
    name: str = Field(..., min_length=2, max_length=255, description="User's full name")


class UpdateServicesRequest(BaseModel):
    """Request schema for updating user services."""
    services: list[str] = Field(..., description="List of selected services")


# ============= Response Schemas =============

class UserResponse(BaseModel):
    """Response schema for user data."""
    id: str
    name: str
    email: str
    status: UserStatus
    role: UserRole
    services: list[str] = []
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Response schema for JWT tokens."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # Seconds until access token expires


class TokenVerificationResponse(BaseModel):
    """Response schema for token verification."""
    valid: bool
    user: Optional[UserResponse] = None
    message: str


class MessageResponse(BaseModel):
    """Generic message response."""
    message: str
    success: bool = True


class RegisterResponse(BaseModel):
    """Response schema for registration."""
    message: str
    email: str
    success: bool = True
