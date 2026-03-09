'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { alertApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

// 모바일 전용 알림 벨 (사이드바 바깥에 항상 표시)
export function MobileAlertBell({ unreadCount }: { unreadCount: number }) {
  if (unreadCount === 0) return null
  return (
    <Link
      href="/alerts"
      className="lg:hidden fixed top-3.5 right-4 z-50 flex items-center justify-center"
      aria-label="알림"
    >
      <div className="relative p-2 bg-white rounded-xl shadow-sm" style={{ border: '1px solid #ece9f5' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5e5a78" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <span
          className="absolute -top-1 -right-1 text-xs font-bold rounded-full flex items-center justify-center"
          style={{ background: '#ef4444', color: '#fff', minWidth: 16, height: 16, fontSize: 10, padding: '0 3px' }}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      </div>
    </Link>
  )
}

const Icons = {
  dashboard: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  ),
  journal: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
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
  logout: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  news: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
      <path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/>
    </svg>
  ),
}

const mainMenu = [
  { icon: Icons.dashboard, label: '대시보드',  href: '/' },
  { icon: Icons.news,      label: '뉴스 피드', href: '/news' },
  { icon: Icons.journal,   label: '투자 일지',  href: '/journal' },
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
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const { user, isAuthenticated, isLoading, login, logout } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) return
    alertApi.getAlerts(undefined, true)
      .then(alerts => setUnreadCount(alerts.length))
      .catch(() => setUnreadCount(0))
  }, [isAuthenticated])

  // 비로그인 시 로그인 페이지로 리다이렉트
  // 단, 공개 경로(랜딩 페이지, 종목 상세)는 제외 — ConditionalLayout에서 사이드바 자체를 숨김
  useEffect(() => {
    const isPublicPath = pathname === '/' || pathname.startsWith('/stock/')
    if (!isLoading && !isAuthenticated && !isPublicPath && pathname !== '/login' && !pathname.startsWith('/auth')) {
      router.replace('/login')
    }
  }, [isLoading, isAuthenticated, pathname, router])

  return (
    <>
      {/* 모바일에서는 BottomNav가 네비게이션 담당 — 햄버거/벨 숨김 */}

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
              실시간 알림 &amp; 무제한 종목 분석
            </p>
            <button
              className="w-full py-1.5 rounded-xl text-xs font-bold transition-all"
              style={{ background: '#ffffff', color: '#8b7fd4' }}
            >
              업그레이드
            </button>
          </div>
        </div>

        {/* 유저 프로필 */}
        <div className="px-4 py-4" style={{ borderTop: '1px solid #f3f1fa' }}>
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3 px-2 py-2 rounded-xl" style={{ background: '#f8f7fd' }}>
              {/* 아바타 */}
              {user.pictureUrl ? (
                <img
                  src={user.pictureUrl}
                  alt={user.name}
                  className="w-8 h-8 rounded-full shrink-0 object-cover"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ background: 'linear-gradient(135deg, #8b7fd4, #6a5fc4)' }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: '#18162a' }}>{user.name}</p>
                <p className="text-xs truncate" style={{ color: '#9e9ab8' }}>{user.email}</p>
              </div>
              {/* 로그아웃 버튼 */}
              <button
                onClick={logout}
                title="로그아웃"
                className="shrink-0 p-1.5 rounded-lg transition-colors"
                style={{ color: '#b0accc' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#e05c5c')}
                onMouseLeave={e => (e.currentTarget.style.color = '#b0accc')}
              >
                {Icons.logout}
              </button>
            </div>
          ) : (
            <button
              onClick={login}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: '#f0eefb', color: '#8b7fd4' }}
            >
              <svg width="16" height="16" viewBox="0 0 48 48">
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v8.51h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.14z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.49-1.47-.76-3.04-.76-4.59s.27-3.12.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              </svg>
              Google로 로그인
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
