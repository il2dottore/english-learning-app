import React, { useState, useEffect } from 'react'
import {
  X,
  Volume2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Award,
  BookOpen,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Flame,
  ArrowRight,
} from 'lucide-react'
import { LessonDetail, LessonCompleteResponse } from '../../types/course'
import { fetchLessonDetail, completeLesson, speakEnglish } from '../../lib/api'

interface LessonPlayerModalProps {
  courseId: string
  lessonId: string
  onClose: () => void
  onLessonCompleted: (res: LessonCompleteResponse) => void
  onNextLesson?: (nextLessonId: string) => void
}

type TabStep = 'vocab' | 'grammar' | 'practice' | 'quiz' | 'result'

export const LessonPlayerModal: React.FC<LessonPlayerModalProps> = ({
  courseId,
  lessonId,
  onClose,
  onLessonCompleted,
  onNextLesson,
}) => {
  const [lesson, setLesson] = useState<LessonDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Player Navigation
  const [currentStep, setCurrentStep] = useState<TabStep>('vocab')

  // Vocab Step State
  const [vocabIndex, setVocabIndex] = useState(0)
  const [showVocabMeaning, setShowVocabMeaning] = useState(false)

  // Practice Cloze State
  const [practiceAnswers, setPracticeAnswers] = useState<Record<number, string>>({})
  const [practiceChecked, setPracticeChecked] = useState(false)

  // Checkpoint Quiz State
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizScore, setQuizScore] = useState(0)
  const [completeResult, setCompleteResult] = useState<LessonCompleteResponse | null>(null)
  const [submittingComplete, setSubmittingComplete] = useState(false)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)
    setCurrentStep('vocab')
    setVocabIndex(0)
    setShowVocabMeaning(false)
    setPracticeAnswers({})
    setPracticeChecked(false)
    setQuizAnswers({})
    setQuizSubmitted(false)
    setQuizScore(0)
    setCompleteResult(null)

    fetchLessonDetail(courseId, lessonId)
      .then((data) => {
        if (isMounted) {
          setLesson(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Không thể tải nội dung bài học')
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [courseId, lessonId])

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="card" style={{ padding: 40, textAlign: 'center', maxWidth: 400 }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
          <h4 style={{ color: '#fff' }}>Đang tải bài học...</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>
            Đang trích xuất từ vựng và tạo bài kiểm tra mở khóa
          </p>
        </div>
      </div>
    )
  }

  if (error || !lesson) {
    return (
      <div className="modal-overlay">
        <div className="card" style={{ padding: 32, textAlign: 'center', maxWidth: 420 }}>
          <AlertCircle size={40} color="#f87171" style={{ margin: '0 auto 16px' }} />
          <h4 style={{ color: '#fff', marginBottom: 8 }}>Lỗi tải bài học</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>{error}</p>
          <button className="btn btn-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    )
  }

  const currentVocab = lesson.vocabularies[vocabIndex]
  const totalVocab = lesson.vocabularies.length

  // Practice questions (first 4 vocabularies)
  const practiceItems = lesson.vocabularies.slice(0, 4)

  const handleNextVocab = () => {
    if (vocabIndex < totalVocab - 1) {
      setVocabIndex((prev) => prev + 1)
      setShowVocabMeaning(false)
    } else {
      setCurrentStep('grammar')
    }
  }

  const handlePrevVocab = () => {
    if (vocabIndex > 0) {
      setVocabIndex((prev) => prev - 1)
      setShowVocabMeaning(false)
    }
  }

  const handleSelectQuizOption = (questionId: number, option: string) => {
    if (quizSubmitted) return
    setQuizAnswers((prev) => ({ ...prev, [questionId]: option }))
  }

  const handleSubmitQuiz = async () => {
    if (!lesson.checkpoint_quiz || lesson.checkpoint_quiz.length === 0) return

    let correctCount = 0
    lesson.checkpoint_quiz.forEach((q) => {
      if (quizAnswers[q.id] === q.correct_answer) {
        correctCount++
      }
    })

    setQuizScore(correctCount)
    setQuizSubmitted(true)
    setCurrentStep('result')

    // If passed (score >= 4 or >= 80%), submit complete to backend
    const totalQuestions = lesson.checkpoint_quiz.length
    const passThreshold = Math.ceil(totalQuestions * 0.8)
    const passed = correctCount >= passThreshold

    if (passed) {
      setSubmittingComplete(true)
      try {
        const res = await completeLesson(courseId, lessonId, correctCount)
        setCompleteResult(res)
        onLessonCompleted(res)
      } catch (err) {
        console.error('Failed to submit lesson completion:', err)
      } finally {
        setSubmittingComplete(false)
      }
    }
  }

  const handleRetryQuiz = () => {
    setQuizAnswers({})
    setQuizSubmitted(false)
    setQuizScore(0)
    setCurrentStep('quiz')
  }

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 1000 }}>
      <div
        className="card"
        style={{
          width: '94%',
          maxWidth: 960,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        }}
      >
        {/* Modal Top Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className={`card-level-tag tag-${lesson.level.toLowerCase()}`}>
              {lesson.level} • Bài {lesson.lesson_number}
            </span>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>
                {lesson.title}
              </h3>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {lesson.course_title} • {lesson.unit_title}
              </div>
            </div>
          </div>

          <button
            className="btn btn-icon"
            onClick={onClose}
            style={{ color: 'var(--text-muted)' }}
            title="Đóng bài học"
          >
            <X size={20} />
          </button>
        </div>

        {/* 4-Step Progress Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-color)',
            background: 'rgba(30, 41, 59, 0.3)',
          }}
        >
          {[
            { id: 'vocab', label: `1. Từ vựng (${totalVocab} từ)`, icon: BookOpen },
            { id: 'grammar', label: '2. Ngữ pháp & Ngữ cảnh', icon: Sparkles },
            { id: 'practice', label: '3. Thực hành phản xạ', icon: Flame },
            { id: 'quiz', label: '4. Checkpoint Quiz', icon: Award },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = currentStep === tab.id || (tab.id === 'quiz' && currentStep === 'result')
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentStep(tab.id as TabStep)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#38bdf8' : 'var(--text-muted)',
                  borderBottom: isActive ? '2px solid #38bdf8' : '2px solid transparent',
                  background: isActive ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                  cursor: 'pointer',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Modal Main Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {/* STEP 1: VOCABULARY DISCOVERY */}
          {currentStep === 'vocab' && currentVocab && (
            <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Từ {vocabIndex + 1} / {totalVocab}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '4px 10px', fontSize: 12 }}
                    disabled={vocabIndex === 0}
                    onClick={handlePrevVocab}
                  >
                    <ChevronLeft size={16} /> Trước
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ padding: '4px 12px', fontSize: 12 }}
                    onClick={handleNextVocab}
                  >
                    {vocabIndex === totalVocab - 1 ? 'Sang Ngữ pháp' : 'Tiếp theo'}{' '}
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Big Interactive Vocab Flashcard */}
              <div
                className="card"
                style={{
                  minHeight: 320,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 36,
                  background:
                    'linear-gradient(145deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: 16,
                  cursor: 'pointer',
                  position: 'relative',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)',
                }}
                onClick={() => setShowVocabMeaning((prev) => !prev)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span className={`card-level-tag tag-${currentVocab.level.toLowerCase()}`}>
                    {currentVocab.level}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    ({currentVocab.part_of_speech})
                  </span>
                  <button
                    className="btn btn-icon"
                    style={{ padding: 6, color: '#38bdf8' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      speakEnglish(currentVocab.word)
                    }}
                    title="Phát âm từ vựng"
                  >
                    <Volume2 size={20} />
                  </button>
                </div>

                <h2
                  style={{
                    fontSize: 38,
                    fontWeight: 800,
                    color: '#fff',
                    marginBottom: 8,
                    letterSpacing: '-0.5px',
                  }}
                >
                  {currentVocab.word}
                </h2>

                <div
                  style={{
                    fontSize: 16,
                    color: '#94a3b8',
                    fontFamily: 'monospace',
                    marginBottom: 20,
                  }}
                >
                  {currentVocab.ipa_uk}
                </div>

                {showVocabMeaning ? (
                  <div className="animate-fade-in" style={{ width: '100%' }}>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: '#34d399',
                        marginBottom: 16,
                      }}
                    >
                      {currentVocab.vietnamese_meaning}
                    </div>

                    <div
                      style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        padding: '14px 18px',
                        borderRadius: 8,
                        color: 'var(--text-secondary)',
                        fontSize: 14,
                        lineHeight: 1.6,
                        fontStyle: 'italic',
                        textAlign: 'left',
                      }}
                    >
                      "{currentVocab.example}"
                    </div>

                    {currentVocab.synonyms && currentVocab.synonyms.length > 0 && (
                      <div
                        style={{
                          marginTop: 14,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          justifyContent: 'center',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Đồng nghĩa:</span>
                        {currentVocab.synonyms.map((s, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: 12,
                              background: 'rgba(56, 189, 248, 0.1)',
                              color: '#38bdf8',
                              padding: '2px 8px',
                              borderRadius: 4,
                            }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 12 }}>
                    (Nhấp chuột vào thẻ để xem định nghĩa tiếng Việt & ví dụ)
                  </div>
                )}
              </div>

              <div
                style={{
                  marginTop: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                }}
              >
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowVocabMeaning((prev) => !prev)}
                >
                  {showVocabMeaning ? 'Ẩn nghĩa' : 'Hiện nghĩa tiếng Việt'}
                </button>
                <button className="btn btn-primary" onClick={handleNextVocab}>
                  {vocabIndex === totalVocab - 1 ? 'Chuyển sang Bước 2 (Ngữ pháp)' : 'Từ tiếp theo'}{' '}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: GRAMMAR & READING CONTEXT */}
          {currentStep === 'grammar' && (
            <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Grammar Card */}
              <div
                className="card"
                style={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(192, 132, 252, 0.3)',
                  padding: 24,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Sparkles size={20} color="#c084fc" />
                  <h4 style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: 0 }}>
                    Tiêu điểm Ngữ pháp: {lesson.grammar_focus}
                  </h4>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                  {lesson.grammar_notes}
                </div>
              </div>

              {/* Reading Passage Card */}
              <div
                className="card"
                style={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  padding: 24,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <BookOpen size={20} color="#38bdf8" />
                  <h4 style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: 0 }}>
                    Đọc hiểu ngữ cảnh: {lesson.reading_topic}
                  </h4>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                  {lesson.reading_text}
                </div>

                <div
                  style={{
                    marginTop: 16,
                    padding: 14,
                    borderRadius: 8,
                    background: 'rgba(56, 189, 248, 0.06)',
                    borderLeft: '3px solid #38bdf8',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#38bdf8', marginBottom: 4 }}>
                    Mẹo tiếp thu:
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Hãy để ý cách các từ vựng mới được lồng ghép tự nhiên vào các cấu trúc câu phức tạp để tăng điểm phong cách diễn đạt (lexical resource).
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button className="btn btn-secondary" onClick={() => setCurrentStep('vocab')}>
                  <ChevronLeft size={16} /> Quay lại Từ vựng
                </button>
                <button className="btn btn-primary" onClick={() => setCurrentStep('practice')}>
                  Luyện tập phản xạ <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: INTERACTIVE PRACTICE LAB */}
          {currentStep === 'practice' && (
            <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h4 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
                  Luyện tập điền từ theo ngữ cảnh (Contextual Practice)
                </h4>
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  Chọn từ vựng chính xác để hoàn thiện câu ví dụ.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {practiceItems.map((item, idx) => {
                  const sentenceWithBlank = item.example.replace(
                    new RegExp(`\\b${item.word}\\b`, 'gi'),
                    '__________',
                  )
                  // generate 3 options
                  const distractors = lesson.vocabularies
                    .filter((v) => v.id !== item.id)
                    .slice(0, 2)
                    .map((v) => v.word)
                  const options = [item.word, ...distractors].sort()

                  const selected = practiceAnswers[item.id]
                  const isCorrect = selected === item.word

                  return (
                    <div
                      key={item.id}
                      className="card"
                      style={{
                        padding: 18,
                        background: 'rgba(30, 41, 59, 0.6)',
                        border: practiceChecked
                          ? isCorrect
                            ? '1px solid #10b981'
                            : '1px solid #ef4444'
                          : '1px solid var(--border-color)',
                      }}
                    >
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                        Câu {idx + 1} • ({item.vietnamese_meaning})
                      </div>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 500,
                          color: '#fff',
                          marginBottom: 12,
                          lineHeight: 1.5,
                        }}
                      >
                        {sentenceWithBlank}
                      </div>

                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {options.map((opt) => {
                          const isOptSelected = selected === opt
                          return (
                            <button
                              key={opt}
                              onClick={() => {
                                if (practiceChecked) return
                                setPracticeAnswers((prev) => ({ ...prev, [item.id]: opt }))
                              }}
                              style={{
                                padding: '6px 14px',
                                borderRadius: 6,
                                fontSize: 13,
                                fontWeight: isOptSelected ? 700 : 500,
                                background: isOptSelected
                                  ? 'rgba(56, 189, 248, 0.2)'
                                  : 'rgba(255, 255, 255, 0.05)',
                                color: isOptSelected ? '#38bdf8' : 'var(--text-secondary)',
                                border: isOptSelected
                                  ? '1px solid #38bdf8'
                                  : '1px solid var(--border-color)',
                                cursor: practiceChecked ? 'default' : 'pointer',
                              }}
                            >
                              {opt}
                            </button>
                          )
                        })}
                      </div>

                      {practiceChecked && (
                        <div
                          style={{
                            marginTop: 10,
                            fontSize: 12,
                            color: isCorrect ? '#34d399' : '#f87171',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          {isCorrect ? (
                            <>
                              <CheckCircle2 size={14} /> Chính xác! "{item.word}": {item.vietnamese_meaning}
                            </>
                          ) : (
                            <>
                              <AlertCircle size={14} /> Đáp án đúng là: <strong>{item.word}</strong>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                <button className="btn btn-secondary" onClick={() => setCurrentStep('grammar')}>
                  <ChevronLeft size={16} /> Quay lại Ngữ pháp
                </button>

                <div style={{ display: 'flex', gap: 10 }}>
                  {!practiceChecked ? (
                    <button
                      className="btn btn-primary"
                      onClick={() => setPracticeChecked(true)}
                    >
                      Kiểm tra đáp án
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary"
                      onClick={() => setCurrentStep('quiz')}
                    >
                      Làm Checkpoint Quiz mở khóa <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: CHECKPOINT QUIZ */}
          {currentStep === 'quiz' && (
            <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(56, 189, 248, 0.08)',
                  padding: '14px 18px',
                  borderRadius: 10,
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                }}
              >
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: '#38bdf8', margin: 0 }}>
                    Checkpoint Quiz: Điều kiện mở khóa bài tiếp theo
                  </h4>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    Đạt từ 4/5 câu đúng (≥ 80%) để hoàn thành bài học và mở khóa bài kế tiếp!
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Award size={20} color="#fbbf24" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>
                    +50 XP
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {lesson.checkpoint_quiz.map((q, idx) => {
                  const selectedOpt = quizAnswers[q.id]
                  return (
                    <div
                      key={q.id}
                      className="card"
                      style={{
                        padding: 18,
                        background: 'rgba(30, 41, 59, 0.7)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--text-muted)',
                          marginBottom: 6,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <HelpCircle size={14} color="#38bdf8" /> Câu {idx + 1} / {lesson.checkpoint_quiz.length}
                      </div>

                      <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 14 }}>
                        {q.prompt}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {q.options.map((opt, oIdx) => {
                          const isSelected = selectedOpt === opt
                          return (
                            <button
                              key={oIdx}
                              onClick={() => handleSelectQuizOption(q.id, opt)}
                              style={{
                                padding: '10px 14px',
                                borderRadius: 8,
                                fontSize: 13,
                                textAlign: 'left',
                                fontWeight: isSelected ? 700 : 500,
                                background: isSelected
                                  ? 'rgba(56, 189, 248, 0.2)'
                                  : 'rgba(255, 255, 255, 0.04)',
                                color: isSelected ? '#38bdf8' : 'var(--text-secondary)',
                                border: isSelected
                                  ? '1px solid #38bdf8'
                                  : '1px solid var(--border-color)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              {opt}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button className="btn btn-secondary" onClick={() => setCurrentStep('practice')}>
                  <ChevronLeft size={16} /> Quay lại Thực hành
                </button>

                <button
                  className="btn btn-primary"
                  style={{ padding: '10px 24px', fontSize: 14 }}
                  disabled={Object.keys(quizAnswers).length < lesson.checkpoint_quiz.length}
                  onClick={handleSubmitQuiz}
                >
                  Nộp bài & Chấm điểm Checkpoint
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: QUIZ RESULT & CELEBRATION */}
          {currentStep === 'result' && (
            <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', padding: '20px 0' }}>
              {quizScore >= Math.ceil(lesson.checkpoint_quiz.length * 0.8) ? (
                <div className="animate-fade-in">
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 999,
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '2px solid #10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                    }}
                  >
                    <Award size={44} color="#34d399" />
                  </div>

                  <h3 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
                    Chúc mừng! Bạn đã vượt qua bài học!
                  </h3>

                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
                    Bạn đã hoàn thành xuất sắc bài <strong>{lesson.title}</strong> với kết quả{' '}
                    <strong style={{ color: '#34d399' }}>
                      {quizScore} / {lesson.checkpoint_quiz.length} câu đúng
                    </strong>
                    . Bài học tiếp theo đã được mở khóa!
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: 20,
                      marginBottom: 28,
                    }}
                  >
                    <div
                      className="card"
                      style={{ padding: '14px 24px', background: 'rgba(30, 41, 59, 0.6)' }}
                    >
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Điểm số</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#34d399' }}>
                        {Math.round((quizScore / lesson.checkpoint_quiz.length) * 100)}%
                      </div>
                    </div>

                    <div
                      className="card"
                      style={{ padding: '14px 24px', background: 'rgba(30, 41, 59, 0.6)' }}
                    >
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>XP Thưởng</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#fbbf24' }}>+50 XP</div>
                    </div>

                    {completeResult && (
                      <div
                        className="card"
                        style={{ padding: '14px 24px', background: 'rgba(30, 41, 59, 0.6)' }}
                      >
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tiến độ khóa học</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: '#38bdf8' }}>
                          {completeResult.course_progress_percentage}%
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                    <button className="btn btn-secondary" onClick={onClose}>
                      Quay lại Lộ trình
                    </button>

                    {completeResult?.next_lesson_id && onNextLesson && (
                      <button
                        className="btn btn-primary"
                        onClick={() => onNextLesson(completeResult.next_lesson_id!)}
                      >
                        Học bài kế tiếp ngay <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="animate-fade-in">
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 999,
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '2px solid #ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                    }}
                  >
                    <AlertCircle size={44} color="#f87171" />
                  </div>

                  <h3 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
                    Chưa đạt tiêu chuẩn mở khóa
                  </h3>

                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
                    Bạn đạt{' '}
                    <strong style={{ color: '#f87171' }}>
                      {quizScore} / {lesson.checkpoint_quiz.length} câu đúng
                    </strong>
                    . Cần đạt ít nhất 4/5 câu để mở khóa bài tiếp theo. Hãy xem lại giải thích và thử lại nhé!
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                    <button className="btn btn-secondary" onClick={() => setCurrentStep('vocab')}>
                      Ôn lại Từ vựng
                    </button>
                    <button className="btn btn-primary" onClick={handleRetryQuiz}>
                      <RotateCcw size={16} /> Làm lại Quiz
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
