"""
Partner-system integrations (server-to-server).

Currently: sharepoints.letw.org looks up a completed marriage-prep couple by its
training-certificate number to issue the marriage certificate. Authenticated
with a shared secret in the `X-API-Key` header (constant-time compared to
settings.SHAREPOINTS_API_KEY). This is a machine-to-machine handshake — the key
must live on the partner's SERVER, never in a browser.
"""

import hmac

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import get_db
from models.marriage_prep import MarriagePrepCouple

router = APIRouter(prefix="/api/integrations", tags=["Integrations"])


def _require_partner_key(x_api_key: str = Header(default="")) -> None:
    expected = (settings.SHAREPOINTS_API_KEY or "").strip()
    if not expected:
        raise HTTPException(503, "Partner integration is not configured on this server.")
    if not x_api_key or not hmac.compare_digest(x_api_key.strip(), expected):
        raise HTTPException(401, "Invalid or missing X-API-Key.")


@router.get("/marriage/couple")
async def lookup_couple_by_cert(
    cert_no: str,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(_require_partner_key),
):
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
