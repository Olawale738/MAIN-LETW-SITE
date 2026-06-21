"""
Live chat + live caption translation for the online campus.

Chat: every viewer of /live can post a short message; admins can pin or hide.
Captions: backend ingests a transcript line from the operator and emits
translations into the supported languages on the fly.
"""

from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, desc, and_
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from models.live_chat import LiveChatMessage, LiveCaptionLine
from utils.dependencies import get_admin_user, get_current_active_user
from utils.rate_limit import rate_limit


router = APIRouter(prefix="/api/live", tags=["Live Worship"])

CAPTION_LANGUAGES = ["en", "yo", "ig", "ha", "fr", "es"]


# ─── Chat ────────────────────────────────────────────────────────────────────

class ChatIn(BaseModel):
    service_id: Optional[str] = None
    body: str
    display_name: Optional[str] = None


@router.get("/chat")
async def list_messages(
    service_id: Optional[str] = None, since: Optional[datetime] = None, limit: int = 200,
    db: AsyncSession = Depends(get_db),
):
    q = select(LiveChatMessage).where(LiveChatMessage.is_hidden == False).order_by(desc(LiveChatMessage.created_at))
    if service_id: q = q.where(LiveChatMessage.service_id == service_id)
    if since: q = q.where(LiveChatMessage.created_at > since)
    res = await db.execute(q.limit(min(max(limit, 1), 500)))
    rows = list(reversed(res.scalars().all()))   # ascending for client convenience
    return [{
        "id": m.id, "service_id": m.service_id, "user_id": m.user_id,
        "display_name": m.display_name, "body": m.body,
        "is_pinned": m.is_pinned, "created_at": m.created_at,
    } for m in rows]


@router.post("/chat", status_code=201)
async def post_message(
    body: ChatIn,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
    _rl=Depends(rate_limit(20, 60, "live-chat")),
):
    text = (body.body or "").strip()
    if not text or len(text) > 500:
        raise HTTPException(400, "Message must be 1-500 chars")
    m = LiveChatMessage(
        service_id=body.service_id,
        user_id=user.id,
        display_name=body.display_name or user.name or "Anonymous",
        body=text,
    )
    db.add(m); await db.commit(); await db.refresh(m)
    return {"ok": True, "id": m.id}


@router.put("/chat/{mid}/pin")
async def pin_message(mid: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(LiveChatMessage).where(LiveChatMessage.id == mid))
    m = res.scalar_one_or_none()
    if not m: raise HTTPException(404, "Not found")
    m.is_pinned = not m.is_pinned
    await db.commit()
    return {"ok": True, "is_pinned": m.is_pinned}


@router.delete("/chat/{mid}")
async def hide_message(mid: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(LiveChatMessage).where(LiveChatMessage.id == mid))
    m = res.scalar_one_or_none()
    if not m: return {"ok": True}
    m.is_hidden = True
    await db.commit()
    return {"ok": True}


# ─── Captions / translation ─────────────────────────────────────────────────

class CaptionIn(BaseModel):
    service_id: str
    text: str
    language: str = "en"
    translate_into: Optional[List[str]] = None


@router.post("/captions", status_code=201)
async def ingest_caption(body: CaptionIn, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    """Operator endpoint: receive a transcript line, store the source, and
    fan out translations into every requested language (defaults to all 6)."""
    text = (body.text or "").strip()
    if not text:
        raise HTTPException(400, "text required")
    src = LiveCaptionLine(service_id=body.service_id, language=body.language, text=text)
    db.add(src)
    targets = body.translate_into if body.translate_into is not None else [l for l in CAPTION_LANGUAGES if l != body.language]

    # AI translation — uses the same provider abstraction we already configured
    try:
        from utils.ai_provider import translate_text   # type: ignore
        for lang in targets:
            try:
                translated = await translate_text(text, target_language=lang, source_language=body.language)
                if translated and translated.strip():
                    db.add(LiveCaptionLine(service_id=body.service_id, language=lang, text=translated.strip()))
            except Exception as e:
                print(f"[captions] translate {lang} failed: {type(e).__name__}: {e}", flush=True)
    except Exception:
        # No AI provider available — just store the source language line
        pass

    await db.commit()
    return {"ok": True, "stored": 1 + len(targets)}


@router.get("/captions")
async def list_captions(
    service_id: str, language: str = "en", since: Optional[datetime] = None, limit: int = 60,
    db: AsyncSession = Depends(get_db),
):
    q = (select(LiveCaptionLine)
         .where(LiveCaptionLine.service_id == service_id)
         .where(LiveCaptionLine.language == language)
         .order_by(desc(LiveCaptionLine.spoken_at)))
    if since:
        q = q.where(LiveCaptionLine.spoken_at > since)
    res = await db.execute(q.limit(min(max(limit, 1), 200)))
    rows = list(reversed(res.scalars().all()))
    return [{"id": r.id, "text": r.text, "spoken_at": r.spoken_at} for r in rows]


@router.get("/captions/languages")
async def supported_languages():
    return {"languages": CAPTION_LANGUAGES}
