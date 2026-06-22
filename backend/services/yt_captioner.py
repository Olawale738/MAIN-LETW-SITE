"""
Server-side YouTube live → caption pipeline.

This module runs entirely on the backend — no operator screen sharing required.
Given a YouTube live URL and a service id, it:

  1. Resolves the live audio manifest URL via yt-dlp.
  2. Slices the stream into ~8-second WebM/Opus chunks using ffmpeg
     (the portable binary shipped by imageio-ffmpeg).
  3. Sends each chunk to OpenAI Whisper for transcription.
  4. Stores the source line + fan-out translations into live_captions
     so viewers on /live see real-time multilingual subtitles.

Jobs are tracked in-process (one asyncio task per service_id). A second
start() on the same service_id is a no-op. stop() cancels the task.
"""

from __future__ import annotations

import asyncio
import os
import tempfile
from typing import Optional

# In-process registry of running capture tasks. Keyed by service_id.
_active_jobs: dict[str, asyncio.Task] = {}


def _ffmpeg_path() -> str:
    """
    Locate the ffmpeg binary. Prefer imageio-ffmpeg's bundled copy so the
    feature works on Render without an apt.txt; fall back to system PATH.
    """
    try:
        import imageio_ffmpeg  # type: ignore
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return "ffmpeg"


async def _resolve_stream_url(youtube_url: str) -> Optional[str]:
    """
    Use yt-dlp to pull the actual streamable audio URL from a YouTube live
    page. Runs the (blocking) yt-dlp call in a worker thread so it doesn't
    pin the event loop.
    """
    def _do_resolve() -> Optional[str]:
        try:
            import yt_dlp  # type: ignore
        except ImportError:
            print("[yt-captions] yt-dlp not installed", flush=True)
            return None
        opts = {
            "format": "bestaudio",
            "quiet": True,
            "no_warnings": True,
            "skip_download": True,
        }
        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(youtube_url, download=False)
                # For live streams info["url"] is the playable manifest;
                # for finalized videos it's a direct audio file URL.
                return info.get("url")
        except Exception as e:
            print(f"[yt-captions] yt-dlp resolve failed: {type(e).__name__}: {e}", flush=True)
            return None

    return await asyncio.to_thread(_do_resolve)


async def _capture_loop(service_id: str, youtube_url: str, source_language: str) -> None:
    """Long-running capture loop. Cancellable via Task.cancel()."""
    # Local imports — avoid cycles + only paid when the feature is used.
    from database import AsyncSessionLocal
    from models.live_chat import LiveCaptionLine
    from utils.ai_provider import transcribe_audio_bytes, translate_text
    from routers.live_chat import CAPTION_LANGUAGES

    stream_url = await _resolve_stream_url(youtube_url)
    if not stream_url:
        print(f"[yt-captions] could not resolve {youtube_url}", flush=True)
        return

    print(f"[yt-captions] capture loop started for service={service_id}", flush=True)
    ffmpeg = _ffmpeg_path()
    chunk_seconds = 8
    short_lang = (source_language or "en").split("-")[0]

    try:
        while True:
            tmp = tempfile.NamedTemporaryFile(suffix=".webm", delete=False)
            tmp.close()
            try:
                # ffmpeg pulls `chunk_seconds` of audio from the live manifest,
                # downmixes to mono 16 kHz Opus, writes to a temp file.
                proc = await asyncio.create_subprocess_exec(
                    ffmpeg,
                    "-y",
                    "-i", stream_url,
                    "-t", str(chunk_seconds),
                    "-ac", "1",
                    "-ar", "16000",
                    "-vn",
                    "-c:a", "libopus",
                    "-b:a", "32k",
                    "-f", "webm",
                    tmp.name,
                    stdout=asyncio.subprocess.DEVNULL,
                    stderr=asyncio.subprocess.DEVNULL,
                )
                try:
                    await asyncio.wait_for(proc.wait(), timeout=chunk_seconds + 12)
                except asyncio.TimeoutError:
                    try:
                        proc.terminate()
                    except ProcessLookupError:
                        pass
                    continue
                if proc.returncode != 0:
                    # Stream hiccup — wait a tick and try again.
                    await asyncio.sleep(1)
                    continue

                try:
                    with open(tmp.name, "rb") as f:
                        audio_bytes = f.read()
                except OSError:
                    continue
                if len(audio_bytes) < 1500:
                    # Almost certainly silence — skip transcription.
                    continue

                text = await transcribe_audio_bytes(audio_bytes, "audio/webm", short_lang)
                if not text or not text.strip():
                    continue
                text = text.strip()

                # Persist source + translations, mirroring ingest_caption.
                async with AsyncSessionLocal() as db:
                    db.add(LiveCaptionLine(
                        service_id=service_id,
                        language=short_lang,
                        text=text,
                        is_source=True,
                    ))
                    targets = [l for l in CAPTION_LANGUAGES if l != short_lang]
                    for lang in targets:
                        try:
                            translated = await translate_text(text, target_language=lang, source_language=short_lang)
                            if translated and translated.strip():
                                db.add(LiveCaptionLine(
                                    service_id=service_id,
                                    language=lang,
                                    text=translated.strip(),
                                    is_source=False,
                                ))
                        except Exception as e:
                            print(f"[yt-captions] translate {lang} failed: {type(e).__name__}: {e}", flush=True)
                    await db.commit()

                # Tiny pause prevents a hot loop if the manifest serves silent frames.
                await asyncio.sleep(0.2)
            finally:
                try:
                    os.unlink(tmp.name)
                except OSError:
                    pass

    except asyncio.CancelledError:
        print(f"[yt-captions] loop cancelled for service={service_id}", flush=True)
        raise
    finally:
        _active_jobs.pop(service_id, None)


def start_capture(service_id: str, youtube_url: str, source_language: str = "en") -> dict:
    """Start (or re-use) a capture task for a service."""
    existing = _active_jobs.get(service_id)
    if existing and not existing.done():
        return {"status": "already_running", "service_id": service_id}
    task = asyncio.create_task(_capture_loop(service_id, youtube_url, source_language))
    _active_jobs[service_id] = task
    return {"status": "started", "service_id": service_id}


def stop_capture(service_id: str) -> dict:
    """Cancel a running capture."""
    task = _active_jobs.pop(service_id, None)
    if not task:
        return {"status": "not_running", "service_id": service_id}
    task.cancel()
    return {"status": "stopped", "service_id": service_id}


def capture_status(service_id: str) -> dict:
    """Inspect whether a capture is active for a service."""
    task = _active_jobs.get(service_id)
    if not task:
        return {"status": "idle", "service_id": service_id}
    if task.done():
        _active_jobs.pop(service_id, None)
        exc = task.exception() if not task.cancelled() else None
        return {"status": "done", "service_id": service_id, "error": str(exc) if exc else None}
    return {"status": "running", "service_id": service_id}
