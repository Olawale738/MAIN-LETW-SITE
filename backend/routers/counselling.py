"""
Counselling API endpoints.
Handles management of counselling requests.
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime
import uuid

from database import get_db
from models.user import User
from models.counselling import CounsellingRequest, CounsellingStatus
from schemas.counselling import (
    CounsellingCreate,
    CounsellingResponse,
    CounsellingListResponse,
    CounsellingReply,
    CounsellingUpdate
)
from schemas.auth import MessageResponse
from utils.dependencies import get_admin_user
from services.email_service import send_email

router = APIRouter()


@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def create_counselling_request(
    request: CounsellingCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Submit a confidential counselling request.
    Public endpoint.
    """
    db_request = CounsellingRequest(
        name=request.name,
        email=request.email,
        message=request.message,
        status=CounsellingStatus.NEW
    )
    
    db.add(db_request)
    await db.commit()
    
    # Send acknowledgment email via background task
    # TODO: Implement specific email template for counselling if needed
    
    # Notify admins? (Optional: could add notification logic here similar to service requests)
    
    return MessageResponse(
        message="Your request has been submitted securely. A counsellor will contact you shortly.",
        success=True
    )


@router.get("", response_model=CounsellingListResponse)
async def get_counselling_requests(
    status_filter: CounsellingStatus | None = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all counselling requests.
    Admin only.
    """
    query = select(CounsellingRequest).order_by(desc(CounsellingRequest.created_at))
    
    if status_filter:
        query = query.where(CounsellingRequest.status == status_filter)
        
    # Get total count
    # This is a bit inefficient for large tables but fine for this scale
    result = await db.execute(query)
    all_items = result.scalars().all()
    total = len(all_items)
    
    # Apply pagination
    items = all_items[offset : offset + limit]
    
    return CounsellingListResponse(items=items, total=total)


@router.get("/{request_id}", response_model=CounsellingResponse)
async def get_counselling_request(
    request_id: str,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific counselling request.
    Admin only.
    """
    result = await db.execute(
        select(CounsellingRequest).where(CounsellingRequest.id == request_id)
    )
    request = result.scalar_one_or_none()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Counselling request not found"
        )
        
    # Mark as read if it wasn't
    if not request.is_read:
        request.is_read = True
        await db.commit()
        await db.refresh(request)
        
    return request


@router.put("/{request_id}", response_model=CounsellingResponse)
async def update_counselling_request(
    request_id: str,
    update_data: CounsellingUpdate,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a counselling request (status, notes).
    Admin only.
    """
    result = await db.execute(
        select(CounsellingRequest).where(CounsellingRequest.id == request_id)
    )
    request = result.scalar_one_or_none()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Counselling request not found"
        )
    
    if update_data.status:
        request.status = update_data.status
    if update_data.admin_notes is not None:
        request.admin_notes = update_data.admin_notes
    if update_data.is_read is not None:
        request.is_read = update_data.is_read
        
    await db.commit()
    await db.refresh(request)
    return request


@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_counselling_request(
    request_id: str,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a counselling request.
    Admin only.
    """
    result = await db.execute(
        select(CounsellingRequest).where(CounsellingRequest.id == request_id)
    )
    request = result.scalar_one_or_none()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Counselling request not found"
        )
        
    await db.delete(request)
    await db.commit()


@router.post("/{request_id}/reply", response_model=MessageResponse)
async def reply_to_counselling_request(
    request_id: str,
    reply: CounsellingReply,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Reply to a counselling request via email.
    Admin only.
    """
    result = await db.execute(
        select(CounsellingRequest).where(CounsellingRequest.id == request_id)
    )
    request = result.scalar_one_or_none()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Counselling request not found"
        )

    # Prepare email content
    # We'll use a generic email function for now or the existing `send_email` helper
    # Assuming `send_email` takes (to_email, subject, body/html)
    
    # This is a simplified usage dependent on existing email service capabilities
    try:
        if background_tasks:
            background_tasks.add_task(
                send_email,
                to_email=request.email,
                subject=reply.subject,
                html_content=f"<p>Dear {request.name},</p><p>{reply.message.replace(chr(10), '<br>')}</p><p>Best regards,<br>Light Encounter Tabernacle Counselling Team</p>"
            )
        else:
            await send_email(
                to_email=request.email,
                subject=reply.subject,
                html_content=f"<p>Dear {request.name},</p><p>{reply.message.replace(chr(10), '<br>')}</p><p>Best regards,<br>Light Encounter Tabernacle Counselling Team</p>"
            )
            
        # Update status to RESOLVED or IN_PROGRESS automatically? 
        # Let's update to IN_PROGRESS if it was NEW
        if request.status == CounsellingStatus.NEW:
            request.status = CounsellingStatus.IN_PROGRESS
        
        # Append to admin notes that a reply was sent
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
        note_entry = f"[{timestamp}] {current_user.name} replied via email."
        if request.admin_notes:
            request.admin_notes = request.admin_notes + "\n" + note_entry
        else:
            request.admin_notes = note_entry
            
        await db.commit()
        
    except Exception as e:
        print(f"Error sending email: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email: {str(e)}"
        )
    
    return MessageResponse(
        message="Reply sent successfully.",
        success=True
    )
