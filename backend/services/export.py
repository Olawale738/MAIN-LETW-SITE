"""
Export and reporting service
Generates reports and exports data in various formats
"""

from typing import List, Optional
from io import StringIO, BytesIO
from datetime import datetime, timedelta
from enum import Enum
import csv
import json
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, func, desc
from models.activity import Activity, ActivityMetric
from models.user import User
from models.department import DepartmentMember
from models.message import Message, Conversation


class ExportFormat(str, Enum):
    """Supported export formats"""
    CSV = "csv"
    JSON = "json"
    PDF = "pdf"


class ReportService:
    """Handle report generation and data export"""

    @staticmethod
    def generate_activity_report(
        user_id: Optional[str] = None,
        department: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        db: Session = None,
    ) -> dict:
        """
        Generate activity report
        """
        if not db:
            return {}

        # Build query
        query = select(Activity)

        if user_id:
            query = query.where(Activity.user_id == user_id)

        if department:
            query = query.where(Activity.department == department)

        if start_date:
            query = query.where(Activity.date >= start_date)

        if end_date:
            query = query.where(Activity.date <= end_date)

        activities = db.execute(
            query.order_by(desc(Activity.date))
        ).scalars().all()

        # Aggregate metrics
        total_activities = len(activities)
        total_hours = sum(a.duration_minutes for a in activities) / 60
        avg_impact = (
            sum(a.impact_score for a in activities) / len(activities)
            if activities
            else 0
        )

        # Activity type breakdown
        activity_breakdown = {}
        for activity in activities:
            activity_type = activity.activity_type
            if activity_type not in activity_breakdown:
                activity_breakdown[activity_type] = 0
            activity_breakdown[activity_type] += 1

        return {
            "period": {
                "start": start_date.isoformat() if start_date else None,
                "end": end_date.isoformat() if end_date else None,
            },
            "summary": {
                "total_activities": total_activities,
                "total_hours": round(total_hours, 2),
                "avg_impact_score": round(avg_impact, 2),
            },
            "breakdown": activity_breakdown,
            "activities": [
                {
                    "id": a.id,
                    "type": a.activity_type,
                    "title": a.title,
                    "date": a.date.isoformat(),
                    "duration": a.duration_minutes,
                    "impact": a.impact_score,
                    "status": a.status,
                }
                for a in activities
            ],
        }

    @staticmethod
    def export_activities_csv(
        activities: List[Activity],
    ) -> str:
        """
        Export activities to CSV format
        """
        output = StringIO()
        writer = csv.DictWriter(
            output,
            fieldnames=[
                "Date",
                "Type",
                "Title",
                "Description",
                "Duration (minutes)",
                "Impact Score",
                "Status",
                "User ID",
            ],
        )

        writer.writeheader()

        for activity in activities:
            writer.writerow(
                {
                    "Date": activity.date.strftime("%Y-%m-%d"),
                    "Type": activity.activity_type,
                    "Title": activity.title,
                    "Description": activity.description or "",
                    "Duration (minutes)": activity.duration_minutes,
                    "Impact Score": activity.impact_score,
                    "Status": activity.status,
                    "User ID": activity.user_id,
                }
            )

        return output.getvalue()

    @staticmethod
    def export_activities_json(
        activities: List[Activity],
    ) -> str:
        """
        Export activities to JSON format
        """
        data = [
            {
                "id": a.id,
                "user_id": a.user_id,
                "type": a.activity_type,
                "title": a.title,
                "description": a.description,
                "date": a.date.isoformat(),
                "duration_minutes": a.duration_minutes,
                "impact_score": a.impact_score,
                "status": a.status,
                "created_at": a.created_at.isoformat(),
            }
            for a in activities
        ]

        return json.dumps(data, indent=2)

    @staticmethod
    def generate_department_report(
        department: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        db: Session = None,
    ) -> dict:
        """
        Generate comprehensive department report
        """
        if not db:
            return {}

        # Get all members
        members = db.execute(
            select(DepartmentMember).where(
                DepartmentMember.department == department
            )
        ).scalars().all()

        if not start_date:
            start_date = datetime.utcnow() - timedelta(days=30)
        if not end_date:
            end_date = datetime.utcnow()

        # Get activities for period
        activities = db.execute(
            select(Activity).where(
                and_(
                    Activity.department == department,
                    Activity.date >= start_date,
                    Activity.date <= end_date,
                )
            )
        ).scalars().all()

        # Per-member metrics
        member_metrics = {}
        for member in members:
            member_activities = [
                a for a in activities if a.user_id == member.user_id
            ]
            member_metrics[member.user_id] = {
                "activity_count": len(member_activities),
                "total_hours": sum(a.duration_minutes for a in member_activities) / 60,
                "avg_impact": (
                    sum(a.impact_score for a in member_activities) / len(member_activities)
                    if member_activities
                    else 0
                ),
                "is_coordinator": member.is_coordinator,
            }

        # Overall metrics
        total_activities = len(activities)
        total_hours = sum(a.duration_minutes for a in activities) / 60
        avg_impact = (
            sum(a.impact_score for a in activities) / len(activities)
            if activities
            else 0
        )

        return {
            "department": department,
            "period": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat(),
            },
            "summary": {
                "total_members": len(members),
                "active_members": len([m for m in member_metrics.values() if m["activity_count"] > 0]),
                "total_activities": total_activities,
                "total_hours": round(total_hours, 2),
                "avg_impact_score": round(avg_impact, 2),
            },
            "member_metrics": {
                user_id: {
                    "activities": metrics["activity_count"],
                    "hours": round(metrics["total_hours"], 2),
                    "impact": round(metrics["avg_impact"], 2),
                    "is_coordinator": metrics["is_coordinator"],
                }
                for user_id, metrics in member_metrics.items()
            },
        }

    @staticmethod
    def generate_message_report(
        conversation_id: Optional[str] = None,
        user_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        db: Session = None,
    ) -> dict:
        """
        Generate messaging report
        """
        if not db:
            return {}

        query = select(Message)

        if conversation_id:
            query = query.where(Message.conversation_id == conversation_id)

        if user_id:
            query = query.where(Message.sender_id == user_id)

        if start_date:
            query = query.where(Message.created_at >= start_date)

        if end_date:
            query = query.where(Message.created_at <= end_date)

        messages = db.execute(query).scalars().all()

        return {
            "period": {
                "start": start_date.isoformat() if start_date else None,
                "end": end_date.isoformat() if end_date else None,
            },
            "summary": {
                "total_messages": len(messages),
                "avg_message_length": (
                    sum(len(m.body) for m in messages) / len(messages)
                    if messages
                    else 0
                ),
            },
            "messages_by_date": ReportService._group_by_date(messages),
        }

    @staticmethod
    def _group_by_date(messages: List[Message]) -> dict:
        """Group messages by date"""
        grouped = {}
        for message in messages:
            date_key = message.created_at.strftime("%Y-%m-%d")
            if date_key not in grouped:
                grouped[date_key] = 0
            grouped[date_key] += 1
        return grouped

    @staticmethod
    def generate_full_audit_export(
        department: str,
        db: Session = None,
    ) -> dict:
        """
        Generate complete audit export for a department
        """
        if not db:
            return {}

        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=90)  # 3 months

        return {
            "export_date": datetime.utcnow().isoformat(),
            "department": department,
            "period": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat(),
            },
            "activities": ReportService.generate_department_report(
                department, start_date, end_date, db
            ),
            "messages": ReportService.generate_message_report(
                start_date=start_date, end_date=end_date, db=db
            ),
        }
