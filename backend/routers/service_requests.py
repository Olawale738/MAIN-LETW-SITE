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
        from models.user import UserRole
        admin_result = await db.execute(
            select(User).where(User.role == UserRole.ADMIN)
        )
        admins = admin_result.scalars().all()
        
        # Build a detail string for the admin notification — for Volunteer requests include phone/dept
        def _volunteer_detail(svc_name: str) -> str:
            if svc_name == "Volunteer" and request.message:
                import re as _re
                dept = _re.search(r'Department:\s*([^|]+)', request.message)
                phone = _re.search(r'Phone:\s*([^|]+)', request.message)
                avail = _re.search(r'Availability:\s*([^|]+)', request.message)
                parts = []
                if dept:  parts.append(dept.group(1).strip())
                if avail: parts.append(avail.group(1).strip())
                if phone: parts.append(f"📞 {phone.group(1).strip()}")
                return f"Volunteer ({', '.join(parts)})" if parts else svc_name
            return svc_name

        notif_services_str = ', '.join(_volunteer_detail(s) for s in pending_services)

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
                    "message": f"{current_user.name} has requested to join: {notif_services_str}",
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
    
    # For Volunteer requests: extract department from message for richer notifications
    display_name = service_request.service_name
    notif_extra = ""
    if service_request.service_name == "Volunteer" and service_request.message:
        import re as _re
        dept_match = _re.search(r'Department:\s*([^|]+)', service_request.message)
        avail_match = _re.search(r'Availability:\s*([^|]+)', service_request.message)
        if dept_match:
            dept = dept_match.group(1).strip()
            display_name = f"Volunteer – {dept}"
            avail = avail_match.group(1).strip() if avail_match else None
            notif_extra = f" You're assigned to the {dept} team" + (f" ({avail})" if avail else "") + ". Your coordinator will contact you soon."

    # Create notification for user
    notification = Notification(
        user_id=user.id,
        title="Volunteer Application Approved! 🎉" if service_request.service_name == "Volunteer" else "Service Request Approved",
        message=f"Your request to join '{display_name}' has been approved!{notif_extra}",
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
            [display_name]
        )
    
    return _request_to_response(service_request)


async def _set_volunteer_dept_memberships_active(db: AsyncSession, user_id: str, active: bool):
    """Activate/deactivate a user's memberships in the volunteer departments."""
    from models.department import DepartmentMember, DepartmentType
    from sqlalchemy import update as _update
    vol_depts = [DepartmentType.MEDIA, DepartmentType.HOSPITALITY, DepartmentType.USHERING, DepartmentType.SECURITY]
    await db.execute(
        _update(DepartmentMember)
        .where(DepartmentMember.user_id == user_id, DepartmentMember.department.in_(vol_depts))
        .values(is_active=active)
    )


