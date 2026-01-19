"""
Event API router.
Endpoints for managing church events.
"""

import mimetypes
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func

from database import get_db
from models.user import User
from models.event import Event
from utils.dependencies import get_current_active_user, get_admin_user
from pydantic import BaseModel
from datetime import datetime


router = APIRouter(prefix="/api/events", tags=["events"])

MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB


# ============= Schemas =============

class EventResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    event_date: date
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    location: Optional[str] = None
    event_type: str
    has_image: bool = False
    is_featured: bool
    is_published: bool
    registration_required: bool
    registration_link: Optional[str] = None
    max_attendees: Optional[int] = None
    registered_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class EventListResponse(BaseModel):
    events: list[EventResponse]
    total: int


def event_to_response(event: Event) -> EventResponse:
    return EventResponse(
        id=event.id,
        title=event.title,
        description=event.description,
        event_date=event.event_date,
        start_time=event.start_time,
        end_time=event.end_time,
        location=event.location,
        event_type=event.event_type,
        has_image=event.image_data is not None,
        is_featured=event.is_featured,
        is_published=event.is_published,
        registration_required=event.registration_required,
        registration_link=event.registration_link,
        max_attendees=event.max_attendees,
        registered_count=event.registered_count,
        created_at=event.created_at
    )


# ============= Public Endpoints =============

@router.get("/public", response_model=EventListResponse)
async def list_upcoming_events(
    event_type: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """List upcoming published events (public)."""
    today = date.today()
    query = select(Event).where(
        Event.is_published == True,
        Event.event_date >= today
    )
    
    if event_type:
        query = query.where(Event.event_type == event_type)
    
    query = query.order_by(desc(Event.is_featured), Event.event_date).limit(limit)
    result = await db.execute(query)
    events = result.scalars().all()
    
    return EventListResponse(
        events=[event_to_response(e) for e in events],
        total=len(events)
    )


@router.get("/types")
async def list_event_types(db: AsyncSession = Depends(get_db)):
    """Get list of all event types (public)."""
    result = await db.execute(
        select(Event.event_type).where(Event.is_published == True).distinct()
    )
    types = [row[0] for row in result.fetchall() if row[0]]
    return {"types": sorted(set(types))}


# ============= Admin Endpoints =============

@router.get("/", response_model=EventListResponse)
async def list_all_events(
    include_past: bool = False,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """List all events (admin only)."""
    query = select(Event)
    if not include_past:
        query = query.where(Event.event_date >= date.today())
    
    query = query.order_by(desc(Event.event_date))
    result = await db.execute(query)
    events = result.scalars().all()
    
    return EventListResponse(
        events=[event_to_response(e) for e in events],
        total=len(events)
    )


@router.post("/", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    title: str = Form(...),
    event_date: date = Form(...),
    description: Optional[str] = Form(None),
    start_time: Optional[str] = Form(None),
    end_time: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    event_type: str = Form("General"),
    is_featured: bool = Form(False),
    is_published: bool = Form(True),
    registration_required: bool = Form(False),
    registration_link: Optional[str] = Form(None),
    max_attendees: Optional[int] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Create a new event (admin only)."""
    event = Event(
        title=title,
        description=description,
        event_date=event_date,
        start_time=start_time,
        end_time=end_time,
        location=location,
        event_type=event_type,
        is_featured=is_featured,
        is_published=is_published,
        registration_required=registration_required,
        registration_link=registration_link,
        max_attendees=max_attendees
    )
    
    if image and image.filename:
        img_data = await image.read()
        if len(img_data) > MAX_IMAGE_SIZE:
            raise HTTPException(status_code=400, detail="Image too large (max 5MB)")
        event.image_data = img_data
        event.image_mime_type = mimetypes.guess_type(image.filename)[0] or 'image/jpeg'
    
    db.add(event)
    await db.commit()
    await db.refresh(event)
    
    return event_to_response(event)


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific event."""
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return event_to_response(event)


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: str,
    title: Optional[str] = Form(None),
    event_date: Optional[date] = Form(None),
    description: Optional[str] = Form(None),
    start_time: Optional[str] = Form(None),
    end_time: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    event_type: Optional[str] = Form(None),
    is_featured: Optional[bool] = Form(None),
    is_published: Optional[bool] = Form(None),
    registration_required: Optional[bool] = Form(None),
    registration_link: Optional[str] = Form(None),
    max_attendees: Optional[int] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Update an event (admin only)."""
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if title is not None: event.title = title
    if description is not None: event.description = description
    if event_date is not None: event.event_date = event_date
    if start_time is not None: event.start_time = start_time
    if end_time is not None: event.end_time = end_time
    if location is not None: event.location = location
    if event_type is not None: event.event_type = event_type
    if is_featured is not None: event.is_featured = is_featured
    if is_published is not None: event.is_published = is_published
    if registration_required is not None: event.registration_required = registration_required
    if registration_link is not None: event.registration_link = registration_link
    if max_attendees is not None: event.max_attendees = max_attendees
    
    if image and image.filename:
        img_data = await image.read()
        if len(img_data) > MAX_IMAGE_SIZE:
            raise HTTPException(status_code=400, detail="Image too large (max 5MB)")
        event.image_data = img_data
        event.image_mime_type = mimetypes.guess_type(image.filename)[0] or 'image/jpeg'
    
    await db.commit()
    await db.refresh(event)
    
    return event_to_response(event)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Delete an event (admin only)."""
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    await db.delete(event)
    await db.commit()


@router.get("/{event_id}/image")
async def get_event_image(
    event_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get event image."""
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    
    if not event or not event.image_data:
        raise HTTPException(status_code=404, detail="Image not found")
    
    return Response(
        content=event.image_data,
        media_type=event.image_mime_type or 'image/jpeg'
    )
