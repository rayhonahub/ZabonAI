"""
Seeds ZaboniAI with the "properly organized" curriculum: 3 courses, 9
modules, 28 lessons, each with real bilingual (Russian/Tajik) content,
8-10 vocabulary words, a grammar note, and 2-3 example sentences.

Then calls POST /ai/generate-quiz/{lesson_id} against the running
backend (http://localhost:8000) for every lesson that doesn't have a
quiz yet. Gemini's free tier has a DAILY quota (not per-minute), so on
429 ResourceExhausted this stops immediately instead of retrying --
just re-run this script tomorrow (or after upgrading the plan) and it
will pick up exactly where it left off.

Safe to re-run: skips courses that already exist by title.
"""
import sys

import requests

from app.database import SessionLocal
from app import models

API_BASE = "http://localhost:8000"
SEED_USER = {"full_name": "Curriculum Bot", "email": "curriculumbot@example.com", "password": "seedbot123"}

COURSES = [
    {
        "title": "English for Absolute Beginners",
        "description": "Your very first steps in English: greetings, numbers, family, home, and everyday life.",
        "level": "beginner",
        "modules": [
            {
                "title": "First Words",
                "lessons": [
                    ("Hello & Goodbye", """## Приветствие и прощание / Hello & Goodbye

**Hello** — Привет
**Hi** — Привет (неформально)
**Good morning** — Доброе утро
**Good afternoon** — Добрый день
**Good evening** — Добрый вечер
**Goodbye** — До свидания
**Bye** — Пока
**See you later** — Увидимся позже
**Nice to meet you** — Приятно познакомиться
**My name is...** — Меня зовут...

### Examples / Примеры:
- Hello! My name is Anna. Nice to meet you!
- Good morning! See you later!
- Bye! Have a good day!

### Grammar note / Грамматика:
We always use a capital "I" in English. "Hi" is informal, "Hello" can be used anywhere.
Correct: Hi, I am Tom. ✅
Wrong: hi i am tom. ❌"""),
                    ("Numbers 1-20", """## Числа 1-20 / Numbers 1-20

**one** — один
**two** — два
**three** — три
**four** — четыре
**five** — пять
**six** — шесть
**seven** — семь
**eight** — восемь
**nine** — девять
**ten** — десять

### Examples / Примеры:
- I have three brothers.
- She is ten years old.
- There are twenty students in our class.

### Grammar note / Грамматика:
Numbers 13-19 end in "-teen": thirteen, fourteen, fifteen, sixteen, seventeen, eighteen, nineteen.
Be careful with spelling: "four" → "fourteen", "five" → "fifteen" (irregular)."""),
                    ("Colors", """## Цвета / Colors

**red** — красный
**blue** — синий
**green** — зелёный
**yellow** — жёлтый
**black** — чёрный
**white** — белый
**orange** — оранжевый
**purple** — фиолетовый
**pink** — розовый
**brown** — коричневый

### Examples / Примеры:
- My favorite color is blue.
- The apple is red and the leaf is green.
- She has a pink bag.

### Grammar note / Грамматика:
Adjectives (colors) always come BEFORE the noun in English.
Correct: a red car ✅
Wrong: a car red ❌"""),
                    ("Days of the Week", """## Дни недели / Days of the Week

**Monday** — понедельник
**Tuesday** — вторник
**Wednesday** — среда
**Thursday** — четверг
**Friday** — пятница
**Saturday** — субботa
**Sunday** — воскресенье
**today** — сегодня
**tomorrow** — завтра
**yesterday** — вчера

### Examples / Примеры:
- Today is Monday.
- We have English class on Wednesday and Friday.
- Yesterday was Sunday.

### Grammar note / Грамматика:
Days of the week always start with a capital letter in English.
Correct: I work on Monday. ✅
Wrong: i work on monday. ❌"""),
                ],
            },
            {
                "title": "About Me",
                "lessons": [
                    ("My Family", """## Моя семья / My Family

**mother** — мать
**father** — отец
**sister** — сестра
**brother** — брат
**grandmother** — бабушка
**grandfather** — дедушка
**son** — сын
**daughter** — дочь
**aunt** — тётя
**uncle** — дядя

### Examples / Примеры:
- This is my mother and my father.
- I have two sisters and one brother.
- My grandmother lives with us.

### Grammar note / Грамматика:
Use possessive words (my, your, his, her) before family words.
Correct: This is my brother. ✅
Wrong: This is brother. ❌"""),
                    ("My Body", """## Моё тело / My Body

**head** — голова
**eyes** — глаза
**nose** — нос
**mouth** — рот
**ears** — уши
**hands** — руки
**legs** — ноги
**hair** — волосы
**back** — спина
**stomach** — живот

### Examples / Примеры:
- I have two eyes and one nose.
- My head hurts.
- She has long hair.

### Grammar note / Грамматика:
"Hair" is usually uncountable in English (no plural "hairs" for hair on your head).
Correct: Her hair is black. ✅
Wrong: Her hairs are black. ❌"""),
                    ("My Home", """## Мой дом / My Home

**kitchen** — кухня
**bedroom** — спальня
**bathroom** — ванная
**living room** — гостиная
**table** — стол
**chair** — стул
**bed** — кровать
**sofa** — диван
**window** — окно
**door** — дверь

### Examples / Примеры:
- The kitchen is next to the living room.
- There is a bed and a table in my bedroom.
- Please close the door.

### Grammar note / Грамматика:
Use "there is / there are" to describe what's in a room.
Correct: There is a sofa in the living room. ✅
Wrong: Is a sofa in the living room. ❌"""),
                ],
            },
            {
                "title": "Daily Life",
                "lessons": [
                    ("Food & Drinks", """## Еда и напитки / Food & Drinks

**bread** — хлеб
**rice** — рис
**meat** — мясо
**fish** — рыба
**vegetables** — овощи
**fruit** — фрукты
**water** — вода
**tea** — чай
**coffee** — кофе
**juice** — сок

### Examples / Примеры:
- I would like some tea, please.
- We eat rice with meat and vegetables.
- Can I have a glass of juice?

### Grammar note / Грамматика:
Use "some" for offers and positive sentences, "any" for questions and negatives.
Correct: Do you have any bread? ✅"""),
                    ("Animals", """## Животные / Animals

**dog** — собака
**cat** — кошка
**bird** — птица
**horse** — лошадь
**cow** — корова
**sheep** — овца
**lion** — лев
**elephant** — слон
**rabbit** — кролик
**bear** — медведь

### Examples / Примеры:
- I have a dog and a cat.
- The lion is the king of animals.
- Look at that little rabbit!

### Grammar note / Грамматика:
Some animal plurals are irregular: sheep → sheep (same form).
Correct: I saw three sheep. ✅
Wrong: I saw three sheeps. ❌"""),
                    ("Weather", """## Погода / Weather

**sunny** — солнечно
**rainy** — дождливо
**cloudy** — облачно
**windy** — ветрено
**snowy** — снежно
**hot** — жарко
**cold** — холодно
**warm** — тепло
**storm** — буря
**temperature** — температура

### Examples / Примеры:
- It's sunny today.
- It is very cold in winter.
- What's the weather like tomorrow?

### Grammar note / Грамматика:
We use "it is / it's" for weather, not "there is".
Correct: It's raining. ✅
Wrong: There is raining. ❌"""),
                ],
            },
        ],
    },
    {
        "title": "English Grammar Basics",
        "description": "The verb 'to be', present simple, and past simple — the foundation of every English sentence.",
        "level": "elementary",
        "modules": [
            {
                "title": "Verb To Be",
                "lessons": [
                    ("I am / You are", """## Глагол to be: I am / You are

**I am (I'm)** — я есть
**you are (you're)** — ты/вы есть
**student** — студент
**teacher** — учитель
**happy** — счастливый
**tired** — устал
**ready** — готов
**from** — из
**name** — имя
**age** — возраст

### Examples / Примеры:
- I am a student.
- You are my friend.
- I am from Tajikistan. You are from Russia.

### Grammar note / Грамматика:
"I am" can be shortened to "I'm". Never skip "am/are", even though Russian/Tajik often omit "to be".
Correct: I am happy. ✅
Wrong: I happy. ❌"""),
                    ("He is / She is", """## He is / She is

**he is (he's)** — он есть
**she is (she's)** — она есть
**it is (it's)** — оно есть
**doctor** — врач
**engineer** — инженер
**young** — молодой
**old** — старый
**tall** — высокий
**short** — низкий
**kind** — добрый

### Examples / Примеры:
- He is a doctor. She is an engineer.
- She is very kind.
- It is a small house.

### Grammar note / Грамматика:
Use "he" for males, "she" for females, "it" for objects/animals.
Correct: She is my sister. ✅
Wrong: He is my sister (about a woman). ❌"""),
                    ("We are / They are", """## We are / They are

**we are (we're)** — мы есть
**they are (they're)** — они есть
**friends** — друзья
**classmates** — одноклассники
**busy** — занят
**late** — опоздавший
**together** — вместе
**here** — здесь
**there** — там
**students** — студенты

### Examples / Примеры:
- We are friends. They are classmates.
- We are busy today.
- They are not here right now.

### Grammar note / Грамматика:
"Are" is used with we/you/they — never "is".
Correct: They are happy. ✅
Wrong: They is happy. ❌"""),
                ],
            },
            {
                "title": "Present Simple",
                "lessons": [
                    ("I do / I don't", """## Present Simple: I do / I don't

**do** — вспомогательный глагол
**don't (do not)** — не делаю
**like** — любить/нравиться
**work** — работать
**live** — жить
**play** — играть
**watch** — смотреть
**read** — читать
**every day** — каждый день
**usually** — обычно

### Examples / Примеры:
- I like tea. I don't like coffee.
- We work every day.
- They don't watch TV at night.

### Grammar note / Грамматика:
Use "don't" + base verb for negatives with I/you/we/they.
Correct: I don't like fish. ✅
Wrong: I not like fish. ❌"""),
                    ("Do you...? Yes/No questions", """## Вопросы Do you...?

**Do you...?** — Ты...?/Вы...?
**Yes, I do** — Да
**No, I don't** — Нет
**like** — нравится
**speak** — говорить
**understand** — понимать
**need** — нуждаться
**want** — хотеть
**know** — знать
**always** — всегда

### Examples / Примеры:
- Do you like English? Yes, I do.
- Do you understand the lesson? No, I don't.
- Do you speak Tajik?

### Grammar note / Грамматика:
Start Yes/No questions with "Do" + subject + base verb.
Correct: Do you live here? ✅
Wrong: You do live here? ❌"""),
                    ("He does / She does", """## He does / She does

**does** — вспомогательный глагол (3-е лицо)
**doesn't (does not)** — не делает
**works** — работает
**lives** — живёт
**plays** — играет
**watches** — смотрит
**studies** — учится
**goes** — идёт
**every morning** — каждое утро
**sometimes** — иногда

### Examples / Примеры:
- He works every morning.
- She doesn't like tea.
- Does he speak English? Yes, he does.

### Grammar note / Грамматика:
Add "-s" or "-es" to the verb with he/she/it; use "does/doesn't" in questions and negatives without the "-s".
Correct: She doesn't like fish. ✅
Wrong: She doesn't likes fish. ❌"""),
                ],
            },
            {
                "title": "Past Simple",
                "lessons": [
                    ("Regular verbs: -ed", """## Past Simple — правильные глаголы: -ed

**walked** (walk) — гулял
**talked** (talk) — говорил
**worked** (work) — работал
**played** (play) — играл
**studied** (study) — учился
**watched** (watch) — смотрел
**visited** (visit) — посетил
**cleaned** (clean) — убрал
**cooked** (cook) — готовил
**stayed** (stay) — остался

### Examples / Примеры:
- I walked to school yesterday.
- We talked for two hours.
- She studied English last night.

### Grammar note / Грамматика:
Add "-ed" to most verbs; if a verb ends in "y" after a consonant, change "y" to "i": study → studied.
Wrong: I studyed. ❌
Correct: I studied. ✅"""),
                    ("Irregular verbs", """## Past Simple — неправильные глаголы

**went** (go) — пошёл
**saw** (see) — увидел
**ate** (eat) — съел
**had** (have) — имел
**did** (do) — сделал
**said** (say) — сказал
**took** (take) — взял
**came** (come) — пришёл
**got** (get) — получил
**made** (make) — сделал

### Examples / Примеры:
- I went to the market yesterday.
- She saw her friend at the cinema.
- We ate dinner at 7 p.m.

### Grammar note / Грамматика:
Irregular verbs don't follow the "-ed" rule and must be memorized. Negatives/questions still use "did" + base verb.
Wrong: Did you went? ❌
Correct: Did you go? ✅"""),
                    ("Was / Were", """## Past Simple: Was / Were

**was** (I/he/she/it) — был
**were** (you/we/they) — были
**wasn't (was not)** — не был
**weren't (were not)** — не были
**yesterday** — вчера
**last week** — на прошлой неделе
**last year** — в прошлом году
**ago** — назад
**born** — родился
**young** — молодой

### Examples / Примеры:
- I was at home yesterday.
- They were at school last week.
- She wasn't happy about it.

### Grammar note / Грамматика:
"Was" pairs with I/he/she/it; "were" pairs with you/we/they.
Correct: We were tired. ✅
Wrong: We was tired. ❌"""),
                ],
            },
        ],
    },
    {
        "title": "Spoken English",
        "description": "Practical conversation skills: small talk, everyday places, and useful social phrases.",
        "level": "intermediate",
        "modules": [
            {
                "title": "Small Talk",
                "lessons": [
                    ("Talking about weather", """## Разговор о погоде

**What's the weather like?** — Какая погода?
**It's sunny** — Солнечно
**It's raining** — Идёт дождь
**freezing** — очень холодно
**boiling** — очень жарко
**forecast** — прогноз
**umbrella** — зонт
**season** — сезон
**climate** — климат
**nice day** — хороший день

### Examples / Примеры:
- What's the weather like today? It's sunny and warm.
- Take an umbrella, it's raining.
- It's freezing outside!

### Grammar note / Грамматика:
Small talk often uses tag questions to keep the conversation going: "Nice weather, isn't it?\""""),
                    ("Talking about work/study", """## Разговор о работе/учёбе

**What do you do?** — Чем вы занимаетесь?
**I work as a...** — Я работаю...
**I study at...** — Я учусь в...
**job** — работа
**career** — карьера
**university** — университет
**major** — специальность
**colleague** — коллега
**busy** — занят
**deadline** — срок

### Examples / Примеры:
- What do you do? I work as a teacher.
- I study at the university.
- My colleague is very busy this week.

### Grammar note / Грамматика:
"What do you do?" asks about someone's job in general (not what they're doing right now)."""),
                    ("Making plans", """## Планы на будущее

**Let's...** — Давай...
**Would you like to...?** — Хочешь ли ты...?
**How about...?** — Как насчёт...?
**free time** — свободное время
**weekend** — выходные
**meet up** — встретиться
**schedule** — расписание
**available** — свободен
**busy** — занят
**plan** — план

### Examples / Примеры:
- Let's meet up this weekend.
- Would you like to go to the cinema?
- How about Saturday? I'm free then.

### Grammar note / Грамматика:
Use "Let's + base verb" to suggest doing something together.
Correct: Let's go. ✅
Wrong: Let's to go. ❌"""),
                ],
            },
            {
                "title": "At Places",
                "lessons": [
                    ("At the restaurant", """## В ресторане

**menu** — меню
**order** — заказ
**waiter** — официант
**bill** — счёт
**delicious** — вкусный
**table for two** — столик на двоих
**reservation** — бронь
**recommend** — рекомендовать
**spicy** — острый
**dessert** — десерт

### Examples / Примеры:
- Could I have the menu, please?
- I'd like to order the chicken with rice.
- Could we have the bill, please?

### Grammar note / Грамматика:
"Could I / Could we" is more polite than "Can I / Can we" in formal places like restaurants."""),
                    ("At the airport", """## В аэропорту

**boarding pass** — посадочный талон
**check-in** — регистрация
**gate** — выход на посадку
**luggage** — багаж
**flight** — рейс
**passport** — паспорт
**delay** — задержка
**departure** — вылет
**arrival** — прибытие
**security** — контроль

### Examples / Примеры:
- Where is the check-in counter?
- What gate does the flight leave from?
- My flight is delayed by one hour.

### Grammar note / Грамматика:
"Leave from" + place describes the departure point: "The flight leaves from gate 12.\""""),
                    ("At the doctor", """## У врача

**appointment** — приём
**symptom** — симптом
**headache** — головная боль
**fever** — температура
**prescription** — рецепт
**medicine** — лекарство
**pain** — боль
**sick** — болен
**checkup** — осмотр
**pharmacy** — аптека

### Examples / Примеры:
- I have a headache and a fever.
- The doctor gave me a prescription.
- I need to make an appointment.

### Grammar note / Грамматика:
Use "have" with symptoms: "I have a headache" (not "I am headache").
Correct: I have a fever. ✅
Wrong: I am fever. ❌"""),
                ],
            },
            {
                "title": "Useful Phrases",
                "lessons": [
                    ("Agreeing and disagreeing", """## Согласие и несогласие

**I agree** — Я согласен
**I disagree** — Я не согласен
**That's true** — Это правда
**I'm not sure** — Я не уверен
**Exactly!** — Точно!
**I see your point** — Я понимаю твою точку зрения
**On the other hand** — С другой стороны
**Definitely** — Определённо
**Not really** — Не совсем
**I doubt it** — Я сомневаюсь в этом

### Examples / Примеры:
- I agree with you completely.
- I see your point, but I disagree.
- That's true, but on the other hand...

### Grammar note / Грамматика:
"I agree WITH someone" — don't forget the preposition "with".
Correct: I agree with you. ✅
Wrong: I agree you. ❌"""),
                    ("Asking for help", """## Просьба о помощи

**Can you help me?** — Можешь помочь?
**Could you please...?** — Не могли бы вы...?
**I need help with...** — Мне нужна помощь с...
**Excuse me** — Извините
**Sorry to bother you** — Извините за беспокойство
**favor** — одолжение
**assist** — помогать
**explain** — объяснить
**show me** — покажи мне
**of course** — конечно

### Examples / Примеры:
- Excuse me, can you help me with this?
- Could you please explain this again?
- I need help with my homework.

### Grammar note / Грамматика:
"Could you please...?" is a polite request form, followed by the base verb.
Correct: Could you please open the door? ✅"""),
                    ("Giving opinions", """## Выражение мнения

**In my opinion...** — По моему мнению...
**I think that...** — Я думаю, что...
**I believe...** — Я считаю...
**From my point of view** — С моей точки зрения
**It seems to me that...** — Мне кажется, что...
**personally** — лично
**honestly** — честно говоря
**I'm convinced** — Я убеждён
**It depends** — Это зависит
**overall** — в целом

### Examples / Примеры:
- In my opinion, learning English opens many doors.
- I think that practice is more important than theory.
- Honestly, I believe this is the best option.

### Grammar note / Грамматика:
After "I think that" / "In my opinion", use a full sentence with subject + verb.
Correct: I think that he is right. ✅"""),
                ],
            },
        ],
    },
]


