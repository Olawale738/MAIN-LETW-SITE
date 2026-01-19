"""
Leadership Training API router.
Endpoints for managing modules and content (videos, documents).
Documents are stored as binary data in the database.
"""

import os
import re
import mimetypes
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models.user import User
from models.leadership import LeadershipModule, LeadershipContent, ContentType
from models.user_progress import UserContentProgress
from schemas.leadership import (
    ModuleCreate, ModuleUpdate, ModuleResponse, ModuleListResponse,
    ModuleSummaryResponse, VideoContentCreate, DocumentContentCreate,
    ContentResponse
)
from utils.dependencies import get_current_active_user, get_admin_user


router = APIRouter(prefix="/api/leadership", tags=["leadership"])

# Max file size (10MB)
MAX_FILE_SIZE = 10 * 1024 * 1024


def extract_youtube_id(url: str) -> Optional[str]:
    """Extract YouTube video ID from various URL formats."""
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
        return f"https://img.youtube.com/vi/{video_id}/mqdefault.jpg"
    return None


def content_to_response(content: LeadershipContent) -> ContentResponse:
    """Convert LeadershipContent model to response schema."""
    youtube_thumbnail = None
    if content.youtube_url:
        youtube_thumbnail = get_youtube_thumbnail(content.youtube_url)
    
    return ContentResponse(
        id=content.id,
        module_id=content.module_id,
        content_type=content.content_type,
        title=content.title,
        description=content.description,
        youtube_url=content.youtube_url,
        youtube_thumbnail=youtube_thumbnail,
        file_name=content.file_name,
        file_size=content.file_size,
        order_index=content.order_index,
        created_at=content.created_at
    )


# ============= Module Endpoints =============

