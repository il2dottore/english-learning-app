import React from 'react'
import {
  LayoutDashboard,
  GraduationCap,
  Layers,
  Headphones,
  FileCheck2,
  User,
  Settings2,
  Sparkles,
  Flame,
} from 'lucide-react'

export type NavTab = 'dashboard' | 'courses' | 'vocab' | 'skills' | 'test' | 'profile' | 'admin'

interface SidebarProps {
  activeTab: NavTab
  onSelectTab: (tab: NavTab) => void
  totalVocabCount: number
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, totalVocabCount }) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Tổng quan & Tiến độ',
      icon: LayoutDashboard,
      badge: null,
      desc: 'Theo dõi kết quả học tập',
    },
    {
      id: 'courses' as NavTab,
      label: 'Khóa học & Lộ trình',
      icon: GraduationCap,
      badge: 'B2 / C1',
      desc: 'Lộ trình bài học theo Unit',
    },
    {
      id: 'vocab' as NavTab,
      label: 'Kho Từ vựng B2 & C1',
      icon: Layers,
      badge: totalVocabCount ? `${totalVocabCount.toLocaleString()}+` : 'JSON',
      desc: 'Flashcard 3D & SRS',
    },
    {
      id: 'skills' as NavTab,
      label: 'Phòng Luyện Kỹ năng',
      icon: Headphones,
      badge: 'Nghe • Đọc',
      desc: 'Listening, Reading, Grammar',
    },
    {
      id: 'test' as NavTab,
      label: 'Làm Bài Kiểm tra',
      icon: FileCheck2,
      badge: 'AI Quiz',
      desc: 'Chấm điểm & đánh giá',
    },
    {
      id: 'profile' as NavTab,
      label: 'Hồ sơ & Thành tích',
      icon: User,
      badge: null,
      desc: 'Mục tiêu & chứng chỉ',
    },
    {
      id: 'admin' as NavTab,
      label: 'Quản trị Nội dung',
      icon: Settings2,
      badge: 'Admin',
      desc: 'Quản lý data từ vựng JSON',
    },
  ]

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="logo-badge">
          <Sparkles size={22} />
        </div>
        <div>
          <div className="brand-title">EnglishPro</div>
          <div className="brand-subtitle">B2 & C1 Learning Hub</div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="sidebar-nav">
        <div className="nav-section-title">Chức năng trọng tâm</div>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </button>
          )
        })}
      </nav>

      {/* Footer Profile Box */}
      <div className="sidebar-footer">
        <div className="user-quick-card">
          <div className="user-avatar">NL</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Nguyễn Long</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Mục tiêu: C1 Advanced</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#fbbf24', fontSize: 12, fontWeight: 700 }}>
            <Flame size={14} />
            <span>14</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
