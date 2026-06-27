"""
Seeds ZaboniAI with 3 courses, 9 modules, 36 lessons of real bilingual
content, then calls POST /ai/generate-quiz/{lesson_id} against the
running backend (http://localhost:8000) to generate a 5-question quiz
for every lesson via Gemini.

Safe to re-run: skips courses that already exist by title.
"""
import sys
import time

import requests

from app.database import SessionLocal
from app import models

API_BASE = "http://localhost:8000"
SEED_USER = {"full_name": "Seed Bot", "email": "seedbot@example.com", "password": "seedbot123"}

COURSES = [
    {
        "title": "English for Beginners",
        "description": "Start your English journey: greetings, numbers, family, and everyday basics.",
        "level": "beginner",
        "modules": [
            {
                "title": "Greetings & Basics",
                "lessons": [
                    ("Greetings and Introductions", """## Приветствия / Greetings

**Hello** — Салом / Привет
**Good morning** — Доброе утро
**Good evening** — Добрый вечер
**How are you?** — Как дела?
**My name is...** — Меня зовут...
**Nice to meet you** — Приятно познакомиться

### Examples / Примеры:
- Hello! My name is Sara. Nice to meet you!
- Good morning! How are you? — I'm fine, thank you!
- Good evening! What is your name?

### Grammar note / Грамматика:
In English we always use a capital "I" (я).
Correct: I am a student. ✅
Wrong: i am a student. ❌"""),
                    ("Numbers 1-20", """## Числа / Numbers 1-20

one (1) — один, two (2) — два, three (3) — три, four (4) — четыре,
five (5) — пять, six (6) — шесть, seven (7) — семь, eight (8) — восемь,
nine (9) — девять, ten (10) — десять
eleven (11) — одиннадцать, twelve (12) — двенадцать, ... twenty (20) — двадцать

### Examples / Примеры:
- I have two brothers and one sister.
- She is twelve years old.
- There are twenty students in the class.

### Grammar note / Грамматика:
Numbers 13-19 end in "-teen": thirteen, fourteen, fifteen...
Be careful: "four" → "fourteen" (not "fourteen" with double t)."""),
                    ("Days of the Week", """## Дни недели / Days of the Week

Monday — понедельник, Tuesday — вторник, Wednesday — среда,
Thursday — четверг, Friday — пятница, Saturday — субботa, Sunday — воскресенье

### Examples / Примеры:
- Today is Monday. Tomorrow is Tuesday.
- I study English on Saturday and Sunday.
- My birthday is on Friday this year.

### Grammar note / Грамматика:
Days of the week are always written with a capital letter in English.
Correct: I work on Monday. ✅
Wrong: i work on monday. ❌"""),
                    ("Colors", """## Цвета / Colors

red — красный, blue — синий, green — зелёный, yellow — жёлтый,
black — чёрный, white — белый, orange — оранжевый, pink — розовый

### Examples / Примеры:
- My favorite color is blue.
- The sky is blue and the grass is green.
- She is wearing a red dress.

### Grammar note / Грамматика:
Colors can be adjectives (a red car) or nouns (I like red).
Word order: adjective always comes BEFORE the noun in English.
Correct: a red car ✅  Wrong: a car red ❌"""),
                ],
            },
            {
                "title": "Family & People",
                "lessons": [
                    ("Family Members", """## Члены семьи / Family Members

mother — мать, father — отец, sister — сестра, brother — брат,
grandmother — бабушка, grandfather — дедушка, son — сын, daughter — дочь

### Examples / Примеры:
- This is my mother and this is my father.
- I have one brother and two sisters.
- My grandmother lives with us.

### Grammar note / Грамматика:
Use "my / your / his / her" before family words to show ownership.
Correct: This is my sister. ✅
Wrong: This is sister. ❌"""),
                    ("Personal Pronouns", """## Личные местоимения / Personal Pronouns

I — я, you — ты/вы, he — он, she — она, it — оно, we — мы, they — они

### Examples / Примеры:
- I am a teacher. You are a student.
- He is from Tajikistan. She is from Russia.
- We are friends. They are classmates.

### Grammar note / Грамматика:
"He" is for males, "she" is for females, "it" is for objects/animals.
Correct: She is my friend. ✅
Wrong: He is my friend (talking about a woman). ❌"""),
                    ("To Be: am / is / are", """## Глагол "to be" / Verb "to be"

I **am** — я есть
He / She / It **is** — он/она/оно есть
You / We / They **are** — ты/мы/они есть

### Examples / Примеры:
- I am happy. He is tired. They are at home.
- Is she a doctor? Yes, she is.
- We are not late.

### Grammar note / Грамматика:
Never skip "to be" in English, even though it is often skipped in Tajik/Russian.
Correct: She is a teacher. ✅
Wrong: She a teacher. ❌"""),
                    ("Describing People", """## Описание людей / Describing People

tall — высокий, short — низкий, young — молодой, old — старый,
kind — добрый, friendly — дружелюбный, smart — умный

### Examples / Примеры:
- My teacher is tall and very kind.
- He is young, but he is very smart.
- She has a friendly smile.

### Grammar note / Грамматика:
Adjectives in English do NOT change for gender or number.
Correct: They are tall. ✅
Wrong: They are talls. ❌"""),
                ],
            },
            {
                "title": "Everyday Life",
                "lessons": [
                    ("Telling Time", """## Время / Telling Time

What time is it? — Сколько времени?
It's 3 o'clock — Сейчас 3 часа
half past — половина, quarter past — четверть после, quarter to — без четверти

### Examples / Примеры:
- It's nine o'clock in the morning.
- It's half past seven.
- The lesson starts at quarter to ten.

### Grammar note / Грамматика:
Use "at" with exact times: at 5 o'clock, at noon.
Correct: The class starts at 9. ✅
Wrong: The class starts in 9. ❌"""),
                    ("Daily Routine", """## Распорядок дня / Daily Routine

wake up — просыпаться, get up — встать, have breakfast — завтракать,
go to work/school — идти на работу/учёбу, go to bed — ложиться спать

### Examples / Примеры:
- I wake up at 7 a.m. every day.
- She has breakfast and then goes to school.
- We go to bed at 10 p.m.

### Grammar note / Грамматика:
With daily routines we use Present Simple and add "-s" for he/she/it.
Correct: He wakes up early. ✅
Wrong: He wake up early. ❌"""),
                    ("Food and Drinks", """## Еда и напитки / Food and Drinks

bread — хлеб, rice — рис, meat — мясо, vegetables — овощи,
water — вода, tea — чай, juice — сок

### Examples / Примеры:
- I would like some tea, please.
- We usually eat rice with meat and vegetables.
- Can I have a glass of water?

### Grammar note / Грамматика:
Use "some" in offers/requests and positive sentences, "any" in questions/negatives.
Correct: Do you have any bread? ✅
Wrong: Do you have some bread (in a question)? — less natural."""),
                    ("At the Market", """## На рынке / At the Market

How much is it? — Сколько это стоит?
It costs... — Это стоит...
expensive — дорогой, cheap — дешёвый, kilogram — килограмм

### Examples / Примеры:
- How much is one kilogram of apples?
- This is too expensive. Do you have something cheaper?
- I'll take two kilograms of rice, please.

### Grammar note / Грамматика:
Use "How much" for uncountable nouns (rice, water) and "How many" for countable ones (apples, eggs).
Correct: How much rice do you need? ✅"""),
                ],
            },
        ],
    },
    {
        "title": "English Grammar",
        "description": "Master the tenses, modal verbs, and articles that form the backbone of English.",
        "level": "elementary",
        "modules": [
            {
                "title": "Present Tenses",
                "lessons": [
                    ("Present Simple", """## Present Simple

Formula / Формула: Subject + verb (+s for he/she/it)

### Examples / Примеры:
- I work every day. She works every day.
- They live in Dushanbe.
- Do you speak English? — Yes, I do.

### Grammar note / Грамматика:
Used for habits, facts, and routines.
Don't forget "-s" with he/she/it: he plays, she goes, it works.
Wrong: she go to school. ❌  Correct: she goes to school. ✅"""),
                    ("Present Continuous", """## Present Continuous

Formula / Формула: am/is/are + verb-ing

### Examples / Примеры:
- I am studying English right now.
- She is cooking dinner at the moment.
- They are watching a movie.

### Grammar note / Грамматика:
Used for actions happening right now, "at this moment".
Signal words: now, right now, at the moment, currently.
Wrong: I am study now. ❌  Correct: I am studying now. ✅"""),
                    ("Present Simple vs Continuous", """## Present Simple vs Continuous

Simple = habits / facts. Continuous = happening right now.

### Examples / Примеры:
- I usually drink tea, but now I am drinking coffee.
- She works at a bank. Right now she is working on a report.
- Water boils at 100°C. (fact → Simple)

### Grammar note / Грамматика:
Stative verbs (know, like, want, believe) are NOT usually used in continuous form.
Wrong: I am knowing the answer. ❌  Correct: I know the answer. ✅"""),
                    ("Questions in Present Tense", """## Вопросы в Present Tense / Questions

Yes/No: Do/Does + subject + verb?
Wh-questions: What/Where/When/Why + do/does + subject + verb?

### Examples / Примеры:
- Do you like tea? — Yes, I do.
- Does she work on Sundays? — No, she doesn't.
- Where do you live? What time does the lesson start?

### Grammar note / Грамматика:
Use "does" (not "do") with he/she/it, and the main verb loses its "-s".
Wrong: Does she works? ❌  Correct: Does she work? ✅"""),
                ],
            },
            {
                "title": "Past Tenses",
                "lessons": [
                    ("Past Simple: Regular Verbs", """## Past Simple — Regular Verbs

Formula / Формула: verb + -ed

### Examples / Примеры:
- I worked yesterday. She studied last night.
- We watched a film two days ago.
- Did you visit your grandmother last week?

### Grammar note / Грамматика:
Most regular verbs just add "-ed": play→played, work→worked.
If a verb ends in "y" after a consonant, change "y" to "i": study→studied.
Wrong: I studyed. ❌  Correct: I studied. ✅"""),
                    ("Past Simple: Irregular Verbs", """## Past Simple — Irregular Verbs

These verbs do NOT follow the "-ed" rule and must be memorized.

go → went, see → saw, have → had, eat → ate, go → went, take → took

### Examples / Примеры:
- I went to the market yesterday.
- She saw her friend at the cinema.
- We had a great time last weekend.

### Grammar note / Грамматика:
Negative and question forms still use "did" + base verb, not the irregular past form.
Wrong: Did you went? ❌  Correct: Did you go? ✅"""),
                    ("Past Continuous", """## Past Continuous

Formula / Формула: was/were + verb-ing

### Examples / Примеры:
- I was reading a book when you called.
- They were playing football at 5 p.m. yesterday.
- What were you doing last night?

### Grammar note / Грамматика:
Often used with "when" or "while" to show an interrupted action.
Wrong: I was reading when you was calling. ❌
Correct: I was reading when you called. ✅"""),
                    ("Used to", """## "Used to" + verb

Formula / Формула: used to + base verb — talks about past habits that are now finished.

### Examples / Примеры:
- I used to play football every weekend.
- She used to live in Khujand.
- Did you use to smoke? — No, I never did.

### Grammar note / Грамматика:
In questions and negatives, drop "-d": did you use to..., I didn't use to...
Wrong: I didn't used to smoke. ❌  Correct: I didn't use to smoke. ✅"""),
                ],
            },
            {
                "title": "Future & Modals",
                "lessons": [
                    ("Future with 'will'", """## Future with "will"

Formula / Формула: will + base verb — predictions, promises, decisions.

### Examples / Примеры:
- I think it will rain tomorrow.
- I will help you with your homework.
- She will call you later.

### Grammar note / Грамматика:
"Will" never changes form, no matter the subject.
Wrong: She wills call. ❌  Correct: She will call. ✅"""),
                    ("Future with 'going to'", """## Future with "going to"

Formula / Формула: am/is/are + going to + base verb — plans already decided.

### Examples / Примеры:
- I am going to study medicine next year.
- We are going to visit our relatives this weekend.
- Is he going to join us?

### Grammar note / Грамматика:
Use "going to" for plans already made; use "will" for spontaneous decisions.
"I'll have the soup" (decided now) vs "I'm going to study abroad" (already planned)."""),
                    ("Modal Verbs: can, must, should", """## Модальные глаголы / Modal Verbs

can — может (ability), must — должен (obligation), should — следует (advice)

### Examples / Примеры:
- I can speak three languages.
- You must wear a seatbelt in the car.
- You should study every day to improve.

### Grammar note / Грамматика:
Modal verbs are followed by the base verb, with no "to" and no "-s".
Wrong: She cans speak English. ❌  Correct: She can speak English. ✅"""),
                    ("Articles: a / an / the", """## Артикли / Articles a, an, the

"a" before consonant sounds, "an" before vowel sounds, "the" for specific things.

### Examples / Примеры:
- I saw a dog and an elephant at the zoo.
- The book on the table is mine.
- She is a doctor. The doctor I saw yesterday was kind.

### Grammar note / Грамматика:
Use "an" based on SOUND, not spelling: "an hour" (silent h), but "a university" (sounds like "y")."""),
                ],
            },
        ],
    },
    {
        "title": "Spoken English",
        "description": "Practical conversation skills for travel, work, and everyday social situations.",
        "level": "intermediate",
        "modules": [
            {
                "title": "Conversations",
                "lessons": [
                    ("Small Talk", """## Small Talk / Лёгкая беседа

How's it going? — Как дела?
Nice weather, isn't it? — Хорошая погода, не так ли?
What do you do? — Чем вы занимаетесь?

### Examples / Примеры:
- A: How's it going? B: Pretty good, thanks. And you?
- Nice weather today, isn't it? Perfect for a walk.
- So, what do you do for a living?

### Grammar note / Грамматика:
Tag questions ("isn't it?", "don't you?") invite the listener to respond — great for keeping small talk flowing."""),
                    ("Asking for Directions", """## Спросить дорогу / Asking for Directions

Excuse me, where is the...? — Простите, где находится...?
Turn left/right — Поверните налево/направо
Go straight ahead — Идите прямо

### Examples / Примеры:
- Excuse me, where is the nearest bank?
- Go straight ahead, then turn left at the corner.
- It's about five minutes from here, on your right.

### Grammar note / Грамматика:
Directions use imperative verbs (commands without a subject): Turn, Go, Walk, Cross."""),
                    ("Ordering Food at a Restaurant", """## Заказ еды в ресторане / Ordering Food

Could I have the menu, please? — Можно меню, пожалуйста?
I'd like to order... — Я хотел(а) бы заказать...
Could we have the bill, please? — Можно счёт, пожалуйста?

### Examples / Примеры:
- Could I have the menu, please?
- I'd like to order the grilled chicken with rice.
- Could we have the bill, please? It was delicious.

### Grammar note / Грамматика:
"Could I / Could we" is more polite than "Can I / Can we" in formal situations like restaurants."""),
                    ("Making Phone Calls", """## Телефонные звонки / Making Phone Calls

Hello, this is... — Алло, это...
Could I speak to...? — Можно поговорить с...?
Can I take a message? — Могу я передать сообщение?

### Examples / Примеры:
- Hello, this is Aziz. Could I speak to Mr. Karimov, please?
- I'm sorry, he's not available right now. Can I take a message?
- Sure, please ask him to call me back.

### Grammar note / Грамматика:
On the phone we say "This is..." (not "I am...") to introduce ourselves."""),
                ],
            },
            {
                "title": "Travel English",
                "lessons": [
                    ("At the Airport", """## В аэропорту / At the Airport

boarding pass — посадочный талон, check-in — регистрация, gate — выход на посадку

### Examples / Примеры:
- Where is the check-in counter for this flight?
- What gate does the flight leave from?
- I need to check in my luggage.

### Grammar note / Грамматика:
"Leave from" + place describes departure point: "The flight leaves from gate 12."."""),
                    ("Hotel Check-in", """## Заселение в отель / Hotel Check-in

I have a reservation — У меня есть бронь
Could I see your ID, please? — Можно ваш документ, пожалуйста?
What time is check-out? — Когда нужно выехать?

### Examples / Примеры:
- Hello, I have a reservation under the name Karimova.
- Could I see your passport, please?
- What time is check-out tomorrow?

### Grammar note / Грамматика:
"Under the name..." is the standard phrase for reservations: "a reservation under the name..."."""),
                    ("Shopping", """## Покупки / Shopping

Can I try this on? — Можно это примерить?
Do you have a smaller/larger size? — У вас есть размер меньше/больше?
I'll take it — Я возьму это

### Examples / Примеры:
- Can I try this jacket on?
- Do you have a larger size in blue?
- It fits perfectly. I'll take it.

### Grammar note / Грамматика:
"Try on" is a separable phrasal verb: "try it on" (not "try on it")."""),
                    ("Emergencies", """## Чрезвычайные ситуации / Emergencies

Help! — Помогите!
I need a doctor — Мне нужен врач
Call an ambulance — Вызовите скорую

### Examples / Примеры:
- Help! Someone is hurt!
- I need a doctor immediately.
- Please call an ambulance, it's an emergency.

### Grammar note / Грамматика:
In emergencies, imperative sentences are short and direct on purpose — clarity matters more than politeness."""),
                ],
            },
            {
                "title": "Work & Social",
                "lessons": [
                    ("Job Interview Phrases", """## Фразы для собеседования / Job Interview Phrases

Tell me about yourself — Расскажите о себе
What are your strengths? — Какие ваши сильные стороны?
Why do you want this job? — Почему вы хотите эту работу?

### Examples / Примеры:
- I have three years of experience in marketing.
- My main strength is problem-solving under pressure.
- I want this job because it matches my long-term goals.

### Grammar note / Грамматика:
Use Present Perfect for experience: "I have worked..." not "I worked..." when the time isn't specified."""),
                    ("Writing Emails", """## Деловые письма / Writing Emails

Dear Mr./Ms. ... — Уважаемый/ая...
I am writing to... — Пишу вам, чтобы...
Looking forward to your reply — Жду вашего ответа

### Examples / Примеры:
- Dear Ms. Saidova, I am writing to confirm our meeting on Friday.
- Please let me know if this time works for you.
- Looking forward to your reply. Best regards, Aziz.

### Grammar note / Грамматика:
Formal emails avoid contractions: write "I am" not "I'm", "do not" not "don't"."""),
                    ("Idioms and Expressions", """## Идиомы и выражения / Idioms

break the ice — растопить лёд (начать разговор)
piece of cake — проще простого
under the weather — неважно себя чувствовать

### Examples / Примеры:
- He told a joke to break the ice at the meeting.
- Don't worry, this test is a piece of cake.
- I'm feeling a bit under the weather today.

### Grammar note / Грамматика:
Idioms are fixed expressions — don't translate them word by word, learn the whole phrase."""),
                    ("Giving Opinions", """## Выражение мнения / Giving Opinions

In my opinion... — По моему мнению...
I think that... — Я думаю, что...
I completely agree/disagree — Я полностью согласен/не согласен

### Examples / Примеры:
- In my opinion, learning English opens many doors.
- I think that practice is more important than theory.
- I completely agree with you on that point.

### Grammar note / Грамматика:
After "I think that" and "In my opinion", use a full sentence with subject + verb."""),
                ],
            },
        ],
    },
]


