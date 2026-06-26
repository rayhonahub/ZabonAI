from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime



class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    streak: int
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str



class CourseCreate(BaseModel):
    title: str
    description: Optional[str] = None
    level: str = "beginner"

class CourseResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    level: str

    class Config:
        from_attributes = True


class ModuleCreate(BaseModel):
    title: str
    order: int = 1

class ModuleResponse(BaseModel):
    id: int
    course_id: int
    title: str
    order: int

    class Config:
        from_attributes = True


class LessonCreate(BaseModel):
    title: str
    content: Optional[str] = None
    order: int = 1

class LessonResponse(BaseModel):
    id: int
    module_id: int
    title: str
    content: Optional[str]
    order: int

    class Config:
        from_attributes = True


class QuizQuestionCreate(BaseModel):
    question: str
    option_a: str
    option_b: str
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_answer: str

class QuizQuestionResponse(BaseModel):
    id: int
    question: str
    option_a: str
    option_b: str
    option_c: Optional[str]
    option_d: Optional[str]

    class Config:
        from_attributes = True

class QuizSubmit(BaseModel):
    lesson_id: int
    answers: dict

class QuizResult(BaseModel):
    score: float
    total: int
    correct: int
    weak_topic: bool



class ProgressResponse(BaseModel):
    lesson_id: int
    completed: bool
    score: Optional[float]
    weak_topic: bool

    class Config:
        from_attributes = True

class ProgressSummary(BaseModel):
    total_lessons: int
    completed_lessons: int
    average_score: float
    streak: int
    weak_topics: List[str]



class GrammarCheckRequest(BaseModel):
    text: str

class AskTutorRequest(BaseModel):
    question: str
    lesson_id: Optional[int] = None

class AIResponse(BaseModel):
    response: str
    chat_type: str

class GenerateQuizRequest(BaseModel):
    lesson_id: int