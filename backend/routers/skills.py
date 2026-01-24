from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from typing import List, Optional
import json

from database import get_db
from models.user import User
from models.skill import (
    Course, CourseModule, Lesson, Quiz, QuizQuestion, 
    UserCourseEnrollment, UserLessonProgress, UserQuizAttempt
)
from schemas.skill import (
    CourseCreate, CourseRead, CourseListRead, CourseUpdate,
    CourseModuleCreate, CourseModuleRead,
    LessonCreate, LessonRead,
    QuizCreate, QuizRead, QuizSubmission, QuizResult
)
from utils.dependencies import get_current_active_user, get_admin_user as get_current_admin_user

router = APIRouter(prefix="/api/skills", tags=["Skill Development"])

# --- Courses ---

@router.get("/courses", response_model=List[CourseListRead])
async def get_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all published courses."""
    query = select(Course).where(Course.is_published == True).order_by(desc(Course.created_at))
    result = await db.execute(query)
    courses = result.scalars().all()
    
    # Calculate enrollment status and progress for each course
    course_list = []
    for course in courses:
        enrollment_query = select(UserCourseEnrollment).where(
            UserCourseEnrollment.user_id == current_user.id,
            UserCourseEnrollment.course_id == course.id
        )
        enrollment_result = await db.execute(enrollment_query)
        enrollment = enrollment_result.scalar_one_or_none()
        
        course_data = CourseListRead(
            id=course.id,
            title=course.title,
            description=course.description,
            thumbnail=course.thumbnail,
            instructor=course.instructor,
            is_published=course.is_published,
            created_at=course.created_at,
            is_enrolled=enrollment is not None,
            progress_percent=enrollment.progress_percent if enrollment else 0.0
        )
        course_list.append(course_data)
        
    return course_list

@router.post("/courses")
async def create_course(
    course: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Create a new course (Admin only)."""
    db_course = Course(**course.model_dump())
    db.add(db_course)
    await db.commit()
    await db.refresh(db_course)
    # Return dict to avoid lazy loading issues with relationships
    return {
        "id": db_course.id,
        "title": db_course.title,
        "description": db_course.description,
        "thumbnail": db_course.thumbnail,
        "instructor": db_course.instructor,
        "is_published": db_course.is_published,
        "created_at": db_course.created_at,
        "updated_at": db_course.updated_at,
        "modules": []
    }

