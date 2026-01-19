"""
Authentication service with business logic for user registration, 
verification, login, and password management.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models.user import User, UserStatus
from models.verification_token import VerificationToken, TokenType
from utils.security import (
    hash_password,
    verify_password,
    generate_verification_token,
    create_tokens,
    decode_token
)
from services.email_service import send_verification_email, send_password_reset_email


class AuthService:
    """Service class for authentication operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email address."""
        result = await self.db.execute(
            select(User).where(User.email == email.lower())
        )
        return result.scalar_one_or_none()
    
    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID."""
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()
    
    async def register_user(self, name: str, email: str) -> tuple[bool, str, Optional[User]]:
        """
        Register a new user and send verification email.
        
        Returns: (success, message, user)
        """
        email = email.lower().strip()
        name = name.strip()
        
        # Check if user already exists
        existing_user = await self.get_user_by_email(email)
        if existing_user:
            if existing_user.status == UserStatus.PENDING:
                # Resend verification email
                token = await self._create_verification_token(
                    existing_user.id, 
                    TokenType.EMAIL_VERIFICATION
                )
                await send_verification_email(email, name, token)
                return True, "Verification email resent. Please check your inbox.", existing_user
            else:
                return False, "An account with this email already exists.", None
        
        # Create new user
        user = User(
            name=name,
            email=email,
            status=UserStatus.PENDING
        )
        
        self.db.add(user)
        await self.db.flush()  # Get the user ID
        
        # Create verification token
        token = await self._create_verification_token(
            user.id, 
            TokenType.EMAIL_VERIFICATION
        )
        
        # Send verification email
        await send_verification_email(email, name, token)
        
        await self.db.commit()
        
        return True, "Registration successful! Please check your email to complete setup.", user
    
    async def verify_token(self, token: str) -> tuple[bool, str, Optional[User]]:
        """
        Verify a token and return the associated user.
        
        Returns: (valid, message, user)
        """
        result = await self.db.execute(
            select(VerificationToken).where(VerificationToken.token == token)
        )
        verification_token = result.scalar_one_or_none()
        
        if not verification_token:
            return False, "Invalid or expired token.", None
        
        # Check expiration
        if datetime.now(timezone.utc) > verification_token.expires_at.replace(tzinfo=timezone.utc):
            # Delete expired token
            await self.db.delete(verification_token)
            await self.db.commit()
            return False, "Token has expired. Please request a new one.", None
        
        # Get user
        user = await self.get_user_by_id(verification_token.user_id)
        if not user:
            return False, "User not found.", None
        
        return True, "Token is valid.", user
    
    async def set_password(self, token: str, password: str) -> tuple[bool, str, Optional[dict]]:
        """
        Set user password after email verification.
        
        Returns: (success, message, tokens)
        """
        valid, message, user = await self.verify_token(token)
        if not valid or not user:
            return False, message, None
        
        # Hash and set password
        user.password_hash = hash_password(password)
        user.status = UserStatus.ACTIVE
        
        # Delete the verification token
        result = await self.db.execute(
            select(VerificationToken).where(VerificationToken.token == token)
        )
        verification_token = result.scalar_one_or_none()
        if verification_token:
            await self.db.delete(verification_token)
        
        await self.db.commit()
        
        # Generate JWT tokens
        tokens = create_tokens(user.id, user.email)
        
        return True, "Password set successfully. You are now logged in.", tokens
    
    async def login(self, email: str, password: str) -> tuple[bool, str, Optional[dict]]:
        """
        Authenticate user with email and password.
        
        Returns: (success, message, tokens)
        """
        email = email.lower().strip()
        
        user = await self.get_user_by_email(email)
        
        if not user:
            return False, "Invalid email or password.", None
        
        if user.status == UserStatus.PENDING:
            return False, "Please complete email verification first.", None
        
        if user.status == UserStatus.SUSPENDED:
            return False, "Your account has been suspended.", None
        
        if not user.password_hash:
            return False, "Please complete email verification and set your password.", None
        
        if not verify_password(password, user.password_hash):
            return False, "Invalid email or password.", None
        
        # Generate JWT tokens
        tokens = create_tokens(user.id, user.email)
        
        return True, "Login successful.", tokens
    
    async def refresh_access_token(self, refresh_token: str) -> tuple[bool, str, Optional[dict]]:
        """
        Refresh the access token using a refresh token.
        
        Returns: (success, message, tokens)
        """
        payload = decode_token(refresh_token)
        
        if not payload:
            return False, "Invalid refresh token.", None
        
        if payload.get("type") != "refresh":
            return False, "Invalid token type.", None
        
        user_id = payload.get("sub")
        if not user_id:
            return False, "Invalid token payload.", None
        
        user = await self.get_user_by_id(user_id)
        if not user:
            return False, "User not found.", None
        
        if user.status != UserStatus.ACTIVE:
            return False, "Account is not active.", None
        
        # Generate new tokens
        tokens = create_tokens(user.id, user.email)
        
        return True, "Token refreshed successfully.", tokens
    
    async def request_password_reset(self, email: str) -> tuple[bool, str]:
        """
        Request password reset email.
        
        Returns: (success, message)
        """
        email = email.lower().strip()
        user = await self.get_user_by_email(email)
        
        # Always return success to prevent email enumeration
        if not user:
            return True, "If an account exists with this email, you will receive a password reset link."
        
        if user.status == UserStatus.SUSPENDED:
            return True, "If an account exists with this email, you will receive a password reset link."
        
        # Create password reset token
        token = await self._create_verification_token(
            user.id,
            TokenType.PASSWORD_RESET,
            expires_hours=1  # Password reset tokens expire in 1 hour
        )
        
        # Send password reset email
        await send_password_reset_email(user.email, user.name, token)
        
        await self.db.commit()
        
        return True, "If an account exists with this email, you will receive a password reset link."
    
    async def reset_password(self, token: str, password: str) -> tuple[bool, str]:
        """
        Reset password using a reset token.
        
        Returns: (success, message)
        """
        valid, message, user = await self.verify_token(token)
        if not valid or not user:
            return False, message
        
        # Verify it's a password reset token
        result = await self.db.execute(
            select(VerificationToken).where(VerificationToken.token == token)
        )
        verification_token = result.scalar_one_or_none()
        
        if not verification_token or verification_token.token_type != TokenType.PASSWORD_RESET:
            return False, "Invalid password reset token."
        
        # Update password
        user.password_hash = hash_password(password)
        
        # Delete the token
        await self.db.delete(verification_token)
        
        await self.db.commit()
        
        return True, "Password reset successfully. You can now log in with your new password."
    
    async def _create_verification_token(
        self, 
        user_id: str, 
        token_type: TokenType,
        expires_hours: int = 24
    ) -> str:
        """Create a new verification token."""
        # Delete any existing tokens of the same type for this user
        result = await self.db.execute(
            select(VerificationToken).where(
                VerificationToken.user_id == user_id,
                VerificationToken.token_type == token_type
            )
        )
        existing_tokens = result.scalars().all()
        for existing_token in existing_tokens:
            await self.db.delete(existing_token)
        
        # Create new token
        token = generate_verification_token()
        verification_token = VerificationToken(
            user_id=user_id,
            token=token,
            token_type=token_type,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=expires_hours)
        )
        
        self.db.add(verification_token)
        await self.db.flush()
        
        return token

    async def change_password(
        self, 
        user_id: str, 
        current_password: str, 
        new_password: str
    ) -> tuple[bool, str]:
        """
        Change password for a logged-in user.
        
        Returns: (success, message)
        """
        user = await self.get_user_by_id(user_id)
        if not user:
            return False, "User not found."
        
        if user.status != UserStatus.ACTIVE:
            return False, "Account is not active."
        
        if not user.password_hash:
            return False, "Please complete email verification first."
        
        # Verify current password
        if not verify_password(current_password, user.password_hash):
            return False, "Current password is incorrect."
        
        # Set new password
        user.password_hash = hash_password(new_password)
        await self.db.commit()
        
        return True, "Password changed successfully."

