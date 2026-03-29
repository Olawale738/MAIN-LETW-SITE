"""
Sermon API router.
Endpoints for managing sermons with video URLs, audio, and documents.
Audio and documents are stored as binary in the database.
"""

import os
import re
import mimetypes
from datetime import date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from database import get_db
from models.user import User
from models.sermon import Sermon
from schemas.sermon import (
    SermonCreate, SermonUpdate, SermonResponse, SermonListResponse
)
from utils.dependencies import get_current_active_user, get_admin_user


router = APIRouter(prefix="/api/sermons", tags=["sermons"])

# Max file sizes
MAX_AUDIO_SIZE = 50 * 1024 * 1024  # 50MB for audio
MAX_DOC_SIZE = 10 * 1024 * 1024    # 10MB for documents
MAX_THUMB_SIZE = 2 * 1024 * 1024   # 2MB for thumbnails


def extract_youtube_id(url: str) -> Optional[str]:
    """Extract YouTube video ID from various URL formats."""
    if not url:
        return None
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})',
        r'youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def get_youtube_thumbnail(url: str) -> Optional[str]:
    """Get YouTube thumbnail URL from video URL."""
    video_id = extract_youtube_id(url)
    if video_id:
        return f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
    return None


def sermon_to_response(sermon: Sermon) -> SermonResponse:
    """Convert Sermon model to response schema."""
    return SermonResponse(
        id=sermon.id,
        title=sermon.title,
        description=sermon.description,
        preacher=sermon.preacher,
        sermon_date=sermon.sermon_date,
        series=sermon.series,
        video_url=sermon.video_url,
        video_thumbnail=get_youtube_thumbnail(sermon.video_url) if sermon.video_url else None,
        has_audio=sermon.audio_data is not None,
        audio_filename=sermon.audio_filename,
        audio_size=sermon.audio_size,
        has_document=sermon.document_data is not None,
        document_filename=sermon.document_filename,
        document_size=sermon.document_size,
        document_url=sermon.document_url,
        has_thumbnail=sermon.thumbnail_data is not None,
        is_featured=sermon.is_featured,
        is_published=sermon.is_published,
        view_count=sermon.view_count,
        created_at=sermon.created_at
    )


# ============= Public Endpoints =============

