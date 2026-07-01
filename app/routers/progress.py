from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app import models, schemas
from app.deps import get_db, get_current_user
from app.level_utils import level_from_xp

router = APIRouter(prefix="/progress", tags=["Progress"])


@router.get("/lessons", response_model=list[schemas.ProgressResponse])
def get_my_progress(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    rows = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == current_user.id
    ).order_by(models.UserProgress.completed_at.desc()).all()

    return [
        schemas.ProgressResponse(
            lesson_id=p.lesson_id,
            lesson_title=p.lesson.title if p.lesson else None,
            completed=p.completed,
            score=p.score,
            weak_topic=p.weak_topic,
            completed_at=p.completed_at,
        )
        for p in rows
    ]


@router.post("/complete-lesson/{lesson_id}")
def complete_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Урок не найден")

    progress = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == current_user.id,
        models.UserProgress.lesson_id == lesson_id
    ).first()

    xp_awarded = False
    if progress is None:
        progress = models.UserProgress(
            user_id=current_user.id,
            lesson_id=lesson_id,
            completed=True,
            completed_at=datetime.utcnow()
        )
        db.add(progress)
        current_user.xp_points += 10
        current_user.total_lessons_completed += 1
        current_user.level = level_from_xp(current_user.xp_points)
        xp_awarded = True

    db.commit()
    return {
        "xp_awarded": xp_awarded,
        "xp_points": current_user.xp_points,
        "streak": current_user.streak,
    }


@router.get("/coins")
def get_my_coins(
    current_user: models.User = Depends(get_current_user)
):
    return {"coins": current_user.coins}


@router.get("/leaderboard", response_model=list[schemas.LeaderboardEntry])
def get_leaderboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    users = (
        db.query(models.User)
        .order_by(models.User.weekly_xp.desc())
        .limit(10)
        .all()
    )
    return [
        schemas.LeaderboardEntry(
            rank=i + 1,
            full_name=u.full_name,
            avatar_seed=u.avatar_seed or "default",
            avatar_style=u.avatar_style or "adventurer",
            weekly_xp=u.weekly_xp or 0,
        )
        for i, u in enumerate(users)
    ]


@router.get("/summary", response_model=schemas.ProgressSummary)
def get_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    all_lessons = db.query(models.Lesson).count()

    user_progress = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == current_user.id
    ).all()

    completed = [p for p in user_progress if p.completed]
    scores = [p.score for p in completed if p.score is not None]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0

    weak_progress = [p for p in user_progress if p.weak_topic]
    weak_lesson_ids = [p.lesson_id for p in weak_progress]
    weak_lessons = db.query(models.Lesson).filter(
        models.Lesson.id.in_(weak_lesson_ids)
    ).all()
    weak_topics = [l.title for l in weak_lessons]
    weak_topic_lessons = [{"lesson_id": l.id, "title": l.title} for l in weak_lessons]

    return schemas.ProgressSummary(
        total_lessons=all_lessons,
        completed_lessons=len(completed),
        average_score=avg_score,
        streak=current_user.streak,
        weak_topics=weak_topics,
        weak_topic_lessons=weak_topic_lessons
    )