import React, { useState, useEffect, useCallback } from 'react'
import {
  FileCheck2,
  CheckCircle2,
  XCircle,
  Volume2,
  Trophy,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Award,
  Clock,
  Flame,
  AlertTriangle,
  Star,
  Zap,
  Sliders,
  History,
  BookX,
  PlayCircle,
  HelpCircle,
} from 'lucide-react'
import {
  TestQuestionItem,
  TestResultResponse,
  TestHistoryItem,
  MistakeItem,
} from '../../types/testing'
import {
  generateTest,
  submitTest,
  fetchTestHistory,
  fetchMistakesList,
  speakEnglish,
  toggleWordStar,
} from '../../lib/api'

interface TestViewProps {
  currentLevel: string
}

type MainTab = 'quiz' | 'history' | 'mistakes'
type QuizMode = 'quick' | 'standard' | 'custom' | 'mistakes'

export const TestView: React.FC<TestViewProps> = ({ currentLevel }) => {
  const [activeTab, setActiveTab] = useState<MainTab>('quiz')

  // Lobby Configuration State
  const [selectedMode, setSelectedMode] = useState<QuizMode>('quick')
  const [selectedLevel, setSelectedLevel] = useState<string>(
    currentLevel === 'ALL' ? 'ALL' : currentLevel,
  )
  const [questionCount, setQuestionCount] = useState<number>(10)
  const [enableTimer, setEnableTimer] = useState<boolean>(true)

  // Exam Arena State
  const [isExamActive, setIsExamActive] = useState(false)
  const [questions, setQuestions] = useState<TestQuestionItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({})
  const [timeLeft, setTimeLeft] = useState<number>(30)
  const [startTime, setStartTime] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  // Result State
  const [examResult, setExamResult] = useState<TestResultResponse | null>(null)
  const [starredMap, setStarredMap] = useState<Record<number, boolean>>({})

  // History Tab State
  const [historyList, setHistoryList] = useState<TestHistoryItem[]>([])
  const [historyStats, setHistoryStats] = useState({ total_tests: 0, average_score: 0, total_xp: 0 })
  const [historyLoading, setHistoryLoading] = useState(false)

  // Mistakes Tab State
  const [mistakesList, setMistakesList] = useState<MistakeItem[]>([])
  const [mistakesLoading, setMistakesLoading] = useState(false)

  // Update selected level when parent prop changes
  useEffect(() => {
    if (currentLevel && currentLevel !== 'ALL') {
      setSelectedLevel(currentLevel)
    }
  }, [currentLevel])

  // Load History
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const data = await fetchTestHistory()
      setHistoryList(data.items)
      setHistoryStats({
        total_tests: data.total_tests,
        average_score: data.average_score,
        total_xp: data.total_xp,
      })
    } catch (e) {
      console.error('Failed to load test history:', e)
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  // Load Mistakes
  const loadMistakes = useCallback(async () => {
    setMistakesLoading(true)
    try {
      const data = await fetchMistakesList(30)
      setMistakesList(data.items)
    } catch (e) {
      console.error('Failed to load mistakes:', e)
    } finally {
      setMistakesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'history') loadHistory()
    if (activeTab === 'mistakes') loadMistakes()
  }, [activeTab, loadHistory, loadMistakes])

  // Start Exam
  const handleStartExam = async (overrideMode?: QuizMode) => {
    const modeToUse = overrideMode || selectedMode
    let count = questionCount
    if (modeToUse === 'quick') count = 10
    if (modeToUse === 'standard') count = 20
    if (modeToUse === 'mistakes') count = 10

    setLoading(true)
    setIsExamActive(false)
    setExamResult(null)
    setUserAnswers({})
    setCurrentIndex(0)
    setTimeLeft(30)

    try {
      const data = await generateTest({
        level: selectedLevel,
        count: count,
        mode: modeToUse,
      })
      if (data.length === 0) {
        alert('Không tìm thấy từ vựng phù hợp để tạo đề thi!')
        setLoading(false)
        return
      }
      setQuestions(data)
      setIsExamActive(true)
      setActiveTab('quiz')
      setStartTime(Date.now())
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo đề thi')
    } finally {
      setLoading(false)
    }
  }

  // Timer Tick
  useEffect(() => {
    if (!isExamActive || !enableTimer || examResult) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time out for current question: auto next
          handleNextQuestion()
          return 30
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isExamActive, enableTimer, currentIndex, examResult])

  const handleSelectOption = (option: string) => {
    const currentQ = questions[currentIndex]
    if (!currentQ || examResult) return
    setUserAnswers((prev) => ({ ...prev, [currentQ.id]: option }))
  }

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setTimeLeft(30)
    } else {
      handleFinishExam()
    }
  }

  const handleFinishExam = async () => {
    const durationSec = Math.round((Date.now() - startTime) / 1000)
    const answersList = questions.map((q) => ({
      question_id: q.id,
      selected_answer: userAnswers[q.id] || '',
    }))

    const titleMap: Record<QuizMode, string> = {
      quick: `Quick Test 10 (${selectedLevel})`,
      standard: `Standard Assessment (${selectedLevel})`,
      custom: `Custom Challenge (${selectedLevel})`,
      mistakes: 'Đề thi Khắc phục Lỗi sai',
    }

    setLoading(true)
    try {
      const res = await submitTest({
        title: titleMap[selectedMode],
        level: selectedLevel,
        mode: selectedMode,
        duration_seconds: durationSec,
        answers: answersList,
      })
      setExamResult(res)
      setIsExamActive(false)
    } catch (err: any) {
      alert(err.message || 'Lỗi nộp bài kiểm tra')
    } finally {
      setLoading(false)
    }
  }

  // Keyboard navigation: 1, 2, 3, 4 to select options
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isExamActive || examResult) return
      const currentQ = questions[currentIndex]
      if (!currentQ) return

      if (['1', '2', '3', '4'].includes(e.key)) {
        const optIdx = parseInt(e.key) - 1
        if (currentQ.options[optIdx]) {
          handleSelectOption(currentQ.options[optIdx])
        }
      } else if (e.key === 'Enter') {
        handleNextQuestion()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isExamActive, currentIndex, questions, userAnswers, examResult])

  const handleStarWord = async (vocabId: number) => {
    try {
      const isStarred = await toggleWordStar(vocabId)
      setStarredMap((prev) => ({ ...prev, [vocabId]: isStarred }))
    } catch (e) {
      console.error(e)
    }
  }

  const currentQ = questions[currentIndex]

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Tabs Switcher */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: 12,
        }}
      >
        <button
          onClick={() => {
            setActiveTab('quiz')
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 8,
            background: activeTab === 'quiz' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            border: activeTab === 'quiz' ? '1px solid #38bdf8' : '1px solid transparent',
            color: activeTab === 'quiz' ? '#38bdf8' : 'var(--text-secondary)',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <Zap size={16} />
          <span>Phòng thi trắc nghiệm</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('history')
            setIsExamActive(false)
            setExamResult(null)
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 8,
            background: activeTab === 'history' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
            border: activeTab === 'history' ? '1px solid #10b981' : '1px solid transparent',
            color: activeTab === 'history' ? '#34d399' : 'var(--text-secondary)',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <History size={16} />
          <span>Lịch sử bài thi ({historyStats.total_tests})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('mistakes')
            setIsExamActive(false)
            setExamResult(null)
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 8,
            background: activeTab === 'mistakes' ? 'rgba(244, 63, 94, 0.15)' : 'transparent',
            border: activeTab === 'mistakes' ? '1px solid #f43f5e' : '1px solid transparent',
            color: activeTab === 'mistakes' ? '#fb7185' : 'var(--text-secondary)',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <BookX size={16} />
          <span>Sổ tay lỗi sai</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: ACTIVE QUIZ (LOBBY / EXAM ARENA / RESULT)        */}
      {/* ======================================================== */}
      {activeTab === 'quiz' && (
        <>
          {/* STATE A: QUIZ LOBBY (BEFORE STARTING) */}
          {!isExamActive && !examResult && (
            <div style={{ maxWidth: 840, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Lobby Header Card */}
              <div
                className="card"
                style={{
                  background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  padding: 28,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Sparkles size={18} color="#38bdf8" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                    Trung Tâm Đánh Giá Trí Nhớ & Phản Xạ
                  </span>
                </div>
                <h3 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
                  Chọn Chế Độ Kiểm Tra Tiếng Anh
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                  Hệ thống tự động sinh các câu hỏi trắc nghiệm từ <strong>2,015 từ vựng chuẩn JSON</strong> kèm 4 lựa chọn gây nhiễu thông minh.
                </p>
              </div>

              {/* Mode Selection Grid */}
              <div className="grid-2">
                {[
                  {
                    id: 'quick',
                    title: '⚡ Quick Test (10 câu)',
                    desc: 'Kiểm tra phản xạ nhanh trong 3 phút, phù hợp khởi động mỗi ngày.',
                    badge: 'Phổ biến',
                    accent: '#38bdf8',
                  },
                  {
                    id: 'standard',
                    title: '🎯 Standard Assessment (20 câu)',
                    desc: 'Đánh giá toàn diện năng lực từ vựng học thuật B2 & C1.',
                    badge: 'Khuyên dùng',
                    accent: '#10b981',
                  },
                  {
                    id: 'custom',
                    title: '🛠️ Thử Thách Tùy Biến (Custom)',
                    desc: 'Tự chọn số câu hỏi và cấp độ theo nhu cầu ôn luyện riêng.',
                    badge: 'Linh hoạt',
                    accent: '#c084fc',
                  },
                  {
                    id: 'mistakes',
                    title: '🩹 Đề Thi Khắc Phục Lỗi Sai',
                    desc: 'Thuật toán tự động gom các từ bạn từng làm sai nhiều nhất trong lịch sử để ôn luyện.',
                    badge: 'Mục tiêu',
                    accent: '#f43f5e',
                  },
                ].map((m) => {
                  const isSelected = selectedMode === m.id
                  return (
                    <div
                      key={m.id}
                      className="card"
                      style={{
                        padding: 20,
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(30, 41, 59, 0.9)' : 'rgba(15, 23, 42, 0.5)',
                        border: isSelected ? `2px solid ${m.accent}` : '1px solid var(--border-color)',
                        transition: 'all 0.2s ease',
                      }}
                      onClick={() => setSelectedMode(m.id as QuizMode)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{m.title}</span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 999,
                            background: `${m.accent}22`,
                            color: m.accent,
                          }}
                        >
                          {m.badge}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                        {m.desc}
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* Advanced Custom Options (If custom mode selected) */}
              {selectedMode === 'custom' && (
                <div
                  className="card"
                  style={{
                    padding: 20,
                    background: 'rgba(30, 41, 59, 0.6)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sliders size={18} color="#c084fc" />
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>
                      Tùy Chỉnh Thông Số Đề Thi
                    </h4>
                  </div>

                  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    <div>
                      <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                        Số lượng câu hỏi:
                      </label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {[5, 10, 15, 20, 30].map((cnt) => (
                          <button
                            key={cnt}
                            onClick={() => setQuestionCount(cnt)}
                            style={{
                              padding: '6px 14px',
                              borderRadius: 6,
                              fontSize: 13,
                              fontWeight: questionCount === cnt ? 700 : 500,
                              background: questionCount === cnt ? '#c084fc' : 'rgba(255, 255, 255, 0.05)',
                              color: questionCount === cnt ? '#000' : '#fff',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            {cnt} câu
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                        Cấp độ từ vựng:
                      </label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {['ALL', 'B2', 'C1'].map((lvl) => (
                          <button
                            key={lvl}
                            onClick={() => setSelectedLevel(lvl)}
                            style={{
                              padding: '6px 14px',
                              borderRadius: 6,
                              fontSize: 13,
                              fontWeight: selectedLevel === lvl ? 700 : 500,
                              background: selectedLevel === lvl ? '#38bdf8' : 'rgba(255, 255, 255, 0.05)',
                              color: selectedLevel === lvl ? '#000' : '#fff',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            {lvl === 'ALL' ? 'Tất cả (B2 & C1)' : `Chuẩn ${lvl}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Timer Toggle and CTA Start */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: 12,
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Clock size={18} color={enableTimer ? '#fbbf24' : 'var(--text-muted)'} />
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#fff' }}>
                      Đồng hồ đếm ngược 30s/câu
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                      Tạo áp lực thi cử thực tế để rèn luyện phản xạ ngôn ngữ
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableTimer}
                    onChange={(e) => setEnableTimer(e.target.checked)}
                    style={{ marginLeft: 12, cursor: 'pointer', width: 16, height: 16 }}
                  />
                </div>

                <button
                  className="btn btn-primary"
                  style={{ padding: '12px 28px', fontSize: 15, fontWeight: 700 }}
                  onClick={() => handleStartExam()}
                  disabled={loading}
                >
                  <PlayCircle size={18} />
                  <span>{loading ? 'Đang tạo đề thi...' : 'Bắt đầu làm bài thi'}</span>
                </button>
              </div>
            </div>
          )}

          {/* STATE B: EXAM ARENA (IN PROGRESS) */}
          {isExamActive && currentQ && (
            <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Header: Progress, Level, and Timer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
                    Câu hỏi {currentIndex + 1} / {questions.length}
                  </span>
                  <span className={`card-level-tag tag-${currentQ.level.toLowerCase()}`}>
                    {currentQ.level}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {enableTimer && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 10px',
                        borderRadius: 999,
                        background: timeLeft <= 10 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.15)',
                        border: `1px solid ${timeLeft <= 10 ? '#ef4444' : '#f59e0b'}`,
                        color: timeLeft <= 10 ? '#f87171' : '#fbbf24',
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      <Clock size={14} />
                      <span>{timeLeft}s</span>
                    </div>
                  )}

                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Phím tắt: 1, 2, 3, 4 hoặc Enter
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ height: 6, borderRadius: 999, background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${((currentIndex + 1) / questions.length) * 100}%`,
                    background: '#38bdf8',
                    borderRadius: 999,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>

              {/* Big Question Card */}
              <div
                className="card"
                style={{
                  padding: 28,
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Từ loại:</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8' }}>
                      ({currentQ.part_of_speech})
                    </span>
                    <span style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'monospace' }}>
                      {currentQ.ipa_uk}
                    </span>
                  </div>

                  <button
                    className="btn btn-icon"
                    style={{ padding: 6, color: '#38bdf8' }}
                    onClick={() => speakEnglish(currentQ.word)}
                    title="Phát âm từ vựng (UK)"
                  >
                    <Volume2 size={20} />
                  </button>
                </div>

                <h3 style={{ fontSize: 30, fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: '-0.5px' }}>
                  {currentQ.word}
                </h3>

                <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 24 }}>
                  {currentQ.prompt}
                </p>

                {/* 4 Interactive Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {currentQ.options.map((opt, idx) => {
                    const isSelected = userAnswers[currentQ.id] === opt
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(opt)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          padding: '14px 18px',
                          borderRadius: 10,
                          background: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                          border: isSelected ? '2px solid #38bdf8' : '1px solid var(--border-color)',
                          color: isSelected ? '#fff' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            background: isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)',
                            color: isSelected ? '#000' : 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: 13,
                          }}
                        >
                          {idx + 1}
                        </span>
                        <span style={{ fontSize: 15, fontWeight: isSelected ? 700 : 500 }}>
                          {opt}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Bottom Actions: Next / Submit */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    if (confirm('Bạn có chắc chắn muốn hủy bài thi đang làm?')) {
                      setIsExamActive(false)
                    }
                  }}
                >
                  Hủy bài thi
                </button>

                <button
                  className="btn btn-primary"
                  style={{ padding: '10px 24px', fontSize: 14 }}
                  onClick={handleNextQuestion}
                >
                  {currentIndex === questions.length - 1 ? 'Nộp bài & Chấm điểm' : 'Câu tiếp theo'}{' '}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STATE C: EXAM RESULT & COMPREHENSIVE BREAKDOWN */}
          {examResult && (
            <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Score Banner */}
              <div
                className="card"
                style={{
                  textAlign: 'center',
                  padding: 32,
                  background:
                    examResult.score_percentage >= 80
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)'
                      : 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)',
                  border:
                    examResult.score_percentage >= 80
                      ? '1px solid rgba(16, 185, 129, 0.3)'
                      : '1px solid rgba(245, 158, 11, 0.3)',
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 999,
                    background:
                      examResult.score_percentage >= 80
                        ? 'rgba(16, 185, 129, 0.2)'
                        : 'rgba(245, 158, 11, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <Trophy
                    size={38}
                    color={examResult.score_percentage >= 80 ? '#34d399' : '#fbbf24'}
                  />
                </div>

                <h3 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
                  {examResult.rating_label}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
                  Bạn đã hoàn thành bài kiểm tra <strong>{examResult.title}</strong> trong {examResult.duration_seconds} giây.
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 20 }}>
                  <div className="card" style={{ padding: '12px 20px', background: 'rgba(30, 41, 59, 0.6)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Điểm số</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#34d399' }}>
                      {examResult.correct_count} / {examResult.total_questions} ({examResult.score_percentage}%)
                    </div>
                  </div>

                  <div className="card" style={{ padding: '12px 20px', background: 'rgba(30, 41, 59, 0.6)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>XP Thưởng</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#fbbf24' }}>
                      +{examResult.xp_earned} XP
                    </div>
                  </div>

                  <div className="card" style={{ padding: '12px 20px', background: 'rgba(30, 41, 59, 0.6)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Chuỗi Streak 🔥</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#f97316' }}>
                      {examResult.current_streak} ngày
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                  <button className="btn btn-secondary" onClick={() => setExamResult(null)}>
                    <RotateCcw size={16} /> Làm bài kiểm tra khác
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setActiveTab('history')
                      setExamResult(null)
                    }}
                  >
                    Xem lịch sử bài thi <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              {/* Questions Breakdown List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>
                  Chi Tiết Từng Câu Hỏi & Phân Tích Lỗi Sai
                </h4>

                {examResult.questions_detail.map((q, idx) => (
                  <div
                    key={q.question_id}
                    className="card"
                    style={{
                      padding: 18,
                      background: 'rgba(30, 41, 59, 0.6)',
                      border: q.is_correct
                        ? '1px solid rgba(16, 185, 129, 0.3)'
                        : '1px solid rgba(239, 68, 68, 0.3)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {q.is_correct ? (
                          <CheckCircle2 size={18} color="#34d399" />
                        ) : (
                          <XCircle size={18} color="#f87171" />
                        )}
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                          Câu {idx + 1}: {q.word}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({q.part_of_speech})</span>
                      </div>

                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-icon"
                          style={{ padding: 6, color: '#38bdf8' }}
                          onClick={() => speakEnglish(q.word)}
                          title="Phát âm từ vựng"
                        >
                          <Volume2 size={16} />
                        </button>
                        <button
                          className="btn btn-icon"
                          style={{
                            padding: 6,
                            color: starredMap[q.question_id] ? '#fbbf24' : 'var(--text-muted)',
                          }}
                          onClick={() => handleStarWord(q.question_id)}
                          title="Gắn sao vào Sổ tay từ khó"
                        >
                          <Star size={16} fill={starredMap[q.question_id] ? '#fbbf24' : 'none'} />
                        </button>
                      </div>
                    </div>

                    <div style={{ fontSize: 13, marginBottom: 8 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Bạn đã chọn: </span>
                      <strong style={{ color: q.is_correct ? '#34d399' : '#f87171' }}>
                        {q.user_answer || '(Bỏ trống)'}
                      </strong>
                      {!q.is_correct && (
                        <span style={{ marginLeft: 12, color: 'var(--text-muted)' }}>
                          Đáp án đúng:{' '}
                          <strong style={{ color: '#34d399' }}>{q.correct_answer}</strong>
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        padding: 10,
                        borderRadius: 6,
                        background: 'rgba(255, 255, 255, 0.03)',
                        fontSize: 12.5,
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                      }}
                    >
                      {q.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ======================================================== */}
      {/* TAB 2: TEST HISTORY LOG                                  */}
      {/* ======================================================== */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* History Metrics */}
          <div className="grid-3">
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tổng bài thi đã làm</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#38bdf8', marginTop: 4 }}>
                {historyStats.total_tests} bài
              </div>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Độ chính xác trung bình</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#34d399', marginTop: 4 }}>
                {historyStats.average_score}%
              </div>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tổng XP tích lũy</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#fbbf24', marginTop: 4 }}>
                +{historyStats.total_xp} XP
              </div>
            </div>
          </div>

          {/* History Table */}
          {historyLoading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div className="loading-spinner" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Đang tải lịch sử bài thi...</p>
            </div>
          ) : historyList.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                Bạn chưa hoàn thành bài kiểm tra nào. Hãy làm một bài test để lưu lại kết quả!
              </p>
              <button
                className="btn btn-primary"
                style={{ marginTop: 14 }}
                onClick={() => setActiveTab('quiz')}
              >
                Làm bài test đầu tiên ngay
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {historyList.map((item) => (
                <div
                  key={item.id}
                  className="card"
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(30, 41, 59, 0.6)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className={`card-level-tag tag-${item.level.toLowerCase()}`}>
                        {item.level}
                      </span>
                      <h4 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>
                        {item.title}
                      </h4>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(item.timestamp).toLocaleString('vi-VN')} • Thời lượng: {item.duration_seconds}s
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#34d399' }}>
                        {item.correct_count} / {item.total_questions} ({item.score_percentage}%)
                      </div>
                      <div style={{ fontSize: 11, color: '#fbbf24', fontWeight: 600 }}>
                        +{item.xp_earned} XP
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: 999,
                        background:
                          item.score_percentage >= 80
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(245, 158, 11, 0.15)',
                        color: item.score_percentage >= 80 ? '#34d399' : '#fbbf24',
                      }}
                    >
                      {item.rating_label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: MISTAKES HUB                                      */}
      {/* ======================================================== */}
      {activeTab === 'mistakes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            className="card"
            style={{
              padding: 20,
              background: 'rgba(244, 63, 94, 0.08)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: '#fb7185', margin: 0 }}>
                Sổ Tay Chẩn Đoán Lỗi Sai (Mistakes Hub)
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0 0' }}>
                Tổng hợp các từ vựng bạn đã từng làm sai trong các bài kiểm tra trắc nghiệm.
              </p>
            </div>

            {mistakesList.length > 0 && (
              <button
                className="btn btn-primary"
                style={{ background: '#f43f5e', borderColor: '#f43f5e' }}
                onClick={() => handleStartExam('mistakes')}
              >
                <Zap size={16} />
                <span>Tạo đề thi khắc phục ngay ({mistakesList.length} từ)</span>
              </button>
            )}
          </div>

          {mistakesLoading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div className="loading-spinner" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Đang tải danh sách câu sai...</p>
            </div>
          ) : mistakesList.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <CheckCircle2 size={44} color="#34d399" style={{ margin: '0 auto 12px' }} />
              <h4 style={{ color: '#fff', marginBottom: 6 }}>Thật tuyệt vời! Không có câu sai nào!</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                Bạn chưa từng làm sai từ nào hoặc chưa hoàn thành bài test nào.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
              {mistakesList.map((m) => (
                <div
                  key={m.vocab_id}
                  className="card"
                  style={{
                    padding: 16,
                    background: 'rgba(30, 41, 59, 0.6)',
                    border: '1px solid rgba(244, 63, 94, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span className={`card-level-tag tag-${m.level.toLowerCase()}`}>{m.level}</span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#fb7185',
                          background: 'rgba(244, 63, 94, 0.15)',
                          padding: '2px 8px',
                          borderRadius: 999,
                        }}
                      >
                        Sai {m.fail_count} lần
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <h4 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>
                        {m.word}
                      </h4>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({m.part_of_speech})</span>
                      <button
                        className="btn btn-icon"
                        style={{ padding: 4, color: '#38bdf8' }}
                        onClick={() => speakEnglish(m.word)}
                      >
                        <Volume2 size={16} />
                      </button>
                    </div>

                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#34d399', marginBottom: 6 }}>
                      {m.vietnamese_meaning}
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.4 }}>
                      "{m.example}"
                    </div>
                  </div>

                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ width: '100%', fontSize: 12, padding: '6px' }}
                      onClick={() => handleStarWord(m.vocab_id)}
                    >
                      <Star size={14} fill={starredMap[m.vocab_id] ? '#fbbf24' : 'none'} />
                      <span>{starredMap[m.vocab_id] ? 'Đã gắn sao' : 'Gắn sao vào Sổ tay từ khó'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
