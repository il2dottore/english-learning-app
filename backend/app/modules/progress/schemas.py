from pydantic import BaseModel

from app.modules.testing.schemas import TestHistoryItem


class StreakInfo(BaseModel):
    current_streak: int
    longest_streak: int
    is_active_today: bool
    active_dates: list[str]


class DayActivityItem(BaseModel):
    day_name: str
    date_str: str
    vocab_reviewed: int
    tests_completed: int
    lessons_completed: int
    xp_earned: int
    is_active: bool


class VocabMasteryStats(BaseModel):
    total_vocab: int
    b2_total: int
    b2_mastered: int
    b2_learning: int
    b2_percentage: float
    c1_total: int
    c1_mastered: int
    c1_learning: int
    c1_percentage: float
    overall_mastered: int
    overall_learning: int
    starred_count: int


class CourseProgressSummary(BaseModel):
    b2_completed_lessons: int
    b2_total_lessons: int
    b2_percentage: float
    c1_completed_lessons: int
    c1_total_lessons: int
    c1_percentage: float


class DashboardSummaryResponse(BaseModel):
    streak: StreakInfo
    last_7_days_activity: list[DayActivityItem]
    vocab_mastery: VocabMasteryStats
    course_progress: CourseProgressSummary
    recent_tests: list[TestHistoryItem]
    total_xp: int
    accuracy_rate: float
    words_reviewed_today: int
