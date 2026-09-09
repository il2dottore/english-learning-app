from fastapi import APIRouter

from app.modules.skills.schemas import (
    DictationCheckRequest,
    DictationCheckResponse,
    DictationExercise,
    GrammarSubmitRequest,
    GrammarSubmitResponse,
    GrammarTopicDetail,
    GrammarTopicOverview,
    ReadingArticleDetail,
    ReadingArticleOverview,
    ReadingSubmitRequest,
    ReadingSubmitResponse,
)
from app.modules.skills.service import SkillsService

router = APIRouter(prefix="/api/skills", tags=["skills"])


# ---------------------------------------------------------------------------
# Reading Endpoints
# ---------------------------------------------------------------------------
@router.get("/reading/articles", response_model=list[ReadingArticleOverview])
def list_reading_articles(level: str | None = None) -> list[ReadingArticleOverview]:
    service = SkillsService.get_instance()
    return service.list_reading_articles(level=level)


@router.get("/reading/articles/{article_id}", response_model=ReadingArticleDetail)
def get_reading_article(article_id: str) -> ReadingArticleDetail:
    service = SkillsService.get_instance()
    return service.get_reading_article(article_id=article_id)


@router.post("/reading/articles/{article_id}/submit", response_model=ReadingSubmitResponse)
def submit_reading_quiz(article_id: str, req: ReadingSubmitRequest) -> ReadingSubmitResponse:
    service = SkillsService.get_instance()
    return service.submit_reading_quiz(article_id=article_id, req=req)


# ---------------------------------------------------------------------------
# Listening Dictation Endpoints
# ---------------------------------------------------------------------------
@router.get("/listening/exercises", response_model=list[DictationExercise])
def get_dictation_exercises(count: int = 10, level: str | None = None) -> list[DictationExercise]:
    service = SkillsService.get_instance()
    return service.get_dictation_exercises(count=count, level=level)


@router.post("/listening/check", response_model=DictationCheckResponse)
def check_dictation(req: DictationCheckRequest) -> DictationCheckResponse:
    service = SkillsService.get_instance()
    return service.check_dictation(req=req)


# ---------------------------------------------------------------------------
# Grammar Endpoints
# ---------------------------------------------------------------------------
@router.get("/grammar/topics", response_model=list[GrammarTopicOverview])
def list_grammar_topics(level: str | None = None) -> list[GrammarTopicOverview]:
    service = SkillsService.get_instance()
    return service.list_grammar_topics(level=level)


@router.get("/grammar/topics/{topic_id}", response_model=GrammarTopicDetail)
def get_grammar_topic(topic_id: str) -> GrammarTopicDetail:
    service = SkillsService.get_instance()
    return service.get_grammar_topic(topic_id=topic_id)


@router.post("/grammar/topics/{topic_id}/submit", response_model=GrammarSubmitResponse)
def submit_grammar_quiz(topic_id: str, req: GrammarSubmitRequest) -> GrammarSubmitResponse:
    service = SkillsService.get_instance()
    return service.submit_grammar_quiz(topic_id=topic_id, req=req)