@router.get("/public", response_model=SermonListResponse)
async def list_public_sermons(
    series: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """List published sermons (public access, no auth required)."""
    query = select(Sermon).where(Sermon.is_published == True)
    
    if series:
        query = query.where(Sermon.series == series)
    
    # Order by featured first, then by date
    query = query.order_by(desc(Sermon.is_featured), desc(Sermon.sermon_date))
    query = query.offset(offset).limit(limit)
    
    result = await db.execute(query)
    sermons = result.scalars().all()
    
    # Get total count
    count_query = select(Sermon).where(Sermon.is_published == True)
    if series:
        count_query = count_query.where(Sermon.series == series)
    count_result = await db.execute(count_query)
    total = len(count_result.scalars().all())
    
    return SermonListResponse(
        sermons=[sermon_to_response(s) for s in sermons],
        total=total
    )


@router.get("/series")
async def list_series(db: AsyncSession = Depends(get_db)):
    """Get list of all sermon series (public)."""
    result = await db.execute(
        select(Sermon.series).where(
            Sermon.is_published == True,
            Sermon.series.isnot(None),
            Sermon.series != ""
        ).distinct()
    )
    series_list = [row[0] for row in result.fetchall() if row[0]]
    return {"series": sorted(series_list)}


# ============= Admin Endpoints =============

@router.get("/", response_model=SermonListResponse)
async def list_all_sermons(
    include_unpublished: bool = True,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """List all sermons including unpublished (admin only)."""
    query = select(Sermon)
    if not include_unpublished:
        query = query.where(Sermon.is_published == True)
    
    query = query.order_by(desc(Sermon.sermon_date))
    result = await db.execute(query)
    sermons = result.scalars().all()
    
    return SermonListResponse(
        sermons=[sermon_to_response(s) for s in sermons],
        total=len(sermons)
    )


@router.post("/", response_model=SermonResponse, status_code=status.HTTP_201_CREATED)
async def create_sermon(
    title: str = Form(...),
    preacher: str = Form(...),
    sermon_date: date = Form(...),
    description: Optional[str] = Form(None),
    series: Optional[str] = Form(None),
    video_url: Optional[str] = Form(None),
    document_url: Optional[str] = Form(None),
    is_featured: bool = Form(False),
    is_published: bool = Form(True),
    audio: Optional[UploadFile] = File(None),
    document: Optional[UploadFile] = File(None),
    thumbnail: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Create a new sermon with optional audio, document, and thumbnail."""
    sermon = Sermon(
        title=title,
        description=description,
        preacher=preacher,
        sermon_date=sermon_date,
        series=series,
        video_url=video_url,
        document_url=document_url,
        is_featured=is_featured,
        is_published=is_published
    )
    
    # Handle audio upload
    if audio and audio.filename:
        audio_data = await audio.read()
        if len(audio_data) > MAX_AUDIO_SIZE:
            raise HTTPException(status_code=400, detail="Audio file too large (max 50MB)")
        sermon.audio_data = audio_data
        sermon.audio_filename = audio.filename
        sermon.audio_mime_type = mimetypes.guess_type(audio.filename)[0] or 'audio/mpeg'
        sermon.audio_size = len(audio_data)
    
    # Handle document upload
    if document and document.filename:
        doc_data = await document.read()
        if len(doc_data) > MAX_DOC_SIZE:
            raise HTTPException(status_code=400, detail="Document file too large (max 10MB)")
        sermon.document_data = doc_data
        sermon.document_filename = document.filename
        sermon.document_mime_type = mimetypes.guess_type(document.filename)[0] or 'application/octet-stream'
        sermon.document_size = len(doc_data)
    
    # Handle thumbnail upload
    if thumbnail and thumbnail.filename:
        thumb_data = await thumbnail.read()
        if len(thumb_data) > MAX_THUMB_SIZE:
            raise HTTPException(status_code=400, detail="Thumbnail too large (max 2MB)")
        sermon.thumbnail_data = thumb_data
        sermon.thumbnail_mime_type = mimetypes.guess_type(thumbnail.filename)[0] or 'image/jpeg'
    
    db.add(sermon)
    await db.commit()
    await db.refresh(sermon)
    
    return sermon_to_response(sermon)


@router.get("/{sermon_id}", response_model=SermonResponse)
async def get_sermon(
    sermon_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific sermon."""
    result = await db.execute(
        select(Sermon).where(Sermon.id == sermon_id)
    )
    sermon = result.scalar_one_or_none()
    
    if not sermon:
        raise HTTPException(status_code=404, detail="Sermon not found")
    
    # Increment view count
    sermon.view_count += 1
    await db.commit()
    
    return sermon_to_response(sermon)


@router.put("/{sermon_id}", response_model=SermonResponse)
async def update_sermon(
    sermon_id: str,
    title: Optional[str] = Form(None),
    preacher: Optional[str] = Form(None),
    sermon_date: Optional[date] = Form(None),
    description: Optional[str] = Form(None),
    series: Optional[str] = Form(None),
    video_url: Optional[str] = Form(None),
    document_url: Optional[str] = Form(None),
    is_featured: Optional[bool] = Form(None),
    is_published: Optional[bool] = Form(None),
    audio: Optional[UploadFile] = File(None),
    document: Optional[UploadFile] = File(None),
    thumbnail: Optional[UploadFile] = File(None),
    remove_audio: bool = Form(False),
    remove_document: bool = Form(False),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Update a sermon (admin only)."""
    result = await db.execute(
        select(Sermon).where(Sermon.id == sermon_id)
    )
    sermon = result.scalar_one_or_none()
    
    if not sermon:
        raise HTTPException(status_code=404, detail="Sermon not found")
    
    # Update fields
    if title is not None:
        sermon.title = title
    if description is not None:
        sermon.description = description
    if preacher is not None:
        sermon.preacher = preacher
    if sermon_date is not None:
        sermon.sermon_date = sermon_date
    if series is not None:
        sermon.series = series
    if video_url is not None:
        sermon.video_url = video_url
    if document_url is not None:
        sermon.document_url = document_url
    if is_featured is not None:
        sermon.is_featured = is_featured
    if is_published is not None:
        sermon.is_published = is_published
    
    # Handle audio
    if remove_audio:
        sermon.audio_data = None
        sermon.audio_filename = None
        sermon.audio_mime_type = None
        sermon.audio_size = None
    elif audio and audio.filename:
        audio_data = await audio.read()
        if len(audio_data) > MAX_AUDIO_SIZE:
            raise HTTPException(status_code=400, detail="Audio file too large (max 50MB)")
        sermon.audio_data = audio_data
        sermon.audio_filename = audio.filename
        sermon.audio_mime_type = mimetypes.guess_type(audio.filename)[0] or 'audio/mpeg'
        sermon.audio_size = len(audio_data)
    
    # Handle document
    if remove_document:
        sermon.document_data = None
        sermon.document_filename = None
        sermon.document_mime_type = None
        sermon.document_size = None
    elif document and document.filename:
        doc_data = await document.read()
        if len(doc_data) > MAX_DOC_SIZE:
            raise HTTPException(status_code=400, detail="Document file too large (max 10MB)")
        sermon.document_data = doc_data
        sermon.document_filename = document.filename
        sermon.document_mime_type = mimetypes.guess_type(document.filename)[0] or 'application/octet-stream'
        sermon.document_size = len(doc_data)
    
    # Handle thumbnail
    if thumbnail and thumbnail.filename:
        thumb_data = await thumbnail.read()
        if len(thumb_data) > MAX_THUMB_SIZE:
            raise HTTPException(status_code=400, detail="Thumbnail too large (max 2MB)")
        sermon.thumbnail_data = thumb_data
        sermon.thumbnail_mime_type = mimetypes.guess_type(thumbnail.filename)[0] or 'image/jpeg'
    
    await db.commit()
    await db.refresh(sermon)
    
    return sermon_to_response(sermon)


@router.delete("/{sermon_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sermon(
    sermon_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Delete a sermon (admin only)."""
    result = await db.execute(
        select(Sermon).where(Sermon.id == sermon_id)
    )
    sermon = result.scalar_one_or_none()
    
    if not sermon:
        raise HTTPException(status_code=404, detail="Sermon not found")
    
    await db.delete(sermon)
    await db.commit()


# ============= Media Download Endpoints =============

@router.get("/{sermon_id}/audio")
async def download_audio(
    sermon_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Download sermon audio file."""
    result = await db.execute(
        select(Sermon).where(Sermon.id == sermon_id)
    )
    sermon = result.scalar_one_or_none()
    
    if not sermon:
        raise HTTPException(status_code=404, detail="Sermon not found")
    
    if not sermon.audio_data:
        raise HTTPException(status_code=404, detail="No audio available")
    
    return Response(
        content=sermon.audio_data,
        media_type=sermon.audio_mime_type or 'audio/mpeg',
        headers={
            'Content-Disposition': f'attachment; filename="{sermon.audio_filename or "audio.mp3"}"',
            'Content-Length': str(sermon.audio_size or len(sermon.audio_data))
        }
    )


@router.get("/{sermon_id}/document")
async def download_document(
    sermon_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Download sermon document file."""
    result = await db.execute(
        select(Sermon).where(Sermon.id == sermon_id)
    )
    sermon = result.scalar_one_or_none()
    
    if not sermon:
        raise HTTPException(status_code=404, detail="Sermon not found")
    
    if not sermon.document_data:
        raise HTTPException(status_code=404, detail="No document available")
    
    return Response(
        content=sermon.document_data,
        media_type=sermon.document_mime_type or 'application/octet-stream',
        headers={
            'Content-Disposition': f'attachment; filename="{sermon.document_filename or "document"}"',
            'Content-Length': str(sermon.document_size or len(sermon.document_data))
        }
    )


@router.get("/{sermon_id}/thumbnail")
async def get_thumbnail(
    sermon_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get sermon thumbnail image."""
    result = await db.execute(
        select(Sermon).where(Sermon.id == sermon_id)
    )
    sermon = result.scalar_one_or_none()
    
    if not sermon:
        raise HTTPException(status_code=404, detail="Sermon not found")
    
    if not sermon.thumbnail_data:
        raise HTTPException(status_code=404, detail="No thumbnail available")
    
    return Response(
        content=sermon.thumbnail_data,
        media_type=sermon.thumbnail_mime_type or 'image/jpeg'
    )
