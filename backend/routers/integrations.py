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
from typing import Optional

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


async def _settings_row(db: AsyncSession):
    return (await db.execute(select(IntegrationSettings).where(IntegrationSettings.id == "default"))).scalar_one_or_none()


async def _effective_key(db: AsyncSession) -> str:
    """The active shared secret: admin-set (DB) value wins, else the env var."""
    row = await _settings_row(db)
    if row and (row.sharepoints_api_key or "").strip():
        return row.sharepoints_api_key.strip()
    return (settings.SHAREPOINTS_API_KEY or "").strip()


BACKEND_QR_BASE = "https://letw-backend.onrender.com/api"


def _couple_payload(c, seal_url: str | None = None) -> dict:
    """The completed-couple record sent to the partner (same shape as the lookup).
    Carries the cryptographic verify URL + QR so the marriage certificate issued
    by sharepoints is verifiable at letw.org, plus the admin seal and the LETW
    logo for the certificate design."""
    from routers.marriage_prep import _cert_signature, _fingerprint, _short_sig, _public_base
    sig = _cert_signature(c)
    base = _public_base()
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
        "couple_photo": getattr(c, "photo_url", None),
        # Marriage-certificate details captured on letw.org (incl. witnesses).
        "marriage_date": c.marriage_date.isoformat() if getattr(c, "marriage_date", None) else None,
        "marriage_venue": getattr(c, "marriage_venue", None),
        "officiant": getattr(c, "officiant_name", None),
        "witness_1": getattr(c, "witness_1", None),
        "witness_2": getattr(c, "witness_2", None),
        "fingerprint": _fingerprint(sig),
        # Cryptographic verification (anchored on letw.org) — both platforms can
        # verify the certificate number via this URL / QR.
        "verify_url": f"{base}/verify/cert/{c.id}?sig={_short_sig(sig)}",
        "qr_svg_url": f"{BACKEND_QR_BASE}/marriage-prep/certificate/{c.id}/qr.svg",
        "logo_url": f"{base}/NewLETWlogo.png",
        "seal_url": seal_url,
        "issuer": "letw.org",
    }


async def push_marriage_completion(db: AsyncSession, c) -> None:
    """On pastor sign-off, hand the completed couple to the partner system:
    a webhook POST to sharepoints (if a URL is set) and an email to the marriage
    office (if set) with a one-click generate link. Best-effort — never blocks
    sign-off."""
    row = await _settings_row(db)
    if not row:
        return
    key = await _effective_key(db)
    payload = _couple_payload(c, (row.marriage_seal_url or None) if row else None)
    cert_no = c.certificate_number or ""
    generate_url = f"https://sharepoints.letw.org/marriage-certificate?cert={cert_no}"

    # 1) Webhook push (server-to-server) so sharepoints can auto-ingest.
    if (row.sharepoints_webhook_url or "").strip():
        try:
            import httpx
            async with httpx.AsyncClient(timeout=15) as cli:
                await cli.post(row.sharepoints_webhook_url.strip(), json=payload,
                               headers={"X-API-Key": key} if key else {})
        except Exception as e:
            print(f"[integrations] sharepoints webhook push failed: {type(e).__name__}: {e}", flush=True)

    # 2) Email the marriage-certificate office with the couple + generate link.
    if (row.marriage_office_email or "").strip():
        try:
            from services.email_service import send_email
            html = (
                '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">'
                '<h2 style="color:#140152">Couple ready for a marriage certificate</h2>'
                f'<p><strong>{c.partner_a_name} &amp; {c.partner_b_name}</strong> have completed marriage '
                f'preparation and been signed off.</p>'
                f'<p><strong>Training certificate:</strong> {cert_no}<br>'
                f'<strong>Intended wedding:</strong> {c.intended_wedding_date.strftime("%B %d, %Y") if c.intended_wedding_date else "—"}</p>'
                f'<p style="margin-top:18px"><a href="{generate_url}" '
                'style="background:#140152;color:#fff;text-decoration:none;font-weight:bold;padding:11px 20px;border-radius:999px">'
                'Generate marriage certificate</a></p>'
                '<p style="font-size:12px;color:#6b7280">Light Encounter Tabernacle Worldwide</p></div>'
            )
            await send_email(row.marriage_office_email.strip(), f"Marriage certificate ready — {c.partner_a_name} & {c.partner_b_name}", html)
        except Exception as e:
            print(f"[integrations] marriage-office email failed: {type(e).__name__}: {e}", flush=True)


# ── Admin: manage the shared secret from the dashboard ──────────────────────

