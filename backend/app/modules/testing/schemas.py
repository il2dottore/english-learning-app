from pydantic import BaseModel, Field


class TestGenerateRequest(BaseModel):
    level: str = Field(default="ALL", description="B2, C1 or ALL")
    count: int = Field(default=10, ge=3, le=30, description="Number of questions")
    mode: str = Field(default="standard", description="quick, standard, custom, mistakes")


class TestQuestionItem(BaseModel):
    id: int
    word: str
    level: str
    part_of_speech: str
    ipa_uk: str
    question_type: str = "word_to_meaning"
    prompt: str
    correct_answer: str
    options: list[str]
    example: str
    explanation: str


class TestAnswerSubmission(BaseModel):
    question_id: int
    selected_answer: str


class TestSubmitRequest(BaseModel):
    title: str = Field(default="Vocabulary Challenge")
    level: str = Field(default="ALL")
    mode: str = Field(default="standard")
    duration_seconds: int = Field(default=0, ge=0)
    answers: list[TestAnswerSubmission]


class QuestionEvaluation(BaseModel):
    question_id: int
    word: str
    level: str
    part_of_speech: str
    ipa_uk: str
    user_answer: str
    correct_answer: str
    is_correct: bool
    explanation: str
    example: str


class TestResultResponse(BaseModel):
    id: str
    timestamp: str
    title: str
    level: str
    mode: str
    total_questions: int
    correct_count: int
    score_percentage: float
    rating_label: str
    xp_earned: int
    duration_seconds: int
    streak_updated: bool
    current_streak: int
    questions_detail: list[QuestionEvaluation]


class TestHistoryItem(BaseModel):
    id: str
    timestamp: str
    title: str
    level: str
    mode: str
    total_questions: int
    correct_count: int
    score_percentage: float
    rating_label: str
    xp_earned: int
    duration_seconds: int


class TestHistoryResponse(BaseModel):
    total_tests: int
    average_score: float
    total_xp: int
    items: list[TestHistoryItem]


class MistakeItem(BaseModel):
    vocab_id: int
    word: str
    level: str
    part_of_speech: str
    ipa_uk: str
    vietnamese_meaning: str
    example: str
    fail_count: int
    last_failed_at: str


class MistakeListResponse(BaseModel):
    total_mistakes: int
    items: list[MistakeItem]
