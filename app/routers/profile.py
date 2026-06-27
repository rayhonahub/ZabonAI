from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.deps import get_db, get_current_user
from app.level_utils import level_from_xp, level_label

router = APIRouter(prefix="/profile", tags=["Profile"])


def build_profile_response(user: models.User) -> schemas.ProfileResponse:
    return schemas.ProfileResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        bio=user.bio,
        avatar_color=user.avatar_color,
        selected_language=user.selected_language,
        streak=user.streak,
        xp_points=user.xp_points,
        level=user.level,
        level_label=level_label(user.level),
        total_lessons_completed=user.total_lessons_completed,
        total_quizzes_passed=user.total_quizzes_passed,
        created_at=user.created_at,
    )


@router.get("/me", response_model=schemas.ProfileResponse)
def get_my_profile(current_user: models.User = Depends(get_current_user)):
    return build_profile_response(current_user)


@router.put("/update", response_model=schemas.ProfileResponse)
def update_profile(
    data: schemas.ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if data.full_name is not None:
        current_user.full_name = data.full_name
    if data.bio is not None:
        current_user.bio = data.bio
    if data.avatar_color is not None:
        current_user.avatar_color = data.avatar_color
    if data.selected_language is not None:
        if data.selected_language not in ("ru", "tj", "en"):
            raise HTTPException(status_code=400, detail="selected_language must be ru, tj, or en")
        current_user.selected_language = data.selected_language

    db.commit()
    db.refresh(current_user)
    return build_profile_response(current_user)


@router.get("/stats", response_model=schemas.ProfileStats)
def get_my_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    progress_rows = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == current_user.id
    ).all()
    scores = [p.score for p in progress_rows if p.score is not None]
    average_score = round(sum(scores) / len(scores), 1) if scores else 0.0

    return schemas.ProfileStats(
        xp_points=current_user.xp_points,
        level=current_user.level,
        level_label=level_label(current_user.level),
        streak=current_user.streak,
        total_lessons_completed=current_user.total_lessons_completed,
        total_quizzes_passed=current_user.total_quizzes_passed,
        average_score=average_score,
    )
