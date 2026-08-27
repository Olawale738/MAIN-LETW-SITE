"""
Theology School — programmes, applications, admissions and student records.

Flow: apply → pay the exact tuition → admission letter auto-issued → applicant
accepts the offer via a signed link → student account + dashboard created →
enrolment pushed to live.letw.org (LMS) → record pushed to sharepoints.letw.org
for student-ID processing → issued ID flows back here.
"""

import uuid
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import String, Text, DateTime, Boolean, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from sqlalchemy.dialects.postgresql import JSONB
from database import Base


class TheologyProgram(Base):
    """A programme an applicant can enrol into (Certificate, Diploma, Degree…)."""
    __tablename__ = "theology_programs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    level: Mapped[str] = mapped_column(String(40), nullable=False, default="certificate")
    duration_months: Mapped[int] = mapped_column(Integer, nullable=False, default=12)
    # Exact amount an applicant must pay for the application to progress.
    tuition_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="NGN")
    # Course identifier on live.letw.org (LMS) that accepted students are enrolled into.
    lms_course_code: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    # Matches TheologySchoolProgram.code on sharepoints (the system of record).
    program_code: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    is_open: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    capacity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class TheologyApplication(Base):
    """One application, carried all the way through to an enrolled student."""
    __tablename__ = "theology_applications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    program_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)

    # ── Applicant details ─────────────────────────────────────────────────────
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    date_of_birth: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(400), nullable=True)
    education_level: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    statement: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    photo_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # pending → paid → admitted → accepted → enrolled  (or declined/withdrawn)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending", index=True)

    # ── Payment (must match the programme tuition exactly) ────────────────────
    payment_reference: Mapped[Optional[str]] = mapped_column(String(120), nullable=True, index=True)
    amount_paid: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    currency: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # ── Admission ─────────────────────────────────────────────────────────────
    admission_number: Mapped[Optional[str]] = mapped_column(String(40), nullable=True, index=True)
    admission_issued_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    # Unguessable token in the "accept your offer" link emailed to the applicant.
    acceptance_token: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    accepted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    declined_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # ── Downstream provisioning ───────────────────────────────────────────────
    student_user_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True, index=True)
    # Credentials issued for live.letw.org (the letw.org email is the username).
    lms_username: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    lms_enrolled_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    lms_status: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)   # pending|enrolled|failed
    lms_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # sharepoints student-ID processing
    sharepoints_pushed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    student_id_number: Mapped[Optional[str]] = mapped_column(String(60), nullable=True, index=True)
    student_id_issued_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    student_id_card_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Anything sharepoints issues for this student — ID card, certificates,
    # transcripts. A list of {kind, title, number, url, issued_at, source} so a
    # new document type never needs a migration.
    documents: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True, default=list)
    # Whether the candidate was actually told. Emails fail quietly otherwise.
    # A separate, short-lived credential for choosing a first password.
    # Deliberately NOT the acceptance token: that one appears in the admission
    # letter URL, which a candidate may reasonably share, and sharing a letter
    # must never hand over the account.
    setup_token: Mapped[Optional[str]] = mapped_column(String(80), nullable=True, index=True)
    setup_token_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    admission_email_sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    student_id_email_sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # ── sharepoints enrollment bridge (system of record) ──────────────────────
    offer_number: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    offer_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    admission_letter_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    bridge_enrollment_id: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    bridge_status: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    bridge_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    admin_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
