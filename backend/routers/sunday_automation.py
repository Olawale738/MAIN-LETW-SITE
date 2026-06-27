"""
Sunday Automation router.

Admin endpoints:
  POST /api/sunday-automation/{sermon_id}/run             — kick off the pipeline
  PUT  /api/sunday-automation/{sermon_id}                  — edit any output field
  POST /api/sunday-automation/{sermon_id}/send-email       — dispatch the recap email
  POST /api/sunday-automation/run-monday-cron             — cron-friendly route that
        picks the most recent sermon that hasn't had its email sent and sends it.

Public:
  GET  /api/sunday-automation/{sermon_id}                  — outputs that already exist
  GET  /api/sunday-automation/{sermon_id}/chapters         — for the podcast RSS
"""

from __future__ import annotations

import os
from datetime import datetime, timedelta
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from models.sermon import Sermon
from services import sunday_automation as auto_svc
from services.email_service import send_email
from utils.dependencies import get_admin_user


router = APIRouter(prefix="/api/sunday-automation", tags=["Sunday Automation"])


# ── Public read ────────────────────────────────────────────────────────────

@router.get("/{sermon_id}")
async def read_outputs(sermon_id: str, db: AsyncSession = Depends(get_db)):
    """Return the saved automation outputs for a sermon. Public read."""
    s = (await db.execute(select(Sermon).where(Sermon.id == sermon_id))).scalar_one_or_none()
    if not s:
        raise HTTPException(404, "Sermon not found")
    return _serialise(s)


@router.get("/{sermon_id}/chapters")
async def read_chapters(sermon_id: str, db: AsyncSession = Depends(get_db)):
    """Just the chapter markers — used by the podcast RSS handler."""
    s = (await db.execute(select(Sermon).where(Sermon.id == sermon_id))).scalar_one_or_none()
    if not s:
        return {"chapters": []}
    return {"chapters": s.auto_chapters or []}


# ── Admin: run the pipeline ────────────────────────────────────────────────

class RunIn(BaseModel):
    # When True, run Whisper even if there's already a transcript on file
    # (useful if the admin re-uploads cleaner audio).
    force_transcribe: bool = False