@router.post("/modules", response_model=ModuleResponse, status_code=status.HTTP_201_CREATED)
async def create_module(
    data: ModuleCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Create a new Leadership module (admin only)."""
    module = LeadershipModule(
        title=data.title,
        description=data.description,
        order_index=data.order_index,
        is_published=data.is_published
    )
    db.add(module)
    await db.commit()
    await db.refresh(module)
    
    return ModuleResponse(
        id=module.id,
        title=module.title,
        description=module.description,
        order_index=module.order_index,
        is_published=module.is_published,
        created_at=module.created_at,
        contents=[]
    )


@router.get("/modules", response_model=ModuleListResponse)
async def list_modules(
    include_unpublished: bool = False,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user)
):
    """List all Leadership modules. Unpublished only visible to admins."""
    from models.user import UserRole
    
    query = select(LeadershipModule)
    
    # Non-admins only see published modules
    if user.role != UserRole.ADMIN or not include_unpublished:
        query = query.where(LeadershipModule.is_published == True)
    
    query = query.order_by(LeadershipModule.order_index)
    result = await db.execute(query)
    modules = result.scalars().all()
    
    module_responses = []
    for module in modules:
        # Eagerly load contents
        await db.refresh(module, ["contents"])
        contents = [content_to_response(c) for c in sorted(module.contents, key=lambda x: x.order_index)]
        module_responses.append(ModuleResponse(
            id=module.id,
            title=module.title,
            description=module.description,
            order_index=module.order_index,
            is_published=module.is_published,
            created_at=module.created_at,
            contents=contents
        ))
    
    return ModuleListResponse(modules=module_responses, total=len(module_responses))


@router.get("/modules/{module_id}", response_model=ModuleResponse)
async def get_module(
    module_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user)
):
    """Get a specific module with its contents."""
    from models.user import UserRole
    
    result = await db.execute(
        select(LeadershipModule).where(LeadershipModule.id == module_id)
    )
    module = result.scalar_one_or_none()
    
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Non-admins can only see published modules
    if not module.is_published and user.role != UserRole.ADMIN:
        raise HTTPException(status_code=404, detail="Module not found")
    
    await db.refresh(module, ["contents"])
    contents = [content_to_response(c) for c in sorted(module.contents, key=lambda x: x.order_index)]
    
    return ModuleResponse(
        id=module.id,
        title=module.title,
        description=module.description,
        order_index=module.order_index,
        is_published=module.is_published,
        created_at=module.created_at,
        contents=contents
    )


@router.put("/modules/{module_id}", response_model=ModuleResponse)
async def update_module(
    module_id: str,
    data: ModuleUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Update a module (admin only)."""
    result = await db.execute(
        select(LeadershipModule).where(LeadershipModule.id == module_id)
    )
    module = result.scalar_one_or_none()
    
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    if data.title is not None:
        module.title = data.title
    if data.description is not None:
        module.description = data.description
    if data.order_index is not None:
        module.order_index = data.order_index
    if data.is_published is not None:
        module.is_published = data.is_published
    
    await db.commit()
    await db.refresh(module, ["contents"])
    
    contents = [content_to_response(c) for c in sorted(module.contents, key=lambda x: x.order_index)]
    
    return ModuleResponse(
        id=module.id,
        title=module.title,
        description=module.description,
        order_index=module.order_index,
        is_published=module.is_published,
        created_at=module.created_at,
        contents=contents
    )


@router.delete("/modules/{module_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_module(
    module_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Delete a module and all its contents (admin only)."""
    result = await db.execute(
        select(LeadershipModule).where(LeadershipModule.id == module_id)
    )
    module = result.scalar_one_or_none()
    
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    await db.delete(module)
    await db.commit()


# ============= Content Endpoints =============

@router.post("/modules/{module_id}/video", response_model=ContentResponse, status_code=status.HTTP_201_CREATED)
async def add_video_content(
    module_id: str,
    data: VideoContentCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Add a YouTube video to a module (admin only)."""
    # Verify module exists
    result = await db.execute(
        select(LeadershipModule).where(LeadershipModule.id == module_id)
    )
    module = result.scalar_one_or_none()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Validate YouTube URL
    if not extract_youtube_id(data.youtube_url):
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")
    
    content = LeadershipContent(
        module_id=module_id,
        content_type=ContentType.VIDEO.value,
        title=data.title,
        description=data.description,
        youtube_url=data.youtube_url,
        order_index=data.order_index
    )
    db.add(content)
    await db.commit()
    await db.refresh(content)
    
    return content_to_response(content)


@router.post("/modules/{module_id}/document", response_model=ContentResponse, status_code=status.HTTP_201_CREATED)
async def add_document_content(
    module_id: str,
    title: str = Form(...),
    description: Optional[str] = Form(None),
    order_index: int = Form(0),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Upload a document to a module (admin only). File is stored in database."""
    # Verify module exists
    result = await db.execute(
        select(LeadershipModule).where(LeadershipModule.id == module_id)
    )
    module = result.scalar_one_or_none()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Validate file type
    allowed_extensions = {'.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt'}
    file_ext = os.path.splitext(file.filename or '')[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"File type not allowed. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Read file data
    try:
        file_data = await file.read()
        file_size = len(file_data)
        
        # Check file size
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read file: {str(e)}")
    
    # Get MIME type
    mime_type = mimetypes.guess_type(file.filename or '')[0] or 'application/octet-stream'
    
    content = LeadershipContent(
        module_id=module_id,
        content_type=ContentType.DOCUMENT.value,
        title=title,
        description=description,
        file_data=file_data,
        file_name=file.filename,
        file_mime_type=mime_type,
        file_size=file_size,
        order_index=order_index
    )
    db.add(content)
    await db.commit()
    await db.refresh(content)
    
    return content_to_response(content)


@router.delete("/content/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_content(
    content_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Delete a content item (admin only)."""
    result = await db.execute(
        select(LeadershipContent).where(LeadershipContent.id == content_id)
    )
    content = result.scalar_one_or_none()
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    await db.delete(content)
    await db.commit()


@router.get("/content/{content_id}/download")
async def download_document(
    content_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user)
):
    """Download a document file from database."""
    result = await db.execute(
        select(LeadershipContent).where(LeadershipContent.id == content_id)
    )
    content = result.scalar_one_or_none()
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    if content.content_type != ContentType.DOCUMENT.value:
        raise HTTPException(status_code=400, detail="This content is not a document")
    
    if not content.file_data:
        raise HTTPException(status_code=404, detail="File data not found")
    
    # Return binary data as response
    return Response(
        content=content.file_data,
        media_type=content.file_mime_type or 'application/octet-stream',
        headers={
            'Content-Disposition': f'attachment; filename="{content.file_name or "download"}"',
            'Content-Length': str(content.file_size or len(content.file_data))
        }
    )


# ============= Progress Tracking Endpoints =============

@router.get("/progress")
async def get_user_progress(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user)
):
    """Get user's completed content IDs."""
    result = await db.execute(
        select(UserContentProgress.content_id).where(
            UserContentProgress.user_id == user.id
        )
    )
    completed_ids = [row[0] for row in result.fetchall()]
    return {"completed_content_ids": completed_ids}


@router.post("/content/{content_id}/complete", status_code=status.HTTP_201_CREATED)
async def mark_content_complete(
    content_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user)
):
    """Mark a content item as completed."""
    # Verify content exists
    result = await db.execute(
        select(LeadershipContent).where(LeadershipContent.id == content_id)
    )
    content = result.scalar_one_or_none()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Check if already completed
    existing = await db.execute(
        select(UserContentProgress).where(
            UserContentProgress.user_id == user.id,
            UserContentProgress.content_id == content_id
        )
    )
    if existing.scalar_one_or_none():
        return {"message": "Already completed", "content_id": content_id}
    
    # Create progress record
    progress = UserContentProgress(
        user_id=user.id,
        content_id=content_id
    )
    db.add(progress)
    await db.commit()
    
    return {"message": "Content marked as completed", "content_id": content_id}


@router.delete("/content/{content_id}/complete", status_code=status.HTTP_200_OK)
async def unmark_content_complete(
    content_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user)
):
    """Unmark a content item as completed."""
    result = await db.execute(
        select(UserContentProgress).where(
            UserContentProgress.user_id == user.id,
            UserContentProgress.content_id == content_id
        )
    )
    progress = result.scalar_one_or_none()
    
    if not progress:
        return {"message": "Not marked as completed", "content_id": content_id}
    
    await db.delete(progress)
    await db.commit()
    
    return {"message": "Completion unmarked", "content_id": content_id}
