"""
Export and reporting API routes
Handles data export and report generation
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import select, and_
from datetime import datetime
from typing import Optional
from models.activity import Activity
from models.user import User
from models.department import DepartmentMember, DepartmentType
from services.export import ReportService, ExportFormat
from utils.permissions import PermissionChecker
from database import get_db
from pydantic import BaseModel
import io

router = APIRouter(prefix="/api/export", tags=["export"])

# Models
class DateRangeFilter(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


# Helper
async def get_current_user(db: Session = Depends(get_db), token: str = Query(None)):
    """Get current user from token"""
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return None


@router.post("/department/{department}/report")
async def export_department_report(
    department: str,
    format: ExportFormat = Query(ExportFormat.JSON),
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export comprehensive department report
    Only coordinators and admins can export
    """
    # Verify permission
    dept_member = db.execute(
        select(DepartmentMember).where(
            and_(
                DepartmentMember.user_id == current_user.id,
                DepartmentMember.department == department,
                DepartmentMember.is_coordinator == True,
            )
        )
    ).scalar_one_or_none()

    if not dept_member:
        raise HTTPException(status_code=403, detail="Only coordinators can export reports")

    # Generate report
    end_date = datetime.utcnow()
    start_date = datetime.utcnow().replace(day=1)  # First day of month

    report = ReportService.generate_department_report(
        department=department,
        start_date=start_date,
        end_date=end_date,
        db=db,
    )

    # Format response
    if format == ExportFormat.CSV:
        # For CSV, export activities
        activities = db.execute(
            select(Activity).where(
                and_(
                    Activity.department == department,
                    Activity.date >= start_date,
                    Activity.date <= end_date,
                )
            )
        ).scalars().all()

        csv_content = ReportService.export_activities_csv(activities)

        return StreamingResponse(
            iter([csv_content]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=activity_report_{department}_{datetime.now().strftime('%Y%m%d')}.csv"
            },
        )

    else:  # JSON
        return {
            "data": report,
            "generated_at": datetime.utcnow().isoformat(),
            "format": "json",
        }


@router.post("/activities/download")
async def download_activities(
    format: ExportFormat = Query(ExportFormat.CSV),
    department: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Download activities export
    """
    # Build query
    query = select(Activity)

    if department:
        query = query.where(Activity.department == department)

    if user_id:
        # Users can only download their own activities
        if user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Can only download own activities")
        query = query.where(Activity.user_id == user_id)

    # Date filter
    end_date = datetime.utcnow()
    start_date = end_date.replace(day=1)
    query = query.where(Activity.date >= start_date, Activity.date <= end_date)

    activities = db.execute(query).scalars().all()

    if format == ExportFormat.CSV:
        csv_content = ReportService.export_activities_csv(activities)
        return StreamingResponse(
            iter([csv_content]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=activities_{datetime.now().strftime('%Y%m%d')}.csv"
            },
        )

    else:  # JSON
        json_content = ReportService.export_activities_json(activities)
        return StreamingResponse(
            iter([json_content]),
            media_type="application/json",
            headers={
                "Content-Disposition": f"attachment; filename=activities_{datetime.now().strftime('%Y%m%d')}.json"
            },
        )


@router.get("/audit/{department}/full-export")
async def full_audit_export(
    department: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate full audit export for department
    Restricted to coordinators
    """
    # Verify permission
    dept_member = db.execute(
        select(DepartmentMember).where(
            and_(
                DepartmentMember.user_id == current_user.id,
                DepartmentMember.department == department,
                DepartmentMember.is_coordinator == True,
            )
        )
    ).scalar_one_or_none()

    if not dept_member:
        raise HTTPException(status_code=403, detail="Only coordinators can export audits")

    # Generate audit export
    audit_data = ReportService.generate_full_audit_export(
        department=department,
        db=db,
    )

    return {
        "data": audit_data,
        "format": "audit_export",
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/analytics/{department}/summary")
async def get_department_analytics(
    department: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get department analytics summary
    """
    # Verify user is part of department
    dept_member = db.execute(
        select(DepartmentMember).where(
            and_(
                DepartmentMember.user_id == current_user.id,
                DepartmentMember.department == department,
            )
        )
    ).scalar_one_or_none()

    if not dept_member:
        raise HTTPException(status_code=403, detail="Not a member of this department")

    # Generate report
    end_date = datetime.utcnow()
    start_date = end_date.replace(day=1)

    report = ReportService.generate_department_report(
        department=department,
        start_date=start_date,
        end_date=end_date,
        db=db,
    )

    return report
