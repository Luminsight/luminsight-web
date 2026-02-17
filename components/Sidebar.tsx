'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface MenuItem {
  icon: string
  label: string
  href: string
  badge?: string | number
}

const menuItems: MenuItem[] = [
  {
    icon: '📊',
    label: '대시보드',
    href: '/',
  },
  {
    icon: '📈',
    label: '종목 비교',
    href: '/compare',
  },
  {
    icon: '🔔',
    label: '알림',
    href: '/alerts',
    badge: 3,
  },
  {
    icon: '⚙️',
    label: '설정',
    href: '/settings',
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* 모바일 햄버거 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 glass rounded-lg border border-border hover:border-accent-blue transition-all"
        aria-label="메뉴 토글"
      >
        <svg
          className="w-6 h-6 text-text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* 모바일 오버레이 */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={`
          fixed left-0 top-0 h-screen w-[280px] z-40
          bg-gradient-to-b from-bg-primary via-bg-secondary to-bg-primary
          border-r border-border-light
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          overflow-y-auto
        `}
      >
        {/* 로고 */}
        <div className="p-6 border-b border-border">
          <Link href="/" className="block">
            <h1 className="text-2xl font-bold gradient-text">
              📊 LuminSight
            </h1>
            <p className="text-xs text-text-muted mt-1">
              AI 주식 감성 분석
            </p>
          </Link>
        </div>

        {/* 메뉴 아이템 */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center justify-between
                  px-4 py-3 rounded-xl
                  font-semibold text-sm
                  transition-all duration-200
                  ${
                    isActive
                      ? 'bg-gradient-to-br from-accent-blue to-blue-700 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]'
                      : 'text-text-secondary hover:bg-bg-tertiary hover:text-accent-cyan'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-accent-pink text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* 하단 정보 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="glass p-3 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-blue to-accent-cyan flex items-center justify-center text-white font-bold">
                U
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">
                  사용자
                </p>
                <p className="text-xs text-text-muted truncate">
                  user@example.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}