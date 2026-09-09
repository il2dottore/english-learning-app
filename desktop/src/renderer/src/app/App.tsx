import React, { useState, useEffect } from 'react'
import './app.css'
import { Sidebar, NavTab } from '../components/Sidebar'
import { Topbar } from '../components/Topbar'
import { DashboardView } from '../features/dashboard/DashboardView'
import { VocabularyView } from '../features/vocabulary/VocabularyView'
import { SkillsView } from '../features/skills/SkillsView'
import { TestView } from '../features/test/TestView'
import { CoursesView } from '../features/courses/CoursesView'
import { ProfileView } from '../features/profile/ProfileView'
import { AdminView } from '../features/admin/AdminView'
import { checkHealth, fetchStats } from '../lib/api'
import { VocabularyStats } from '../types/vocabulary'

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard')
  const [level, setLevel] = useState<string>('ALL')
  const [stats, setStats] = useState<VocabularyStats | null>(null)
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false)

  const loadData = async () => {
    const isOnline = await checkHealth()
    setIsBackendOnline(isOnline)
    if (isOnline) {
      try {
        const statsData = await fetchStats()
        setStats(statsData)
      } catch (e) {
        console.error('Failed to load stats:', e)
      }
    }
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 15000)
    return () => clearInterval(interval)
  }, [])

  // Dynamic titles according to selected tab
  const tabTitles: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Bảng Điều Khiển Tổng Quan',
      subtitle: 'Theo dõi tiến độ học tập, chuỗi streak và kết quả bài thi',
    },
    courses: {
      title: 'Khóa Học & Lộ Trình CEFR',
      subtitle: 'Chương trình học chuẩn hóa theo cấp độ B2 First & C1 Advanced',
    },
    vocab: {
      title: 'Kho Từ Vựng Trọng Tâm B2 & C1',
      subtitle: 'Học thẻ 3D Flashcard, phát âm UK và tra cứu ngữ cảnh từ JSON',
    },
    skills: {
      title: 'Phòng Luyện Kỹ Năng',
      subtitle: 'Thực hành Luyện Nghe, Luyện Đọc tương tác và Ngữ pháp nâng cao',
    },
    test: {
      title: 'Trung Tâm Kiểm Tra & Đánh Giá',
      subtitle: 'Bộ đề thi trắc nghiệm thông minh tự động sinh từ ngân hàng từ vựng',
    },
    profile: {
      title: 'Hồ Sơ Học Viên & Thành Tích',
      subtitle: 'Mục tiêu chứng chỉ, thống kê thời gian học và huy hiệu đạt được',
    },
    admin: {
      title: 'Quản Trị Nội Dung & Dữ Liệu',
      subtitle: 'Giám sát nguồn dữ liệu JSON, đồng bộ SQLite và kiểm định hệ thống',
    },
  }

  const { title, subtitle } = tabTitles[activeTab]

  return (
    <div className="app-container">
      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        totalVocabCount={stats?.total ?? 2015}
      />

      {/* Main App Canvas */}
      <div className="main-wrapper">
        <Topbar
          title={title}
          subtitle={subtitle}
          level={level}
          onLevelChange={setLevel}
          isBackendOnline={isBackendOnline}
          onRefresh={loadData}
        />

        <main className="content-body">
          {activeTab === 'dashboard' && (
            <DashboardView stats={stats} onNavigate={setActiveTab} />
          )}

          {activeTab === 'vocab' && (
            <VocabularyView currentLevel={level} />
          )}

          {activeTab === 'skills' && (
            <SkillsView />
          )}

          {activeTab === 'test' && (
            <TestView currentLevel={level} />
          )}

          {activeTab === 'courses' && (
            <CoursesView />
          )}

          {activeTab === 'profile' && (
            <ProfileView />
          )}

          {activeTab === 'admin' && (
            <AdminView stats={stats} onReload={loadData} />
          )}
        </main>
      </div>
    </div>
  )
}
