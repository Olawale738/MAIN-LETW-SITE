"""
Career Guidance API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import desc, and_, or_
from typing import List, Optional
from datetime import datetime

from database import get_db
from models.user import User
from models.career import (
    CareerModule, CareerResource, CareerSession, CareerTask,
    UserCareerProgress, UserCareerTask
)
from schemas.career import (
    CareerModuleCreate, CareerModuleUpdate, CareerModuleResponse, CareerModuleListResponse,
    CareerResourceCreate, CareerResourceResponse,
    CareerSessionCreate, CareerSessionUpdate, CareerSessionResponse,
    CareerTaskCreate, CareerTaskResponse,
    UserCareerDashboard
)
from utils.dependencies import get_current_active_user, get_admin_user

router = APIRouter(prefix="/api/career", tags=["Career Guidance"])


# ============= User Endpoints =============

@router.get("/dashboard", response_model=UserCareerDashboard)
async def get_user_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get user's career guidance dashboard."""
    
    # Get user's current progress
    progress_query = select(UserCareerProgress).where(
        UserCareerProgress.user_id == current_user.id
    ).options(selectinload(UserCareerProgress.module))
    progress_result = await db.execute(progress_query)
    user_progress = progress_result.scalars().all()
    
    # Get current focus (most recent incomplete module)
    current_focus = None
    for prog in user_progress:
        if not prog.is_completed and prog.current_focus:
            current_focus = prog.current_focus
            break
    
    # Get next scheduled session
    next_session = None
    session_query = select(CareerSession).where(
        and_(
            CareerSession.user_id == current_user.id,
            CareerSession.status == "scheduled",
            CareerSession.session_date > datetime.now()
        )
    ).order_by(CareerSession.session_date).limit(1)
    session_result = await db.execute(session_query)
    next_session_obj = session_result.scalar_one_or_none()
    
    if next_session_obj:
        next_session = CareerSessionResponse(
            id=next_session_obj.id,
            user_id=next_session_obj.user_id,
            title=next_session_obj.title,
            description=next_session_obj.description,
            session_date=next_session_obj.session_date,
            duration_minutes=next_session_obj.duration_minutes,
            meeting_link=next_session_obj.meeting_link,
            status=next_session_obj.status,
            notes=next_session_obj.notes,
            created_at=next_session_obj.created_at,
            user_name=current_user.name
        )
    
    # Get all published modules
    modules_query = select(CareerModule).where(
        CareerModule.is_published == True
    ).order_by(CareerModule.order_index)
    modules_result = await db.execute(modules_query)
    modules = modules_result.scalars().all()
    
    # Build module list with progress
    module_list = []
    for module in modules:
        prog = next((p for p in user_progress if p.module_id == module.id), None)
        module_list.append(CareerModuleListResponse(
            id=module.id,
            title=module.title,
            description=module.description,
            icon=module.icon,
            order_index=module.order_index,
            is_published=module.is_published,
            created_at=module.created_at,
            progress_percent=prog.progress_percent if prog else 0
        ))
    
    # Calculate overall progress
    overall_progress = 0
    if user_progress:
        overall_progress = sum(p.progress_percent for p in user_progress) // len(user_progress)
    
    # Get pending tasks
    pending_tasks = []
    task_query = select(CareerTask).join(
        CareerModule
    ).where(
        CareerModule.is_published == True
    ).order_by(CareerTask.order_index)
    task_result = await db.execute(task_query)
    all_tasks = task_result.scalars().all()
    
    # Get user task completions
    user_task_query = select(UserCareerTask).where(
        UserCareerTask.user_id == current_user.id
    )
    user_task_result = await db.execute(user_task_query)
    user_tasks = {ut.task_id: ut for ut in user_task_result.scalars().all()}
    
    for task in all_tasks[:10]:  # Limit to 10 pending tasks
        user_task = user_tasks.get(task.id)
        if not user_task or user_task.status != "completed":
            pending_tasks.append(CareerTaskResponse(
                id=task.id,
                module_id=task.module_id,
                title=task.title,
                description=task.description,
                order_index=task.order_index,
                created_at=task.created_at,
                is_completed=False
            ))
    
    return UserCareerDashboard(
        current_focus=current_focus,
        next_session=next_session,
        overall_progress=overall_progress,
        modules=module_list,
        pending_tasks=pending_tasks
    )


