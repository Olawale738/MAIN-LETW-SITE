"""
Theology School API — application → payment → admission → acceptance → student.

Pipeline
  1. POST /apply                     applicant submits (status=pending)
  2. POST /applications/{id}/confirm-payment
                                     verifies a SETTLED donation whose amount
                                     matches the programme tuition exactly,
                                     then auto-issues the admission letter and
                                     emails an "accept your offer" link
  3. GET/POST /offer/{token}         applicant views / accepts the offer
  4. on acceptance                   a student account is created on letw.org
                                     (email + generated password, emailed out),
                                     the student is enrolled on live.letw.org,
                                     and the record is pushed to
                                     sharepoints.letw.org for student-ID issue
  5. POST /integrations/student-id   sharepoints posts the issued ID back here

Every downstream step is best-effort and independently retryable from the admin
page — a failure in the LMS or sharepoints never blocks the admission itself.
"""

import hmac
import re
import secrets
import string
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, File, Header, HTTPException, Request, UploadFile
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.theology import TheologyProgram, TheologyApplication
from models.user import User, UserRole
from utils.dependencies import get_admin_user, get_current_active_user

router = APIRouter(prefix="/api/theology", tags=["Theology School"])


# ── Helpers ───────────────────────────────────────────────────────────────────

BACKEND_API_BASE = "https://letw-backend.onrender.com/api"


def _public_base() -> str:
    from config import settings
    base = (settings.FRONTEND_URL or "").rstrip("/")
    if not base or "localhost" in base or "127.0.0.1" in base:
        return "https://letw.org"
    return base


def _make_admission_number(app_id: str) -> str:
    return "LETW-TS-" + app_id.replace("-", "")[:8].upper()


def _gen_password(n: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(n))


def _initial_password() -> str:
    """The first password a student is given.

    Read aloud over a phone or copied off a screen as often as it is pasted, so
    it avoids characters that are ambiguous in print — no O/0, l/1, I — while
    staying random. Never derived from the admission number or the name: a
    predictable first password is every account at once.
    """
    letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"
    digits = "23456789"
    block = "".join(secrets.choice(letters) for _ in range(4))
    tail = "".join(secrets.choice(digits) for _ in range(4))
    return f"LETW-{block}-{tail}"


async def _clear_initial_password(db: AsyncSession, a: TheologyApplication) -> None:
    """Once a student has signed in, the handover note has served its purpose."""
    if a.initial_password or not a.first_login_at:
        a.initial_password = None
        if not a.first_login_at:
            a.first_login_at = datetime.utcnow()
        await db.commit()


def _program_out(p: TheologyProgram) -> dict:
    return {
        "id": p.id, "name": p.name, "slug": p.slug, "summary": p.summary,
        "description": p.description, "level": p.level,
        "duration_months": p.duration_months,
        "tuition_amount": float(p.tuition_amount or 0), "currency": p.currency,
        "is_open": p.is_open, "capacity": p.capacity, "sort_order": p.sort_order,
        "lms_course_code": p.lms_course_code,
        "program_code": p.program_code,
    }


def _app_out(a: TheologyApplication, program: Optional[TheologyProgram] = None) -> dict:
    return {
        "id": a.id, "program_id": a.program_id,
        "program_name": program.name if program else None,
        "full_name": a.full_name, "email": a.email, "phone": a.phone,
        "education_level": a.education_level, "photo_url": a.photo_url,
        "status": a.status,
        "amount_paid": float(a.amount_paid) if a.amount_paid is not None else None,
        "currency": a.currency,
        "paid_at": a.paid_at.isoformat() if a.paid_at else None,
        "admission_number": a.admission_number,
        "admission_issued_at": a.admission_issued_at.isoformat() if a.admission_issued_at else None,
        "accepted_at": a.accepted_at.isoformat() if a.accepted_at else None,
        "student_user_id": a.student_user_id,
        "lms_status": a.lms_status,
        "lms_enrolled_at": a.lms_enrolled_at.isoformat() if a.lms_enrolled_at else None,
        "lms_error": a.lms_error,
        "student_id_number": a.student_id_number,
        "student_id_card_url": a.student_id_card_url,
        "created_at": a.created_at.isoformat() if a.created_at else None,
        # sharepoints hand-over — the official offer and printable letter.
        "bridge_status": a.bridge_status,
        "bridge_error": a.bridge_error,
        "offer_number": a.offer_number,
        "offer_url": a.offer_url,
        "admission_letter_url": a.admission_letter_url,
        "acceptance_token": a.acceptance_token,
        "initial_password": a.initial_password,
        "first_login_at": a.first_login_at.isoformat() if a.first_login_at else None,
        "documents": list(a.documents or []),
        "admission_email_sent_at": a.admission_email_sent_at.isoformat() if a.admission_email_sent_at else None,
        "student_id_email_sent_at": a.student_id_email_sent_at.isoformat() if a.student_id_email_sent_at else None,
        "letter_url": f"{_public_base()}/theology-school/offer/{a.acceptance_token}/letter" if a.acceptance_token else None,
    }


async def _get_program(db: AsyncSession, pid: str) -> Optional[TheologyProgram]:
    return (await db.execute(select(TheologyProgram).where(TheologyProgram.id == pid))).scalar_one_or_none()


# ── Public: programmes + apply ────────────────────────────────────────────────

@router.get("/programs")
async def list_programs(include_closed: bool = False, db: AsyncSession = Depends(get_db)):
    q = select(TheologyProgram).order_by(TheologyProgram.sort_order, TheologyProgram.name)
    if not include_closed:
        q = q.where(TheologyProgram.is_open == True)  # noqa: E712
    return [_program_out(p) for p in (await db.execute(q)).scalars().all()]


class ApplyIn(BaseModel):
    program_id: str
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    address: Optional[str] = None
    education_level: Optional[str] = None
    statement: Optional[str] = None
    photo_url: Optional[str] = None


@router.post("/apply", status_code=201)
async def apply(body: ApplyIn, db: AsyncSession = Depends(get_db)):
    program = await _get_program(db, body.program_id)
    if not program or not program.is_open:
        raise HTTPException(404, "That programme is not open for applications.")
    a = TheologyApplication(**body.model_dump(), status="pending")
    db.add(a)
    await db.commit()
    await db.refresh(a)
    try:
        from services.email_service import send_email
        await send_email(
            a.email, f"Application received — {program.name}",
            f'<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">'
            f'<h2 style="color:#140152">We have your application</h2>'
            f'<p>Dear {a.full_name},</p>'
            f'<p>Thank you for applying for <strong>{program.name}</strong> at the LETW Theology School.</p>'
            f'<p>To move your application forward, please complete the application fee of '
            f'<strong>{program.currency} {float(program.tuition_amount):,.2f}</strong>. '
            f'Your admission letter is issued automatically once payment is confirmed.</p>'
            f'<p style="font-size:12px;color:#6b7280">Light Encounter Tabernacle Worldwide</p></div>'
        )
    except Exception as e:
        print(f"[theology] ack email failed: {type(e).__name__}: {e}", flush=True)
    return {"application_id": a.id, "status": a.status,
            "amount_due": float(program.tuition_amount or 0), "currency": program.currency,
            "program_name": program.name}


# ── Payment confirmation → automatic admission ───────────────────────────────

def _email_delivery() -> dict:
    """Whether mail actually leaves this server.

    send_email() returns True in development mode after only printing to the
    console, so a caller that trusts its return value records a delivery that
    never happened. Anything that reports "emailed" to an administrator has to
    check this first.
    """
    from config import settings as _s
    if not getattr(_s, "EMAIL_ENABLED", False):
        return {"live": False, "provider": None,
                "reason": "EMAIL_ENABLED is off — mail is written to the server log, not sent."}
    if (getattr(_s, "RESEND_API_KEY", "") or "").strip():
        return {"live": True, "provider": "resend", "reason": None}
    if (getattr(_s, "SMTP_HOST", "") or "").strip():
        return {"live": True, "provider": "smtp", "reason": None}
    return {"live": False, "provider": None,
            "reason": "EMAIL_ENABLED is on but neither RESEND_API_KEY nor SMTP_HOST is set."}


async def _build_letter_pdf(db: AsyncSession, a: TheologyApplication,
                            program: Optional[TheologyProgram]) -> Optional[bytes]:
    """Render this candidate's admission letter.

    The letter is a document of the school, signed by the appointed Registrar or
    Deputy Registrar — never by whichever administrator happens to be logged in,
    and carrying nothing from the dashboard it was triggered from.
    """
    who = await _signatory(db)
    try:
        from services.admission_letter import build_admission_letter
        return build_admission_letter(
            full_name=a.full_name,
            email=a.email.lower(),
            admission_number=a.offer_number or a.admission_number or "",
            program_name=program.name if program else "your programme",
            level=program.level if program else None,
            duration_months=program.duration_months if program else None,
            tuition_amount=float(a.amount_paid or (program.tuition_amount if program else 0) or 0),
            currency=(a.currency or (program.currency if program else None) or "NGN"),
            issued_at=a.admission_issued_at,
            photo_url=a.photo_url,
            logo_url=f"{_public_base()}/logo.png",
            signatory=who,
            verify_url=_admission_verify_url(a),
            fingerprint=_admission_fingerprint(_admission_signature(a)),
        )
    except Exception as e:
        print(f"[theology] letter render failed for {a.admission_number}: {type(e).__name__}: {e}", flush=True)
        return None


async def _signatory_ready(db: AsyncSession) -> tuple[bool, str]:
    """Whether a letter can be signed. No signatory, no automatic letter — an
    unsigned admission letter is worse than a late one."""
    who = await _signatory(db)
    if not (who.get("name") or "").strip():
        role = "Deputy Registrar" if who.get("role") == "deputy" else "Registrar"
        return False, (f"No {role} has been set. Admission letters are not being generated — "
                       f"set the signatory under Theology School → Signatories.")
    return True, ""


async def _deliver_letter(db: AsyncSession, a: TheologyApplication,
                          program: Optional[TheologyProgram]) -> dict:
    """Generate the letter and email it to the candidate as a PDF.

    Called the moment an offer is accepted, so the candidate receives the
    signed document rather than a link to go and fetch one.
    """
    ready, why = await _signatory_ready(db)
    if not ready:
        print(f"[theology] letter not generated for {a.admission_number}: {why}", flush=True)
        return {"generated": False, "sent": False, "reason": why}

    pdf = await _build_letter_pdf(db, a, program)
    if not pdf:
        return {"generated": False, "sent": False,
                "reason": "The letter could not be generated. Check the server log."}

    filename = f"LETW-Admission-Letter-{(a.offer_number or a.admission_number or a.id)}.pdf"
    u = _letter_urls(a)
    pname = program.name if program else "your programme"
    body = (
        f'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">'
        f'<div style="background:#140152;color:#fff;padding:22px;border-radius:14px 14px 0 0">'
        f'<h2 style="margin:0;color:#f5bb00">Your admission letter</h2></div>'
        f'<div style="border:1px solid #eee;border-top:none;padding:22px;border-radius:0 0 14px 14px">'
        f'<p>Dear {a.full_name},</p>'
        f'<p>Thank you for accepting your place on <strong>{pname}</strong>. '
        f'Your signed admission letter is attached to this email.</p>'
        f'<p><strong>Admission number:</strong> {a.admission_number}</p>'
        f'<p>You can also view, download and print it any time from your student portal:</p>'
        f'<p style="margin:22px 0"><a href="{u["letter_url"]}" '
        f'style="background:#140152;color:#fff;text-decoration:none;font-weight:bold;'
        f'padding:12px 22px;border-radius:999px">Open my admission letter</a></p>'
        f'<p style="font-size:12px;color:#6b7280">The letter carries a QR code. Anyone can scan it to '
        f'confirm the document is genuine.</p>'
        f'<p style="font-size:12px;color:#6b7280">Light Encounter Tabernacle Worldwide · School of Theology</p>'
        f'</div></div>'
    )
    try:
        from services.email_service import send_email_with_pdf
        sent = await send_email_with_pdf(
            a.email, f"Your admission letter — {a.admission_number}", body, pdf, filename)
    except Exception as e:
        print(f"[theology] letter email failed: {type(e).__name__}: {e}", flush=True)
        sent = False

    _add_document(a, "admission_letter", "Admission letter", u["letter_url"],
                  a.offer_number or a.admission_number, source="letw.org")
    if sent:
        a.admission_email_sent_at = datetime.utcnow()
    await db.commit()
    return {"generated": True, "sent": bool(sent),
            "reason": None if sent else _email_delivery()["reason"]}


