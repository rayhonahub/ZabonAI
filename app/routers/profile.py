from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.deps import get_db, get_current_user
from app.level_utils import level_from_xp, level_label
from app.services.level_service import LEVEL_ORDER

router = APIRouter(prefix="/profile", tags=["Profile"])


def is_travel_course_completed(db: Session, user: models.User) -> bool:
    course = db.query(models.Course).filter(models.Course.title.ilike("%travel%")).first()
    if not course:
        return False

    lesson_ids = [
        lesson_id
        for (lesson_id,) in db.query(models.Lesson.id)
        .join(models.Module, models.Lesson.module_id == models.Module.id)
        .filter(models.Module.course_id == course.id)
        .all()
    ]
    if not lesson_ids:
        return False

    completed_count = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == user.id,
        models.UserProgress.lesson_id.in_(lesson_ids),
        models.UserProgress.completed == True,
    ).count()
    return completed_count >= len(lesson_ids)


def build_profile_response(db: Session, user: models.User) -> schemas.ProfileResponse:
    return schemas.ProfileResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        bio=user.bio,
        avatar_color=user.avatar_color,
        avatar_style=user.avatar_style,
        avatar_seed=user.avatar_seed,
        selected_language=user.selected_language,
        streak=user.streak,
        coins=user.coins,
        xp_points=user.xp_points,
        level=user.level,
        level_label=level_label(user.level),
        selected_level=user.selected_level or "beginner",
        total_lessons_completed=user.total_lessons_completed,
        total_quizzes_passed=user.total_quizzes_passed,
        travel_completed=is_travel_course_completed(db, user),
        created_at=user.created_at,
    )


@router.get("/me", response_model=schemas.ProfileResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return build_profile_response(db, current_user)


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
    if data.avatar_style is not None:
        current_user.avatar_style = data.avatar_style
    if data.avatar_seed is not None:
        current_user.avatar_seed = data.avatar_seed
    if data.selected_language is not None:
        if data.selected_language not in ("ru", "tj", "en"):
            raise HTTPException(status_code=400, detail="selected_language must be ru, tj, or en")
        current_user.selected_language = data.selected_language
    if data.selected_level is not None:
        if data.selected_level not in LEVEL_ORDER:
            raise HTTPException(status_code=400, detail="selected_level must be beginner, elementary, intermediate, or advanced")
        current_user.selected_level = data.selected_level

    db.commit()
    db.refresh(current_user)
    return build_profile_response(db, current_user)


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


@router.get("/referral", response_model=schemas.ReferralInfo)
def get_referral_info(current_user: models.User = Depends(get_current_user)):
    referral_link = f"https://zaboniai.com/register?ref={current_user.referral_code}"
    return schemas.ReferralInfo(
        referral_code=current_user.referral_code,
        referral_link=referral_link,
        referral_count=current_user.referral_count,
        coins_earned=current_user.referral_count * 50,
    )
