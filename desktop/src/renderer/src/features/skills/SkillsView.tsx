import React, { useState, useEffect, useCallback } from 'react'
import {
  BookOpen,
  Headphones,
  FileCode2,
  Volume2,
  Play,
  CheckCircle2,
  XCircle,
  Sparkles,
  Award,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Star,
  Zap,
  Eye,
  EyeOff,
  Sliders,
  Check,
} from 'lucide-react'
import {
  ReadingArticleOverview,
  ReadingArticleDetail,
  HighlightedVocabItem,
  ReadingSubmitResponse,
  DictationExercise,
  DictationCheckResponse,
  GrammarTopicOverview,
  GrammarTopicDetail,
  GrammarSubmitResponse,
} from '../../types/skills'
import {
  fetchReadingArticles,
  fetchReadingArticleDetail,
  submitReadingQuiz,
  fetchDictationExercises,
  checkDictation,
  fetchGrammarTopics,
  fetchGrammarTopicDetail,
  submitGrammarQuiz,
  speakEnglish,
  toggleWordStar,
} from '../../lib/api'

interface SkillsViewProps {
  currentLevel?: string
}

type SkillTab = 'reading' | 'listening' | 'grammar'

export const SkillsView: React.FC<SkillsViewProps> = ({ currentLevel = 'ALL' }) => {
  const [activeTab, setActiveTab] = useState<SkillTab>('reading')

  // -------------------------------------------------------------------------
  // READING LAB STATE
  // -------------------------------------------------------------------------
  const [articles, setArticles] = useState<ReadingArticleOverview[]>([])
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null)
  const [articleDetail, setArticleDetail] = useState<ReadingArticleDetail | null>(null)
  const [highlightVocab, setHighlightVocab] = useState(true)
  const [inspectedVocab, setInspectedVocab] = useState<HighlightedVocabItem | null>(null)
  const [readingAnswers, setReadingAnswers] = useState<Record<number, string>>({})
  const [readingResult, setReadingResult] = useState<ReadingSubmitResponse | null>(null)
  const [readingLoading, setReadingLoading] = useState(false)

  // -------------------------------------------------------------------------
  // LISTENING DICTATION STATE
  // -------------------------------------------------------------------------
  const [dictations, setDictations] = useState<DictationExercise[]>([])
  const [dictationIndex, setDictationIndex] = useState(0)
  const [dictationInput, setDictationInput] = useState('')
  const [audioRate, setAudioRate] = useState<number>(0.9)
  const [dictationResult, setDictationResult] = useState<DictationCheckResponse | null>(null)
  const [dictationLoading, setDictationLoading] = useState(false)

  // -------------------------------------------------------------------------
  // GRAMMAR LAB STATE
  // -------------------------------------------------------------------------
  const [grammarTopics, setGrammarTopics] = useState<GrammarTopicOverview[]>([])
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [topicDetail, setTopicDetail] = useState<GrammarTopicDetail | null>(null)
  const [grammarAnswers, setGrammarAnswers] = useState<Record<number, string>>({})
  const [grammarResult, setGrammarResult] = useState<GrammarSubmitResponse | null>(null)
  const [grammarLoading, setGrammarLoading] = useState(false)

  // Load Reading Articles List
  const loadArticles = useCallback(async () => {
    setReadingLoading(true)
    try {
      const data = await fetchReadingArticles(currentLevel)
      setArticles(data)
      if (data.length > 0 && !selectedArticleId) {
        setSelectedArticleId(data[0].id)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setReadingLoading(false)
    }
  }, [currentLevel, selectedArticleId])

  // Load Selected Reading Article Detail
  useEffect(() => {
    if (!selectedArticleId) return
    setReadingLoading(true)
    setReadingAnswers({})
    setReadingResult(null)
    setInspectedVocab(null)

    fetchReadingArticleDetail(selectedArticleId)
      .then((detail) => {
        setArticleDetail(detail)
        if (detail.highlighted_vocab.length > 0) {
          setInspectedVocab(detail.highlighted_vocab[0])
        }
      })
      .catch(console.error)
      .finally(() => setReadingLoading(false))
  }, [selectedArticleId])

  // Load Dictation Exercises
  const loadDictations = useCallback(async () => {
    setDictationLoading(true)
    setDictationInput('')
    setDictationResult(null)
    setDictationIndex(0)
    try {
      const data = await fetchDictationExercises(10, currentLevel)
      setDictations(data)
    } catch (e) {
      console.error(e)
    } finally {
      setDictationLoading(false)
    }
  }, [currentLevel])

  // Load Grammar Topics List
  const loadGrammarTopics = useCallback(async () => {
    setGrammarLoading(true)
    try {
      const data = await fetchGrammarTopics(currentLevel)
      setGrammarTopics(data)
      if (data.length > 0 && !selectedTopicId) {
        setSelectedTopicId(data[0].id)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setGrammarLoading(false)
    }
  }, [currentLevel, selectedTopicId])

  // Load Selected Grammar Topic Detail
  useEffect(() => {
    if (!selectedTopicId) return
    setGrammarLoading(true)
    setGrammarAnswers({})
    setGrammarResult(null)

    fetchGrammarTopicDetail(selectedTopicId)
      .then((detail) => setTopicDetail(detail))
      .catch(console.error)
      .finally(() => setGrammarLoading(false))
  }, [selectedTopicId])

  useEffect(() => {
    if (activeTab === 'reading') loadArticles()
    if (activeTab === 'listening') loadDictations()
    if (activeTab === 'grammar') loadGrammarTopics()
  }, [activeTab, loadArticles, loadDictations, loadGrammarTopics])

  // Reading Quiz Submit
  const handleReadingSubmit = async () => {
    if (!selectedArticleId || !articleDetail) return
    try {
      const res = await submitReadingQuiz(selectedArticleId, readingAnswers)
      setReadingResult(res)
    } catch (err: any) {
      alert(err.message || 'Lỗi nộp bài đọc hiểu')
    }
  }

  // Dictation Submit / Check
  const currentDictation = dictations[dictationIndex]
  const handleDictationCheck = async () => {
    if (!currentDictation || !dictationInput.trim()) return
    try {
      const res = await checkDictation(currentDictation.id, dictationInput)
      setDictationResult(res)
    } catch (err: any) {
      alert(err.message || 'Lỗi kiểm tra chính tả')
    }
  }

  const handleNextDictation = () => {
    if (dictationIndex < dictations.length - 1) {
      setDictationIndex((prev) => prev + 1)
      setDictationInput('')
      setDictationResult(null)
    } else {
      loadDictations()
    }
  }

  // Grammar Quiz Submit
  const handleGrammarSubmit = async () => {
    if (!selectedTopicId || !topicDetail) return
    try {
      const res = await submitGrammarQuiz(selectedTopicId, grammarAnswers)
      setGrammarResult(res)
    } catch (err: any) {
      alert(err.message || 'Lỗi nộp bài ngữ pháp')
    }
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Sub Tabs Switcher */}
      <div className="subtabs-bar">
        <button
          className={`subtab-btn ${activeTab === 'reading' ? 'active' : ''}`}
          onClick={() => setActiveTab('reading')}
        >
          <BookOpen size={16} />
          <span>Luyện Đọc (Reading Lab)</span>
        </button>
        <button
          className={`subtab-btn ${activeTab === 'listening' ? 'active' : ''}`}
          onClick={() => setActiveTab('listening')}
        >
          <Headphones size={16} />
          <span>Luyện Nghe (Audio Dictation)</span>
        </button>
        <button
          className={`subtab-btn ${activeTab === 'grammar' ? 'active' : ''}`}
          onClick={() => setActiveTab('grammar')}
        >
          <FileCode2 size={16} />
          <span>Luyện Ngữ Pháp (Grammar Lab)</span>
        </button>
      </div>

      {/* ================================================================ */}
      {/* 1. READING LAB                                                   */}
      {/* ================================================================ */}
      {activeTab === 'reading' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Article Selector Chips */}
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
            {articles.map((art) => {
              const isSelected = art.id === selectedArticleId
              return (
                <button
                  key={art.id}
                  onClick={() => setSelectedArticleId(art.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 16px',
                    borderRadius: 10,
                    background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                    border: isSelected ? '1px solid #38bdf8' : '1px solid var(--border-color)',
                    color: isSelected ? '#38bdf8' : 'var(--text-secondary)',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: 13,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span className={`card-level-tag tag-${art.level.toLowerCase()}`}>{art.level}</span>
                  <span>{art.title}</span>
                  {art.is_completed && <CheckCircle2 size={14} color="#34d399" />}
                </button>
              )
            })}
          </div>

          {/* Reading Arena Grid: Article Reader + Smart Word Inspector */}
          {articleDetail && (
            <div className="grid-2" style={{ alignItems: 'start' }}>
              {/* Left Column: Interactive Article Reader */}
              <div
                className="card"
                style={{
                  padding: 28,
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`card-level-tag tag-${articleDetail.level.toLowerCase()}`}>
                      {articleDetail.level} Academic Article
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      • {articleDetail.topic} • {articleDetail.reading_time_minutes} phút đọc
                    </span>
                  </div>

                  {/* Toggle Highlight Button */}
                  <button
                    className="btn btn-outline"
                    style={{ padding: '4px 10px', fontSize: 12 }}
                    onClick={() => setHighlightVocab((prev) => !prev)}
                    title="Bật/Tắt làm nổi bật từ vựng mục tiêu"
                  >
                    {highlightVocab ? <Eye size={14} /> : <EyeOff size={14} />}
                    <span>{highlightVocab ? 'Ẩn Highlight' : 'Hiện Highlight'}</span>
                  </button>
                </div>

                <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 16, lineHeight: 1.4 }}>
                  {articleDetail.title}
                </h3>

                <p style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic', marginBottom: 20 }}>
                  {articleDetail.summary}
                </p>

                {/* Paragraphs with Interactive Word Highlighting */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 15, lineHeight: 1.8, color: '#e2e8f0' }}>
                  {articleDetail.paragraphs.map((para, pIdx) => {
                    if (!highlightVocab) {
                      return <p key={pIdx} style={{ margin: 0 }}>{para}</p>
                    }

                    // Render with clickable highlights for recognized target words
                    let elements: React.ReactNode[] = [para]
                    articleDetail.highlighted_vocab.forEach((v) => {
                      const newElements: React.ReactNode[] = []
                      elements.forEach((el) => {
                        if (typeof el !== 'string') {
                          newElements.push(el)
                          return
                        }
                        const regex = new RegExp(`\\b(${v.word})\\b`, 'gi')
                        const parts = el.split(regex)
                        parts.forEach((part, partIdx) => {
                          if (part.toLowerCase() === v.word.toLowerCase()) {
                            newElements.push(
                              <span
                                key={`${partIdx}_${v.word}`}
                                onClick={() => setInspectedVocab(v)}
                                style={{
                                  color: '#38bdf8',
                                  fontWeight: 700,
                                  textDecoration: 'underline',
                                  textDecorationStyle: 'dotted',
                                  cursor: 'pointer',
                                  padding: '1px 4px',
                                  borderRadius: 4,
                                  background:
                                    inspectedVocab?.word === v.word
                                      ? 'rgba(56, 189, 248, 0.25)'
                                      : 'rgba(56, 189, 248, 0.1)',
                                }}
                                title="Nhấp để xem định nghĩa & nghe phát âm"
                              >
                                {part}
                              </span>,
                            )
                          } else if (part) {
                            newElements.push(part)
                          }
                        })
                      })
                      elements = newElements
                    })

                    return <p key={pIdx} style={{ margin: 0 }}>{elements}</p>
                  })}
                </div>
              </div>

              {/* Right Column: Smart Word Inspector & Comprehension Quiz */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Smart Word Inspector Card */}
                <div
                  className="card"
                  style={{
                    padding: 24,
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Sparkles size={18} color="#38bdf8" />
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: '#38bdf8', margin: 0, textTransform: 'uppercase' }}>
                      Thanh Tra Từ Vựng (Word Inspector)
                    </h4>
                  </div>

                  {inspectedVocab ? (
                    <div className="animate-fade-in">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                          <h3 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: 0 }}>
                            {inspectedVocab.word}
                          </h3>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                            ({inspectedVocab.part_of_speech})
                          </span>
                        </div>

                        <button
                          className="btn btn-icon"
                          style={{ color: '#38bdf8', padding: 6 }}
                          onClick={() => speakEnglish(inspectedVocab.word)}
                          title="Nghe phát âm UK"
                        >
                          <Volume2 size={20} />
                        </button>
                      </div>

                      <div style={{ fontSize: 14, color: '#94a3b8', fontFamily: 'monospace', marginBottom: 14 }}>
                        {inspectedVocab.ipa}
                      </div>

                      <div
                        style={{
                          background: 'rgba(56, 189, 248, 0.08)',
                          padding: 12,
                          borderRadius: 8,
                          marginBottom: 12,
                        }}
                      >
                        <div style={{ fontSize: 11, color: '#38bdf8', fontWeight: 700, marginBottom: 4 }}>
                          NGHĨA TRONG NGỮ CẢNH:
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#34d399' }}>
                          {inspectedVocab.meaning}
                        </div>
                      </div>

                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        "{inspectedVocab.context}"
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                      Nhấp vào bất kỳ từ vựng nào được gạch chân trong bài để tra cứu nhanh.
                    </div>
                  )}
                </div>

                {/* Comprehension Quiz Card */}
                <div
                  className="card"
                  style={{
                    padding: 24,
                    background: 'rgba(30, 41, 59, 0.6)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Award size={18} color="#fbbf24" />
                      <h4 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>
                        Bài Kiểm Tra Đọc Hiểu ({articleDetail.comprehension_questions.length} câu)
                      </h4>
                    </div>

                    {readingResult && (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: readingResult.is_passed ? '#34d399' : '#f87171',
                        }}
                      >
                        {readingResult.score} / {readingResult.total_questions} đúng ({readingResult.score_percentage}%)
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {articleDetail.comprehension_questions.map((q, qIdx) => {
                      const selected = readingAnswers[q.id]
                      return (
                        <div key={q.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#fff' }}>
                            Câu {qIdx + 1}: {q.prompt}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {q.options.map((opt, oIdx) => {
                              const isOptSelected = selected === opt
                              const isSubmitted = !!readingResult
                              const isCorrectAnswer = opt === q.correct_answer

                              let bg = 'rgba(255, 255, 255, 0.04)'
                              let border = '1px solid var(--border-color)'
                              if (isSubmitted) {
                                if (isCorrectAnswer) {
                                  bg = 'rgba(16, 185, 129, 0.2)'
                                  border = '1px solid #10b981'
                                } else if (isOptSelected) {
                                  bg = 'rgba(239, 68, 68, 0.2)'
                                  border = '1px solid #ef4444'
                                }
                              } else if (isOptSelected) {
                                bg = 'rgba(56, 189, 248, 0.2)'
                                border = '1px solid #38bdf8'
                              }

                              return (
                                <button
                                  key={oIdx}
                                  onClick={() => {
                                    if (readingResult) return
                                    setReadingAnswers((prev) => ({ ...prev, [q.id]: opt }))
                                  }}
                                  style={{
                                    padding: '8px 12px',
                                    borderRadius: 6,
                                    fontSize: 12.5,
                                    textAlign: 'left',
                                    background: bg,
                                    border: border,
                                    color: isOptSelected ? '#fff' : 'var(--text-secondary)',
                                    cursor: readingResult ? 'default' : 'pointer',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  {opt}
                                </button>
                              )
                            })}
                          </div>

                          {readingResult && (
                            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 4 }}>
                              Giải thích: {q.explanation}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    {!readingResult ? (
                      <button
                        className="btn btn-primary"
                        style={{ padding: '8px 20px', fontSize: 13 }}
                        disabled={Object.keys(readingAnswers).length < articleDetail.comprehension_questions.length}
                        onClick={handleReadingSubmit}
                      >
                        Nộp bài đọc hiểu
                      </button>
                    ) : (
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '8px 16px', fontSize: 13 }}
                        onClick={() => {
                          setReadingAnswers({})
                          setReadingResult(null)
                        }}
                      >
                        <RotateCcw size={14} /> Làm lại bài đọc
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* 2. LISTENING AUDIO DICTATION LAB                                 */}
      {/* ================================================================ */}
      {activeTab === 'listening' && (
        <div style={{ maxWidth: 760, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Header Card */}
          <div
            className="card"
            style={{
              padding: 24,
              background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span className="card-level-tag tag-c1">Audio Dictation Station</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Câu {dictationIndex + 1} / {dictations.length || 10}
              </span>
            </div>

            <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
              Luyện Nghe Chép Chính Tả Học Thuật
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, maxWidth: 580, margin: '0 auto 20px auto' }}>
              Lắng nghe phát âm giọng UK, rèn luyện phản xạ bắt âm và gõ lại chính xác câu văn hoàn chỉnh.
            </p>

            {/* Audio Speed and Play Controls */}
            {currentDictation && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 14,
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '14px 24px',
                  borderRadius: 12,
                  maxWidth: 420,
                  margin: '0 auto',
                }}
              >
                <div style={{ display: 'flex', gap: 6 }}>
                  {[0.75, 0.9, 1.1].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setAudioRate(rate)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: audioRate === rate ? 700 : 500,
                        background: audioRate === rate ? '#38bdf8' : 'rgba(255, 255, 255, 0.05)',
                        color: audioRate === rate ? '#000' : '#fff',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: 50, height: 50, borderRadius: 999, padding: 0 }}
                  onClick={() => speakEnglish(currentDictation.sentence, audioRate)}
                  title="Phát âm câu văn"
                >
                  <Play size={20} />
                </button>

                <div style={{ textAlign: 'left', fontSize: 12, color: 'var(--text-muted)' }}>
                  <div>Từ mục tiêu: <strong>{currentDictation.target_word}</strong></div>
                  <div>({currentDictation.vietnamese_meaning})</div>
                </div>
              </div>
            )}
          </div>

          {/* Typing Input Area */}
          {currentDictation && (
            <div
              className="card"
              style={{
                padding: 24,
                background: 'rgba(30, 41, 59, 0.7)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <textarea
                value={dictationInput}
                onChange={(e) => setDictationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    if (!dictationResult) handleDictationCheck()
                  }
                }}
                placeholder="Lắng nghe và gõ lại câu văn bạn nghe được vào đây (nhấn Enter để kiểm tra)..."
                rows={3}
                style={{
                  width: '100%',
                  padding: 14,
                  borderRadius: 8,
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  fontSize: 15,
                  lineHeight: 1.5,
                  resize: 'none',
                  outline: 'none',
                }}
              />

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Mẹo: Nghe nhiều lần ở tốc độ 0.75x nếu câu quá nhanh.
                </span>

                <div style={{ display: 'flex', gap: 10 }}>
                  {!dictationResult ? (
                    <button
                      className="btn btn-primary"
                      disabled={!dictationInput.trim()}
                      onClick={handleDictationCheck}
                    >
                      Kiểm tra chính tả
                    </button>
                  ) : (
                    <button className="btn btn-primary" onClick={handleNextDictation}>
                      Câu tiếp theo <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Word Diff Result Box */}
              {dictationResult && (
                <div
                  className="animate-fade-in"
                  style={{
                    marginTop: 10,
                    padding: 18,
                    borderRadius: 10,
                    background: dictationResult.is_perfect
                      ? 'rgba(16, 185, 129, 0.1)'
                      : 'rgba(245, 158, 11, 0.1)',
                    border: dictationResult.is_perfect
                      ? '1px solid #10b981'
                      : '1px solid #f59e0b',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {dictationResult.is_perfect ? (
                        <CheckCircle2 size={18} color="#34d399" />
                      ) : (
                        <Sparkles size={18} color="#fbbf24" />
                      )}
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
                        Độ chính xác: {dictationResult.accuracy_percentage}% (+{dictationResult.xp_earned} XP)
                      </span>
                    </div>

                    <button
                      className="btn-icon"
                      onClick={() => speakEnglish(dictationResult.expected_text, 0.85)}
                      title="Nghe lại câu chuẩn"
                    >
                      <Volume2 size={16} />
                    </button>
                  </div>

                  {/* Word-by-word diff tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {dictationResult.diffs.map((d, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: '3px 8px',
                          borderRadius: 4,
                          fontSize: 13,
                          fontWeight: 600,
                          background: d.is_correct
                            ? 'rgba(16, 185, 129, 0.2)'
                            : 'rgba(239, 68, 68, 0.2)',
                          color: d.is_correct ? '#34d399' : '#f87171',
                          border: `1px solid ${d.is_correct ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                          textDecoration: !d.is_correct ? 'line-through' : 'none',
                        }}
                      >
                        {d.word}
                      </span>
                    ))}
                  </div>

                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    <strong>Câu văn mẫu chuẩn: </strong>
                    <span style={{ color: '#fff', fontStyle: 'italic' }}>"{dictationResult.expected_text}"</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* 3. GRAMMAR LAB                                                   */}
      {/* ================================================================ */}
      {activeTab === 'grammar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Topic Selector Chips */}
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
            {grammarTopics.map((top) => {
              const isSelected = top.id === selectedTopicId
              return (
                <button
                  key={top.id}
                  onClick={() => setSelectedTopicId(top.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 16px',
                    borderRadius: 10,
                    background: isSelected ? 'rgba(192, 132, 252, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                    border: isSelected ? '1px solid #c084fc' : '1px solid var(--border-color)',
                    color: isSelected ? '#c084fc' : 'var(--text-secondary)',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: 13,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span className={`card-level-tag tag-${top.level.toLowerCase()}`}>{top.level}</span>
                  <span>{top.title}</span>
                  {top.is_completed && <CheckCircle2 size={14} color="#34d399" />}
                </button>
              )
            })}
          </div>

          {/* Topic Theory & Practice Area */}
          {topicDetail && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Formula & Rule Card */}
              <div
                className="card"
                style={{
                  padding: 24,
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(192, 132, 252, 0.3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span className={`card-level-tag tag-${topicDetail.level.toLowerCase()}`}>
                    {topicDetail.level} Grammar Focus
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>• {topicDetail.category}</span>
                </div>

                <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 12 }}>
                  {topicDetail.title}
                </h3>

                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.9)',
                    padding: '14px 18px',
                    borderRadius: 8,
                    borderLeft: '4px solid #c084fc',
                    marginBottom: 16,
                  }}
                >
                  <div style={{ fontSize: 11, color: '#c084fc', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                    CÔNG THỨC NGỮ PHÁP HỌC THUẬT:
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>
                    {topicDetail.formula}
                  </div>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                  {topicDetail.description}
                </p>
              </div>

              {/* Comparative Examples (Basic vs Academic) */}
              <div className="card" style={{ padding: 24, background: 'rgba(30, 41, 59, 0.5)' }}>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 14 }}>
                  Đối Chiếu Cấu Trúc: Câu Thông Thường vs Câu Nâng Cao
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {topicDetail.examples.map((ex, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 16,
                        padding: 14,
                        borderRadius: 8,
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                          Câu thông thường (Basic):
                        </div>
                        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                          {ex.basic}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: 11, color: '#c084fc', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                          Văn phong nâng cao (B2/C1 Academic):
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#34d399' }}>
                          {ex.advanced}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>
                          Ghi chú: {ex.note}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Practice Questions */}
              <div className="card" style={{ padding: 24, background: 'rgba(30, 41, 59, 0.7)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>
                    Thực Hành Ngữ Pháp ({topicDetail.practice_questions.length} câu)
                  </h4>

                  {grammarResult && (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: grammarResult.is_passed ? '#34d399' : '#f87171',
                      }}
                    >
                      {grammarResult.score} / {grammarResult.total_questions} đúng ({grammarResult.score_percentage}%)
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {topicDetail.practice_questions.map((q, idx) => {
                    const selected = grammarAnswers[q.id]
                    return (
                      <div key={q.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
                          Câu {idx + 1}: {q.prompt}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {q.options.map((opt, oIdx) => {
                            const isOptSelected = selected === opt
                            const isSubmitted = !!grammarResult
                            const isCorrect = opt === q.correct_answer

                            let bg = 'rgba(255, 255, 255, 0.04)'
                            let border = '1px solid var(--border-color)'
                            if (isSubmitted) {
                              if (isCorrect) {
                                bg = 'rgba(16, 185, 129, 0.2)'
                                border = '1px solid #10b981'
                              } else if (isOptSelected) {
                                bg = 'rgba(239, 68, 68, 0.2)'
                                border = '1px solid #ef4444'
                              }
                            } else if (isOptSelected) {
                              bg = 'rgba(192, 132, 252, 0.2)'
                              border = '1px solid #c084fc'
                            }

                            return (
                              <button
                                key={oIdx}
                                onClick={() => {
                                  if (grammarResult) return
                                  setGrammarAnswers((prev) => ({ ...prev, [q.id]: opt }))
                                }}
                                style={{
                                  padding: '10px 14px',
                                  borderRadius: 8,
                                  fontSize: 13,
                                  textAlign: 'left',
                                  background: bg,
                                  border: border,
                                  color: isOptSelected ? '#fff' : 'var(--text-secondary)',
                                  cursor: grammarResult ? 'default' : 'pointer',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                {opt}
                              </button>
                            )
                          })}
                        </div>

                        {grammarResult && (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 4 }}>
                            Giải thích: {q.explanation}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  {!grammarResult ? (
                    <button
                      className="btn btn-primary"
                      style={{ padding: '8px 20px', fontSize: 13, background: '#c084fc', borderColor: '#c084fc' }}
                      disabled={Object.keys(grammarAnswers).length < topicDetail.practice_questions.length}
                      onClick={handleGrammarSubmit}
                    >
                      Nộp bài tập ngữ pháp
                    </button>
                  ) : (
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '8px 16px', fontSize: 13 }}
                      onClick={() => {
                        setGrammarAnswers({})
                        setGrammarResult(null)
                      }}
                    >
                      <RotateCcw size={14} /> Làm lại bài này
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
