"""
Skill Development models.
"""

import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, DateTime, ForeignKey, Text, Boolean, Integer, JSON, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from database import Base

class Course(Base):
    """Course model."""
    __tablename__ = "courses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    thumbnail: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    instructor: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    modules: Mapped[List["CourseModule"]] = relationship("CourseModule", back_populates="course", cascade="all, delete-orphan", order_by="CourseModule.order_index")
    enrollments: Mapped[List["UserCourseEnrollment"]] = relationship("UserCourseEnrollment", back_populates="course", cascade="all, delete-orphan")


class CourseModule(Base):
    """Module within a course."""
    __tablename__ = "course_modules"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    course_id: Mapped[str] = mapped_column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    
    # Relationships
    course: Mapped["Course"] = relationship("Course", back_populates="modules")
    lessons: Mapped[List["Lesson"]] = relationship("Lesson", back_populates="module", cascade="all, delete-orphan", order_by="Lesson.order_index")
    quizzes: Mapped[List["Quiz"]] = relationship("Quiz", back_populates="module", cascade="all, delete-orphan")


class Lesson(Base):
    """Lesson within a module."""
    __tablename__ = "lessons"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    module_id: Mapped[str] = mapped_column(String(36), ForeignKey("course_modules.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content_type: Mapped[str] = mapped_column(String(50), default='mixed') # mixed, video, text
    video_urls: Mapped[List[str]] = mapped_column(JSON, default=[]) # List of video URLs
    images: Mapped[List[str]] = mapped_column(JSON, default=[]) # List of image URLs
    text_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True) # HTML content
    duration: Mapped[Optional[int]] = mapped_column(Integer, nullable=True) # in seconds
    order_index: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    module: Mapped["CourseModule"] = relationship("CourseModule", back_populates="lessons")
    user_progress: Mapped[List["UserLessonProgress"]] = relationship("UserLessonProgress", back_populates="lesson", cascade="all, delete-orphan")


class Quiz(Base):
    """Quiz within a module."""
    __tablename__ = "quizzes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    module_id: Mapped[str] = mapped_column(String(36), ForeignKey("course_modules.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    pass_score: Mapped[int] = mapped_column(Integer, default=70) # percentage
    
    # Relationships
    module: Mapped["CourseModule"] = relationship("CourseModule", back_populates="quizzes")
    questions: Mapped[List["QuizQuestion"]] = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")
    attempts: Mapped[List["UserQuizAttempt"]] = relationship("UserQuizAttempt", back_populates="quiz", cascade="all, delete-orphan")


class QuizQuestion(Base):
    """Question within a quiz."""
    __tablename__ = "quiz_questions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    quiz_id: Mapped[str] = mapped_column(String(36), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    options: Mapped[List[str]] = mapped_column(JSON, nullable=False) # List of option strings
    correct_option_index: Mapped[int] = mapped_column(Integer, nullable=False)

    # Relationships
    quiz: Mapped["Quiz"] = relationship("Quiz", back_populates="questions")


class UserCourseEnrollment(Base):
    """User enrollment in a course."""
    __tablename__ = "user_course_enrollments"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    course_id: Mapped[str] = mapped_column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), primary_key=True)
    enrolled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    progress_percent: Mapped[float] = mapped_column(Float, default=0.0)

    # Relationships
    course: Mapped["Course"] = relationship("Course", back_populates="enrollments")
    # user relationship is usually backref'd from User model, but we can define it here if needed or assume it exists


class UserLessonProgress(Base):
    """User progress for a lesson."""
    __tablename__ = "user_lesson_progress"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    lesson_id: Mapped[str] = mapped_column(String(36), ForeignKey("lessons.id", ondelete="CASCADE"), primary_key=True)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    lesson: Mapped["Lesson"] = relationship("Lesson", back_populates="user_progress")


class UserQuizAttempt(Base):
    """User attempt at a quiz."""
    __tablename__ = "user_quiz_attempts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    quiz_id: Mapped[str] = mapped_column(String(36), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    passed: Mapped[bool] = mapped_column(Boolean, default=False)
    attempted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    quiz: Mapped["Quiz"] = relationship("Quiz", back_populates="attempts")
