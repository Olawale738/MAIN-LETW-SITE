"""
Marriage Prep router.

Admin owns the curriculum (modules) and approves couples + signs off at the end.
Couples enrol publicly, work through modules, log reflections, request sign-off.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, desc, and_
from sqlalchemy.ext.asyncio import AsyncSession
import io

from database import get_db
from models.user import User
from models.marriage_prep import MarriagePrepModule, MarriagePrepCouple, MarriagePrepProgress, MarriagePrepModuleResource
from utils.dependencies import get_admin_user

router = APIRouter(prefix="/api/marriage-prep", tags=["Marriage Prep"])

MAX_RESOURCE_FILE_BYTES = 25 * 1024 * 1024   # 25 MB hard cap — matches /downloads


async def _resources_by_module(db: AsyncSession, module_ids: list[str]) -> dict[str, list[dict]]:
    if not module_ids:
        return {}
    res = await db.execute(
        select(MarriagePrepModuleResource)
        .where(MarriagePrepModuleResource.module_id.in_(module_ids))
        .order_by(MarriagePrepModuleResource.created_at)
    )
    out: dict[str, list[dict]] = {mid: [] for mid in module_ids}
    for r in res.scalars().all():
        out.setdefault(r.module_id, []).append(_resource(r))
    return out


# ── Public: modules + couple flow ──────────────────────────────────────────

@router.get("/modules")
async def list_modules(db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(MarriagePrepModule).where(MarriagePrepModule.is_published == True).order_by(MarriagePrepModule.week_number)  # noqa: E712
    )
    modules = res.scalars().all()
    by_module = await _resources_by_module(db, [m.id for m in modules])
    return [_module(m, by_module.get(m.id, [])) for m in modules]


class CoupleIn(BaseModel):
    partner_a_name:     str
    partner_a_email:    EmailStr
    partner_b_name:     str
    partner_b_email:    Optional[EmailStr] = None
    intended_wedding_date: Optional[datetime] = None


def _public_base() -> str:
    """Public site origin for links baked into emails and QR codes. Guards
    against a misconfigured FRONTEND_URL (config default is localhost:3000):
    a printed certificate whose QR encodes localhost is unscannable from any
    phone, so anything that leaves the building falls back to letw.org."""
    from config import settings
    base = (settings.FRONTEND_URL or "").rstrip("/")
    if not base or "localhost" in base or "127.0.0.1" in base:
        return "https://letw.org"
    return base


@router.post("/enrol", status_code=201)
async def enrol_couple(body: CoupleIn, db: AsyncSession = Depends(get_db)):
    c = MarriagePrepCouple(**body.model_dump())
    db.add(c)
    await db.commit()
    await db.refresh(c)

    # Welcome email with the couple's portal link — the UUID link is their
    # access credential, so mailing it means they can always find their way
    # back to the course. Best-effort: mail hiccups never block enrolment.
    portal_url = f"{_public_base()}/marriage-prep/journey/{c.id}"
    try:
        from services.email_service import send_marriage_prep_enrolled_email
        for addr in {c.partner_a_email, c.partner_b_email}:
            if addr:
                await send_marriage_prep_enrolled_email(
                    to_email=addr,
                    partner_a=c.partner_a_name, partner_b=c.partner_b_name,
                    portal_url=portal_url,
                )
    except Exception as e:
        print(f"[marriage-prep] enrolment email failed: {type(e).__name__}: {e}", flush=True)

    out = _couple(c)
    out["portal_url"] = portal_url
    return out


class ProgressIn(BaseModel):
    couple_id:   str
    module_id:   str
    reflections: Optional[str] = None
    completed:   bool = True


@router.post("/progress")
async def log_progress(body: ProgressIn, db: AsyncSession = Depends(get_db)):
    # Validate FKs.
    if not (await db.execute(select(MarriagePrepCouple).where(MarriagePrepCouple.id == body.couple_id))).scalar_one_or_none():
        raise HTTPException(404, "Couple not found")
    if not (await db.execute(select(MarriagePrepModule).where(MarriagePrepModule.id == body.module_id))).scalar_one_or_none():
        raise HTTPException(404, "Module not found")
    # Upsert.
    existing = (await db.execute(
        select(MarriagePrepProgress)
        .where(and_(MarriagePrepProgress.couple_id == body.couple_id, MarriagePrepProgress.module_id == body.module_id))
    )).scalar_one_or_none()
    if existing:
        existing.reflections = body.reflections
        existing.completed_at = datetime.utcnow() if body.completed else None
    else:
        existing = MarriagePrepProgress(
            couple_id=body.couple_id, module_id=body.module_id,
            reflections=body.reflections,
            completed_at=datetime.utcnow() if body.completed else None,
        )
        db.add(existing)
    # If we just completed the last module, move couple to in_progress→completed
    # only the pastor sign-off transitions to completed, but flip in_progress now.
    c = (await db.execute(select(MarriagePrepCouple).where(MarriagePrepCouple.id == body.couple_id))).scalar_one()
    if c.status == "enrolled":
        c.status = "in_progress"
    await db.commit()
    await db.refresh(existing)
    return _progress(existing)


@router.get("/couples/{couple_id}/progress")
async def get_couple_progress(couple_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(MarriagePrepProgress).where(MarriagePrepProgress.couple_id == couple_id))
    return [_progress(p) for p in res.scalars().all()]


@router.get("/couples/{couple_id}")
async def get_couple_public(couple_id: str, db: AsyncSession = Depends(get_db)):
    """Public capability-link lookup for the couple portal. The UUID is
    unguessable, so knowing it is the access credential — same model as the
    certificate page. Only non-sensitive fields are returned."""
    c = (await db.execute(select(MarriagePrepCouple).where(MarriagePrepCouple.id == couple_id))).scalar_one_or_none()
    if not c:
        raise HTTPException(404, "Couple not found")
    return {
        "id": c.id,
        "partner_a_name": c.partner_a_name,
        "partner_b_name": c.partner_b_name,
        "intended_wedding_date": c.intended_wedding_date,
        "status": c.status,
        "pastor_signed_off": c.pastor_signed_off,
    }


# ── Admin: modules CRUD + sign-off ─────────────────────────────────────────

class ModuleIn(BaseModel):
    week_number:  int
    title:        str
    summary:      Optional[str] = None
    body_html:    Optional[str] = None
    scripture:    Optional[str] = None
    homework:     Optional[str] = None
    is_published: bool = True


@router.post("/admin/modules", status_code=201)
async def create_module(body: ModuleIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    m = MarriagePrepModule(**body.model_dump())
    db.add(m)
    await db.commit()
    await db.refresh(m)
    return _module(m)


@router.put("/admin/modules/{module_id}")
async def update_module(module_id: str, body: ModuleIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    m = (await db.execute(select(MarriagePrepModule).where(MarriagePrepModule.id == module_id))).scalar_one_or_none()
    if not m:
        raise HTTPException(404, "Module not found")
    for k, v in body.model_dump().items():
        setattr(m, k, v)
    await db.commit()
    await db.refresh(m)
    return _module(m)


@router.delete("/admin/modules/{module_id}")
async def delete_module(module_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    m = (await db.execute(select(MarriagePrepModule).where(MarriagePrepModule.id == module_id))).scalar_one_or_none()
    if m:
        await db.delete(m)
        await db.commit()
    return {"deleted": 1 if m else 0}


# ── Admin: per-module resources (link / PDF / document) ────────────────────

@router.post("/admin/modules/{module_id}/resources/url", status_code=201)
async def add_module_resource_url(
    module_id: str,
    title: str = Form(...),
    external_url: str = Form(...),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    if not (await db.execute(select(MarriagePrepModule).where(MarriagePrepModule.id == module_id))).scalar_one_or_none():
        raise HTTPException(404, "Module not found")
    r = MarriagePrepModuleResource(module_id=module_id, title=title, kind="url", external_url=external_url)
    db.add(r)
    await db.commit()
    await db.refresh(r)
    return _resource(r)


@router.post("/admin/modules/{module_id}/resources/video", status_code=201)
async def add_module_resource_video(
    module_id: str,
    title: str = Form(...),
    video_url: str = Form(...),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """A YouTube/Vimeo link, stored the same way as a plain URL resource but
    tagged kind='video' so the frontend renders an embedded player instead
    of a bare link."""
    if not (await db.execute(select(MarriagePrepModule).where(MarriagePrepModule.id == module_id))).scalar_one_or_none():
        raise HTTPException(404, "Module not found")
    r = MarriagePrepModuleResource(module_id=module_id, title=title, kind="video", external_url=video_url)
    db.add(r)
    await db.commit()
    await db.refresh(r)
    return _resource(r)


@router.post("/admin/modules/{module_id}/resources/file", status_code=201)
async def add_module_resource_file(
    module_id: str,
    title: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Accepts a PDF, Word doc, or any other document — same 25MB cap and
    binary-in-Postgres storage as /downloads."""
    if not (await db.execute(select(MarriagePrepModule).where(MarriagePrepModule.id == module_id))).scalar_one_or_none():
        raise HTTPException(404, "Module not found")
    data = await file.read()
    if len(data) > MAX_RESOURCE_FILE_BYTES:
        raise HTTPException(413, f"File exceeds {MAX_RESOURCE_FILE_BYTES // (1024 * 1024)} MB. Use a URL instead.")
    r = MarriagePrepModuleResource(
        module_id=module_id, title=title, kind="file", file_data=data,
        file_name=file.filename or "untitled",
        file_mime_type=file.content_type or "application/octet-stream",
        file_size=len(data),
    )
    db.add(r)
    await db.commit()
    await db.refresh(r)
    return _resource(r)


