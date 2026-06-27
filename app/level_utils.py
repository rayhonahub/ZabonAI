LEVEL_LABELS = {
    "beginner": "Beginner 🌱",
    "elementary": "Elementary 📚",
    "intermediate": "Intermediate 🚀",
    "advanced": "Advanced ⭐",
}


def level_from_xp(xp: int) -> str:
    if xp >= 601:
        return "advanced"
    if xp >= 301:
        return "intermediate"
    if xp >= 101:
        return "elementary"
    return "beginner"


def level_label(level_key: str) -> str:
    return LEVEL_LABELS.get(level_key, LEVEL_LABELS["beginner"])
