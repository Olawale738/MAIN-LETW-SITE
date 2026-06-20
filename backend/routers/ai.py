"""
AI features API. All endpoints are READY but return 503 with setup
instructions until OPENAI_API_KEY or ANTHROPIC_API_KEY is set on Render.

Features (#2 + #8 from the platform roadmap):
- POST /api/ai/transcribe      — sermon audio → text (Whisper)
- POST /api/ai/translate       — text → another language
- POST /api/ai/sermon-pipeline — generate podcast notes, blog post, social clips,
                                 7-day devotional, study guide, memory verses
                                 from a single sermon (text or audio).
"""

import os
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from models.sermon import Sermon
from models.daily_verse import DailyVerse
from utils.dependencies import get_admin_user, get_current_active_user
from utils import ai_provider
import os


router = APIRouter(prefix="/api/ai", tags=["AI Features"])


@router.get("/status")
async def status():
    await ai_provider.refresh_cache_async()
    return ai_provider.get_status()


# ─── Admin key management ────────────────────────────────────────────────────

class KeysIn(BaseModel):
    openai_api_key: Optional[str] = None       # send a string to set, "" or null to clear
    anthropic_api_key: Optional[str] = None


def _mask(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    if len(value) <= 10:
        return "•" * len(value)
    return value[:6] + "•" * (len(value) - 10) + value[-4:]


@router.get("/keys")
async def get_keys(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Return masked keys for the admin UI. Real keys never leave the server."""
    from models.ai_config import AiConfig
    res = await db.execute(select(AiConfig).where(AiConfig.id == 1))
    row = res.scalar_one_or_none()
    env_openai = bool(os.getenv("OPENAI_API_KEY"))
    env_anthropic = bool(os.getenv("ANTHROPIC_API_KEY"))
    return {
        "openai_api_key": _mask(row.openai_api_key) if row else None,
        "anthropic_api_key": _mask(row.anthropic_api_key) if row else None,
        "env_fallback_openai": env_openai and not (row and row.openai_api_key),
        "env_fallback_anthropic": env_anthropic and not (row and row.anthropic_api_key),
    }


@router.put("/keys")
async def set_keys(
    body: KeysIn,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Set / clear API keys. Pass a key to update, empty string or null to clear.
    If a masked value (contains •) comes back, the existing value is preserved."""
    from models.ai_config import AiConfig
    res = await db.execute(select(AiConfig).where(AiConfig.id == 1))
    row = res.scalar_one_or_none()
    if not row:
        row = AiConfig(id=1)
        db.add(row)

    def _normalise(field: Optional[str], existing: Optional[str]) -> Optional[str]:
        if field is None:
            return existing
        # Masked value means "don't change"
        if "•" in field:
            return existing
        # Empty string means "clear"
        if field.strip() == "":
            return None
        return field.strip()

    row.openai_api_key = _normalise(body.openai_api_key, row.openai_api_key)
    row.anthropic_api_key = _normalise(body.anthropic_api_key, row.anthropic_api_key)
    await db.commit()
    await ai_provider.refresh_cache_async()
    return {
        "ok": True,
        "openai_api_key": _mask(row.openai_api_key),
        "anthropic_api_key": _mask(row.anthropic_api_key),
    }


def _require_ai():
    if not ai_provider.has_any():
        raise HTTPException(503, ai_provider.setup_help())


# ─── #2 — Transcription + multi-language captions ────────────────────────────

class TranslateIn(BaseModel):
    text: str
    target_language: str   # "yo" Yoruba, "fr" French, "es" Spanish, "ig" Igbo, "ha" Hausa
    source_language: Optional[str] = "en"


@router.post("/translate")
async def translate(body: TranslateIn, _: User = Depends(get_current_active_user)):
    _require_ai()
    try:
        out = await ai_provider.translate_text(body.text, body.target_language, body.source_language)
        return {"ok": True, "translated_text": out, "target_language": body.target_language}
    except Exception as e:
        raise HTTPException(502, f"Translate failed: {e}")


@router.post("/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    language: Optional[str] = Form(None),
    _: User = Depends(get_admin_user),
):
    _require_ai()
    if not ai_provider.has_openai():
        raise HTTPException(503, "Transcription requires OPENAI_API_KEY (Whisper). Set it on Render.")
    data = await file.read()
    if len(data) > 25 * 1024 * 1024:
        raise HTTPException(413, "Audio file too large (max 25 MB — Whisper limit). Split large sermons into chunks.")
    try:
        text = await ai_provider.transcribe_audio_bytes(data, file.content_type or "audio/mpeg", language)
        return {"ok": True, "transcript": text}
    except Exception as e:
        raise HTTPException(502, f"Transcription failed: {e}")


# ─── #8 — Sermon-to-Everything Pipeline ──────────────────────────────────────

class SermonPipelineIn(BaseModel):
    sermon_id: Optional[str] = None     # use stored sermon (will transcribe its audio if needed)
    transcript: Optional[str] = None    # OR provide raw transcript text directly
    title: Optional[str] = None
    preacher: Optional[str] = None
    outputs: List[str] = ["summary", "blog_post", "social_clips", "devotional_series", "study_guide", "memory_verses"]


@router.post("/sermon-pipeline")
async def sermon_pipeline(
    body: SermonPipelineIn,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Generate every downstream output from a single sermon. Returns a dict
    keyed by output type."""
    _require_ai()

    transcript = body.transcript
    title = body.title or "Sunday Sermon"
    preacher = body.preacher or "Pastor"

    if not transcript and body.sermon_id:
        res = await db.execute(select(Sermon).where(Sermon.id == body.sermon_id))
        s = res.scalar_one_or_none()
        if not s:
            raise HTTPException(404, "Sermon not found")
        title = s.title
        preacher = s.preacher
        if s.audio_data and ai_provider.has_openai():
            transcript = await ai_provider.transcribe_audio_bytes(bytes(s.audio_data), s.audio_mime_type or "audio/mpeg")
        elif s.description:
            transcript = s.description

    if not transcript:
        raise HTTPException(400, "Need either transcript text or a sermon_id with audio/description")

    base_prompt = (
        f"Sermon title: {title}\nPreacher: {preacher}\n\n"
        f"Full transcript/notes:\n{transcript[:8000]}\n\n---\n\n"
    )

    outputs: dict[str, str] = {}

    if "summary" in body.outputs:
        outputs["summary"] = await ai_provider.chat_completion(
            base_prompt + "Write a 3-paragraph summary suitable for a podcast description.",
            system_prompt="You are a church communications director. Warm, biblical, plain English.",
            max_tokens=600,
        )
    if "blog_post" in body.outputs:
        outputs["blog_post"] = await ai_provider.chat_completion(
            base_prompt + "Write a blog post (5 paragraphs) faithfully presenting the sermon's main message. Include 2-3 scripture references.",
            system_prompt="You are LETW's pastor's writing assistant.",
            max_tokens=1500,
        )
    if "social_clips" in body.outputs:
        outputs["social_clips"] = await ai_provider.chat_completion(
            base_prompt + "Write 5 short social media captions (each 200-280 characters) drawn from this sermon. Number them. Make them tweet/Reels-style — punchy, scripture-grounded, ending with a thought-provoking question.",
            max_tokens=800,
        )
    if "devotional_series" in body.outputs:
        outputs["devotional_series"] = await ai_provider.chat_completion(
            base_prompt + "Write a 7-day devotional email series (Day 1-7) based on this sermon. Each day: title, scripture reference, 200-word reflection, one prayer prompt.",
            max_tokens=3000,
        )
    if "study_guide" in body.outputs:
        outputs["study_guide"] = await ai_provider.chat_completion(
            base_prompt + "Write 5 small-group discussion questions that follow this sermon. Mix observation, interpretation, and application questions.",
            max_tokens=600,
        )
    if "memory_verses" in body.outputs:
        outputs["memory_verses"] = await ai_provider.chat_completion(
            base_prompt + "List 3 scriptures from this sermon that would make excellent memory verses. Include the reference and the verse text in KJV.",
            max_tokens=400,
        )

    return {"ok": True, "title": title, "preacher": preacher, "outputs": outputs}