def seed_courses_modules_lessons(db):
    lesson_ids = []
    for course_data in COURSES:
        first_module_title = course_data["modules"][0]["title"]
        existing = (
            db.query(models.Course)
            .join(models.Module)
            .filter(models.Course.title == course_data["title"], models.Module.title == first_module_title)
            .first()
        )
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


def generate_quizzes(lesson_ids, token):
    headers = {"Authorization": f"Bearer {token}"}
    ok, failed = 0, []
    for lesson_id in lesson_ids:
        try:
            res = requests.post(f"{API_BASE}/ai/generate-quiz/{lesson_id}", headers=headers, timeout=60)
            if res.status_code == 200:
                ok += 1
                print(f"Quiz generated for lesson {lesson_id}")
            elif res.status_code == 500 and "quota" in res.text.lower():
                print(f"Gemini daily quota exhausted at lesson {lesson_id}. Stopping -- re-run this script "
                      f"tomorrow to pick up the remaining lessons.")
                failed.append((lesson_id, "quota_exhausted"))
                break
            else:
                failed.append((lesson_id, res.status_code))
                print(f"Quiz FAILED for lesson {lesson_id}: {res.status_code} {res.text[:150]}")
        except Exception as e:
            failed.append((lesson_id, str(e)))
            print(f"Quiz FAILED for lesson {lesson_id}: {e}")
    return ok, failed


if __name__ == "__main__":
    db = SessionLocal()
    try:
        lesson_ids = seed_courses_modules_lessons(db)
    finally:
        db.close()

    if not lesson_ids:
        print("No new lessons created (already seeded). Generating quizzes for ALL existing lessons in this "
              "curriculum that don't have one.")
        db = SessionLocal()
        try:
            lesson_ids = []
            for course_data in COURSES:
                first_module_title = course_data["modules"][0]["title"]
                course = (
                    db.query(models.Course)
                    .join(models.Module)
                    .filter(models.Course.title == course_data["title"], models.Module.title == first_module_title)
                    .first()
                )
                if not course:
                    continue
                for m in course.modules:
                    for l in m.lessons:
                        if not db.query(models.QuizQuestion).filter(models.QuizQuestion.lesson_id == l.id).first():
                            lesson_ids.append(l.id)
        finally:
            db.close()

    print(f"\nGenerating AI quizzes for {len(lesson_ids)} lessons via {API_BASE} ...")
    token = get_auth_token()
    ok, failed = generate_quizzes(lesson_ids, token)
    print(f"\nDone. Quizzes generated: {ok}/{len(lesson_ids)}")
    if failed:
        print("Not generated:", failed)
