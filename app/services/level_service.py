from typing import Optional
from sqlalchemy.orm import Session
from app import models

LEVEL_ORDER = {
    "beginner": 1,
    "elementary": 2,
    "intermediate": 3,
    "advanced": 4,
}

LEVEL_LABELS_TJ = {
    "beginner": "Ибтидоӣ",
    "elementary": "Миёна",
    "intermediate": "Болотар",
    "advanced": "Баланд",
}

COMPLETION_THRESHOLD = 80


def get_next_level(current_level: str) -> Optional[str]:
    order = LEVEL_ORDER.get(current_level, 1)
    next_levels = {v: k for k, v in LEVEL_ORDER.items()}
    return next_levels.get(order + 1)


def _course_completion(db: Session, user_id: int, course_id: int) -> tuple[int, int, float]:
    """Return (completed_lessons, total_lessons, percentage) for a course."""
    total = db.query(models.Lesson).join(models.Module).filter(
        models.Module.course_id == course_id
    ).count()

    completed = db.query(models.UserProgress).join(models.Lesson).join(models.Module).filter(
        models.Module.course_id == course_id,
        models.UserProgress.user_id == user_id,
        models.UserProgress.completed == True,
    ).count()

    percentage = round((completed / total * 100), 1) if total > 0 else 0.0
    return completed, total, percentage


def check_level_completion(user_id: int, level: str, db: Session) -> bool:
    """Check if the user completed ALL courses of a given level (>= 80% each)."""
    courses = db.query(models.Course).filter(models.Course.level == level).all()
    if not courses:
        return False

    for course in courses:
        completed, total, percentage = _course_completion(db, user_id, course.id)
        if total == 0:
            continue
        if percentage < COMPLETION_THRESHOLD:
            return False

    return True


def unlock_next_level_if_earned(user_id: int, db: Session) -> Optional[dict]:
    """Check if user earned the next level unlock and return unlock info."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return None

    current_level = user.selected_level or "beginner"
    next_level = get_next_level(current_level)
    if not next_level:
        return None

    if check_level_completion(user_id, current_level, db):
        user.selected_level = next_level
        db.commit()
        return {
            "unlocked": True,
            "new_level": next_level,
            "new_level_label_tj": LEVEL_LABELS_TJ.get(next_level, next_level),
        }

    return None


def get_courses_for_user(user_id: int, db: Session) -> list:
    """Get all courses annotated with lock status and progress for this user."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    user_level = (user.selected_level if user else None) or "beginner"
    user_level_order = LEVEL_ORDER.get(user_level, 1)

    all_courses = db.query(models.Course).order_by(
        models.Course.level_order, models.Course.id
    ).all()

    result = []
    for course in all_courses:
        course_level_order = LEVEL_ORDER.get(course.level, 1)
        completed, total, percentage = _course_completion(db, user_id, course.id)

        result.append({
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "level": course.level,
            "level_label_tj": LEVEL_LABELS_TJ.get(course.level, course.level),
            "level_order": course_level_order,
            "is_locked": course_level_order > user_level_order,
            "total_lessons": total,
            "completed_lessons": completed,
            "completion_percentage": percentage,
            "is_completed": total > 0 and percentage >= COMPLETION_THRESHOLD,
            "user_level": user_level,
            "user_level_order": user_level_order,
        })

    return result
