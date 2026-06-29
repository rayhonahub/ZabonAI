from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta
from app import models, schemas
from app.deps import get_db, get_current_user
from app.services import ai_service

router = APIRouter(prefix="/ai", tags=["AI"])

CACHE_WINDOW = timedelta(hours=24)


def get_cached_response(db: Session, user_id: int, message: str, chat_type: str, lesson_id: int = None):
    cutoff = datetime.utcnow() - CACHE_WINDOW
    query = db.query(models.AIChatHistory).filter(
        models.AIChatHistory.user_id == user_id,
        models.AIChatHistory.message == message,
        models.AIChatHistory.chat_type == chat_type,
        models.AIChatHistory.created_at >= cutoff,
        ~models.AIChatHistory.response.startswith("⚠️"),
    )
    if chat_type == "tutor":
        query = query.filter(models.AIChatHistory.lesson_id == lesson_id)
    entry = query.order_by(models.AIChatHistory.created_at.desc()).first()
    return entry.response if entry else None


@router.post("/grammar-check", response_model=schemas.AIResponse)
def grammar_check(
    data: schemas.GrammarCheckRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    response = get_cached_response(db, current_user.id, data.text, "grammar")
    if response is None:
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

    response = get_cached_response(db, current_user.id, data.question, "tutor", data.lesson_id)
    if response is None:
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

    try:
        questions = ai_service.generate_quiz(lesson.content, lesson.title)
    except ai_service.QuotaExceeded:
        raise HTTPException(
            status_code=503,
            detail="AI временно недоступен. Лимит запросов исчерпан. Попробуйте через час."
        )
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


@router.post("/voice-check")
async def voice_grammar_check(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """User records voice → convert to text → AI checks grammar"""
    import speech_recognition as sr
    import io

    audio_bytes = await file.read()

    recognizer = sr.Recognizer()
    try:
        audio_file = sr.AudioFile(io.BytesIO(audio_bytes))
        with audio_file as source:
            audio = recognizer.record(source)
        text = recognizer.recognize_google(audio, language="en-US")
    except Exception:
        text = None

    if not text:
        return {"error": "Could not recognize speech. Please speak clearly."}

    response = ai_service.check_grammar(text)

    history = models.AIChatHistory(
        user_id=current_user.id,
        message=f"[VOICE] {text}",
        response=response,
        chat_type="voice"
    )
    db.add(history)
    db.commit()

    return {
        "recognized_text": text,
        "grammar_check": response,
        "chat_type": "voice"
    }


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