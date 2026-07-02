import random
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.deps import get_db, get_current_user
from app.level_utils import level_from_xp
from app.services.level_service import unlock_next_level_if_earned
from datetime import datetime, date

router = APIRouter(prefix="/quiz", tags=["Quiz"])


@router.get("/daily-challenge", response_model=list[schemas.DailyChallengeQuestion])
def get_daily_challenge(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    all_questions = db.query(models.QuizQuestion).all()
    if not all_questions:
        return []
    seed = date.today().isoformat()
    rand = random.Random(seed)
    picked = rand.sample(all_questions, min(5, len(all_questions)))
    return picked


@router.get("/daily-challenge/status")
def daily_challenge_status(
    current_user: models.User = Depends(get_current_user),
):
    today = date.today()
    already_done = (
        current_user.last_daily_challenge_at is not None
        and current_user.last_daily_challenge_at.date() == today
    )
    return {"already_done_today": already_done}


@router.post("/daily-challenge/submit", response_model=schemas.DailyChallengeResult)
def submit_daily_challenge(
    data: schemas.DailySubmit,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    today = date.today()
    if (
        current_user.last_daily_challenge_at is not None
        and current_user.last_daily_challenge_at.date() == today
    ):
        return schemas.DailyChallengeResult(
            score=0, total=5, correct=0,
            coins_earned=0, xp_earned=0, already_done_today=True,
        )

    all_questions = db.query(models.QuizQuestion).all()
    seed = today.isoformat()
    rand = random.Random(seed)
    questions = rand.sample(all_questions, min(5, len(all_questions)))

    correct = 0
    for q in questions:
        user_answer = data.answers.get(str(q.id))
        if user_answer and user_answer.lower() == q.correct_answer.lower():
            correct += 1

    total = len(questions)
    score = round((correct / total) * 100, 1) if total > 0 else 0.0

    coins_earned = 0
    xp_earned = 0
    if score >= 60:
        coins_earned = 15
        xp_earned = 15
        current_user.coins += coins_earned
        current_user.xp_points += xp_earned
        current_user.weekly_xp = (current_user.weekly_xp or 0) + xp_earned
        current_user.daily_challenge_streak = (current_user.daily_challenge_streak or 0) + 1
        current_user.level = level_from_xp(current_user.xp_points)

    current_user.last_daily_challenge_at = datetime.utcnow()
    db.commit()

    return schemas.DailyChallengeResult(
        score=score, total=total, correct=correct,
        coins_earned=coins_earned, xp_earned=xp_earned,
        already_done_today=False,
    )


@router.get("/{lesson_id}", response_model=list[schemas.QuizQuestionResponse])
def get_quiz(lesson_id: int, db: Session = Depends(get_db)):
    questions = db.query(models.QuizQuestion).filter(
        models.QuizQuestion.lesson_id == lesson_id
    ).all()
    if not questions:
        raise HTTPException(status_code=404, detail="Тест не найден")
    return questions


@router.post("/submit", response_model=schemas.QuizResult)
def submit_quiz(
    data: schemas.QuizSubmit,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    questions = db.query(models.QuizQuestion).filter(
        models.QuizQuestion.lesson_id == data.lesson_id
    ).all()
    if not questions:
        raise HTTPException(status_code=404, detail="Вопросы не найдены")

    def option_text(q, letter):
        if not letter:
            return None
        return getattr(q, f"option_{letter.lower()}", None)

    correct = 0
    results = []
    for q in questions:
        user_answer = data.answers.get(str(q.id))
        is_correct = bool(user_answer and user_answer.lower() == q.correct_answer.lower())
        if is_correct:
            correct += 1
        results.append(schemas.QuizResultItem(
            question_id=q.id,
            question=q.question,
            user_answer=user_answer,
            correct_answer=q.correct_answer,
            is_correct=is_correct,
            correct_option_text=option_text(q, q.correct_answer) or "",
            user_option_text=option_text(q, user_answer),
        ))

    total = len(questions)
    score = round((correct / total) * 100, 1)
    weak_topic = score < 60

    progress = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == current_user.id,
        models.UserProgress.lesson_id == data.lesson_id
    ).first()

    is_first_completion = progress is None
    was_already_passed = bool(progress and progress.score is not None and progress.score >= 60)
    newly_passed = score >= 60 and not was_already_passed

    if progress:
        progress.score = score
        progress.weak_topic = weak_topic
        progress.completed = True
        progress.completed_at = datetime.utcnow()
    else:
        progress = models.UserProgress(
            user_id=current_user.id,
            lesson_id=data.lesson_id,
            completed=True,
            score=score,
            weak_topic=weak_topic,
            completed_at=datetime.utcnow()
        )
        db.add(progress)

    if is_first_completion:
        current_user.xp_points += 10
        current_user.weekly_xp = (current_user.weekly_xp or 0) + 10
        current_user.total_lessons_completed += 1
        current_user.coins += 10
    if newly_passed:
        current_user.xp_points += 20
        current_user.weekly_xp = (current_user.weekly_xp or 0) + 20
        current_user.total_quizzes_passed += 1
        current_user.coins += 20
    if is_first_completion or newly_passed:
        current_user.level = level_from_xp(current_user.xp_points)

    db.commit()

    level_up = unlock_next_level_if_earned(current_user.id, db)

    return schemas.QuizResult(
        score=score, total=total, correct=correct, weak_topic=weak_topic,
        results=results, level_up=level_up,
    )


@router.post("/questions/{lesson_id}", response_model=schemas.QuizQuestionResponse)
def create_question(
    lesson_id: int,
    data: schemas.QuizQuestionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    question = models.QuizQuestion(lesson_id=lesson_id, **data.model_dump())
    db.add(question)
    db.commit()
    db.refresh(question)
    return question
