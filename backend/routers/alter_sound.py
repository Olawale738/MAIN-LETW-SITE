"""
Alter Sound API endpoints for audio worship content management
"""
import mimetypes
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from database import get_db
from models.alter_sound import AudioCategory, AudioTrack, AlterSoundPageSettings
from schemas.alter_sound import (
    AudioCategoryCreate, AudioCategoryUpdate, AudioCategoryResponse,
    AudioTrackCreate, AudioTrackUpdate, AudioTrackResponse,
    AlterSoundPageSettingsUpdate, AlterSoundPageSettingsResponse,
    AlterSoundPageData
)
from utils.dependencies import get_current_user, get_admin_user
from models.user import User

router = APIRouter(prefix="/api/alter-sound", tags=["alter-sound"])

# File upload configuration
ALLOWED_AUDIO_EXTENSIONS = {".mp3", ".wav", ".m4a", ".ogg", ".flac"}
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_AUDIO_SIZE = 50 * 1024 * 1024  # 50MB
MAX_IMAGE_SIZE = 5 * 1024 * 1024   # 5MB


def get_file_extension(filename: str) -> str:
    """Get file extension in lowercase"""
    import os
    return os.path.splitext(filename)[1].lower()


# ============================================================================
# USER ENDPOINTS
# ============================================================================

@router.get("/page-data", response_model=AlterSoundPageData)
async def get_alter_sound_page_data(db: AsyncSession = Depends(get_db)):
    """Get all data for the Alter Sound page"""
    # Get or create settings
    result = await db.execute(select(AlterSoundPageSettings))
    settings = result.scalar_one_or_none()

    if not settings:
        settings = AlterSoundPageSettings()
        db.add(settings)
        await db.commit()
        await db.refresh(settings)

    # Get featured tracks
    featured_result = await db.execute(
        select(AudioTrack)
        .options(selectinload(AudioTrack.category))
        .where(AudioTrack.is_featured == True, AudioTrack.is_active == True)
        .order_by(AudioTrack.order_index)
    )
    featured_tracks = featured_result.scalars().all()

    # Get active categories
    categories_result = await db.execute(
        select(AudioCategory)
        .where(AudioCategory.is_active == True)
        .order_by(AudioCategory.order_index)
    )
    categories = categories_result.scalars().all()

    # Get all active tracks
    tracks_result = await db.execute(
        select(AudioTrack)
        .options(selectinload(AudioTrack.category))
        .where(AudioTrack.is_active == True)
        .order_by(AudioTrack.order_index)
    )
    all_tracks = tracks_result.scalars().all()

    return AlterSoundPageData(
        settings=settings,
        featured_tracks=featured_tracks,
        categories=categories,
        all_tracks=all_tracks
    )


@router.post("/tracks/{track_id}/play")
async def increment_play_count(track_id: str, db: AsyncSession = Depends(get_db)):
    """Increment play count for a track"""
    result = await db.execute(select(AudioTrack).where(AudioTrack.id == track_id))
    track = result.scalar_one_or_none()

    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    track.play_count += 1
    await db.commit()

    return {"message": "Play count incremented", "play_count": track.play_count}


# ============================================================================
# ADMIN ENDPOINTS - Categories
# ============================================================================

@router.get("/admin/categories", response_model=List[AudioCategoryResponse])
async def get_all_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Get all audio categories (admin)"""
    result = await db.execute(select(AudioCategory).order_by(AudioCategory.order_index))
    return result.scalars().all()


@router.post("/admin/categories", response_model=AudioCategoryResponse)
async def create_category(
    category_data: AudioCategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Create a new audio category"""
    category = AudioCategory(**category_data.model_dump())
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category



