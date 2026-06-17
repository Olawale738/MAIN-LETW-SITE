"""
Site Branding API — admin upload + public read for the site logo and favicon.

GET  /api/site-branding            -> { logo_url, favicon_url, updated_at }   (public)
POST /api/site-branding/logo       -> upload new logo     (admin, multipart "file")
POST /api/site-branding/favicon    -> upload new favicon  (admin, multipart "file")
DELETE /api/site-branding/logo     -> clear logo override (admin)
DELETE /api/site-branding/favicon  -> clear favicon override (admin)

Files are saved under uploads/branding/. Single row keyed on id=1.
"""

import os
import time
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models.user import User
from models.site_branding import SiteBranding
from utils.dependencies import get_admin_user


router = APIRouter(prefix="/api/site-branding", tags=["Site Branding"])

BRANDING_DIR = "uploads/branding"
os.makedirs(BRANDING_DIR, exist_ok=True)

ALLOWED_LOGO_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"}
ALLOWED_FAVICON_TYPES = {"image/png", "image/x-icon", "image/vnd.microsoft.icon", "image/svg+xml", "image/jpeg"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def _ext_for(content_type: str, fallback: str = ".png") -> str:
    mapping = {
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/webp": ".webp",
        "image/svg+xml": ".svg",
        "image/x-icon": ".ico",
        "image/vnd.microsoft.icon": ".ico",
    }
    return mapping.get(content_type, fallback)


async def _get_or_create_row(db: AsyncSession) -> SiteBranding:
    res = await db.execute(select(SiteBranding).where(SiteBranding.id == 1))
    row = res.scalar_one_or_none()
    if row is None:
        row = SiteBranding(id=1)
        db.add(row)
        await db.flush()
    return row


def _public_url(path: str | None) -> str | None:
    if not path:
        return None
    # path stored relative to uploads dir, e.g. "branding/logo-1718642820.png"
    # cache-bust via mtime so browsers pick up new uploads immediately
    abs_path = os.path.join("uploads", path)
    try:
        mtime = int(os.path.getmtime(abs_path))
    except OSError:
        mtime = int(time.time())
    return f"/uploads/{path}?v={mtime}"


@router.get("")
async def get_branding(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(SiteBranding).where(SiteBranding.id == 1))
    row = res.scalar_one_or_none()
    if row is None:
        return {"logo_url": None, "favicon_url": None, "updated_at": None}
    return {
        "logo_url": _public_url(row.logo_path),
        "favicon_url": _public_url(row.favicon_path),
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


async def _save_upload(file: UploadFile, kind: str, allowed_types: set[str]) -> str:
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {file.content_type}. Allowed: {', '.join(sorted(allowed_types))}",
        )
    data = await file.read()
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Max {MAX_FILE_SIZE // (1024*1024)}MB.",
        )
    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file.")

    ext = _ext_for(file.content_type)
    fname = f"{kind}-{int(time.time())}{ext}"
    rel_path = f"branding/{fname}"
    abs_path = os.path.join("uploads", rel_path)
    os.makedirs(os.path.dirname(abs_path), exist_ok=True)
    with open(abs_path, "wb") as f:
        f.write(data)
    return rel_path


def _remove_file(rel_path: str | None) -> None:
    if not rel_path:
        return
    abs_path = os.path.join("uploads", rel_path)
    try:
        if os.path.exists(abs_path):
            os.remove(abs_path)
    except OSError:
        pass


@router.post("/logo")
async def upload_logo(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    row = await _get_or_create_row(db)
    old = row.logo_path
    row.logo_path = await _save_upload(file, "logo", ALLOWED_LOGO_TYPES)
    await db.commit()
    if old and old != row.logo_path:
        _remove_file(old)
    return {"logo_url": _public_url(row.logo_path)}


@router.post("/favicon")
async def upload_favicon(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    row = await _get_or_create_row(db)
    old = row.favicon_path
    row.favicon_path = await _save_upload(file, "favicon", ALLOWED_FAVICON_TYPES)
    await db.commit()
    if old and old != row.favicon_path:
        _remove_file(old)
    return {"favicon_url": _public_url(row.favicon_path)}


@router.delete("/logo")
async def clear_logo(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    row = await _get_or_create_row(db)
    old = row.logo_path
    row.logo_path = None
    await db.commit()
    _remove_file(old)
    return {"logo_url": None}


@router.delete("/favicon")
async def clear_favicon(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    row = await _get_or_create_row(db)
    old = row.favicon_path
    row.favicon_path = None
    await db.commit()
    _remove_file(old)
    return {"favicon_url": None}
