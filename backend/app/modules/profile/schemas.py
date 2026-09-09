from typing import Any

from pydantic import BaseModel, Field


class UserInfo(BaseModel):
    id: str
    name: str
    email: str
    avatar_initials: str
    bio: str
    joined_date: str
    is_authenticated: bool = True


class UserGoals(BaseModel):
    target_level: str = "C1"
    target_cert: str = "IELTS 7.5+ / Cambridge CAE"
    daily_vocab_target: int = 30
    daily_time_target_minutes: int = 30
    preferred_accent: str = "en-GB"
    reminder_time: str = "20:00"


class UserPreferences(BaseModel):
    sound_effects: bool = True
    auto_play_audio: bool = True
    dark_mode: bool = True


class BadgeItem(BaseModel):
    id: str
    title: str
    desc: str
    icon: str
    category: str
    is_unlocked: bool
    unlocked_date: str | None = None
    progress_pct: float = 0.0


class UserProfileResponse(BaseModel):
    user: UserInfo
    goals: UserGoals
    preferences: UserPreferences
    badges: list[BadgeItem]
    total_vocab_mastered: int
    current_streak: int
    total_tests_taken: int


class UserProfileUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    bio: str | None = None
    avatar_initials: str | None = None


class UserGoalsUpdate(BaseModel):
    target_level: str | None = None
    target_cert: str | None = None
    daily_vocab_target: int | None = Field(default=None, ge=5, le=100)
    daily_time_target_minutes: int | None = Field(default=None, ge=5, le=120)
    preferred_accent: str | None = None
    reminder_time: str | None = None


class BackupDataPackage(BaseModel):
    version: str = "1.0.0"
    exported_at: str
    profile: dict[str, Any]
    progress: dict[str, Any]


class ResetProgressRequest(BaseModel):
    confirm_text: str = Field(description="Must be 'RESET' to confirm")
