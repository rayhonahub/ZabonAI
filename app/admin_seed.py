"""
HOW TO ADD NEW CONTENT:
Edit the example call at the bottom of this file with your course/module/lesson
data, then run: python -m app.admin_seed

LESSON CONTENT FORMAT (required for every lesson — English + Tajik side by side,
never English-only, never Russian):

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

from app.database import SessionLocal
from app import models
from app.services.level_service import LEVEL_ORDER


def add_course(level: str, title: str, description: str, modules: list):
    """
    modules = [
        {
            "title": "Module name",
            "lessons": [
                {"title": "Lesson name", "content": "## English Topic / Тоҷикӣ Унвон\\n\\n..."}
            ]
        }
    ]
    See the module docstring above for the required bilingual lesson content format.
    """
    db = SessionLocal()

    course = models.Course(
        title=title,
        description=description,
        level=level,
        level_order=LEVEL_ORDER.get(level, 1),
    )
    db.add(course)
    db.flush()

    for mod_idx, mod_data in enumerate(modules):
        module = models.Module(
            course_id=course.id,
            title=mod_data["title"],
            order=mod_idx + 1,
        )
        db.add(module)
        db.flush()

        for les_idx, les_data in enumerate(mod_data.get("lessons", [])):
            lesson = models.Lesson(
                module_id=module.id,
                title=les_data["title"],
                content=les_data["content"],
                order=les_idx + 1,
            )
            db.add(lesson)

    db.commit()
    print(f"Course '{title}' (level: {level}) added with {len(modules)} modules!")
    db.close()


if __name__ == "__main__":
    add_course(
        level="beginner",
        title="Сафар ба Инглистон / Travelling to England",
        description="Дар сафар чӣ гуфтан лозим аст",
        modules=[
            {
                "title": "Дар фурудгоҳ / At the Airport",
                "lessons": [
                    {
                        "title": "Ибораҳои фурудгоҳ",
                        "content": """## Дар фурудгоҳ / At the Airport

**passport** — шиноснома
**ticket** — билет
**flight** — парвоз
**gate** — дарвоза
**boarding** — савор шудан

### Ибораҳои муҳим:
- **Where is gate 5?** — Дарвозаи 5 куҷост?
- **My flight is delayed.** — Парвози ман таъхир шуд.
- **Window or aisle seat?** — Дар паҳлӯи тиреза ё гузаргоҳ?
""",
                    }
                ],
            }
        ],
    )
