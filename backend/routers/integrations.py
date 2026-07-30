"""
Partner-system integrations (server-to-server).

Currently: sharepoints.letw.org looks up a completed marriage-prep couple by its
training-certificate number to issue the marriage certificate. Authenticated
with a shared secret in the `X-API-Key` header (constant-time compared to
settings.SHAREPOINTS_API_KEY). This is a machine-to-machine handshake — the key
must live on the partner's SERVER, never in a browser.
"""

import hmac
import secrets

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import get_db
from models.marriage_prep import MarriagePrepCouple
from models.integration import IntegrationSettings
from models.user import User
from utils.dependencies import get_admin_user

router = APIRouter(prefix="/api/integrations", tags=["Integrations"])


async def _effective_key(db: AsyncSession) -> str:
    """The active shared secret: admin-set (DB) value wins, else the env var."""
    row = (await db.execute(select(IntegrationSettings).where(IntegrationSettings.id == "default"))).scalar_one_or_none()
    if row and (row.sharepoints_api_key or "").strip():
        return row.sharepoints_api_key.strip()
    return (settings.SHAREPOINTS_API_KEY or "").strip()


# ── Admin: manage the shared secret from the dashboard ──────────────────────

class KeyIn(BaseModel):
    sharepoints_api_key: str


@router.get("/admin/settings")
async def get_settings(db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    key = await _effective_key(db)
    return {
        "configured": bool(key),
        # Masked preview only — never return the full secret.
        "key_preview": (key[:4] + "…" + key[-4:]) if len(key) >= 10 else ("•" * len(key)),
        "lookup_url": "https://letw-backend.onrender.com/api/integrations/marriage/couple",
    }


@router.put("/admin/settings")
async def set_settings(body: KeyIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    key = (body.sharepoints_api_key or "").strip()
    if len(key) < 12:
        raise HTTPException(400, "Use a longer secret (at least 12 characters).")
    row = (await db.execute(select(IntegrationSettings).where(IntegrationSettings.id == "default"))).scalar_one_or_none()
    if not row:
        row = IntegrationSettings(id="default")
        db.add(row)
    row.sharepoints_api_key = key
    await db.commit()
    return {"ok": True}


@router.post("/admin/settings/generate")
async def generate_key(db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    """Generate a strong random secret, save it, and return it ONCE so the admin
    can paste it into the sharepoints side."""
    key = "letwshp_" + secrets.token_urlsafe(32)
    row = (await db.execute(select(IntegrationSettings).where(IntegrationSettings.id == "default"))).scalar_one_or_none()
    if not row:
        row = IntegrationSettings(id="default")
        db.add(row)
    row.sharepoints_api_key = key
    await db.commit()
    return {"sharepoints_api_key": key}


@router.get("/marriage/couple")
async def lookup_couple_by_cert(
    cert_no: str,
    x_api_key: str = Header(default=""),
    db: AsyncSession = Depends(get_db),
):
    expected = await _effective_key(db)
    if not expected:
        raise HTTPException(503, "Partner integration is not configured yet.")
    if not x_api_key or not hmac.compare_digest(x_api_key.strip(), expected):
        raise HTTPException(401, "Invalid or missing X-API-Key.")
    """Return a completed couple's verified training details for the given
    training-certificate number, so the partner can issue the marriage
    certificate. Only signed-off (completed) couples resolve."""
    ref = (cert_no or "").strip().upper()
    if not ref:
        raise HTTPException(400, "cert_no is required.")
    c = (await db.execute(
        select(MarriagePrepCouple).where(MarriagePrepCouple.certificate_number == ref)
    )).scalar_one_or_none()
    if not c or not c.pastor_signed_off:
        # Do not leak which of the two conditions failed.
        raise HTTPException(404, "No completed training certificate matches that number.")
    # Recompute the tamper-evident fingerprint so the partner can cross-check
    # against the training certificate the couple presents.
    from routers.marriage_prep import _cert_signature, _fingerprint
    sig = _cert_signature(c)
    return {
        "training_verified": True,
        "certificate_number": c.certificate_number,
        "couple_id": c.id,
        "partner_a_name": c.partner_a_name,
        "partner_b_name": c.partner_b_name,
        "partner_a_email": c.partner_a_email,
        "partner_b_email": c.partner_b_email,
        "intended_wedding_date": c.intended_wedding_date.isoformat() if c.intended_wedding_date else None,
        "completed_at": c.pastor_signed_at.isoformat() if c.pastor_signed_at else None,
        "pastor_signature": c.pastor_signature,
        "fingerprint": _fingerprint(sig),
        "issuer": "letw.org",
    }
