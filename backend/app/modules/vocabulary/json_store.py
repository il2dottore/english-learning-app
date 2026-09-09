import json
import logging
import random
import re
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

from app.core.exceptions import ResourceNotFoundError
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

logger = logging.getLogger(__name__)


class VocabularyJsonStore:
    _instance: "VocabularyJsonStore | None" = None

    def __init__(self) -> None:
        self.data_dir = Path(__file__).resolve().parents[4] / "data"
        self.progress_file = self.data_dir / "user_progress.json"
        self._items: list[dict[str, Any]] = []
        self._items_by_id: dict[int, dict[str, Any]] = {}
        self._progress: dict[str, Any] = {"starred": [], "reviews": {}}
        self.load_data()

    @classmethod
    def get_instance(cls) -> "VocabularyJsonStore":
        if cls._instance is None:
            cls._instance = VocabularyJsonStore()
        return cls._instance

    def load_data(self) -> None:
        """Load vocabulary items directly from B2.json and C1.json."""
        self._items.clear()
        self._items_by_id.clear()

        b2_path = self.data_dir / "B2.json"
        c1_path = self.data_dir / "C1.json"

        current_id = 1

        # Load B2
        if b2_path.exists():
            try:
                with open(b2_path, encoding="utf-8") as f:
                    b2_data = json.load(f)
                    b2_vocab = b2_data.get("vocabulary", [])
                    for row in b2_vocab:
                        syns = row.get("synonyms", [])
                        if not isinstance(syns, list):
                            syns = [str(syns)] if syns else []
                        item = {
                            "id": current_id,
                            "item_number": int(row.get("number", current_id)),
                            "level": "B2",
                            "word": str(row.get("word", "")).strip(),
                            "part_of_speech": str(row.get("partOfSpeech", "")).strip(),
                            "ipa_uk": str(row.get("ipaUk", "")).strip(),
                            "synonyms": syns,
                            "vietnamese_meaning": str(row.get("vietnameseMeaning", "")).strip(),
                            "example": str(row.get("example", "")).strip(),
                        }
                        self._items.append(item)
                        self._items_by_id[current_id] = item
                        current_id += 1
            except Exception as e:
                logger.error("Failed to read B2.json: %s", e)

        # Load C1
        if c1_path.exists():
            try:
                with open(c1_path, encoding="utf-8") as f:
                    c1_data = json.load(f)
                    c1_vocab = c1_data.get("c1Vocabulary", [])
                    for row in c1_vocab:
                        syns = row.get("synonyms", [])
                        if not isinstance(syns, list):
                            syns = [str(syns)] if syns else []
                        item = {
                            "id": current_id,
                            "item_number": int(row.get("number", current_id)),
                            "level": "C1",
                            "word": str(row.get("word", "")).strip(),
                            "part_of_speech": str(row.get("partOfSpeech", "")).strip(),
                            "ipa_uk": str(row.get("ipaUk", "")).strip(),
                            "synonyms": syns,
                            "vietnamese_meaning": str(row.get("vietnameseMeaning", "")).strip(),
                            "example": str(row.get("example", "")).strip(),
                        }
                        self._items.append(item)
                        self._items_by_id[current_id] = item
                        current_id += 1
            except Exception as e:
                logger.error("Failed to read C1.json: %s", e)

        logger.info("Loaded %d total vocabulary items directly from JSON", len(self._items))
        self._load_progress()

    def _load_progress(self) -> None:
        """Load user learning progress from user_progress.json."""
        if self.progress_file.exists():
            try:
                with open(self.progress_file, encoding="utf-8") as f:
                    self._progress = json.load(f)
            except Exception:
                self._progress = {"starred": [], "reviews": {}}
        else:
            self._progress = {"starred": [], "reviews": {}}

    def _save_progress(self) -> None:
        """Save user learning progress to user_progress.json."""
        try:
            with open(self.progress_file, "w", encoding="utf-8") as f:
                json.dump(self._progress, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error("Failed to save progress to JSON: %s", e)

    def get_progress_data(self, vocab_id: int) -> ProgressRead | None:
        revs = self._progress.get("reviews", {})
        data = revs.get(str(vocab_id))
        if not data:
            return None
        last_dt = datetime.fromisoformat(data["last_reviewed_at"]) if data.get("last_reviewed_at") else None
        next_dt = datetime.fromisoformat(data["next_review_at"]) if data.get("next_review_at") else datetime.now(UTC)
        is_starred = vocab_id in self._progress.get("starred", [])
        return ProgressRead(
            id=vocab_id,
            vocabulary_id=vocab_id,
            box_level=data.get("box_level", 1),
            interval_days=data.get("interval_days", 1),
            ease_factor=data.get("ease_factor", 2.5),
            repetition_count=data.get("repetition_count", 0),
            last_reviewed_at=last_dt,
            next_review_at=next_dt,
            status=data.get("status", "new"),
            is_starred=is_starred,
        )

    def _to_read_schema(self, item: dict[str, Any]) -> VocabularyRead:
        vocab_id = item["id"]
        is_starred = vocab_id in self._progress.get("starred", [])
        prog = self.get_progress_data(vocab_id)
        return VocabularyRead(
            id=item["id"],
            item_number=item["item_number"],
            level=item["level"],
            word=item["word"],
            part_of_speech=item["part_of_speech"],
            ipa_uk=item["ipa_uk"],
            synonyms=item["synonyms"],
            vietnamese_meaning=item["vietnamese_meaning"],
            example=item["example"],
            is_starred=is_starred,
            progress=prog,
        )

    def get_by_id(self, vocab_id: int) -> VocabularyRead:
        item = self._items_by_id.get(vocab_id)
        if not item:
            raise ResourceNotFoundError(detail="Vocabulary item not found")
        return self._to_read_schema(item)

    def list_items(
        self,
        skip: int = 0,
        limit: int = 50,
        level: str | None = None,
        search: str | None = None,
        part_of_speech: str | None = None,
    ) -> VocabularyList:
        filtered = self._items

        if level:
            lvl = level.strip().upper()
            filtered = [x for x in filtered if x["level"] == lvl]

        if part_of_speech:
            pos = part_of_speech.strip().lower()
            filtered = [x for x in filtered if pos in x["part_of_speech"].lower()]

        if search:
            q = search.strip().lower()
            filtered = [
                x
                for x in filtered
                if q in x["word"].lower()
                or q in x["vietnamese_meaning"].lower()
                or any(q in syn.lower() for syn in x["synonyms"])
            ]

        total = len(filtered)
        page_items = filtered[skip : skip + limit]

        return VocabularyList(
            items=[self._to_read_schema(x) for x in page_items],
            total=total,
            skip=skip,
            limit=limit,
        )

    def get_all(self, level: str | None = None) -> list[VocabularyRead]:
        pool = self._items
        if level:
            lvl = level.strip().upper()
            pool = [x for x in pool if x["level"] == lvl]
        return [self._to_read_schema(x) for x in pool]

    def get_random_items(self, limit: int = 20, level: str | None = None) -> list[VocabularyRead]:
        pool = self._items
        if level:
            lvl = level.strip().upper()
            pool = [x for x in pool if x["level"] == lvl]

        selected = random.sample(pool, min(limit, len(pool)))
        return [self._to_read_schema(x) for x in selected]

    def submit_review(self, vocab_id: int, rating: int) -> ProgressRead:
        if vocab_id not in self._items_by_id:
            raise ResourceNotFoundError(detail="Vocabulary item not found")

        revs = self._progress.setdefault("reviews", {})
        entry = revs.get(str(vocab_id), {})

        now = datetime.now(UTC)
        box_level = entry.get("box_level", 1)
        interval_days = entry.get("interval_days", 1)
        repetition_count = entry.get("repetition_count", 0)

        if rating == 1:
            box_level = 1
            interval_days = 1
            status = "learning"
            repetition_count = 0
        elif rating == 2:
            box_level = min(5, box_level + 1)
            interval_days = max(2, int(interval_days * 1.6))
            status = "learning" if box_level < 4 else "mastered"
            repetition_count += 1
        else:
            box_level = min(5, box_level + 1)
            interval_days = max(4, int(interval_days * 2.4))
            status = "mastered" if box_level >= 3 else "learning"
            repetition_count += 1

        next_dt = now + timedelta(days=interval_days)

        revs[str(vocab_id)] = {
            "box_level": box_level,
            "interval_days": interval_days,
            "ease_factor": 2.5,
            "repetition_count": repetition_count,
            "last_reviewed_at": now.isoformat(),
            "next_review_at": next_dt.isoformat(),
            "status": status,
        }

        self._save_progress()
        return self.get_progress_data(vocab_id)  # type: ignore

    def toggle_star(self, vocab_id: int) -> bool:
        if vocab_id not in self._items_by_id:
            raise ResourceNotFoundError(detail="Vocabulary item not found")

        starred = self._progress.setdefault("starred", [])
        if vocab_id in starred:
            starred.remove(vocab_id)
            is_starred = False
        else:
            starred.append(vocab_id)
            is_starred = True

        self._save_progress()
        return is_starred

    def get_due_srs_queue(self, limit: int = 20, level: str | None = None) -> list[VocabularyRead]:
        now = datetime.now(UTC)
        revs = self._progress.get("reviews", {})

        due_ids: list[int] = []
        for vid_str, rdata in revs.items():
            next_str = rdata.get("next_review_at")
            if next_str:
                try:
                    if datetime.fromisoformat(next_str) <= now:
                        due_ids.append(int(vid_str))
                except Exception:
                    pass

        due_items = [self._items_by_id[vid] for vid in due_ids if vid in self._items_by_id]
        if level:
            lvl = level.strip().upper()
            due_items = [x for x in due_items if x["level"] == lvl]

        # If due items are less than limit, supplement with new unreviewed items
        if len(due_items) < limit:
            reviewed_ids = {int(k) for k in revs}
            unreviewed = [x for x in self._items if x["id"] not in reviewed_ids]
            if level:
                lvl = level.strip().upper()
                unreviewed = [x for x in unreviewed if x["level"] == lvl]
            supplement_count = limit - len(due_items)
            due_items.extend(random.sample(unreviewed, min(supplement_count, len(unreviewed))))

        return [self._to_read_schema(x) for x in due_items[:limit]]

    def get_starred_list(self, skip: int = 0, limit: int = 50) -> VocabularyList:
        starred_ids = set(self._progress.get("starred", []))
        items = [x for x in self._items if x["id"] in starred_ids]
        total = len(items)
        page_items = items[skip : skip + limit]
        return VocabularyList(
            items=[self._to_read_schema(x) for x in page_items],
            total=total,
            skip=skip,
            limit=limit,
        )

    def get_srs_stats(self) -> SRSQueueStats:
        now = datetime.now(UTC)
        revs = self._progress.get("reviews", {})
        starred = self._progress.get("starred", [])

        due_count = 0
        learning_count = 0
        mastered_count = 0

        for rdata in revs.values():
            status = rdata.get("status", "learning")
            if status == "mastered":
                mastered_count += 1
            else:
                learning_count += 1

            next_str = rdata.get("next_review_at")
            if next_str:
                try:
                    if datetime.fromisoformat(next_str) <= now:
                        due_count += 1
                except Exception:
                    pass

        new_count = max(0, len(self._items) - len(revs))

        return SRSQueueStats(
            due_count=due_count,
            learning_count=learning_count,
            mastered_count=mastered_count,
            new_count=new_count,
            starred_count=len(starred),
        )

    def get_stats(self) -> VocabularyStats:
        total = len(self._items)
        b2_count = sum(1 for x in self._items if x["level"] == "B2")
        c1_count = sum(1 for x in self._items if x["level"] == "C1")

        pos_dict: dict[str, int] = {}
        for x in self._items:
            pos = x["part_of_speech"] or "other"
            pos_dict[pos] = pos_dict.get(pos, 0) + 1

        return VocabularyStats(
            total=total,
            b2_count=b2_count,
            c1_count=c1_count,
            parts_of_speech=pos_dict,
        )

    def generate_cloze_exercises(self, count: int = 10, level: str | None = None) -> list[ExerciseCloze]:
        pool = [x for x in self._items if x["example"]]
        if level:
            lvl = level.strip().upper()
            pool = [x for x in pool if x["level"] == lvl]

        if len(pool) < 4:
            return []

        random.shuffle(pool)
        exercises: list[ExerciseCloze] = []

        for target in pool[:count]:
            pattern = re.compile(re.escape(target["word"]), re.IGNORECASE)
            if not pattern.search(target["example"]):
                continue
            cloze_sentence = pattern.sub("________", target["example"], count=1)

            distractors = [x["word"] for x in pool if x["id"] != target["id"] and x["word"] != target["word"]]
            if len(distractors) < 3:
                continue
            opts = [target["word"], *random.sample(distractors, 3)]
            random.shuffle(opts)

            exercises.append(
                ExerciseCloze(
                    id=target["id"],
                    word=target["word"],
                    level=target["level"],
                    part_of_speech=target["part_of_speech"],
                    prompt=f"Điền từ phù hợp với nghĩa: '{target['vietnamese_meaning']}'",
                    cloze_sentence=cloze_sentence,
                    answer=target["word"],
                    options=opts,
                    vietnamese_meaning=target["vietnamese_meaning"],
                    example=target["example"],
                )
            )

        return exercises

    def generate_synonym_matching(self, count: int = 6, level: str | None = None) -> list[SynonymMatchingItem]:
        pool = [x for x in self._items if x["synonyms"] and len(x["synonyms"]) > 0]
        if level:
            lvl = level.strip().upper()
            pool = [x for x in pool if x["level"] == lvl]

        random.shuffle(pool)
        pairs: list[SynonymMatchingItem] = []

        for item in pool:
            first_syn = item["synonyms"][0].strip()
            if first_syn and first_syn.lower() != item["word"].lower():
                pairs.append(
                    SynonymMatchingItem(
                        id=item["id"],
                        word=item["word"],
                        synonym=first_syn,
                        level=item["level"],
                        part_of_speech=item["part_of_speech"],
                    )
                )
            if len(pairs) >= count:
                break

        return pairs

    def generate_quiz(self, count: int = 10, level: str | None = None) -> list[QuizQuestion]:
        pool = self._items
        if level:
            lvl = level.strip().upper()
            pool = [x for x in pool if x["level"] == lvl]

        if len(pool) < 4:
            return []

        selected = random.sample(pool, min(count, len(pool)))
        questions: list[QuizQuestion] = []

        for target in selected:
            distractors = [x for x in pool if x["id"] != target["id"]]
            if len(distractors) < 3:
                continue
            picked_distractors = random.sample(distractors, 3)

            q_type = random.choice(["word_to_meaning", "meaning_to_word"])

            if q_type == "word_to_meaning":
                correct = target["vietnamese_meaning"]
                wrong_opts = [d["vietnamese_meaning"] for d in picked_distractors]
                all_opts = [correct, *wrong_opts]
                random.shuffle(all_opts)
                prompt = f"Từ '{target['word']}' ({target['part_of_speech']}) có nghĩa là gì?"
                explanation = (
                    f"'{target['word']}' ({target['ipa_uk']}) nghĩa là: {target['vietnamese_meaning']}. "
                    f"Ví dụ: {target['example']}"
                )
            else:
                correct = target["word"]
                wrong_opts = [d["word"] for d in picked_distractors]
                all_opts = [correct, *wrong_opts]
                prompt = (
                    f"Từ tiếng Anh nào phù hợp với nghĩa: '{target['vietnamese_meaning']}' "
                    f"({target['part_of_speech']})?"
                )
                explanation = f"Đáp án chính xác là '{target['word']}' ({target['ipa_uk']}). Ví dụ: {target['example']}"

            questions.append(
                QuizQuestion(
                    id=target["id"],
                    word=target["word"],
                    level=target["level"],
                    part_of_speech=target["part_of_speech"],
                    ipa_uk=target["ipa_uk"],
                    question_type=q_type,
                    prompt=prompt,
                    correct_answer=correct,
                    options=all_opts,
                    example=target["example"],
                    explanation=explanation,
                )
            )

        return questions
