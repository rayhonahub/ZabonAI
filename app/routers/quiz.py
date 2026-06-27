from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.deps import get_db, get_current_user
from app.level_utils import level_from_xp
from datetime import datetime

router = APIRouter(prefix="/quiz", tags=["Quiz"])


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

    correct = 0
    for q in questions:
        user_answer = data.answers.get(str(q.id))
        if user_answer and user_answer.lower() == q.correct_answer.lower():
            correct += 1

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
        current_user.total_lessons_completed += 1
    if newly_passed:
        current_user.xp_points += 20
        current_user.total_quizzes_passed += 1
    if is_first_completion or newly_passed:
        current_user.level = level_from_xp(current_user.xp_points)

    db.commit()
    return schemas.QuizResult(score=score, total=total, correct=correct, weak_topic=weak_topic)


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