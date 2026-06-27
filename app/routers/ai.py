from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from app import models, schemas
from app.deps import get_db, get_current_user
from app.services import ai_service

router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/grammar-check", response_model=schemas.AIResponse)
def grammar_check(
    data: schemas.GrammarCheckRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    response = ai_service.check_grammar(data.text, data.lang)
    history = models.AIChatHistory(
        user_id=current_user.id,
        message=data.text,
        response=response,
        chat_type="grammar"
    )
    db.add(history)
    db.commit()
    return schemas.AIResponse(response=response, chat_type="grammar")


@router.post("/ask", response_model=schemas.AIResponse)
def ask_tutor(
    data: schemas.AskTutorRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    lesson_context = None
    if data.lesson_id:
        lesson = db.query(models.Lesson).filter(models.Lesson.id == data.lesson_id).first()
        if lesson:
            lesson_context = f"Title: {lesson.title}\nContent: {lesson.content}"

    response = ai_service.ask_tutor(data.question, lesson_context, data.lang)
    history = models.AIChatHistory(
        user_id=current_user.id,
        lesson_id=data.lesson_id,
        message=data.question,
        response=response,
        chat_type="tutor"
    )
    db.add(history)
    db.commit()
    return schemas.AIResponse(response=response, chat_type="tutor")


@router.post("/screenshot", response_model=schemas.AIResponse)
async def analyze_screenshot(
    file: UploadFile = File(...),
    question: Optional[str] = Form(None),
    lang: str = Form("ru"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Файл должен быть изображением")

    image_bytes = await file.read()
    response = ai_service.analyze_screenshot(image_bytes, question, lang)

    history = models.AIChatHistory(
        user_id=current_user.id,
        message=question or "Screenshot uploaded",
        response=response,
        chat_type="screenshot"
    )
    db.add(history)
    db.commit()
    return schemas.AIResponse(response=response, chat_type="screenshot")


@router.post("/generate-quiz/{lesson_id}")
def generate_quiz(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Урок не найден")
    if not lesson.content:
        raise HTTPException(status_code=400, detail="У урока нет контента")

    questions = ai_service.generate_quiz(lesson.content, lesson.title)
    for q in questions:
        question = models.QuizQuestion(
            lesson_id=lesson_id,
            question=q["question"],
            option_a=q["option_a"],
            option_b=q["option_b"],
            option_c=q.get("option_c"),
            option_d=q.get("option_d"),
            correct_answer=q["correct_answer"]
        )
        db.add(question)
    db.commit()
    return {"message": f"{len(questions)} вопросов сгенерировано", "questions": questions}


@router.get("/history")
def get_chat_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    history = db.query(models.AIChatHistory).filter(
        models.AIChatHistory.user_id == current_user.id
    ).order_by(models.AIChatHistory.created_at.desc()).limit(50).all()

    return [
        {
            "id": h.id,
            "message": h.message,
            "response": h.response,
            "chat_type": h.chat_type,
            "created_at": h.created_at
        }
        for h in history
    ]


@router.get("/weak-topics-advice")
def weak_topics_advice(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    weak_progress = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == current_user.id,
        models.UserProgress.weak_topic == True
    ).all()

    weak_lesson_ids = [p.lesson_id for p in weak_progress]
    weak_lessons = db.query(models.Lesson).filter(
        models.Lesson.id.in_(weak_lesson_ids)
    ).all()
    weak_topics = [l.title for l in weak_lessons]

    advice = ai_service.get_weak_topic_advice(weak_topics)
    return {"weak_topics": weak_topics, "advice": advice}