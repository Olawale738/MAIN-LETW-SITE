"""
2FA (TOTP) — admins/moderators enable a one-time-password second factor.

Flow:
  POST /api/2fa/setup       -> returns secret + otpauth URI + QR PNG (base64)
  POST /api/2fa/verify      -> {code}; marks is_verified=true on success
  POST /api/2fa/verify-code -> {code}; checks current TOTP (used by login)
  POST /api/2fa/disable     -> {code}; removes the secret
  GET  /api/2fa/status      -> {enabled, verified}
"""

import base64
import hashlib
import secrets
import io
from datetime import datetime
from typing import Optional

import pyotp
import qrcode

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from models.two_factor import TwoFactorSecret
from utils.dependencies import get_current_active_user


router = APIRouter(prefix="/api/2fa", tags=["Two-Factor Auth"])


@router.get("/status")
async def status(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    res = await db.execute(select(TwoFactorSecret).where(TwoFactorSecret.user_id == user.id))
    t = res.scalar_one_or_none()
    return {
        "enabled": bool(t),
        "verified": bool(t and t.is_verified),
        "last_used_at": t.last_used_at if t else None,
    }


@router.post("/setup")
async def setup(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    """Generate a new TOTP secret + QR code. If user already has one, rotate it."""
    secret = pyotp.random_base32()
    issuer = "LETW Admin"
    label = user.email
    uri = pyotp.totp.TOTP(secret).provisioning_uri(name=label, issuer_name=issuer)

    res = await db.execute(select(TwoFactorSecret).where(TwoFactorSecret.user_id == user.id))
    t = res.scalar_one_or_none()
    if t:
        t.secret = secret
        t.is_verified = False
        t.recovery_codes_hash = None
        t.enabled_at = None
    else:
        t = TwoFactorSecret(user_id=user.id, secret=secret, is_verified=False)
        db.add(t)
    await db.commit()

    # Render QR as PNG → base64 data URI for inline display
    img = qrcode.make(uri)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    qr_b64 = base64.b64encode(buf.getvalue()).decode()
    return {
        "secret": secret,
        "otpauth_uri": uri,
        "qr_png_base64": f"data:image/png;base64,{qr_b64}",
    }


class CodeIn(BaseModel):
    code: str


def _gen_recovery_codes(n: int = 8) -> tuple[list[str], str]:
    """Return (plaintext_codes, joined_sha256_hashes_for_storage)."""
    codes = [f"{secrets.randbelow(10**4):04d}-{secrets.randbelow(10**4):04d}" for _ in range(n)]
    hashes = " ".join(hashlib.sha256(c.encode()).hexdigest() for c in codes)
    return codes, hashes


@router.post("/verify")
async def verify_setup(
    body: CodeIn,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    res = await db.execute(select(TwoFactorSecret).where(TwoFactorSecret.user_id == user.id))
    t = res.scalar_one_or_none()
    if not t:
        raise HTTPException(404, "No 2FA secret. Call /setup first.")
    if not pyotp.TOTP(t.secret).verify(body.code, valid_window=1):
        raise HTTPException(400, "Invalid code. Try the next one.")
    t.is_verified = True
    t.enabled_at = t.enabled_at or datetime.utcnow()
    t.last_used_at = datetime.utcnow()
    codes, hashes = _gen_recovery_codes()
    t.recovery_codes_hash = hashes
    await db.commit()
    return {"verified": True, "recovery_codes": codes, "message": "Save these recovery codes somewhere safe. Each can be used once if you lose your phone."}


@router.post("/verify-code")
async def verify_code(
    body: CodeIn,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    """Check a TOTP or recovery code (used during login)."""
    res = await db.execute(select(TwoFactorSecret).where(TwoFactorSecret.user_id == user.id))
    t = res.scalar_one_or_none()
    if not t or not t.is_verified:
        return {"valid": True, "note": "2FA not enabled for this user"}
    if pyotp.TOTP(t.secret).verify(body.code, valid_window=1):
        t.last_used_at = datetime.utcnow()
        await db.commit()
        return {"valid": True}
    # Try recovery codes
    if t.recovery_codes_hash:
        hashed = hashlib.sha256(body.code.encode()).hexdigest()
        codes = t.recovery_codes_hash.split()
        if hashed in codes:
            codes.remove(hashed)
            t.recovery_codes_hash = " ".join(codes)
            t.last_used_at = datetime.utcnow()
            await db.commit()
            return {"valid": True, "recovery_used": True, "remaining_codes": len(codes)}
    raise HTTPException(400, "Invalid 2FA code")


@router.post("/disable")
async def disable(
    body: CodeIn,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    res = await db.execute(select(TwoFactorSecret).where(TwoFactorSecret.user_id == user.id))
    t = res.scalar_one_or_none()
    if not t:
        return {"disabled": False}
    if t.is_verified and not pyotp.TOTP(t.secret).verify(body.code, valid_window=1):
        raise HTTPException(400, "Invalid code. Cannot disable without a valid TOTP.")
    await db.delete(t)
    await db.commit()
    return {"disabled": True}
