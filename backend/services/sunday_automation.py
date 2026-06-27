"""
Sunday Automation Pipeline
==========================

Given a sermon row that already has audio attached, this service runs the
full pipeline in sequence:

  1. Whisper transcribes the audio (if not already transcribed).
  2. Claude / OpenAI generates four outputs from the transcript:
       a. Sermon notes (HTML — outline with main points + scriptures + applications)
       b. Email recap (subject + HTML body — a digestible Monday-morning email)
       c. Blog post draft (HTML — long-form pastoral reflection)
       d. Social media posts (JSON list of {platform, text})
       e. Audio chapter markers (JSON list of {start_seconds, title})

  3. Each output is saved on the sermon row. Admin can edit any field
     freely; nothing is ever auto-published. The Monday recap email is
     dispatched via a separate explicit endpoint (and a cron-friendly route)
     so the admin always sees a draft first.

The endpoints are admin-gated. Output JSON shapes are kept simple so the
admin UI can render plain text editors over them.
"""

from __future__ import annotations

import json
from datetime import datetime
from typing import Any, Optional

from utils import ai_provider


SYSTEM_PROMPT = (
    "You are an experienced pastoral writing assistant for Light Encounter "
    "Tabernacle Worldwide. You produce thoughtful, scripturally grounded, "
    "warm-but-not-cheesy content. You always return valid JSON when asked "
    "and you never invent scripture references."
)


async def transcribe_sermon_audio(audio_bytes: bytes, mime_type: str) -> Optional[str]:
    """Run Whisper on the sermon's audio. Returns None if no API key configured."""
    if not audio_bytes:
        return None
    if not ai_provider.has_openai():
        return None
    return await ai_provider.transcribe_audio_bytes(audio_bytes, mime_type or "audio/mpeg")


async def generate_all_outputs(
    *,
    title: str,
    preacher: str,
    sermon_date: str,
    transcript: str,
) -> dict[str, Any]:
    """
    Single round-trip to the LLM that yields all four outputs at once.
    Cheaper + faster than four separate calls, and reduces error blast radius.
    """
    if not transcript or not transcript.strip():
        return {}
    if not ai_provider.is_configured():
        return {}

    # Cap transcript length so we don't blow context. Whisper sermons are
    # typically 30-60 minutes; ~30k chars covers most of them safely.
    safe_transcript = transcript.strip()[:30_000]

    prompt = f"""You are processing a Sunday sermon.

Title: {title}
Preacher: {preacher}
Date: {sermon_date}

Transcript (lightly cleaned):
\"\"\"
{safe_transcript}
\"\"\"

Produce ONE JSON object with these keys (and ONLY these keys):

{{
  "notes_html":   "<h2>Outline</h2>... HTML for printable sermon notes — outline of main points, key scripture refs as <strong>book chapter:verse</strong>, and 2-3 application questions at the end. Keep it tight; 350-600 words.",
  "email_subject":"A concise, evocative Monday-morning email subject line (max 70 chars).",
  "email_html":   "<p>...</p> Friendly Monday-morning email recap. ~180-250 words. Warm, pastoral. Include 1-2 application takeaways. End with 'Grace and peace, LETW'.",
  "blog_html":    "<p>...</p> Long-form pastoral blog post adapted from the sermon — 500-800 words, story-driven, ready to publish after light review.",
  "social_posts": [
     {{"platform": "twitter",   "text": "≤260 chars hook + key insight + hashtags"}},
     {{"platform": "instagram", "text": "engaging 2-3 sentence post with line breaks + a call to listen, ≤500 chars"}},
     {{"platform": "facebook",  "text": "warm 3-4 sentence post inviting people to engage, ≤700 chars"}}
  ],
  "chapters": [
     {{"start_seconds": 0,   "title": "Welcome & opening prayer"}},
     {{"start_seconds": 120, "title": "Scripture reading"}}
     // continue with 5-9 chapters total in chronological order; titles are short
  ]
}}

Return ONLY the JSON object. Do not wrap it in markdown fences. Do not invent scripture references not present in the transcript."""

    raw = await ai_provider.chat_completion(prompt, system_prompt=SYSTEM_PROMPT, max_tokens=4500)
    if not raw:
        return {}
    # Strip stray code fences just in case the model ignored the instruction.
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        # Drop the first fence line and the trailing fence.
        parts = cleaned.split("```")
        cleaned = parts[1] if len(parts) > 1 else cleaned
        if cleaned.startswith("json\n"):
            cleaned = cleaned[5:]
        cleaned = cleaned.rstrip("` \n")
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        # If the model returned messy output, surface the raw text on a single
        # field rather than dropping everything on the floor.
        return {"_raw": raw}
    return data if isinstance(data, dict) else {"_raw": raw}


def merge_outputs_onto_sermon(sermon, outputs: dict[str, Any]) -> None:
    """Apply LLM outputs onto the SQLAlchemy sermon model, in-place."""
    if not outputs:
        return
    if (v := outputs.get("notes_html")) and isinstance(v, str):
        sermon.auto_notes = v.strip()
    if (v := outputs.get("email_subject")) and isinstance(v, str):
        sermon.auto_email_subject = v.strip()[:300]
    if (v := outputs.get("email_html")) and isinstance(v, str):
        sermon.auto_email_body = v.strip()
    if (v := outputs.get("blog_html")) and isinstance(v, str):
        sermon.auto_blog_draft = v.strip()
    if (v := outputs.get("social_posts")) and isinstance(v, list):
        # Defensive — keep only properly-shaped entries.
        sermon.auto_social_posts = [
            {"platform": str(p.get("platform", "")).lower(), "text": str(p.get("text", ""))}
            for p in v if isinstance(p, dict)
        ]
    if (v := outputs.get("chapters")) and isinstance(v, list):
        sermon.auto_chapters = [
            {
                "start_seconds": int(c.get("start_seconds", 0)),
                "title": str(c.get("title", "")).strip(),
            }
            for c in v if isinstance(c, dict)
        ]
    sermon.auto_generated_at = datetime.utcnow()
