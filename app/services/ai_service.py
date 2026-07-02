import google.generativeai as genai
from dotenv import load_dotenv
import os
import json
import time
from threading import Lock

load_dotenv(override=True)


class QuotaExceeded(Exception):
    pass


class GeminiKeyRotator:
    def __init__(self):
        self.keys = self._load_keys()
        self.current_index = 0
        self.lock = Lock()
        self.exhausted_keys = set()
        print(f"[AI] Loaded {len(self.keys)} Gemini API keys")

    def _load_keys(self):
        keys = []
        for i in range(1, 20):
            k = os.getenv(f"GEMINI_API_KEY_{i}")
            if k and k.strip() and k != "your_key_here":
                keys.append(k.strip())
        main = os.getenv("GEMINI_API_KEY")
        if main and main.strip() and main != "your_key_here" and main not in keys:
            keys.append(main.strip())
        return keys

    def get_current_key(self):
        if not self.keys:
            raise Exception("Ягон GEMINI_API_KEY дар .env нест!")
        return self.keys[self.current_index % len(self.keys)]

    def rotate(self):
        with self.lock:
            self.exhausted_keys.add(self.current_index)
            if len(self.exhausted_keys) >= len(self.keys):
                self.exhausted_keys.clear()
                print("[AI] All keys exhausted, resetting...")
            self.current_index = (self.current_index + 1) % len(self.keys)
            print(f"[AI] Rotated to key #{self.current_index + 1}")

    def generate(self, prompt, image=None, retries=None):
        if retries is None:
            retries = max(len(self.keys), 1)

        for attempt in range(retries):
            try:
                key = self.get_current_key()
                genai.configure(api_key=key)
                m = genai.GenerativeModel("gemini-2.0-flash-lite")
                if image:
                    resp = m.generate_content([prompt, image])
                else:
                    resp = m.generate_content(prompt)
                return resp.text
            except Exception as e:
                err = str(e)
                if any(x in err for x in ["429", "quota", "RESOURCE_EXHAUSTED", "exhausted"]):
                    print(f"[AI] Key #{self.current_index + 1} quota exceeded (attempt {attempt+1})")
                    self.rotate()
                    time.sleep(0.5)
                    continue
                else:
                    print(f"[AI] Error: {err[:100]}")
                    return f"⚠️ Хатогии AI: {err[:200]}"

        return "⚠️ Ҳамаи калидҳои AI лимит шуданд. Каме интизор шавед ва боз кӯшиш кунед."


# Global rotator instance
rotator = GeminiKeyRotator()

# Backward compat
model = None


def safe_generate(prompt, image=None):
    return rotator.generate(prompt, image=image)


def check_grammar(text: str, lang: str = "tj") -> str:
    prompt = f"""CRITICAL: Use TAJIK language only for explanations. Never Russian.
You are an English grammar teacher for Tajik speakers.
Student wrote: "{text}"

Respond exactly like this:
✅ Дуруст: [corrected sentence]
❌ Хато: [what was wrong in English]
💡 Тавзеҳ: [explanation in Tajik only]"""
    return safe_generate(prompt)


def ask_tutor(question: str, lesson_context: str = None, lang: str = "tj") -> str:
    context = f"\nLesson: {lesson_context}" if lesson_context else ""
    prompt = f"""CRITICAL: Explain in TAJIK language only. Never Russian.
You are a friendly English tutor for Tajik speakers.{context}
Question: {question}
Answer with examples. Tajik explanations only."""
    return safe_generate(prompt)


def analyze_screenshot(image_bytes: bytes, question: str = None, lang: str = "tj") -> str:
    import PIL.Image, io
    image = PIL.Image.open(io.BytesIO(image_bytes))
    q = question or "Лутфан тасвирро шарҳ диҳед."
    prompt = f"""CRITICAL: Respond in TAJIK only. Never Russian.
Student sent a screenshot. Question: {q}
Explain what you see and help the student learn English. Use Tajik."""
    return safe_generate(prompt, image=image)


def generate_quiz(lesson_content: str, lesson_title: str) -> list:
    prompt = f"""Create 5 multiple choice quiz questions for English learners.
Lesson: {lesson_title}
Content: {lesson_content[:800]}

Return ONLY valid JSON array, no extra text:
[{{"question":"...","option_a":"...","option_b":"...","option_c":"...","option_d":"...","correct_answer":"a"}}]"""
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
    prompt = f"""CRITICAL: Respond in TAJIK language only. Never Russian.
Student struggles with: {', '.join(weak_topics)}
Give warm encouragement and 3 specific tips in Tajik to improve these topics."""
    return safe_generate(prompt)


