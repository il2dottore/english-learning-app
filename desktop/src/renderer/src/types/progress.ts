import { TestHistoryItem } from './testing'

export interface StreakInfo {
  current_streak: number
  longest_streak: number
  is_active_today: boolean
  active_dates: string[]
}

export interface DayActivityItem {
  day_name: string
  date_str: string
  vocab_reviewed: number
  tests_completed: number
  lessons_completed: number
  xp_earned: number
  is_active: boolean
}

export interface VocabMasteryStats {
  total_vocab: number
  b2_total: number
  b2_mastered: number
  b2_learning: number
  b2_percentage: number
  c1_total: number
  c1_mastered: number
  c1_learning: number
  c1_percentage: number
  overall_mastered: number
  overall_learning: number
  starred_count: number
}

export interface CourseProgressSummary {
  b2_completed_lessons: number
  b2_total_lessons: number
  b2_percentage: number
  c1_completed_lessons: number
  c1_total_lessons: number
  c1_percentage: number
}

export interface DashboardSummaryResponse {
  streak: StreakInfo
  last_7_days_activity: DayActivityItem[]
  vocab_mastery: VocabMasteryStats
  course_progress: CourseProgressSummary
  recent_tests: TestHistoryItem[]
  total_xp: number
  accuracy_rate: number
  words_reviewed_today: number
}
