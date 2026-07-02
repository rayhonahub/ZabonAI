from app.database import SessionLocal
from app import models

LESSON_CONTENT_TEMPLATE = """
All lesson content must be bilingual: English word/rule + Tajik explanation, never English-only
and never Russian. Every new lesson should follow this markdown shape:

## [English Topic Title] / [Тоҷикӣ Унвон]

[Кӯтоҳ дар бораи мавзӯи дарс ба тоҷикӣ]

### Луғат / Vocabulary:
| Англисӣ | Тоҷикӣ | Талаффуз |
|---------|--------|----------|
| word | тарҷума | [wɜːd] |

### Қоида / Grammar Rule:
[Rule in English]
➜ [Тавзеҳ ба тоҷикӣ]

### Мисолҳо / Examples:
- **English sentence** — Тарҷумаи тоҷикӣ

### Диалог / Dialogue:
A: English line (Тоҷикии тарҷума)
B: English reply (Тоҷикии тарҷума)

### Ёдоварӣ / Remember:
⚠️ Хатои маъмул — common mistake to avoid
"""


def seed_diverse_lessons():
    db = SessionLocal()

    if db.query(models.Lesson).count() > 10:
        print("Lessons already seeded")
        db.close()
        return

    course = db.query(models.Course).filter(models.Course.level == "beginner").first()

    if not course:
        course = models.Course(
            title="Забони Англисӣ барои Тоҷикзабонон",
            description="Аз сифр то суҳбати озод — бо тарҷума ба тоҷикӣ",
            level="beginner",
        )
        db.add(course)
        db.flush()

    # Module 1: Basic Vocabulary
    m1 = models.Module(course_id=course.id, title="Луғати асосӣ", order=1)
    db.add(m1)
    db.flush()

    lessons_m1 = [
        (
            "Алифбои Англисӣ",
            """## Алифбои Англисӣ / English Alphabet

Алифбои англисӣ 26 ҳарф дорад:

**A** - эй | **B** - би | **C** - си | **D** - ди | **E** - и
**F** - эф | **G** - ҷи | **H** - эйч | **I** - ай | **J** - ҷэй
**K** - кэй | **L** - эл | **M** - эм | **N** - эн | **O** - оу
**P** - пи | **Q** - кью | **R** - ар | **S** - эс | **T** - ти
**U** - ю | **V** - ви | **W** - дабл-ю | **X** - экс | **Y** - вай
**Z** - зэд

### Мисолҳо:
- **A**pple (себ) - Эй
- **B**ook (китоб) - Би
- **C**at (гурба) - Си

### Калимаҳои нав:
- alphabet = алифбо
- letter = ҳарф
- capital = калон
- small = хурд
""",
        ),
        (
            "Рангҳо / Colors",
            """## Рангҳо / Colors

**red** — сурх 🔴
**blue** — кабуд 🔵
**green** — сабз 🟢
**yellow** — зард 🟡
**orange** — норанҷӣ 🟠
**purple** — бунафш 🟣
**black** — сиёҳ ⚫
**white** — сафед ⚪
**pink** — гулобӣ 🩷
**brown** — қаҳваранг 🟤

### Ҷумлаҳои мисолӣ:
- The sky is **blue**. (Осмон кабуд аст.)
- Apples are **red**. (Себ сурх аст.)
- Grass is **green**. (Алаф сабз аст.)
- The sun is **yellow**. (Офтоб зард аст.)

### Грамматика:
'is' ба маънои '...аст' меояд.
The apple **is** red. = Себ сурх **аст**.
""",
        ),
        (
            "Рақамҳо 1-100 / Numbers",
            """## Рақамҳо / Numbers

### 1-10:
1-one, 2-two, 3-three, 4-four, 5-five
6-six, 7-seven, 8-eight, 9-nine, 10-ten

### 11-20:
11-eleven, 12-twelve, 13-thirteen, 14-fourteen, 15-fifteen
16-sixteen, 17-seventeen, 18-eighteen, 19-nineteen, 20-twenty

### Даҳҳо:
30-thirty, 40-forty, 50-fifty, 60-sixty
70-seventy, 80-eighty, 90-ninety, 100-one hundred

### Мисол:
25 = twenty-five (бист ва панҷ)
43 = forty-three (чилу се)
99 = ninety-nine (навад ва нӯҳ)

### Ҳаёти воқеӣ:
- "My phone number is **zero-nine-one-two**" — Рақами телефони ман 0912 аст
- "I am **twenty** years old" — Ман бист сола ҳастам
""",
        ),
        (
            "Узвҳои бадан / Body Parts",
            """## Узвҳои бадан / Body Parts

### Сар / Head:
- **head** — сар
- **hair** — мӯй
- **eye** — чашм (eyes — чашмҳо)
- **ear** — гӯш (ears — гӯшҳо)
- **nose** — бинӣ
- **mouth** — даҳон
- **teeth** — дандонҳо

### Бадан / Body:
- **neck** — гардан
- **shoulder** — китф
- **arm** — дасти боло
- **hand** — даст
- **finger** — ангушт
- **chest** — сина
- **back** — пушт
- **leg** — по
- **foot** — пой (feet — пойҳо)

### Ҷумлаҳои мисолӣ:
- I have two **eyes**. (Ман ду чашм дорам.)
- My **hand** is small. (Дасти ман хурд аст.)
- She has long **hair**. (Ӯ мӯи дароз дорад.)
""",
        ),
    ]

    for i, (title, content) in enumerate(lessons_m1):
        lesson = models.Lesson(module_id=m1.id, title=title, content=content, order=i + 1)
        db.add(lesson)

    # Module 2: Everyday Conversations
    m2 = models.Module(course_id=course.id, title="Суҳбатҳои ҳаррӯза", order=2)
    db.add(m2)
    db.flush()

    lessons_m2 = [
        (
            "Саломутоб / Greetings",
            """## Саломутоб / Greetings

### Ибтидоии рӯз:
- **Hello!** — Салом! (дар ҳама вақт)
- **Hi!** — Салом! (дӯстона)
- **Good morning!** — Субҳ бахайр! (то соати 12)
- **Good afternoon!** — Рӯзи хуш! (аз 12 то 17)
- **Good evening!** — Шом бахайр! (аз 17 то шаб)

### Пурсиши ҳол:
- **How are you?** — Чӣ ҳол доред?
- **I'm fine, thank you.** — Хуб ҳастам, раҳмат.
- **I'm great!** — Аъло!
- **Not bad.** — Бад не.

### Видоъ:
- **Goodbye!** — Хайр!
- **See you later!** — То дидор!
- **See you tomorrow!** — Пагоҳ то дидор!
- **Take care!** — Эҳтиёт бош!

### Диалоги намунавӣ:
A: **Hello! How are you?**
B: **I'm fine, thank you! And you?**
A: **I'm great! See you later!**
B: **Goodbye!**
""",
        ),
        (
            "Муаррифии худ / Introducing Yourself",
            """## Муаррифии худ / Introducing Yourself

### Ибораҳои муҳим:
- **My name is...** — Номи ман... аст
- **I am...** — Ман... ҳастам
- **I'm from...** — Ман аз... ҳастам
- **I live in...** — Ман дар... зиндагӣ мекунам
- **I am ... years old** — Ман ... сола ҳастам
- **Nice to meet you!** — Аз вохӯрӣ бо шумо хурсандам!
- **What is your name?** — Номи шумо чист?
- **Where are you from?** — Шумо аз куҷо ҳастед?

### Диалоги намунавӣ:
A: **Hello! My name is Sara. What is your name?**
   (Салом! Номи ман Сара. Номи шумо чист?)
B: **Hi! I'm Ali. Nice to meet you!**
   (Салом! Ман Алӣ ҳастам. Аз вохӯрӣ хурсандам!)
A: **Where are you from, Ali?**
   (Шумо аз куҷо ҳастед, Алӣ?)
B: **I'm from Tajikistan. I live in Dushanbe.**
   (Ман аз Тоҷикистон ҳастам. Ман дар Душанбе зиндагӣ мекунам.)

### Тамрин кун:
Ҷумларо пур кун:
My name _____ Sara. (is)
I _____ from Dushanbe. (am)
""",
        ),
        (
            "Дар тарабхона / At the Restaurant",
            """## Дар тарабхона / At the Restaurant

### Хӯрокҳо / Food:
- **bread** — нон
- **rice** — биринҷ
- **soup** — шӯрбо
- **salad** — салат
- **chicken** — мурғ
- **meat** — гӯшт
- **fish** — моҳӣ
- **egg** — тухм
- **fruit** — мева
- **vegetable** — сабзавот

### Нӯшокиҳо / Drinks:
- **water** — об
- **tea** — чой
- **coffee** — қаҳва
- **juice** — афшура
- **milk** — шир

### Ибораҳои муҳим:
- **Can I have the menu, please?** — Менюро оред, илтимос
- **I would like...** — Ман мехоҳам...
- **What do you recommend?** — Чиро тавсия медиҳед?
- **The bill, please.** — Ҳисоб оред, илтимос
- **It's delicious!** — Хеле хуш маза!

### Диалог:
Waiter: **What would you like to order?**
         (Чӣ фармоиш медиҳед?)
Customer: **I would like chicken soup and tea, please.**
           (Ман шӯрбои мурғ ва чой мехоҳам, илтимос.)
""",
        ),
    ]

    for i, (title, content) in enumerate(lessons_m2):
        lesson = models.Lesson(module_id=m2.id, title=title, content=content, order=i + 1)
        db.add(lesson)

    # Module 3: Grammar
    m3 = models.Module(course_id=course.id, title="Грамматика бо тоҷикӣ", order=3)
    db.add(m3)
    db.flush()

    lessons_m3 = [
        (
            "Феъли 'To Be' / Verb To Be",
            """## Феъли 'To Be' — 'Будан'

Феъли 'to be' дар забони англисӣ бисёр муҳим аст!
Он ба маънои 'ҳастам / ҳастӣ / аст / ҳастем / ҳастанд' меояд.

### Шакли мусбат:
| Англисӣ | Тоҷикӣ |
|---------|--------|
| I **am** | Ман **ҳастам** |
| You **are** | Ту **ҳастӣ** |
| He **is** | Ӯ (мард) **аст** |
| She **is** | Ӯ (зан) **аст** |
| It **is** | Он **аст** |
| We **are** | Мо **ҳастем** |
| They **are** | Онҳо **ҳастанд** |

### Мисолҳо:
- I **am** a student. (Ман донишҷӯ **ҳастам**.)
- She **is** a doctor. (Ӯ духтур **аст**.)
- We **are** friends. (Мо дӯст **ҳастем**.)

### Шакли манфӣ:
- I am **not** tired. (Ман хаста **нестам**.)
- He is **not** here. (Ӯ ин ҷо **нест**.)
- They are **not** students. (Онҳо донишҷӯ **нестанд**.)

### Хато нашав!
❌ I is a student. (НОДУРУСТ)
✅ I am a student. (ДУРУСТ)
❌ He are happy. (НОДУРУСТ)
✅ He is happy. (ДУРУСТ)
""",
        ),
        (
            "Present Simple — Замони ҳозира",
            """## Present Simple — Замони Ҳозираи Сода

Present Simple барои корҳои ҳаррӯза истифода мешавад.

### Кай истифода мешавад:
✅ Кори ҳаррӯза: I **study** every day. (Ман ҳар рӯз мехонам.)
✅ Факт: The sun **rises** in the east. (Офтоб аз шарқ тулӯъ мекунад.)
✅ Одат: She **drinks** tea every morning. (Ӯ ҳар субҳ чой менӯшад.)

### Шакли мусбат:
- I/You/We/They **work** (кор мекунам/мекунӣ/мекунем/мекунанд)
- He/She/It **works** (кор мекунад) ← -s илова мешавад!

### Шакли манфӣ:
- I/You/We/They **don't work** (кор намекунам...)
- He/She/It **doesn't work** (кор намекунад)

### Савол:
- **Do** you work? — **Yes, I do.** / **No, I don't.**
- **Does** she work? — **Yes, she does.** / **No, she doesn't.**

### Мисолҳои ҳаётӣ:
- I **wake up** at 7 every morning. (Ман ҳар субҳ соати 7 бедор мешавам.)
- My father **works** in an office. (Падарам дар идора кор мекунад.)
- We **don't eat** meat. (Мо гӯшт намехӯрем.)
""",
        ),
    ]

    for i, (title, content) in enumerate(lessons_m3):
        lesson = models.Lesson(module_id=m3.id, title=title, content=content, order=i + 1)
        db.add(lesson)

    db.commit()
    print("✅ 9 diverse Tajik-translated lessons seeded successfully!")
    db.close()


if __name__ == "__main__":
    seed_diverse_lessons()
