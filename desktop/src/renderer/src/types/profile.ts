export interface UserInfo {
  id: string
  name: string
  email: string
  avatar_initials: string
  bio: string
  joined_date: string
  is_authenticated: boolean
}

export interface UserGoals {
  target_level: string
  target_cert: string
  daily_vocab_target: number
  daily_time_target_minutes: number
  preferred_accent: string
  reminder_time: string
}

export interface UserPreferences {
  sound_effects: boolean
  auto_play_audio: boolean
  dark_mode: boolean
}

export interface BadgeItem {
  id: string
  title: string
  desc: string
  icon: string
  category: string
  is_unlocked: boolean
  unlocked_date?: string | null
  progress_pct: number
}

export interface UserProfileResponse {
  user: UserInfo
  goals: UserGoals
  preferences: UserPreferences
  badges: BadgeItem[]
  total_vocab_mastered: number
  current_streak: number
  total_tests_taken: number
}

export interface UserProfileUpdate {
  name?: string
  email?: string
  bio?: string
  avatar_initials?: string
}

export interface UserGoalsUpdate {
  target_level?: string
  target_cert?: string
  daily_vocab_target?: number
  daily_time_target_minutes?: number
  preferred_accent?: string
  reminder_time?: string
}

export interface BackupDataPackage {
  version: string
  exported_at: string
  profile: Record<string, any>
  progress: Record<string, any>
}
