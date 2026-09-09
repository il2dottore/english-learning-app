import { QuizQuestion, VocabularyItem } from './vocabulary'

export interface LessonOverview {
  id: string
  lesson_number: number
  title: string
  vocab_count: number
  grammar_focus: string
  reading_topic: string
  estimated_minutes: number
  xp: number
  is_completed: boolean
  is_unlocked: boolean
  score?: number | null
}

export interface UnitOverview {
  id: string
  unit_number: number
  title: string
  description: string
  lessons: LessonOverview[]
  completed_count: number
  total_lessons: number
  progress_percentage: number
}

export interface CourseOverview {
  id: string
  level: 'B2' | 'C1' | string
  title: string
  description: string
  total_units: number
  total_lessons: number
  total_vocab: number
  completed_lessons_count: number
  progress_percentage: number
  current_lesson_id?: string | null
}

export interface CourseDetail extends CourseOverview {
  units: UnitOverview[]
}

export interface LessonDetail {
  id: string
  course_id: string
  unit_id: string
  lesson_number: number
  title: string
  unit_title: string
  course_title: string
  level: 'B2' | 'C1' | string
  grammar_focus: string
  grammar_notes: string
  reading_topic: string
  reading_text: string
  vocabularies: VocabularyItem[]
  checkpoint_quiz: QuizQuestion[]
  is_completed: boolean
  is_unlocked: boolean
}

export interface LessonCompleteResponse {
  success: boolean
  course_id: string
  completed_lesson_id: string
  score: number
  next_lesson_id?: string | null
  unlocked_new_unit: boolean
  course_progress_percentage: number
}
