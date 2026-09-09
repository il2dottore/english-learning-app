import contextlib
import json
import logging
import random
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from app.core.exceptions import ResourceNotFoundError
from app.modules.courses.schemas import (
    CourseDetail,
    CourseOverview,
    LessonCompleteResponse,
    LessonDetail,
    LessonOverview,
    UnitOverview,
)
from app.modules.vocabulary.json_store import VocabularyJsonStore
from app.modules.vocabulary.schemas import QuizQuestion, VocabularyRead

logger = logging.getLogger(__name__)


class CourseService:
    _instance: "CourseService | None" = None

    def __init__(self) -> None:
        self.data_dir = Path(__file__).resolve().parents[4] / "data"
        self.courses_file = self.data_dir / "courses.json"
        self.progress_file = self.data_dir / "user_progress.json"
        self.vocab_store = VocabularyJsonStore.get_instance()
        self._courses: list[dict[str, Any]] = []
        self._courses_by_id: dict[str, dict[str, Any]] = {}
        self.load_courses()

    @classmethod
    def get_instance(cls) -> "CourseService":
        if cls._instance is None:
            cls._instance = CourseService()
        return cls._instance

    def load_courses(self) -> None:
        if not self.courses_file.exists():
            self._courses = []
            return

        try:
            with open(self.courses_file, encoding="utf-8") as f:
                data = json.load(f)
                self._courses = data.get("courses", [])
                self._courses_by_id = {c["id"]: c for c in self._courses}
        except Exception as e:
            logger.error("Failed to load courses.json: %s", e)

    def _get_user_progress(self) -> dict[str, Any]:
        if not self.progress_file.exists():
            return {"course_progress": {}}

        try:
            with open(self.progress_file, encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {"course_progress": {}}

    def _save_user_progress(self, progress: dict[str, Any]) -> None:
        try:
            with open(self.progress_file, "w", encoding="utf-8") as f:
                json.dump(progress, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error("Failed to save progress: %s", e)

    def list_courses(self) -> list[CourseOverview]:
        progress = self._get_user_progress().get("course_progress", {})
        result: list[CourseOverview] = []

        for c in self._courses:
            cid = c["id"]
            c_prog = progress.get(cid, {})
            completed_set = set(c_prog.get("completed_lessons", []))
            total_lessons = c.get("total_lessons", 1)
            pct = round((len(completed_set) / max(total_lessons, 1)) * 100, 1)

            # Find first uncompleted lesson as current
            current_lesson_id: str | None = None
            for unit in c.get("units", []):
                for lesson in unit.get("lessons", []):
                    if lesson["id"] not in completed_set:
                        current_lesson_id = lesson["id"]
                        break
                if current_lesson_id:
                    break

            result.append(
                CourseOverview(
                    id=c["id"],
                    level=c["level"],
                    title=c["title"],
                    description=c["description"],
                    total_units=c["total_units"],
                    total_lessons=total_lessons,
                    total_vocab=c.get("total_vocab", 0),
                    completed_lessons_count=len(completed_set),
                    progress_percentage=pct,
                    current_lesson_id=current_lesson_id,
                )
            )

        return result

    def get_course_detail(self, course_id: str) -> CourseDetail:
        course = self._courses_by_id.get(course_id)
        if not course:
            raise ResourceNotFoundError(detail=f"Course '{course_id}' not found")

        progress = self._get_user_progress().get("course_progress", {}).get(course_id, {})
        completed_set = set(progress.get("completed_lessons", []))
        scores_map = progress.get("lesson_scores", {})

        units_out: list[UnitOverview] = []
        is_first_lesson = True
        previous_completed = True

        for u in course.get("units", []):
            lessons_out: list[LessonOverview] = []
            unit_completed = 0

            for l_data in u.get("lessons", []):
                lid = l_data["id"]
                is_comp = lid in completed_set
                if is_comp:
                    unit_completed += 1

                # Progression rule: First lesson is always unlocked, otherwise unlocked if previous is completed
                is_unlocked = is_first_lesson or previous_completed or is_comp
                is_first_lesson = False
                previous_completed = is_comp

                lessons_out.append(
                    LessonOverview(
                        id=lid,
                        lesson_number=l_data["lesson_number"],
                        title=l_data["title"],
                        vocab_count=len(l_data.get("vocab_ids", [])),
                        grammar_focus=l_data.get("grammar_focus", ""),
                        reading_topic=l_data.get("reading_topic", ""),
                        estimated_minutes=l_data.get("estimated_minutes", 15),
                        xp=l_data.get("xp", 50),
                        is_completed=is_comp,
                        is_unlocked=is_unlocked,
                        score=scores_map.get(lid),
                    )
                )

            total_u_lessons = len(u.get("lessons", []))
            u_pct = round((unit_completed / max(total_u_lessons, 1)) * 100, 1)

            units_out.append(
                UnitOverview(
                    id=u["id"],
                    unit_number=u["unit_number"],
                    title=u["title"],
                    description=u["description"],
                    lessons=lessons_out,
                    completed_count=unit_completed,
                    total_lessons=total_u_lessons,
                    progress_percentage=u_pct,
                )
            )

        total_lessons = course.get("total_lessons", 1)
        total_completed = len(completed_set)
        course_pct = round((total_completed / max(total_lessons, 1)) * 100, 1)

        return CourseDetail(
            id=course["id"],
            level=course["level"],
            title=course["title"],
            description=course["description"],
            total_units=course["total_units"],
            total_lessons=total_lessons,
            total_vocab=course.get("total_vocab", 0),
            completed_lessons_count=total_completed,
            progress_percentage=course_pct,
            units=units_out,
        )

    def get_lesson_detail(self, course_id: str, lesson_id: str) -> LessonDetail:
        course = self._courses_by_id.get(course_id)
        if not course:
            raise ResourceNotFoundError(detail=f"Course '{course_id}' not found")

        found_unit: dict[str, Any] | None = None
        found_lesson: dict[str, Any] | None = None

        for u in course.get("units", []):
            for l_item in u.get("lessons", []):
                if l_item["id"] == lesson_id:
                    found_unit = u
                    found_lesson = l_item
                    break
            if found_lesson:
                break

        if not found_unit or not found_lesson:
            raise ResourceNotFoundError(detail=f"Lesson '{lesson_id}' not found in course '{course_id}'")

        # Get progress
        progress = self._get_user_progress().get("course_progress", {}).get(course_id, {})
        completed_set = set(progress.get("completed_lessons", []))
        is_comp = lesson_id in completed_set

        # Fetch actual vocabulary items for vocab_ids
        vocab_ids = found_lesson.get("vocab_ids", [])
        vocabularies: list[VocabularyRead] = []
        for vid in vocab_ids:
            with contextlib.suppress(Exception):
                vocabularies.append(self.vocab_store.get_by_id(vid))

        # Generate 5 Checkpoint Quiz questions from this lesson's vocab
        checkpoint_quiz = self._generate_lesson_quiz(vocabularies, count=5)

        # Grammar lesson section
        grammar_data = found_lesson.get("grammar_lesson")
        grammar_notes = (
            f"Điểm ngữ pháp trọng tâm: {found_lesson.get('grammar_focus')}.\n\n"
            "Hãy chú ý cách kết hợp từ vựng và cấu trúc này trong câu ví dụ thực tế."
        )
        if grammar_data and "rules" in grammar_data:
            concept_str = grammar_data.get("concept", "")
            formula_str = grammar_data.get("formula", "")
            rules_str = "\n".join(f"- {r}" for r in grammar_data.get("rules", []))
            grammar_notes = f"Điểm ngữ pháp: {concept_str}\n\nCông thức: {formula_str}\n\nQuy tắc:\n{rules_str}"

        # Reading passage section
        reading_data = found_lesson.get("reading_passage")
        reading_text = (
            f"Chủ đề đọc hiểu: {found_lesson.get('reading_topic')}.\n\n"
            "Đoạn văn học thuật ứng dụng các từ vựng cốt lõi của bài học."
        )
        if reading_data and "passage" in reading_data:
            reading_text = f"Tiêu đề: {reading_data.get('title', '')}\n\n{reading_data.get('passage', '')}"

        return LessonDetail(
            id=lesson_id,
            course_id=course_id,
            unit_id=found_unit["id"],
            lesson_number=found_lesson["lesson_number"],
            title=found_lesson["title"],
            unit_title=found_unit["title"],
            course_title=course["title"],
            level=course["level"],
            grammar_focus=found_lesson.get("grammar_focus", ""),
            grammar_notes=grammar_notes,
            reading_topic=found_lesson.get("reading_topic", ""),
            reading_text=reading_text,
            grammar_lesson=grammar_data,
            reading_passage=reading_data,
            passing_score_pct=found_lesson.get("passing_score_pct", 60),
            reward_xp=found_lesson.get("reward_xp", 60),
            vocabularies=vocabularies,
            checkpoint_quiz=checkpoint_quiz,
            is_completed=is_comp,
            is_unlocked=True,
        )

    def complete_lesson(self, course_id: str, lesson_id: str, score: int) -> LessonCompleteResponse:
        course = self._courses_by_id.get(course_id)
        if not course:
            raise ResourceNotFoundError(detail=f"Course '{course_id}' not found")

        # Find target lesson
        found_lesson: dict[str, Any] | None = None
        for u in course.get("units", []):
            for l_item in u.get("lessons", []):
                if l_item["id"] == lesson_id:
                    found_lesson = l_item
                    break
            if found_lesson:
                break

        if not found_lesson:
            raise ResourceNotFoundError(detail=f"Lesson '{lesson_id}' not found in course '{course_id}'")

        # Find all lesson IDs in order
        all_lessons: list[str] = []
        for u in course.get("units", []):
            for l_item in u.get("lessons", []):
                all_lessons.append(l_item["id"])

        passing_score = found_lesson.get("passing_score_pct", 60)
        reward_xp = found_lesson.get("reward_xp", 60)
        passed = score >= passing_score

        full_progress = self._get_user_progress()
        cp = full_progress.setdefault("course_progress", {})
        c_entry = cp.setdefault(
            course_id,
            {"completed_lessons": [], "lesson_scores": {}, "last_studied_at": None},
        )

        completed_list: list[str] = c_entry.setdefault("completed_lessons", [])
        scores_map = c_entry.setdefault("lesson_scores", {})
        scores_map[lesson_id] = max(scores_map.get(lesson_id, 0), score)
        c_entry["last_studied_at"] = datetime.now(UTC).isoformat()

        next_lid: str | None = None
        earned_xp = 0

        if passed:
            earned_xp = reward_xp
            if lesson_id not in completed_list:
                completed_list.append(lesson_id)

            curr_idx = all_lessons.index(lesson_id)
            next_lid = all_lessons[curr_idx + 1] if curr_idx + 1 < len(all_lessons) else None
            feedback = (
                f"Xuất sắc! Bạn đã vượt qua bài học với {score}% "
                f"(yêu cầu tối thiểu {passing_score}%) và nhận +{reward_xp} XP."
            )
        else:
            feedback = (
                f"Bạn đạt {score}%, chưa đạt ngưỡng đỗ {passing_score}%. "
                "Hãy ôn tập lại từ vựng & ngữ pháp để mở khóa bài tiếp theo nhé!"
            )

        self._save_user_progress(full_progress)

        pct = round((len(completed_list) / max(len(all_lessons), 1)) * 100, 1)

        return LessonCompleteResponse(
            success=True,
            passed=passed,
            course_id=course_id,
            completed_lesson_id=lesson_id,
            score=score,
            min_passing_score=passing_score,
            earned_xp=earned_xp,
            next_lesson_id=next_lid,
            unlocked_new_unit=False,
            course_progress_percentage=pct,
            feedback_message=feedback,
        )

    def _generate_lesson_quiz(self, vocabularies: list[VocabularyRead], count: int = 5) -> list[QuizQuestion]:
        if not vocabularies:
            return []

        selected = random.sample(vocabularies, min(count, len(vocabularies)))
        questions: list[QuizQuestion] = []

        for target in selected:
            distractors = [v.vietnamese_meaning for v in vocabularies if v.id != target.id]
            if len(distractors) < 3:
                distractors.extend(["sự gia tăng", "sự cân nhắc", "khả năng tương thích"])
            picked = random.sample(distractors, 3)
            opts = [target.vietnamese_meaning, *picked]
            random.shuffle(opts)

            explanation = f"'{target.word}' ({target.ipa_uk}): {target.vietnamese_meaning}.\nVí dụ: {target.example}"

            questions.append(
                QuizQuestion(
                    id=target.id,
                    word=target.word,
                    level=target.level,
                    part_of_speech=target.part_of_speech,
                    ipa_uk=target.ipa_uk,
                    question_type="word_to_meaning",
                    prompt=f"Từ '{target.word}' ({target.part_of_speech}) có nghĩa là gì?",
                    correct_answer=target.vietnamese_meaning,
                    options=opts,
                    example=target.example,
                    explanation=explanation,
                )
            )

        return questions
