import React, { useState, useEffect, useCallback } from 'react'
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Lock,
  PlayCircle,
  Clock,
  Award,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Compass,
} from 'lucide-react'
import { CourseOverview, CourseDetail, LessonOverview } from '../../types/course'
import { fetchCourses, fetchCourseDetail } from '../../lib/api'
import { LessonPlayerModal } from './LessonPlayerModal'

export const CoursesView: React.FC = () => {
  const [courses, setCourses] = useState<CourseOverview[]>([])
  const [activeCourseId, setActiveCourseId] = useState<string>('b2-first')
  const [courseDetail, setCourseDetail] = useState<CourseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Lesson Player State
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null)

  // Load list of courses
  const loadCourses = useCallback(async () => {
    try {
      const data = await fetchCourses()
      setCourses(data)
      if (data.length > 0 && !activeCourseId) {
        setActiveCourseId(data[0].id)
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách khóa học')
    } finally {
      setLoading(false)
    }
  }, [activeCourseId])

  // Load course detail
  const loadCourseDetail = useCallback(async (courseId: string) => {
    setDetailLoading(true)
    try {
      const detail = await fetchCourseDetail(courseId)
      setCourseDetail(detail)
    } catch (err: any) {
      console.error('Failed to load course detail:', err)
    } finally {
      setDetailLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCourses()
  }, [loadCourses])

  useEffect(() => {
    if (activeCourseId) {
      loadCourseDetail(activeCourseId)
    }
  }, [activeCourseId, loadCourseDetail])

  const handleLessonCompleted = () => {
    // Reload courses and current course detail to update unlocked status
    loadCourses()
    if (activeCourseId) {
      loadCourseDetail(activeCourseId)
    }
  }

  const handleNextLesson = (nextLessonId: string) => {
    setActiveLessonId(nextLessonId)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div className="loading-spinner" style={{ marginBottom: 16 }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Đang tải lộ trình khóa học...</p>
      </div>
    )
  }

  if (error && courses.length === 0) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center', maxWidth: 480, margin: '40px auto' }}>
        <h4 style={{ color: '#fff', marginBottom: 8 }}>Không thể tải khóa học</h4>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>{error}</p>
        <button className="btn btn-primary" onClick={loadCourses}>
          <RotateCcw size={16} /> Thử lại
        </button>
      </div>
    )
  }

  const activeCourse = courses.find((c) => c.id === activeCourseId) || courses[0]

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Course Level Switcher Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: 12,
        }}
      >
        {courses.map((c) => {
          const isSelected = c.id === activeCourseId
          const isB2 = c.level === 'B2'
          const accentColor = isB2 ? '#38bdf8' : '#c084fc'

          return (
            <button
              key={c.id}
              onClick={() => setActiveCourseId(c.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 18px',
                borderRadius: 10,
                background: isSelected ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.03)',
                border: isSelected ? `1px solid ${accentColor}` : '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: isSelected ? `${accentColor}22` : 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <GraduationCap size={18} color={isSelected ? accentColor : 'var(--text-muted)'} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: isSelected ? '#fff' : 'var(--text-secondary)' }}>
                  Khóa học {c.level}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {c.completed_lessons_count} / {c.total_lessons} bài ({c.progress_percentage}%)
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Hero Overview Banner */}
      {activeCourse && (
        <div
          className="card"
          style={{
            background:
              activeCourse.level === 'B2'
                ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)'
                : 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border:
              activeCourse.level === 'B2'
                ? '1px solid rgba(56, 189, 248, 0.3)'
                : '1px solid rgba(192, 132, 252, 0.3)',
            padding: 24,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span className={`card-level-tag tag-${activeCourse.level.toLowerCase()}`}>
                  Khóa {activeCourse.level} Chuẩn CEFR
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {activeCourse.total_units} Units • {activeCourse.total_lessons} Bài học • {activeCourse.total_vocab} Từ vựng
                </span>
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
                {activeCourse.title}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 640, lineHeight: 1.5 }}>
                {activeCourse.description}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tiến độ hoàn thành</div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: activeCourse.progress_percentage === 100 ? '#34d399' : '#38bdf8',
                  }}
                >
                  {activeCourse.progress_percentage}%
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {activeCourse.completed_lessons_count} / {activeCourse.total_lessons} bài học
                </div>
              </div>

              {activeCourse.current_lesson_id && (
                <button
                  className="btn btn-primary"
                  style={{
                    padding: '12px 20px',
                    fontSize: 14,
                    boxShadow: '0 4px 14px rgba(56, 189, 248, 0.3)',
                  }}
                  onClick={() => setActiveLessonId(activeCourse.current_lesson_id!)}
                >
                  <PlayCircle size={18} /> Học bài tiếp theo
                </button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 20, height: 8, borderRadius: 999, background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${activeCourse.progress_percentage}%`,
                background: activeCourse.level === 'B2' ? '#38bdf8' : '#c084fc',
                borderRadius: 999,
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Units & Lessons Syllabus Roadmap */}
      {detailLoading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div className="loading-spinner" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Đang tải danh sách bài học...</p>
        </div>
      ) : courseDetail ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {courseDetail.units.map((unit) => (
            <div key={unit.id} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Unit Header Card */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(30, 41, 59, 0.5)',
                  padding: '14px 20px',
                  borderRadius: 12,
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: 'rgba(56, 189, 248, 0.1)',
                      color: '#38bdf8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 14,
                    }}
                  >
                    U{unit.unit_number}
                  </div>
                  <div>
                    <h4 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>
                      Unit {unit.unit_number}: {unit.title}
                    </h4>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{unit.description}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {unit.completed_count} / {unit.total_lessons} bài
                    </span>
                    <span
                      style={{
                        marginLeft: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        color: unit.progress_percentage === 100 ? '#34d399' : '#38bdf8',
                      }}
                    >
                      {unit.progress_percentage}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Lesson Roadmap Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 14,
                }}
              >
                {unit.lessons.map((lesson: LessonOverview) => {
                  const isCompleted = lesson.is_completed
                  const isUnlocked = lesson.is_unlocked
                  const isLocked = !isUnlocked && !isCompleted

                  return (
                    <div
                      key={lesson.id}
                      className="card"
                      style={{
                        padding: 18,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        background: isCompleted
                          ? 'rgba(16, 185, 129, 0.05)'
                          : isUnlocked
                          ? 'rgba(30, 41, 59, 0.8)'
                          : 'rgba(15, 23, 42, 0.4)',
                        border: isCompleted
                          ? '1px solid rgba(16, 185, 129, 0.3)'
                          : isUnlocked
                          ? '1px solid rgba(56, 189, 248, 0.4)'
                          : '1px solid rgba(255, 255, 255, 0.05)',
                        opacity: isLocked ? 0.6 : 1,
                        position: 'relative',
                        transition: 'transform 0.2s ease, border-color 0.2s ease',
                      }}
                    >
                      {/* Card Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                          Bài {lesson.lesson_number}
                        </span>

                        {isCompleted ? (
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#34d399',
                              background: 'rgba(16, 185, 129, 0.15)',
                              padding: '2px 8px',
                              borderRadius: 999,
                            }}
                          >
                            <CheckCircle2 size={12} /> Hoàn thành {lesson.score ? `(${lesson.score}%)` : ''}
                          </span>
                        ) : isUnlocked ? (
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#38bdf8',
                              background: 'rgba(56, 189, 248, 0.15)',
                              padding: '2px 8px',
                              borderRadius: 999,
                            }}
                          >
                            <Sparkles size={12} /> Sẵn sàng học
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 11,
                              fontWeight: 600,
                              color: 'var(--text-muted)',
                              background: 'rgba(255, 255, 255, 0.05)',
                              padding: '2px 8px',
                              borderRadius: 999,
                            }}
                          >
                            <Lock size={12} /> Khóa
                          </span>
                        )}
                      </div>

                      {/* Lesson Content Meta */}
                      <div style={{ marginBottom: 14 }}>
                        <h5 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
                          {lesson.title}
                        </h5>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                          {lesson.grammar_focus}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <BookOpen size={13} /> {lesson.vocab_count} từ
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={13} /> {lesson.estimated_minutes}p
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fbbf24' }}>
                            <Award size={13} /> +{lesson.xp} XP
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div>
                        {isCompleted ? (
                          <button
                            className="btn btn-secondary"
                            style={{ width: '100%', fontSize: 12, padding: '6px 12px' }}
                            onClick={() => setActiveLessonId(lesson.id)}
                          >
                            <RotateCcw size={14} /> Ôn lại bài này
                          </button>
                        ) : isUnlocked ? (
                          <button
                            className="btn btn-primary"
                            style={{ width: '100%', fontSize: 12, padding: '6px 12px' }}
                            onClick={() => setActiveLessonId(lesson.id)}
                          >
                            <PlayCircle size={14} /> Bắt đầu học bài
                          </button>
                        ) : (
                          <button
                            className="btn btn-secondary"
                            disabled
                            style={{ width: '100%', fontSize: 12, padding: '6px 12px', opacity: 0.5, cursor: 'not-allowed' }}
                          >
                            <Lock size={14} /> Chưa mở khóa
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Interactive Lesson Player Modal */}
      {activeLessonId && (
        <LessonPlayerModal
          courseId={activeLessonId.startsWith('c1-') ? 'c1-advanced' : 'b2-first'}
          lessonId={activeLessonId}
          onClose={() => setActiveLessonId(null)}
          onLessonCompleted={handleLessonCompleted}
          onNextLesson={handleNextLesson}
        />
      )}
    </div>
  )
}
