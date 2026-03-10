'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import DisclaimerModal from './DisclaimerModal'
import { useAuth } from '@/context/AuthContext'

// 사이드바/푸터를 표시하지 않을 경로
const AUTH_PATHS = ['/login', '/auth', '/terms', '/privacy']

// 비로그인 사용자도 접근 가능한 공개 경로 (자체 헤더/네비 포함)
const PUBLIC_PATHS = ['/stock/']

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isAuthenticated, isLoading } = useAuth()

  const isAuthPage = AUTH_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))

  // 로그인 / 콜백 / 약관 페이지 → 사이드바 없이 풀스크린
  if (isAuthPage) {
    return <>{children}</>
  }

  // 비로그인 사용자: 홈(/) 또는 공개 경로 → 사이드바 없이 렌더링
  // isLoading 중에도 사이드바를 숨겨 flash/redirect 방지
  const isPublicPath = pathname === '/' || PUBLIC_PATHS.some(p => pathname.startsWith(p))
  if ((isLoading || !isAuthenticated) && isPublicPath) {
    return <>{children}</>
  }

  // 일반 페이지 → 사이드바 + 푸터 포함
  return (
    <>
      <DisclaimerModal />
      <div className="flex min-h-screen">
        <Sidebar />
        {/* 모바일: 하단 네비 + 안전 영역 패딩 / 데스크탑: 사이드바 마진 */}
        <div className="flex-1 min-w-0 lg:ml-[260px] flex flex-col pb-[60px] lg:pb-0 overflow-x-hidden">
          <div className="flex-1 min-w-0">
            {children}
          </div>
          <footer
            className="hidden lg:block px-6 py-4 text-center"
            style={{ borderTop: '1px solid #f0ecfb', background: '#faf9fe' }}
          >
            <p className="text-xs" style={{ color: '#b0accc' }}>
              ⚠️ 본 서비스는 <b style={{ color: '#9e9ab8' }}>투자 정보 제공</b> 목적이며,
              투자 조언·매수·매도 권유가 아닙니다.
              모든 투자 결정과 손익에 대한 책임은 투자자 본인에게 있습니다.
            </p>
            <p className="text-xs mt-1" style={{ color: '#c4c0d8' }}>
              © 2026 LuminSight · 본 서비스 이용 시{' '}
              <a href="/terms" style={{ color: '#9e9ab8', textDecoration: 'underline' }}>이용약관</a>
              {' '}및{' '}
              <a href="/privacy" style={{ color: '#9e9ab8', textDecoration: 'underline' }}>개인정보처리방침</a>
              에 동의하신 것으로 간주합니다.
            </p>
          </footer>
        </div>
      </div>
      {/* 모바일 하단 탭 네비게이션 */}
      <BottomNav />
    </>
  )
}