@router.get("/modules", response_model=List[CareerModuleListResponse])
async def get_modules(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all published career modules."""
    query = select(CareerModule).where(
        CareerModule.is_published == True
    ).order_by(CareerModule.order_index)
    result = await db.execute(query)
    modules = result.scalars().all()
    
    # Get user progress
    progress_query = select(UserCareerProgress).where(
        UserCareerProgress.user_id == current_user.id
    )
    progress_result = await db.execute(progress_query)
    user_progress = {p.module_id: p for p in progress_result.scalars().all()}
    
    return [
        CareerModuleListResponse(
            id=m.id,
            title=m.title,
            description=m.description,
            icon=m.icon,
            order_index=m.order_index,
            is_published=m.is_published,
            created_at=m.created_at,
            progress_percent=user_progress[m.id].progress_percent if m.id in user_progress else 0
        )
        for m in modules
    ]


@router.get("/modules/{module_id}", response_model=CareerModuleResponse)
async def get_module(
    module_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific career module with resources and tasks."""
    query = select(CareerModule).where(
        CareerModule.id == module_id
    ).options(
        selectinload(CareerModule.resources),
        selectinload(CareerModule.tasks)
    )
    result = await db.execute(query)
    module = result.scalar_one_or_none()

    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    # Get user progress
    progress_query = select(UserCareerProgress).where(
        and_(
            UserCareerProgress.user_id == current_user.id,
            UserCareerProgress.module_id == module_id
        )
    )
    progress_result = await db.execute(progress_query)
    user_progress = progress_result.scalar_one_or_none()

    # Get user task completions
    user_task_query = select(UserCareerTask).where(
        UserCareerTask.user_id == current_user.id
    )
    user_task_result = await db.execute(user_task_query)
    user_tasks = {ut.task_id: ut for ut in user_task_result.scalars().all()}

    # Build response
    resources = [
        CareerResourceResponse(
            id=r.id,
            module_id=r.module_id,
            title=r.title,
            description=r.description,
            resource_type=r.resource_type,
            file_url=r.file_url,
            video_url=r.video_url,
            article_content=r.article_content,
            external_link=r.external_link,
            order_index=r.order_index,
            created_at=r.created_at
        )
        for r in sorted(module.resources, key=lambda x: x.order_index)
    ]

    tasks = [
        CareerTaskResponse(
            id=t.id,
            module_id=t.module_id,
            title=t.title,
            description=t.description,
            order_index=t.order_index,
            created_at=t.created_at,
            is_completed=user_tasks.get(t.id) and user_tasks[t.id].status == "completed"
        )
        for t in sorted(module.tasks, key=lambda x: x.order_index)
    ]

    return CareerModuleResponse(
        id=module.id,
        title=module.title,
        description=module.description,
        icon=module.icon,
        order_index=module.order_index,
        is_published=module.is_published,
        created_at=module.created_at,
        updated_at=module.updated_at,
        resources=resources,
        tasks=tasks,
        progress_percent=user_progress.progress_percent if user_progress else 0
    )


@router.post("/tasks/{task_id}/complete")
async def complete_task(
    task_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Mark a task as completed."""
    # Check if task exists
    task_query = select(CareerTask).where(CareerTask.id == task_id)
    task_result = await db.execute(task_query)
    task = task_result.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Check if user task already exists
    user_task_query = select(UserCareerTask).where(
        and_(
            UserCareerTask.user_id == current_user.id,
            UserCareerTask.task_id == task_id
        )
    )
    user_task_result = await db.execute(user_task_query)
    user_task = user_task_result.scalar_one_or_none()

    if user_task:
        user_task.status = "completed"
        user_task.completed_at = datetime.now()
    else:
        user_task = UserCareerTask(
            user_id=current_user.id,
            task_id=task_id,
            status="completed",
            completed_at=datetime.now()
        )
        db.add(user_task)

    await db.commit()

    return {"message": "Task marked as completed"}


@router.get("/sessions", response_model=List[CareerSessionResponse])
async def get_user_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all sessions for the current user."""
    query = select(CareerSession).where(
        CareerSession.user_id == current_user.id
    ).order_by(desc(CareerSession.session_date))
    result = await db.execute(query)
    sessions = result.scalars().all()

    return [
        CareerSessionResponse(
            id=s.id,
            user_id=s.user_id,
            title=s.title,
            description=s.description,
            session_date=s.session_date,
            duration_minutes=s.duration_minutes,
            meeting_link=s.meeting_link,
            status=s.status,
            notes=s.notes,
            created_at=s.created_at,
            user_name=current_user.name
        )
        for s in sessions
    ]


# ============= Admin Endpoints =============

@router.post("/admin/modules", response_model=CareerModuleResponse, status_code=status.HTTP_201_CREATED)
async def create_module(
    data: CareerModuleCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Create a new career module (admin only)."""
    module = CareerModule(
        title=data.title,
        description=data.description,
        icon=data.icon,
        order_index=data.order_index,
        is_published=data.is_published
    )
    db.add(module)
    await db.commit()
    await db.refresh(module)

    return CareerModuleResponse(
        id=module.id,
        title=module.title,
        description=module.description,
        icon=module.icon,
        order_index=module.order_index,
        is_published=module.is_published,
        created_at=module.created_at,
        updated_at=module.updated_at,
        resources=[],
        tasks=[],
        progress_percent=0
    )


@router.get("/admin/modules", response_model=List[CareerModuleListResponse])
async def get_all_modules_admin(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Get all career modules (admin only)."""
    query = select(CareerModule).order_by(CareerModule.order_index)
    result = await db.execute(query)
    modules = result.scalars().all()

    return [
        CareerModuleListResponse(
            id=m.id,
            title=m.title,
            description=m.description,
            icon=m.icon,
            order_index=m.order_index,
            is_published=m.is_published,
            created_at=m.created_at,
            progress_percent=0
        )
        for m in modules
    ]


@router.get("/admin/modules/{module_id}", response_model=CareerModuleResponse)
async def get_module_admin(
    module_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Get a specific career module (admin only)."""
    query = select(CareerModule).where(
        CareerModule.id == module_id
    ).options(
        selectinload(CareerModule.resources),
        selectinload(CareerModule.tasks)
    )
    result = await db.execute(query)
    module = result.scalar_one_or_none()

    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    resources = [
        CareerResourceResponse(
            id=r.id,
            module_id=r.module_id,
            title=r.title,
            description=r.description,
            resource_type=r.resource_type,
            file_url=r.file_url,
            video_url=r.video_url,
            article_content=r.article_content,
            external_link=r.external_link,
            order_index=r.order_index,
            created_at=r.created_at
        )
        for r in sorted(module.resources, key=lambda x: x.order_index)
    ]

    tasks = [
        CareerTaskResponse(
            id=t.id,
            module_id=t.module_id,
            title=t.title,
            description=t.description,
            order_index=t.order_index,
            created_at=t.created_at,
            is_completed=False
        )
        for t in sorted(module.tasks, key=lambda x: x.order_index)
    ]

    return CareerModuleResponse(
        id=module.id,
        title=module.title,
        description=module.description,
        icon=module.icon,
        order_index=module.order_index,
        is_published=module.is_published,
        created_at=module.created_at,
        updated_at=module.updated_at,
        resources=resources,
        tasks=tasks,
        progress_percent=0
    )


@router.patch("/admin/modules/{module_id}", response_model=CareerModuleResponse)
async def update_module(
    module_id: str,
    data: CareerModuleUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Update a career module (admin only)."""
    query = select(CareerModule).where(CareerModule.id == module_id)
    result = await db.execute(query)
    module = result.scalar_one_or_none()

    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    # Update fields
    if data.title is not None:
        module.title = data.title
    if data.description is not None:
        module.description = data.description
    if data.icon is not None:
        module.icon = data.icon
    if data.order_index is not None:
        module.order_index = data.order_index
    if data.is_published is not None:
        module.is_published = data.is_published

    await db.commit()
    await db.refresh(module, ["resources", "tasks"])

    return CareerModuleResponse(
        id=module.id,
        title=module.title,
        description=module.description,
        icon=module.icon,
        order_index=module.order_index,
        is_published=module.is_published,
        created_at=module.created_at,
        updated_at=module.updated_at,
        resources=[],
        tasks=[],
        progress_percent=0
    )


@router.delete("/admin/modules/{module_id}")
async def delete_module(
    module_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Delete a career module (admin only)."""
    query = select(CareerModule).where(CareerModule.id == module_id)
    result = await db.execute(query)
    module = result.scalar_one_or_none()

    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    await db.delete(module)
    await db.commit()

    return {"message": "Module deleted successfully"}


@router.post("/admin/modules/{module_id}/resources", response_model=CareerResourceResponse)
async def create_resource(
    module_id: str,
    data: CareerResourceCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Add a resource to a module (admin only)."""
    # Check if module exists
    module_query = select(CareerModule).where(CareerModule.id == module_id)
    module_result = await db.execute(module_query)
    module = module_result.scalar_one_or_none()

    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    resource = CareerResource(
        module_id=module_id,
        title=data.title,
        description=data.description,
        resource_type=data.resource_type,
        file_url=data.file_url,
        video_url=data.video_url,
        article_content=data.article_content,
        external_link=data.external_link,
        order_index=data.order_index
    )
    db.add(resource)
    await db.commit()
    await db.refresh(resource)

    return CareerResourceResponse(
        id=resource.id,
        module_id=resource.module_id,
        title=resource.title,
        description=resource.description,
        resource_type=resource.resource_type,
        file_url=resource.file_url,
        video_url=resource.video_url,
        article_content=resource.article_content,
        external_link=resource.external_link,
        order_index=resource.order_index,
        created_at=resource.created_at
    )


@router.delete("/admin/resources/{resource_id}")
async def delete_resource(
    resource_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Delete a resource (admin only)."""
    query = select(CareerResource).where(CareerResource.id == resource_id)
    result = await db.execute(query)
    resource = result.scalar_one_or_none()

    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    await db.delete(resource)
    await db.commit()

    return {"message": "Resource deleted successfully"}


@router.post("/admin/modules/{module_id}/tasks", response_model=CareerTaskResponse)
async def create_task(
    module_id: str,
    data: CareerTaskCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Add a task to a module (admin only)."""
    # Check if module exists
    module_query = select(CareerModule).where(CareerModule.id == module_id)
    module_result = await db.execute(module_query)
    module = module_result.scalar_one_or_none()

    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    task = CareerTask(
        module_id=module_id,
        title=data.title,
        description=data.description,
        order_index=data.order_index
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)

    return CareerTaskResponse(
        id=task.id,
        module_id=task.module_id,
        title=task.title,
        description=task.description,
        order_index=task.order_index,
        created_at=task.created_at,
        is_completed=False
    )


@router.delete("/admin/tasks/{task_id}")
async def delete_task(
    task_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Delete a task (admin only)."""
    query = select(CareerTask).where(CareerTask.id == task_id)
    result = await db.execute(query)
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    await db.delete(task)
    await db.commit()

    return {"message": "Task deleted successfully"}


@router.post("/admin/sessions", response_model=CareerSessionResponse)
async def create_session(
    data: CareerSessionCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Create a career session (admin only)."""
    # Check if user exists
    user_query = select(User).where(User.id == data.user_id)
    user_result = await db.execute(user_query)
    user = user_result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    session = CareerSession(
        user_id=data.user_id,
        title=data.title,
        description=data.description,
        session_date=data.session_date,
        duration_minutes=data.duration_minutes,
        meeting_link=data.meeting_link,
        status=data.status,
        notes=data.notes
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    return CareerSessionResponse(
        id=session.id,
        user_id=session.user_id,
        title=session.title,
        description=session.description,
        session_date=session.session_date,
        duration_minutes=session.duration_minutes,
        meeting_link=session.meeting_link,
        status=session.status,
        notes=session.notes,
        created_at=session.created_at,
        user_name=user.name
    )


@router.get("/admin/sessions", response_model=List[CareerSessionResponse])
async def get_all_sessions(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Get all career sessions (admin only)."""
    query = select(CareerSession).options(
        selectinload(CareerSession.user)
    ).order_by(desc(CareerSession.session_date))
    result = await db.execute(query)
    sessions = result.scalars().all()

    return [
        CareerSessionResponse(
            id=s.id,
            user_id=s.user_id,
            title=s.title,
            description=s.description,
            session_date=s.session_date,
            duration_minutes=s.duration_minutes,
            meeting_link=s.meeting_link,
            status=s.status,
            notes=s.notes,
            created_at=s.created_at,
            user_name=s.user.name if s.user else None
        )
        for s in sessions
    ]


@router.patch("/admin/sessions/{session_id}", response_model=CareerSessionResponse)
async def update_session(
    session_id: str,
    data: CareerSessionUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Update a career session (admin only)."""
    query = select(CareerSession).where(CareerSession.id == session_id).options(
        selectinload(CareerSession.user)
    )
    result = await db.execute(query)
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Update fields
    if data.title is not None:
        session.title = data.title
    if data.description is not None:
        session.description = data.description
    if data.session_date is not None:
        session.session_date = data.session_date
    if data.duration_minutes is not None:
        session.duration_minutes = data.duration_minutes
    if data.meeting_link is not None:
        session.meeting_link = data.meeting_link
    if data.status is not None:
        session.status = data.status
    if data.notes is not None:
        session.notes = data.notes

    await db.commit()
    await db.refresh(session)

    return CareerSessionResponse(
        id=session.id,
        user_id=session.user_id,
        title=session.title,
        description=session.description,
        session_date=session.session_date,
        duration_minutes=session.duration_minutes,
        meeting_link=session.meeting_link,
        status=session.status,
        notes=session.notes,
        created_at=session.created_at,
        user_name=session.user.name if session.user else None
    )


@router.delete("/admin/sessions/{session_id}")
async def delete_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Delete a career session (admin only)."""
    query = select(CareerSession).where(CareerSession.id == session_id)
    result = await db.execute(query)
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    await db.delete(session)
    await db.commit()

    return {"message": "Session deleted successfully"}


