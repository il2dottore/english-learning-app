import {
  ExerciseCloze,
  ProgressData,
  QuizQuestion,
  SRSQueueStats,
  SynonymMatchingItem,
  VocabularyItem,
  VocabularyListResponse,
  VocabularyStats,
} from '../types/vocabulary'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/health`)
    return res.ok
  } catch {
    return false
  }
}

export async function fetchStats(): Promise<VocabularyStats> {
  const res = await fetch(`${BASE_URL}/api/vocabulary/stats`)
  if (!res.ok) throw new Error('Failed to fetch statistics')
  return res.json()
}

export async function fetchSRSStats(): Promise<SRSQueueStats> {
  const res = await fetch(`${BASE_URL}/api/vocabulary/srs/stats`)
  if (!res.ok) throw new Error('Failed to fetch SRS stats')
  return res.json()
}

export async function fetchSRSQueue(limit = 20, level?: string): Promise<VocabularyItem[]> {
  const query = new URLSearchParams({ limit: limit.toString() })
  if (level && level !== 'ALL') query.set('level', level)

  const res = await fetch(`${BASE_URL}/api/vocabulary/srs/queue?${query.toString()}`)
  if (!res.ok) throw new Error('Failed to fetch SRS queue')
  return res.json()
}

export async function fetchStarredList(skip = 0, limit = 50): Promise<VocabularyListResponse> {
  const query = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() })
  const res = await fetch(`${BASE_URL}/api/vocabulary/starred?${query.toString()}`)
  if (!res.ok) throw new Error('Failed to fetch starred vocabulary')
  return res.json()
}

export async function submitWordReview(vocabId: number, rating: 1 | 2 | 3): Promise<ProgressData> {
  const res = await fetch(`${BASE_URL}/api/vocabulary/${vocabId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating }),
  })
  if (!res.ok) throw new Error('Failed to submit review')
  return res.json()
}

export async function toggleWordStar(vocabId: number): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/api/vocabulary/${vocabId}/star`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error('Failed to toggle star')
  const data = await res.json()
  return data.is_starred
}

export async function fetchClozeExercises(count = 10, level?: string): Promise<ExerciseCloze[]> {
  const query = new URLSearchParams({ count: count.toString() })
  if (level && level !== 'ALL') query.set('level', level)

  const res = await fetch(`${BASE_URL}/api/vocabulary/exercises/cloze?${query.toString()}`)
  if (!res.ok) throw new Error('Failed to fetch cloze exercises')
  return res.json()
}

export async function fetchSynonymPairs(count = 6, level?: string): Promise<SynonymMatchingItem[]> {
  const query = new URLSearchParams({ count: count.toString() })
  if (level && level !== 'ALL') query.set('level', level)

  const res = await fetch(`${BASE_URL}/api/vocabulary/exercises/synonyms?${query.toString()}`)
  if (!res.ok) throw new Error('Failed to fetch synonym pairs')
  return res.json()
}

export async function fetchVocabularyList(params: {
  level?: string
  search?: string
  partOfSpeech?: string
  skip?: number
  limit?: number
}): Promise<VocabularyListResponse> {
  const query = new URLSearchParams()
  if (params.level && params.level !== 'ALL') query.set('level', params.level)
  if (params.search?.trim()) query.set('search', params.search.trim())
  if (params.partOfSpeech) query.set('part_of_speech', params.partOfSpeech)
  if (params.skip !== undefined) query.set('skip', params.skip.toString())
  if (params.limit !== undefined) query.set('limit', params.limit.toString())

  const res = await fetch(`${BASE_URL}/api/vocabulary?${query.toString()}`)
  if (!res.ok) throw new Error('Failed to fetch vocabulary list')
  return res.json()
}

export async function fetchRandomFlashcards(limit = 20, level?: string): Promise<VocabularyItem[]> {
  const query = new URLSearchParams({ limit: limit.toString() })
  if (level && level !== 'ALL') query.set('level', level)

  const res = await fetch(`${BASE_URL}/api/vocabulary/random?${query.toString()}`)
  if (!res.ok) throw new Error('Failed to fetch flashcards')
  return res.json()
}

export async function fetchQuiz(count = 10, level?: string): Promise<QuizQuestion[]> {
  const query = new URLSearchParams({ count: count.toString() })
  if (level && level !== 'ALL') query.set('level', level)

  const res = await fetch(`${BASE_URL}/api/vocabulary/quiz?${query.toString()}`)
  if (!res.ok) throw new Error('Failed to generate quiz')
  return res.json()
}

export function speakEnglish(text: string, rate = 0.9) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-GB'
  utterance.rate = rate

  const voices = window.speechSynthesis.getVoices()
  const britishVoice = voices.find((v) => v.lang.includes('en-GB') || v.name.includes('British') || v.name.includes('UK'))
  const englishVoice = britishVoice || voices.find((v) => v.lang.startsWith('en'))
  if (englishVoice) {
    utterance.voice = englishVoice
  }

  window.speechSynthesis.speak(utterance)
}

// -------------------------------------------------------------
// Course & Lesson APIs (Đọc/ghi trực tiếp JSON qua Backend)
// -------------------------------------------------------------
import type {
  CourseOverview,
  CourseDetail,
  LessonDetail,
  LessonCompleteResponse,
} from '../types/course'

export async function fetchCourses(): Promise<CourseOverview[]> {
  const res = await fetch(`${BASE_URL}/api/courses`)
  if (!res.ok) throw new Error('Failed to fetch courses')
  return res.json()
}

export async function fetchCourseDetail(courseId: string): Promise<CourseDetail> {
  const res = await fetch(`${BASE_URL}/api/courses/${courseId}`)
  if (!res.ok) throw new Error(`Failed to fetch course ${courseId}`)
  return res.json()
}

export async function fetchLessonDetail(courseId: string, lessonId: string): Promise<LessonDetail> {
  const res = await fetch(`${BASE_URL}/api/courses/${courseId}/lessons/${lessonId}`)
  if (!res.ok) throw new Error(`Failed to fetch lesson ${lessonId}`)
  return res.json()
}

export async function completeLesson(
  courseId: string,
  lessonId: string,
  score: number,
): Promise<LessonCompleteResponse> {
  const res = await fetch(`${BASE_URL}/api/courses/${courseId}/lessons/${lessonId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ score }),
  })
  if (!res.ok) throw new Error(`Failed to complete lesson ${lessonId}`)
  return res.json()
}

