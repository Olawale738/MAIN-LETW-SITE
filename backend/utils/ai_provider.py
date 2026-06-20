"""
AI provider abstraction. Reads keys from admin DB row first, falls back
to env vars. Endpoints check has_any() and return 503 if neither is set.

Two ways to configure:
- Admin pastes key at /admin/ai (saved to ai_config table) — preferred
- OR set OPENAI_API_KEY / ANTHROPIC_API_KEY env vars on Render

If both are set, OpenAI is default for transcription/translation/sermon-to-
everything, Anthropic is default for chat/RAG.
"""

import os
from typing import Optional

# In-process cache so we don't hit the DB on every request. Refreshed by
# /admin/ai/keys PUT and at most every 60 seconds otherwise.
_cache: dict = {"openai": None, "anthropic": None, "fetched_at": 0.0}


def _refresh_cache_from_db() -> None:
    """Best-effort DB read. If anything fails (no row, no table yet,
    DB connection issue) we silently fall back to env vars."""
    try:
        import time
        import asyncio
        from sqlalchemy import select
        from database import AsyncSessionLocal
        from models.ai_config import AiConfig

        async def _load():
            async with AsyncSessionLocal() as s:
                res = await s.execute(select(AiConfig).where(AiConfig.id == 1))
                return res.scalar_one_or_none()

        # If we're already in an event loop (FastAPI request), do it sync via run_until_complete elsewhere.
        # Safest path: schedule via a fresh loop only when there's no running loop.
        try:
            loop = asyncio.get_running_loop()
            # Inside running loop — caller should use _async_refresh instead.
            return
        except RuntimeError:
            row = asyncio.run(_load())

        _cache["openai"] = row.openai_api_key if row and row.openai_api_key else None
        _cache["anthropic"] = row.anthropic_api_key if row and row.anthropic_api_key else None
        _cache["fetched_at"] = time.monotonic()
    except Exception:
        pass


async def refresh_cache_async() -> None:
    """Call this from any async context (e.g. an endpoint) to refresh the
    cache without blocking the event loop."""
    import time
    try:
        from sqlalchemy import select
        from database import AsyncSessionLocal
        from models.ai_config import AiConfig
        async with AsyncSessionLocal() as s:
            res = await s.execute(select(AiConfig).where(AiConfig.id == 1))
            row = res.scalar_one_or_none()
        _cache["openai"] = row.openai_api_key if row and row.openai_api_key else None
        _cache["anthropic"] = row.anthropic_api_key if row and row.anthropic_api_key else None
        _cache["fetched_at"] = time.monotonic()
    except Exception:
        pass


def get_openai_key() -> Optional[str]:
    # DB cache wins
    if _cache.get("openai"):
        return _cache["openai"]
    return os.getenv("OPENAI_API_KEY") or None


def get_anthropic_key() -> Optional[str]:
    if _cache.get("anthropic"):
        return _cache["anthropic"]
    return os.getenv("ANTHROPIC_API_KEY") or None


def has_openai() -> bool:
    return bool(get_openai_key())


def has_anthropic() -> bool:
    return bool(get_anthropic_key())


def has_any() -> bool:
    return has_openai() or has_anthropic()


def setup_help() -> dict:
    """Returned by endpoints when no AI key is configured."""
    return {
        "ai_configured": False,
        "message": (
            "AI features are not configured. Set OPENAI_API_KEY (https://platform.openai.com/api-keys) "
            "or ANTHROPIC_API_KEY (https://console.anthropic.com/) in Render → backend → Environment, "
            "then redeploy. Features activate automatically once the key is present."
        ),
        "has_openai": False,
        "has_anthropic": False,
    }


def get_status() -> dict:
    return {
        "ai_configured": has_any(),
        "has_openai": has_openai(),
        "has_anthropic": has_anthropic(),
    }


async def transcribe_audio_bytes(audio_bytes: bytes, mime_type: str = "audio/mpeg", language: Optional[str] = None) -> Optional[str]:
    """Whisper transcription via OpenAI. Returns plain text transcript, or None if not configured."""
    if not has_openai():
        return None
    import httpx
    files = {"file": ("audio.mp3", audio_bytes, mime_type), "model": (None, "whisper-1")}
    if language:
        files["language"] = (None, language)
    async with httpx.AsyncClient(timeout=120) as cli:
        r = await cli.post(
            "https://api.openai.com/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {os.environ['OPENAI_API_KEY']}"},
            files=files,
        )
    if r.status_code >= 300:
        raise RuntimeError(f"Whisper failed: {r.status_code} {r.text[:200]}")
    return r.json().get("text", "")


async def translate_text(text: str, target_language: str, source_language: Optional[str] = "en") -> Optional[str]:
    """Translate via the available AI provider. Returns translated text or None."""
    if not has_any():
        return None
    prompt = (
        f"Translate the following from {source_language or 'auto-detect'} into {target_language}. "
        "Keep biblical references, names, and quoted scripture EXACTLY as-is. Return ONLY the translation, "
        "no preamble.\n\n"
        f"{text}"
    )
    return await chat_completion(prompt)


async def chat_completion(prompt: str, system_prompt: Optional[str] = None, max_tokens: int = 2000) -> Optional[str]:
    """Single-shot LLM call. Uses Anthropic if available, else OpenAI. Returns text or None."""
    import httpx
    if has_anthropic():
        async with httpx.AsyncClient(timeout=60) as cli:
            r = await cli.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": (get_anthropic_key() or ""),
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-haiku-4-5-20251001",
                    "max_tokens": max_tokens,
                    "system": system_prompt or "You are LETW's AI assistant. Be warm, biblical, brief.",
                    "messages": [{"role": "user", "content": prompt}],
                },
            )
        if r.status_code >= 300:
            raise RuntimeError(f"Anthropic failed: {r.status_code} {r.text[:200]}")
        data = r.json()
        blocks = data.get("content", [])
        if blocks and blocks[0].get("type") == "text":
            return blocks[0].get("text", "")
        return None
    if has_openai():
        async with httpx.AsyncClient(timeout=60) as cli:
            r = await cli.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {os.environ['OPENAI_API_KEY']}", "Content-Type": "application/json"},
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": system_prompt or "You are LETW's AI assistant. Be warm, biblical, brief."},
                        {"role": "user", "content": prompt},
                    ],
                    "max_tokens": max_tokens,
                },
            )
        if r.status_code >= 300:
            raise RuntimeError(f"OpenAI chat failed: {r.status_code} {r.text[:200]}")
        return r.json()["choices"][0]["message"]["content"]
    return None