def seed_courses_modules_lessons(db):
    lesson_ids = []
    for c_idx, course_data in enumerate(COURSES, start=1):
        existing = db.query(models.Course).filter(models.Course.title == course_data["title"]).first()
        if existing:
            print(f"Course already exists, skipping: {course_data['title']}")
            continue

        course = models.Course(
            title=course_data["title"],
            description=course_data["description"],
            level=course_data["level"],
        )
        db.add(course)
        db.commit()
        db.refresh(course)
        print(f"Created course: {course.title} (id={course.id})")

        for m_idx, module_data in enumerate(course_data["modules"], start=1):
            module = models.Module(course_id=course.id, title=module_data["title"], order=m_idx)
            db.add(module)
            db.commit()
            db.refresh(module)
            print(f"  Created module: {module.title} (id={module.id})")

            for l_idx, (title, content) in enumerate(module_data["lessons"], start=1):
                lesson = models.Lesson(module_id=module.id, title=title, content=content, order=l_idx)
                db.add(lesson)
                db.commit()
                db.refresh(lesson)
                lesson_ids.append(lesson.id)
                print(f"    Created lesson: {lesson.title} (id={lesson.id})")

    return lesson_ids


def get_auth_token():
    requests.post(f"{API_BASE}/auth/register", json=SEED_USER)
    res = requests.post(
        f"{API_BASE}/auth/login",
        json={"email": SEED_USER["email"], "password": SEED_USER["password"]},
    )
    res.raise_for_status()
    return res.json()["access_token"]


