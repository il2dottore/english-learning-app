from app.modules.vocabulary.json_store import VocabularyJsonStore
from app.modules.vocabulary.schemas import (
    ExerciseCloze,
    ProgressRead,
    QuizQuestion,
    SRSQueueStats,
    SynonymMatchingItem,
    VocabularyList,
    VocabularyRead,
    VocabularyStats,
)


class VocabularyService:
    def __init__(self) -> None:
        self.store = VocabularyJsonStore.get_instance()

    def get_vocabulary(self, vocab_id: int) -> VocabularyRead:
        return self.store.get_by_id(vocab_id)

    def list_vocabularies(
        self,
        skip: int = 0,
        limit: int = 50,
        level: str | None = None,
        search: str | None = None,
        part_of_speech: str | None = None,
    ) -> VocabularyList:
        return self.store.list_items(
            skip=skip,
            limit=limit,
            level=level,
            search=search,
            part_of_speech=part_of_speech,
        )

    def get_random_flashcards(
        self,
        limit: int = 20,
        level: str | None = None,
    ) -> list[VocabularyRead]:
        return self.store.get_random_items(limit=limit, level=level)

    def submit_review(self, vocab_id: int, rating: int) -> ProgressRead:
        return self.store.submit_review(vocab_id=vocab_id, rating=rating)

    def toggle_star(self, vocab_id: int) -> bool:
        return self.store.toggle_star(vocab_id=vocab_id)

    def get_due_srs_queue(self, limit: int = 20, level: str | None = None) -> list[VocabularyRead]:
        return self.store.get_due_srs_queue(limit=limit, level=level)

    def get_starred_list(self, skip: int = 0, limit: int = 50) -> VocabularyList:
        return self.store.get_starred_list(skip=skip, limit=limit)

    def get_srs_stats(self) -> SRSQueueStats:
        return self.store.get_srs_stats()

    def generate_cloze_exercises(
        self,
        count: int = 10,
        level: str | None = None,
    ) -> list[ExerciseCloze]:
        return self.store.generate_cloze_exercises(count=count, level=level)

    def generate_synonym_matching(
        self,
        count: int = 6,
        level: str | None = None,
    ) -> list[SynonymMatchingItem]:
        return self.store.generate_synonym_matching(count=count, level=level)

    def get_stats(self) -> VocabularyStats:
        return self.store.get_stats()

    def generate_quiz(
        self,
        count: int = 10,
        level: str | None = None,
    ) -> list[QuizQuestion]:
        return self.store.generate_quiz(count=count, level=level)
