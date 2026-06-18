"""
YouTube auto-import for sermons.
Admin pastes a YouTube URL → backend fetches metadata via the free oEmbed
endpoint (no API key required) and returns title, author, thumbnail.
"""

import re
import httpx
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, HttpUrl

from models.user import User
from utils.dependencies import get_admin_user


router = APIRouter(prefix="/api/youtube", tags=["YouTube Import"])


_ID_PATTERNS = [
    r"youtube\.com\/watch\?.*?v=([a-zA-Z0-9_-]{11})",
    r"youtu\.be\/([a-zA-Z0-9_-]{11})",
    r"youtube\.com\/embed\/([a-zA-Z0-9_-]{11})",
    r"youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})",
    r"youtube\.com\/live\/([a-zA-Z0-9_-]{11})",
]


def extract_id(url: str) -> Optional[str]:
    for p in _ID_PATTERNS:
        m = re.search(p, url)
        if m:
            return m.group(1)
    return None


class ImportIn(BaseModel):
    url: str


@router.post("/import")
async def import_metadata(body: ImportIn, _: User = Depends(get_admin_user)):
    """Return title / author / thumbnail / video_id for a YouTube URL.
    Uses oEmbed (no API key) — works for any public video."""
    vid = extract_id(body.url)
    if not vid:
        raise HTTPException(400, "Not a recognisable YouTube URL")

    canonical = f"https://www.youtube.com/watch?v={vid}"
    async with httpx.AsyncClient(timeout=15) as cli:
        r = await cli.get("https://www.youtube.com/oembed", params={"url": canonical, "format": "json"})
    if r.status_code >= 400:
        raise HTTPException(404, "Video not found or unavailable")
    data = r.json()
    return {
        "video_id": vid,
        "title": data.get("title"),
        "author": data.get("author_name"),
        "author_url": data.get("author_url"),
        "thumbnail_url": data.get("thumbnail_url") or f"https://img.youtube.com/vi/{vid}/maxresdefault.jpg",
        "canonical_url": canonical,
        "embed_url": f"https://www.youtube.com/embed/{vid}",
    }
