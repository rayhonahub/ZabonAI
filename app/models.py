from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import random
from app.database import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    level = Column(String, default="beginner")
    created_at = Column(DateTime, default=datetime.utcnow)

    modules = relationship("Module", back_populates="course")


class Module(Base):
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String, nullable=False)
    order = Column(Integer, default=1)

    course = relationship("Course", back_populates="modules")
    lessons = relationship("Lesson", back_populates="module")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=True)
    order = Column(Integer, default=1)

    module = relationship("Module", back_populates="lessons")
    questions = relationship("QuizQuestion", back_populates="lesson")
    progress = relationship("UserProgress", back_populates="lesson")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    question = Column(Text, nullable=False)
    option_a = Column(String, nullable=False)
    option_b = Column(String, nullable=False)
    option_c = Column(String, nullable=True)
    option_d = Column(String, nullable=True)
    correct_answer = Column(String, nullable=False)

    lesson = relationship("Lesson", back_populates="questions")


class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    completed = Column(Boolean, default=False)
    score = Column(Float, nullable=True)
    weak_topic = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="progress")
    lesson = relationship("Lesson", back_populates="progress")


class AIChatHistory(Base):
    __tablename__ = "ai_chat_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=True)
    message = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    chat_type = Column(String, default="tutor")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chat_history")


AVATAR_COLORS = ["#f0a500", "#1e3a5f", "#10b981", "#3b82f6", "#a855f7", "#ec4899", "#f43f5e", "#f97316", "#14b8a6", "#6366f1"]


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    streak = Column(Integer, default=0)
    last_activity = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    avatar_color = Column(String, default=lambda: random.choice(AVATAR_COLORS))
    bio = Column(Text, nullable=True)
    selected_language = Column(String, default="ru")
    xp_points = Column(Integer, default=0)
    level = Column(String, default="beginner")
    total_lessons_completed = Column(Integer, default=0)
    total_quizzes_passed = Column(Integer, default=0)

    progress = relationship("UserProgress", back_populates="user")
    chat_history = relationship("AIChatHistory", back_populates="user")