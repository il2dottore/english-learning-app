import React, { useState, useEffect, useCallback } from 'react'
import {
  User,
  Award,
  Flame,
  Target,
  BookOpen,
  Clock,
  ShieldCheck,
  Mail,
  Edit3,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Sparkles,
  Save,
  RotateCcw,
  Lock,
  Volume2,
} from 'lucide-react'
import {
  UserProfileResponse,
  UserProfileUpdate,
  UserGoalsUpdate,
} from '../../types/profile'
import {
  fetchProfile,
  updateProfile,
  updateGoals,
  exportBackup,
  importBackup,
  resetProgress,
} from '../../lib/api'

type ProfileTab = 'goals' | 'badges' | 'backup'

export const ProfileView: React.FC = () => {
  const [profileData, setProfileData] = useState<UserProfileResponse | null>(null)
  const [activeTab, setActiveTab] = useState<ProfileTab>('goals')
  const [loading, setLoading] = useState(true)

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editBio, setEditBio] = useState('')

  // Goal Form State
  const [targetLevel, setTargetLevel] = useState('C1')
  const [targetCert, setTargetCert] = useState('IELTS 7.5+ / Cambridge CAE')
  const [dailyVocab, setDailyVocab] = useState(30)
  const [dailyTime, setDailyTime] = useState(30)
  const [reminderTime, setReminderTime] = useState('20:00')
  const [savingGoals, setSavingGoals] = useState(false)
  const [goalSavedSuccess, setGoalSavedSuccess] = useState(false)

  // Reset Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [resetConfirmText, setResetConfirmText] = useState('')
  const [resetLoading, setResetLoading] = useState(false)

  // Load Profile
  const loadProfile = useCallback(async () => {
    try {
      const data = await fetchProfile()
      setProfileData(data)
      setEditName(data.user.name)
      setEditEmail(data.user.email)
      setEditBio(data.user.bio)

      setTargetLevel(data.goals.target_level)
      setTargetCert(data.goals.target_cert)
      setDailyVocab(data.goals.daily_vocab_target)
      setDailyTime(data.goals.daily_time_target_minutes)
      setReminderTime(data.goals.reminder_time)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  // Save Profile Info
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const updated = await updateProfile({
        name: editName,
        email: editEmail,
        bio: editBio,
      })
      setProfileData(updated)
      setIsEditModalOpen(false)
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật hồ sơ')
    }
  }

  // Save Goals
  const handleSaveGoals = async () => {
    setSavingGoals(true)
    setGoalSavedSuccess(false)
    try {
      const updated = await updateGoals({
        target_level: targetLevel,
        target_cert: targetCert,
        daily_vocab_target: dailyVocab,
        daily_time_target_minutes: dailyTime,
        reminder_time: reminderTime,
      })
      setProfileData(updated)
      setGoalSavedSuccess(true)
      setTimeout(() => setGoalSavedSuccess(false), 3000)
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật mục tiêu')
    } finally {
      setSavingGoals(false)
    }
  }

  // Export Backup File
  const handleExportBackup = async () => {
    try {
      const pkg = await exportBackup()
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(pkg, null, 2))
      const downloadAnchor = document.createElement('a')
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      downloadAnchor.setAttribute('href', dataStr)
      downloadAnchor.setAttribute('download', `english_learning_backup_${todayStr}.json`)
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()
    } catch (err: any) {
      alert(err.message || 'Lỗi xuất bản sao lưu')
    }
  }

  // Import Backup File
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const jsonText = event.target?.result as string
        const parsed = JSON.parse(jsonText)
        if (!parsed.profile || !parsed.progress) {
          alert('Tệp sao lưu không đúng định dạng chuẩn!')
          return
        }
        await importBackup(parsed)
        alert('Dữ liệu học tập đã được khôi phục thành công!')
        loadProfile()
      } catch (err: any) {
        alert('Lỗi đọc tệp sao lưu: ' + err.message)
      }
    }
    reader.readAsText(file)
  }

  // Confirm Reset
  const handleConfirmReset = async () => {
    if (resetConfirmText.trim().toUpperCase() !== 'RESET') {
      alert('Vui lòng gõ chính xác chữ "RESET" để xác nhận!')
      return
    }
    setResetLoading(true)
    try {
      await resetProgress()
      alert('Đã đặt lại tiến độ học tập về mặc định!')
      setIsResetModalOpen(false)
      setResetConfirmText('')
      loadProfile()
    } catch (err: any) {
      alert(err.message || 'Lỗi đặt lại tiến độ')
    } finally {
      setResetLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-muted)' }}>Đang tải hồ sơ học viên...</p>
      </div>
    )
  }

  if (!profileData) return null

  return (
    <div className="animate-fade-in" style={{ maxWidth: 840, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Profile Header Card */}
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
          padding: 28,
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              fontWeight: 800,
              color: '#fff',
              boxShadow: '0 6px 18px rgba(14, 165, 233, 0.4)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            {profileData.user.avatar_initials}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>
                {profileData.user.name}
              </h3>
              <span
                style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  fontWeight: 700,
                }}
              >
                Học Viên Hoạt Động
              </span>
            </div>

            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
              {profileData.user.email} • Tham gia từ {profileData.user.joined_date}
            </div>

            <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic', maxWidth: 460 }}>
              "{profileData.user.bio}"
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Mục tiêu chứng chỉ
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#c084fc', marginTop: 2 }}>
              {profileData.goals.target_cert}
            </div>
          </div>

          <button
            className="btn btn-outline"
            style={{ padding: '6px 14px', fontSize: 12 }}
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit3 size={14} />
            <span>Sửa hồ sơ</span>
          </button>
        </div>
      </div>

      {/* 3 Overview Metric Cards */}
      <div className="grid-3">
        <div className="card" style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ color: '#f97316', display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
            <Flame size={26} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>
            {profileData.current_streak} Ngày
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Chuỗi học tập liên tục 🔥</div>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ color: '#38bdf8', display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
            <BookOpen size={26} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>
            {profileData.total_vocab_mastered} Từ
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Đã thuộc vững chắc (Mastered)</div>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ color: '#fbbf24', display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
            <Award size={26} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>
            {profileData.total_tests_taken} Bài
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Bài kiểm tra hoàn thành</div>
        </div>
      </div>

      {/* Profile Tabs Navigation */}
      <div className="subtabs-bar">
        <button
          className={`subtab-btn ${activeTab === 'goals' ? 'active' : ''}`}
          onClick={() => setActiveTab('goals')}
        >
          <Target size={16} />
          <span>Mục Tiêu & Thói Quen</span>
        </button>
        <button
          className={`subtab-btn ${activeTab === 'badges' ? 'active' : ''}`}
          onClick={() => setActiveTab('badges')}
        >
          <Award size={16} />
          <span>Huy Hiệu & Thành Tích ({profileData.badges.filter((b) => b.is_unlocked).length}/{profileData.badges.length})</span>
        </button>
        <button
          className={`subtab-btn ${activeTab === 'backup' ? 'active' : ''}`}
          onClick={() => setActiveTab('backup')}
        >
          <Download size={16} />
          <span>Sao Lưu & Dữ Liệu</span>
        </button>
      </div>

      {/* ================================================================ */}
      {/* TAB 1: GOALS & HABITS                                            */}
      {/* ================================================================ */}
      {activeTab === 'goals' && (
        <div className="card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <h4 style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: 0 }}>
              Cá Nhân Hóa Mục Tiêu & Lộ Trình Học Tập
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
              Thiết lập mục tiêu hàng ngày phù hợp với quỹ thời gian của bạn để xây dựng thói quen bền vững.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Daily Vocab Target */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
                Mục tiêu từ vựng mới mỗi ngày:
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                {[15, 30, 50].map((cnt) => (
                  <button
                    key={cnt}
                    onClick={() => setDailyVocab(cnt)}
                    style={{
                      flex: 1,
                      padding: '10px 0',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: dailyVocab === cnt ? 700 : 500,
                      background: dailyVocab === cnt ? '#38bdf8' : 'rgba(255, 255, 255, 0.05)',
                      color: dailyVocab === cnt ? '#000' : '#fff',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {cnt} từ/ngày
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Study Time Target */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
                Thời gian học tập mục tiêu:
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setDailyTime(mins)}
                    style={{
                      flex: 1,
                      padding: '10px 0',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: dailyTime === mins ? 700 : 500,
                      background: dailyTime === mins ? '#38bdf8' : 'rgba(255, 255, 255, 0.05)',
                      color: dailyTime === mins ? '#000' : '#fff',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {mins}p/ngày
                  </button>
                ))}
              </div>
            </div>

            {/* Target Level */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
                Trình độ ưu tiên chinh phục:
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { id: 'B2', title: 'B2 First (IELTS 6.0 - 6.5)' },
                  { id: 'C1', title: 'C1 Advanced (IELTS 7.0 - 8.5)' },
                ].map((lvl) => (
                  <button
                    key={lvl.id}
                    onClick={() => {
                      setTargetLevel(lvl.id)
                      setTargetCert(lvl.title)
                    }}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: targetLevel === lvl.id ? 700 : 500,
                      background: targetLevel === lvl.id ? '#c084fc' : 'rgba(255, 255, 255, 0.05)',
                      color: targetLevel === lvl.id ? '#000' : '#fff',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {lvl.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Reminder Time */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
                Giờ thông báo nhắc học hàng ngày:
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
            <div>
              {goalSavedSuccess && (
                <span style={{ color: '#34d399', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={16} /> Đã lưu mục tiêu học tập thành công!
                </span>
              )}
            </div>

            <button
              className="btn btn-primary"
              style={{ padding: '10px 24px', fontSize: 14 }}
              disabled={savingGoals}
              onClick={handleSaveGoals}
            >
              <Save size={16} />
              <span>{savingGoals ? 'Đang lưu...' : 'Lưu cài đặt mục tiêu'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 2: DYNAMIC ACHIEVEMENTS & BADGES                             */}
      {/* ================================================================ */}
      {activeTab === 'badges' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="grid-2">
            {profileData.badges.map((b) => (
              <div
                key={b.id}
                className="card"
                style={{
                  padding: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  background: b.is_unlocked
                    ? 'rgba(30, 41, 59, 0.8)'
                    : 'rgba(15, 23, 42, 0.4)',
                  border: b.is_unlocked
                    ? '1px solid rgba(56, 189, 248, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.05)',
                  opacity: b.is_unlocked ? 1 : 0.65,
                }}
              >
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 12,
                    background: b.is_unlocked ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 26,
                  }}
                >
                  {b.icon}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <h5 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>
                      {b.title}
                    </h5>

                    {b.is_unlocked ? (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#34d399',
                          background: 'rgba(16, 185, 129, 0.15)',
                          padding: '2px 8px',
                          borderRadius: 999,
                        }}
                      >
                        Đã mở khóa
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {b.progress_pct}%
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>
                    {b.desc}
                  </p>

                  {!b.is_unlocked && (
                    <div style={{ height: 4, borderRadius: 999, background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${b.progress_pct}%`, background: '#38bdf8', borderRadius: 999 }} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 3: BACKUP & DATA HUB                                         */}
      {/* ================================================================ */}
      {activeTab === 'backup' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Export Card */}
          <div
            className="card"
            style={{
              padding: 24,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>
                Xuất Bản Sao Lưu Dữ Liệu (Export Backup JSON)
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0 0' }}>
                Tải về tệp .json chứa toàn bộ Hồ sơ, Tiến độ từ vựng SRS, Lịch sử bài test và Khóa học đã lưu.
              </p>
            </div>

            <button className="btn btn-primary" onClick={handleExportBackup}>
              <Download size={16} />
              <span>Tải file sao lưu</span>
            </button>
          </div>

          {/* Import Card */}
          <div
            className="card"
            style={{
              padding: 24,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>
                Phục Hồi Từ Bản Sao Lưu (Import Backup JSON)
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0 0' }}>
                Chọn tệp .json đã xuất từ trước để khôi phục toàn bộ dữ liệu học tập lên thiết bị.
              </p>
            </div>

            <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              <Upload size={16} />
              <span>Chọn file phục hồi</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {/* Danger Zone: Reset Progress */}
          <div
            className="card"
            style={{
              padding: 24,
              background: 'rgba(239, 68, 68, 0.06)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f87171', fontWeight: 700, fontSize: 15 }}>
                <AlertTriangle size={18} />
                <span>Vùng Nguy Hiểm: Đặt Lại Tiến Độ Học Tập</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0 0' }}>
                Xóa toàn bộ lịch sử bài test, tiến độ từ vựng và chuỗi streak về 0 để bắt đầu lại từ đầu.
              </p>
            </div>

            <button
              className="btn btn-secondary"
              style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}
              onClick={() => setIsResetModalOpen(true)}
            >
              <RotateCcw size={16} />
              <span>Đặt lại tiến độ</span>
            </button>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="card animate-fade-in" style={{ width: '92%', maxWidth: 480, padding: 28 }}>
            <h4 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16 }}>
              Chỉnh Sửa Hồ Sơ Cá Nhân
            </h4>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Họ và tên hiển thị:
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Địa chỉ Email:
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Tiểu sử & Mục tiêu cá nhân:
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    resize: 'none',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Danger Zone Reset Modal */}
      {isResetModalOpen && (
        <div className="modal-overlay">
          <div className="card animate-fade-in" style={{ width: '92%', maxWidth: 440, padding: 28, textAlign: 'center' }}>
            <AlertTriangle size={40} color="#f87171" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
              Xác Nhận Đặt Lại Tiến Độ
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
              Hành động này sẽ xóa toàn bộ từ vựng đã học, lịch sử thi và chuỗi ngày streak. Không thể hoàn tác sau khi thực hiện.
            </p>

            <div style={{ marginBottom: 16, textAlign: 'left' }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                Gõ chữ <strong>RESET</strong> để xác nhận:
              </label>
              <input
                type="text"
                placeholder="RESET"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 6,
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#fff',
                  textAlign: 'center',
                  fontWeight: 700,
                  letterSpacing: 2,
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setIsResetModalOpen(false)
                  setResetConfirmText('')
                }}
              >
                Hủy bỏ
              </button>
              <button
                className="btn btn-primary"
                style={{ background: '#ef4444', borderColor: '#ef4444' }}
                disabled={resetConfirmText.trim().toUpperCase() !== 'RESET' || resetLoading}
                onClick={handleConfirmReset}
              >
                {resetLoading ? 'Đang đặt lại...' : 'Đồng ý Đặt Lại'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
