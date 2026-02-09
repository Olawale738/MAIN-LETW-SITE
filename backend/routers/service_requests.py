"""
Service Request API endpoints.
Handles user requests to join services and admin approval workflow.
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from datetime import datetime
import uuid

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
from services.email_service import send_service_approved_email, send_new_request_notification_email

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
        "message": request.message,
        "created_at": request.created_at,
        "updated_at": request.updated_at,
    }
    
    if include_user and request.user:
        data["user_name"] = request.user.name
        data["user_email"] = request.user.email
    
    return ServiceRequestResponse(**data)


AUTO_APPROVED_SERVICES = ["Prayer", "Prayer meeting", "Evangelism"]


@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def create_service_requests(
    request: ServiceRequestCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Submit requests to join services.
    Creates pending requests for each service that needs admin approval.
    Auto-approves specific services like Theology school.
    """
    # Filter out services that already have pending or approved requests
    # BUT if a message is provided, we assume this is a specific inquiry/appointment request and allow it.
    if request.message:
        new_services = request.services
    else:
        existing_result = await db.execute(
            select(ServiceRequest.service_name).where(
                ServiceRequest.user_id == current_user.id,
                ServiceRequest.status.in_([ServiceRequestStatus.PENDING, ServiceRequestStatus.APPROVED])
            )
        )
        existing_services = set(existing_result.scalars().all())
        new_services = [s for s in request.services if s not in existing_services]
    
    if not new_services:
        return MessageResponse(
            message="You already have pending or approved requests for all selected services.",
            success=True
        )
    
    # Refresh user to ensure session state is clean
    await db.refresh(current_user)
    
    # Split into auto-approved and pending services
    auto_approved = [s for s in new_services if s in AUTO_APPROVED_SERVICES]
    pending_services = [s for s in new_services if s not in AUTO_APPROVED_SERVICES]
    
    # Process auto-approved services
    if auto_approved:
        # Add to user's services list immediately
        current_services = list(current_user.services) if current_user.services else []
        services_added = False
        
        for service_name in auto_approved:
            if service_name not in current_services:
                current_services.append(service_name)
                services_added = True
            
            # Create approved service request record
            service_request = ServiceRequest(
                user=current_user,
                service_name=service_name,
                status=ServiceRequestStatus.APPROVED,
                reviewed_at=datetime.utcnow(),
                admin_note="Auto-approved by system",
                message=request.message
            )
            db.add(service_request)
            
            # Create notification for user (using raw SQL to avoid ORM conflicts)
            notif_id = str(uuid.uuid4())
            await db.execute(
                text("""
                    INSERT INTO notifications (id, user_id, title, message, type, is_read, reference_id, created_at)
                    VALUES (:id, :user_id, :title, :message, :type, :is_read, :reference_id, :created_at)
                """),
                {
                    "id": notif_id,
                    "user_id": current_user.id,
                    "title": "Service Joined",
                    "message": f"You have successfully joined '{service_name}'.",
                    "type": NotificationType.SERVICE_APPROVED.name,
                    "is_read": False,
                    "reference_id": service_request.id,
                    "created_at": datetime.utcnow()
                }
            )
        
        if services_added:
            current_user.services = current_services
            from sqlalchemy.orm.attributes import flag_modified
            flag_modified(current_user, "services")
    
    # Process pending services
    if pending_services:
        for service_name in pending_services:
            service_request = ServiceRequest(
                user=current_user,
                service_name=service_name,
                status=ServiceRequestStatus.PENDING,
                message=request.message
            )
            db.add(service_request)
        
        # Notify admins about new requests
        admin_result = await db.execute(
            select(User).where(User.role == "admin")
        )
        admins = admin_result.scalars().all()
        
        for admin in admins:
            # DB Notification
            notif_id = str(uuid.uuid4())
            await db.execute(
                text("""
                    INSERT INTO notifications (id, user_id, title, message, type, is_read, reference_id, created_at)
                    VALUES (:id, :user_id, :title, :message, :type, :is_read, :reference_id, :created_at)
                """),
                {
                    "id": notif_id,
                    "user_id": admin.id,
                    "title": "New Service Requests",
                    "message": f"{current_user.name} has requested to join {len(pending_services)} service(s): {', '.join(pending_services)}",
                    "type": NotificationType.NEW_SERVICE_REQUEST.name,
                    "is_read": False,
                    "reference_id": current_user.id,
                    "created_at": datetime.utcnow()
                }
            )
            
            # Email Notification (background)
            if background_tasks:
                background_tasks.add_task(
                    send_new_request_notification_email,
                    to_email=admin.email,
                    admin_name=admin.name,
                    user_name=current_user.name,
                    user_email=current_user.email,
                    services=pending_services,
                    message=request.message
                )
            else:
                # Fallback if background_tasks not provided
                 await send_new_request_notification_email(
                    to_email=admin.email,
                    admin_name=admin.name,
                    user_name=current_user.name,
                    user_email=current_user.email,
                    services=pending_services,
                    message=request.message
                )
    
    await db.commit()
    
    # Construct response message
    if auto_approved and pending_services:
        msg = f"Successfully joined {len(auto_approved)} service(s). {len(pending_services)} other request(s) are awaiting approval."
    elif auto_approved:
        msg = f"Successfully joined {len(auto_approved)} service(s)."
    else:
        msg = f"Successfully submitted {len(pending_services)} service request(s). Awaiting admin approval."
    
    return MessageResponse(
        message=msg,
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
