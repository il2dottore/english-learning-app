import React, { useState, useEffect } from 'react'
import {
  Layers,
  BookOpen,
  Award,
  CheckCircle2,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowRight,
  Flame,
  Zap,
  Target,
  GraduationCap,
  History,
} from 'lucide-react'
import { VocabularyStats } from '../../types/vocabulary'
import { DashboardSummaryResponse } from '../../types/progress'
import { fetchDashboardProgress } from '../../lib/api'
import { NavTab } from '../../components/Sidebar'

interface DashboardViewProps {
  stats: VocabularyStats | null
  onNavigate: (tab: NavTab) => void
}

export const DashboardView: React.FC<DashboardViewProps> = ({ stats, onNavigate }) => {
  const [dashboardData, setDashboardData] = useState<DashboardSummaryResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardProgress()
      .then((data) => setDashboardData(data))
      .catch((err) => console.error('Failed to load dashboard progress:', err))
      .finally(() => setLoading(false))
  }, [])

  const total = stats?.total ?? 2015
  const b2Total = stats?.b2_count ?? 700
  const c1Total = stats?.c1_count ?? 1315

  // Calculate max count for 7-day bar chart scaling
  const maxActivity = dashboardData?.last_7_days_activity
    ? Math.max(
        ...dashboardData.last_7_days_activity.map(
          (d) => d.vocab_reviewed + d.tests_completed * 5 + d.lessons_completed * 10,
        ),
        10,
      )
    : 10

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Hero Welcome & Streak Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(15, 23, 42, 0.9) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: 'var(--radius-xl)',
          padding: '24px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 20,
        }}
      >
        <div style={{ maxWidth: 540 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 999,
              background: 'rgba(99, 102, 241, 0.25)',
              color: '#a5b4fc',
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 10,
            }}
          >
            <Sparkles size={14} />
            <span>KHO DỮ LIỆU TỪ VỰNG CHUẨN JSON</span>
          </div>

          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
            Sẵn sàng nâng cấp vốn từ B2 & C1 hôm nay?
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, lineHeight: 1.5, marginBottom: 16 }}>
            Hệ thống đã nạp sẵn <strong>{total.toLocaleString()} từ vựng học thuật</strong> kèm phiên âm UK, từ đồng nghĩa và câu ngữ cảnh thực tế.
          </p>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={() => onNavigate('vocab')}>
              <Layers size={16} />
              <span>Học Flashcard ngay</span>
            </button>
            <button className="btn btn-outline" onClick={() => onNavigate('test')}>
              <Zap size={16} />
              <span>Làm bài Test nhanh</span>
            </button>
          </div>
        </div>

        {/* Daily Streak Highlight Card */}
        <div
          style={{
            background: 'rgba(11, 17, 32, 0.8)',
            border: '1px solid rgba(249, 115, 22, 0.35)',
            borderRadius: 'var(--radius-lg)',
            padding: '18px 24px',
            textAlign: 'center',
            minWidth: 170,
            boxShadow: '0 8px 20px rgba(249, 115, 22, 0.15)',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 999,
              background: 'rgba(249, 115, 22, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 8px',
            }}
          >
            <Flame size={28} color="#f97316" />
          </div>

          <div style={{ fontSize: 12, color: '#fb923c', fontWeight: 700, textTransform: 'uppercase' }}>
            Chuỗi Ngày Học
          </div>

          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginTop: 2 }}>
            {dashboardData?.streak.current_streak ?? 1} Ngày 🔥
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Kỷ lục: {dashboardData?.streak.longest_streak ?? 1} ngày liên tiếp
          </div>
        </div>
      </div>

      {/* 4 Metric Cards (Connected to Real JSON Progress Data) */}
      <div className="grid-4">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Tổng vốn từ hệ thống</span>
            <div className="metric-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light)' }}>
              <Layers size={20} />
            </div>
          </div>
          <div className="metric-value">{total.toLocaleString()}</div>
          <div style={{ fontSize: 12, color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
            <TrendingUp size={14} />
            <span>Nạp tự động từ B2 & C1 JSON</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Từ đã ôn tập hôm nay</span>
            <div className="metric-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="metric-value">
            {dashboardData?.words_reviewed_today ?? 0}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Mục tiêu: 30 từ/ngày</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Độ chính xác bài Test</span>
            <div className="metric-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)' }}>
              <Award size={20} />
            </div>
          </div>
          <div className="metric-value">
            {dashboardData?.accuracy_rate ? `${dashboardData.accuracy_rate}%` : '---'}
          </div>
          <div style={{ fontSize: 12, color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
            <TrendingUp size={14} />
            <span>Đo lường từ lịch sử kiểm tra</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Tổng XP tích lũy</span>
            <div className="metric-icon" style={{ background: 'rgba(14, 165, 233, 0.15)', color: 'var(--accent-sky)' }}>
              <Sparkles size={20} />
            </div>
          </div>
          <div className="metric-value">
            +{dashboardData?.total_xp ?? 0}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cộng từ bài học & test</div>
        </div>
      </div>

      {/* 7-Day Activity Chart & Progress Analytics */}
      <div className="grid-2">
        {/* 7-Day Activity Bar Chart */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>
                Hoạt Động 7 Ngày Gần Nhất
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Số từ vựng và bài tập hoàn thành mỗi ngày
              </p>
            </div>
            <span style={{ fontSize: 12, color: '#38bdf8', fontWeight: 600 }}>Theo tuần</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              height: 160,
              padding: '0 8px 10px 8px',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            {dashboardData?.last_7_days_activity.map((item, idx) => {
              const totalVal = item.vocab_reviewed + item.tests_completed * 5 + item.lessons_completed * 10
              const heightPct = Math.max(Math.round((totalVal / maxActivity) * 100), 8)

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    flex: 1,
                  }}
                >
                  <div style={{ fontSize: 11, color: item.is_active ? '#34d399' : 'var(--text-muted)', fontWeight: 600 }}>
                    {item.vocab_reviewed > 0 ? item.vocab_reviewed : ''}
                  </div>

                  <div
                    style={{
                      width: 24,
                      height: `${heightPct}%`,
                      maxHeight: 120,
                      borderRadius: 6,
                      background: item.is_active
                        ? 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)'
                        : 'rgba(255, 255, 255, 0.06)',
                      boxShadow: item.is_active ? '0 0 10px rgba(56, 189, 248, 0.4)' : 'none',
                      transition: 'height 0.4s ease',
                    }}
                    title={`${item.date_str}: ${item.vocab_reviewed} từ, ${item.tests_completed} bài test`}
                  />

                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: item.is_active ? '#fff' : 'var(--text-muted)',
                    }}
                  >
                    {item.day_name}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Real Progress (SRS & Course Mastery) */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>
                Tiến Độ Tích Lũy Từ Vựng & Khóa Học
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Đo lường thời gian thực từ dữ liệu học tập
              </p>
            </div>
            <button
              className="btn btn-outline"
              style={{ padding: '4px 10px', fontSize: 12 }}
              onClick={() => onNavigate('courses')}
            >
              Xem lộ trình
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* B2 Vocab Progress */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: '#fff', fontWeight: 600 }}>Vốn từ B2 (Upper-Intermediate)</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {dashboardData?.vocab_mastery.b2_mastered ?? 0} / {b2Total} từ ({dashboardData?.vocab_mastery.b2_percentage ?? 0}%)
                </span>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${dashboardData?.vocab_mastery.b2_percentage ?? 0}%`,
                    borderRadius: 999,
                    background: 'linear-gradient(90deg, #0284c7, #38bdf8)',
                  }}
                />
              </div>
            </div>

            {/* C1 Vocab Progress */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: '#fff', fontWeight: 600 }}>Vốn từ C1 (Advanced Fluency)</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {dashboardData?.vocab_mastery.c1_mastered ?? 0} / {c1Total} từ ({dashboardData?.vocab_mastery.c1_percentage ?? 0}%)
                </span>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${dashboardData?.vocab_mastery.c1_percentage ?? 0}%`,
                    borderRadius: 999,
                    background: 'linear-gradient(90deg, #7c3aed, #c084fc)',
                  }}
                />
              </div>
            </div>

            {/* B2 Course Progress */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: '#fff', fontWeight: 600 }}>Khóa học B2 First (24 bài)</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {dashboardData?.course_progress.b2_completed_lessons ?? 0} / 24 bài ({dashboardData?.course_progress.b2_percentage ?? 0}%)
                </span>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${dashboardData?.course_progress.b2_percentage ?? 0}%`,
                    borderRadius: 999,
                    background: 'linear-gradient(90deg, #059669, #34d399)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tests Section (Connected to Real JSON test_history) */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>
              Kết Quả Bài Kiểm Tra Gần Nhất
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Lưu trữ trực tiếp và tự động chấm điểm vào JSON
            </p>
          </div>
          <button
            className="btn btn-outline"
            style={{ padding: '4px 10px', fontSize: 12 }}
            onClick={() => onNavigate('test')}
          >
            <span>Vào trung tâm thi</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {dashboardData?.recent_tests && dashboardData.recent_tests.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {dashboardData.recent_tests.map((t) => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {new Date(t.timestamp).toLocaleString('vi-VN')} • Thời lượng: {t.duration_seconds}s
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#34d399' }}>
                    {t.correct_count} / {t.total_questions} ({t.score_percentage}%)
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 999,
                      background:
                        t.score_percentage >= 80
                          ? 'rgba(16, 185, 129, 0.15)'
                          : 'rgba(245, 158, 11, 0.15)',
                      color: t.score_percentage >= 80 ? '#34d399' : '#fbbf24',
                    }}
                  >
                    {t.rating_label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
            Chưa có bài kiểm tra nào được lưu. Hãy vào tab "Kiểm tra" để làm bài test đầu tiên!
          </div>
        )}
      </div>
    </div>
  )
}