@router.post("/{sermon_id}/run")
async def run_pipeline(
    sermon_id: str,
    body: RunIn,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Run transcription + generation for the given sermon."""
    s = (await db.execute(select(Sermon).where(Sermon.id == sermon_id))).scalar_one_or_none()
    if not s:
        raise HTTPException(404, "Sermon not found")

    # Step 1 — transcribe (skip if already done unless forced).
    if body.force_transcribe or not s.transcript:
        if not s.audio_data:
            raise HTTPException(
                400,
                "Sermon has no audio attached. Upload an MP3/MP4 in /admin/sermons first, "
                "or provide a transcript manually via the edit endpoint.",
            )
        transcript = await auto_svc.transcribe_sermon_audio(
            bytes(s.audio_data),
            s.audio_mime_type or "audio/mpeg",
        )
        if not transcript:
            raise HTTPException(
                502,
                "Transcription failed. Confirm OPENAI_API_KEY is configured at /admin/ai.",
            )
        s.transcript = transcript

    # Step 2 — generate all four outputs in one round-trip.
    outputs = await auto_svc.generate_all_outputs(
        title=s.title or "Sunday Sermon",
        preacher=s.preacher or "Pastoral Team",
        sermon_date=s.sermon_date.isoformat() if s.sermon_date else "today",
        transcript=s.transcript or "",
    )
    if not outputs:
        raise HTTPException(
            502,
            "Generation failed. Confirm an AI provider key is configured at /admin/ai.",
        )
    if "_raw" in outputs:
        # Surface raw text so admin can paste it manually rather than losing it.
        raise HTTPException(500, f"AI returned unparseable response: {outputs['_raw'][:500]}")

    auto_svc.merge_outputs_onto_sermon(s, outputs)
    await db.commit()
    await db.refresh(s)
    return _serialise(s)


# ── Admin: edit any output field ───────────────────────────────────────────

class UpdateIn(BaseModel):
    transcript:         Optional[str]                 = None
    auto_notes:         Optional[str]                 = None
    auto_email_subject: Optional[str]                 = None
    auto_email_body:    Optional[str]                 = None
    auto_blog_draft:    Optional[str]                 = None
    auto_social_posts:  Optional[list[dict[str, Any]]] = None
    auto_chapters:      Optional[list[dict[str, Any]]] = None


@router.put("/{sermon_id}")
async def update_outputs(
    sermon_id: str,
    body: UpdateIn,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    s = (await db.execute(select(Sermon).where(Sermon.id == sermon_id))).scalar_one_or_none()
    if not s:
        raise HTTPException(404, "Sermon not found")
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(s, k, v)
    await db.commit()
    await db.refresh(s)
    return _serialise(s)


# ── Admin: dispatch the Monday email ───────────────────────────────────────

@router.post("/{sermon_id}/send-email")
async def send_recap_email(
    sermon_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Send the recap email to every published / active member."""
    s = (await db.execute(select(Sermon).where(Sermon.id == sermon_id))).scalar_one_or_none()
    if not s:
        raise HTTPException(404, "Sermon not found")
    if not s.auto_email_subject or not s.auto_email_body:
        raise HTTPException(400, "No email subject or body. Run the automation first, or fill them manually.")

    # Pull active members. We send sequentially so a single bad address never
    # crashes the run; the email service already handles per-call errors.
    res = await db.execute(
        select(User).where(User.email.isnot(None))
    )
    recipients = [u.email for u in res.scalars().all() if u.email]
    sent = 0
    failed = 0
    for to in recipients:
        try:
            ok = await send_email(to, s.auto_email_subject, s.auto_email_body)
            if ok:
                sent += 1
            else:
                failed += 1
        except Exception as e:
            failed += 1
            print(f"[sunday-automation] email to {to} failed: {e}", flush=True)
    s.auto_email_sent_at = datetime.utcnow()
    await db.commit()
    return {"sent": sent, "failed": failed, "total": len(recipients)}


# ── Cron-friendly Monday route ─────────────────────────────────────────────

@router.post("/run-monday-cron")
async def monday_cron(
    db: AsyncSession = Depends(get_db),
    x_cron_token: Optional[str] = Header(default=None, alias="X-Cron-Token"),
):
    """
    Cron-friendly: picks the most recently dated sermon whose recap email
    hasn't been sent yet, runs the pipeline if outputs are missing, and
    dispatches the email. Set CRON_SECRET on Render and call this with
    the X-Cron-Token header from cron-job.org or similar.
    """
    expected = os.getenv("CRON_SECRET", "")
    if expected and x_cron_token != expected:
        raise HTTPException(403, "Bad cron token")

    # Find the most recent unsent sermon from the last 14 days.
    since = datetime.utcnow().date() - timedelta(days=14)
    s = (await db.execute(
        select(Sermon)
        .where(Sermon.sermon_date >= since)
        .where(Sermon.auto_email_sent_at.is_(None))
        .where(Sermon.is_published == True)  # noqa: E712
        .order_by(desc(Sermon.sermon_date))
        .limit(1)
    )).scalar_one_or_none()
    if not s:
        return {"status": "no_pending_sermon"}

    # Run the pipeline if outputs are missing.
    if not s.auto_email_subject and s.audio_data and not s.transcript:
        transcript = await auto_svc.transcribe_sermon_audio(bytes(s.audio_data), s.audio_mime_type or "audio/mpeg")
        if transcript:
            s.transcript = transcript
    if not s.auto_email_subject and s.transcript:
        outputs = await auto_svc.generate_all_outputs(
            title=s.title or "Sunday Sermon",
            preacher=s.preacher or "Pastoral Team",
            sermon_date=s.sermon_date.isoformat() if s.sermon_date else "today",
            transcript=s.transcript or "",
        )
        if outputs and "_raw" not in outputs:
            auto_svc.merge_outputs_onto_sermon(s, outputs)
            await db.commit()
            await db.refresh(s)

    if not s.auto_email_subject or not s.auto_email_body:
        return {"status": "no_outputs_to_send", "sermon_id": s.id}

    # Send.
    res = await db.execute(select(User).where(User.email.isnot(None)))
    recipients = [u.email for u in res.scalars().all() if u.email]
    sent = 0
    for to in recipients:
        try:
            if await send_email(to, s.auto_email_subject, s.auto_email_body):
                sent += 1
        except Exception:
            pass
    s.auto_email_sent_at = datetime.utcnow()
    await db.commit()
    return {"status": "sent", "sermon_id": s.id, "sent": sent, "total": len(recipients)}


# ── Helpers ────────────────────────────────────────────────────────────────

def _serialise(s: Sermon) -> dict[str, Any]:
    return {
        "sermon_id":          s.id,
        "title":              s.title,
        "preacher":           s.preacher,
        "sermon_date":        s.sermon_date.isoformat() if s.sermon_date else None,
        "transcript":         s.transcript,
        "auto_notes":         s.auto_notes,
        "auto_email_subject": s.auto_email_subject,
        "auto_email_body":    s.auto_email_body,
        "auto_blog_draft":    s.auto_blog_draft,
        "auto_social_posts":  s.auto_social_posts or [],
        "auto_chapters":      s.auto_chapters or [],
        "auto_generated_at":  s.auto_generated_at.isoformat() if s.auto_generated_at else None,
        "auto_email_sent_at": s.auto_email_sent_at.isoformat() if s.auto_email_sent_at else None,
    }