@router.put("/courses/{id}")
async def update_course(
    id: str,
    course_update: CourseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Update a course (Admin only)."""
    result = await db.execute(select(Course).where(Course.id == id))
    db_course = result.scalar_one_or_none()
    if not db_course:
        raise HTTPException(status_code=404, detail="Course not found")

    update_data = course_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_course, key, value)

    await db.commit()
    await db.refresh(db_course)
    
    return {
        "id": db_course.id,
        "title": db_course.title,
        "description": db_course.description,
        "thumbnail": db_course.thumbnail,
        "instructor": db_course.instructor,
        "is_published": db_course.is_published,
        "created_at": db_course.created_at,
        "updated_at": db_course.updated_at,
        "modules": [] # Not returning full modules structure on simple update
    }

@router.get("/courses/{id}")
async def get_course(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get course details with modules and lessons."""
    from sqlalchemy.orm import selectinload
    
    # Eager load modules and their lessons/quizzes with questions
    result = await db.execute(
        select(Course)
        .options(
            selectinload(Course.modules).selectinload(CourseModule.lessons),
            selectinload(Course.modules).selectinload(CourseModule.quizzes).selectinload(Quiz.questions)
        )
        .where(Course.id == id)
    )
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check enrollment
    enrollment_result = await db.execute(select(UserCourseEnrollment).where(
        UserCourseEnrollment.user_id == current_user.id,
        UserCourseEnrollment.course_id == id
    ))
    enrollment = enrollment_result.scalar_one_or_none()

    # Build response dict to avoid lazy loading issues
    modules_data = []
    for module in course.modules:
        lessons_data = [
            {
                "id": lesson.id,
                "title": lesson.title,
                "content_type": lesson.content_type,
                "video_urls": lesson.video_urls,
                "images": lesson.images,
                "text_content": lesson.text_content,
                "duration": lesson.duration,
                "order_index": lesson.order_index,
                "is_completed": False  # TODO: Check user progress
            }
            for lesson in module.lessons
        ]
        quizzes_data = [
            {
                "id": quiz.id,
                "title": quiz.title,
                "pass_score": quiz.pass_score,
                "questions": [
                    {
                        "id": q.id,
                        "question_text": q.question_text,
                        "options": q.options,
                        "correct_option_index": q.correct_option_index
                    }
                    for q in quiz.questions
                ]
            }
            for quiz in module.quizzes
        ]
        modules_data.append({
            "id": module.id,
            "title": module.title,
            "order_index": module.order_index,
            "lessons": lessons_data,
            "quizzes": quizzes_data
        })
    
    return {
        "id": course.id,
        "title": course.title,
        "description": course.description,
        "thumbnail": course.thumbnail,
        "instructor": course.instructor,
        "is_published": course.is_published,
        "created_at": course.created_at,
        "updated_at": course.updated_at,
        "modules": modules_data,
        "is_enrolled": enrollment is not None,
        "progress_percent": enrollment.progress_percent if enrollment else 0.0
    }

@router.post("/courses/{id}/enroll")
async def enroll_course(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Enroll in a course."""
    # Check existing enrollment
    existing = await db.execute(select(UserCourseEnrollment).where(
        UserCourseEnrollment.user_id == current_user.id,
        UserCourseEnrollment.course_id == id
    ))
    if existing.scalar_one_or_none():
        return {"message": "Already enrolled"}
    
    enrollment = UserCourseEnrollment(user_id=current_user.id, course_id=id)
    db.add(enrollment)
    await db.commit()
    return {"message": "Enrolled successfully", "course_id": id}


# --- Modules ---

@router.post("/courses/{course_id}/modules")
async def create_module(
    course_id: str,
    module: CourseModuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Add a module to a course."""
    db_module = CourseModule(course_id=course_id, **module.model_dump())
    db.add(db_module)
    await db.commit()
    await db.refresh(db_module)
    return {
        "id": db_module.id,
        "title": db_module.title,
        "order_index": db_module.order_index,
        "lessons": [],
        "quizzes": []
    }

# --- Lessons ---

@router.post("/modules/{module_id}/lessons")
async def create_lesson(
    module_id: str,
    lesson: LessonCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Add a lesson to a module."""
    db_lesson = Lesson(module_id=module_id, **lesson.model_dump())
    db.add(db_lesson)
    await db.commit()
    await db.refresh(db_lesson)
    return {
        "id": db_lesson.id,
        "title": db_lesson.title,
        "content_type": db_lesson.content_type,
        "video_urls": db_lesson.video_urls,
        "images": db_lesson.images,
        "text_content": db_lesson.text_content,
        "duration": db_lesson.duration,
        "order_index": db_lesson.order_index
    }

@router.put("/lessons/{id}")
async def update_lesson(
    id: str,
    lesson_update: LessonCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Update a lesson."""
    result = await db.execute(select(Lesson).where(Lesson.id == id))
    db_lesson = result.scalar_one_or_none()
    if not db_lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    for key, value in lesson_update.model_dump().items():
        setattr(db_lesson, key, value)
        
    await db.commit()
    await db.refresh(db_lesson)
    return {
        "id": db_lesson.id,
        "title": db_lesson.title,
        "content_type": db_lesson.content_type,
        "video_urls": db_lesson.video_urls,
        "images": db_lesson.images,
        "text_content": db_lesson.text_content,
        "duration": db_lesson.duration,
        "order_index": db_lesson.order_index
    }

@router.delete("/lessons/{id}")
async def delete_lesson(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Delete a lesson."""
    result = await db.execute(select(Lesson).where(Lesson.id == id))
    db_lesson = result.scalar_one_or_none()
    if not db_lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    await db.delete(db_lesson)
    await db.commit()
    return {"message": "Lesson deleted successfully"}

@router.post("/lessons/{id}/complete")
async def complete_lesson(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Mark a lesson as complete."""
    # Verify lesson exists
    result = await db.execute(select(Lesson).where(Lesson.id == id))
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # Check if already completed
    existing = await db.execute(select(UserLessonProgress).where(
        UserLessonProgress.user_id == current_user.id,
        UserLessonProgress.lesson_id == id
    ))
    if existing.scalar_one_or_none():
        return {"message": "Already completed"}

    progress = UserLessonProgress(user_id=current_user.id, lesson_id=id)
    db.add(progress)
    
    # Update course progress logic would go here (calculate total lessons vs completed)
    # For now we just mark lesson complete.
    
    await db.commit()
    return {"message": "Lesson completed"}

# --- Quizzes ---

@router.post("/modules/{module_id}/quizzes", response_model=QuizRead)
async def create_quiz(
    module_id: str,
    quiz: QuizCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Create a quiz with questions."""
    # Create valid quiz dict excluding questions
    quiz_data = quiz.model_dump(exclude={'questions'})
    db_quiz = Quiz(module_id=module_id, **quiz_data)
    db.add(db_quiz)
    await db.flush() # flush to get ID
    
    # Add questions
    for q in quiz.questions:
        db_question = QuizQuestion(quiz_id=db_quiz.id, **q.model_dump())
        db.add(db_question)
        
    await db.commit()
    # await db.commit() - already committed above
    
    # Re-fetch with questions loaded to avoid lazy loading errors
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Quiz)
        .options(selectinload(Quiz.questions))
        .where(Quiz.id == db_quiz.id)
    )
    db_quiz = result.scalar_one()
    
    return db_quiz

@router.post("/quizzes/{id}/submit", response_model=QuizResult)
async def submit_quiz(
    id: str,
    submission: QuizSubmission,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Submit quiz answers and get result."""
    # Get quiz and questions
    result = await db.execute(select(Quiz).where(Quiz.id == id))
    quiz = result.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    # Ideally fetch questions in order. Assuming submission matches questions order or IDs needed.
    # For simplicity, let's assume simple sequential submission matching questions list.
    # A robust implementation should map answer to question ID.
    
    # Eager loading questions?
    # result = await db.execute(select(QuizQuestion).where(QuizQuestion.quiz_id == id))
    # questions = result.scalars().all()
    
    # Re-fetch quiz with questions loaded
    # This might require explicit relationship loading in async
    q_result = await db.execute(select(QuizQuestion).where(QuizQuestion.quiz_id == id))
    questions = q_result.scalars().all()
    
    if len(submission.answers) != len(questions):
        raise HTTPException(status_code=400, detail="Number of answers does not match number of questions")
        
    correct_count = 0
    for i, question in enumerate(questions):
        if submission.answers[i] == question.correct_option_index:
            correct_count += 1
            
    score_percent = (correct_count / len(questions)) * 100
    passed = score_percent >= quiz.pass_score
    
    # Record attempt
    attempt = UserQuizAttempt(
        user_id=current_user.id,
        quiz_id=id,
        score=score_percent,
        passed=passed
    )
    db.add(attempt)
    await db.commit()
    
    return QuizResult(
        score=score_percent,
        passed=passed,
        total_questions=len(questions),
        correct_answers=correct_count
    )
