"""
Dashboard stats API router.
Provides aggregated statistics for the admin dashboard.
"""

from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional, List

from database import get_db
from models.user import User, UserStatus
from models.sermon import Sermon
from models.event import Event
from models.service_request import ServiceRequest, ServiceRequestStatus
from models.announcement import Announcement
from utils.dependencies import get_admin_user


router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


class DashboardStats(BaseModel):
    total_sermons: int
    sermons_this_month: int
    total_events: int
    upcoming_events: int
    next_event_title: Optional[str] = None
    next_event_date: Optional[date] = None
    total_users: int
    active_users: int
    new_users_this_month: int
    pending_requests: int
    total_announcements: int


class RecentActivity(BaseModel):
    type: str
    title: str
    description: str
    timestamp: datetime


class UserStats(BaseModel):
    id: str
    name: str
    email: str
    status: str
    role: str
    created_at: datetime
    services: List[str]


class DashboardUserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    services: Optional[List[str]] = None


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Get aggregated dashboard statistics."""
    today = date.today()
    month_start = today.replace(day=1)
    
    # Sermon stats
    total_sermons_result = await db.execute(select(func.count(Sermon.id)))
    total_sermons = total_sermons_result.scalar() or 0
    
    sermons_month_result = await db.execute(
        select(func.count(Sermon.id)).where(Sermon.sermon_date >= month_start)
    )
    sermons_this_month = sermons_month_result.scalar() or 0
    
    # Event stats
    total_events_result = await db.execute(select(func.count(Event.id)))
    total_events = total_events_result.scalar() or 0
    
    upcoming_events_result = await db.execute(
        select(func.count(Event.id)).where(
            Event.event_date >= today,
            Event.is_published == True
        )
    )
    upcoming_events = upcoming_events_result.scalar() or 0
    
    # Get next event
    next_event_result = await db.execute(
        select(Event).where(
            Event.event_date >= today,
            Event.is_published == True
        ).order_by(Event.event_date).limit(1)
    )
    next_event = next_event_result.scalar_one_or_none()
    
    # User stats
    total_users_result = await db.execute(select(func.count(User.id)))
    total_users = total_users_result.scalar() or 0
    
    active_users_result = await db.execute(
        select(func.count(User.id)).where(User.status == UserStatus.ACTIVE)
    )
    active_users = active_users_result.scalar() or 0
    
    new_users_result = await db.execute(
        select(func.count(User.id)).where(User.created_at >= month_start)
    )
    new_users_this_month = new_users_result.scalar() or 0
    
    # Pending service requests
    pending_result = await db.execute(
        select(func.count(ServiceRequest.id)).where(
            ServiceRequest.status == ServiceRequestStatus.PENDING
        )
    )
    pending_requests = pending_result.scalar() or 0
    
    # Announcements
    announcements_result = await db.execute(
        select(func.count(Announcement.id)).where(Announcement.is_active == True)
    )
    total_announcements = announcements_result.scalar() or 0
    
    return DashboardStats(
        total_sermons=total_sermons,
        sermons_this_month=sermons_this_month,
        total_events=total_events,
        upcoming_events=upcoming_events,
        next_event_title=next_event.title if next_event else None,
        next_event_date=next_event.event_date if next_event else None,
        total_users=total_users,
        active_users=active_users,
        new_users_this_month=new_users_this_month,
        pending_requests=pending_requests,
        total_announcements=total_announcements
    )


@router.get("/recent-activity")
async def get_recent_activity(
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Get recent activity feed."""
    activities = []
    
    # Recent sermons
    sermons_result = await db.execute(
        select(Sermon).order_by(Sermon.created_at.desc()).limit(3)
    )
    for sermon in sermons_result.scalars().all():
        activities.append({
            "type": "sermon",
            "title": f"New Sermon: {sermon.title}",
            "description": f"By {sermon.preacher}",
            "timestamp": sermon.created_at
        })
    
    # Recent users
    users_result = await db.execute(
        select(User).order_by(User.created_at.desc()).limit(3)
    )
    for user in users_result.scalars().all():
        activities.append({
            "type": "user",
            "title": f"New User: {user.name}",
            "description": user.email,
            "timestamp": user.created_at
        })
    
    # Recent events
    events_result = await db.execute(
        select(Event).order_by(Event.created_at.desc()).limit(2)
    )
    for event in events_result.scalars().all():
        activities.append({
            "type": "event",
            "title": f"Event Created: {event.title}",
            "description": f"Scheduled for {event.event_date}",
            "timestamp": event.created_at
        })
    
    # Sort by timestamp
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return {"activities": activities[:limit]}


@router.get("/users")
async def list_users(
    status_filter: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """List all users (admin only)."""
    query = select(User)
    
    if status_filter:
        if status_filter == "active":
            query = query.where(User.status == UserStatus.ACTIVE)
        elif status_filter == "pending":
            query = query.where(User.status == UserStatus.PENDING_VERIFICATION)
    
    query = query.order_by(User.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    users = result.scalars().all()
    
    # Get total count
    count_result = await db.execute(select(func.count(User.id)))
    total = count_result.scalar() or 0
    
    return {
        "users": [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "status": u.status.value if u.status else "unknown",
                "role": u.role.value if u.role else "user",
                "created_at": u.created_at,
                "services": u.services or []
            }
            for u in users
        ],
        "total": total
    }


@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    updates: DashboardUserUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Update a user (admin only)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if updates.name is not None:
        user.name = updates.name
    if updates.email is not None:
        user.email = updates.email
    if updates.role is not None:
        try:
            from models.user import UserRole
            user.role = UserRole(updates.role)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid role")
    if updates.status is not None:
        try:
            from models.user import UserStatus
            user.status = UserStatus(updates.status)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status")
    if updates.services is not None:
        user.services = updates.services
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(user, "services")
        
    await db.commit()
    await db.refresh(user)
    
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "status": user.status.value,
        "role": user.role.value,
        "services": user.services
    }


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Delete a user (admin only)."""
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
        
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    await db.delete(user)
    await db.commit()
    
    return {"message": "User deleted successfully"}
# Force reload
