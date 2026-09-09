import json
import logging
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from app.modules.profile.schemas import (
    BackupDataPackage,
    BadgeItem,
    UserGoals,
    UserGoalsUpdate,
    UserInfo,
    UserPreferences,
    UserProfileResponse,
    UserProfileUpdate,
)
from app.modules.vocabulary.json_store import VocabularyJsonStore

logger = logging.getLogger(__name__)


class ProfileService:
    _instance: "ProfileService | None" = None

    def __init__(self) -> None:
        self.data_dir = Path(__file__).resolve().parents[4] / "data"
        self.profile_file = self.data_dir / "user_profile.json"
        self.progress_file = self.data_dir / "user_progress.json"
        self.vocab_store = VocabularyJsonStore.get_instance()

    @classmethod
    def get_instance(cls) -> "ProfileService":
        if cls._instance is None:
            cls._instance = ProfileService()
        return cls._instance

    def _get_profile_data(self) -> dict[str, Any]:
        if not self.profile_file.exists():
            default_data = {
                "user": {
                    "id": "usr_default",
                    "name": "Nguyễn Long",
                    "email": "long.nguyen@example.com",
                    "avatar_initials": "NL",
                    "bio": "Mục tiêu chinh phục chứng chỉ C1 CAE & IELTS 7.5+ trong năm 2026.",
                    "joined_date": "2026-09-01",
                    "is_authenticated": True,
                },
                "goals": {
                    "target_level": "C1",
                    "target_cert": "IELTS 7.5+ / Cambridge CAE",
                    "daily_vocab_target": 30,
                    "daily_time_target_minutes": 30,
                    "preferred_accent": "en-GB",
                    "reminder_time": "20:00",
                },
                "preferences": {
                    "sound_effects": True,
                    "auto_play_audio": True,
                    "dark_mode": True,
                },
            }
            self._save_profile_data(default_data)
            return default_data

        try:
            with open(self.profile_file, encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error("Failed to read user_profile.json: %s", e)
            return {}

    def _save_profile_data(self, data: dict[str, Any]) -> None:
        try:
            with open(self.profile_file, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error("Failed to save user_profile.json: %s", e)

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

    def get_profile(self) -> UserProfileResponse:
        pdata = self._get_profile_data()
        prog = self._get_progress_data()

        user_dict = pdata.get("user", {})
        goals_dict = pdata.get("goals", {})
        pref_dict = pdata.get("preferences", {})

        # Compute real statistics from progress
        reviews = prog.get("reviews", {})
        total_mastered = 0
        b2_mastered = 0
        c1_mastered = 0

        for vid_str, r in reviews.items():
            if r.get("status") == "mastered":
                total_mastered += 1
                try:
                    vocab = self.vocab_store.get_by_id(int(vid_str))
                    if vocab.level == "B2":
                        b2_mastered += 1
                    elif vocab.level == "C1":
                        c1_mastered += 1
                except Exception:
                    pass

        streak_dict = prog.get("streak_data", {})
        current_streak = streak_dict.get("current_streak", 0)
        longest_streak = streak_dict.get("longest_streak", 0)

        test_history = prog.get("test_history", [])
        total_tests = len(test_history)
        has_perfect_test = any(t.get("score_percentage", 0) >= 100 for t in test_history)

        completed_articles = len(prog.get("skills_progress", {}).get("reading", {}).get("completed_articles", []))

        # Dynamic Badges Evaluation
        badges: list[BadgeItem] = [
            BadgeItem(
                id="badge_vocab_50",
                title="Tân Binh Khởi Động",
                desc="Làm chủ 50 từ vựng đầu tiên trong kho JSON",
                icon="🌟",
                category="Vocabulary",
                is_unlocked=total_mastered >= 50,
                unlocked_date="2026-09-09" if total_mastered >= 50 else None,
                progress_pct=min(round((total_mastered / 50) * 100, 1), 100.0),
            ),
            BadgeItem(
                id="badge_b2_core",
                title="Chinh Phục B2 First",
                desc="Làm chủ ít nhất 350 từ vựng B2 FCE",
                icon="🏆",
                category="Mastery",
                is_unlocked=b2_mastered >= 350,
                unlocked_date="2026-09-09" if b2_mastered >= 350 else None,
                progress_pct=min(round((b2_mastered / 350) * 100, 1), 100.0),
            ),
            BadgeItem(
                id="badge_c1_fluency",
                title="Tinh Hoa C1 Advanced",
                desc="Làm chủ ít nhất 500 từ vựng C1 CAE học thuật",
                icon="💎",
                category="Mastery",
                is_unlocked=c1_mastered >= 500,
                unlocked_date=None,
                progress_pct=min(round((c1_mastered / 500) * 100, 1), 100.0),
            ),
            BadgeItem(
                id="badge_streak_3",
                title="Chiến Binh Giữ Lửa",
                desc="Duy trì chuỗi học liên tục 3 ngày",
                icon="🔥",
                category="Streak",
                is_unlocked=longest_streak >= 3,
                unlocked_date="2026-09-09" if longest_streak >= 3 else None,
                progress_pct=min(round((longest_streak / 3) * 100, 1), 100.0),
            ),
            BadgeItem(
                id="badge_streak_7",
                title="Bậc Thầy Kỷ Luật",
                desc="Duy trì chuỗi học liên tục 7 ngày",
                icon="⚡",
                category="Streak",
                is_unlocked=longest_streak >= 7,
                unlocked_date=None,
                progress_pct=min(round((longest_streak / 7) * 100, 1), 100.0),
            ),
            BadgeItem(
                id="badge_perfect_quiz",
                title="Xạ Thủ Checkpoint",
                desc="Đạt điểm tuyệt đối 100% trong bài kiểm tra",
                icon="🎯",
                category="Assessment",
                is_unlocked=has_perfect_test,
                unlocked_date="2026-09-09" if has_perfect_test else None,
                progress_pct=100.0 if has_perfect_test else 0.0,
            ),
            BadgeItem(
                id="badge_scholar_reading",
                title="Học Giả Đọc Hiểu",
                desc="Đọc hiểu và vượt qua ít nhất 2 bài báo học thuật",
                icon="📖",
                category="Reading",
                is_unlocked=completed_articles >= 2,
                unlocked_date="2026-09-09" if completed_articles >= 2 else None,
                progress_pct=min(round((completed_articles / 2) * 100, 1), 100.0),
            ),
        ]

        return UserProfileResponse(
            user=UserInfo(**user_dict),
            goals=UserGoals(**goals_dict),
            preferences=UserPreferences(**pref_dict),
            badges=badges,
            total_vocab_mastered=total_mastered,
            current_streak=current_streak,
            total_tests_taken=total_tests,
        )

    def update_profile(self, req: UserProfileUpdate) -> UserProfileResponse:
        data = self._get_profile_data()
        user_entry = data.setdefault("user", {})

        if req.name is not None:
            user_entry["name"] = req.name.strip()
            # auto update initials if not provided
            parts = req.name.strip().split()
            if len(parts) >= 2:
                user_entry["avatar_initials"] = f"{parts[0][0]}{parts[-1][0]}".upper()
            elif len(parts) == 1 and parts[0]:
                user_entry["avatar_initials"] = parts[0][:2].upper()

        if req.email is not None:
            user_entry["email"] = req.email.strip()
        if req.bio is not None:
            user_entry["bio"] = req.bio.strip()
        if req.avatar_initials is not None:
            user_entry["avatar_initials"] = req.avatar_initials.strip()

        self._save_profile_data(data)
        return self.get_profile()

    def update_goals(self, req: UserGoalsUpdate) -> UserProfileResponse:
        data = self._get_profile_data()
        goals_entry = data.setdefault("goals", {})

        if req.target_level is not None:
            goals_entry["target_level"] = req.target_level
        if req.target_cert is not None:
            goals_entry["target_cert"] = req.target_cert
        if req.daily_vocab_target is not None:
            goals_entry["daily_vocab_target"] = req.daily_vocab_target
        if req.daily_time_target_minutes is not None:
            goals_entry["daily_time_target_minutes"] = req.daily_time_target_minutes
        if req.preferred_accent is not None:
            goals_entry["preferred_accent"] = req.preferred_accent
        if req.reminder_time is not None:
            goals_entry["reminder_time"] = req.reminder_time

        self._save_profile_data(data)
        return self.get_profile()

    def export_backup(self) -> BackupDataPackage:
        pdata = self._get_profile_data()
        prog = self._get_progress_data()
        return BackupDataPackage(
            version="1.0.0",
            exported_at=datetime.now(UTC).isoformat(),
            profile=pdata,
            progress=prog,
        )

    def import_backup(self, pkg: BackupDataPackage) -> bool:
        if pkg.profile:
            self._save_profile_data(pkg.profile)
        if pkg.progress:
            self._save_progress_data(pkg.progress)
        return True

    def reset_progress(self) -> bool:
        blank_progress = {
            "starred": [],
            "reviews": {},
            "course_progress": {},
            "skills_progress": {},
            "streak_data": {
                "current_streak": 0,
                "longest_streak": 0,
                "last_activity_date": None,
                "active_dates": [],
            },
            "daily_activities": {},
            "test_history": [],
            "mistake_frequency": {},
        }
        self._save_progress_data(blank_progress)
        return True
