"""
Authentication API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas.auth import (
    RegisterRequest,
    RegisterResponse,
    VerifyTokenRequest,
    SetPasswordRequest,
    LoginRequest,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
    TokenResponse,
    TokenVerificationResponse,
    MessageResponse,
    UserResponse
)
from services.auth_service import AuthService
from utils.dependencies import get_current_active_user
from models.user import User


router = APIRouter()


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: RegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user.
    Sends a verification email with a link to set password.
    """
    auth_service = AuthService(db)
    success, message, user = await auth_service.register_user(request.name, request.email)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=message
        )
    
    return RegisterResponse(
        message=message,
        email=request.email,
        success=True
    )


@router.post("/verify-token", response_model=TokenVerificationResponse)
async def verify_token(
    request: VerifyTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Verify a token from email link.
    Returns user info if token is valid.
    """
    auth_service = AuthService(db)
    valid, message, user = await auth_service.verify_token(request.token)
    
    return TokenVerificationResponse(
        valid=valid,
        user=UserResponse.model_validate(user) if user else None,
        message=message
    )


@router.post("/set-password", response_model=TokenResponse)
async def set_password(
    request: SetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Set password after email verification.
    Returns JWT tokens on success.
    """
    auth_service = AuthService(db)
    success, message, tokens = await auth_service.set_password(request.token, request.password)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    
    return TokenResponse(**tokens)


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Login with email and password.
    Returns JWT tokens on success.
    """
    auth_service = AuthService(db)
    success, message, tokens = await auth_service.login(request.email, request.password)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=message
        )
    
    return TokenResponse(**tokens)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Refresh access token using refresh token.
    """
    auth_service = AuthService(db)
    success, message, tokens = await auth_service.refresh_access_token(request.refresh_token)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=message
        )
    
    return TokenResponse(**tokens)


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    request: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Request password reset email.
    Always returns success to prevent email enumeration.
    """
    auth_service = AuthService(db)
    success, message = await auth_service.request_password_reset(request.email)
    
    return MessageResponse(message=message, success=success)


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    request: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Reset password using token from email.
    """
    auth_service = AuthService(db)
    success, message = await auth_service.reset_password(request.token, request.password)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    
    return MessageResponse(message=message, success=success)


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current authenticated user info.
    Requires valid JWT access token.
    """
    return UserResponse.model_validate(current_user)


@router.put("/change-password", response_model=MessageResponse)
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Change password for logged-in user.
    Requires current password verification.
    """
    auth_service = AuthService(db)
    success, message = await auth_service.change_password(
        current_user.id,
        request.current_password,
        request.new_password
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    
    return MessageResponse(message=message, success=success)