def _ensure_offer_identity(a: TheologyApplication) -> None:
    """Every admitted applicant needs an admission number and an acceptance
    token, whichever system issued the offer.

    The token is what addresses the letter on letw.org. Without it the printable
    letter has no URL, the student portal has nothing to link to, and the office
    cannot reprint — which is exactly what happened when sharepoints accepted an
    application and we assumed it would do the telling.
    """
    if not a.admission_number:
        a.admission_number = _make_admission_number(a.id)
    if not a.acceptance_token:
        a.acceptance_token = secrets.token_urlsafe(32)
    if not a.admission_issued_at:
        a.admission_issued_at = datetime.utcnow()


def _add_document(a: TheologyApplication, kind: str, title: str, url: str,
                  number: Optional[str] = None, issued_at: Optional[str] = None,
                  source: str = "sharepoints.letw.org") -> bool:
    """Record a document issued for this student. Returns True if it is new.

    Same kind and same URL is the same document, so a retried webhook does not
    stack duplicates on the student's portal.
    """
    docs = list(a.documents or [])
    for d in docs:
        if d.get("kind") == kind and d.get("url") == url:
            return False
    docs.append({
        "kind": kind, "title": title, "url": url,
        "number": number, "source": source,
        "issued_at": issued_at or (datetime.utcnow().isoformat() + "Z"),
    })
    a.documents = docs
    return True


def _letter_urls(a: TheologyApplication) -> dict:
    base = _public_base()
    return {
        "offer_url": a.offer_url or f"{base}/theology-school/offer/{a.acceptance_token}",
        "letter_url": f"{base}/theology-school/offer/{a.acceptance_token}/letter",
        "official_letter_url": a.admission_letter_url or "",
    }


async def _send_admission_email(db: AsyncSession, a: TheologyApplication,
                                program: Optional[TheologyProgram]) -> bool:
    """Tell the candidate they are in, and give them the letter.

    letw.org always sends this, even when sharepoints issued the offer and says
    it emailed too. A duplicate email is a far smaller failure than a candidate
    who is admitted and never finds out.
    """
    u = _letter_urls(a)
    extra = (f'<p style="margin:0 0 18px"><a href="{u["official_letter_url"]}" '
             f'style="color:#140152">Official copy from the school office</a></p>'
             if u["official_letter_url"] else "")
    pname = program.name if program else "your programme"
    months = f" ({program.duration_months} months)" if program and program.duration_months else ""
    try:
        from services.email_service import send_email
        ok = await send_email(
            a.email,
            f"Your admission letter — {a.admission_number}",
            f'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">'
            f'<div style="background:#140152;color:#fff;padding:22px;border-radius:14px 14px 0 0">'
            f'<h2 style="margin:0;color:#f5bb00">Offer of Admission</h2></div>'
            f'<div style="border:1px solid #eee;border-top:none;padding:22px;border-radius:0 0 14px 14px">'
            f'<p>Dear {a.full_name},</p>'
            f'<p>We are delighted to offer you admission into <strong>{pname}</strong>{months} '
            f'at the LETW School of Theology.</p>'
            f'<p><strong>Admission number:</strong> {a.admission_number}</p>'
            f'<p style="margin:24px 0">'
            f'<a href="{u["letter_url"]}" style="background:#140152;color:#fff;text-decoration:none;'
            f'font-weight:bold;padding:12px 22px;border-radius:999px">View &amp; print your admission letter</a></p>'
            f'{extra}'
            f'<p>When you are ready, accept your place — your student portal, classroom access and '
            f'student ID all follow from that.</p>'
            f'<p style="margin:20px 0"><a href="{u["offer_url"]}" style="color:#140152;font-weight:bold">'
            f'Accept your offer</a></p>'
            f'<p style="font-size:12px;color:#6b7280">If the buttons do not work, copy this link:<br>'
            f'{u["letter_url"]}</p>'
            f'<p style="font-size:12px;color:#6b7280">Light Encounter Tabernacle Worldwide · School of Theology</p>'
            f'</div></div>'
        )
        if ok and _email_delivery()["live"]:
            a.admission_email_sent_at = datetime.utcnow()
            await db.commit()
        return bool(ok) and _email_delivery()["live"]
    except Exception as e:
        print(f"[theology] admission email failed for {a.email}: {type(e).__name__}: {e}", flush=True)
        return False


async def _issue_admission(db: AsyncSession, a: TheologyApplication, program: TheologyProgram) -> None:
    """Mint the admission number + acceptance token and email the offer."""
    _ensure_offer_identity(a)
    a.status = "admitted"
    await db.commit()
    await db.refresh(a)
    await _send_admission_email(db, a, program)


SHAREPOINTS_THEOLOGY_INTAKE = "https://sharepoints.letw.org/api/integrations/theology/enrollments"
SHAREPOINTS_THEOLOGY_PROGRAMS = "https://sharepoints.letw.org/api/integrations/theology/programs"


async def _intake_url(db: AsyncSession) -> str:
    """Where paid applications are handed over. Admin-set value wins."""
    from routers.integrations import _settings_row
    row = await _settings_row(db)
    return ((row.student_webhook_url or "").strip() if row else "") or SHAREPOINTS_THEOLOGY_INTAKE


def _programs_url(intake: str) -> str:
    """The programme registry sits beside the enrolment intake."""
    return intake.rstrip("/").rsplit("/", 1)[0] + "/programs" if intake.rstrip("/").endswith("enrollments") \
        else SHAREPOINTS_THEOLOGY_PROGRAMS


def _derive_code(program: TheologyProgram) -> str:
    """A stable programme code sharepoints will accept ([A-Za-z0-9_-]{2,80}).

    Prefer what the admin set; otherwise build one from the slug so a programme
    is never stuck unpublished just because nobody typed a code.
    """
    for candidate in ((program.program_code or ""), (program.lms_course_code or ""), (program.slug or ""), (program.name or "")):
        code = re.sub(r"[^A-Za-z0-9_-]", "-", candidate.strip()).strip("-").upper()
        code = re.sub(r"-{2,}", "-", code)[:80]
        if len(code) >= 2:
            return code
    return "LETW-PROGRAM"


async def _publish_program(db: AsyncSession, program: TheologyProgram) -> dict:
    """Register/refresh the programme in sharepoints. Nothing can be enrolled
    against a programme sharepoints has never heard of, so this runs before the
    first hand-over and whenever an admin edits the programme."""
    from routers.integrations import _effective_key
    key = await _effective_key(db)
    if not key:
        return {"ok": False, "reason": "Shared secret not set (Admin → Integrations)."}

    code = _derive_code(program)
    if (program.program_code or "") != code:
        program.program_code = code
        await db.commit()

    # sharepoints requires at least one course. letw.org does not model courses
    # yet, so seed a single study unit the school office can expand there.
    payload = {
        "source": "letw.org",
        "externalProgramId": program.id,
        # sharepoints treats "same revision, different content" as a CONFLICT and
        # refuses the update, so every publish must carry a higher revision than
        # the last. A second-resolution stamp is monotonic and fits its int32.
        "revision": int(datetime.utcnow().timestamp()),
        "code": code,
        "title": (program.name or code)[:180],
        "educationLevel": (program.level or "certificate")[:120],
        "description": (program.description or program.summary or None),
        "requiredAmount": f"{float(program.tuition_amount or 0):.2f}",
        "currency": (program.currency or "NGN").upper()[:3],
        "active": bool(program.is_open),
        "courses": [{
            "externalCourseId": f"{program.id}-core",
            "courseCode": (code + "-101")[:50],
            "courseTitle": (program.name or code)[:180],
            "sequence": 1,
            "required": True,
            "active": True,
            "durationWeeks": max(1, min(520, int((program.duration_months or 12) * 4))),
        }],
    }
    if program.lms_course_code:
        payload["liveProgramSlug"] = program.lms_course_code[:180]

    url = _programs_url(await _intake_url(db))
    try:
        import httpx
        async with httpx.AsyncClient(timeout=25) as cli:
            r = await cli.post(url, json=payload, headers={"X-API-Key": key})
        if 200 <= r.status_code < 300:
            body = r.json() or {}
            data = body.get("data") if isinstance(body.get("data"), dict) else body
            return {"ok": True, "code": code, "program_id": data.get("programId"),
                    "courses": data.get("courseCount"), "duplicate": bool(data.get("duplicate"))}
        return {"ok": False, "code": code, "reason": f"sharepoints responded {r.status_code}: {r.text[:300]}"}
    except Exception as e:
        return {"ok": False, "code": code, "reason": f"{type(e).__name__}: {e}"}



async def _bridge_to_sharepoints(db: AsyncSession, a: TheologyApplication, program: TheologyProgram) -> None:
    """Hand the PAID application to sharepoints, which is the system of record for
    theology enrollment (offer number, admission letter, acceptance, student ID,
    live.letw.org provisioning and account recovery all live there).

    Best-effort: letw.org keeps its own admission as a fallback so a bridge
    outage never blocks an applicant.
    """
    from routers.integrations import _effective_key
    key = await _effective_key(db)
    if not key:
        a.bridge_status = "unconfigured"
        a.bridge_error = "Shared secret not set (Admin → Integrations)."
        await db.commit()
        return
    code = _derive_code(program)
    payload = {
        "source": "letw.org",
        "applicationId": a.id,
        "applicantName": a.full_name,
        "personalEmail": a.email.lower(),
        "phone": a.phone or None,
        "programCode": code,
        "paymentProvider": "letw.org",
        "paymentReference": a.payment_reference or a.id,
        "paidAmount": f"{float(a.amount_paid or 0):.2f}",
        "currency": (a.currency or program.currency or "NGN").upper()[:3],
        "paymentStatus": "VERIFIED",
        "paymentVerifiedAt": (a.paid_at or datetime.utcnow()).isoformat() + "Z",
    }
    if a.photo_url and str(a.photo_url).startswith("http"):
        payload["photoUrl"] = a.photo_url
    url = await _intake_url(db)
    try:
        import httpx
        async with httpx.AsyncClient(timeout=25) as cli:
            r = await cli.post(url, json=payload, headers={"X-API-Key": key})
            # sharepoints rejects a programme it has never been told about.
            # Register it and try once more, so the first applicant of a new
            # programme is not the one who pays for the oversight.
            if r.status_code in (404, 422):
                pub = await _publish_program(db, program)
                if pub.get("ok"):
                    r = await cli.post(url, json=payload, headers={"X-API-Key": key})
        if 200 <= r.status_code < 300:
            data = r.json() or {}
            body = data.get("data") if isinstance(data.get("data"), dict) else data
            a.bridge_enrollment_id = str(body.get("enrollmentId") or "") or None
            a.offer_number = str(body.get("offerNumber") or "") or None
            a.offer_url = str(body.get("offerUrl") or "") or None
            a.admission_letter_url = str(body.get("admissionLetterUrl") or "") or None
            a.bridge_status = "accepted"
            a.bridge_error = None
        else:
            a.bridge_status = "failed"
            a.bridge_error = f"sharepoints responded {r.status_code}: {r.text[:300]}"
    except Exception as e:
        a.bridge_status = "failed"
        a.bridge_error = f"{type(e).__name__}: {e}"
    await db.commit()


async def _post_event(db: AsyncSession, event: str, payload: dict, timeout: int = 20) -> dict:
    """POST one lifecycle event to sharepoints.

    All five events share a base, a secret and a header, and every one of them
    is best-effort: sharepoints being briefly unreachable must never block a
    student's progress on letw.org. Failures are recorded, not raised.
    """
    from routers.integrations import _effective_key
    key = await _effective_key(db)
    if not key:
        return {"ok": False, "reason": "Shared secret not set (Admin -> Integrations)."}
    base = (await _intake_url(db)).rstrip("/").rsplit("/", 1)[0]
    url = f"{base}/{event}"
    try:
        import httpx
        async with httpx.AsyncClient(timeout=timeout) as cli:
            r = await cli.post(url, json=payload, headers={"X-API-Key": key})
        if 200 <= r.status_code < 300:
            data = r.json() or {}
            return {"ok": True, "status": r.status_code,
                    "data": data.get("data") if isinstance(data.get("data"), dict) else data}
        print(f"[theology] {event} -> {r.status_code}: {r.text[:300]}", flush=True)
        return {"ok": False, "status": r.status_code, "reason": f"sharepoints responded {r.status_code}: {r.text[:300]}"}
    except Exception as e:
        print(f"[theology] {event} push failed: {type(e).__name__}: {e}", flush=True)
        return {"ok": False, "reason": f"{type(e).__name__}: {e}"}


