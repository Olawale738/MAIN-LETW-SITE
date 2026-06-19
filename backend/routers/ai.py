"""
AI features API. All endpoints are READY but return 503 with setup
instructions until OPENAI_API_KEY or ANTHROPIC_API_KEY is set on Render.

Features (#2, #3, #8 from the platform roadmap):
- POST /api/ai/transcribe      — sermon audio → text (Whisper)
- POST /api/ai/translate       — text → another language
- POST /api/ai/pastor-ask      — RAG chat against sermon corpus + statement of faith
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


router = APIRouter(prefix="/api/ai", tags=["AI Features"])


@router.get("/status")
async def status():
    return ai_provider.get_status()


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


# ─── #3 — Pastor Ask (RAG over sermons + statement of faith) ─────────────────

class PastorAskIn(BaseModel):
    question: str
    session_id: Optional[str] = None  # for future thread continuity


@router.post("/pastor-ask")
async def pastor_ask(body: PastorAskIn, db: AsyncSession = Depends(get_db)):
    """Member asks a pastoral question. We retrieve the most relevant 5 sermons
    + statement of faith + recent daily verses, and answer in LETW's voice."""
    _require_ai()

    # Lightweight retrieval: keyword search over sermon titles/descriptions + a few verses.
    # Replace with proper embedding-based RAG once we have a vector store.
    q = body.question.lower()
    keywords = [w for w in q.split() if len(w) > 3]

    matching_sermons: List[Sermon] = []
    if keywords:
        from sqlalchemy import or_, func
        sq = select(Sermon)
        clauses = [
            func.lower(Sermon.title).like(f"%{w}%") for w in keywords[:5]
        ] + [
            func.lower(Sermon.description).like(f"%{w}%") for w in keywords[:5]
        ]
        sq = sq.where(or_(*clauses)).order_by(desc(Sermon.sermon_date)).limit(5)
        res = await db.execute(sq)
        matching_sermons = list(res.scalars().all())

    # Try to pull statement of faith from ministry_content
    sof_text = ""
    try:
        from models.ministry_content import MinistryContent
        res2 = await db.execute(select(MinistryContent).where(MinistryContent.key == "statement-of-faith"))
        sof = res2.scalar_one_or_none()
        if sof and sof.content:
            articles = sof.content.get("articles", [])
            sof_text = "\n".join([f"{a.get('title')}: {a.get('body')}" for a in articles])
    except Exception:
        pass

    sermon_context = "\n\n".join([
        f"Sermon: \"{s.title}\" by {s.preacher} ({s.sermon_date}). {s.description or ''}"
        for s in matching_sermons
    ])

    system = (
        "You are the AI pastoral assistant for Light Encounter Tabernacle Worldwide (LETW). "
        "Speak with the warmth and authority of a Bible-believing pastor. Reference Scripture when relevant. "
        "If the question is in personal crisis territory (suicide, abuse), give immediate compassionate words AND "
        "urge the person to contact a real pastor at office@letw.org or call emergency services. "
        "Stay in LETW's theological lane (use the Statement of Faith below). "
        "Keep responses warm, brief, and biblically grounded."
    )
    prompt = (
        f"LETW's Statement of Faith excerpts:\n{sof_text or '(not provided)'}\n\n"
        f"Relevant sermons from our archive:\n{sermon_context or '(no specific sermons matched)'}\n\n"
        f"Member's question: {body.question}\n\n"
        f"Answer the member with pastoral warmth and at least one Scripture reference. "
        f"If you reference one of the sermons above, mention its title."
    )
    try:
        answer = await ai_provider.chat_completion(prompt, system_prompt=system, max_tokens=800)
        return {
            "ok": True,
            "answer": answer,
            "referenced_sermons": [{"id": s.id, "title": s.title, "preacher": s.preacher, "date": str(s.sermon_date)} for s in matching_sermons],
            "disclaimer": "AI-generated guidance — please reach out to a real pastor for major decisions.",
        }
    except Exception as e:
        raise HTTPException(502, f"AI chat failed: {e}")


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
