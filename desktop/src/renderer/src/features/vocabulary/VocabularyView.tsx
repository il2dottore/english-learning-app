import React, { useEffect, useState, useCallback } from 'react'
import {
  Volume2,
  RotateCw,
  Search,
  CheckCircle,
  HelpCircle,
  XCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Star,
  Layers,
  ListFilter,
  BrainCircuit,
  Puzzle,
  Clock,
  ArrowRight,
  BookMarked,
  Flame,
  Check,
  VolumeX,
  ArrowLeftRight,
} from 'lucide-react'
import {
  ExerciseCloze,
  SRSQueueStats,
  SynonymMatchingItem,
  VocabularyItem,
} from '../../types/vocabulary'
import {
  fetchClozeExercises,
  fetchRandomFlashcards,
  fetchSRSQueue,
  fetchSRSStats,
  fetchStarredList,
  fetchSynonymPairs,
  fetchVocabularyList,
  speakEnglish,
  submitWordReview,
  toggleWordStar,
} from '../../lib/api'

interface VocabularyViewProps {
  currentLevel: string
}

type VocabSubTab = 'flashcards' | 'srs' | 'lab' | 'dictionary'

export const VocabularyView: React.FC<VocabularyViewProps> = ({ currentLevel }) => {
  const [subTab, setSubTab] = useState<VocabSubTab>('flashcards')

  // Flashcards state
  const [cards, setCards] = useState<VocabularyItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [loadingCards, setLoadingCards] = useState(false)
  const [batchSize, setBatchSize] = useState(15)
  const [sessionLearnedCount, setSessionLearnedCount] = useState(0)
  const [isSessionComplete, setIsSessionComplete] = useState(false)
  const [studyDirection, setStudyDirection] = useState<'en-vi' | 'vi-en'>('en-vi')
  const [autoPronounce, setAutoPronounce] = useState<boolean>(true)

  // SRS Queue stats
  const [srsStats, setSrsStats] = useState<SRSQueueStats | null>(null)
  const [loadingSRS, setLoadingSRS] = useState(false)

  // Dictionary & Starred state
  const [searchQuery, setSearchQuery] = useState('')
  const [posFilter, setPosFilter] = useState<string>('')
  const [dictMode, setDictMode] = useState<'all' | 'starred'>('all')
  const [dictItems, setDictItems] = useState<VocabularyItem[]>([])
  const [dictTotal, setDictTotal] = useState(0)
  const [dictPage, setDictPage] = useState(0)
  const [loadingDict, setLoadingDict] = useState(false)

  // Lab state (Cloze & Synonyms)
  const [labMode, setLabMode] = useState<'cloze' | 'synonyms'>('cloze')
  const [clozeExercises, setClozeExercises] = useState<ExerciseCloze[]>([])
  const [clozeIndex, setClozeIndex] = useState(0)
  const [clozeSelected, setClozeSelected] = useState<string | null>(null)
  const [clozeScore, setClozeScore] = useState(0)
  const [loadingLab, setLoadingLab] = useState(false)

  // Synonym Matching game state
  const [synonymPairs, setSynonymPairs] = useState<SynonymMatchingItem[]>([])
  const [selectedWordCard, setSelectedWordCard] = useState<string | null>(null)
  const [selectedSynCard, setSelectedSynCard] = useState<string | null>(null)
  const [matchedWords, setMatchedWords] = useState<string[]>([])
  const [matchTries, setMatchTries] = useState(0)

  // Load random flashcards
  const loadFlashcards = useCallback(async (isSRSQueue = false) => {
    setLoadingCards(true)
    setIsFlipped(false)
    setIsSessionComplete(false)
    setSessionLearnedCount(0)
    try {
      if (isSRSQueue) {
        const queue = await fetchSRSQueue(batchSize, currentLevel)
        setCards(queue)
      } else {
        const data = await fetchRandomFlashcards(batchSize, currentLevel)
        setCards(data)
      }
      setCurrentIndex(0)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingCards(false)
    }
  }, [batchSize, currentLevel])

  // Load SRS stats
  const loadSRSStats = useCallback(async () => {
    setLoadingSRS(true)
    try {
      const data = await fetchSRSStats()
      setSrsStats(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingSRS(false)
    }
  }, [])

  // Load dictionary or starred items
  const loadDictionary = useCallback(async () => {
    setLoadingDict(true)
    try {
      if (dictMode === 'starred') {
        const data = await fetchStarredList(dictPage * 20, 20)
        setDictItems(data.items)
        setDictTotal(data.total)
      } else {
        const data = await fetchVocabularyList({
          level: currentLevel,
          search: searchQuery,
          partOfSpeech: posFilter,
          skip: dictPage * 20,
          limit: 20,
        })
        setDictItems(data.items)
        setDictTotal(data.total)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingDict(false)
    }
  }, [dictMode, currentLevel, searchQuery, posFilter, dictPage])

  // Load Lab Exercises
  const loadLabExercises = useCallback(async () => {
    setLoadingLab(true)
    setClozeIndex(0)
    setClozeSelected(null)
    setClozeScore(0)
    setSelectedWordCard(null)
    setSelectedSynCard(null)
    setMatchedWords([])
    setMatchTries(0)
    try {
      if (labMode === 'cloze') {
        const clozeData = await fetchClozeExercises(8, currentLevel)
        setClozeExercises(clozeData)
      } else {
        const synData = await fetchSynonymPairs(6, currentLevel)
        setSynonymPairs(synData)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingLab(false)
    }
  }, [labMode, currentLevel])

  useEffect(() => {
    if (subTab === 'flashcards') {
      loadFlashcards()
    } else if (subTab === 'srs') {
      loadSRSStats()
    } else if (subTab === 'dictionary') {
      loadDictionary()
    } else if (subTab === 'lab') {
      loadLabExercises()
    }
  }, [subTab, loadFlashcards, loadSRSStats, loadDictionary, loadLabExercises])

  // Auto-pronounce current card word when moving to a new card
  useEffect(() => {
    if (subTab === 'flashcards' && autoPronounce && cards[currentIndex] && !isSessionComplete) {
      const timer = setTimeout(() => {
        speakEnglish(cards[currentIndex].word)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [currentIndex, cards, autoPronounce, subTab, isSessionComplete])

  // Submit Flashcard Review Rating (1, 2, or 3)
  const handleRateCard = async (rating: 1 | 2 | 3) => {
    if (!cards[currentIndex]) return
    const currentCard = cards[currentIndex]

    try {
      await submitWordReview(currentCard.id, rating)
    } catch (e) {
      console.error('Failed to submit review:', e)
    }

    setSessionLearnedCount((c) => c + 1)
    if (currentIndex + 1 < cards.length) {
      setIsFlipped(false)
      setCurrentIndex((i) => i + 1)
    } else {
      setIsSessionComplete(true)
    }
  }

  // Toggle Star / Favorite
  const handleToggleStar = async (vocabId: number) => {
    try {
      const newStarred = await toggleWordStar(vocabId)
      // Update in current cards
      setCards((prev) =>
        prev.map((c) => (c.id === vocabId ? { ...c, is_starred: newStarred } : c))
      )
      // Update in dictionary list if viewing
      setDictItems((prev) =>
        prev.map((c) => (c.id === vocabId ? { ...c, is_starred: newStarred } : c))
      )
    } catch (e) {
      console.error('Failed to toggle star:', e)
    }
  }

  // Keyboard navigation for Flashcards:
  // Space = Flip, 1 = Chưa nhớ, 2 = Tạm nhớ, 3 = Đã thuộc, R = Audio, S = Star
  useEffect(() => {
    if (subTab !== 'flashcards' || isSessionComplete) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.code === 'Space') {
        e.preventDefault()
        setIsFlipped((prev) => !prev)
      } else if (e.key === '1') {
        e.preventDefault()
        handleRateCard(1)
      } else if (e.key === '2') {
        e.preventDefault()
        handleRateCard(2)
      } else if (e.key === '3') {
        e.preventDefault()
        handleRateCard(3)
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        if (cards[currentIndex]) speakEnglish(cards[currentIndex].word)
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault()
        if (cards[currentIndex]) handleToggleStar(cards[currentIndex].id)
      } else if (e.code === 'ArrowRight') {
        e.preventDefault()
        if (currentIndex + 1 < cards.length) {
          setIsFlipped(false)
          setCurrentIndex((i) => i + 1)
        }
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault()
        if (currentIndex > 0) {
          setIsFlipped(false)
          setCurrentIndex((i) => i - 1)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [subTab, isSessionComplete, currentIndex, cards])

  // Synonym Matching click handler
  const handleSelectWordCard = (word: string) => {
    setSelectedWordCard(word)
    if (selectedSynCard) {
      checkMatch(word, selectedSynCard)
    }
  }

  const handleSelectSynCard = (synonym: string) => {
    setSelectedSynCard(synonym)
    if (selectedWordCard) {
      checkMatch(selectedWordCard, synonym)
    }
  }

  const checkMatch = (word: string, synonym: string) => {
    setMatchTries((t) => t + 1)
    const matched = synonymPairs.find(
      (p) => p.word.toLowerCase() === word.toLowerCase() && p.synonym.toLowerCase() === synonym.toLowerCase()
    )

    if (matched) {
      setMatchedWords((prev) => [...prev, word])
      speakEnglish(word)
    }
    setSelectedWordCard(null)
    setSelectedSynCard(null)
  }

  const currentCard = cards[currentIndex]
  const currentCloze = clozeExercises[clozeIndex]

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 4 Main Subtabs */}
      <div className="subtabs-bar">
        <button
          className={`subtab-btn ${subTab === 'flashcards' ? 'active' : ''}`}
          onClick={() => setSubTab('flashcards')}
        >
          <Layers size={16} />
          <span>Thẻ Flashcard 3D</span>
        </button>

        <button
          className={`subtab-btn ${subTab === 'srs' ? 'active' : ''}`}
          onClick={() => setSubTab('srs')}
        >
          <BrainCircuit size={16} />
          <span>Hàng Đợi Ôn Tập (SRS)</span>
          {srsStats && srsStats.due_count > 0 && (
            <span
              style={{
                marginLeft: 4,
                padding: '1px 6px',
                borderRadius: 999,
                background: 'var(--accent-rose)',
                color: '#fff',
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {srsStats.due_count}
            </span>
          )}
        </button>

        <button
          className={`subtab-btn ${subTab === 'lab' ? 'active' : ''}`}
          onClick={() => setSubTab('lab')}
        >
          <Puzzle size={16} />
          <span>Ngữ Cảnh & Từ Đồng Nghĩa</span>
        </button>

        <button
          className={`subtab-btn ${subTab === 'dictionary' ? 'active' : ''}`}
          onClick={() => setSubTab('dictionary')}
        >
          <ListFilter size={16} />
          <span>Từ Điển & Sổ Tay ({dictTotal.toLocaleString() || '2,015+'})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. FLASHCARD 3D FOCUS MODE - EDTECH STUDIO */}
      {/* ========================================================================= */}
      {subTab === 'flashcards' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%' }}>
          {isSessionComplete ? (
            /* Session Completed Celebration Screen */
            <div
              className="card animate-fade-in"
              style={{
                maxWidth: 680,
                margin: '20px auto',
                textAlign: 'center',
                padding: '48px 36px',
                background: 'linear-gradient(160deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(99, 102, 241, 0.15)',
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.3) 100%)',
                  color: '#34d399',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  border: '2px solid rgba(16, 185, 129, 0.5)',
                  boxShadow: '0 0 24px rgba(16, 185, 129, 0.3)',
                }}
              >
                <CheckCircle size={44} />
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 10, letterSpacing: '-0.02em' }}>
                Tuyệt vời! Hoàn thành phiên {cards.length} từ vựng!
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28, maxWidth: 460, margin: '0 auto 28px' }}>
                Toàn bộ dữ liệu phản xạ trí nhớ đã được ghi nhận vào thuật toán SuperMemo SM-2 và đồng bộ trực tiếp vào kho lưu trữ JSON.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={() => loadFlashcards(false)} style={{ padding: '10px 20px' }}>
                  <Shuffle size={16} />
                  <span>Học tiếp {batchSize} từ ngẫu nhiên</span>
                </button>
                <button className="btn btn-outline" onClick={() => setSubTab('srs')} style={{ padding: '10px 20px' }}>
                  <BrainCircuit size={16} />
                  <span>Xem lịch nhắc Spaced Repetition</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Studio Header: Progress & Interactive Options */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  maxWidth: 680,
                  width: '100%',
                  margin: '0 auto',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                {/* Progress bar with percentage */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
                    Thẻ {cards.length > 0 ? currentIndex + 1 : 0} / {cards.length}
                  </span>
                  <div
                    style={{
                      width: 120,
                      height: 8,
                      borderRadius: 999,
                      background: 'rgba(255, 255, 255, 0.1)',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0}%`,
                        background: 'linear-gradient(90deg, #6366f1 0%, #38bdf8 100%)',
                        borderRadius: 999,
                        transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 0 8px rgba(99, 102, 241, 0.6)',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                    {cards.length > 0 ? Math.round(((currentIndex + 1) / cards.length) * 100) : 0}%
                  </span>
                </div>

                {/* Right controls: Direction, Auto Audio, Batch Size, Shuffle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Direction Switch En-Vi / Vi-En */}
                  <button
                    className="btn btn-outline"
                    style={{
                      padding: '4px 10px',
                      fontSize: 11,
                      gap: 4,
                      borderColor: studyDirection === 'vi-en' ? 'var(--primary)' : undefined,
                      color: studyDirection === 'vi-en' ? 'var(--primary-light)' : undefined,
                    }}
                    onClick={() => {
                      setStudyDirection((d) => (d === 'en-vi' ? 'vi-en' : 'en-vi'))
                      setIsFlipped(false)
                    }}
                    title="Đổi chiều học (Tiếng Anh ⇄ Tiếng Việt)"
                  >
                    <ArrowLeftRight size={13} />
                    <span>{studyDirection === 'en-vi' ? 'Anh ➔ Việt' : 'Việt ➔ Anh'}</span>
                  </button>

                  {/* Auto-pronounce toggle */}
                  <button
                    className={`btn-icon ${autoPronounce ? 'active' : ''}`}
                    style={{
                      width: 30,
                      height: 30,
                      color: autoPronounce ? '#38bdf8' : 'var(--text-muted)',
                      border: autoPronounce ? '1px solid rgba(56, 189, 248, 0.3)' : undefined,
                    }}
                    onClick={() => setAutoPronounce(!autoPronounce)}
                    title={autoPronounce ? 'Tự động phát âm: ĐANG BẬT' : 'Tự động phát âm: ĐANG TẮT'}
                  >
                    {autoPronounce ? <Volume2 size={15} /> : <VolumeX size={15} />}
                  </button>

                  {/* Batch size selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255, 255, 255, 0.04)', padding: '2px 4px', borderRadius: 8 }}>
                    {[15, 20, 30].map((size) => (
                      <button
                        key={size}
                        className={`btn ${batchSize === size ? 'btn-primary' : ''}`}
                        style={{
                          padding: '2px 8px',
                          fontSize: 11,
                          background: batchSize === size ? undefined : 'transparent',
                          border: 'none',
                        }}
                        onClick={() => setBatchSize(size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>

                  {/* Shuffle button */}
                  <button className="btn-icon" onClick={() => loadFlashcards(false)} title="Trộn lại bộ thẻ ngẫu nhiên">
                    <Shuffle size={14} />
                  </button>
                </div>
              </div>

              {/* 3D Flashcard Stage Centerpiece */}
              <div className="flashcard-stage">
                {loadingCards ? (
                  <div style={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    Đang nạp bộ thẻ từ vựng...
                  </div>
                ) : currentCard ? (
                  <div
                    className={`flashcard-container ${isFlipped ? 'flipped' : ''}`}
                    onClick={() => setIsFlipped(!isFlipped)}
                  >
                    {/* FRONT FACE */}
                    <div className="flashcard-face flashcard-front">
                      {/* Top Bar of Card */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className={`card-level-tag ${currentCard.level === 'C1' ? 'tag-c1' : 'tag-b2'}`}>
                            {currentCard.level} • {currentCard.part_of_speech || 'word'}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                            #{currentCard.item_number}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button
                            className="btn-icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleStar(currentCard.id)
                            }}
                            title={currentCard.is_starred ? 'Bỏ đánh dấu sao' : 'Thêm vào sổ tay từ khó (Phím S)'}
                            style={{ color: currentCard.is_starred ? '#fbbf24' : 'var(--text-muted)' }}
                          >
                            <Star size={17} fill={currentCard.is_starred ? '#fbbf24' : 'none'} />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              speakEnglish(currentCard.word, 0.75)
                            }}
                            title="Nghe phát âm chậm 0.75x"
                            style={{ fontSize: 11, fontWeight: 700, padding: '0 6px', width: 'auto' }}
                          >
                            0.75x
                          </button>
                          <button
                            className="btn-icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              speakEnglish(currentCard.word, 0.95)
                            }}
                            title="Nghe phát âm chuẩn UK 1.0x (Phím R)"
                          >
                            <Volume2 size={17} />
                          </button>
                        </div>
                      </div>

                      {/* Main Word Centerpiece */}
                      <div style={{ textAlign: 'center', margin: 'auto 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        {studyDirection === 'en-vi' ? (
                          <>
                            <div className="card-word-large">{currentCard.word}</div>
                            <div className="card-ipa">
                              {currentCard.ipa_uk || '/.../'}
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ fontSize: 32, fontWeight: 800, color: '#fde047', lineHeight: 1.3 }}>
                              {currentCard.vietnamese_meaning}
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              Hãy nhớ và đọc to từ vựng tiếng Anh tương ứng
                            </div>
                          </>
                        )}
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, letterSpacing: '0.02em' }}>
                          [Space] Lật thẻ • [R] Nghe lại • [S] Gắn sao
                        </div>
                      </div>

                      {/* Bottom Hint of Card */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                          paddingTop: 14,
                        }}
                      >
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <RotateCw size={14} />
                          <span>Nhấn Space hoặc nhấp vào thẻ để xem định nghĩa & ví dụ</span>
                        </span>
                        <span style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Mặt trước
                        </span>
                      </div>
                    </div>

                    {/* BACK FACE */}
                    <div className="flashcard-face flashcard-back">
                      {/* Top Bar of Back Card */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 16, fontWeight: 800, color: '#38bdf8' }}>
                            {currentCard.word}
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic' }}>
                            ({currentCard.part_of_speech})
                          </span>
                          <span style={{ color: '#34d399', fontSize: 13, fontFamily: 'Consolas, monospace' }}>
                            {currentCard.ipa_uk}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn-icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleStar(currentCard.id)
                            }}
                            style={{ color: currentCard.is_starred ? '#fbbf24' : 'var(--text-muted)' }}
                          >
                            <Star size={16} fill={currentCard.is_starred ? '#fbbf24' : 'none'} />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              speakEnglish(currentCard.example || currentCard.word)
                            }}
                            title="Nghe câu ví dụ"
                          >
                            <Volume2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Main Meaning & Context Content */}
                      <div style={{ margin: '10px 0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
                        <div style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', lineHeight: 1.3 }}>
                          {currentCard.vietnamese_meaning}
                        </div>

                        {currentCard.example && (
                          <div
                            style={{
                              background: 'rgba(0, 0, 0, 0.3)',
                              padding: '12px 16px',
                              borderRadius: 12,
                              borderLeft: '3px solid #6366f1',
                            }}
                          >
                            <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#818cf8', fontWeight: 700, marginBottom: 4 }}>
                              Câu ví dụ thực tế (Context)
                            </div>
                            <div style={{ fontSize: 14, color: '#e2e8f0', fontStyle: 'italic', lineHeight: 1.4 }}>
                              "{currentCard.example}"
                            </div>
                          </div>
                        )}

                        {currentCard.synonyms && currentCard.synonyms.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                              Đồng nghĩa:
                            </span>
                            {currentCard.synonyms.map((syn, idx) => (
                              <span
                                key={idx}
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: 6,
                                  background: 'rgba(99, 102, 241, 0.15)',
                                  color: '#c7d2fe',
                                  fontSize: 12,
                                  fontWeight: 500,
                                }}
                              >
                                {syn}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Bottom SRS Rating Actions */}
                      <div
                        style={{
                          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                          paddingTop: 12,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 12,
                        }}
                      >
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                          Đánh giá ghi nhớ (SRS):
                        </span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="srs-btn-rate"
                            style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185', borderColor: 'rgba(244, 63, 94, 0.3)' }}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRateCard(1)
                            }}
                            title="Phím tắt: 1"
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                              <XCircle size={14} />
                              <span>1. Chưa nhớ</span>
                            </span>
                            <span className="interval-hint">+10 phút</span>
                          </button>

                          <button
                            className="srs-btn-rate"
                            style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.3)' }}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRateCard(2)
                            }}
                            title="Phím tắt: 2"
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                              <HelpCircle size={14} />
                              <span>2. Tạm nhớ</span>
                            </span>
                            <span className="interval-hint">+1 ngày</span>
                          </button>

                          <button
                            className="srs-btn-rate"
                            style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRateCard(3)
                            }}
                            title="Phím tắt: 3"
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                              <CheckCircle size={14} />
                              <span>3. Đã thuộc</span>
                            </span>
                            <span className="interval-hint">+3 ngày</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    Không tìm thấy từ vựng nào.
                  </div>
                )}
              </div>

              {/* Floating Bottom Navigation Dock */}
              <div className="study-nav-dock">
                <button
                  className="btn btn-outline"
                  disabled={currentIndex === 0}
                  onClick={() => {
                    setIsFlipped(false)
                    setCurrentIndex((i) => Math.max(0, i - 1))
                  }}
                  style={{ borderRadius: 999, padding: '8px 16px', fontSize: 12 }}
                >
                  <ChevronLeft size={16} />
                  <span>Từ trước (←)</span>
                </button>

                <button
                  className="btn btn-primary"
                  onClick={() => setIsFlipped(!isFlipped)}
                  style={{
                    borderRadius: 999,
                    padding: '9px 24px',
                    fontSize: 13,
                    fontWeight: 700,
                    boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
                  }}
                >
                  <RotateCw size={15} />
                  <span>{isFlipped ? 'Mặt trước (Space)' : 'Lật xem nghĩa (Space)'}</span>
                </button>

                <button
                  className="btn btn-outline"
                  disabled={currentIndex + 1 >= cards.length}
                  onClick={() => {
                    setIsFlipped(false)
                    setCurrentIndex((i) => i + 1)
                  }}
                  style={{ borderRadius: 999, padding: '8px 16px', fontSize: 12 }}
                >
                  <span>Từ kế tiếp (→)</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SPACED REPETITION (SRS) QUEUE */}
      {/* ========================================================================= */}
      {subTab === 'srs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* SRS Hero Banner */}
          <div
            className="card"
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              padding: 28,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 999, background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
                  <BrainCircuit size={13} />
                  <span>THUẬT TOÁN LẶP LẠI NGẮT QUÃNG SUPERMEMO SM-2</span>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
                  Lịch Ôn Tập Chống Quên Lãng Hôm Nay
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 580, lineHeight: 1.5 }}>
                  Hệ thống tự động tính toán thời điểm vàng trước khi trí nhớ phai nhạt. Hãy hoàn thành các từ đến hạn để củng cố trí nhớ vĩnh viễn!
                </p>
              </div>

              <div>
                <button
                  className="btn btn-primary"
                  style={{ padding: '12px 22px', fontSize: 14 }}
                  onClick={() => {
                    setSubTab('flashcards')
                    loadFlashcards(true)
                  }}
                >
                  <Clock size={16} />
                  <span>Ôn tập ngay ({srsStats?.due_count ?? 0} từ)</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4 SRS Metrics Boxes */}
          <div className="grid-4">
            <div className="card" style={{ borderTop: '3px solid var(--accent-rose)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Cần ôn hôm nay
                </span>
                <span style={{ padding: '2px 8px', borderRadius: 999, background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185', fontSize: 11, fontWeight: 700 }}>
                  Đến hạn
                </span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>{srsStats?.due_count ?? 0}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Nhắc lại theo chu kỳ SM-2</div>
            </div>

            <div className="card" style={{ borderTop: '3px solid var(--accent-amber)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Đang ghi nhớ
                </span>
                <span style={{ padding: '2px 8px', borderRadius: 999, background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontSize: 11, fontWeight: 700 }}>
                  Hộp 2 - 3
                </span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>{srsStats?.learning_count ?? 0}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Chu kỳ 3 - 7 ngày tới</div>
            </div>

            <div className="card" style={{ borderTop: '3px solid var(--accent-emerald)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Đã thành thạo
                </span>
                <span style={{ padding: '2px 8px', borderRadius: 999, background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: 11, fontWeight: 700 }}>
                  Mastered
                </span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>{srsStats?.mastered_count ?? 0}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Nhớ trên 14 - 30 ngày</div>
            </div>

            <div className="card" style={{ borderTop: '3px solid #fbbf24' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Sổ tay từ khó
                </span>
                <Star size={16} color="#fbbf24" fill="#fbbf24" />
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>{srsStats?.starred_count ?? 0}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Từ bạn đã gắn sao ⭐</div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CONTEXT & SYNONYMS LAB */}
      {/* ========================================================================= */}
      {subTab === 'lab' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Lab Submode Toggle */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className={`btn ${labMode === 'cloze' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setLabMode('cloze')}
            >
              <span>Điền Từ Vào Ngữ Cảnh (Context Cloze)</span>
            </button>
            <button
              className={`btn ${labMode === 'synonyms' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setLabMode('synonyms')}
            >
              <span>Nối Cặp Từ Đồng Nghĩa (Synonym Matcher)</span>
            </button>
          </div>

          {/* DẠNG 1: CONTEXT CLOZE */}
          {labMode === 'cloze' && (
            <div style={{ maxWidth: 680, margin: '0 auto', width: '100%' }}>
              {loadingLab ? (
                <div style={{ textAlign: 'center', padding: 50, color: 'var(--text-muted)' }}>Đang tạo bài tập...</div>
              ) : currentCloze ? (
                <div className="card" style={{ padding: 28 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span className={`card-level-tag ${currentCloze.level === 'C1' ? 'tag-c1' : 'tag-b2'}`}>
                      {currentCloze.level} Context Cloze • Câu {clozeIndex + 1}/{clozeExercises.length}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#34d399' }}>Đúng: {clozeScore}</span>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: 18, borderRadius: 'var(--radius-md)', marginBottom: 20, borderLeft: '3px solid var(--primary)' }}>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6 }}>
                      Nghĩa cần điền: {currentCloze.vietnamese_meaning} ({currentCloze.part_of_speech})
                    </div>
                    <div style={{ fontSize: 16, color: '#fff', lineHeight: 1.6 }}>
                      "{currentCloze.cloze_sentence}"
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
                    {currentCloze.options.map((opt, idx) => {
                      let statusClass = ''
                      if (clozeSelected) {
                        if (opt.toLowerCase() === currentCloze.answer.toLowerCase()) statusClass = 'correct'
                        else if (opt === clozeSelected) statusClass = 'incorrect'
                      }
                      return (
                        <button
                          key={idx}
                          className={`quiz-option ${statusClass}`}
                          disabled={clozeSelected !== null}
                          onClick={() => {
                            setClozeSelected(opt)
                            if (opt.toLowerCase() === currentCloze.answer.toLowerCase()) {
                              setClozeScore((s) => s + 1)
                              speakEnglish(currentCloze.answer)
                            }
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>{opt}</span>
                        </button>
                      )
                    })}
                  </div>

                  {clozeSelected && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          if (clozeIndex + 1 < clozeExercises.length) {
                            setClozeIndex((i) => i + 1)
                            setClozeSelected(null)
                          } else {
                            loadLabExercises()
                          }
                        }}
                      >
                        <span>{clozeIndex + 1 < clozeExercises.length ? 'Câu tiếp theo' : 'Làm lượt mới'}</span>
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* DẠNG 2: SYNONYM MATCHER */}
          {labMode === 'synonyms' && (
            <div className="card" style={{ padding: 28, maxWidth: 740, margin: '0 auto', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Trò chơi Nối Cặp Từ Đồng Nghĩa</h4>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Nhấp chọn 1 từ tiếng Anh bên trái và 1 từ đồng nghĩa tương ứng bên phải</p>
                </div>
                <button className="btn btn-outline" style={{ fontSize: 12, padding: '4px 10px' }} onClick={loadLabExercises}>
                  <Shuffle size={14} />
                  <span>Trộn ván mới</span>
                </button>
              </div>

              <div className="grid-2" style={{ gap: 24 }}>
                {/* Left Column: Target Words */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Từ vựng gốc (Target Words)
                  </div>
                  {synonymPairs.map((p) => {
                    const isMatched = matchedWords.includes(p.word)
                    const isSelected = selectedWordCard === p.word
                    return (
                      <button
                        key={p.word}
                        disabled={isMatched}
                        onClick={() => handleSelectWordCard(p.word)}
                        style={{
                          padding: '14px 16px',
                          borderRadius: 'var(--radius-md)',
                          background: isMatched
                            ? 'rgba(16, 185, 129, 0.15)'
                            : isSelected
                            ? 'rgba(99, 102, 241, 0.25)'
                            : 'var(--bg-card)',
                          border: `1.5px solid ${isMatched ? 'var(--accent-emerald)' : isSelected ? 'var(--primary)' : 'var(--border-subtle)'}`,
                          color: isMatched ? '#34d399' : '#fff',
                          fontSize: 14,
                          fontWeight: 700,
                          textAlign: 'left',
                          cursor: isMatched ? 'default' : 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'var(--transition)',
                        }}
                      >
                        <span>{p.word}</span>
                        {isMatched && <Check size={16} color="#34d399" />}
                      </button>
                    )
                  })}
                </div>

                {/* Right Column: Synonyms */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Từ đồng nghĩa (Synonyms)
                  </div>
                  {[...synonymPairs]
                    .sort((a, b) => a.synonym.localeCompare(b.synonym))
                    .map((p) => {
                      const isMatched = matchedWords.includes(p.word)
                      const isSelected = selectedSynCard === p.synonym
                      return (
                        <button
                          key={p.synonym}
                          disabled={isMatched}
                          onClick={() => handleSelectSynCard(p.synonym)}
                          style={{
                            padding: '14px 16px',
                            borderRadius: 'var(--radius-md)',
                            background: isMatched
                              ? 'rgba(16, 185, 129, 0.15)'
                              : isSelected
                              ? 'rgba(99, 102, 241, 0.25)'
                              : 'var(--bg-card)',
                            border: `1.5px solid ${isMatched ? 'var(--accent-emerald)' : isSelected ? 'var(--primary)' : 'var(--border-subtle)'}`,
                            color: isMatched ? '#34d399' : '#fff',
                            fontSize: 14,
                            fontWeight: 600,
                            textAlign: 'left',
                            cursor: isMatched ? 'default' : 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'var(--transition)',
                          }}
                        >
                          <span>{p.synonym}</span>
                          {isMatched && <Check size={16} color="#34d399" />}
                        </button>
                      )
                    })}
                </div>
              </div>

              {matchedWords.length === synonymPairs.length && synonymPairs.length > 0 && (
                <div style={{ textAlign: 'center', marginTop: 24, padding: 14, borderRadius: 'var(--radius-md)', background: 'var(--accent-emerald-bg)', border: '1px solid var(--accent-emerald)' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#34d399' }}>
                    🎉 Xuất sắc! Bạn đã nối đúng toàn bộ các cặp từ đồng nghĩa trong {matchTries} lượt thử!
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DICTIONARY & STARRED NOTEBOOK */}
      {/* ========================================================================= */}
      {subTab === 'dictionary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Top Search & Filter Bar */}
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div className="search-box" style={{ flex: 1 }}>
                <Search size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Tra cứu từ vựng, phiên âm, nghĩa tiếng Việt hoặc từ đồng nghĩa..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setDictPage(0)
                  }}
                />
              </div>

              {/* Mode switch: All vs Starred */}
              <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: 3, border: '1px solid var(--border-subtle)' }}>
                <button
                  className={`level-btn ${dictMode === 'all' ? 'active' : ''}`}
                  onClick={() => {
                    setDictMode('all')
                    setDictPage(0)
                  }}
                >
                  Tất cả từ điển
                </button>
                <button
                  className={`level-btn ${dictMode === 'starred' ? 'active' : ''}`}
                  onClick={() => {
                    setDictMode('starred')
                    setDictPage(0)
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Star size={13} fill={dictMode === 'starred' ? '#fbbf24' : 'none'} color="#fbbf24" />
                  <span>Sổ tay từ khó</span>
                </button>
              </div>

              {/* POS filter */}
              {dictMode === 'all' && (
                <div style={{ display: 'flex', gap: 6 }}>
                  {['', 'n.', 'v.', 'adj.', 'adv.'].map((pos) => (
                    <button
                      key={pos}
                      className={`btn ${posFilter === pos ? 'btn-primary' : 'btn-outline'}`}
                      style={{ padding: '6px 10px', fontSize: 11 }}
                      onClick={() => {
                        setPosFilter(pos)
                        setDictPage(0)
                      }}
                    >
                      {pos === '' ? 'Tất cả' : pos}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Dictionary Table List */}
          {loadingDict ? (
            <div style={{ textAlign: 'center', padding: 50, color: 'var(--text-muted)' }}>
              Đang tra cứu cơ sở dữ liệu...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {dictItems.map((item) => (
                <div
                  key={item.id}
                  className="card"
                  style={{
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 260 }}>
                    <button
                      className="btn-icon"
                      onClick={() => handleToggleStar(item.id)}
                      style={{ color: item.is_starred ? '#fbbf24' : 'var(--text-muted)' }}
                      title={item.is_starred ? 'Bỏ đánh dấu sao' : 'Thêm vào sổ tay từ khó'}
                    >
                      <Star size={16} fill={item.is_starred ? '#fbbf24' : 'none'} />
                    </button>

                    <button
                      className="btn-icon"
                      onClick={() => speakEnglish(item.word)}
                      title="Nghe phát âm chuẩn UK"
                    >
                      <Volume2 size={16} />
                    </button>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{item.word}</span>
                        <span className={`card-level-tag ${item.level === 'C1' ? 'tag-c1' : 'tag-b2'}`} style={{ padding: '2px 6px', fontSize: 10 }}>
                          {item.level}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          {item.part_of_speech}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--primary-light)', fontFamily: 'Lucida Sans, sans-serif' }}>
                        {item.ipa_uk}
                      </div>
                    </div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>
                      {item.vietnamese_meaning}
                    </div>
                    {item.example && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 3 }}>
                        "{item.example}"
                      </div>
                    )}
                  </div>

                  {item.synonyms && item.synonyms.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, maxWidth: 200, flexWrap: 'wrap' }}>
                      {item.synonyms.slice(0, 2).map((syn, sIdx) => (
                        <span
                          key={sIdx}
                          style={{
                            fontSize: 11,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {syn}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Hiển thị {dictItems.length} trên tổng số {dictTotal.toLocaleString()} từ
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-outline"
                style={{ padding: '6px 12px', fontSize: 12 }}
                disabled={dictPage === 0}
                onClick={() => setDictPage((p) => Math.max(0, p - 1))}
              >
                Trang trước
              </button>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: 12, color: 'var(--text-secondary)' }}>
                Trang {dictPage + 1} / {Math.ceil(dictTotal / 20) || 1}
              </span>
              <button
                className="btn btn-outline"
                style={{ padding: '6px 12px', fontSize: 12 }}
                disabled={(dictPage + 1) * 20 >= dictTotal}
                onClick={() => setDictPage((p) => p + 1)}
              >
                Trang sau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
