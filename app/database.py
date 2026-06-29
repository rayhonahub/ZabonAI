from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def run_migrations():
    """create_all() only creates missing tables, it never alters existing ones.
    This adds any columns that were added to models.py after the table already
    existed in the live database."""
    statements = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_color VARCHAR DEFAULT '#f0a500'",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_style VARCHAR DEFAULT 'adventurer'",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_seed VARCHAR DEFAULT 'default'",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS selected_language VARCHAR DEFAULT 'ru'",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS xp_points INTEGER DEFAULT 0",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS level VARCHAR DEFAULT 'beginner'",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS total_lessons_completed INTEGER DEFAULT 0",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS total_quizzes_passed INTEGER DEFAULT 0",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by VARCHAR",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0",
    ]
    with engine.begin() as conn:
        for stmt in statements:
            conn.execute(text(stmt))