"""
Service Resource API endpoints.
Admin CRUD for managing downloadable files and links on service pages.
"""

import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models.user import User
from models.service_resource import ServiceResource
from schemas.service_resource import (
    ServiceResourceCreate,
    ServiceResourceUpdate,
    ServiceResourceResponse,
    ServiceResourceListResponse,
)
from schemas.auth import MessageResponse
from utils.dependencies import get_admin_user

router = APIRouter()

UPLOAD_DIR = "uploads/resources"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _resource_to_response(resource: ServiceResource) -> ServiceResourceResponse:
    """Convert ServiceResource model to response schema."""
    return ServiceResourceResponse(
        id=resource.id,
        title=resource.title,
        description=resource.description,
        icon=resource.icon,
        resource_type=resource.resource_type,
        file_url=resource.file_url,
        external_url=resource.external_url,
        service_slug=resource.service_slug,
        is_active=resource.is_active,
        display_order=resource.display_order,
        created_at=resource.created_at,
        updated_at=resource.updated_at,
    )


# ============= Public Endpoints =============

@router.get("/{slug}", response_model=ServiceResourceListResponse)
async def get_service_resources(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get active resources for a specific service page (public).
    Returns only active resources ordered by display_order.
    """
    result = await db.execute(
        select(ServiceResource)
        .where(
            ServiceResource.service_slug == slug,
            ServiceResource.is_active == True,
        )
        .order_by(ServiceResource.display_order.asc())
    )
    resources = result.scalars().all()

    return ServiceResourceListResponse(
        resources=[_resource_to_response(r) for r in resources],
        total=len(resources),
    )


# ============= Admin Endpoints =============

@router.get("/admin/all", response_model=ServiceResourceListResponse)
async def get_all_resources(
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all resources including inactive (admin only)."""
    result = await db.execute(
        select(ServiceResource).order_by(
            ServiceResource.service_slug.asc(),
            ServiceResource.display_order.asc(),
        )
    )
    resources = result.scalars().all()

    return ServiceResourceListResponse(
        resources=[_resource_to_response(r) for r in resources],
        total=len(resources),
    )


@router.post("", response_model=ServiceResourceResponse, status_code=status.HTTP_201_CREATED)
async def create_resource(
    data: ServiceResourceCreate,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new service resource (admin only)."""
    resource = ServiceResource(
        title=data.title,
        description=data.description,
        icon=data.icon,
        resource_type=data.resource_type,
        file_url=data.file_url,
        external_url=data.external_url,
        service_slug=data.service_slug,
        is_active=data.is_active,
        display_order=data.display_order,
    )
    db.add(resource)
    await db.commit()
    await db.refresh(resource)

    return _resource_to_response(resource)


@router.put("/{resource_id}", response_model=ServiceResourceResponse)
async def update_resource(
    resource_id: str,
    data: ServiceResourceUpdate,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a service resource (admin only)."""
    result = await db.execute(
        select(ServiceResource).where(ServiceResource.id == resource_id)
    )
    resource = result.scalar_one_or_none()

    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(resource, field, value)

    await db.commit()
    await db.refresh(resource)

    return _resource_to_response(resource)


@router.delete("/{resource_id}", response_model=MessageResponse)
async def delete_resource(
    resource_id: str,
    admin_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a service resource (admin only)."""
    result = await db.execute(
        select(ServiceResource).where(ServiceResource.id == resource_id)
    )
    resource = result.scalar_one_or_none()

    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )

    # If it has an uploaded file, try to clean it up
    if resource.file_url and resource.file_url.startswith("/uploads/"):
        file_path = resource.file_url.lstrip("/")
        if os.path.exists(file_path):
            os.remove(file_path)

    await db.delete(resource)
    await db.commit()

    return MessageResponse(message="Resource deleted successfully", success=True)


@router.post("/upload", response_model=dict)
async def upload_resource_file(
    file: UploadFile = File(...),
    admin_user: User = Depends(get_admin_user),
):
    """Upload a resource file (PDF, DOC, etc.) and return the URL."""
    allowed_extensions = {".pdf", ".doc", ".docx", ".txt", ".xlsx", ".pptx", ".png", ".jpg", ".jpeg"}
    ext = os.path.splitext(file.filename or "")[1].lower()

    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{ext}' not allowed. Allowed: {', '.join(allowed_extensions)}",
        )

    # Generate unique filename
    unique_name = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    file_url = f"/uploads/resources/{unique_name}"

    return {"file_url": file_url, "filename": file.filename}
