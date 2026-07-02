from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app import models, schemas
from app.deps import get_db, get_current_user
from app.level_utils import level_from_xp
from app.services.level_service import unlock_next_level_if_earned

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

    level_up = unlock_next_level_if_earned(current_user.id, db)

    return {
        "xp_awarded": xp_awarded,
        "xp_points": current_user.xp_points,
        "streak": current_user.streak,
        "level_up": level_up,
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


@router.get("/vocabulary/due")
def get_due_words(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    from datetime import datetime
    due = db.query(models.VocabularyReview).filter(
        models.VocabularyReview.user_id == current_user.id,
        models.VocabularyReview.next_review_at <= datetime.utcnow()
    ).limit(20).all()
    return [{"id": w.id, "word": w.word, "translation": w.translation, "correct_count": w.correct_count} for w in due]


@router.post("/vocabulary/review")
def submit_vocabulary_review(
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    from datetime import datetime, timedelta
    word_id = data.get("word_id")
    correct = data.get("correct", False)
    review = db.query(models.VocabularyReview).filter(
        models.VocabularyReview.id == word_id,
        models.VocabularyReview.user_id == current_user.id
    ).first()
    if not review:
        raise HTTPException(status_code=404, detail="Калима ёфт нашуд")
    review.total_reviews += 1
    if correct:
        review.correct_count += 1
        if review.interval_days == 1:
            review.interval_days = 6
        else:
            review.interval_days = int(review.interval_days * review.ease_factor)
        review.ease_factor = max(1.3, review.ease_factor + 0.1)
    else:
        review.interval_days = 1
        review.ease_factor = max(1.3, review.ease_factor - 0.2)
    review.next_review_at = datetime.utcnow() + timedelta(days=review.interval_days)
    db.commit()
    return {"next_review_in_days": review.interval_days, "ease_factor": review.ease_factor}


@router.post("/vocabulary/add")
def add_vocabulary_word(
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    word = data.get("word", "").lower().strip()
    translation = data.get("translation", "").strip()
    if not word:
        raise HTTPException(status_code=400, detail="Калима холӣ аст")
    existing = db.query(models.VocabularyReview).filter(
        models.VocabularyReview.user_id == current_user.id,
        models.VocabularyReview.word == word
    ).first()
    if existing:
        return {"message": "Калима аллакай дар рӯйхат аст"}
    new_word = models.VocabularyReview(
        user_id=current_user.id,
        word=word,
        translation=translation
    )
    db.add(new_word)
    db.commit()
    return {"message": "Калима илова шуд", "word": word}