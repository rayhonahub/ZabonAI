from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime



class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    ref_code: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    streak: int
    coins: int
    avatar_style: str = "adventurer"
    avatar_seed: str = "default"
    bio: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    streak_bonus_awarded: bool = False
    streak: int = 0



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

class QuizResultItem(BaseModel):
    question_id: int
    question: str
    user_answer: Optional[str] = None
    correct_answer: str
    is_correct: bool
    correct_option_text: str
    user_option_text: Optional[str] = None

class LevelUpInfo(BaseModel):
    unlocked: bool
    new_level: str
    new_level_label_tj: str

class QuizResult(BaseModel):
    score: float
    total: int
    correct: int
    weak_topic: bool
    results: List[QuizResultItem]
    level_up: Optional[LevelUpInfo] = None



class ProgressResponse(BaseModel):
    lesson_id: int
    lesson_title: Optional[str] = None
    completed: bool
    score: Optional[float]
    weak_topic: bool
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class WeakTopicLesson(BaseModel):
    lesson_id: int
    title: str

class ProgressSummary(BaseModel):
    total_lessons: int
    completed_lessons: int
    average_score: float
    streak: int
    weak_topics: List[str]
    weak_topic_lessons: List[WeakTopicLesson]



class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_color: Optional[str] = None
    avatar_style: Optional[str] = None
    avatar_seed: Optional[str] = None
    selected_language: Optional[str] = None
    selected_level: Optional[str] = None

class ProfileResponse(BaseModel):
    id: int
    full_name: str
    email: str
    bio: Optional[str] = None
    avatar_color: str
    avatar_style: str
    avatar_seed: str
    selected_language: str
    streak: int
    coins: int
    xp_points: int
    level: str
    level_label: str
    selected_level: str
    total_lessons_completed: int
    total_quizzes_passed: int
    travel_completed: bool = False
    created_at: datetime

class ProfileStats(BaseModel):
    xp_points: int
    level: str
    level_label: str
    streak: int
    total_lessons_completed: int
    total_quizzes_passed: int
    average_score: float



class GrammarCheckRequest(BaseModel):
    text: str
    lang: str = "ru"

class AskTutorRequest(BaseModel):
    question: str
    lesson_id: Optional[int] = None
    lang: str = "ru"

class AIResponse(BaseModel):
    response: str
    chat_type: str

class GenerateQuizRequest(BaseModel):
    lesson_id: int


class ReferralInfo(BaseModel):
    referral_code: Optional[str] = None
    referral_link: str
    referral_count: int
    coins_earned: int


class DailyChallengeQuestion(BaseModel):
    id: int
    question: str
    option_a: str
    option_b: str
    option_c: Optional[str]
    option_d: Optional[str]
    correct_answer: str

    class Config:
        from_attributes = True


class DailySubmit(BaseModel):
    answers: dict


class DailyChallengeResult(BaseModel):
    score: float
    total: int
    correct: int
    coins_earned: int
    xp_earned: int
    already_done_today: bool


class LeaderboardEntry(BaseModel):
    rank: int
    full_name: str
    avatar_seed: str
    avatar_style: str
    weekly_xp: int