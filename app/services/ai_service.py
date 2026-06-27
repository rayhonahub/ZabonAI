import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted
from dotenv import load_dotenv
import os
import json

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.0-flash-lite")

LANGUAGE_NAMES = {
    "ru": "Russian",
    "tj": "Tajik",
    "en": "English",
}


def _lang_instruction(lang: str) -> str:
    name = LANGUAGE_NAMES.get(lang, "Russian")
    return f"Explain in {name}."


class QuotaExceeded(Exception):
    pass


def safe_generate(prompt, image=None) -> str:
    try:
        if image is not None:
            return model.generate_content([prompt, image]).text
        return model.generate_content(prompt).text
    except ResourceExhausted:
        return "⚠️ AI временно недоступен. Лимит запросов исчерпан. Попробуйте через час."
    except Exception as e:
        return f"⚠️ Ошибка AI: {str(e)}"


def check_grammar(text: str, lang: str = "ru") -> str:
    prompt = f"""
You are an English grammar teacher.
A student wrote: "{text}"

1. Is this sentence correct?
2. If not, write the corrected version.
3. Explain the mistake briefly. {_lang_instruction(lang)}

Format:
✅ Correct: [corrected sentence]
❌ Mistake: [what was wrong]
💡 Explanation: [short explanation]
"""
    return safe_generate(prompt)


def ask_tutor(question: str, lesson_context: str = None, lang: str = "ru") -> str:
    context = f"\nLesson context: {lesson_context}" if lesson_context else ""
    prompt = f"""
You are a friendly English language tutor for Tajik speakers.
{context}

Student's question: {question}

Answer clearly and simply. Use examples.
{_lang_instruction(lang)}
"""
    return safe_generate(prompt)


def analyze_screenshot(image_bytes: bytes, question: str = None, lang: str = "ru") -> str:
    import PIL.Image
    import io

    image = PIL.Image.open(io.BytesIO(image_bytes))
    user_question = question or "Please explain what you see in this image related to English learning."

    prompt = f"""
You are an English tutor. The student sent you a screenshot.
Question from student: {user_question}

Look at the image and:
1. Explain what you see
2. Answer the student's question
3. Give helpful tips related to English learning
Use simple language. {_lang_instruction(lang)}
"""
    return safe_generate(prompt, image)


def generate_quiz(lesson_content: str, lesson_title: str) -> list:
    prompt = f"""
You are creating a quiz for English learners based on this lesson.

Lesson title: {lesson_title}
Lesson content: {lesson_content}

Generate exactly 5 multiple choice questions.
Return ONLY valid JSON array, no extra text:

[
  {{
    "question": "...",
    "option_a": "...",
    "option_b": "...",
    "option_c": "...",
    "option_d": "...",
    "correct_answer": "a"
  }}
]
"""
    try:
        response = model.generate_content(prompt)
    except ResourceExhausted as e:
        raise QuotaExceeded("Gemini quota exhausted, try again later") from e
    text = response.text.strip()

    if "```json" in text:
        text = text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        text = text.split("```")[1].split("```")[0].strip()

    return json.loads(text)


def get_weak_topic_advice(weak_topics: list) -> str:
    if not weak_topics:
        return "Отлично! У тебя нет слабых тем. Продолжай в том же духе! 🎉"

    topics_str = ", ".join(weak_topics)
    prompt = f"""
A student is learning English and struggling with these topics: {topics_str}

Give them:
1. A short encouraging message
2. 2-3 specific tips to improve in these topics
3. A simple practice exercise for the hardest topic

Keep it friendly and motivating. Respond in Russian.
"""
    return safe_generate(prompt)