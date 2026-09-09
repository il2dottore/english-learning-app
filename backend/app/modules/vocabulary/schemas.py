from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class VocabularyBase(BaseModel):
    item_number: int
    level: str = Field(description="B2 or C1")
    word: str
    part_of_speech: str = ""
    ipa_uk: str = ""
    synonyms: list[str] = Field(default_factory=list)
    vietnamese_meaning: str = ""
    example: str = ""


class ProgressRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vocabulary_id: int
    box_level: int
    interval_days: int
    ease_factor: float
    repetition_count: int
    last_reviewed_at: datetime | None
    next_review_at: datetime
    status: str
    is_starred: bool


class VocabularyRead(VocabularyBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_starred: bool = False
    progress: ProgressRead | None = None


class VocabularyList(BaseModel):
    items: list[VocabularyRead]
    total: int
    skip: int
    limit: int


class VocabularyStats(BaseModel):
    total: int
    b2_count: int
    c1_count: int
    parts_of_speech: dict[str, int]


class QuizQuestion(BaseModel):
    id: int
    word: str
    level: str
    part_of_speech: str
    ipa_uk: str
    question_type: str
    prompt: str
    correct_answer: str
    options: list[str]
    example: str
    explanation: str


class ReviewPayload(BaseModel):
    rating: int = Field(ge=1, le=3, description="1: Chưa nhớ (Again), 2: Tạm nhớ (Good), 3: Đã thuộc (Easy)")


class SRSQueueStats(BaseModel):
    due_count: int
    learning_count: int
    mastered_count: int
    new_count: int
    starred_count: int


class ExerciseCloze(BaseModel):
    id: int
    word: str
    level: str
    part_of_speech: str
    prompt: str
    cloze_sentence: str
    answer: str
    options: list[str]
    vietnamese_meaning: str
    example: str


class SynonymMatchingItem(BaseModel):
    id: int
    word: str
    synonym: str
    level: str
    part_of_speech: str