def generate_word_examples(word: str, translation: str) -> list:
    prompt = f"""CRITICAL: All translations in TAJIK only. Never Russian.
Word: "{word}" (Tajik: {translation})
Generate 3 practical real-life example sentences.
Return ONLY JSON:
[
  {{"english": "natural sentence with {word}", "tajik": "тарҷумаи тоҷикӣ"}},
  {{"english": "different context sentence", "tajik": "тарҷумаи тоҷикӣ"}},
  {{"english": "third practical sentence", "tajik": "тарҷумаи тоҷикӣ"}}
]"""
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
            {"english": f"She has a {word}.", "tajik": f"Ӯ {translation} дорад."},
            {"english": f"The {word} is important.", "tajik": f"{translation} муҳим аст."}
        ]


def generate_personal_story(user_level: str, known_words: list) -> dict:
    known_str = ", ".join(known_words[:12]) if known_words else "hello, school, friend, water, home, teacher"
    level_guide = {
        "beginner": "A1 level - very simple short sentences max 8 words each",
        "elementary": "A2 level - simple sentences with some variety",
        "intermediate": "B1 level - natural flowing sentences",
        "advanced": "B2 level - varied complex structures"
    }.get(user_level, "A1 level simple sentences")

    prompt = f"""Write a short English story for a Tajik student.
Level: {level_guide}
Use these words: {known_str}
Add exactly 5 NEW words marked as **word**
Length: 150-200 words. Interesting topic: school, friendship, travel or adventure.

Return ONLY this JSON:
{{
  "title_en": "Story Title",
  "title_tj": "Номи ҳикоя",
  "story": "Full English story here with **new** words marked",
  "new_words": [
    {{"word": "w1", "translation_tj": "тарҷума", "phonetic": "/fəˈnetɪk/"}},
    {{"word": "w2", "translation_tj": "тарҷума", "phonetic": "/fəˈnetɪk/"}},
    {{"word": "w3", "translation_tj": "тарҷума", "phonetic": "/fəˈnetɪk/"}},
    {{"word": "w4", "translation_tj": "тарҷума", "phonetic": "/fəˈnetɪk/"}},
    {{"word": "w5", "translation_tj": "тарҷума", "phonetic": "/fəˈnetɪk/"}}
  ],
  "comprehension_questions": [
    {{"question_tj": "Савол?", "answer": "Answer"}},
    {{"question_tj": "Савол?", "answer": "Answer"}},
    {{"question_tj": "Савол?", "answer": "Answer"}}
  ]
}}"""
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
            "story": "Sara wakes up early every morning. She goes to school with her friend Ali. They study **English** together. Their teacher is **kind** and **patient**. Sara learns new **vocabulary** every day. She feels very **proud** of her progress.",
            "new_words": [
                {"word": "kind", "translation_tj": "меҳрубон", "phonetic": "/kaɪnd/"},
                {"word": "patient", "translation_tj": "сабурона", "phonetic": "/ˈpeɪʃənt/"},
                {"word": "vocabulary", "translation_tj": "луғат", "phonetic": "/vəˈkæbjəleri/"},
                {"word": "proud", "translation_tj": "ифтихордор", "phonetic": "/praʊd/"},
                {"word": "progress", "translation_tj": "пешрафт", "phonetic": "/ˈprɒɡres/"}
            ],
            "comprehension_questions": [
                {"question_tj": "Сара бо кӣ ба мактаб меравад?", "answer": "Ali"},
                {"question_tj": "Муаллим чӣ гуна аст?", "answer": "Kind and patient"},
                {"question_tj": "Сара чӣ ҳис мекунад?", "answer": "Proud"}
            ]
        }


def chat_about_story(story_text: str, user_message: str, chat_history: list = None) -> str:
    history_text = ""
    if chat_history:
        for h in (chat_history or [])[-4:]:
            role = "Донишҷӯ" if h.get("role") == "user" else "AI"
            history_text += f"{role}: {h.get('content', '')}\n"
    prompt = f"""CRITICAL: Respond in TAJIK language only. Never Russian.
You are a helpful English teacher discussing a story with a Tajik student.
Story: {story_text[:400]}
{f'Previous chat:{chr(10)}{history_text}' if history_text else ''}
Student: {user_message}
Help understand the story. Explain in Tajik. Be brief (2-3 sentences) and encouraging."""
    return safe_generate(prompt)


def pronunciation_check(target: str, user_said: str) -> dict:
    prompt = f"""CRITICAL: Respond in TAJIK language only. Never Russian.
English pronunciation teacher for Tajik speakers.
Target: "{target}"
Student said: "{user_said}"

Return ONLY JSON:
{{
  "similarity_score": 85,
  "is_correct": true,
  "feedback_tj": "Баҳои талаффуз ба тоҷикӣ",
  "specific_errors": [],
  "encouragement_tj": "Ташвиқ ба тоҷикӣ"
}}"""
    text = safe_generate(prompt)
    try:
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        return json.loads(text)
    except Exception:
        return {
            "similarity_score": 75,
            "is_correct": False,
            "feedback_tj": "Боз кӯшиш кунед!",
            "specific_errors": [],
            "encouragement_tj": "Ташвиш нашавед, давом диҳед!"
        }
