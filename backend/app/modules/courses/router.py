from fastapi import APIRouter

from app.modules.courses.schemas import (
    CourseDetail,
    CourseOverview,
    LessonCompletePayload,
    LessonCompleteResponse,
    LessonDetail,
)
from app.modules.courses.service import CourseService

router = APIRouter(prefix="/api/courses", tags=["courses"])
service = CourseService.get_instance()


@router.get("", response_model=list[CourseOverview])
def list_courses() -> list[CourseOverview]:
    """Get list of available courses (B2, C1) with learner progress."""
    return service.list_courses()


@router.get("/{course_id}", response_model=CourseDetail)
def get_course_detail(course_id: str) -> CourseDetail:
    """Get course curriculum tree including units, lessons, and lock/completion status."""
    return service.get_course_detail(course_id)


@router.get("/{course_id}/lessons/{lesson_id}", response_model=LessonDetail)
def get_lesson_detail(course_id: str, lesson_id: str) -> LessonDetail:
    """Get lesson study content: target vocabulary from JSON, grammar notes, and checkpoint quiz."""
    return service.get_lesson_detail(course_id, lesson_id)


@router.post("/{course_id}/lessons/{lesson_id}/complete", response_model=LessonCompleteResponse)
def complete_lesson(
    course_id: str,
    lesson_id: str,
    payload: LessonCompletePayload,
) -> LessonCompleteResponse:
    """Mark a lesson as completed, record score, unlock next lesson, and update user_progress.json."""
    return service.complete_lesson(course_id, lesson_id, payload.score)
