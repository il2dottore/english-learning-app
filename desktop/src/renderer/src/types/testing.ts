export interface TestQuestionItem {
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

export interface TestAnswerSubmission {
  question_id: number
  selected_answer: string
}

export interface TestSubmitRequest {
  title?: string
  level?: string
  mode?: string
  duration_seconds?: number
  answers: TestAnswerSubmission[]
}

export interface QuestionEvaluation {
  question_id: number
  word: string
  level: string
  part_of_speech: string
  ipa_uk: string
  user_answer: string
  correct_answer: string
  is_correct: boolean
  explanation: string
  example: string
}

export interface TestResultResponse {
  id: string
  timestamp: string
  title: string
  level: string
  mode: string
  total_questions: number
  correct_count: number
  score_percentage: number
  rating_label: string
  xp_earned: number
  duration_seconds: number
  streak_updated: boolean
  current_streak: number
  questions_detail: QuestionEvaluation[]
}

export interface TestHistoryItem {
  id: string
  timestamp: string
  title: string
  level: string
  mode: string
  total_questions: number
  correct_count: number
  score_percentage: number
  rating_label: string
  xp_earned: number
  duration_seconds: number
}

export interface TestHistoryResponse {
  total_tests: number
  average_score: number
  total_xp: number
  items: TestHistoryItem[]
}

export interface MistakeItem {
  vocab_id: number
  word: string
  level: string
  part_of_speech: string
  ipa_uk: string
  vietnamese_meaning: string
  example: string
  fail_count: number
  last_failed_at: string
}

export interface MistakeListResponse {
  total_mistakes: number
  items: MistakeItem[]
}