@router.delete("/admin/modules/resources/{resource_id}")
async def delete_module_resource(resource_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    r = (await db.execute(select(MarriagePrepModuleResource).where(MarriagePrepModuleResource.id == resource_id))).scalar_one_or_none()
    if r:
        await db.delete(r)
        await db.commit()
    return {"deleted": 1 if r else 0}


@router.get("/modules/resources/{resource_id}/file")
async def stream_module_resource_file(resource_id: str, db: AsyncSession = Depends(get_db)):
    """Public — curriculum previews and the couple portal are both public
    (capability-link, no auth), so an attached PDF/document is fetchable the
    same way the page that shows it already is."""
    r = (await db.execute(select(MarriagePrepModuleResource).where(MarriagePrepModuleResource.id == resource_id))).scalar_one_or_none()
    if not r or r.kind != "file" or not r.file_data:
        raise HTTPException(404, "Not found")
    safe_name = (r.file_name or f"{r.id}.bin").replace('"', "")
    mime = r.file_mime_type or "application/octet-stream"
    return StreamingResponse(
        io.BytesIO(r.file_data),
        media_type=mime,
        headers={
            "Content-Disposition": f'inline; filename="{safe_name}"',
            "Cache-Control": "public, max-age=86400",
        },
    )


@router.get("/admin/couples")
async def list_couples_admin(status: Optional[str] = None, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    q = select(MarriagePrepCouple).order_by(desc(MarriagePrepCouple.created_at))
    if status:
        q = q.where(MarriagePrepCouple.status == status)
    res = await db.execute(q.limit(500))
    return [_couple(c) for c in res.scalars().all()]


class CoupleUpdateIn(BaseModel):
    """Any subset — admin can rename, fix an email, push the wedding date,
    change status, or wipe / rewrite the pastor note without redoing sign-off."""
    partner_a_name:        Optional[str] = None
    partner_a_email:       Optional[EmailStr] = None
    partner_b_name:        Optional[str] = None
    partner_b_email:       Optional[EmailStr] = None
    intended_wedding_date: Optional[datetime] = None
    status:                Optional[str] = None      # enrolled | in_progress | completed | withdrew
    pastor_signature:      Optional[str] = None
    pastor_note:           Optional[str] = None


@router.put("/admin/couples/{couple_id}")
async def update_couple(couple_id: str, body: CoupleUpdateIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    c = (await db.execute(select(MarriagePrepCouple).where(MarriagePrepCouple.id == couple_id))).scalar_one_or_none()
    if not c:
        raise HTTPException(404, "Couple not found")
    # Only apply keys the admin actually sent — model_dump(exclude_unset=True)
    # so a blank field doesn't overwrite with None.
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(c, k, v)
    await db.commit()
    await db.refresh(c)
    return _couple(c)


@router.delete("/admin/couples/{couple_id}")
async def delete_couple(couple_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    c = (await db.execute(select(MarriagePrepCouple).where(MarriagePrepCouple.id == couple_id))).scalar_one_or_none()
    if not c:
        return {"deleted": 0}
    # Cascade — remove their progress rows first so we don't orphan them.
    from sqlalchemy import delete as sql_delete
    await db.execute(sql_delete(MarriagePrepProgress).where(MarriagePrepProgress.couple_id == couple_id))
    await db.delete(c)
    await db.commit()
    return {"deleted": 1}


class SignOffIn(BaseModel):
    pastor_signature: str
    pastor_note:      Optional[str] = None


@router.post("/admin/couples/{couple_id}/sign-off")
async def pastor_sign_off(
    couple_id: str,
    body: SignOffIn,
    db: AsyncSession = Depends(get_db),
    pastor: User = Depends(get_admin_user),
):
    c = (await db.execute(select(MarriagePrepCouple).where(MarriagePrepCouple.id == couple_id))).scalar_one_or_none()
    if not c:
        raise HTTPException(404, "Couple not found")
    c.pastor_signed_off = True
    c.pastor_signed_at = datetime.utcnow()
    c.pastor_signature = body.pastor_signature
    c.pastor_note      = body.pastor_note
    c.assigned_pastor_user_id = pastor.id
    c.status = "completed"
    await db.commit()
    await db.refresh(c)

    # Notify both partners with a link to their certificate + next steps.
    # Best-effort — a mail hiccup must not roll back the sign-off itself.
    try:
        from services.email_service import send_marriage_prep_completion_email
        wedding_date = c.intended_wedding_date.strftime("%A, %B %d, %Y") if c.intended_wedding_date else ""
        for addr in [c.partner_a_email, c.partner_b_email]:
            if not addr:
                continue
            await send_marriage_prep_completion_email(
                to_email=addr,
                partner_a_name=c.partner_a_name or "",
                partner_b_name=c.partner_b_name or "",
                couple_id=c.id,
                pastor_signature=c.pastor_signature or "",
                pastor_note=c.pastor_note or "",
                wedding_date=wedding_date,
            )
    except Exception as e:
        print(f"[marriage-prep] completion email failed: {type(e).__name__}: {e}", flush=True)

    return _couple(c)


# ── Public certificate lookup — only the id is used (UUIDs are
#    unguessable enough for this use). Returns a minimal view: no
#    email addresses, no pastor's private note. Used by
#    /marriage-prep/complete/{id} on the frontend so the couple can
#    view + print their certificate.
def _cert_signature(c: MarriagePrepCouple) -> str:
    """HMAC-SHA256 over the certificate's immutable facts, keyed with the
    server secret. Anyone can RE-VERIFY via /verify (server recomputes);
    nobody can FORGE without the key. Payload pins id + names + sign-off
    timestamp so editing any of them invalidates old QR codes."""
    import hmac as _hmac, hashlib as _hashlib
    from config import settings as _settings
    signed_at = c.pastor_signed_at.isoformat() if c.pastor_signed_at else ""
    payload = f"letw-marriage-cert|{c.id}|{c.partner_a_name}|{c.partner_b_name}|{signed_at}"
    return _hmac.new(_settings.JWT_SECRET.encode(), payload.encode(), _hashlib.sha256).hexdigest()


def _fingerprint(sig: str) -> str:
    """Human-checkable short form printed on the certificate: 3F2A-9B41-C8D0."""
    s = sig[:12].upper()
    return f"{s[0:4]}-{s[4:8]}-{s[8:12]}"


def _short_sig(sig: str) -> str:
    """First 16 hex chars (64 bits) of the HMAC — used in the QR URL.

    Why truncate: the full 64-hex sig pushes the URL to ~114 chars, which
    forces a 45×45-module QR. Printed inside the ~22mm chip that meant
    0.49mm modules — right at the failure threshold of phone cameras
    (diagnosed by machine-decoding a real certificate PDF: the data was
    perfect, phones just couldn't resolve the print). Truncating to 64 bits
    drops the QR to 33×33 modules → ~0.7mm modules at the same size.

    64 bits stays safe here because verification is exclusively server-side:
    a forger can't test candidates offline (no oracle without the key) and
    online guessing 2^63 sigs against letw.org isn't a real attack. The
    full signature is still returned in the certificate payload for anyone
    who wants maximum-strength manual verification."""
    return sig[:16]


@router.get("/certificate/{couple_id}")
async def get_certificate(couple_id: str, db: AsyncSession = Depends(get_db)):
    c = (await db.execute(select(MarriagePrepCouple).where(MarriagePrepCouple.id == couple_id))).scalar_one_or_none()
    if not c:
        raise HTTPException(404, "Not found")
    if not c.pastor_signed_off:
        # Not signed off yet — don't expose a "certificate" for an
        # unfinished couple. Frontend can decide what to render.
        raise HTTPException(404, "Certificate not yet issued")
    sig = _cert_signature(c)
    return {
        "id":                c.id,
        "partner_a_name":    c.partner_a_name,
        "partner_b_name":    c.partner_b_name,
        "wedding_date":      c.intended_wedding_date.isoformat() if c.intended_wedding_date else None,
        "pastor_signature":  c.pastor_signature,
        "pastor_signed_at":  c.pastor_signed_at.isoformat() if c.pastor_signed_at else None,
        "status":            c.status,
        # Cryptographic identity — QR encodes verify_url; fingerprint is the
        # short human-checkable form printed under the chip.
        "signature":         sig,
        "fingerprint":       _fingerprint(sig),
        "verify_url":        f"{_public_base()}/verify/cert/{c.id}?sig={_short_sig(sig)}",
    }


def _qr_to_svg(matrix: list[list[bool]], box_size: int = 8, border: int = 2) -> str:
    """
    Hand-rolled QR → SVG renderer using plain pixel units and an explicit
    viewBox. We deliberately do NOT use qrcode.image.svg.SvgPathImage: its
    default output uses physical units (e.g. width="29mm") with no viewBox,
    which browsers happily rescale on screen but which print/PDF rasterizers
    (Chrome "Save as PDF", etc.) handle inconsistently — sometimes shrinking
    to nothing, sometimes not rendering at all. A deterministic px-based SVG
    with an opaque white background renders identically everywhere: on
    screen, in print preview, and baked into a PDF.
    """
    n = len(matrix)
    size = (n + border * 2) * box_size
    rects = []
    for r, row in enumerate(matrix):
        for c, dark in enumerate(row):
            if not dark:
                continue
            x = (c + border) * box_size
            y = (r + border) * box_size
            rects.append(f'<rect x="{x}" y="{y}" width="{box_size}" height="{box_size}" fill="#000"/>')
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" '
        f'viewBox="0 0 {size} {size}" shape-rendering="crispEdges">'
        f'<rect x="0" y="0" width="{size}" height="{size}" fill="#fff"/>'
        + "".join(rects) +
        "</svg>"
    )


@router.get("/certificate/{couple_id}/qr.svg")
async def certificate_qr(couple_id: str, db: AsyncSession = Depends(get_db)):
    """QR chip for the printed certificate. Encodes the verify URL so any
    phone camera lands on letw.org's verification page. Deterministic
    pixel-based SVG (see _qr_to_svg) so it renders identically in the
    browser, in print preview, and in a saved PDF."""
    from fastapi.responses import Response
    c = (await db.execute(select(MarriagePrepCouple).where(MarriagePrepCouple.id == couple_id))).scalar_one_or_none()
    if not c or not c.pastor_signed_off:
        raise HTTPException(404, "Certificate not yet issued")
    # Short sig keeps the QR at ~33×33 modules so the printed chip stays
    # comfortably scannable by phone cameras (see _short_sig for the maths).
    verify_url = f"{_public_base()}/verify/cert/{c.id}?sig={_short_sig(_cert_signature(c))}"
    try:
        import qrcode
        qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=0)
        qr.add_data(verify_url)
        qr.make(fit=True)
        svg = _qr_to_svg(qr.get_matrix(), box_size=8, border=2)
        return Response(
            content=svg,
            media_type="image/svg+xml",
            headers={
                "Cache-Control": "public, max-age=86400",
                "Access-Control-Allow-Origin": "*",
            },
        )
    except ImportError:
        raise HTTPException(503, "QR generator not installed on the server yet — redeploy with the updated requirements.txt.")


@router.get("/verify/{couple_id}")
async def verify_certificate(couple_id: str, sig: str = "", db: AsyncSession = Depends(get_db)):
    """Public verification endpoint the QR code lands on (via the frontend
    /verify/cert page). Recomputes the HMAC server-side and compares in
    constant time — a forged or tampered signature comes back valid=false."""
    import hmac as _hmac
    c = (await db.execute(select(MarriagePrepCouple).where(MarriagePrepCouple.id == couple_id))).scalar_one_or_none()
    if not c or not c.pastor_signed_off:
        return {"valid": False, "reason": "No issued certificate matches this code."}
    expected = _cert_signature(c)
    # Accept the full 64-hex signature (older printed PDFs, manual checks)
    # OR a truncated prefix of at least 16 hex chars (what new QR codes
    # carry). Both paths use constant-time comparison; anything shorter
    # than 16 is rejected outright so there's no weak-prefix loophole.
    sig = (sig or "").strip().lower()
    ok = False
    if len(sig) == len(expected):
        ok = _hmac.compare_digest(expected, sig)
    elif 16 <= len(sig) < len(expected):
        ok = _hmac.compare_digest(expected[:len(sig)], sig)
    if not ok:
        return {"valid": False, "reason": "Signature does not match — this certificate may have been altered or forged."}
    return {
        "valid": True,
        "partner_a_name":   c.partner_a_name,
        "partner_b_name":   c.partner_b_name,
        "pastor_signature": c.pastor_signature,
        "pastor_signed_at": c.pastor_signed_at.isoformat() if c.pastor_signed_at else None,
        "wedding_date":     c.intended_wedding_date.isoformat() if c.intended_wedding_date else None,
        "fingerprint":      _fingerprint(expected),
        "issuer":           "letw.org",
    }


# ── Helpers ────────────────────────────────────────────────────────────────

def _module(m: MarriagePrepModule, resources: Optional[list[dict]] = None) -> dict[str, Any]:
    return {
        "id": m.id, "week_number": m.week_number, "title": m.title,
        "summary": m.summary, "body_html": m.body_html,
        "scripture": m.scripture, "homework": m.homework,
        "is_published": m.is_published,
        "resources": resources or [],
    }


def _resource(r: MarriagePrepModuleResource) -> dict[str, Any]:
    """Metadata only — never includes file_data, so this is safe to send
    to the public curriculum preview and the couple portal alike."""
    return {
        "id": r.id, "module_id": r.module_id, "title": r.title, "kind": r.kind,
        "external_url": r.external_url,
        "file_name": r.file_name, "file_mime_type": r.file_mime_type, "file_size": r.file_size,
    }


def _couple(c: MarriagePrepCouple) -> dict[str, Any]:
    return {
        "id": c.id,
        "partner_a_name": c.partner_a_name, "partner_a_email": c.partner_a_email,
        "partner_b_name": c.partner_b_name, "partner_b_email": c.partner_b_email,
        "intended_wedding_date": c.intended_wedding_date.isoformat() if c.intended_wedding_date else None,
        "assigned_pastor_user_id": c.assigned_pastor_user_id,
        "status": c.status, "pastor_signed_off": c.pastor_signed_off,
        "pastor_signed_at": c.pastor_signed_at.isoformat() if c.pastor_signed_at else None,
        "pastor_signature": c.pastor_signature, "pastor_note": c.pastor_note,
        "created_at": c.created_at.isoformat(),
    }


def _progress(p: MarriagePrepProgress) -> dict[str, Any]:
    return {
        "id": p.id, "couple_id": p.couple_id, "module_id": p.module_id,
        "completed_at": p.completed_at.isoformat() if p.completed_at else None,
        "reflections": p.reflections,
    }
