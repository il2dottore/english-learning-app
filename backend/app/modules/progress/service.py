import json
import logging
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

from app.modules.courses.service import CourseService
from app.modules.progress.schemas import (
    CourseProgressSummary,
    DashboardSummaryResponse,
    DayActivityItem,
    StreakInfo,
    VocabMasteryStats,
)
from app.modules.testing.schemas import TestHistoryItem
from app.modules.vocabulary.json_store import VocabularyJsonStore

logger = logging.getLogger(__name__)


class ProgressService:
    _instance: "ProgressService | None" = None

    def __init__(self) -> None:
        self.data_dir = Path(__file__).resolve().parents[4] / "data"
        self.progress_file = self.data_dir / "user_progress.json"
        self.vocab_store = VocabularyJsonStore.get_instance()
        self.course_service = CourseService.get_instance()

    @classmethod
    def get_instance(cls) -> "ProgressService":
        if cls._instance is None:
            cls._instance = ProgressService()
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

    def get_dashboard_summary(self) -> DashboardSummaryResponse:
        data = self._get_progress_data()
        now_utc = datetime.now(UTC)
        today_str = now_utc.strftime("%Y-%m-%d")

        # 1. Streak Info
        streak_dict = data.get("streak_data", {})
        active_dates = streak_dict.get("active_dates", [])
        is_active_today = today_str in active_dates
        streak_info = StreakInfo(
            current_streak=streak_dict.get("current_streak", 0),
            longest_streak=streak_dict.get("longest_streak", 0),
            is_active_today=is_active_today,
            active_dates=active_dates[-30:],  # last 30 active days
        )

        # 2. Last 7 Days Activity
        day_names = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]
        daily_activities = data.get("daily_activities", {})
        activity_list: list[DayActivityItem] = []

        for i in range(6, -1, -1):
            target_date = now_utc - timedelta(days=i)
            d_str = target_date.strftime("%Y-%m-%d")
            weekday_idx = target_date.weekday()
            act_entry = daily_activities.get(d_str, {})

            vocab_c = act_entry.get("vocab_reviewed", 0)
            tests_c = act_entry.get("tests_completed", 0)
            lessons_c = act_entry.get("lessons_completed", 0)
            xp = act_entry.get("xp_earned", 0)

            activity_list.append(
                DayActivityItem(
                    day_name=day_names[weekday_idx],
                    date_str=d_str,
                    vocab_reviewed=vocab_c,
                    tests_completed=tests_c,
                    lessons_completed=lessons_c,
                    xp_earned=xp,
                    is_active=(vocab_c + tests_c + lessons_c) > 0,
                )
            )

        # 3. Vocab Mastery (B2 & C1 breakdown)
        reviews = data.get("reviews", {})
        b2_mastered = 0
        b2_learning = 0
        c1_mastered = 0
        c1_learning = 0

        for vid_str, r in reviews.items():
            try:
                vocab = self.vocab_store.get_by_id(int(vid_str))
                status = r.get("status", "learning")
                if vocab.level == "B2":
                    if status == "mastered":
                        b2_mastered += 1
                    else:
                        b2_learning += 1
                elif vocab.level == "C1":
                    if status == "mastered":
                        c1_mastered += 1
                    else:
                        c1_learning += 1
            except Exception:
                continue

        b2_total = 700
        c1_total = 1315
        total_vocab = b2_total + c1_total

        b2_pct = round((b2_mastered / b2_total) * 100, 1)
        c1_pct = round((c1_mastered / c1_total) * 100, 1)
        starred_count = len(data.get("starred", []))

        vocab_mastery = VocabMasteryStats(
            total_vocab=total_vocab,
            b2_total=b2_total,
            b2_mastered=b2_mastered,
            b2_learning=b2_learning,
            b2_percentage=b2_pct,
            c1_total=c1_total,
            c1_mastered=c1_mastered,
            c1_learning=c1_learning,
            c1_percentage=c1_pct,
            overall_mastered=b2_mastered + c1_mastered,
            overall_learning=b2_learning + c1_learning,
            starred_count=starred_count,
        )

        # 4. Course Progress
        cp = data.get("course_progress", {})
        b2_completed = len(cp.get("b2-first", {}).get("completed_lessons", []))
        c1_completed = len(cp.get("c1-advanced", {}).get("completed_lessons", []))

        course_progress = CourseProgressSummary(
            b2_completed_lessons=b2_completed,
            b2_total_lessons=24,
            b2_percentage=round((b2_completed / 24) * 100, 1),
            c1_completed_lessons=c1_completed,
            c1_total_lessons=16,
            c1_percentage=round((c1_completed / 16) * 100, 1),
        )

        # 5. Recent Tests & Accuracies
        test_hist = data.get("test_history", [])
        recent_tests: list[TestHistoryItem] = []
        for h in reversed(test_hist[-5:]):
            recent_tests.append(
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
            )

        total_tests = len(test_hist)
        accuracy_rate = (
            round(sum(h.get("score_percentage", 0.0) for h in test_hist) / total_tests, 1) if total_tests > 0 else 0.0
        )
        total_xp = sum(h.get("xp_earned", 0) for h in test_hist)

        # Words reviewed today
        today_activity = daily_activities.get(today_str, {})
        words_today = today_activity.get("vocab_reviewed", 0)

        return DashboardSummaryResponse(
            streak=streak_info,
            last_7_days_activity=activity_list,
            vocab_mastery=vocab_mastery,
            course_progress=course_progress,
            recent_tests=recent_tests,
            total_xp=total_xp,
            accuracy_rate=accuracy_rate,
            words_reviewed_today=words_today,
        )