def generate_quizzes(lesson_ids, token, max_retries=4):
    headers = {"Authorization": f"Bearer {token}"}
    ok, failed = 0, []
    for lesson_id in lesson_ids:
        for attempt in range(1, max_retries + 1):
            try:
                res = requests.post(f"{API_BASE}/ai/generate-quiz/{lesson_id}", headers=headers, timeout=60)
                if res.status_code == 200:
                    ok += 1
                    print(f"Quiz generated for lesson {lesson_id} (attempt {attempt})")
                    break
                if attempt == max_retries:
                    failed.append((lesson_id, res.status_code, res.text[:200]))
                    print(f"Quiz FAILED for lesson {lesson_id}: {res.status_code} {res.text[:200]}")
                else:
                    wait = 15 * attempt
                    print(f"Lesson {lesson_id} attempt {attempt} failed ({res.status_code}), retrying in {wait}s...")
                    time.sleep(wait)
            except Exception as e:
                if attempt == max_retries:
                    failed.append((lesson_id, "exception", str(e)[:200]))
                    print(f"Quiz FAILED for lesson {lesson_id}: {e}")
                else:
                    time.sleep(15 * attempt)
        time.sleep(3)
    return ok, failed


if __name__ == "__main__":
    db = SessionLocal()
    try:
        lesson_ids = seed_courses_modules_lessons(db)
    finally:
        db.close()

    if not lesson_ids:
        print("No new lessons created (already seeded). Generating quizzes for ALL existing lessons without one.")
        db = SessionLocal()
        try:
            lesson_ids = [
                l.id
                for l in db.query(models.Lesson).all()
                if not db.query(models.QuizQuestion).filter(models.QuizQuestion.lesson_id == l.id).first()
            ]
        finally:
            db.close()

    print(f"\nGenerating AI quizzes for {len(lesson_ids)} lessons via {API_BASE} ...")
    token = get_auth_token()
    ok, failed = generate_quizzes(lesson_ids, token)
    print(f"\nDone. Quizzes generated: {ok}/{len(lesson_ids)}")
    if failed:
        print("Failed lessons:", failed)
        sys.exit(1)
