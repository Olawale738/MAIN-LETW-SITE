from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime

# --- Base Models ---

class QuizQuestionBase(BaseModel):
    question_text: str
    options: List[str]
    correct_option_index: int

class QuizBase(BaseModel):
    title: str
    pass_score: int = 70

class LessonBase(BaseModel):
    title: str
    content_type: str = 'mixed'
    video_urls: List[str] = []
    images: List[str] = []
    text_content: Optional[str] = None
    duration: Optional[int] = None
    order_index: int = 0

class CourseModuleBase(BaseModel):
    title: str
    order_index: int = 0

class CourseBase(BaseModel):
    title: str
    description: Optional[str] = None
    instructor: Optional[str] = None
    is_published: bool = False

# --- Read Models ---

class QuizQuestionRead(QuizQuestionBase):
    id: str

class QuizRead(QuizBase):
    id: str
    questions: List[QuizQuestionRead] = []

class LessonRead(LessonBase):
    id: str
    is_completed: bool = False  # For user perspective

class CourseModuleRead(CourseModuleBase):
    id: str
    lessons: List[LessonRead] = []
    quizzes: List[QuizRead] = []

class CourseRead(CourseBase):
    id: str
    thumbnail: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    modules: List[CourseModuleRead] = []
    
    # User specific fields
    is_enrolled: bool = False
    progress_percent: float = 0.0

class CourseListRead(BaseModel):
    id: str
    title: str
    description: Optional[str]
    thumbnail: Optional[str]
    instructor: Optional[str]
    is_published: bool
    created_at: datetime
    is_enrolled: bool = False
    progress_percent: float = 0.0

# --- Create/Update Models ---

class QuizQuestionCreate(QuizQuestionBase):
    pass

class QuizCreate(QuizBase):
    questions: List[QuizQuestionCreate]

class LessonCreate(LessonBase):
    pass

class CourseModuleCreate(CourseModuleBase):
    pass

class CourseCreate(CourseBase):
    pass

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    instructor: Optional[str] = None
    is_published: Optional[bool] = None
    thumbnail: Optional[str] = None

# --- Action Models ---

class QuizSubmission(BaseModel):
    answers: List[int]  # List of selected option indices

class QuizResult(BaseModel):
    score: float
    passed: bool
    total_questions: int
    correct_answers: int

class EnrollmentResponse(BaseModel):
    message: str
    course_id: str
    enrolled_at: datetime
