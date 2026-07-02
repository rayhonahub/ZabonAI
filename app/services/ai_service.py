import google.generativeai as genai
from dotenv import load_dotenv
import os
import json
import time

load_dotenv()

LANGUAGE_NAMES = {
    "ru": "Russian",
    "tj": "Tajik",
    "en": "English",
}


def _lang_instruction(lang: str) -> str:
    name = LANGUAGE_NAMES.get(lang, "Tajik")
    return f"Explain in {name}."


class QuotaExceeded(Exception):
    pass


def get_api_keys():
    """Collect all available Gemini API keys, numbered keys first, then the fallback."""
    keys = []
    for i in range(1, 10):
        key = os.getenv(f"GEMINI_API_KEY_{i}")
        if key and key != "your_key_here":
            keys.append(key)
    main_key = os.getenv("GEMINI_API_KEY")
    if main_key and main_key != "your_key_here" and main_key not in keys:
        keys.append(main_key)
    return keys


API_KEYS = get_api_keys()
_current_key_index = 0
model = None


def get_model():
    global model, _current_key_index
    if not API_KEYS:
        raise Exception("Ягон GEMINI_API_KEY дар .env нест")
    key = API_KEYS[_current_key_index % len(API_KEYS)]
    genai.configure(api_key=key)
    model = genai.GenerativeModel("gemini-2.0-flash-lite")
    return model


def rotate_key():
    global _current_key_index
    _current_key_index = (_current_key_index + 1) % len(API_KEYS)
    print(f"Rotating to API key #{_current_key_index + 1}")


def safe_generate(prompt, image=None, max_retries=None) -> str:
    """Generate content with automatic key rotation when a key's quota is exceeded."""
    if max_retries is None:
        max_retries = len(API_KEYS) if API_KEYS else 1

    for attempt in range(max_retries):
        try:
            m = get_model()
            if image is not None:
                response = m.generate_content([prompt, image])
            else:
                response = m.generate_content(prompt)
            return response.text
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "quota" in error_str.lower() or "RESOURCE_EXHAUSTED" in error_str:
                print(f"Key #{_current_key_index + 1} quota exceeded, rotating...")
                rotate_key()
                time.sleep(1)
            else:
                return f"⚠️ Хатогии AI: {error_str}"

    return "⚠️ AI ҳоло банд аст. Лимити дархостҳо тамом шуд. Баъдтар кӯшиш кунед."


try:
    model = get_model()
except Exception:
    model = None


def check_grammar(text: str, lang: str = "tj") -> str:
    prompt = f"""
CRITICAL: Respond in TAJIK language only. Never use Russian.
You are an English grammar teacher for Tajik speakers.
Student wrote: "{text}"

Format response:
✅ Дуруст: [corrected sentence]
❌ Хато: [what was wrong]
💡 Тавзеҳ: [short explanation in Tajik]
"""
    return safe_generate(prompt)


def ask_tutor(question: str, lesson_context: str = None, lang: str = "tj") -> str:
    context = f"\nДарс: {lesson_context}" if lesson_context else ""
    prompt = f"""
CRITICAL: Respond in TAJIK language only. Never use Russian.
You are a friendly English tutor for Tajik speakers.
{context}
Question: {question}
Answer clearly with examples. Explain in Tajik only.
"""
    return safe_generate(prompt)


def analyze_screenshot(image_bytes: bytes, question: str = None, lang: str = "tj") -> str:
    import PIL.Image
    import io

    image = PIL.Image.open(io.BytesIO(image_bytes))
    user_question = question or "Лутфан тасвирро шарҳ диҳед."
    prompt = f"""
CRITICAL: Respond in TAJIK language only. Never use Russian.
You are an English tutor. Student sent a screenshot.
Question: {user_question}
Explain what you see and help the student. Use Tajik language only.
"""
    return safe_generate(prompt, image=image)


def generate_quiz(lesson_content: str, lesson_title: str) -> list:
    prompt = f"""
Create a quiz for English learners based on this lesson.
Title: {lesson_title}
Content: {lesson_content}

Generate exactly 5 multiple choice questions.
Return ONLY valid JSON array:
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
    text = safe_generate(prompt)
    try:
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        return json.loads(text)
    except Exception:
        return []


def get_weak_topic_advice(weak_topics: list) -> str:
    if not weak_topics:
        return "Аъло! Мавзӯи заиф надорӣ! Давом деҳ! 🎉"
    topics_str = ", ".join(weak_topics)
    prompt = f"""
CRITICAL: Respond in TAJIK language only. Never use Russian.
Student struggles with: {topics_str}
Give encouraging advice and 2-3 tips in Tajik language only.
"""
    return safe_generate(prompt)


def generate_word_examples(word: str, translation: str) -> list:
    prompt = f"""
