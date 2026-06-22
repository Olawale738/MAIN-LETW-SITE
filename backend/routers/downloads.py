"""
Downloads API — admin uploads, public listing + streaming.

Files are stored as binary in Postgres alongside metadata. Keep individual
files under ~25 MB; for larger media use the external_url path instead.
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select, desc, update
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from models.download_resource import DownloadResource
from utils.dependencies import get_admin_user
import io


router = APIRouter(prefix="/api/downloads", tags=["Downloads"])


CATEGORIES = ["Sermon", "E-book", "Bulletin", "Music", "Video", "Article", "Other"]
MAX_FILE_BYTES = 25 * 1024 * 1024   # 25 MB hard cap


class ResourceOut(BaseModel):
    id: str
    title: str
    description: Optional[str]
    category: str
    kind: str                  # 'file' | 'url'
    external_url: Optional[str]
    file_name: Optional[str]
    file_mime_type: Optional[str]
    file_size: Optional[int]
    is_published: bool
    download_count: int
    created_at: datetime


def _to_dict(r: DownloadResource) -> dict:
    return {
        "id": r.id, "title": r.title, "description": r.description,
        "category": r.category, "kind": r.kind, "external_url": r.external_url,
        "file_name": r.file_name, "file_mime_type": r.file_mime_type, "file_size": r.file_size,
        "is_published": r.is_published, "download_count": r.download_count,
        "created_at": r.created_at,
    }


# ─── Public ──────────────────────────────────────────────────────────────────

@router.get("", response_model=List[ResourceOut])
async def list_public(category: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    q = select(DownloadResource).where(DownloadResource.is_published == True).order_by(desc(DownloadResource.created_at))
    if category:
        q = q.where(DownloadResource.category == category)
    res = await db.execute(q.limit(500))
    return [_to_dict(r) for r in res.scalars().all()]


@router.get("/categories")
async def list_categories():
    return {"categories": CATEGORIES}


@router.get("/{rid}/file")
async def stream_file(rid: str, db: AsyncSession = Depends(get_db)):
    """Stream a binary resource. URL-kind resources should be linked directly."""
    res = await db.execute(select(DownloadResource).where(DownloadResource.id == rid))
    r = res.scalar_one_or_none()
    if not r or not r.is_published:
        raise HTTPException(404, "Not found")
    if r.kind != "file" or not r.file_data:
        raise HTTPException(400, "This resource is an external link, not a hosted file.")
    # increment counter (best-effort, fire and forget)
    try:
        await db.execute(update(DownloadResource).where(DownloadResource.id == rid).values(download_count=DownloadResource.download_count + 1))
        await db.commit()
    except Exception:
        pass
    safe_name = (r.file_name or f"{r.id}.bin").replace("\"", "")
    mime = r.file_mime_type or "application/octet-stream"
    # Media files (video/audio/image) must be served inline so <video>/<audio>/<img>
    # tags can render them; only true documents get the download-attachment treatment.
    disposition = "inline" if mime.split("/")[0] in {"video", "audio", "image"} else "attachment"
    headers = {
        "Content-Disposition": f'{disposition}; filename="{safe_name}"',
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=86400",
    }
    return StreamingResponse(io.BytesIO(r.file_data), media_type=mime, headers=headers)


# ─── Admin ───────────────────────────────────────────────────────────────────

@router.get("/admin/all", response_model=List[ResourceOut])
async def admin_list(db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(DownloadResource).order_by(desc(DownloadResource.created_at)).limit(1000))
    return [_to_dict(r) for r in res.scalars().all()]


@router.post("/admin/url", response_model=ResourceOut, status_code=201)
async def admin_add_url(
    title: str = Form(...),
    category: str = Form(...),
    external_url: str = Form(...),
    description: Optional[str] = Form(None),
    is_published: bool = Form(True),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    if category not in CATEGORIES:
        raise HTTPException(400, f"category must be one of {CATEGORIES}")
    r = DownloadResource(
        title=title, description=description, category=category,
        kind="url", external_url=external_url, is_published=is_published,
    )
    db.add(r); await db.commit(); await db.refresh(r)
    return _to_dict(r)


@router.post("/admin/file", response_model=ResourceOut, status_code=201)
async def admin_add_file(
    title: str = Form(...),
    category: str = Form(...),
    description: Optional[str] = Form(None),
    is_published: bool = Form(True),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    if category not in CATEGORIES:
        raise HTTPException(400, f"category must be one of {CATEGORIES}")
    data = await file.read()
    if len(data) > MAX_FILE_BYTES:
        raise HTTPException(413, f"File exceeds {MAX_FILE_BYTES // (1024 * 1024)} MB. Use an external URL instead.")
    r = DownloadResource(
        title=title, description=description, category=category,
        kind="file", file_data=data, file_name=file.filename or "untitled",
        file_mime_type=file.content_type or "application/octet-stream",
        file_size=len(data), is_published=is_published,
    )
    db.add(r); await db.commit(); await db.refresh(r)
    return _to_dict(r)


@router.put("/admin/{rid}", response_model=ResourceOut)
async def admin_update(
    rid: str,
    title: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    external_url: Optional[str] = Form(None),
    is_published: Optional[bool] = Form(None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    res = await db.execute(select(DownloadResource).where(DownloadResource.id == rid))
    r = res.scalar_one_or_none()
    if not r:
        raise HTTPException(404, "Not found")
    if title is not None: r.title = title
    if category is not None:
        if category not in CATEGORIES:
            raise HTTPException(400, f"category must be one of {CATEGORIES}")
        r.category = category
    if description is not None: r.description = description
    if external_url is not None: r.external_url = external_url
    if is_published is not None: r.is_published = is_published
    await db.commit(); await db.refresh(r)
    return _to_dict(r)


@router.delete("/admin/{rid}")
async def admin_delete(rid: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_admin_user)):
    res = await db.execute(select(DownloadResource).where(DownloadResource.id == rid))
    r = res.scalar_one_or_none()
    if not r:
        return {"deleted": 0}
    await db.delete(r); await db.commit()
    return {"deleted": 1}
