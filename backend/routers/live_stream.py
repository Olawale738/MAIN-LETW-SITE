from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import desc, select
from typing import List, Optional

from database import get_db
from models.live_stream import LiveStream
from models.user import User
from schemas.live_stream import LiveStreamCreate, LiveStreamResponse, LiveStreamUpdate
from utils.dependencies import get_admin_user as get_current_admin_user

router = APIRouter(prefix="/api/live-stream", tags=["Live Stream"])

@router.get("/active", response_model=Optional[LiveStreamResponse])
async def get_active_stream(db: AsyncSession = Depends(get_db)):
    """
    Get the current active live stream. 
    Returns None if no active stream exists.
    """
    result = await db.execute(
        select(LiveStream)
        .filter(LiveStream.is_active == True)
        .order_by(desc(LiveStream.created_at))
    )
    stream = result.scalars().first()
    return stream

@router.post("/", response_model=LiveStreamResponse)
async def create_stream(
    stream: LiveStreamCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Create a new live stream. 
    If is_active is True, it will deactivate other active streams.
    """
    if stream.is_active:
        # Deactivate all other streams
        result = await db.execute(select(LiveStream).filter(LiveStream.is_active == True))
        active_streams = result.scalars().all()
        for s in active_streams:
            s.is_active = False
    
    new_stream = LiveStream(**stream.dict())
    db.add(new_stream)
    await db.commit()
    await db.refresh(new_stream)
    return new_stream

@router.put("/{stream_id}", response_model=LiveStreamResponse)
async def update_stream(
    stream_id: str,
    stream_update: LiveStreamUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Update a live stream.
    If setting is_active to True, deactivates others.
    """
    result = await db.execute(select(LiveStream).filter(LiveStream.id == stream_id))
    db_stream = result.scalars().first()
    
    if not db_stream:
        raise HTTPException(status_code=404, detail="Stream not found")
        
    if stream_update.is_active is True:
        # Deactivate all other streams
        result = await db.execute(select(LiveStream).filter(LiveStream.is_active == True))
        active_streams = result.scalars().all()
        for s in active_streams:
            if s.id != stream_id:
                s.is_active = False
                
    update_data = stream_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_stream, key, value)
        
    await db.commit()
    await db.refresh(db_stream)
    return db_stream

@router.get("/history", response_model=List[LiveStreamResponse])
async def get_stream_history(
    limit: int = 20, 
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Get history of live streams (Admin only).
    """
    result = await db.execute(
        select(LiveStream)
        .order_by(desc(LiveStream.created_at))
        .offset(offset)
        .limit(limit)
    )
    streams = result.scalars().all()
    return streams
