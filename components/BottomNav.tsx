'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { alertApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
  activeIcon: React.ReactNode
}

const navItems: NavItem[] = [
  {
    href: '/',
    label: '홈',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
    activeIcon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    href: '/compare',
    label: '비교',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
        <polyline points="16 7 22 7 22 13"/>
      </svg>
    ),
    activeIcon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
        <polyline points="16 7 22 7 22 13"/>
      </svg>
    ),
  },
  {
    href: '/journal',
    label: '일지',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    activeIcon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    href: '/alerts',
    label: '알림',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
    activeIcon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0" fill="none" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    href: '/watchlist',
    label: '관심',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    activeIcon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
]

export default function BottomNav() {
  const pathname = usePathname()
  const { isAuthenticated } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  // 미읽음 알림 개수 — 로그인 상태일 때만 + 페이지 전환 시 갱신
  useEffect(() => {
    if (!isAuthenticated) { setUnreadCount(0); return }
    alertApi.getUnreadCount()
      .then(setUnreadCount)
      .catch(() => setUnreadCount(0))
  }, [isAuthenticated, pathname])

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-1"
      style={{
        background: '#ffffff',
        borderTop: '1px solid #ece9f5',
        boxShadow: '0 -4px 16px rgba(139,127,212,0.10)',
        height: 60,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {navItems.map(({ href, label, icon, activeIcon }) => {
        const isActive = href === '/'
          ? pathname === '/'
          : pathname === href || pathname.startsWith(href + '/')
        const isAlerts = href === '/alerts'
        const badgeCount = isAlerts ? unreadCount : 0
        return (
          <Link
            key={href}
            href={href}
            className="relative flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all"
            style={{ color: isActive ? '#8b7fd4' : '#b0accc' }}
          >
            <span className="relative transition-transform" style={{ transform: isActive ? 'scale(1.1)' : 'scale(1)' }}>
              {isActive ? activeIcon : icon}
              {badgeCount > 0 && (
                <span
                  className="absolute -top-1 -right-1.5 flex items-center justify-center rounded-full text-white font-bold"
                  style={{
                    background: '#ef4444',
                    minWidth: 15,
                    height: 15,
                    fontSize: 9,
                    padding: '0 3px',
                    lineHeight: 1,
                  }}
                >
                  {badgeCount > 9 ? '9+' : badgeCount}
                </span>
              )}
            </span>
            <span className="text-xs font-medium leading-none"
              style={{ color: isActive ? '#8b7fd4' : '#b0accc' }}>
              {label}
            </span>
            {isActive && (
              <span
                className="absolute bottom-0 rounded-full"
                style={{ width: 4, height: 4, background: '#8b7fd4', bottom: 6 }}
              />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
