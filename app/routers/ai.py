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


@router.get("/word-examples/{word}")
def get_word_examples(
    word: str,
    translation: str = "",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get AI-generated examples for a word. Cached in DB."""
    import json as _json
    cached = db.query(models.WordExample).filter(models.WordExample.word == word.lower()).first()
    if cached:
        return {"word": word, "examples": _json.loads(cached.examples)}

    examples = ai_service.generate_word_examples(word, translation)
    cache_entry = models.WordExample(
        word=word.lower(),
        examples=_json.dumps(examples, ensure_ascii=False)
    )
    db.add(cache_entry)
    db.commit()
    return {"word": word, "examples": examples}


@router.post("/writing-check")
def writing_check(
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Check user's written English text and return errors with Tajik explanations"""
    import json as _json
    text = data.get("text", "")
    if not text.strip():
        raise HTTPException(400, "Матн холӣ аст")

    prompt = f"""
You are an English writing tutor for Tajik speakers.
The student wrote: "{text}"

Analyze the text and return ONLY valid JSON, no extra text:
{{
  "corrected_text": "the fully corrected version of the text",
  "errors": [
    {{
      "original": "wrong phrase or word",
      "fixed": "correct version",
      "explanation_tj": "кӯтоҳ тавзеҳ ба тоҷикӣ чаро нодуруст аст",
      "type": "grammar|spelling|punctuation|word_choice"
    }}
  ],
  "overall_score": 85,
  "encouragement_tj": "сухани ташвиқӣ ба тоҷикӣ барои донишҷӯ"
}}
If text has no errors, return empty errors array and score 100.
All explanations MUST be in Tajik language.
"""
    try:
        response = ai_service.model.generate_content(prompt)
        text_resp = response.text.strip()
        if "```json" in text_resp:
            text_resp = text_resp.split("```json")[1].split("```")[0].strip()
        elif "```" in text_resp:
            text_resp = text_resp.split("```")[1].split("```")[0].strip()
        result = _json.loads(text_resp)

        history = models.AIChatHistory(
            user_id=current_user.id,
            message=f"[WRITING] {data.get('text', '')}",
            response=_json.dumps(result, ensure_ascii=False),
            chat_type="writing"
        )
        db.add(history)
        db.commit()
        return result
    except Exception:
        return {
            "corrected_text": text,
            "errors": [],
            "overall_score": 100,
            "encouragement_tj": "Хуб кор кардӣ! Давом деҳ!"
        }


@router.post("/pronunciation-check")
def pronunciation_check(
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    User speaks a word/sentence → Web Speech API transcribes it →
    AI compares transcription with target and gives detailed feedback in Tajik
    """
    target_text = data.get("target_text", "")
    user_said = data.get("user_said", "")

    if not target_text or not user_said:
        raise HTTPException(400, "Матн холӣ аст")

    prompt = f"""
You are an English pronunciation teacher for Tajik speakers.

Target (correct): "{target_text}"
Student said: "{user_said}"

Analyze the pronunciation attempt and respond ONLY in Tajik language with this JSON:
{{
  "similarity_score": 85,
  "is_correct": true,
  "feedback_tj": "Талаффузи шумо хуб аст! Аммо ...",
  "specific_errors": [
    {{
      "wrong": "what student said wrong",
      "correct": "correct pronunciation",
      "tip_tj": "маслиҳат ба тоҷикӣ"
    }}
  ],
  "encouragement_tj": "сухани ташвиқӣ ба тоҷикӣ"
}}

If student said exactly the right thing: similarity_score=100, is_correct=true, specific_errors=[]
IMPORTANT: All text in Tajik language only, no Russian.
"""
    try:
        import json as json_lib
        response = ai_service.model.generate_content(prompt)
        text = response.text.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        result = json_lib.loads(text)

        history = models.AIChatHistory(
            user_id=current_user.id,
            message=f"[PRONUNCIATION] target={target_text} said={user_said}",
            response=json_lib.dumps(result, ensure_ascii=False),
            chat_type="pronunciation"
        )
        db.add(history)
        db.commit()
        return result
    except Exception:
        return {
            "similarity_score": 70,
            "is_correct": False,
            "feedback_tj": "Боз кӯшиш кунед! Суст-суст гӯед.",
            "specific_errors": [],
            "encouragement_tj": "Ташвиш нашавед, давом диҳед!"
        }


@router.post("/conversation")
def ai_conversation(
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Free conversation with AI partner"""
    message = data.get("message", "")
    scenario = data.get("scenario", "general")
    history = data.get("history", [])

    scenario_prompts = {
        "general": "You are a friendly English-speaking friend having a casual conversation.",
        "cafe": "You are a friendly café waiter. The student is ordering food and drinks.",
        "interview": "You are a job interviewer conducting a friendly English job interview.",
        "travel": "You are a helpful tourist guide in London helping a visitor.",
    }

    system = f"""{scenario_prompts.get(scenario, scenario_prompts['general'])}
IMPORTANT RULES:
1. Respond naturally in English as a real person would.
2. Keep responses SHORT (2-4 sentences max).
3. If the user makes a grammar mistake, at the very end of your response add ONE correction in brackets like: [Тасҳеҳ: "I goed" → "I went" — чаро: феъли 'go' ноқиёс аст]
4. Be encouraging and warm.
5. If user writes in Tajik, gently remind them: "Let's practice in English! / Биёед ба англисӣ машқ кунем!"
"""

    messages_ctx = []
    for h in history[-6:]:
        messages_ctx.append({"role": h["role"], "content": h["content"]})
    messages_ctx.append({"role": "user", "content": message})

    full_prompt = system + "\n\nConversation:\n" + "\n".join(
        [f"{'User' if m['role'] == 'user' else 'AI'}: {m['content']}" for m in messages_ctx]
    ) + "\nAI:"

    try:
        response = ai_service.model.generate_content(full_prompt)
        ai_reply = response.text.strip()
    except Exception:
        ai_reply = "Sorry, I didn't catch that. Could you repeat? [ИИ ҳоло банд аст, боз кӯшиш кун]"

    hist = models.AIChatHistory(
        user_id=current_user.id,
        message=f"[CONV:{scenario}] {message}",
        response=ai_reply,
        chat_type="conversation"
    )
    db.add(hist)
    db.commit()
    return {"reply": ai_reply, "scenario": scenario}


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