export interface ProgressData {
  id: number
  vocabulary_id: number
  box_level: number
  interval_days: number
  repetition_count: number
  last_reviewed_at: string | null
  next_review_at: string
  status: 'new' | 'learning' | 'mastered'
  is_starred: boolean
}

export interface VocabularyItem {
  id: number
  item_number: number
  level: 'B2' | 'C1'
  word: string
  part_of_speech: string
  ipa_uk: string
  synonyms: string[]
  vietnamese_meaning: string
  example: string
  is_starred?: boolean
  progress?: ProgressData | null
}

export interface VocabularyListResponse {
  items: VocabularyItem[]
  total: number
  skip: number
  limit: number
}

export interface VocabularyStats {
  total: number
  b2_count: number
  c1_count: number
  parts_of_speech: Record<string, number>
}

export interface SRSQueueStats {
  due_count: number
  learning_count: number
  mastered_count: number
  new_count: number
  starred_count: number
}

export interface ExerciseCloze {
  id: number
  word: string
  level: string
  part_of_speech: string
  prompt: string
  cloze_sentence: string
  answer: string
  options: string[]
  vietnamese_meaning: string
  example: string
}

export interface SynonymMatchingItem {
  id: number
  word: string
  synonym: string
  level: string
  part_of_speech: string
}

export interface QuizQuestion {
  id: number
  word: string
  level: string
  part_of_speech: string
  ipa_uk: string
  question_type: string
  prompt: string
  correct_answer: string
  options: string[]
  example: string
  explanation: string
}
