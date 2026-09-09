export interface HighlightedVocabItem {
  word: string
  ipa: string
  part_of_speech: string
  meaning: string
  context: string
}

export interface ComprehensionQuestion {
  id: number
  prompt: string
  options: string[]
  correct_answer: string
  explanation: string
}

export interface ReadingArticleOverview {
  id: string
  level: string
  topic: string
  title: string
  reading_time_minutes: number
  summary: string
  is_completed: boolean
  score?: number | null
}

export interface ReadingArticleDetail extends ReadingArticleOverview {
  paragraphs: string[]
  highlighted_vocab: HighlightedVocabItem[]
  comprehension_questions: ComprehensionQuestion[]
}

export interface ReadingSubmitResponse {
  success: boolean
  article_id: string
  score: number
  total_questions: number
  score_percentage: number
  xp_earned: number
  is_passed: boolean
}

export interface DictationExercise {
  id: number
  sentence: string
  level: string
  target_word: string
  vietnamese_meaning: string
  part_of_speech: string
  ipa_uk: string
}

export interface WordDiffItem {
  word: string
  is_correct: boolean
  expected: string
}

export interface DictationCheckResponse {
  is_perfect: boolean
  accuracy_percentage: number
  user_text: string
  expected_text: string
  diffs: WordDiffItem[]
  xp_earned: number
}

export interface GrammarExample {
  basic: string
  advanced: string
  note: string
}

export interface GrammarQuestion {
  id: number
  prompt: string
  options: string[]
  correct_answer: string
  explanation: string
}

export interface GrammarTopicOverview {
  id: string
  level: string
  title: string
  category: string
  formula: string
  is_completed: boolean
  score?: number | null
}

export interface GrammarTopicDetail extends GrammarTopicOverview {
  description: string
  examples: GrammarExample[]
  practice_questions: GrammarQuestion[]
}

export interface GrammarSubmitResponse {
  success: boolean
  topic_id: string
  score: number
  total_questions: number
  score_percentage: number
  xp_earned: number
  is_passed: boolean
}