@router.put("/admin/categories/{category_id}", response_model=AudioCategoryResponse)
async def update_category(
    category_id: str,
    category_data: AudioCategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Update an audio category"""
    result = await db.execute(select(AudioCategory).where(AudioCategory.id == category_id))
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    for key, value in category_data.model_dump(exclude_unset=True).items():
        setattr(category, key, value)

    await db.commit()
    await db.refresh(category)
    return category


@router.delete("/admin/categories/{category_id}")
async def delete_category(
    category_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Delete an audio category"""
    result = await db.execute(select(AudioCategory).where(AudioCategory.id == category_id))
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    await db.delete(category)
    await db.commit()
    return {"message": "Category deleted successfully"}


# ============================================================================
# ADMIN ENDPOINTS - Audio Tracks
# ============================================================================

@router.get("/admin/tracks", response_model=List[AudioTrackResponse])
async def get_all_tracks(
    category_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Get all audio tracks (admin)"""
    query = select(AudioTrack).options(selectinload(AudioTrack.category))

    if category_id:
        query = query.where(AudioTrack.category_id == category_id)

    query = query.order_by(AudioTrack.order_index)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/admin/tracks", response_model=AudioTrackResponse)
async def create_track(
    category_id: str = Form(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    artist: Optional[str] = Form(None),
    duration: Optional[str] = Form(None),
    is_featured: bool = Form(False),
    is_active: bool = Form(True),
    order_index: int = Form(0),
    audio: UploadFile = File(...),
    cover: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Create a new audio track with file uploads"""
    # Verify category exists
    category_result = await db.execute(select(AudioCategory).where(AudioCategory.id == category_id))
    if not category_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Category not found")

    # Validate audio file
    file_ext = get_file_extension(audio.filename)
    if file_ext not in ALLOWED_AUDIO_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid audio file type. Allowed: {', '.join(ALLOWED_AUDIO_EXTENSIONS)}"
        )

    # Read and validate audio file size
    audio_data = await audio.read()
    if len(audio_data) > MAX_AUDIO_SIZE:
        raise HTTPException(status_code=400, detail=f"Audio file too large (max {MAX_AUDIO_SIZE / 1024 / 1024}MB)")

    # Create track
    track = AudioTrack(
        category_id=category_id,
        title=title,
        description=description,
        artist=artist,
        duration=duration,
        is_featured=is_featured,
        is_active=is_active,
        order_index=order_index,
        audio_data=audio_data,
        audio_filename=audio.filename,
        audio_mime_type=mimetypes.guess_type(audio.filename)[0] or 'audio/mpeg',
        audio_size=len(audio_data)
    )

    # Handle cover image if provided
    if cover and cover.filename:
        cover_ext = get_file_extension(cover.filename)
        if cover_ext not in ALLOWED_IMAGE_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid image file type. Allowed: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}"
            )

        cover_data = await cover.read()
        if len(cover_data) > MAX_IMAGE_SIZE:
            raise HTTPException(status_code=400, detail=f"Cover image too large (max {MAX_IMAGE_SIZE / 1024 / 1024}MB)")

        track.cover_image_data = cover_data
        track.cover_image_mime_type = mimetypes.guess_type(cover.filename)[0] or 'image/jpeg'

    db.add(track)
    await db.commit()
    await db.refresh(track)

    # Load category relationship
    await db.refresh(track, ["category"])
    return track


@router.put("/admin/tracks/{track_id}", response_model=AudioTrackResponse)
async def update_track(
    track_id: str,
    track_data: AudioTrackUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Update an audio track"""
    result = await db.execute(
        select(AudioTrack)
        .options(selectinload(AudioTrack.category))
        .where(AudioTrack.id == track_id)
    )
    track = result.scalar_one_or_none()

    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    # If category is being updated, verify it exists
    if track_data.category_id:
        category_result = await db.execute(select(AudioCategory).where(AudioCategory.id == track_data.category_id))
        if not category_result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Category not found")

    for key, value in track_data.model_dump(exclude_unset=True).items():
        setattr(track, key, value)

    await db.commit()
    await db.refresh(track)
    return track


@router.delete("/admin/tracks/{track_id}")
async def delete_track(
    track_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Delete an audio track"""
    result = await db.execute(select(AudioTrack).where(AudioTrack.id == track_id))
    track = result.scalar_one_or_none()

    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    await db.delete(track)
    await db.commit()
    return {"message": "Track deleted successfully"}


# ============================================================================
# MEDIA ENDPOINTS - Serve audio and cover images from database
# ============================================================================

@router.get("/tracks/{track_id}/audio")
async def get_track_audio(
    track_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get audio file for a track"""
    result = await db.execute(select(AudioTrack).where(AudioTrack.id == track_id))
    track = result.scalar_one_or_none()

    if not track or not track.audio_data:
        raise HTTPException(status_code=404, detail="Audio not found")

    return Response(
        content=track.audio_data,
        media_type=track.audio_mime_type or 'audio/mpeg',
        headers={
            'Content-Disposition': f'inline; filename="{track.audio_filename}"',
            'Accept-Ranges': 'bytes'
        }
    )


@router.get("/tracks/{track_id}/cover")
async def get_track_cover(
    track_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get cover image for a track"""
    result = await db.execute(select(AudioTrack).where(AudioTrack.id == track_id))
    track = result.scalar_one_or_none()

    if not track or not track.cover_image_data:
        raise HTTPException(status_code=404, detail="Cover image not found")

    return Response(
        content=track.cover_image_data,
        media_type=track.cover_image_mime_type or 'image/jpeg'
    )


# ============================================================================
# ADMIN ENDPOINTS - Page Settings
# ============================================================================

@router.get("/admin/settings", response_model=AlterSoundPageSettingsResponse)
async def get_page_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Get Alter Sound page settings"""
    result = await db.execute(select(AlterSoundPageSettings))
    settings = result.scalar_one_or_none()

    if not settings:
        settings = AlterSoundPageSettings()
        db.add(settings)
        await db.commit()
        await db.refresh(settings)

    return settings


@router.put("/admin/settings", response_model=AlterSoundPageSettingsResponse)
async def update_page_settings(
    settings_data: AlterSoundPageSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Update Alter Sound page settings"""
    result = await db.execute(select(AlterSoundPageSettings))
    settings = result.scalar_one_or_none()

    if not settings:
        settings = AlterSoundPageSettings()
        db.add(settings)

    for key, value in settings_data.model_dump(exclude_unset=True).items():
        setattr(settings, key, value)

    await db.commit()
    await db.refresh(settings)
    return settings


