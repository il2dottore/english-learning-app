from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Reading Schemas
# ---------------------------------------------------------------------------
class HighlightedVocabItem(BaseModel):
    word: str
    ipa: str
    part_of_speech: str
    meaning: str
    context: str


class ComprehensionQuestion(BaseModel):
    id: int
    prompt: str
    options: list[str]
    correct_answer: str
    explanation: str


class ReadingArticleOverview(BaseModel):
    id: str
    level: str
    topic: str
    title: str
    reading_time_minutes: int
    summary: str
    is_completed: bool = False
    score: int | None = None


class ReadingArticleDetail(ReadingArticleOverview):
    paragraphs: list[str]
    highlighted_vocab: list[HighlightedVocabItem]
    comprehension_questions: list[ComprehensionQuestion]


class ReadingSubmitRequest(BaseModel):
    answers: dict[int, str] = Field(description="Mapping of question ID to chosen option")


class ReadingSubmitResponse(BaseModel):
    success: bool
    article_id: str
    score: int
    total_questions: int
    score_percentage: float
    xp_earned: int
    is_passed: bool


# ---------------------------------------------------------------------------
# Listening Dictation Schemas
# ---------------------------------------------------------------------------
class DictationExercise(BaseModel):
    id: int
    sentence: str
    level: str
    target_word: str
    vietnamese_meaning: str
    part_of_speech: str
    ipa_uk: str


class DictationCheckRequest(BaseModel):
    exercise_id: int
    user_input: str


class WordDiffItem(BaseModel):
    word: str
    is_correct: bool
    expected: str


class DictationCheckResponse(BaseModel):
    is_perfect: bool
    accuracy_percentage: float
    user_text: str
    expected_text: str
    diffs: list[WordDiffItem]
    xp_earned: int


# ---------------------------------------------------------------------------
# Grammar Schemas
# ---------------------------------------------------------------------------
class GrammarExample(BaseModel):
    basic: str
    advanced: str
    note: str


class GrammarQuestion(BaseModel):
    id: int
    prompt: str
    options: list[str]
    correct_answer: str
    explanation: str


class GrammarTopicOverview(BaseModel):
    id: str
    level: str
    title: str
    category: str
    formula: str
    is_completed: bool = False
    score: int | None = None


class GrammarTopicDetail(GrammarTopicOverview):
    description: str
    examples: list[GrammarExample]
    practice_questions: list[GrammarQuestion]


class GrammarSubmitRequest(BaseModel):
    answers: dict[int, str] = Field(description="Mapping of question ID to chosen option")


class GrammarSubmitResponse(BaseModel):
    success: bool
    topic_id: str
    score: int
    total_questions: int
    score_percentage: float
    xp_earned: int
    is_passed: bool
