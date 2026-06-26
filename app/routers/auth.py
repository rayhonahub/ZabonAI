from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from app import models, schemas
from app.auth import hash_password, verify_password, create_access_token
from app.deps import get_db, get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=schemas.UserResponse)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email уже используется")

    user = models.User(
        full_name=user_data.full_name,
        email=user_data.email,
        password=hash_password(user_data.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=schemas.Token)
def login(user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.password):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")

    today = datetime.utcnow().date()
    if user.last_activity:
        last = user.last_activity.date()
        if (today - last).days == 1:
            user.streak += 1
        elif (today - last).days > 1:
            user.streak = 1
    else:
        user.streak = 1

    user.last_activity = datetime.utcnow()
    db.commit()

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user