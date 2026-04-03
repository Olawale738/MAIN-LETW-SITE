"""
Announcement API endpoints.
Handles admin announcements for services with in-app and email notifications.
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from database import get_db
from models.user import User
from models.announcement import Announcement
from models.notification import Notification, NotificationType
from schemas.announcement import (
    AnnouncementCreate,
    AnnouncementResponse,
    AnnouncementListResponse,
)
from schemas.auth import MessageResponse
from utils.dependencies import get_current_active_user, get_admin_user
from services.email_service import send_announcement_email

router = APIRouter()


def _announcement_to_response(announcement: Announcement) -> AnnouncementResponse:
    """Convert Announcement model to response schema."""
    return AnnouncementResponse(
        id=announcement.id,
        service_name=announcement.service_name,
        title=announcement.title,
        content=announcement.content,
        created_by=announcement.created_by,
        created_at=announcement.created_at,
        is_active=announcement.is_active
    )


@router.post("", response_model=AnnouncementResponse, status_code=status.HTTP_201_CREATED)
async def create_announcement(
    data: AnnouncementCreate,
    background_tasks: BackgroundTasks,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new service announcement (admin only).
    Sends in-app notifications and emails to all users approved for this service.
    """
    # Create announcement
    announcement = Announcement(
        service_name=data.service_name,
        title=data.title,
        content=data.content,
        created_by=admin_user.id,
        is_active=True
    )
    db.add(announcement)
    await db.flush()  # Get the ID before committing
    
    # Find all users who have this service approved
    # Users store services as JSON array, so we need to check if service_name is in the array
    all_users_result = await db.execute(
        select(User).where(User.status == "active")
    )
    all_users = all_users_result.scalars().all()
    
    # Filter users who have this service
    target_users = [
        user for user in all_users 
        if user.services and data.service_name in user.services
    ]
    
    # Create in-app notifications for all target users
    for user in target_users:
        notification = Notification(
            user_id=user.id,
            title=f"📢 New Announcement: {data.title}",
            message=f"New announcement for {data.service_name}: {data.content[:150]}{'...' if len(data.content) > 150 else ''}",
            type=NotificationType.ANNOUNCEMENT,
            reference_id=announcement.id
        )
        db.add(notification)
    
    await db.commit()
    await db.refresh(announcement)
    
    # Send email notifications in background
    for user in target_users:
        background_tasks.add_task(
            send_announcement_email,
            user.email,
            user.name,
            data.service_name,
            data.title,
            data.content
        )
    
    return _announcement_to_response(announcement)


@router.get("", response_model=AnnouncementListResponse)
async def get_all_announcements(
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all announcements (admin only).
    Returns all announcements ordered by creation date.
    """
    result = await db.execute(
        select(Announcement).order_by(Announcement.created_at.desc())
    )
    announcements = result.scalars().all()
    
    return AnnouncementListResponse(
        announcements=[_announcement_to_response(a) for a in announcements],
        total=len(announcements)
    )


@router.get("/service/{service_name}", response_model=AnnouncementListResponse)
async def get_service_announcements(
    service_name: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get active announcements for a specific service.
    Returns only active announcements for the service.
    """
    result = await db.execute(
        select(Announcement)
        .where(
            Announcement.service_name == service_name,
            Announcement.is_active == True
        )
        .order_by(Announcement.created_at.desc())
    )
    announcements = result.scalars().all()
    
    return AnnouncementListResponse(
        announcements=[_announcement_to_response(a) for a in announcements],
        total=len(announcements)
    )


@router.delete("/{announcement_id}", response_model=MessageResponse)
async def delete_announcement(
    announcement_id: str,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete/deactivate an announcement (admin only).
    Soft delete by setting is_active to False.
    """
    result = await db.execute(
        select(Announcement).where(Announcement.id == announcement_id)
    )
    announcement = result.scalar_one_or_none()
    
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found"
        )
    
    announcement.is_active = False
    await db.commit()
    
    return MessageResponse(
        message="Announcement deleted successfully",
        success=True
    )
