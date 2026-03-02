'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { alertApi } from '@/lib/api'

const Icons = {
  dashboard: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  ),
  compare: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
    </svg>
  ),
  alert: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  settings: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  help: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  menu: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  close: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  star: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  ),
}

const mainMenu = [
  { icon: Icons.dashboard, label: '대시보드',  href: '/' },
  { icon: Icons.compare,   label: '종목 비교',  href: '/compare' },
  { icon: Icons.alert,     label: '알림',       href: '/alerts' },
]

const preferenceMenu = [
  { icon: Icons.settings, label: '설정',  href: '/settings' },
  { icon: Icons.help,     label: '도움말', href: '/help' },
]

function NavItem({
  item,
  isActive,
  onClose,
}: {
  item: { icon: React.ReactNode; label: string; href: string; badge?: number }
  isActive: boolean
  onClose: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      href={item.href}
      onClick={onClose}
      className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
      style={{
        background: isActive ? '#f0eefb' : hovered ? '#f8f7fd' : 'transparent',
        color: isActive ? '#8b7fd4' : '#5e5a78',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center gap-3">
        <span style={{ color: isActive ? '#8b7fd4' : '#9e9ab8' }}>{item.icon}</span>
        <span>{item.label}</span>
      </div>
      {item.badge != null && (
        <span
          className="px-1.5 py-0.5 text-xs font-bold rounded-full"
          style={{ background: '#8b7fd4', color: '#fff' }}
        >
          {item.badge}
        </span>
      )}
    </Link>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    alertApi.getAlerts(undefined, true)
      .then(alerts => setUnreadCount(alerts.length))
      .catch(() => setUnreadCount(0))
  }, [])

  return (
    <>
      {/* 모바일 햄버거 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-xl shadow-sm"
        style={{ border: '1px solid #ece9f5' }}
        aria-label="메뉴 토글"
      >
        <span style={{ color: '#5e5a78' }}>{isOpen ? Icons.close : Icons.menu}</span>
      </button>

      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/30 z-40" onClick={() => setIsOpen(false)} />
      )}

      {/* 사이드바 본체 */}
      <aside
        style={{ background: '#ffffff', borderRight: '1px solid #ece9f5' }}
        className={`
          fixed left-0 top-0 h-screen w-[260px] z-40 flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* 로고 */}
        <div className="px-6 pt-6 pb-5" style={{ borderBottom: '1px solid #f3f1fa' }}>
          <Link href="/" className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #8b7fd4, #6a5fc4)' }}
            >
              L
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: '#18162a' }}>LuminSight</p>
              <p className="text-xs" style={{ color: '#9e9ab8' }}>AI 주식 감성 분석</p>
            </div>
          </Link>
        </div>

        {/* 메뉴 */}
        <nav className="flex-1 px-4 py-5 space-y-0.5 overflow-y-auto">

          {/* MAIN MENU */}
          <p className="px-3 pb-2 pt-1 text-xs font-semibold tracking-widest uppercase" style={{ color: '#c4c0d8' }}>
            Main Menu
          </p>
          {mainMenu.map(item => (
            <NavItem
              key={item.href}
              item={{
                ...item,
                badge: item.href === '/alerts' && unreadCount > 0 ? unreadCount : undefined
              }}
              isActive={pathname === item.href}
              onClose={() => setIsOpen(false)}
            />
          ))}

          {/* PREFERENCE */}
          <div className="pt-4">
            <p className="px-3 pb-2 text-xs font-semibold tracking-widest uppercase" style={{ color: '#c4c0d8' }}>
              Preference
            </p>
            {preferenceMenu.map(item => (
              <NavItem
                key={item.href}
                item={item}
                isActive={pathname === item.href}
                onClose={() => setIsOpen(false)}
              />
            ))}
          </div>
        </nav>

        {/* 업그레이드 카드 */}
        <div className="px-4 pb-4">
          <div
            className="rounded-2xl p-4"
            style={{ background: 'linear-gradient(135deg, #8b7fd4 0%, #6a5fc4 100%)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span style={{ color: '#e8e4ff' }}>{Icons.star}</span>
              <span className="text-xs font-semibold text-white">Pro 플랜 업그레이드</span>
            </div>
            <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.75)' }}>
              실시간 알림 & 무제한 종목 분석
            </p>
            <button
              className="w-full py-1.5 rounded-xl text-xs font-bold transition-all"
              style={{ background: '#ffffff', color: '#8b7fd4' }}
            >
              업그레이드
            </button>
          </div>
        </div>

        {/* 유저 */}
        <div className="px-4 py-4" style={{ borderTop: '1px solid #f3f1fa' }}>
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl" style={{ background: '#f8f7fd' }}>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background: 'linear-gradient(135deg, #8b7fd4, #6a5fc4)' }}
            >
              U
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: '#18162a' }}>사용자</p>
              <p className="text-xs truncate" style={{ color: '#9e9ab8' }}>user@example.com</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