// -------------------------------------------------------------
// Testing & Assessment APIs (Chức năng 6 & 7)
// -------------------------------------------------------------
import type {
  TestQuestionItem,
  TestSubmitRequest,
  TestResultResponse,
  TestHistoryResponse,
  MistakeListResponse,
} from '../types/testing'
import type { DashboardSummaryResponse } from '../types/progress'

export async function generateTest(params: {
  level?: string
  count?: number
  mode?: string
}): Promise<TestQuestionItem[]> {
  const res = await fetch(`${BASE_URL}/api/testing/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      level: params.level || 'ALL',
      count: params.count || 10,
      mode: params.mode || 'standard',
    }),
  })
  if (!res.ok) throw new Error('Failed to generate test questions')
  return res.json()
}

export async function submitTest(payload: TestSubmitRequest): Promise<TestResultResponse> {
  const res = await fetch(`${BASE_URL}/api/testing/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to submit test')
  return res.json()
}

export async function fetchTestHistory(): Promise<TestHistoryResponse> {
  const res = await fetch(`${BASE_URL}/api/testing/history`)
  if (!res.ok) throw new Error('Failed to fetch test history')
  return res.json()
}

export async function fetchMistakesList(limit = 30): Promise<MistakeListResponse> {
  const res = await fetch(`${BASE_URL}/api/testing/mistakes?limit=${limit}`)
  if (!res.ok) throw new Error('Failed to fetch mistake list')
  return res.json()
}

// -------------------------------------------------------------
// Progress & Dashboard Analytics API (Chức năng 8)
// -------------------------------------------------------------
export async function fetchDashboardProgress(): Promise<DashboardSummaryResponse> {
  const res = await fetch(`${BASE_URL}/api/progress/dashboard`)
  if (!res.ok) throw new Error('Failed to fetch dashboard progress')
  return res.json()
}

// -------------------------------------------------------------
// Skills APIs: Reading, Listening Dictation & Grammar (Chức năng 4 & 5)
// -------------------------------------------------------------
import type {
  ReadingArticleOverview,
  ReadingArticleDetail,
  ReadingSubmitResponse,
  DictationExercise,
  DictationCheckResponse,
  GrammarTopicOverview,
  GrammarTopicDetail,
  GrammarSubmitResponse,
} from '../types/skills'

export async function fetchReadingArticles(level?: string): Promise<ReadingArticleOverview[]> {
  const query = level && level !== 'ALL' ? `?level=${level}` : ''
  const res = await fetch(`${BASE_URL}/api/skills/reading/articles${query}`)
  if (!res.ok) throw new Error('Failed to fetch reading articles')
  return res.json()
}

export async function fetchReadingArticleDetail(articleId: string): Promise<ReadingArticleDetail> {
  const res = await fetch(`${BASE_URL}/api/skills/reading/articles/${articleId}`)
  if (!res.ok) throw new Error(`Failed to fetch article ${articleId}`)
  return res.json()
}

export async function submitReadingQuiz(
  articleId: string,
  answers: Record<number, string>,
): Promise<ReadingSubmitResponse> {
  const res = await fetch(`${BASE_URL}/api/skills/reading/articles/${articleId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  })
  if (!res.ok) throw new Error('Failed to submit reading quiz')
  return res.json()
}

export async function fetchDictationExercises(count = 10, level?: string): Promise<DictationExercise[]> {
  const query = new URLSearchParams({ count: count.toString() })
  if (level && level !== 'ALL') query.set('level', level)
  const res = await fetch(`${BASE_URL}/api/skills/listening/exercises?${query.toString()}`)
  if (!res.ok) throw new Error('Failed to fetch dictation exercises')
  return res.json()
}

export async function checkDictation(
  exerciseId: number,
  userInput: string,
): Promise<DictationCheckResponse> {
  const res = await fetch(`${BASE_URL}/api/skills/listening/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ exercise_id: exerciseId, user_input: userInput }),
  })
  if (!res.ok) throw new Error('Failed to check dictation')
  return res.json()
}

