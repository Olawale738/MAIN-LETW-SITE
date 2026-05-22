"""
User activity / history aggregation for the dashboard.

Pulls the user's prayer requests, service requests, recent bible reading
progress, and unread message stats into one timeline payload.
"""

from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from database import get_db
from models.user import User
from models.prayer import PrayerRequest
from models.service_request import ServiceRequest
from models.notification import Notification
from models.message import Conversation
from schemas.profile import ActivityResponse, ActivityItem
from utils.dependencies import get_current_active_user


router = APIRouter(prefix="/api/activity", tags=["Activity"])


@router.get("/me", response_model=ActivityResponse)
async def my_activity(
    limit: int = 50,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    items: List[ActivityItem] = []
    counts: dict = {}

    # Prayer requests
    res = await db.execute(
        select(PrayerRequest)
        .where(PrayerRequest.user_id == current_user.id)
        .order_by(PrayerRequest.created_at.desc())
        .limit(limit)
    )
    prayers = res.scalars().all()
    counts["prayer_requests"] = len(prayers)
    for p in prayers:
        items.append(ActivityItem(
            kind="prayer_request",
            title=p.title,
            description=(p.description[:160] if p.description else None),
            status=p.status.value if hasattr(p.status, "value") else str(p.status),
            happened_at=p.created_at,
            link=f"/dashboard/prayer-wall#{p.id}",
        ))

    # Service requests
    res = await db.execute(
        select(ServiceRequest)
        .where(ServiceRequest.user_id == current_user.id)
        .order_by(ServiceRequest.created_at.desc())
        .limit(limit)
    )
    services = res.scalars().all()
    counts["service_requests"] = len(services)
    for s in services:
        items.append(ActivityItem(
            kind="service_request",
            title=f"Service: {getattr(s, 'service_name', 'Service')}",
            description=getattr(s, "message", None),
            status=getattr(s, "status").value if hasattr(getattr(s, "status", None), "value") else str(getattr(s, "status", "")),
            happened_at=s.created_at,
            link="/dashboard",
        ))

    # Conversations summary
    res = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
        .limit(10)
    )
    convs = res.scalars().all()
    counts["conversations"] = len(convs)
    for c in convs:
        if c.last_message_at:
            items.append(ActivityItem(
                kind="message",
                title=c.subject or "Conversation",
                description=c.last_message_preview,
                status=c.status.value if hasattr(c.status, "value") else str(c.status),
                happened_at=c.last_message_at,
                link=f"/dashboard/messages?c={c.id}",
            ))

    # Recent notifications
    res = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(20)
    )
    notes = res.scalars().all()
    counts["notifications"] = len(notes)
    for n in notes:
        items.append(ActivityItem(
            kind="notification",
            title=n.title,
            description=n.message,
            status="read" if n.is_read else "unread",
            happened_at=n.created_at,
            link="/dashboard/notifications",
        ))

    # Sort timeline by date desc, cap at limit
    items.sort(key=lambda i: i.happened_at, reverse=True)
    return ActivityResponse(items=items[:limit], counts=counts)
