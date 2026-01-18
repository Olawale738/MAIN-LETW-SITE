"""
Service Request API endpoints.
Handles user requests to join services and admin approval workflow.
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime

from database import get_db
from models.user import User
from models.service_request import ServiceRequest, ServiceRequestStatus
from models.notification import Notification, NotificationType
from schemas.service_request import (
    ServiceRequestCreate,
    ServiceRequestAction,
    ServiceRequestResponse,
    ServiceRequestListResponse,
    MyServiceRequestsResponse,
)
from schemas.auth import MessageResponse
from utils.dependencies import get_current_active_user, get_admin_user
from services.email_service import send_service_approved_email

router = APIRouter()


def _request_to_response(request: ServiceRequest, include_user: bool = False) -> ServiceRequestResponse:
    """Convert ServiceRequest model to response schema."""
    data = {
        "id": request.id,
        "user_id": request.user_id,
        "service_name": request.service_name,
        "status": request.status,
        "reviewed_by": request.reviewed_by,
        "reviewed_at": request.reviewed_at,
        "admin_note": request.admin_note,
        "created_at": request.created_at,
        "updated_at": request.updated_at,
    }
    
    if include_user and request.user:
        data["user_name"] = request.user.name
        data["user_email"] = request.user.email
    
    return ServiceRequestResponse(**data)


@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def create_service_requests(
    request: ServiceRequestCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Submit requests to join services.
    Creates pending requests for each service that needs admin approval.
    """
    # Get existing pending/approved requests for this user
    existing_result = await db.execute(
        select(ServiceRequest.service_name).where(
            ServiceRequest.user_id == current_user.id,
            ServiceRequest.status.in_([ServiceRequestStatus.PENDING, ServiceRequestStatus.APPROVED])
        )
    )
    existing_services = set(existing_result.scalars().all())
    
    # Filter out services that already have pending or approved requests
    new_services = [s for s in request.services if s not in existing_services]
    
    if not new_services:
        return MessageResponse(
            message="You already have pending or approved requests for all selected services.",
            success=True
        )
    
    # Create new service requests
    for service_name in new_services:
        service_request = ServiceRequest(
            user_id=current_user.id,
            service_name=service_name,
            status=ServiceRequestStatus.PENDING
        )
        db.add(service_request)
    
    await db.commit()
    
    # Notify admins about new requests
    admin_result = await db.execute(
        select(User).where(User.role == "admin")
    )
    admins = admin_result.scalars().all()
    
    for admin in admins:
        notification = Notification(
            user_id=admin.id,
            title="New Service Requests",
            message=f"{current_user.name} has requested to join {len(new_services)} service(s): {', '.join(new_services)}",
            type=NotificationType.NEW_SERVICE_REQUEST,
            reference_id=current_user.id
        )
        db.add(notification)
    
    await db.commit()
    
    return MessageResponse(
        message=f"Successfully submitted {len(new_services)} service request(s). Awaiting admin approval.",
        success=True
    )


@router.get("/my", response_model=MyServiceRequestsResponse)
async def get_my_service_requests(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current user's service requests grouped by status.
    """
    result = await db.execute(
        select(ServiceRequest)
        .where(ServiceRequest.user_id == current_user.id)
        .order_by(ServiceRequest.created_at.desc())
    )
    requests = result.scalars().all()
    
    pending = [_request_to_response(r) for r in requests if r.status == ServiceRequestStatus.PENDING]
    approved = [_request_to_response(r) for r in requests if r.status == ServiceRequestStatus.APPROVED]
    rejected = [_request_to_response(r) for r in requests if r.status == ServiceRequestStatus.REJECTED]
    
    return MyServiceRequestsResponse(
        pending=pending,
        approved=approved,
        rejected=rejected
    )


@router.get("", response_model=ServiceRequestListResponse)
async def get_all_service_requests(
    status_filter: ServiceRequestStatus | None = None,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all service requests (admin only).
    Optionally filter by status.
    """
    query = select(ServiceRequest).order_by(ServiceRequest.created_at.desc())
    
    if status_filter:
        query = query.where(ServiceRequest.status == status_filter)
    
    result = await db.execute(query)
    requests = result.scalars().all()
    
    # Load user relationships
    for request in requests:
        await db.refresh(request, ["user"])
    
    return ServiceRequestListResponse(
        requests=[_request_to_response(r, include_user=True) for r in requests],
        total=len(requests)
    )


@router.put("/{request_id}/approve", response_model=ServiceRequestResponse)
async def approve_service_request(
    request_id: str,
    action: ServiceRequestAction | None = None,
    background_tasks: BackgroundTasks = None,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Approve a service request (admin only).
    Adds the service to user's approved services and sends email notification.
    """
    # Get the service request
    result = await db.execute(
        select(ServiceRequest).where(ServiceRequest.id == request_id)
    )
    service_request = result.scalar_one_or_none()
    
    if not service_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service request not found"
        )
    
    if service_request.status != ServiceRequestStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Service request is already {service_request.status.value}"
        )
    
    # Update request status
    service_request.status = ServiceRequestStatus.APPROVED
    service_request.reviewed_by = admin_user.id
    service_request.reviewed_at = datetime.utcnow()
    if action and action.note:
        service_request.admin_note = action.note
    
    # Get the user and add service to their approved services
    user_result = await db.execute(
        select(User).where(User.id == service_request.user_id)
    )
    user = user_result.scalar_one()
    
    # Add service to user's services list
    current_services = list(user.services) if user.services else []
    if service_request.service_name not in current_services:
        current_services.append(service_request.service_name)
        user.services = current_services
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(user, "services")
    
    # Create notification for user
    notification = Notification(
        user_id=user.id,
        title="Service Request Approved",
        message=f"Your request to join '{service_request.service_name}' has been approved! You can now access this service.",
        type=NotificationType.SERVICE_APPROVED,
        reference_id=service_request.id
    )
    db.add(notification)
    
    await db.commit()
    await db.refresh(service_request)
    
    # Send email notification in background
    if background_tasks:
        background_tasks.add_task(
            send_service_approved_email,
            user.email,
            user.name,
            [service_request.service_name]
        )
    
    return _request_to_response(service_request)


@router.put("/{request_id}/reject", response_model=ServiceRequestResponse)
async def reject_service_request(
    request_id: str,
    action: ServiceRequestAction | None = None,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Reject a service request (admin only).
    """
    # Get the service request
    result = await db.execute(
        select(ServiceRequest).where(ServiceRequest.id == request_id)
    )
    service_request = result.scalar_one_or_none()
    
    if not service_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service request not found"
        )
    
    if service_request.status != ServiceRequestStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Service request is already {service_request.status.value}"
        )
    
    # Update request status
    service_request.status = ServiceRequestStatus.REJECTED
    service_request.reviewed_by = admin_user.id
    service_request.reviewed_at = datetime.utcnow()
    if action and action.note:
        service_request.admin_note = action.note
    
    # Create notification for user
    notification = Notification(
        user_id=service_request.user_id,
        title="Service Request Declined",
        message=f"Your request to join '{service_request.service_name}' was not approved.{' Reason: ' + action.note if action and action.note else ''}",
        type=NotificationType.SERVICE_REJECTED,
        reference_id=service_request.id
    )
    db.add(notification)
    
    await db.commit()
    await db.refresh(service_request)
    
    return _request_to_response(service_request)