def _journey(a: TheologyApplication, fallback: str = "admission_number") -> dict:
    """How sharepoints addresses one of our students on its classroom endpoints.

    It prefers its own journey id — handed to us when the offer was accepted.
    The fallback differs by endpoint and both schemas are strict, so sending
    the wrong one is a 422: classroom-status resolves an `admission_number`,
    classroom-progress only accepts a `liveEnrollmentId`.
    """
    if a.bridge_enrollment_id:
        return {"enrollmentJourneyId": a.bridge_enrollment_id}
    return {fallback: a.admission_number or ""}


class ConfirmPaymentIn(BaseModel):
    reference: str


@router.post("/applications/{app_id}/confirm-payment")
async def confirm_payment(app_id: str, body: ConfirmPaymentIn, db: AsyncSession = Depends(get_db)):
    """Verify a settled donation matching the tuition EXACTLY, then admit."""
    a = (await db.execute(select(TheologyApplication).where(TheologyApplication.id == app_id))).scalar_one_or_none()
    if not a:
        raise HTTPException(404, "Application not found.")
    program = await _get_program(db, a.program_id)
    if not program:
        raise HTTPException(404, "Programme not found.")
    if a.status not in ("pending",):
        return {"status": a.status, "already": True, "admission_number": a.admission_number}

    from models.payment import Donation
    ref = (body.reference or "").strip()
    d = (await db.execute(select(Donation).where(Donation.reference == ref))).scalar_one_or_none()
    if not d:
        raise HTTPException(404, "We could not find that payment reference.")
    if (d.status or "").lower() != "success":
        raise HTTPException(400, f"That payment is not settled yet (status: {d.status}).")
    expected = Decimal(str(program.tuition_amount or 0))
    if Decimal(str(d.amount or 0)) != expected:
        raise HTTPException(400, f"Amount paid does not match the exact fee of {program.currency} {expected}.")
    if (d.currency or "").upper() != (program.currency or "").upper():
        raise HTTPException(400, "Payment currency does not match the programme fee currency.")

    a.payment_reference = ref
    a.amount_paid = d.amount
    a.currency = d.currency
    a.paid_at = datetime.utcnow()
    a.status = "paid"
    await db.commit()

    # sharepoints is the system of record — it mints the offer number and the
    # official admission letter, and emails the applicant.
    await _bridge_to_sharepoints(db, a, program)
    await db.refresh(a)
    if a.bridge_status == "accepted" and a.offer_url:
        a.status = "admitted"
        a.admission_number = a.offer_number or a.admission_number
        # Even when sharepoints issued the offer, we still need our own token —
        # it is what addresses the printable letter and the portal link.
        _ensure_offer_identity(a)
        await db.commit()
        await db.refresh(a)
        sent = await _send_admission_email(db, a, program)
        return {"status": a.status, "admission_number": a.admission_number,
                "offer_url": a.offer_url, "admission_letter_url": a.admission_letter_url,
                **_letter_urls(a), "email_sent": sent, "source": "sharepoints"}
    # Fallback: issue locally so the applicant is never stuck.
    await _issue_admission(db, a, program)
    return {"status": a.status, "admission_number": a.admission_number,
            **_letter_urls(a),
            "email_sent": bool(a.admission_email_sent_at), "source": "letw.org"}


# ── Admission letter: signature, QR, verification, signatory ─────────────────

def _admission_signature(a: TheologyApplication) -> str:
    """HMAC-SHA256 over the letter's immutable facts, keyed with the server
    secret. Anyone can re-verify (the server recomputes); nobody can forge one
    without the key. Editing the name, the admission number or the issue date
    invalidates every QR code already printed."""
    import hashlib as _hashlib
    from config import settings as _settings
    issued = a.admission_issued_at.isoformat() if a.admission_issued_at else ""
    payload = f"letw-admission|{a.id}|{a.full_name}|{a.admission_number or ''}|{issued}"
    return hmac.new(_settings.JWT_SECRET.encode(), payload.encode(), _hashlib.sha256).hexdigest()


def _admission_short_sig(sig: str) -> str:
    """First 16 hex chars (64 bits). Keeps the QR near 33x33 modules so the
    printed chip stays scannable — the same trade-off proven on the marriage
    certificate, where a longer URL pushed modules below what phone cameras
    could resolve in print."""
    return sig[:16]


def _admission_fingerprint(sig: str) -> str:
    """Human-checkable short form printed under the seal: 3F2A-9B41-C8D0."""
    t = sig[:12].upper()
    return f"{t[0:4]}-{t[4:8]}-{t[8:12]}"


def _admission_verify_url(a: TheologyApplication) -> str:
    return f"{_public_base()}/verify/admission/{a.id}?sig={_admission_short_sig(_admission_signature(a))}"


async def _signatory(db: AsyncSession) -> dict:
    """Who signs the letter: the Registrar, or the deputy when one is named and
    made active. Falls back to the office title so a letter is never unsigned."""
    from routers.integrations import _settings_row
    row = await _settings_row(db)
    if not row:
        return {"name": "", "title": "Registrar", "signature_url": "", "role": "registrar"}
    use_deputy = (row.active_signatory or "").strip().lower() == "deputy" and bool(row.deputy_registrar_name)
    if use_deputy:
        return {
            "name": row.deputy_registrar_name or "",
            "title": row.deputy_registrar_title or "Deputy Registrar",
            "signature_url": row.deputy_registrar_signature_url or "",
            "role": "deputy",
        }
    return {
        "name": row.registrar_name or "",
        "title": row.registrar_title or "Registrar",
        "signature_url": row.registrar_signature_url or "",
        "role": "registrar",
    }


@router.get("/admission/{app_id}/qr.svg")
async def admission_qr(app_id: str, db: AsyncSession = Depends(get_db)):
    """QR chip for the printed admission letter. Encodes the verification URL so
    any phone camera lands on letw.org's check page. Deterministic pixel-based
    SVG so it renders identically on screen, in print preview and in a PDF."""
    from fastapi.responses import Response
    a = (await db.execute(select(TheologyApplication).where(TheologyApplication.id == app_id))).scalar_one_or_none()
    if not a or not a.admission_number:
        raise HTTPException(404, "No admission letter has been issued.")
    try:
        import qrcode
        from routers.marriage_prep import _qr_to_svg
        qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=0)
        qr.add_data(_admission_verify_url(a))
        qr.make(fit=True)
        svg = _qr_to_svg(qr.get_matrix(), box_size=8, border=2)
    except ImportError:
        raise HTTPException(503, "QR generation is unavailable on this server.")
    return Response(content=svg, media_type="image/svg+xml", headers={
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
    })


@router.get("/admission/{app_id}/verify")
async def verify_admission(app_id: str, sig: str = "", db: AsyncSession = Depends(get_db)):
    """Public check behind the QR code. Recomputes the HMAC server-side and
    compares — a letter that has been altered, or was never issued here, fails."""
    a = (await db.execute(select(TheologyApplication).where(TheologyApplication.id == app_id))).scalar_one_or_none()
    if not a or not a.admission_number:
        return {"valid": False, "reason": "No admission letter matches this code."}
    expected = _admission_short_sig(_admission_signature(a))
    if not sig or not hmac.compare_digest(sig.strip().lower(), expected):
        return {"valid": False, "reason": "This letter could not be verified. It may have been altered."}
    program = await _get_program(db, a.program_id)
    who = await _signatory(db)
    return {
        "valid": True,
        "full_name": a.full_name,
        "admission_number": a.offer_number or a.admission_number,
        "program_name": program.name if program else None,
        "level": program.level if program else None,
        "issued_at": a.admission_issued_at.isoformat() if a.admission_issued_at else None,
        "status": a.status,
        "photo_url": a.photo_url,
        "signed_by": f"{who['name']}, {who['title']}".strip(", "),
        "fingerprint": _admission_fingerprint(_admission_signature(a)),
    }


class RegistrarIn(BaseModel):
    registrar_name: Optional[str] = None
    registrar_title: Optional[str] = None
    registrar_signature_url: Optional[str] = None
    deputy_registrar_name: Optional[str] = None
    deputy_registrar_title: Optional[str] = None
    deputy_registrar_signature_url: Optional[str] = None
    deputy_registrar_user_id: Optional[str] = None
    active_signatory: Optional[str] = None


