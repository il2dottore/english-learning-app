import json
import logging
import re
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from app.core.exceptions import ResourceNotFoundError
from app.modules.skills.schemas import (
    ComprehensionQuestion,
    DictationCheckRequest,
    DictationCheckResponse,
    DictationExercise,
    GrammarExample,
    GrammarQuestion,
    GrammarSubmitRequest,
    GrammarSubmitResponse,
    GrammarTopicDetail,
    GrammarTopicOverview,
    HighlightedVocabItem,
    ReadingArticleDetail,
    ReadingArticleOverview,
    ReadingSubmitRequest,
    ReadingSubmitResponse,
    WordDiffItem,
)
from app.modules.vocabulary.json_store import VocabularyJsonStore

logger = logging.getLogger(__name__)


class SkillsService:
    _instance: "SkillsService | None" = None

    def __init__(self) -> None:
        self.data_dir = Path(__file__).resolve().parents[4] / "data"
        self.reading_file = self.data_dir / "reading_articles.json"
        self.grammar_file = self.data_dir / "grammar_topics.json"
        self.progress_file = self.data_dir / "user_progress.json"
        self.vocab_store = VocabularyJsonStore.get_instance()

        self._articles: list[dict[str, Any]] = []
        self._articles_by_id: dict[str, dict[str, Any]] = {}
        self._grammar_topics: list[dict[str, Any]] = []
        self._grammar_by_id: dict[str, dict[str, Any]] = {}

        self.load_data()

    @classmethod
    def get_instance(cls) -> "SkillsService":
        if cls._instance is None:
            cls._instance = SkillsService()
        return cls._instance

    def load_data(self) -> None:
        # Load reading articles
        if self.reading_file.exists():
            try:
                with open(self.reading_file, encoding="utf-8") as f:
                    data = json.load(f)
                    self._articles = data.get("articles", [])
                    self._articles_by_id = {a["id"]: a for a in self._articles}
            except Exception as e:
                logger.error("Failed to load reading_articles.json: %s", e)

        # Load grammar topics
        if self.grammar_file.exists():
            try:
                with open(self.grammar_file, encoding="utf-8") as f:
                    data = json.load(f)
                    self._grammar_topics = data.get("topics", [])
                    self._grammar_by_id = {g["id"]: g for g in self._grammar_topics}
            except Exception as e:
                logger.error("Failed to load grammar_topics.json: %s", e)

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
            logger.error("Failed to save progress: %s", e)

    # -----------------------------------------------------------------------
    # Reading Methods
    # -----------------------------------------------------------------------
    def list_reading_articles(self, level: str | None = None) -> list[ReadingArticleOverview]:
        progress = self._get_progress_data().get("skills_progress", {}).get("reading", {})
        completed_set = set(progress.get("completed_articles", []))
        scores_map = progress.get("article_scores", {})

        result: list[ReadingArticleOverview] = []
        for art in self._articles:
            if level and level != "ALL" and art.get("level") != level:
                continue
            aid = art["id"]
            result.append(
                ReadingArticleOverview(
                    id=aid,
                    level=art["level"],
                    topic=art["topic"],
                    title=art["title"],
                    reading_time_minutes=art.get("reading_time_minutes", 4),
                    summary=art.get("summary", ""),
                    is_completed=aid in completed_set,
                    score=scores_map.get(aid),
                )
            )
        return result

    def get_reading_article(self, article_id: str) -> ReadingArticleDetail:
        art = self._articles_by_id.get(article_id)
        if not art:
            raise ResourceNotFoundError(detail=f"Article '{article_id}' not found")

        progress = self._get_progress_data().get("skills_progress", {}).get("reading", {})
        completed_set = set(progress.get("completed_articles", []))
        scores_map = progress.get("article_scores", {})

        # Parse vocab
        vocab_items = [HighlightedVocabItem(**v) for v in art.get("highlighted_vocab", [])]

        # Parse questions
        questions = [ComprehensionQuestion(**q) for q in art.get("comprehension_questions", [])]

        return ReadingArticleDetail(
            id=art["id"],
            level=art["level"],
            topic=art["topic"],
            title=art["title"],
            reading_time_minutes=art.get("reading_time_minutes", 4),
            summary=art.get("summary", ""),
            is_completed=article_id in completed_set,
            score=scores_map.get(article_id),
            paragraphs=art.get("paragraphs", []),
            highlighted_vocab=vocab_items,
            comprehension_questions=questions,
        )

    def submit_reading_quiz(self, article_id: str, req: ReadingSubmitRequest) -> ReadingSubmitResponse:
        art = self._articles_by_id.get(article_id)
        if not art:
            raise ResourceNotFoundError(detail=f"Article '{article_id}' not found")

        questions = art.get("comprehension_questions", [])
        total_q = max(len(questions), 1)
        correct_count = 0

        for q in questions:
            qid = q["id"]
            user_opt = req.answers.get(qid, "").strip()
            if user_opt == q["correct_answer"].strip():
                correct_count += 1

        score_pct = round((correct_count / total_q) * 100, 1)
        is_passed = score_pct >= 66.0
        xp_earned = correct_count * 15

        # Update progress in JSON
        prog = self._get_progress_data()
        sp = prog.setdefault("skills_progress", {})
        rp = sp.setdefault("reading", {"completed_articles": [], "article_scores": {}})

        if is_passed and article_id not in rp.get("completed_articles", []):
            rp.setdefault("completed_articles", []).append(article_id)

        rp.setdefault("article_scores", {})[article_id] = correct_count

        # Update daily activities
        today_str = datetime.now(UTC).strftime("%Y-%m-%d")
        daily_entry = prog.setdefault("daily_activities", {}).setdefault(
            today_str,
            {"vocab_reviewed": 0, "tests_completed": 0, "lessons_completed": 0, "xp_earned": 0},
        )
        daily_entry["xp_earned"] += xp_earned
        self._save_progress_data(prog)

        return ReadingSubmitResponse(
            success=True,
            article_id=article_id,
            score=correct_count,
            total_questions=len(questions),
            score_percentage=score_pct,
            xp_earned=xp_earned,
            is_passed=is_passed,
        )

    # -----------------------------------------------------------------------
    # Listening Dictation Methods
    # -----------------------------------------------------------------------
    def get_dictation_exercises(self, count: int = 10, level: str | None = None) -> list[DictationExercise]:
        vocab_list = self.vocab_store.get_random_items(limit=count * 2, level=level if level != "ALL" else None)
        exercises: list[DictationExercise] = []

        for v in vocab_list:
            if not v.example or len(v.example.split()) < 5:
                continue

            exercises.append(
                DictationExercise(
                    id=v.id,
                    sentence=v.example,
                    level=v.level,
                    target_word=v.word,
                    vietnamese_meaning=v.vietnamese_meaning,
                    part_of_speech=v.part_of_speech,
                    ipa_uk=v.ipa_uk,
                )
            )
            if len(exercises) >= count:
                break

        return exercises

    def check_dictation(self, req: DictationCheckRequest) -> DictationCheckResponse:
        vocab = self.vocab_store.get_by_id(req.exercise_id)
        expected_sentence = vocab.example

        def normalize_words(text: str) -> list[str]:
            cleaned = re.sub(r"[^\w\s]", "", text.lower())
            return cleaned.split()

        user_words = normalize_words(req.user_input)
        expected_words = normalize_words(expected_sentence)

        diffs: list[WordDiffItem] = []
        correct_words = 0

        max_len = max(len(user_words), len(expected_words))
        for idx in range(max_len):
            u_word = user_words[idx] if idx < len(user_words) else ""
            e_word = expected_words[idx] if idx < len(expected_words) else ""
            is_corr = u_word == e_word

            if is_corr:
                correct_words += 1

            diffs.append(
                WordDiffItem(
                    word=u_word if u_word else "(thiếu)",
                    is_correct=is_corr,
                    expected=e_word,
                )
            )

        total_words = max(len(expected_words), 1)
        accuracy_pct = round((correct_words / total_words) * 100, 1)
        is_perfect = accuracy_pct >= 90.0
        xp_earned = 20 if is_perfect else int(accuracy_pct * 0.15)

        # Update JSON progress
        prog = self._get_progress_data()
        lp = prog.setdefault("skills_progress", {}).setdefault("listening", {"total_dictations": 0, "xp": 0})
        lp["total_dictations"] = lp.get("total_dictations", 0) + 1
        lp["xp"] = lp.get("xp", 0) + xp_earned

        today_str = datetime.now(UTC).strftime("%Y-%m-%d")
        daily_entry = prog.setdefault("daily_activities", {}).setdefault(
            today_str,
            {"vocab_reviewed": 0, "tests_completed": 0, "lessons_completed": 0, "xp_earned": 0},
        )
        daily_entry["xp_earned"] += xp_earned
        self._save_progress_data(prog)

        return DictationCheckResponse(
            is_perfect=is_perfect,
            accuracy_percentage=accuracy_pct,
            user_text=req.user_input,
            expected_text=expected_sentence,
            diffs=diffs,
            xp_earned=xp_earned,
        )

    # -----------------------------------------------------------------------
    # Grammar Methods
    # -----------------------------------------------------------------------
    def list_grammar_topics(self, level: str | None = None) -> list[GrammarTopicOverview]:
        progress = self._get_progress_data().get("skills_progress", {}).get("grammar", {})
        completed_set = set(progress.get("completed_topics", []))
        scores_map = progress.get("topic_scores", {})

        result: list[GrammarTopicOverview] = []
        for g in self._grammar_topics:
            if level and level != "ALL" and g.get("level") != level:
                continue
            gid = g["id"]
            result.append(
                GrammarTopicOverview(
                    id=gid,
                    level=g["level"],
                    title=g["title"],
                    category=g.get("category", "Grammar Core"),
                    formula=g.get("formula", ""),
                    is_completed=gid in completed_set,
                    score=scores_map.get(gid),
                )
            )
        return result

    def get_grammar_topic(self, topic_id: str) -> GrammarTopicDetail:
        g = self._grammar_by_id.get(topic_id)
        if not g:
            raise ResourceNotFoundError(detail=f"Grammar topic '{topic_id}' not found")

        progress = self._get_progress_data().get("skills_progress", {}).get("grammar", {})
        completed_set = set(progress.get("completed_topics", []))
        scores_map = progress.get("topic_scores", {})

        examples = [GrammarExample(**ex) for ex in g.get("examples", [])]
        questions = [GrammarQuestion(**q) for q in g.get("practice_questions", [])]

        return GrammarTopicDetail(
            id=g["id"],
            level=g["level"],
            title=g["title"],
            category=g.get("category", "Grammar Core"),
            formula=g.get("formula", ""),
            is_completed=topic_id in completed_set,
            score=scores_map.get(topic_id),
            description=g.get("description", ""),
            examples=examples,
            practice_questions=questions,
        )

    def submit_grammar_quiz(self, topic_id: str, req: GrammarSubmitRequest) -> GrammarSubmitResponse:
        g = self._grammar_by_id.get(topic_id)
        if not g:
            raise ResourceNotFoundError(detail=f"Grammar topic '{topic_id}' not found")

        questions = g.get("practice_questions", [])
        total_q = max(len(questions), 1)
        correct_count = 0

        for q in questions:
            qid = q["id"]
            user_opt = req.answers.get(qid, "").strip()
            if user_opt == q["correct_answer"].strip():
                correct_count += 1

        score_pct = round((correct_count / total_q) * 100, 1)
        is_passed = score_pct >= 50.0
        xp_earned = correct_count * 20

        # Update JSON progress
        prog = self._get_progress_data()
        gp = prog.setdefault("skills_progress", {}).setdefault("grammar", {"completed_topics": [], "topic_scores": {}})

        if is_passed and topic_id not in gp.get("completed_topics", []):
            gp.setdefault("completed_topics", []).append(topic_id)

        gp.setdefault("topic_scores", {})[topic_id] = correct_count

        today_str = datetime.now(UTC).strftime("%Y-%m-%d")
        daily_entry = prog.setdefault("daily_activities", {}).setdefault(
            today_str,
            {"vocab_reviewed": 0, "tests_completed": 0, "lessons_completed": 0, "xp_earned": 0},
        )
        daily_entry["xp_earned"] += xp_earned
        self._save_progress_data(prog)

        return GrammarSubmitResponse(
            success=True,
            topic_id=topic_id,
            score=correct_count,
            total_questions=len(questions),
            score_percentage=score_pct,
            xp_earned=xp_earned,
            is_passed=is_passed,
        )