class KeyIn(BaseModel):
    sharepoints_api_key: Optional[str] = None
    sharepoints_webhook_url: Optional[str] = None
    marriage_office_email: Optional[str] = None
    baptism_webhook_url: Optional[str] = None
    baptism_office_email: Optional[str] = None
    marriage_seal_url: Optional[str] = None
    # Theology School → sharepoints student/enrollment intake
    student_webhook_url: Optional[str] = None
    # Classroom (live.letw.org)
    lms_base_url: Optional[str] = None
    lms_api_key: Optional[str] = None
    lms_api_key_alt: Optional[str] = None
    integration_signing_secret: Optional[str] = None
    lms_enrol_path: Optional[str] = None
    lms_students_path: Optional[str] = None


@router.get("/admin/settings")
async def get_settings(db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    key = await _effective_key(db)
    row = await _settings_row(db)
    return {
        "configured": bool(key),
        # Masked preview only — never return the full secret.
        "key_preview": (key[:4] + "…" + key[-4:]) if len(key) >= 10 else ("•" * len(key)),
        "lookup_url": "https://letw-backend.onrender.com/api/integrations/marriage/couple",
        "sharepoints_webhook_url": (row.sharepoints_webhook_url if row else None) or "",
        "marriage_office_email": (row.marriage_office_email if row else None) or "",
        "baptism_webhook_url": (row.baptism_webhook_url if row else None) or "",
        "baptism_office_email": (row.baptism_office_email if row else None) or "",
        "marriage_seal_url": (row.marriage_seal_url if row else None) or "",
        "student_webhook_url": (row.student_webhook_url if row else None) or "",
        "lms_base_url": (row.lms_base_url if row else None) or "",
        "lms_students_path": (getattr(row, "lms_students_path", None) or "") if row else "",
        "lms_enrol_path": (row.lms_enrol_path if row else None) or "",
        "signing_secret_set": bool((getattr(row, "integration_signing_secret", None) or "").strip()) if row else False,
        "lms_key_alt_set": bool((row.lms_api_key_alt if row else "") or ""),
        "lms_key_set": bool((getattr(row, "lms_api_key", None) or "").strip()) if row else False,
        "theology_intake_default": "https://sharepoints.letw.org/api/integrations/theology/enrollments",
        "handshake_url": "https://sharepoints.letw.org/api/letw/handshake",
    }


@router.put("/admin/settings")
async def set_settings(body: KeyIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    row = await _settings_row(db)
    if not row:
        row = IntegrationSettings(id="default")
        db.add(row)
    # Only update the key when a real (non-masked, long-enough) value is sent.
    if body.sharepoints_api_key is not None:
        key = body.sharepoints_api_key.strip()
        if key and "…" not in key:
            if len(key) < 12:
                raise HTTPException(400, "Use a longer secret (at least 12 characters).")
            row.sharepoints_api_key = key
    if body.sharepoints_webhook_url is not None:
        row.sharepoints_webhook_url = body.sharepoints_webhook_url.strip() or None
    if body.marriage_office_email is not None:
        row.marriage_office_email = body.marriage_office_email.strip() or None
    if body.baptism_webhook_url is not None:
        row.baptism_webhook_url = body.baptism_webhook_url.strip() or None
    if body.baptism_office_email is not None:
        row.baptism_office_email = body.baptism_office_email.strip() or None
    if body.marriage_seal_url is not None:
        row.marriage_seal_url = body.marriage_seal_url.strip() or None
    if body.student_webhook_url is not None:
        row.student_webhook_url = body.student_webhook_url.strip() or None
    if body.lms_base_url is not None:
        row.lms_base_url = body.lms_base_url.strip() or None
    if body.lms_enrol_path is not None:
        row.lms_enrol_path = body.lms_enrol_path.strip() or None
    if body.lms_students_path is not None:
        row.lms_students_path = body.lms_students_path.strip() or None
    if body.lms_api_key is not None:
        k = body.lms_api_key.strip()
        if k and "…" not in k:
            row.lms_api_key = k
    if body.integration_signing_secret is not None:
        k = body.integration_signing_secret.strip()
        # Empty clears it, which turns signing back off on both directions.
        if "…" not in k:
            row.integration_signing_secret = k or None
    if body.lms_api_key_alt is not None:
        k = body.lms_api_key_alt.strip()
        # An empty value clears the second key — that is how a rotation ends.
        if "…" not in k:
            row.lms_api_key_alt = k or None
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


def _make_baptism_number(rid: str) -> str:
    return "LETW-BAP-" + rid.replace("-", "")[:8].upper()


def _baptism_payload(r) -> dict:
    return {
        "baptism_verified": True,
        "certificate_number": r.certificate_number,
        "record_id": r.id,
        "candidate_name": r.requester_name,
        "candidate_photo": getattr(r, "photo_url", None),
        "requester_email": r.requester_email,
        "requester_phone": r.requester_phone,
        "baptism_date": (r.approved_date or r.preferred_date).isoformat() if (r.approved_date or r.preferred_date) else None,
        "approved_date": r.approved_date.isoformat() if r.approved_date else None,
        "details": r.details or {},
        "issuer": "letw.org",
    }


async def push_baptism_completion(db: AsyncSession, r) -> None:
    """On baptism approval, hand the record to sharepoints (webhook) and/or the
    baptism office (email w/ generate link). Best-effort."""
    row = await _settings_row(db)
    if not row:
        return
    key = await _effective_key(db)
    cert_no = r.certificate_number or ""
    generate_url = f"https://sharepoints.letw.org/baptism-certificate?cert={cert_no}"
    if (row.baptism_webhook_url or "").strip():
        try:
            import httpx
            async with httpx.AsyncClient(timeout=15) as cli:
                await cli.post(row.baptism_webhook_url.strip(), json=_baptism_payload(r),
                               headers={"X-API-Key": key} if key else {})
        except Exception as e:
            print(f"[integrations] baptism webhook push failed: {type(e).__name__}: {e}", flush=True)
    if (row.baptism_office_email or "").strip():
        try:
            from services.email_service import send_email
            when = (r.approved_date or r.preferred_date)
            html = (
                '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">'
                '<h2 style="color:#140152">Baptism ready for a certificate</h2>'
                f'<p><strong>{r.requester_name}</strong>&apos;s baptism has been approved.</p>'
                f'<p><strong>Reference:</strong> {cert_no}<br>'
                f'<strong>Date:</strong> {when.strftime("%B %d, %Y") if when else "—"}</p>'
                f'<p style="margin-top:18px"><a href="{generate_url}" '
                'style="background:#140152;color:#fff;text-decoration:none;font-weight:bold;padding:11px 20px;border-radius:999px">'
                'Generate baptism certificate</a></p>'
                '<p style="font-size:12px;color:#6b7280">Light Encounter Tabernacle Worldwide</p></div>'
            )
            await send_email(row.baptism_office_email.strip(), f"Baptism certificate ready — {r.requester_name}", html)
        except Exception as e:
            print(f"[integrations] baptism-office email failed: {type(e).__name__}: {e}", flush=True)


@router.get("/baptism/record")
async def lookup_baptism_by_cert(
    cert_no: str,
    x_api_key: str = Header(default=""),
    db: AsyncSession = Depends(get_db),
):
    """Return an approved baptism record's details for the partner to issue the
    baptism certificate. Only approved/completed baptisms resolve."""
    expected = await _effective_key(db)
    if not expected:
        raise HTTPException(503, "Partner integration is not configured yet.")
    if not x_api_key or not hmac.compare_digest(x_api_key.strip(), expected):
        raise HTTPException(401, "Invalid or missing X-API-Key.")
    from models.life_event import LifeEventRequest
    ref = (cert_no or "").strip().upper()
    if not ref:
        raise HTTPException(400, "cert_no is required.")
    r = (await db.execute(select(LifeEventRequest).where(LifeEventRequest.certificate_number == ref))).scalar_one_or_none()
    if not r or r.kind != "baptism" or r.status not in ("approved", "completed"):
        raise HTTPException(404, "No approved baptism matches that number.")
    return _baptism_payload(r)


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
    # Same shape (incl. tamper-evident fingerprint, verify URL/QR, seal, logo)
    # as the auto-push, so a manual lookup issues an identical certificate.
    row = await _settings_row(db)
    return _couple_payload(c, (row.marriage_seal_url or None) if row else None)


@router.get("/admin/test-sharepoints")
async def test_sharepoints(db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    """Ask sharepoints what it supports, using the shared secret. Surfaces the
    live capability list so an admin can see the link really works."""
    key = await _effective_key(db)
    if not key:
        return {"ok": False, "reason": "No shared secret set yet."}
    try:
        import httpx
        async with httpx.AsyncClient(timeout=20) as cli:
            r = await cli.get("https://sharepoints.letw.org/api/letw/handshake",
                              headers={"X-API-Key": key})
        if r.status_code == 401:
            return {"ok": False, "reason": "sharepoints rejected the secret — make sure both sides match."}
        if r.status_code >= 300:
            return {"ok": False, "reason": f"sharepoints responded {r.status_code}."}
        data = r.json() or {}
        caps = data.get("capabilities") or {}
        return {
            "ok": True,
            "service": data.get("service"),
            "status": data.get("status"),
            "capabilities": sorted(k for k, v in caps.items() if v),
            "endpoints": data.get("endpoints") or {},
        }
    except Exception as e:
        return {"ok": False, "reason": f"Could not reach sharepoints: {type(e).__name__}"}