@router.get("/admin/registrar")
async def get_registrar(db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    from routers.integrations import _settings_row
    row = await _settings_row(db)
    eligible = (await db.execute(
        select(User).where(User.role.in_([UserRole.ADMIN, UserRole.DEPUTY_ADMIN_1,
                                          UserRole.DEPUTY_ADMIN_2, UserRole.DEPUTY_ADMIN_3]))
    )).scalars().all()
    return {
        "registrar_name": (row.registrar_name if row else "") or "",
        "registrar_title": (row.registrar_title if row else "") or "Registrar",
        "registrar_signature_url": (row.registrar_signature_url if row else "") or "",
        "deputy_registrar_name": (row.deputy_registrar_name if row else "") or "",
        "deputy_registrar_title": (row.deputy_registrar_title if row else "") or "Deputy Registrar",
        "deputy_registrar_signature_url": (row.deputy_registrar_signature_url if row else "") or "",
        "deputy_registrar_user_id": (row.deputy_registrar_user_id if row else "") or "",
        "active_signatory": (row.active_signatory if row else "") or "registrar",
        "eligible_deputies": [{"id": u.id, "name": u.name, "email": u.email,
                               "role": u.role.value if hasattr(u.role, "value") else str(u.role)}
                              for u in eligible],
    }


@router.put("/admin/registrar")
async def set_registrar(body: RegistrarIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    """Set who signs admission letters. The signature image is stored as an
    uploaded data-URL, the same way the church seal is."""
    from models.integration import IntegrationSettings
    row = (await db.execute(select(IntegrationSettings).where(IntegrationSettings.id == "default"))).scalar_one_or_none()
    if not row:
        row = IntegrationSettings(id="default")
        db.add(row)
    for field in ("registrar_name", "registrar_title", "registrar_signature_url",
                  "deputy_registrar_name", "deputy_registrar_title",
                  "deputy_registrar_signature_url", "deputy_registrar_user_id"):
        v = getattr(body, field)
        if v is not None:
            setattr(row, field, v.strip() or None)
    if body.active_signatory is not None:
        choice = body.active_signatory.strip().lower()
        if choice not in ("registrar", "deputy"):
            raise HTTPException(400, "active_signatory must be 'registrar' or 'deputy'.")
        if choice == "deputy" and not (row.deputy_registrar_name or "").strip():
            raise HTTPException(400, "Name a deputy registrar before making them the signatory.")
        row.active_signatory = choice
    await db.commit()
    return await get_registrar(db, _)


@router.get("/offer/{token}/letter.pdf")
async def download_letter_pdf(token: str, db: AsyncSession = Depends(get_db)):
    """The admission letter as a PDF, addressed by the candidate's own offer
    token. The same document that was emailed — identical whoever asks."""
    from fastapi.responses import Response
    a = await _by_token(db, token)
    program = await _get_program(db, a.program_id)
    ready, why = await _signatory_ready(db)
    if not ready:
        raise HTTPException(409, why)
    pdf = await _build_letter_pdf(db, a, program)
    if not pdf:
        raise HTTPException(500, "The letter could not be generated.")
    name = f"LETW-Admission-Letter-{(a.offer_number or a.admission_number or a.id)}.pdf"
    return Response(content=pdf, media_type="application/pdf", headers={
        "Content-Disposition": f'inline; filename="{name}"',
        "Cache-Control": "private, max-age=300",
    })


@router.post("/admin/applications/{app_id}/send-letter")
async def admin_send_letter(app_id: str, db: AsyncSession = Depends(get_db),
                            _: User = Depends(get_admin_user)):
    """Generate and email the letter again — for a candidate who accepted before
    a signatory was appointed, or who never received it."""
    a = (await db.execute(select(TheologyApplication).where(TheologyApplication.id == app_id))).scalar_one_or_none()
    if not a:
        raise HTTPException(404, "Application not found.")
    if a.status == "pending":
        raise HTTPException(400, "This applicant has not been admitted yet.")
    _ensure_offer_identity(a)
    await db.commit()
    program = await _get_program(db, a.program_id)
    r = await _deliver_letter(db, a, program)
    if not r["generated"]:
        raise HTTPException(409, r["reason"])
    if not r["sent"]:
        raise HTTPException(502, r["reason"] or "The letter was generated but could not be emailed.")
    return {"ok": True, "email": a.email, **_letter_urls(a)}


# ── First sign-in: the candidate chooses their own password ──────────────────

SETUP_TOKEN_DAYS = 14


def _mint_setup_token(a: TheologyApplication) -> str:
    from datetime import timedelta
    a.setup_token = secrets.token_urlsafe(32)
    a.setup_token_expires_at = datetime.utcnow() + timedelta(days=SETUP_TOKEN_DAYS)
    return a.setup_token


def _setup_url(a: TheologyApplication) -> str:
    return f"{_public_base()}/theology-school/setup/{a.setup_token}"


async def _by_setup_token(db: AsyncSession, token: str) -> TheologyApplication:
    t = (token or "").strip()
    a = (await db.execute(select(TheologyApplication).where(
        TheologyApplication.setup_token == t))).scalar_one_or_none() if t else None
    if not a:
        raise HTTPException(404, "This link is not valid. Ask the school office for a new one.")
    if a.setup_token_expires_at and a.setup_token_expires_at < datetime.utcnow():
        raise HTTPException(410, "This link has expired. Ask the school office for a new one.")
    return a


@router.get("/setup/{token}")
async def setup_details(token: str, db: AsyncSession = Depends(get_db)):
    """What to show on the choose-a-password form."""
    a = await _by_setup_token(db, token)
    program = await _get_program(db, a.program_id)
    return {
        "full_name": a.full_name,
        "email": a.email.lower(),
        "admission_number": a.offer_number or a.admission_number,
        "program_name": program.name if program else None,
        "portal_url": f"{_public_base()}/theology-school/student",
    }


class SetupIn(BaseModel):
    password: str


@router.post("/setup/{token}")
async def complete_setup(token: str, body: SetupIn, db: AsyncSession = Depends(get_db)):
    """Set the student's password and sign them straight in.

    This is how a candidate reaches their portal without depending on an email
    ever arriving — they hold the link from the moment they accept.
    """
    from models.user import UserRole, UserStatus
    from utils.security import hash_password, create_tokens

    a = await _by_setup_token(db, token)
    pw = (body.password or "").strip()
    if len(pw) < 8:
        raise HTTPException(400, "Choose a password of at least 8 characters.")

    email = a.email.lower()
    u = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if not u:
        u = User(id=str(uuid.uuid4()), name=a.full_name, email=email,
                 password_hash=hash_password(pw), role=UserRole.USER, status=UserStatus.ACTIVE)
        db.add(u)
    else:
        u.password_hash = hash_password(pw)
        u.status = UserStatus.ACTIVE
    a.student_user_id = u.id
    a.lms_username = email
    # Single use — the link cannot be replayed to take the account later.
    a.setup_token = None
    a.setup_token_expires_at = None
    a.initial_password = None
    if not a.first_login_at:
        a.first_login_at = datetime.utcnow()
    await db.commit()

    return {"ok": True, "email": email,
            "portal_url": f"{_public_base()}/theology-school/student",
            **create_tokens(u.id, email)}


@router.post("/admin/applications/{app_id}/reissue-password")
async def admin_reissue_password(app_id: str, db: AsyncSession = Depends(get_db),
                                 _: User = Depends(get_admin_user)):
    """Issue a fresh first password for a student who never received theirs.

    Replaces whatever they had, so use it only when the student cannot get in —
    it locks out anyone already signed in with the old one.
    """
    a = (await db.execute(select(TheologyApplication).where(TheologyApplication.id == app_id))).scalar_one_or_none()
    if not a:
        raise HTTPException(404, "Application not found.")
    if a.status not in ("accepted", "enrolled"):
        raise HTTPException(400, "This candidate has not accepted their offer yet.")
    u = (await db.execute(select(User).where(User.email == a.email.lower()))).scalar_one_or_none()
    if not u:
        raise HTTPException(404, "No student account exists for this candidate yet.")

    from utils.security import hash_password
    pw = _initial_password()
    u.password_hash = hash_password(pw)
    a.initial_password = pw
    a.initial_password_set_at = datetime.utcnow()
    a.first_login_at = None
    await db.commit()
    return {"ok": True, "email": a.email.lower(), "initial_password": pw,
            "note": "Works on letw.org and on live.letw.org. It disappears once the student signs in."}


@router.post("/admin/applications/{app_id}/setup-link")
async def admin_setup_link(app_id: str, db: AsyncSession = Depends(get_db),
                           _: User = Depends(get_admin_user)):
    """Mint a fresh sign-in link for a candidate to hand over directly — for
    anyone who missed the moment, or whose email never arrived."""
    a = (await db.execute(select(TheologyApplication).where(TheologyApplication.id == app_id))).scalar_one_or_none()
    if not a:
        raise HTTPException(404, "Application not found.")
    if a.status not in ("accepted", "enrolled"):
        raise HTTPException(400, "This candidate has not accepted their offer yet.")
    _mint_setup_token(a)
    await db.commit()
    return {"ok": True, "setup_url": _setup_url(a), "email": a.email,
            "expires_in_days": SETUP_TOKEN_DAYS}


# ── Applicant photograph ─────────────────────────────────────────────────────

MAX_PHOTO_BYTES = 6 * 1024 * 1024


async def _store_photo(a: TheologyApplication, request: Request, file: UploadFile, db: AsyncSession) -> dict:
    """Store a photograph against an application and return its hosted URL.

    Hosted rather than inline because sharepoints validates the field as a URL
    and would reject a data URI — and the same picture goes on the student ID.
    """
    contents = await file.read()
    if not contents:
        raise HTTPException(400, "That file is empty.")
    if len(contents) > MAX_PHOTO_BYTES:
        raise HTTPException(413, "Please use a photograph under 6MB.")
    if not (file.content_type or "").startswith("image/"):
        raise HTTPException(400, "Please upload an image.")

    mime = file.content_type or "image/jpeg"
    name = file.filename or "photo"
    try:
        from PIL import Image as _Image
        import io as _io
        img = _Image.open(_io.BytesIO(contents))
        img = img.convert("RGB")
        # Big enough to print cleanly in the letter's 25x31mm frame without
        # carrying a phone camera's full resolution into the database.
        img.thumbnail((900, 900))
        buf = _io.BytesIO()
        img.save(buf, format="WEBP", quality=85, method=6)
        contents = buf.getvalue()
        mime = "image/webp"
        name = (name.rsplit(".", 1)[0] if "." in name else name) + ".webp"
    except Exception:
        pass  # Pillow missing or an odd format — store what was sent.

    from models.cms import CMSImage
    image = CMSImage(filename=name, mime_type=mime, data=contents, size=len(contents))
    db.add(image)
    await db.commit()
    await db.refresh(image)

    scheme = request.headers.get("x-forwarded-proto") or request.url.scheme
    host = request.headers.get("x-forwarded-host") or request.url.netloc
    a.photo_url = f"{scheme}://{host}/api/cms/images/{image.id}"
    await db.commit()
    return {"ok": True, "photo_url": a.photo_url}


@router.post("/applications/{app_id}/photo")
async def upload_applicant_photo(
    app_id: str,
    request: Request,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """The applicant attaching their own photograph.

    Deliberately public — they supply this before they have an account. It is
    bounded by having to name an existing application that is still open.
    """
    a = (await db.execute(select(TheologyApplication).where(TheologyApplication.id == app_id))).scalar_one_or_none()
    if not a:
        raise HTTPException(404, "Application not found.")
    if a.status in ("enrolled", "declined"):
        raise HTTPException(400, "This application can no longer be edited. Contact the school office.")
    return await _store_photo(a, request, file, db)


@router.post("/admin/applications/{app_id}/photo")
async def admin_upload_photo(
    app_id: str,
    request: Request,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """The school office attaching a photograph on the applicant's behalf — for
    a paper application, or one that arrived without a usable picture. Not
    subject to the applicant-side guard: the office may correct a photo at any
    stage, including for a student already enrolled."""
    a = (await db.execute(select(TheologyApplication).where(TheologyApplication.id == app_id))).scalar_one_or_none()
    if not a:
        raise HTTPException(404, "Application not found.")
    return await _store_photo(a, request, file, db)


# ── The offer: view / accept / decline ───────────────────────────────────────

async def _by_token(db: AsyncSession, token: str) -> TheologyApplication:
    a = (await db.execute(select(TheologyApplication).where(TheologyApplication.acceptance_token == token))).scalar_one_or_none()
    if not a or not a.admission_number:
        raise HTTPException(404, "This offer link is not valid.")
    return a


@router.get("/offer/{token}")
async def view_offer(token: str, db: AsyncSession = Depends(get_db)):
    a = await _by_token(db, token)
    program = await _get_program(db, a.program_id)
    return {
        "full_name": a.full_name, "email": a.email,
        "admission_number": a.admission_number,
        "program_name": program.name if program else None,
        "duration_months": program.duration_months if program else None,
        "level": program.level if program else None,
        "issued_at": a.admission_issued_at.isoformat() if a.admission_issued_at else None,
        "status": a.status,
        "accepted_at": a.accepted_at.isoformat() if a.accepted_at else None,
        "portal_url": f"{_public_base()}/theology-school/student",
        "offer_number": a.offer_number,
        "offer_url": a.offer_url,
        "admission_letter_url": a.admission_letter_url,
        "letter_url": f"{_public_base()}/theology-school/offer/{token}/letter",
        "photo_url": a.photo_url,
        "qr_svg_url": f"{BACKEND_API_BASE}/theology/admission/{a.id}/qr.svg",
        "verify_url": _admission_verify_url(a),
        "fingerprint": _admission_fingerprint(_admission_signature(a)),
        "signatory": await _signatory(db),
        "tuition_amount": float(program.tuition_amount or 0) if program else None,
        "currency": (program.currency if program else None) or "NGN",
    }


@router.post("/offer/{token}/decline")
async def decline_offer(token: str, db: AsyncSession = Depends(get_db)):
    a = await _by_token(db, token)
    if a.status in ("accepted", "enrolled"):
        raise HTTPException(400, "This offer has already been accepted.")
    a.status = "declined"
    a.declined_at = datetime.utcnow()
    await db.commit()
    return {"status": a.status}


@router.post("/offer/{token}/accept")
async def accept_offer(token: str, db: AsyncSession = Depends(get_db)):
    """Accept the offer → create the student account, enrol on the LMS and push
    the record to sharepoints for student-ID issuance."""
    a = await _by_token(db, token)
    if a.status in ("accepted", "enrolled"):
        return {"status": a.status, "already": True}
    if a.status == "declined":
        raise HTTPException(400, "This offer was declined.")

    a.status = "accepted"
    a.accepted_at = datetime.utcnow()
    await db.commit()

    # Acceptance is what mints the student ID, and that transaction belongs to
    # sharepoints — tell it first, then take whatever identity it returns.
    program = await _get_program(db, a.program_id)
    payload = {
        "issuer": "letw.org",
        "event_id": f"accepted:{a.id}",
        "application_id": a.id,
        "admission_number": a.admission_number or "",
        "full_name": a.full_name,
        "email": a.email.lower(),
        "phone": a.phone or None,
        "photo_url": a.photo_url if (a.photo_url or "").startswith("http") else None,
        "program_code": _derive_code(program) if program else None,
        "course_code": (program.lms_course_code or _derive_code(program)) if program else "GENERAL",
        "duration_months": program.duration_months if program else None,
        "accepted_at": a.accepted_at.isoformat() + "Z",
        "enrolment_status": "pending",
    }
    if a.student_id_number:
        payload["student_id_number"] = a.student_id_number
    ev = await _post_event(db, "student-registry", payload)
    reg = ev.get("data") if ev.get("ok") else None
    if isinstance(reg, dict):
        # sharepoints hands back the identity it just minted, plus the journey
        # id that addresses this student on its later endpoints.
        a.bridge_enrollment_id = reg.get("enrollmentJourneyId") or a.bridge_enrollment_id
        if reg.get("studentIdNumber"):
            a.student_id_number = reg.get("studentIdNumber")
            if not a.student_id_issued_at:
                a.student_id_issued_at = datetime.utcnow()
        await db.commit()

    # The signed letter goes out now, on acceptance — not as a link to fetch.
    letter = await _deliver_letter(db, a, program)

    # And their own way into the portal, in this response, so reaching it never
    # depends on an email arriving.
    _mint_setup_token(a)
    await db.commit()

    password = await _provision_student(db, a)
    await db.refresh(a)
    return {"status": a.status, "student_created": bool(a.student_user_id),
            "letter": letter, "setup_url": _setup_url(a) if a.setup_token else None,
            "initial_password": a.initial_password,
            "login_email": a.email, "temporary_password_sent": bool(password),
            "student_id_number": a.student_id_number,
            "registry_synced": bool(reg),
            "portal_url": f"{_public_base()}/theology-school/student"}


# ── Provisioning: account → LMS → sharepoints ────────────────────────────────

async def _provision_student(db: AsyncSession, a: TheologyApplication) -> Optional[str]:
    """Create the letw.org student account (idempotent), email credentials, then
    fan out to the LMS and sharepoints. Returns the generated password if a new
    account was created."""
    from models.user import UserRole, UserStatus
    from utils.security import hash_password

    program = await _get_program(db, a.program_id)
    password: Optional[str] = None

    # 1) letw.org account — the SAME email is the login for live.letw.org.
    existing = (await db.execute(select(User).where(User.email == a.email.lower()))).scalar_one_or_none()
    if existing:
        a.student_user_id = existing.id
        # An applicant who already had a letw.org account keeps their own
        # password — we must never overwrite a credential they are using
        # elsewhere on the site.
        if not existing.password_hash:
            from utils.security import hash_password as _hp
            password = _initial_password()
            existing.password_hash = _hp(password)
    else:
        password = _initial_password()
        u = User(
            id=str(uuid.uuid4()),
            name=a.full_name,
            email=a.email.lower(),
            password_hash=hash_password(password),
            role=UserRole.USER,
            status=UserStatus.ACTIVE,
        )
        db.add(u)
        a.student_user_id = u.id
    a.lms_username = a.email.lower()
    if password:
        a.initial_password = password
        a.initial_password_set_at = datetime.utcnow()
    await db.commit()
    await db.refresh(a)

    # 2) Enrol on live.letw.org (best-effort, retryable).
    await _enrol_in_lms(db, a, program)

    # 3) The student ID is minted by sharepoints inside its own offer-acceptance
    #    transaction and pushed back to us at /integrations/student-id — there is
    #    nothing for us to push, and pushing one would fight its record.

    # 4) Email the student their portal + LMS credentials.
    try:
        from services.email_service import send_email
        pw_block = (
            f'<p><strong>Temporary password:</strong> {password}<br>'
            f'<span style="font-size:12px;color:#6b7280">Please change it after your first sign-in.</span></p>'
            if password else
            '<p>Sign in with your existing LETW account password.</p>'
        )
        await send_email(
            a.email, "Your student account is ready",
            f'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">'
            f'<div style="background:#140152;color:#fff;padding:22px;border-radius:14px 14px 0 0">'
            f'<h2 style="margin:0;color:#f5bb00">Welcome to LETW Theology School</h2></div>'
            f'<div style="border:1px solid #eee;border-top:none;padding:22px;border-radius:0 0 14px 14px">'
            f'<p>Dear {a.full_name},</p>'
            f'<p>Your place on <strong>{program.name if program else "your programme"}</strong> is confirmed '
            f'(admission number <strong>{a.admission_number}</strong>).</p>'
            f'<p><strong>Username (both portals):</strong> {a.email.lower()}</p>{pw_block}'
            f'<p><a href="{_public_base()}/theology-school/student" '
            f'style="background:#140152;color:#fff;text-decoration:none;font-weight:bold;padding:11px 20px;border-radius:999px">'
            f'Open your student dashboard</a></p>'
            f'<p style="margin-top:14px"><a href="https://live.letw.org/login">Go to your classroom (live.letw.org)</a></p>'
            f'<p style="font-size:12px;color:#6b7280">Never share your password. If you think your account has been '
            f'compromised, use “Forgot password” immediately or contact the school office — we can lock and restore '
            f'your account.</p>'
            f'<p style="font-size:12px;color:#6b7280">Light Encounter Tabernacle Worldwide</p></div></div>'
        )
    except Exception as e:
        print(f"[theology] credentials email failed: {type(e).__name__}: {e}", flush=True)

    return password


async def _lms_settings(db: AsyncSession):
    """LMS connection settings (admin-managed, env fallback)."""
    from config import settings as cfg
    base = getattr(cfg, "LMS_BASE_URL", "") or "https://live.letw.org"
    key = getattr(cfg, "LMS_API_KEY", "") or ""
    path = getattr(cfg, "LMS_ENROL_PATH", "") or ""
    try:
        from models.integration import IntegrationSettings
        row = (await db.execute(select(IntegrationSettings).where(IntegrationSettings.id == "default"))).scalar_one_or_none()
        if row:
            base = (getattr(row, "lms_base_url", None) or base)
            key = (getattr(row, "lms_api_key", None) or key)
            path = (getattr(row, "lms_enrol_path", None) or path)
    except Exception:
        pass
    return base.rstrip("/"), key, path.strip()


async def _enrol_in_lms(db: AsyncSession, a: TheologyApplication, program: Optional[TheologyProgram]) -> None:
    """Create/enrol the student on live.letw.org.

    The LMS is a bespoke PHP app whose enrolment endpoint path is configured by
    an admin (LMS_ENROL_PATH). Until it is set we record the intent as pending
    so the admin page can retry once the path is known — the acceptance and the
    student account are never blocked by it.
    """
    base, key, path = await _lms_settings(db)
    if not path:
        # Normal operation: the classroom (live.letw.org) pulls admitted students
        # from /api/theology/lms/enrolments and creates the seat itself, then
        # confirms back. Nothing to push — this is not an error.
        a.lms_status = a.lms_status or "awaiting_classroom"
        a.lms_error = None
        await db.commit()
        return
    payload = {
        "email": a.email.lower(),
        "name": a.full_name,
        "phone": a.phone,
        "admission_number": a.admission_number,
        "program": program.name if program else None,
        "course_code": program.lms_course_code if program else None,
        "source": "letw.org",
    }
    try:
        import httpx
        url = path if path.startswith("http") else f"{base}/{path.lstrip('/')}"
        async with httpx.AsyncClient(timeout=20) as cli:
            r = await cli.post(url, json=payload, headers={
                "X-API-Key": key, "Authorization": f"Bearer {key}", "Accept": "application/json",
            })
        if 200 <= r.status_code < 300:
            a.lms_status = "enrolled"
            a.lms_enrolled_at = datetime.utcnow()
            a.lms_error = None
            if a.status == "accepted":
                a.status = "enrolled"
        else:
            a.lms_status = "failed"
            a.lms_error = f"LMS responded {r.status_code}: {r.text[:300]}"
    except Exception as e:
        a.lms_status = "failed"
        a.lms_error = f"{type(e).__name__}: {e}"
    await db.commit()


# ── Server-to-server: sharepoints posts the issued student ID back ───────────

@router.post("/integrations/student-id")
async def receive_student_id(
    body: dict,
    x_api_key: str = Header(default=""),
    db: AsyncSession = Depends(get_db),
):
    from routers.integrations import _effective_key
    expected = await _effective_key(db)
    if not expected:
        raise HTTPException(503, "Partner integration is not configured yet.")
    if not x_api_key or not hmac.compare_digest(x_api_key.strip(), expected):
        raise HTTPException(401, "Invalid or missing X-API-Key.")
    def pick(*keys: str) -> str:
        """sharepoints speaks camelCase; earlier drafts of this endpoint spoke
        snake_case. Accept either so a redeploy on one side never breaks it."""
        for k in keys:
            v = body.get(k)
            if isinstance(v, str) and v.strip():
                return v.strip()
        return ""

    app_id = pick("applicationId", "application_id")
    offer_no = pick("offerNumber", "offer_number", "admission_number")
    a = None
    if app_id:
        a = (await db.execute(select(TheologyApplication).where(TheologyApplication.id == app_id))).scalar_one_or_none()
    if not a and offer_no:
        a = (await db.execute(select(TheologyApplication).where(
            TheologyApplication.admission_number == offer_no))).scalar_one_or_none()
        if not a:
            a = (await db.execute(select(TheologyApplication).where(
                TheologyApplication.offer_number == offer_no))).scalar_one_or_none()
    if not a:
        raise HTTPException(404, "No student matches that application or offer number.")

    number = pick("studentIdNumber", "student_id_number")
    if not number:
        raise HTTPException(422, "studentIdNumber is required.")
    a.student_id_number = number
    # The verification page is the card as far as letw.org is concerned — it is
    # the link the student and the office open to prove the ID is genuine.
    card = pick("cardUrl", "card_url", "idCardUrl", "id_card_url")
    verify = pick("verificationUrl", "verification_url")
    a.student_id_card_url = card or verify or a.student_id_card_url
    a.student_id_issued_at = datetime.utcnow()
    if not a.offer_number and offer_no:
        a.offer_number = offer_no
    if a.status == "accepted":
        a.status = "enrolled"
    if card:
        _add_document(a, "student_id_card", "Student ID card", card, number)
    if verify:
        _add_document(a, "student_id_verification", "Verify this student ID", verify, number)
    await db.commit()
    await _notify_document(db, a, "Your student ID has been issued",
                           f"Your student ID number is <strong>{number}</strong>.",
                           card or verify)
    return {"ok": True, "application_id": a.id, "admission_number": a.admission_number,
            "student_id_number": a.student_id_number,
            "documents": len(a.documents or [])}


async def _notify_document(db: AsyncSession, a: TheologyApplication, subject: str,
                           lead: str, url: Optional[str]) -> bool:
    """Tell the student a document is ready, and link straight to it."""
    portal = f"{_public_base()}/theology-school/student"
    button = (f'<p style="margin:24px 0"><a href="{url}" style="background:#140152;color:#fff;'
              f'text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px">'
              f'Open it</a></p>') if url else ""
    try:
        from services.email_service import send_email
        ok = await send_email(
            a.email, f"{subject} — {a.admission_number}",
            f'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">'
            f'<div style="background:#140152;color:#fff;padding:22px;border-radius:14px 14px 0 0">'
            f'<h2 style="margin:0;color:#f5bb00">{subject}</h2></div>'
            f'<div style="border:1px solid #eee;border-top:none;padding:22px;border-radius:0 0 14px 14px">'
            f'<p>Dear {a.full_name},</p><p>{lead}</p>{button}'
            f'<p>Everything issued to you is kept in your student portal:</p>'
            f'<p><a href="{portal}" style="color:#140152;font-weight:bold">Open your student portal</a></p>'
            f'<p style="font-size:12px;color:#6b7280">Light Encounter Tabernacle Worldwide · School of Theology</p>'
            f'</div></div>'
        )
        if ok and _email_delivery()["live"] and "student ID" in subject:
            a.student_id_email_sent_at = datetime.utcnow()
            await db.commit()
        return bool(ok) and _email_delivery()["live"]
    except Exception as e:
        print(f"[theology] document email failed for {a.email}: {type(e).__name__}: {e}", flush=True)
        return False


async def notify_payment_lifecycle(db: AsyncSession, reference: str, event_type: str,
                                  amount=None, currency: Optional[str] = None,
                                  reason: Optional[str] = None) -> Optional[dict]:
    """Tell sharepoints that a settled theology payment was taken back.

    SharePoints gates admission on an exact, verified payment, so a refund or
    chargeback after admission has to reach it — otherwise the student keeps the
    offer, the student ID and classroom access for money the church no longer
    holds. No-ops when the reference is not a theology payment.
    """
    ref = (reference or "").strip()
    if not ref:
        return None
    a = (await db.execute(select(TheologyApplication).where(
        TheologyApplication.payment_reference == ref))).scalar_one_or_none()
    if not a:
        return None
    program = await _get_program(db, a.program_id)
    if not program:
        return None
    from routers.integrations import _effective_key
    key = await _effective_key(db)
    if not key:
        return {"ok": False, "reason": "Shared secret not set."}

    payload = {
        "eventId": f"{event_type.lower()}:{ref}",
        "source": "letw.org",
        "applicationId": a.id,
        "paymentReference": ref,
        "programCode": _derive_code(program),
        "eventType": event_type,
        "amount": f"{float(amount if amount is not None else (a.amount_paid or 0)):.2f}",
        "currency": (currency or a.currency or program.currency or "NGN").upper()[:3],
        "reason": (reason or "Reported by letw.org from the payment provider.")[:1000],
        "occurredAt": datetime.utcnow().isoformat() + "Z",
    }
    url = (await _intake_url(db)).rstrip("/").rsplit("/", 1)[0] + "/payments"
    try:
        import httpx
        async with httpx.AsyncClient(timeout=20) as cli:
            r = await cli.post(url, json=payload, headers={"X-API-Key": key})
        ok = 200 <= r.status_code < 300
        if not ok:
            print(f"[theology] payment lifecycle {event_type} for {ref} -> {r.status_code}: {r.text[:200]}", flush=True)
        return {"ok": ok, "status": r.status_code, "event": event_type}
    except Exception as e:
        print(f"[theology] payment lifecycle push failed: {type(e).__name__}: {e}", flush=True)
        return {"ok": False, "reason": f"{type(e).__name__}: {e}"}


@router.post("/admin/applications/{app_id}/report-refund")
async def admin_report_refund(app_id: str, event_type: str = "REFUND",
                              db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    """Report a refund/chargeback to sharepoints by hand, for money taken back
    outside the payment webhooks (a bank reversal, a manual transfer)."""
    allowed = {"REFUND", "CHARGEBACK", "REVERSAL", "PAYMENT_FAILED", "PAYMENT_CORRECTED"}
    event_type = (event_type or "REFUND").upper()
    if event_type not in allowed:
        raise HTTPException(400, f"event_type must be one of {', '.join(sorted(allowed))}.")
    a = (await db.execute(select(TheologyApplication).where(TheologyApplication.id == app_id))).scalar_one_or_none()
    if not a:
        raise HTTPException(404, "Application not found.")
    if not a.payment_reference:
        raise HTTPException(400, "This application has no payment reference to report.")
    r = await notify_payment_lifecycle(db, a.payment_reference, event_type,
                                       reason="Reported by an administrator on letw.org.")
    if not r:
        raise HTTPException(400, "Could not match that payment to a theology application.")
    if not r.get("ok"):
        raise HTTPException(502, r.get("reason") or f"sharepoints responded {r.get('status')}.")
    return r


@router.post("/integrations/documents")
async def receive_document(
    body: dict,
    x_api_key: str = Header(default=""),
    db: AsyncSession = Depends(get_db),
):
    """Receive a document sharepoints has issued for one of our students.

    Deliberately open about what a document is — ID card, certificate,
    transcript, statement of result. sharepoints owns issuance, so a new
    document type should reach the student's portal without letw.org needing a
    schema change or a deploy.
    """
    from routers.integrations import _effective_key
    expected = await _effective_key(db)
    if not expected:
        raise HTTPException(503, "Partner integration is not configured yet.")
    if not x_api_key or not hmac.compare_digest(x_api_key.strip(), expected):
        raise HTTPException(401, "Invalid or missing X-API-Key.")

    def pick(*keys: str) -> str:
        for k in keys:
            v = body.get(k)
            if isinstance(v, str) and v.strip():
                return v.strip()
        return ""

    app_id = pick("applicationId", "application_id")
    ref = pick("admissionNumber", "admission_number", "offerNumber", "offer_number")
    a = None
    if app_id:
        a = (await db.execute(select(TheologyApplication).where(TheologyApplication.id == app_id))).scalar_one_or_none()
    if not a and ref:
        a = (await db.execute(select(TheologyApplication).where(
            TheologyApplication.admission_number == ref))).scalar_one_or_none()
        if not a:
            a = (await db.execute(select(TheologyApplication).where(
                TheologyApplication.offer_number == ref))).scalar_one_or_none()
    if not a:
        raise HTTPException(404, "No student matches that application or admission number.")

    url = pick("url", "documentUrl", "document_url", "fileUrl", "file_url")
    if not url:
        raise HTTPException(422, "A document url is required.")
    kind = (pick("kind", "type", "documentType", "document_type") or "document").lower()[:60]
    title = pick("title", "name") or kind.replace("_", " ").title()
    number = pick("number", "documentNumber", "document_number", "certificateNumber", "certificate_number") or None
    issued = pick("issuedAt", "issued_at") or None

    is_new = _add_document(a, kind, title, url, number, issued)
    # An ID card arriving this way should still populate the field the portal
    # and the letter already read.
    if kind in ("student_id_card", "id_card", "studentid") and not a.student_id_card_url:
        a.student_id_card_url = url
    if number and kind.startswith("student_id") and not a.student_id_number:
        a.student_id_number = number
    await db.commit()

    if is_new:
        await _notify_document(db, a, f"Your {title.lower()} is ready",
                               f"The school office has issued your {title.lower()}.", url)
    return {"ok": True, "application_id": a.id, "kind": kind,
            "duplicate": not is_new, "documents": len(a.documents or [])}


@router.post("/admin/applications/{app_id}/resend-admission-email")
async def admin_resend_admission_email(app_id: str, db: AsyncSession = Depends(get_db),
                                       _: User = Depends(get_admin_user)):
    """Send the admission letter email again — for a candidate who never got it."""
    a = (await db.execute(select(TheologyApplication).where(TheologyApplication.id == app_id))).scalar_one_or_none()
    if not a:
        raise HTTPException(404, "Application not found.")
    if a.status == "pending":
        raise HTTPException(400, "This applicant has not been admitted yet.")
    _ensure_offer_identity(a)
    await db.commit()
    program = await _get_program(db, a.program_id)
    sent = await _send_admission_email(db, a, program)
    if not sent:
        d = _email_delivery()
        raise HTTPException(502, d["reason"] or "The email could not be sent. Check the mail provider settings.")
    return {"ok": True, "email": a.email, **_letter_urls(a)}


async def _fetch_credentials(db: AsyncSession, a: TheologyApplication) -> dict:
    """Pull this student's current ID and certificates from sharepoints.

    Pulling matters as much as being pushed to: a webhook that never fires
    leaves a student staring at "being processed" forever, and only sharepoints
    knows when a certificate has been revoked or replaced. This is the
    authoritative read, so what it returns replaces what we held.
    """
    ref = (a.offer_number or a.admission_number or "").strip()
    if not ref:
        return {"ok": False, "reason": "This student has no admission number yet."}
    from routers.integrations import _effective_key
    key = await _effective_key(db)
    if not key:
        return {"ok": False, "reason": "Shared secret not set (Admin -> Integrations)."}

    base = (await _intake_url(db)).rstrip("/").rsplit("/", 1)[0]
    url = f"{base}/credentials"
    try:
        import httpx
        async with httpx.AsyncClient(timeout=20) as cli:
            r = await cli.get(url, params={"admission_number": ref}, headers={"X-API-Key": key})
    except Exception as e:
        print(f"[theology] credential pull failed for {ref}: {type(e).__name__}: {e}", flush=True)
        return {"ok": False, "reason": f"{type(e).__name__}: {e}"}

    if r.status_code == 404:
        return {"ok": False, "not_found": True,
                "reason": "sharepoints has no accepted student under that admission number yet."}
    if not (200 <= r.status_code < 300):
        return {"ok": False, "reason": f"sharepoints responded {r.status_code}: {r.text[:200]}"}

    body = r.json() or {}
    data = body.get("data") if isinstance(body.get("data"), dict) else body
    reg = data.get("credentialRegistry") if isinstance(data, dict) else None
    if not isinstance(reg, dict):
        return {"ok": False, "reason": "sharepoints returned an unexpected credential payload."}

    # ── Student ID ──────────────────────────────────────────────────────────
    sid = reg.get("studentId") if isinstance(reg.get("studentId"), dict) else None
    if sid and sid.get("number"):
        a.student_id_number = str(sid["number"])
        if sid.get("verificationUrl"):
            a.student_id_card_url = str(sid["verificationUrl"])
        if not a.student_id_issued_at:
            a.student_id_issued_at = datetime.utcnow()

    # ── Certificates ────────────────────────────────────────────────────────
    # Rebuilt wholesale rather than merged: a certificate that has been revoked
    # or replaced disappears from the registry, and it has to disappear from the
    # student's portal too. Merging would leave a revoked one on display.
    kept = [d for d in list(a.documents or []) if d.get("kind") != "certificate"]
    live = 0
    for cert in (reg.get("certificates") or []):
        if not isinstance(cert, dict):
            continue
        if cert.get("revokedAt") or str(cert.get("status") or "").upper() in ("REVOKED", "REPLACED"):
            continue
        vurl = cert.get("verificationUrl")
        if not vurl:
            continue
        kept.append({
            "kind": "certificate",
            "title": cert.get("title") or "Certificate",
            # sharepoints marks the PDF SHAREPOINTS_AUTHORIZED, so the
            # verification page is the only link we are entitled to hand out.
            "url": str(vurl),
            "number": cert.get("number"),
            "source": "sharepoints.letw.org",
            "issued_at": cert.get("issuedAt"),
        })
        live += 1

    if sid and sid.get("number") and sid.get("verificationUrl"):
        kept = [d for d in kept if d.get("kind") != "student_id_verification"]
        kept.append({
            "kind": "student_id_verification",
            "title": "Student ID card",
            "url": str(sid["verificationUrl"]),
            "number": sid.get("number"),
            "source": "sharepoints.letw.org",
            "issued_at": sid.get("issuedAt"),
        })

    a.documents = kept
    await db.commit()
    return {"ok": True, "student_id_number": a.student_id_number,
            "certificates": live, "documents": len(kept),
            "classroom_status": (reg.get("synchronization") or {}).get("classroomStatus")}


@router.post("/student/credentials")
async def refresh_my_credentials(db: AsyncSession = Depends(get_db),
                                 user: User = Depends(get_current_active_user)):
    """Let a student pull their own ID and certificates on demand."""
    a = (await db.execute(
        select(TheologyApplication)
        .where(TheologyApplication.email == user.email.lower(),
               TheologyApplication.status.in_(["accepted", "enrolled"]))
        .order_by(desc(TheologyApplication.accepted_at))
    )).scalars().first()
    if not a:
        raise HTTPException(404, "No active theology enrolment for this account.")
    r = await _fetch_credentials(db, a)
    await db.refresh(a)
    return {**r, "documents_list": list(a.documents or []),
            "student_id_number": a.student_id_number}


@router.post("/admin/applications/{app_id}/refresh-credentials")
async def admin_refresh_credentials(app_id: str, db: AsyncSession = Depends(get_db),
                                    _: User = Depends(get_admin_user)):
    """Pull a student's current ID and certificates from sharepoints."""
    a = (await db.execute(select(TheologyApplication).where(TheologyApplication.id == app_id))).scalar_one_or_none()
    if not a:
        raise HTTPException(404, "Application not found.")
    r = await _fetch_credentials(db, a)
    if not r.get("ok"):
        raise HTTPException(404 if r.get("not_found") else 502, r.get("reason") or "Could not read the credentials.")
    return r


# ── Student dashboard ────────────────────────────────────────────────────────

@router.post("/student/classroom")
async def student_classroom(db: AsyncSession = Depends(get_db),
                            user: User = Depends(get_current_active_user)):
    """Everything the student needs to get into their classroom, and one more
    attempt at the seat if it is not there yet.

    The classroom never blocks entry from here: live.letw.org authenticates
    against this account through /lms/auth/verify, so a student can sign in and
    be recognised even while their seat is still being created.
    """
    a = (await db.execute(
        select(TheologyApplication)
        .where(TheologyApplication.email == user.email.lower(),
               TheologyApplication.status.in_(["accepted", "enrolled"]))
        .order_by(desc(TheologyApplication.accepted_at))
    )).scalars().first()
    if not a:
        raise HTTPException(404, "No active theology enrolment for this account.")

    program = await _get_program(db, a.program_id)
    if a.lms_status != "enrolled":
        # Best-effort nudge — pushes the seat if a path is configured, otherwise
        # simply leaves it queued for the classroom to pull.
        await _enrol_in_lms(db, a, program)
        await db.refresh(a)

    base, _key, _path = await _lms_settings(db)
    return {
        "classroom_url": f"{(base or 'https://live.letw.org').rstrip('/')}/login",
        "login_email": a.email.lower(),
        "admission_number": a.offer_number or a.admission_number,
        "course_code": (program.lms_course_code or program.program_code) if program else None,
        "program_name": program.name if program else None,
        "seat_status": a.lms_status or "awaiting_classroom",
        "seat_ready": a.lms_status == "enrolled",
        "note": ("Your seat is confirmed." if a.lms_status == "enrolled"
                 else "Your seat is still being created. You can sign in now — "
                      "the classroom will recognise your letw.org account."),
    }


@router.get("/student/me")
async def my_student_record(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_active_user)):
    res = await db.execute(
        select(TheologyApplication)
        .where(TheologyApplication.student_user_id == user.id)
        .order_by(desc(TheologyApplication.created_at))
    )
    apps = res.scalars().all()
    if not apps:
        res2 = await db.execute(
            select(TheologyApplication)
            .where(TheologyApplication.email == user.email.lower())
            .order_by(desc(TheologyApplication.created_at))
        )
        apps = res2.scalars().all()
    out = []
    for a in apps:
        # A student with no ID yet is the case where a push may simply never
        # have arrived, so ask sharepoints directly rather than showing them
        # "being processed" indefinitely. Best-effort and bounded to that case.
        if a.status in ("accepted", "enrolled") and not a.student_id_number:
            try:
                await _fetch_credentials(db, a)
                await db.refresh(a)
            except Exception as e:
                print(f"[theology] credential top-up failed: {type(e).__name__}: {e}", flush=True)
        p = await _get_program(db, a.program_id)
        out.append(_app_out(a, p))
    return {"records": out, "classroom_url": "https://live.letw.org/login"}


# ── Admin ────────────────────────────────────────────────────────────────────

class ProgramIn(BaseModel):
    name: str
    slug: Optional[str] = None
    summary: Optional[str] = None
    description: Optional[str] = None
    level: str = "certificate"
    duration_months: int = 12
    tuition_amount: float = 0
    currency: str = "NGN"
    lms_course_code: Optional[str] = None
    program_code: Optional[str] = None
    is_open: bool = True
    capacity: Optional[int] = None
    sort_order: int = 0


@router.get("/admin/programs")
async def admin_programs(db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(TheologyProgram).order_by(TheologyProgram.sort_order, TheologyProgram.name))
    return [_program_out(p) for p in res.scalars().all()]


@router.post("/admin/programs", status_code=201)
async def create_program(body: ProgramIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    data = body.model_dump()
    data["slug"] = (data.get("slug") or body.name.lower().replace(" ", "-"))[:120]
    p = TheologyProgram(**data)
    db.add(p)
    await db.commit()
    await db.refresh(p)
    return _program_out(p)


@router.put("/admin/programs/{pid}")
async def update_program(pid: str, body: ProgramIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    p = await _get_program(db, pid)
    if not p:
        raise HTTPException(404, "Programme not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        if k == "slug" and not v:
            continue
        setattr(p, k, v)
    await db.commit()
    await db.refresh(p)
    return _program_out(p)


@router.delete("/admin/programs/{pid}")
async def delete_program(pid: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    p = await _get_program(db, pid)
    if not p:
        return {"deleted": 0}
    await db.delete(p)
    await db.commit()
    return {"deleted": 1}


@router.get("/admin/applications")
async def admin_applications(status: Optional[str] = None, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    q = select(TheologyApplication).order_by(desc(TheologyApplication.created_at))
    if status:
        q = q.where(TheologyApplication.status == status)
    apps = (await db.execute(q.limit(500))).scalars().all()
    out = []
    for a in apps:
        out.append(_app_out(a, await _get_program(db, a.program_id)))
    return out


@router.post("/admin/applications/{app_id}/mark-paid")
async def admin_mark_paid(app_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    """Manual fallback: confirm an offline/one-off payment and admit."""
    a = (await db.execute(select(TheologyApplication).where(TheologyApplication.id == app_id))).scalar_one_or_none()
    if not a:
        raise HTTPException(404, "Application not found")
    program = await _get_program(db, a.program_id)
    if not program:
        raise HTTPException(404, "Programme not found")
    if not a.paid_at:
        a.paid_at = datetime.utcnow()
        a.amount_paid = program.tuition_amount
        a.currency = program.currency
        a.status = "paid"
        await db.commit()
    await _issue_admission(db, a, program)
    return _app_out(a, program)


@router.post("/admin/applications/{app_id}/retry-provisioning")
async def admin_retry(app_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    """Re-run LMS enrolment + sharepoints push for an accepted student."""
    a = (await db.execute(select(TheologyApplication).where(TheologyApplication.id == app_id))).scalar_one_or_none()
    if not a:
        raise HTTPException(404, "Application not found")
    if a.status not in ("accepted", "enrolled"):
        raise HTTPException(400, "Student has not accepted their offer yet.")
    program = await _get_program(db, a.program_id)
    await _enrol_in_lms(db, a, program)
    await db.refresh(a)
    return _app_out(a, program)


@router.post("/admin/applications/{app_id}/reset-access")
async def admin_reset_access(app_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    """Security recovery: if a student account is compromised, regenerate the
    password, email the student, and re-sync the LMS so old sessions/credentials
    no longer work."""
    from utils.security import hash_password
    a = (await db.execute(select(TheologyApplication).where(TheologyApplication.id == app_id))).scalar_one_or_none()
    if not a or not a.student_user_id:
        raise HTTPException(404, "No student account for this application.")
    u = (await db.execute(select(User).where(User.id == a.student_user_id))).scalar_one_or_none()
    if not u:
        raise HTTPException(404, "Student user not found.")
    new_password = _gen_password()
    u.password_hash = hash_password(new_password)
    await db.commit()

    program = await _get_program(db, a.program_id)
    await _enrol_in_lms(db, a, program)   # re-sync credentials downstream

    try:
        from services.email_service import send_email
        await send_email(
            u.email, "Your student account has been secured",
            f'<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">'
            f'<h2 style="color:#140152">Account secured</h2>'
            f'<p>Dear {a.full_name},</p>'
            f'<p>Your student account password has been reset by the school office.</p>'
            f'<p><strong>Username:</strong> {u.email}<br><strong>New temporary password:</strong> {new_password}</p>'
            f'<p>Please sign in and change it immediately. If you did not expect this, contact the school office at once.</p>'
            f'<p style="font-size:12px;color:#6b7280">Light Encounter Tabernacle Worldwide</p></div>'
        )
    except Exception as e:
        print(f"[theology] reset email failed: {type(e).__name__}: {e}", flush=True)
    return {"ok": True, "email": u.email, "lms_status": a.lms_status}


# ── LMS-facing API: live.letw.org pulls and handles enrolment itself ─────────
#
# The classroom (live.letw.org) owns enrolment. Rather than letw.org pushing
# into the LMS, the LMS calls these endpoints on its own schedule:
#
#   GET  /api/theology/lms/enrolments            who is admitted and needs a seat
#   POST /api/theology/lms/enrolments/{adm}/confirm   report the seat was created
#   POST /api/theology/lms/auth/verify           sign a student in with their
#                                                letw.org email + password
#
# All three are machine-to-machine and require the shared LMS key in X-API-Key
# (Admin → Integrations → LMS), so no LMS endpoint contract is needed here.

async def _lms_key(db: AsyncSession) -> str:
    from config import settings as cfg
    try:
        from models.integration import IntegrationSettings
        row = (await db.execute(select(IntegrationSettings).where(IntegrationSettings.id == "default"))).scalar_one_or_none()
        if row and (getattr(row, "lms_api_key", None) or "").strip():
            return row.lms_api_key.strip()
    except Exception:
        pass
    return (getattr(cfg, "LMS_API_KEY", "") or "").strip()


async def _require_lms(db: AsyncSession, x_api_key: str) -> None:
    expected = await _lms_key(db)
    if not expected:
        raise HTTPException(503, "LMS integration key is not configured yet (Admin → Integrations).")
    if not x_api_key or not hmac.compare_digest(x_api_key.strip(), expected):
        raise HTTPException(401, "Invalid or missing X-API-Key.")


def _lms_student(a: TheologyApplication, program: Optional[TheologyProgram]) -> dict:
    return {
        "admission_number": a.admission_number,
        "application_id": a.id,
        "full_name": a.full_name,
        "email": (a.email or "").lower(),          # the LMS username
        "phone": a.phone,
        "program": program.name if program else None,
        "course_code": program.lms_course_code if program else None,
        "program_code": program.program_code if program else None,
        "duration_months": program.duration_months if program else None,
        "accepted_at": a.accepted_at.isoformat() if a.accepted_at else None,
        "enrolment_status": a.lms_status or "pending",
        "student_id_number": a.student_id_number,
        "issuer": "letw.org",
    }


@router.get("/lms/enrolments")
async def lms_list_enrolments(
    status: str = "pending",
    limit: int = 200,
    x_api_key: str = Header(default=""),
    db: AsyncSession = Depends(get_db),
):
    """Students the classroom should enrol.

    `status=pending` (default) returns everyone who has accepted their offer but
    has no confirmed seat yet. `status=all` returns every accepted student.
    """
    await _require_lms(db, x_api_key)
    q = select(TheologyApplication).where(TheologyApplication.status.in_(["accepted", "enrolled"]))
    if status == "pending":
        q = q.where((TheologyApplication.lms_status.is_(None)) | (TheologyApplication.lms_status != "enrolled"))
    rows = (await db.execute(q.order_by(desc(TheologyApplication.accepted_at)).limit(min(max(limit, 1), 500)))).scalars().all()
    out = []
    for a in rows:
        out.append(_lms_student(a, await _get_program(db, a.program_id)))
    return {"count": len(out), "students": out}


class LmsConfirmIn(BaseModel):
    enrolled: bool = True
    lms_user_id: Optional[str] = None
    course_code: Optional[str] = None
    note: Optional[str] = None


@router.post("/lms/enrolments/{admission_number}/confirm")
async def lms_confirm_enrolment(
    admission_number: str,
    body: LmsConfirmIn,
    x_api_key: str = Header(default=""),
    db: AsyncSession = Depends(get_db),
):
    """The classroom reports that it created (or failed to create) the seat."""
    await _require_lms(db, x_api_key)
    ref = (admission_number or "").strip()
    a = (await db.execute(select(TheologyApplication).where(TheologyApplication.admission_number == ref))).scalar_one_or_none()
    if not a:
        raise HTTPException(404, "No student matches that admission number.")
    if body.enrolled:
        a.lms_status = "enrolled"
        a.lms_enrolled_at = datetime.utcnow()
        a.lms_error = None
        if a.status == "accepted":
            a.status = "enrolled"
    else:
        a.lms_status = "failed"
        a.lms_error = (body.note or "The classroom reported an enrolment failure.")[:1000]
    await db.commit()

    # Forward to sharepoints so the academic record moves with the seat. A
    # confirmed seat also makes it push the student ID back to us.
    await _post_event(db, "classroom-status", {
        **_journey(a),
        "status": "PROVISIONED" if body.enrolled else "FAILED",
        **({"lms_user_id": body.lms_user_id} if body.lms_user_id else {}),
        **({"loginEmail": a.email.lower()} if body.enrolled else {}),
        **({} if body.enrolled else {"error": (body.note or "The classroom reported an enrolment failure.")[:1000]}),
    })
    return {"ok": True, "admission_number": ref, "enrolment_status": a.lms_status}


class LmsAuthIn(BaseModel):
    email: EmailStr
    password: str


class LmsCourseProgressIn(BaseModel):
    course_code: str
    course_title: str
    status: str = "IN_PROGRESS"
    progress_percent: float = 0
    attendance_percent: Optional[float] = None
    assessment_score: Optional[float] = None
    grade: Optional[str] = None
    completed_at: Optional[str] = None


class LmsProgressIn(BaseModel):
    event_id: str
    occurred_at: Optional[str] = None
    academic_standing: Optional[str] = None
    courses: List[LmsCourseProgressIn]


@router.post("/lms/enrolments/{admission_number}/progress")
async def lms_report_progress(
    admission_number: str,
    body: LmsProgressIn,
    x_api_key: str = Header(default=""),
    db: AsyncSession = Depends(get_db),
):
    """The classroom reports grades and attendance; we forward them to
    sharepoints, which keeps the academic record and issues the transcript.

    `event_id` makes retries safe — sharepoints de-duplicates on it."""
    await _require_lms(db, x_api_key)
    ref = (admission_number or "").strip()
    a = (await db.execute(select(TheologyApplication).where(
        TheologyApplication.admission_number == ref))).scalar_one_or_none()
    if not a:
        a = (await db.execute(select(TheologyApplication).where(
            TheologyApplication.offer_number == ref))).scalar_one_or_none()
    if not a:
        raise HTTPException(404, "No student matches that admission number.")
    if not body.courses:
        raise HTTPException(400, "Report at least one course.")

    allowed = {"NOT_STARTED", "IN_PROGRESS", "COMPLETED", "PASSED", "FAILED", "WITHDRAWN"}
    courses = []
    for c in body.courses:
        st = (c.status or "IN_PROGRESS").upper()
        if st not in allowed:
            raise HTTPException(400, f"status must be one of {', '.join(sorted(allowed))}.")
        entry = {
            "courseCode": c.course_code.strip(),
            "courseTitle": c.course_title.strip(),
            "status": st,
            "progressPercent": max(0.0, min(100.0, float(c.progress_percent or 0))),
            # sharepoints versions course rows; letw.org does not, so every
            # report is revision 1 and is de-duplicated on eventId instead.
            "revision": 1,
        }
        if c.attendance_percent is not None:
            entry["attendancePercent"] = max(0.0, min(100.0, float(c.attendance_percent)))
        if c.assessment_score is not None:
            entry["assessmentScore"] = float(c.assessment_score)
        if c.grade:
            entry["grade"] = c.grade.strip()[:30]
        if c.completed_at:
            entry["completedAt"] = c.completed_at
        courses.append(entry)

    r = await _post_event(db, "classroom-progress", {
        **_journey(a, "liveEnrollmentId"),
        "eventId": body.event_id.strip(),
        "occurredAt": (body.occurred_at or (datetime.utcnow().isoformat() + "Z")),
        **({"academicStanding": body.academic_standing} if body.academic_standing else {}),
        "courses": courses,
    })
    if not r.get("ok"):
        raise HTTPException(502, r.get("reason") or "sharepoints did not accept the progress report.")
    return {"ok": True, "admission_number": ref, "courses": len(courses)}


@router.post("/lms/auth/verify")
async def lms_verify_student(
    body: LmsAuthIn,
    x_api_key: str = Header(default=""),
    db: AsyncSession = Depends(get_db),
):
    """Sign a student in to the classroom using their letw.org credentials.

    Returns the student's profile only when the password is correct AND they
    hold an accepted/enrolled place — so the classroom never has to store or
    manage passwords of its own.
    """
    await _require_lms(db, x_api_key)
    from utils.security import verify_password
    from models.user import UserStatus

    email = (body.email or "").strip().lower()
    u = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    generic = {"authenticated": False, "reason": "Invalid email or password."}
    if not u or not u.password_hash or not verify_password(body.password, u.password_hash):
        return generic
    if u.status != UserStatus.ACTIVE:
        return {"authenticated": False, "reason": "This account is not active."}

    a = (await db.execute(
        select(TheologyApplication)
        .where(TheologyApplication.email == email,
               TheologyApplication.status.in_(["accepted", "enrolled"]))
        .order_by(desc(TheologyApplication.accepted_at))
    )).scalars().first()
    if not a:
        return {"authenticated": False, "reason": "No active theology enrolment for this account."}

    # Signing in on the classroom counts as a first sign-in: the handover note
    # has done its job and should not linger in the database.
    await _clear_initial_password(db, a)
    return {"authenticated": True, "student": _lms_student(a, await _get_program(db, a.program_id))}


# ── Import the programmes shown on the public page into applyable programmes ──

@router.post("/admin/programs/{pid}/publish")
async def admin_publish_program(pid: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    """Register one programme with sharepoints so admissions can be issued."""
    program = await _get_program(db, pid)
    if not program:
        raise HTTPException(404, "Programme not found.")
    return await _publish_program(db, program)


@router.post("/admin/programs/publish-all")
async def admin_publish_all(db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    rows = (await db.execute(select(TheologyProgram))).scalars().all()
    results = []
    for program in rows:
        r = await _publish_program(db, program)
        results.append({"name": program.name, **r})
    return {"published": sum(1 for r in results if r.get("ok")), "total": len(results), "results": results}


@router.post("/admin/applications/{app_id}/resend-to-sharepoints")
async def admin_resend_bridge(app_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    """Re-run the hand-over for a paid application that never reached sharepoints."""
    a = (await db.execute(select(TheologyApplication).where(TheologyApplication.id == app_id))).scalar_one_or_none()
    if not a:
        raise HTTPException(404, "Application not found.")
    if a.status == "pending":
        raise HTTPException(400, "This application has not been paid for yet.")
    program = await _get_program(db, a.program_id)
    if not program:
        raise HTTPException(404, "Programme not found.")
    await _bridge_to_sharepoints(db, a, program)
    await db.refresh(a)
    if a.bridge_status == "accepted" and a.offer_url:
        if a.status == "paid":
            a.status = "admitted"
            a.admission_issued_at = datetime.utcnow()
        a.admission_number = a.offer_number or a.admission_number
        await db.commit()
    return {"bridge_status": a.bridge_status, "bridge_error": a.bridge_error,
            "offer_number": a.offer_number, "offer_url": a.offer_url,
            "admission_letter_url": a.admission_letter_url, "status": a.status}


@router.get("/admin/bridge-status")
async def admin_bridge_status(db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    """Everything an admin needs to see why admissions are or aren't flowing."""
    from routers.integrations import _effective_key
    key = await _effective_key(db)
    programs = (await db.execute(select(TheologyProgram))).scalars().all()
    apps = (await db.execute(select(TheologyApplication))).scalars().all()
    counts: dict = {}
    for a in apps:
        counts[a.bridge_status or "not_sent"] = counts.get(a.bridge_status or "not_sent", 0) + 1
    return {
        "secret_set": bool(key),
        "email": _email_delivery(),
        "signatory": await _signatory(db),
        "intake_url": await _intake_url(db),
        "programs": [{
            "id": p.id, "name": p.name, "code": p.program_code or "",
            "derived_code": _derive_code(p),
            "published": bool(p.program_code),
            "fee_set": float(p.tuition_amount or 0) > 0,
            "is_open": bool(p.is_open),
        } for p in programs],
        "applications": counts,
        "stuck": [{
            "id": a.id, "name": a.full_name, "status": a.status,
            "bridge_status": a.bridge_status, "bridge_error": a.bridge_error,
        } for a in apps if a.status != "pending" and a.bridge_status != "accepted"],
    }


@router.post("/admin/programs/import")
async def import_programs_from_page(db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    """Create applyable programmes from the ones displayed on
    /education/theology-school, so the page and the application form agree.

    Uses the admin-edited page content when present, otherwise the page's
    built-in three-programme ladder. Existing programmes (matched by name) are
    left untouched, so this is safe to run more than once. Fees start at 0 —
    set the exact amount on each programme afterwards.
    """
    page_programs: list[dict] = []
    try:
        from models.ministry_content import MinistryContent
        row = (await db.execute(select(MinistryContent).where(MinistryContent.key == "theology"))).scalar_one_or_none()
        if row and isinstance(row.content, dict):
            maybe = row.content.get("programs")
            if isinstance(maybe, list):
                page_programs = [p for p in maybe if isinstance(p, dict) and (p.get("title") or "").strip()]
    except Exception:
        page_programs = []

    if not page_programs:
        page_programs = [
            {"title": "Certificate in Ministry", "subtitle": "Foundation Program", "level": "certificate",
             "description": "Build a strong foundation in biblical studies, theology, and practical ministry."},
            {"title": "Diploma in Ministry and Divinity", "subtitle": "Intermediate Program", "level": "diploma",
             "description": "Deepen your theological understanding and ministry competencies."},
            {"title": "Advanced Diploma in Ministry and Divinity", "subtitle": "Advanced Program", "level": "degree",
             "description": "Advanced theological study and ministry leadership formation."},
        ]

    existing = {(p.name or "").strip().lower() for p in (await db.execute(select(TheologyProgram))).scalars().all()}
    created = []
    for i, p in enumerate(page_programs):
        name = str(p.get("title") or "").strip()
        if not name or name.lower() in existing:
            continue
        lvl = str(p.get("level") or "").strip().lower()
        if lvl not in ("certificate", "diploma", "degree", "masters"):
            lvl = "certificate" if i == 0 else ("diploma" if i == 1 else "degree")
        prog = TheologyProgram(
            name=name,
            slug=name.lower().replace(" ", "-")[:120],
            summary=str(p.get("subtitle") or p.get("tag") or "")[:2000] or None,
            description=str(p.get("description") or "")[:5000] or None,
            level=lvl,
            duration_months=12,
            tuition_amount=0,
            currency="NGN",
            is_open=False,   # opens once the admin sets the exact fee
            sort_order=i,
        )
        db.add(prog)
        created.append(name)
    await db.commit()
    return {
        "imported": len(created),
        "names": created,
        "note": "Set the exact fee on each programme, then switch it to Open so applicants can apply.",
    }


# ── One-click tuition checkout ───────────────────────────────────────────────

@router.get("/payment-providers")
async def theology_providers(db: AsyncSession = Depends(get_db)):
    """Active payment providers an applicant can pay the tuition with."""
    from models.payment import PaymentProvider
    rows = (await db.execute(
        select(PaymentProvider)
        .where(PaymentProvider.is_active == True)  # noqa: E712
        .order_by(PaymentProvider.sort_order, PaymentProvider.name)
    )).scalars().all()
    return [{"id": p.id, "slug": p.slug, "name": p.name, "currency": p.currency} for p in rows]


class TuitionCheckoutIn(BaseModel):
    provider_id: str


@router.post("/applications/{app_id}/checkout")
async def tuition_checkout(app_id: str, body: TuitionCheckoutIn, request: Request, db: AsyncSession = Depends(get_db)):
    """Start payment for an application with the EXACT tuition pre-filled.

    The applicant never types an amount or copies a reference: we create the
    charge for the precise fee, remember the reference on the application, and
    hand back the provider's checkout URL.
    """
    a = (await db.execute(select(TheologyApplication).where(TheologyApplication.id == app_id))).scalar_one_or_none()
    if not a:
        raise HTTPException(404, "Application not found.")
    if a.paid_at:
        return {"already_paid": True, "reference": a.payment_reference}
    program = await _get_program(db, a.program_id)
    if not program:
        raise HTTPException(404, "Programme not found.")
    if float(program.tuition_amount or 0) <= 0:
        raise HTTPException(400, "This programme has no fee set yet — please contact the school office.")

    from routers.payments import checkout as payments_checkout, CheckoutIn
    result = await payments_checkout(
        CheckoutIn(
            provider_id=body.provider_id,
            amount=float(program.tuition_amount),
            currency=program.currency,
            fund="Theology Tuition",
            payer_name=a.full_name,
            payer_email=a.email,
            message=f"Theology application {a.id} — {program.name}",
        ),
        request, db,
    )
    ref = (result or {}).get("reference")
    if ref:
        a.payment_reference = ref
        await db.commit()
    return {"checkout_url": (result or {}).get("checkout_url"), "reference": ref,
            "amount": float(program.tuition_amount), "currency": program.currency}
