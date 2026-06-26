from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.deps import get_db, get_current_user

router = APIRouter(prefix="/courses", tags=["Courses"])


@router.get("/", response_model=list[schemas.CourseResponse])
def get_courses(db: Session = Depends(get_db)):
    return db.query(models.Course).all()


@router.get("/{course_id}", response_model=schemas.CourseResponse)
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Курс не найден")
    return course


@router.post("/", response_model=schemas.CourseResponse)
def create_course(
    data: schemas.CourseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    course = models.Course(**data.model_dump())
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@router.get("/{course_id}/modules", response_model=list[schemas.ModuleResponse])
def get_modules(course_id: int, db: Session = Depends(get_db)):
    return db.query(models.Module).filter(
        models.Module.course_id == course_id
    ).order_by(models.Module.order).all()


@router.post("/{course_id}/modules", response_model=schemas.ModuleResponse)
def create_module(
    course_id: int,
    data: schemas.ModuleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    module = models.Module(course_id=course_id, **data.model_dump())
    db.add(module)
    db.commit()
    db.refresh(module)
    return module


@router.get("/{course_id}/modules/{module_id}/lessons", response_model=list[schemas.LessonResponse])
def get_lessons(module_id: int, db: Session = Depends(get_db)):
    return db.query(models.Lesson).filter(
        models.Lesson.module_id == module_id
    ).order_by(models.Lesson.order).all()


@router.get("/lessons/{lesson_id}", response_model=schemas.LessonResponse)
def get_lesson(lesson_id: int, db: Session = Depends(get_db)):
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Урок не найден")
    return lesson


@router.post("/{course_id}/modules/{module_id}/lessons", response_model=schemas.LessonResponse)
def create_lesson(
    module_id: int,
    data: schemas.LessonCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    lesson = models.Lesson(module_id=module_id, **data.model_dump())
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson