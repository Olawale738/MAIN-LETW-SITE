"""
Activity tracking API routes
Handles activity logging, metrics, and engagement reports
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, func, desc
from datetime import datetime, timedelta
from typing import List, Optional
from models.activity import Activity, ActivityMetric, EngagementReport, ActivityType, ActivityStatus
from models.user import User
from models.department import DepartmentMember
from utils.permissions import PermissionChecker
from database import get_db
from pydantic import BaseModel

router = APIRouter(prefix="/api/activities", tags=["activities"])

# Request/Response models
class ActivityCreate(BaseModel):
    activity_type: ActivityType
    title: str
    description: Optional[str] = None
    duration_minutes: int = 0
    date: datetime
    department: str
    status: ActivityStatus = ActivityStatus.COMPLETED
    impact_score: Optional[int] = None
    notes: Optional[str] = None
    target_user_id: Optional[str] = None


class ActivityUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    status: Optional[ActivityStatus] = None
    impact_score: Optional[int] = None
    notes: Optional[str] = None


class ActivityResponse(BaseModel):
    id: str
    user_id: str
    activity_type: str
    title: str
    description: Optional[str]
    duration_minutes: int
    date: str
    status: str
    impact_score: int
    created_at: str

    class Config:
        from_attributes = True


class MetricResponse(BaseModel):
    user_id: str
    department: str
    total_activities: int
    total_hours: float
    gospel_shares: int
    conversions: int
    avg_impact_score: float
    engagement_level: str
    period: str

    class Config:
        from_attributes = True


class EngagementReportResponse(BaseModel):
    id: str
    member_id: str
    coordinator_id: str
    department: str
    activity_count: int
    total_hours: float
    engagement_score: int
    attendance_rate: float
    strengths: Optional[str]
    areas_for_growth: Optional[str]
    recommendations: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


# Helper function
async def get_current_user(db: Session = Depends(get_db), token: str = Query(None)):
    """Get current user from token"""
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return None


@router.post("/", response_model=ActivityResponse)
async def log_activity(
    activity: ActivityCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Log a new activity"""
    # Verify user is member of department
    dept_member = db.execute(
        select(DepartmentMember).where(
            and_(
                DepartmentMember.user_id == current_user.id,
                DepartmentMember.department == activity.department,
            )
        )
    ).scalar_one_or_none()

    if not dept_member:
        raise HTTPException(status_code=403, detail="Not a member of this department")

    # Create activity
    new_activity = Activity(
        user_id=current_user.id,
        activity_type=activity.activity_type.value if isinstance(activity.activity_type, ActivityType) else activity.activity_type,
        title=activity.title,
        description=activity.description,
        duration_minutes=activity.duration_minutes,
        date=activity.date,
        department=activity.department,
        status=activity.status.value if isinstance(activity.status, ActivityStatus) else activity.status,
        impact_score=activity.impact_score or 0,
        notes=activity.notes,
        target_user_id=activity.target_user_id,
    )

    db.add(new_activity)
    db.commit()
    db.refresh(new_activity)

    return ActivityResponse(
        **{k: v for k, v in new_activity.__dict__.items() if k != '_sa_instance_state'},
        created_at=new_activity.created_at.isoformat()
    )


