"""
AI provider abstraction. Returns a configured client (OpenAI or Anthropic),
or None if no key is set. Endpoints check this first and return 503 with
a friendly setup message if AI isn't configured.

Env vars (set on Render):
    OPENAI_API_KEY=sk-...     (preferred for transcription / clip generation)
    ANTHROPIC_API_KEY=sk-ant-... (preferred for pastoral assistant / RAG)

If both are set, OpenAI is default for transcription/translation/sermon-to-
everything, Anthropic is default for chat/RAG.
"""

import os
from typing import Optional


def has_openai() -> bool:
    return bool(os.getenv("OPENAI_API_KEY"))


def has_anthropic() -> bool:
    return bool(os.getenv("ANTHROPIC_API_KEY"))


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
                    "x-api-key": os.environ["ANTHROPIC_API_KEY"],
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