CRITICAL: All Tajik translations must be in TAJIK language only. Never Russian.
Word: "{word}" (Tajik: {translation})
Generate 3 practical example sentences.
Return ONLY valid JSON:
[
  {{"english": "sentence", "tajik": "тарҷума ба тоҷикӣ"}},
  {{"english": "sentence", "tajik": "тарҷума ба тоҷикӣ"}},
  {{"english": "sentence", "tajik": "тарҷума ба тоҷикӣ"}}
]
"""
    text = safe_generate(prompt)
    try:
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        return json.loads(text)
    except Exception:
        return [
            {"english": f"I use {word} every day.", "tajik": f"Ман ҳар рӯз {translation} истифода мекунам."},
            {"english": f"She likes {word}.", "tajik": f"Ӯ {translation}-ро дӯст медорад."},
            {"english": f"This is a {word}.", "tajik": f"Ин {translation} аст."}
        ]


def generate_personal_story(user_level: str, known_words: list) -> dict:
    known_str = ", ".join(known_words[:15]) if known_words else "hello, school, friend, water, home"

    level_guide = {
        "beginner": "very simple A1 sentences, max 8 words each",
        "elementary": "simple A2 sentences with variety",
        "intermediate": "natural B1 sentences",
        "advanced": "natural B2 English"
    }.get(user_level, "simple A1 sentences")

    prompt = f"""
Write a short English story for a Tajik student learning English.

Requirements:
- Level: {level_guide}
- Use these known words naturally: {known_str}
- Add exactly 5 NEW vocabulary words, mark them like **word**
- Story length: 150-200 words
- Topic: interesting daily life story (school, friendship, travel, adventure)
- Write the FULL story in English only

Return ONLY this JSON:
{{
  "title_en": "Story title",
  "title_tj": "Номи ҳикоя ба тоҷикӣ",
  "story": "Full English story with **new_words** marked in bold",
  "new_words": [
    {{"word": "word1", "translation_tj": "тарҷума1", "phonetic": "/fəˈnetɪk/"}},
    {{"word": "word2", "translation_tj": "тарҷума2", "phonetic": "/fəˈnetɪk/"}},
    {{"word": "word3", "translation_tj": "тарҷума3", "phonetic": "/fəˈnetɪk/"}},
    {{"word": "word4", "translation_tj": "тарҷума4", "phonetic": "/fəˈnetɪk/"}},
    {{"word": "word5", "translation_tj": "тарҷума5", "phonetic": "/fəˈnetɪk/"}}
  ],
  "comprehension_questions": [
    {{"question_tj": "Савол ба тоҷикӣ?", "answer": "English answer"}},
    {{"question_tj": "Савол ба тоҷикӣ?", "answer": "English answer"}},
    {{"question_tj": "Савол ба тоҷикӣ?", "answer": "English answer"}}
  ]
}}
"""
    text = safe_generate(prompt)
    try:
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        return json.loads(text)
    except Exception:
        return {
            "title_en": "Sara's English Day",
            "title_tj": "Рӯзи англисии Сара",
            "story": "Sara wakes up early every morning. She goes to school with her friend Ali. They study **English** together in class. Their teacher is very **kind** and **patient**. Sara learns new **vocabulary** every day. She practices speaking and writing. Sara is very **proud** of her progress. One day she will speak English perfectly!",
            "new_words": [
                {"word": "kind", "translation_tj": "меҳрубон", "phonetic": "/kaɪnd/"},
                {"word": "patient", "translation_tj": "сабурона", "phonetic": "/ˈpeɪʃənt/"},
                {"word": "vocabulary", "translation_tj": "луғат", "phonetic": "/vəˈkæbjəleri/"},
                {"word": "proud", "translation_tj": "ифтихордор", "phonetic": "/praʊd/"},
                {"word": "progress", "translation_tj": "пешрафт", "phonetic": "/ˈprɒɡres/"}
            ],
            "comprehension_questions": [
                {"question_tj": "Сара бо кӣ ба мактаб меравад?", "answer": "Ali"},
                {"question_tj": "Муаллими онҳо чӣ гуна аст?", "answer": "Kind and patient"},
                {"question_tj": "Сара ҳар рӯз чӣ меомӯзад?", "answer": "New vocabulary"}
            ]
        }


def chat_about_story(story_text: str, user_message: str, chat_history: list = None) -> str:
    """AI discusses the story with the user"""
    history_text = ""
    if chat_history:
        for h in chat_history[-4:]:
            role = "Донишҷӯ" if h["role"] == "user" else "AI"
            history_text += f"{role}: {h['content']}\n"

    prompt = f"""
CRITICAL: Respond in TAJIK language only. Never use Russian.
You are a friendly English teacher discussing a story with a Tajik student.

Story: {story_text[:500]}

Previous conversation:
{history_text}

Student asks: {user_message}

Help the student understand the story. Explain vocabulary, grammar, or plot in Tajik.
Keep response concise (2-4 sentences). Be encouraging and helpful.
"""
    return safe_generate(prompt)