@router.get("/user/{user_id}", response_model=List[ActivityResponse])
async def get_user_activities(
    user_id: str,
    department: Optional[str] = Query(None),
    activity_type: Optional[str] = Query(None),
    days: int = Query(30, ge=1, le=365),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Get activities for a specific user"""
    # Build query
    start_date = datetime.utcnow() - timedelta(days=days)
    query = select(Activity).where(
        and_(
            Activity.user_id == user_id,
            Activity.date >= start_date,
        )
    )

    if department:
        query = query.where(Activity.department == department)

    if activity_type:
        query = query.where(Activity.activity_type == activity_type)

    # Execute
    activities = db.execute(
        query.order_by(desc(Activity.date))
        .limit(limit)
        .offset(offset)
    ).scalars().all()

    return [
        ActivityResponse(
            **{k: v for k, v in a.__dict__.items() if k != '_sa_instance_state'},
            created_at=a.created_at.isoformat()
        )
        for a in activities
    ]


@router.get("/{activity_id}", response_model=ActivityResponse)
async def get_activity(
    activity_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific activity"""
    activity = db.execute(
        select(Activity).where(Activity.id == activity_id)
    ).scalar_one_or_none()

    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    return ActivityResponse(
        **{k: v for k, v in activity.__dict__.items() if k != '_sa_instance_state'},
        created_at=activity.created_at.isoformat()
    )


@router.put("/{activity_id}", response_model=ActivityResponse)
async def update_activity(
    activity_id: str,
    update: ActivityUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an activity"""
    activity = db.execute(
        select(Activity).where(Activity.id == activity_id)
    ).scalar_one_or_none()

    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Only owner or admin can update
    if activity.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Update fields
    if update.title:
        activity.title = update.title
    if update.description:
        activity.description = update.description
    if update.duration_minutes:
        activity.duration_minutes = update.duration_minutes
    if update.status:
        activity.status = update.status.value if isinstance(update.status, ActivityStatus) else update.status
    if update.impact_score:
        activity.impact_score = update.impact_score
    if update.notes:
        activity.notes = update.notes

    db.commit()
    db.refresh(activity)

    return ActivityResponse(
        **{k: v for k, v in activity.__dict__.items() if k != '_sa_instance_state'},
        created_at=activity.created_at.isoformat()
    )


@router.delete("/{activity_id}")
async def delete_activity(
    activity_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an activity"""
    activity = db.execute(
        select(Activity).where(Activity.id == activity_id)
    ).scalar_one_or_none()

    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    if activity.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(activity)
    db.commit()

    return {"status": "deleted"}


@router.get("/metrics/{user_id}", response_model=List[MetricResponse])
async def get_user_metrics(
    user_id: str,
    department: Optional[str] = Query(None),
    period: str = Query("month", regex="^(week|month|year)$"),
    db: Session = Depends(get_db)
):
    """Get activity metrics for a user"""
    query = select(ActivityMetric).where(
        and_(
            ActivityMetric.user_id == user_id,
            ActivityMetric.period == period,
        )
    )

    if department:
        query = query.where(ActivityMetric.department == department)

    metrics = db.execute(
        query.order_by(desc(ActivityMetric.period_start))
    ).scalars().all()

    return [
        MetricResponse(
            **{k: v for k, v in m.__dict__.items() if k != '_sa_instance_state'}
        )
        for m in metrics
    ]


@router.get("/department/{department}/top-performers")
async def get_top_performers(
    department: str,
    limit: int = Query(10, ge=1, le=50),
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Get top performers in a department"""
    start_date = datetime.utcnow() - timedelta(days=days)

    # Get metrics grouped by user
    results = db.execute(
        select(
            Activity.user_id,
            func.count(Activity.id).label('activity_count'),
            func.sum(Activity.duration_minutes).label('total_minutes'),
            func.avg(Activity.impact_score).label('avg_score'),
        )
        .where(
            and_(
                Activity.department == department,
                Activity.date >= start_date,
                Activity.status == ActivityStatus.COMPLETED.value,
            )
        )
        .group_by(Activity.user_id)
        .order_by(desc(func.avg(Activity.impact_score)))
        .limit(limit)
    ).all()

    return [
        {
            "user_id": r[0],
            "activity_count": r[1],
            "total_hours": (r[2] or 0) / 60,
            "avg_impact_score": float(r[3] or 0),
        }
        for r in results
    ]


@router.post("/reports/{member_id}", response_model=EngagementReportResponse)
async def create_engagement_report(
    member_id: str,
    period_days: int = Query(30, ge=7, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create an engagement report for a member"""
    # Verify current user is coordinator
    coord = db.execute(
        select(DepartmentMember).where(
            and_(
                DepartmentMember.user_id == current_user.id,
                DepartmentMember.is_coordinator == True,
            )
        )
    ).scalar_one_or_none()

    if not coord:
        raise HTTPException(status_code=403, detail="Only coordinators can create reports")

    # Get member activities
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=period_days)

    activities = db.execute(
        select(Activity).where(
            and_(
                Activity.user_id == member_id,
                Activity.date >= start_date,
                Activity.date <= end_date,
            )
        )
    ).scalars().all()

    # Calculate metrics
    total_hours = sum(a.duration_minutes for a in activities) / 60
    avg_score = sum(a.impact_score for a in activities) / len(activities) if activities else 0
    engagement_score = min(int(avg_score * 20), 100)  # Convert 0-5 scale to 0-100

    # Create report
    report = EngagementReport(
        member_id=member_id,
        coordinator_id=current_user.id,
        department=coord.department,
        period_start=start_date,
        period_end=end_date,
        activity_count=len(activities),
        total_hours=total_hours,
        engagement_score=engagement_score,
        created_by=current_user.id,
    )

    db.add(report)
    db.commit()
    db.refresh(report)

    return EngagementReportResponse(
        **{k: v for k, v in report.__dict__.items() if k != '_sa_instance_state'},
        created_at=report.created_at.isoformat()
    )


@router.get("/reports/{member_id}", response_model=List[EngagementReportResponse])
async def get_engagement_reports(
    member_id: str,
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Get engagement reports for a member"""
    reports = db.execute(
        select(EngagementReport)
        .where(EngagementReport.member_id == member_id)
        .order_by(desc(EngagementReport.created_at))
        .limit(limit)
    ).scalars().all()

    return [
        EngagementReportResponse(
            **{k: v for k, v in r.__dict__.items() if k != '_sa_instance_state'},
            created_at=r.created_at.isoformat()
        )
        for r in reports
    ]
