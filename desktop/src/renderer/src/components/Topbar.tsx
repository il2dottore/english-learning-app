import React from 'react'
import { Flame, RefreshCw, Volume2 } from 'lucide-react'
import { speakEnglish } from '../lib/api'

interface TopbarProps {
  title: string
  subtitle: string
  level: string
  onLevelChange: (level: string) => void
  isBackendOnline: boolean
  onRefresh?: () => void
}

export const Topbar: React.FC<TopbarProps> = ({
  title,
  subtitle,
  level,
  onLevelChange,
  isBackendOnline,
  onRefresh,
}) => {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="page-headline">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="topbar-right">
        {/* CEFR Level Filter Pill */}
        <div className="level-selector-pill">
          <button
            className={`level-btn ${level === 'ALL' ? 'active' : ''}`}
            onClick={() => onLevelChange('ALL')}
          >
            Tất cả
          </button>
          <button
            className={`level-btn ${level === 'B2' ? 'active' : ''}`}
            onClick={() => onLevelChange('B2')}
          >
            B2 Upper
          </button>
          <button
            className={`level-btn ${level === 'C1' ? 'active' : ''}`}
            onClick={() => onLevelChange('C1')}
          >
            C1 Advanced
          </button>
        </div>

        {/* Quick Voice Demo Button */}
        <button
          className="btn btn-outline"
          style={{ padding: '6px 12px', fontSize: 12 }}
          onClick={() => speakEnglish('Welcome to your English learning space!')}
          title="Kiểm tra âm thanh phát âm chuẩn UK"
        >
          <Volume2 size={15} />
          <span>UK Voice</span>
        </button>

        {/* Daily Streak Badge */}
        <div className="streak-pill" title="Chuỗi ngày học tập liên tục">
          <Flame size={15} />
          <span>14 ngày streak</span>
        </div>

        {/* Backend Online Status Indicator */}
        <div
          className={`status-pill ${isBackendOnline ? 'online' : 'offline'}`}
          title={isBackendOnline ? 'Kết nối FastAPI Backend & SQLite ổn định' : 'Chưa kết nối Backend port 8000'}
        >
          <span className="status-dot" />
          <span>{isBackendOnline ? 'Backend OK' : 'Offline'}</span>
        </div>

        {onRefresh && (
          <button className="btn-icon" onClick={onRefresh} title="Tải lại dữ liệu">
            <RefreshCw size={15} />
          </button>
        )}
      </div>
    </header>
  )
}