@router.put("/{request_id}/suspend", response_model=ServiceRequestResponse)
async def suspend_service_request(
    request_id: str,
    action: ServiceRequestAction | None = None,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Temporarily suspend an approved volunteer/service (admin only, reversible).
    Revokes access (service + dept dashboards) but keeps the record so it can be
    reinstated later."""
    result = await db.execute(select(ServiceRequest).where(ServiceRequest.id == request_id))
    sr = result.scalar_one_or_none()
    if not sr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service request not found")
    if sr.status != ServiceRequestStatus.APPROVED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Only approved requests can be suspended (currently {sr.status.value}).")

    sr.status = ServiceRequestStatus.SUSPENDED
    sr.reviewed_by = admin_user.id
    sr.reviewed_at = datetime.utcnow()
    if action and action.note:
        sr.admin_note = action.note

    # Revoke service access (unless another approved request grants the same service)
    user_result = await db.execute(select(User).where(User.id == sr.user_id))
    user = user_result.scalar_one_or_none()
    if user:
        other_approved = await db.execute(
            select(ServiceRequest).where(
                ServiceRequest.user_id == sr.user_id,
                ServiceRequest.service_name == sr.service_name,
                ServiceRequest.status == ServiceRequestStatus.APPROVED,
                ServiceRequest.id != request_id,
            )
        )
        if not other_approved.scalar_one_or_none():
            current = list(user.services) if user.services else []
            if sr.service_name in current:
                current.remove(sr.service_name)
                user.services = current
                from sqlalchemy.orm.attributes import flag_modified
                flag_modified(user, "services")
        if sr.service_name == "Volunteer":
            await _set_volunteer_dept_memberships_active(db, sr.user_id, False)

        db.add(Notification(
            user_id=user.id,
            title="Volunteer access suspended" if sr.service_name == "Volunteer" else "Service suspended",
            message=f"Your access to '{sr.service_name}' has been temporarily suspended by an admin."
                    + (f" Reason: {action.note}" if action and action.note else ""),
            type=NotificationType.GENERAL,
            reference_id=sr.id,
        ))

    await db.commit()
    await db.refresh(sr)
    return _request_to_response(sr)


@router.put("/{request_id}/reinstate", response_model=ServiceRequestResponse)
async def reinstate_service_request(
    request_id: str,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Reinstate a suspended volunteer/service (admin only)."""
    result = await db.execute(select(ServiceRequest).where(ServiceRequest.id == request_id))
    sr = result.scalar_one_or_none()
    if not sr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service request not found")
    if sr.status != ServiceRequestStatus.SUSPENDED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Only suspended requests can be reinstated (currently {sr.status.value}).")

    sr.status = ServiceRequestStatus.APPROVED
    sr.reviewed_by = admin_user.id
    sr.reviewed_at = datetime.utcnow()

    user_result = await db.execute(select(User).where(User.id == sr.user_id))
    user = user_result.scalar_one_or_none()
    if user:
        current = list(user.services) if user.services else []
        if sr.service_name not in current:
            current.append(sr.service_name)
            user.services = current
            from sqlalchemy.orm.attributes import flag_modified
            flag_modified(user, "services")
        if sr.service_name == "Volunteer":
            await _set_volunteer_dept_memberships_active(db, sr.user_id, True)

        db.add(Notification(
            user_id=user.id,
            title="Volunteer access reinstated 🎉" if sr.service_name == "Volunteer" else "Service reinstated",
            message=f"Your access to '{sr.service_name}' has been reinstated. Welcome back!",
            type=NotificationType.SERVICE_APPROVED,
            reference_id=sr.id,
        ))

    await db.commit()
    await db.refresh(sr)
    return _request_to_response(sr)


@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service_request(
    request_id: str,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a service request (admin only).
    If the request was approved, removes the service from the user's services list.
    Sends an in-app notification to the user informing them of the removal.
    """
    result = await db.execute(
        select(ServiceRequest).where(ServiceRequest.id == request_id)
    )
    service_request = result.scalar_one_or_none()

    if not service_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service request not found")

    # If the request was approved, revoke access from user.services
    if service_request.status == ServiceRequestStatus.APPROVED:
        user_result = await db.execute(select(User).where(User.id == service_request.user_id))
        user = user_result.scalar_one_or_none()
        if user:
            current_services = list(user.services) if user.services else []
            # Only remove if no other approved request for the same service exists
            other_approved = await db.execute(
                select(ServiceRequest).where(
                    ServiceRequest.user_id == service_request.user_id,
                    ServiceRequest.service_name == service_request.service_name,
                    ServiceRequest.status == ServiceRequestStatus.APPROVED,
                    ServiceRequest.id != request_id
                )
            )
            if not other_approved.scalar_one_or_none():
                if service_request.service_name in current_services:
                    current_services.remove(service_request.service_name)
                    user.services = current_services
                    from sqlalchemy.orm.attributes import flag_modified
                    flag_modified(user, "services")

            # Notify the user
            notif_id = str(uuid.uuid4())
            await db.execute(
                text("""
                    INSERT INTO notifications (id, user_id, title, message, type, is_read, reference_id, created_at)
                    VALUES (:id, :user_id, :title, :message, :type, :is_read, :reference_id, :created_at)
                """),
                {
                    "id": notif_id,
                    "user_id": service_request.user_id,
                    "title": "Volunteer Record Removed",
                    "message": f"Your volunteer record for '{service_request.service_name}' has been removed by an administrator. Please contact the church office if you have questions.",
                    "type": NotificationType.SERVICE_REJECTED.name,
                    "is_read": False,
                    "reference_id": service_request.id,
                    "created_at": datetime.utcnow()
                }
            )

    await db.delete(service_request)
    await db.commit()


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
