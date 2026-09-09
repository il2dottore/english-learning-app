import contextlib
import json
import logging
import random
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from app.modules.testing.schemas import (
    MistakeItem,
    MistakeListResponse,
    QuestionEvaluation,
    TestGenerateRequest,
    TestHistoryItem,
    TestHistoryResponse,
    TestQuestionItem,
    TestResultResponse,
    TestSubmitRequest,
)
from app.modules.vocabulary.json_store import VocabularyJsonStore
from app.modules.vocabulary.schemas import VocabularyRead

logger = logging.getLogger(__name__)


class TestingService:
    _instance: "TestingService | None" = None

    def __init__(self) -> None:
        self.data_dir = Path(__file__).resolve().parents[4] / "data"
        self.progress_file = self.data_dir / "user_progress.json"
        self.vocab_store = VocabularyJsonStore.get_instance()

    @classmethod
    def get_instance(cls) -> "TestingService":
        if cls._instance is None:
            cls._instance = TestingService()
        return cls._instance

    def _get_progress_data(self) -> dict[str, Any]:
        if not self.progress_file.exists():
            return {}
        try:
            with open(self.progress_file, encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error("Failed to read user_progress.json: %s", e)
            return {}

    def _save_progress_data(self, data: dict[str, Any]) -> None:
        try:
            with open(self.progress_file, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error("Failed to save user_progress.json: %s", e)

    def generate_test(self, req: TestGenerateRequest) -> list[TestQuestionItem]:
        candidates: list[VocabularyRead] = []

        if req.mode == "mistakes":
            # Priority: words in mistake_frequency
            progress = self._get_progress_data()
            mistakes_map = progress.get("mistake_frequency", {})
            sorted_vids = sorted(
                mistakes_map.keys(),
                key=lambda vid: mistakes_map[vid].get("fail_count", 0),
                reverse=True,
            )
            for vid_str in sorted_vids:
                with contextlib.suppress(Exception):
                    vid = int(vid_str)
                    candidates.append(self.vocab_store.get_by_id(vid))

            # If not enough mistake words, fill with words of requested level
            if len(candidates) < req.count:
                extra = self.vocab_store.get_all(level=req.level if req.level != "ALL" else None)
                existing_ids = {c.id for c in candidates}
                for v in extra:
                    if v.id not in existing_ids:
                        candidates.append(v)
                    if len(candidates) >= req.count * 2:
                        break
        else:
            candidates = self.vocab_store.get_all(level=req.level if req.level != "ALL" else None)

        if not candidates:
            return []

        selected_count = min(req.count, len(candidates))
        selected = random.sample(candidates, selected_count)
        all_meanings = [v.vietnamese_meaning for v in candidates]

        questions: list[TestQuestionItem] = []
        for target in selected:
            # Distractors from candidate meanings
            distractors = [m for m in all_meanings if m != target.vietnamese_meaning]
            if len(distractors) < 3:
                distractors.extend(["sự chuyển hóa", "khả năng tương thích", "sự cân nhắc"])
            picked_distractors = random.sample(distractors, 3)

            options = [target.vietnamese_meaning, *picked_distractors]
            random.shuffle(options)

            explanation = (
                f"'{target.word}' ({target.part_of_speech} • {target.ipa_uk}): {target.vietnamese_meaning}.\n"
                f"Ví dụ: {target.example}"
            )

            questions.append(
                TestQuestionItem(
                    id=target.id,
                    word=target.word,
                    level=target.level,
                    part_of_speech=target.part_of_speech,
                    ipa_uk=target.ipa_uk,
                    question_type="word_to_meaning",
                    prompt=f"Từ '{target.word}' ({target.part_of_speech}) có nghĩa là gì?",
                    correct_answer=target.vietnamese_meaning,
                    options=options,
                    example=target.example,
                    explanation=explanation,
                )
            )

        return questions

    def submit_test(self, req: TestSubmitRequest) -> TestResultResponse:
        progress = self._get_progress_data()
        mistakes_map = progress.setdefault("mistake_frequency", {})

        now_utc = datetime.now(UTC)
        timestamp_str = now_utc.isoformat()
        today_str = now_utc.strftime("%Y-%m-%d")

        evaluations: list[QuestionEvaluation] = []
        correct_count = 0

        for ans in req.answers:
            try:
                vocab = self.vocab_store.get_by_id(ans.question_id)
            except Exception:
                continue

            user_ans = ans.selected_answer.strip()
            correct_ans = vocab.vietnamese_meaning.strip()
            is_correct = user_ans == correct_ans

            if is_correct:
                correct_count += 1
            else:
                # Track mistake
                vid_str = str(vocab.id)
                m_entry = mistakes_map.setdefault(
                    vid_str,
                    {
                        "word": vocab.word,
                        "fail_count": 0,
                        "last_failed_at": timestamp_str,
                    },
                )
                m_entry["fail_count"] += 1
                m_entry["last_failed_at"] = timestamp_str

            explanation = (
                f"'{vocab.word}' ({vocab.part_of_speech} • {vocab.ipa_uk}): {vocab.vietnamese_meaning}.\n"
                f"Ví dụ: {vocab.example}"
            )

            evaluations.append(
                QuestionEvaluation(
                    question_id=vocab.id,
                    word=vocab.word,
                    level=vocab.level,
                    part_of_speech=vocab.part_of_speech,
                    ipa_uk=vocab.ipa_uk,
                    user_answer=user_ans,
                    correct_answer=correct_ans,
                    is_correct=is_correct,
                    explanation=explanation,
                    example=vocab.example,
                )
            )

        total_q = max(len(evaluations), 1)
        score_pct = round((correct_count / total_q) * 100, 1)

        # Rating label
        if score_pct >= 90:
            rating_label = "Xuất sắc (Outstanding)"
        elif score_pct >= 75:
            rating_label = "Khá tốt (Good)"
        elif score_pct >= 50:
            rating_label = "Đạt tiêu chuẩn (Fair)"
        else:
            rating_label = "Cần rèn luyện thêm (Needs Practice)"

        # XP calculation: 10 XP per correct question + 20 bonus for 100%
        xp_earned = correct_count * 10 + (20 if score_pct == 100 else 0)

        # Update test history
        test_id = f"test_{int(now_utc.timestamp())}"
        test_history_item = {
            "id": test_id,
            "timestamp": timestamp_str,
            "title": req.title,
            "level": req.level,
            "mode": req.mode,
            "total_questions": len(evaluations),
            "correct_count": correct_count,
            "score_percentage": score_pct,
            "rating_label": rating_label,
            "xp_earned": xp_earned,
            "duration_seconds": req.duration_seconds,
        }
        test_history_list = progress.setdefault("test_history", [])
        test_history_list.append(test_history_item)

        # Update streak and daily activity
        streak_updated, current_streak = self._update_streak_and_activity(progress, today_str, xp_earned)

        self._save_progress_data(progress)

        return TestResultResponse(
            id=test_id,
            timestamp=timestamp_str,
            title=req.title,
            level=req.level,
            mode=req.mode,
            total_questions=len(evaluations),
            correct_count=correct_count,
            score_percentage=score_pct,
            rating_label=rating_label,
            xp_earned=xp_earned,
            duration_seconds=req.duration_seconds,
            streak_updated=streak_updated,
            current_streak=current_streak,
            questions_detail=evaluations,
        )

    def _update_streak_and_activity(self, progress: dict[str, Any], today_str: str, xp_earned: int) -> tuple[bool, int]:
        streak_data = progress.setdefault(
            "streak_data",
            {
                "current_streak": 0,
                "longest_streak": 0,
                "last_activity_date": None,
                "active_dates": [],
            },
        )
        active_dates = streak_data.setdefault("active_dates", [])
        last_date_str = streak_data.get("last_activity_date")
        current_streak = streak_data.get("current_streak", 0)
        longest_streak = streak_data.get("longest_streak", 0)

        streak_updated = False

        if last_date_str != today_str:
            if last_date_str is None:
                current_streak = 1
            else:
                last_dt = datetime.strptime(last_date_str, "%Y-%m-%d")
                today_dt = datetime.strptime(today_str, "%Y-%m-%d")
                diff_days = (today_dt - last_dt).days

                if diff_days == 1:
                    current_streak += 1
                elif diff_days > 1:
                    current_streak = 1

            streak_data["current_streak"] = current_streak
            streak_data["longest_streak"] = max(longest_streak, current_streak)
            streak_data["last_activity_date"] = today_str
            if today_str not in active_dates:
                active_dates.append(today_str)
            streak_updated = True

        # Update daily activities
        daily_map = progress.setdefault("daily_activities", {})
        today_entry = daily_map.setdefault(
            today_str,
            {
                "vocab_reviewed": 0,
                "tests_completed": 0,
                "lessons_completed": 0,
                "xp_earned": 0,
            },
        )
        today_entry["tests_completed"] += 1
        today_entry["xp_earned"] += xp_earned

        return streak_updated, streak_data["current_streak"]

    def get_test_history(self) -> TestHistoryResponse:
        progress = self._get_progress_data()
        raw_list = progress.get("test_history", [])

        items = [
            TestHistoryItem(
                id=h["id"],
                timestamp=h["timestamp"],
                title=h.get("title", "Bài kiểm tra"),
                level=h.get("level", "ALL"),
                mode=h.get("mode", "standard"),
                total_questions=h.get("total_questions", 0),
                correct_count=h.get("correct_count", 0),
                score_percentage=h.get("score_percentage", 0.0),
                rating_label=h.get("rating_label", ""),
                xp_earned=h.get("xp_earned", 0),
                duration_seconds=h.get("duration_seconds", 0),
            )
            for h in reversed(raw_list)
        ]

        total_tests = len(items)
        avg_score = round(sum(i.score_percentage for i in items) / max(total_tests, 1), 1)
        total_xp = sum(i.xp_earned for i in items)

        return TestHistoryResponse(
            total_tests=total_tests,
            average_score=avg_score,
            total_xp=total_xp,
            items=items,
        )

    def get_mistakes(self, limit: int = 30) -> MistakeListResponse:
        progress = self._get_progress_data()
        mistakes_map = progress.get("mistake_frequency", {})

        sorted_items = sorted(
            mistakes_map.items(),
            key=lambda item: item[1].get("fail_count", 0),
            reverse=True,
        )

        result_items: list[MistakeItem] = []
        for vid_str, data in sorted_items[:limit]:
            with contextlib.suppress(Exception):
                vid = int(vid_str)
                vocab = self.vocab_store.get_by_id(vid)
                result_items.append(
                    MistakeItem(
                        vocab_id=vid,
                        word=vocab.word,
                        level=vocab.level,
                        part_of_speech=vocab.part_of_speech,
                        ipa_uk=vocab.ipa_uk,
                        vietnamese_meaning=vocab.vietnamese_meaning,
                        example=vocab.example,
                        fail_count=data.get("fail_count", 1),
                        last_failed_at=data.get("last_failed_at", ""),
                    )
                )

        return MistakeListResponse(
            total_mistakes=len(result_items),
            items=result_items,
        )
