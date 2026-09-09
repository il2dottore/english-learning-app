from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.common.pagination import PaginationParams, pagination_params
from app.modules.vocabulary.schemas import (
    ExerciseCloze,
    ProgressRead,
    QuizQuestion,
    ReviewPayload,
    SRSQueueStats,
    SynonymMatchingItem,
    VocabularyList,
    VocabularyRead,
    VocabularyStats,
)
from app.modules.vocabulary.service import VocabularyService

router = APIRouter(prefix="/api/vocabulary", tags=["vocabulary"])
service = VocabularyService()


@router.get("/stats", response_model=VocabularyStats)
def get_vocabulary_stats() -> VocabularyStats:
    """Get overall vocabulary statistics directly from B2 and C1 JSON files."""
    return service.get_stats()


@router.get("/srs/stats", response_model=SRSQueueStats)
def get_srs_queue_stats() -> SRSQueueStats:
    """Get Spaced Repetition queue statistics (due today, learning, mastered, starred)."""
    return service.get_srs_stats()


@router.get("/srs/queue", response_model=list[VocabularyRead])
def get_srs_due_queue(
    limit: Annotated[int, Query(ge=1, le=50)] = 20,
    level: Annotated[str | None, Query(pattern="^(?i)(b2|c1)$")] = None,
) -> list[VocabularyRead]:
    """Get words that are due for review according to the Spaced Repetition schedule."""
    return service.get_due_srs_queue(limit=limit, level=level)


@router.get("/starred", response_model=VocabularyList)
def get_starred_vocabulary(
    pagination: Annotated[PaginationParams, Depends(pagination_params)],
) -> VocabularyList:
    """Get the user's personal notebook of starred/saved words."""
    return service.get_starred_list(skip=pagination.skip, limit=pagination.limit)


@router.get("/random", response_model=list[VocabularyRead])
def get_random_flashcards(
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    level: Annotated[str | None, Query(pattern="^(?i)(b2|c1)$")] = None,
) -> list[VocabularyRead]:
    """Get a random batch of vocabulary items directly from JSON for flashcards."""
    return service.get_random_flashcards(limit=limit, level=level)


@router.get("/exercises/cloze", response_model=list[ExerciseCloze])
def get_cloze_exercises(
    count: Annotated[int, Query(ge=1, le=30)] = 10,
    level: Annotated[str | None, Query(pattern="^(?i)(b2|c1)$")] = None,
) -> list[ExerciseCloze]:
    """Get fill-in-the-blank context exercises generated from JSON example sentences."""
    return service.generate_cloze_exercises(count=count, level=level)


@router.get("/exercises/synonyms", response_model=list[SynonymMatchingItem])
def get_synonym_matching_items(
    count: Annotated[int, Query(ge=2, le=20)] = 6,
    level: Annotated[str | None, Query(pattern="^(?i)(b2|c1)$")] = None,
) -> list[SynonymMatchingItem]:
    """Get word and synonym pairs directly from JSON for the Synonym Matching challenge."""
    return service.generate_synonym_matching(count=count, level=level)


@router.get("/quiz", response_model=list[QuizQuestion])
def get_quiz_questions(
    count: Annotated[int, Query(ge=1, le=50)] = 10,
    level: Annotated[str | None, Query(pattern="^(?i)(b2|c1)$")] = None,
) -> list[QuizQuestion]:
    """Generate dynamic multiple-choice quiz questions based on the JSON vocabulary."""
    return service.generate_quiz(count=count, level=level)


@router.get("", response_model=VocabularyList)
def list_vocabularies(
    pagination: Annotated[PaginationParams, Depends(pagination_params)],
    level: Annotated[str | None, Query(pattern="^(?i)(b2|c1)$")] = None,
    search: Annotated[str | None, Query(max_length=100)] = None,
    part_of_speech: Annotated[str | None, Query(max_length=30)] = None,
) -> VocabularyList:
    """List vocabulary items directly from JSON with pagination, keyword search, and filters."""
    return service.list_vocabularies(
        skip=pagination.skip,
        limit=pagination.limit,
        level=level,
        search=search,
        part_of_speech=part_of_speech,
    )


@router.post("/{vocab_id}/review", response_model=ProgressRead)
def submit_word_review(
    vocab_id: int,
    payload: ReviewPayload,
) -> ProgressRead:
    """Submit a self-evaluation rating (1: Again, 2: Good, 3: Easy) to update SRS status."""
    return service.submit_review(vocab_id=vocab_id, rating=payload.rating)


@router.post("/{vocab_id}/star")
def toggle_word_star(
    vocab_id: int,
) -> dict[str, bool]:
    """Toggle star/bookmark status for a vocabulary item."""
    is_starred = service.toggle_star(vocab_id=vocab_id)
    return {"is_starred": is_starred}


@router.get("/{vocab_id}", response_model=VocabularyRead)
def get_vocabulary_detail(
    vocab_id: int,
) -> VocabularyRead:
    """Get details for a single vocabulary item by ID."""
    return service.get_vocabulary(vocab_id)
