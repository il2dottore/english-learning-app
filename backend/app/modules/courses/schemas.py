from pydantic import BaseModel, Field

from app.modules.vocabulary.schemas import QuizQuestion, VocabularyRead


class LessonOverview(BaseModel):
    id: str
    lesson_number: int
    title: str
    vocab_count: int
    grammar_focus: str
    reading_topic: str
    estimated_minutes: int
    xp: int
    is_completed: bool = False
    is_unlocked: bool = False
    score: int | None = None


class UnitOverview(BaseModel):
    id: str
    unit_number: int
    title: str
    description: str
    lessons: list[LessonOverview]
    completed_count: int
    total_lessons: int
    progress_percentage: float


class CourseOverview(BaseModel):
    id: str
    level: str
    title: str
    description: str
    total_units: int
    total_lessons: int
    total_vocab: int
    completed_lessons_count: int
    progress_percentage: float
    current_lesson_id: str | None = None


class CourseDetail(CourseOverview):
    units: list[UnitOverview]


class ContrastExample(BaseModel):
    incorrect: str | None = None
    correct: str | None = None
    basic: str | None = None
    advanced: str | None = None
    explanation: str


class GrammarLessonDetail(BaseModel):
    concept: str
    formula: str
    rules: list[str]
    contrast_examples: list[ContrastExample] = []


class ReadingPassageDetail(BaseModel):
    title: str
    passage: str
    highlight_words: list[str] = []


class LessonDetail(BaseModel):
    id: str
    course_id: str
    unit_id: str
    lesson_number: int
    title: str
    unit_title: str
    course_title: str
    level: str
    grammar_focus: str
    grammar_notes: str
    reading_topic: str
    reading_text: str
    grammar_lesson: GrammarLessonDetail | None = None
    reading_passage: ReadingPassageDetail | None = None
    passing_score_pct: int = 60
    reward_xp: int = 60
    vocabularies: list[VocabularyRead]
    checkpoint_quiz: list[QuizQuestion]
    is_completed: bool
    is_unlocked: bool


class LessonCompletePayload(BaseModel):
    score: int = Field(ge=0, le=100, description="Score percentage (0-100)")


class LessonCompleteResponse(BaseModel):
    success: bool
    passed: bool = True
    course_id: str
    completed_lesson_id: str
    score: int
    min_passing_score: int = 60
    earned_xp: int = 0
    next_lesson_id: str | None
    unlocked_new_unit: bool
    course_progress_percentage: float
    feedback_message: str = ""