export async function fetchGrammarTopics(level?: string): Promise<GrammarTopicOverview[]> {
  const query = level && level !== 'ALL' ? `?level=${level}` : ''
  const res = await fetch(`${BASE_URL}/api/skills/grammar/topics${query}`)
  if (!res.ok) throw new Error('Failed to fetch grammar topics')
  return res.json()
}

export async function fetchGrammarTopicDetail(topicId: string): Promise<GrammarTopicDetail> {
  const res = await fetch(`${BASE_URL}/api/skills/grammar/topics/${topicId}`)
  if (!res.ok) throw new Error(`Failed to fetch grammar topic ${topicId}`)
  return res.json()
}

export async function submitGrammarQuiz(
  topicId: string,
  answers: Record<number, string>,
): Promise<GrammarSubmitResponse> {
  const res = await fetch(`${BASE_URL}/api/skills/grammar/topics/${topicId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  })
  if (!res.ok) throw new Error('Failed to submit grammar quiz')
  return res.json()
}

// -------------------------------------------------------------
// Profile, Goals & Backup APIs (Chức năng 1)
// -------------------------------------------------------------
import type {
  UserProfileResponse,
  UserProfileUpdate,
  UserGoalsUpdate,
  BackupDataPackage,
} from '../types/profile'

export async function fetchProfile(): Promise<UserProfileResponse> {
  const res = await fetch(`${BASE_URL}/api/profile`)
  if (!res.ok) throw new Error('Failed to fetch user profile')
  return res.json()
}

export async function updateProfile(data: UserProfileUpdate): Promise<UserProfileResponse> {
  const res = await fetch(`${BASE_URL}/api/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update profile')
  return res.json()
}

export async function updateGoals(data: UserGoalsUpdate): Promise<UserProfileResponse> {
  const res = await fetch(`${BASE_URL}/api/profile/goals`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update goals')
  return res.json()
}

export async function exportBackup(): Promise<BackupDataPackage> {
  const res = await fetch(`${BASE_URL}/api/profile/export`)
  if (!res.ok) throw new Error('Failed to export backup')
  return res.json()
}

export async function importBackup(pkg: BackupDataPackage): Promise<{ message: string }> {
  const res = await fetch(`${BASE_URL}/api/profile/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pkg),
  })
  if (!res.ok) throw new Error('Failed to import backup')
  return res.json()
}

export async function resetProgress(): Promise<{ message: string }> {
  const res = await fetch(`${BASE_URL}/api/profile/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirm_text: 'RESET' }),
  })
  if (!res.ok) throw new Error('Failed to reset progress')
  return res.json()
}
