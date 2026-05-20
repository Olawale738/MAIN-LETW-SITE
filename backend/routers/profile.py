"""
Extended user profile endpoints for the registered-user dashboard.

These supplement the existing /api/users/me endpoint by exposing the
new profile fields (avatar, bio, phone, location) and a secure
password-change endpoint.
"""

import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models.user import User
from schemas.profile import ProfileResponse, ProfileUpdate, PasswordChangeRequest
from schemas.auth import MessageResponse
from utils.dependencies import get_current_active_user
from utils.security import verify_password, hash_password


router = APIRouter(prefix="/api/profile", tags=["Profile"])

AVATAR_DIR = Path("uploads/avatars")
AVATAR_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"}


def _serialize(user: User) -> ProfileResponse:
    return ProfileResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role.value if hasattr(user.role, "value") else str(user.role),
        status=user.status.value if hasattr(user.status, "value") else str(user.status),
        avatar_url=user.avatar_url,
        bio=user.bio,
        phone=user.phone,
        location=user.location,
        services=list(user.services or []),
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


@router.get("/me", response_model=ProfileResponse)
async def get_profile(current_user: User = Depends(get_current_active_user)):
    return _serialize(current_user)


@router.put("/me", response_model=ProfileResponse)
async def update_profile(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    for field in ("name", "bio", "phone", "location", "avatar_url"):
        val = getattr(payload, field)
        if val is not None:
            setattr(current_user, field, val.strip() if isinstance(val, str) else val)
    await db.commit()
    await db.refresh(current_user)
    return _serialize(current_user)


@router.post("/me/avatar", response_model=ProfileResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported image format")

    ext = os.path.splitext(file.filename or "")[1].lower() or ".png"
    safe_ext = ext if ext in {".png", ".jpg", ".jpeg", ".webp", ".gif"} else ".png"
    fname = f"{current_user.id}-{uuid.uuid4().hex}{safe_ext}"
    target = AVATAR_DIR / fname

    contents = await file.read()
    # 5 MB max
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")
    target.write_bytes(contents)

    current_user.avatar_url = f"/uploads/avatars/{fname}"
    await db.commit()
    await db.refresh(current_user)
    return _serialize(current_user)


@router.post("/me/password", response_model=MessageResponse)
async def change_password(
    payload: PasswordChangeRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.password_hash or not verify_password(
        payload.current_password, current_user.password_hash
    ):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.password_hash = hash_password(payload.new_password)
    await db.commit()
    return MessageResponse(message="Password updated")
