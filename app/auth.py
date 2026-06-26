from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _truncate_to_72_bytes(password: str) -> str:
    """bcrypt limits passwords to 72 bytes, not 72 characters — Cyrillic chars are 2 bytes each"""
    return password.encode("utf-8")[:72].decode("utf-8", errors="ignore")


def hash_password(password: str) -> str:
    """Хешируем пароль перед сохранением в БД"""
    return pwd_context.hash(_truncate_to_72_bytes(password))


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверяем пароль при входе"""
    return pwd_context.verify(_truncate_to_72_bytes(plain_password), hashed_password)


def create_access_token(data: dict) -> str:
    """Создаём JWT токен"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    """Декодируем JWT токен"""
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])