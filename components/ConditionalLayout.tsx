'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import DisclaimerModal from './DisclaimerModal'

// 사이드바/푸터를 표시하지 않을 경로
const AUTH_PATHS = ['/login', '/auth', '/terms', '/privacy']

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = AUTH_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))

  // 로그인 / 콜백 / 약관 페이지 → 사이드바 없이 풀스크린
  if (isAuthPage) {
    return <>{children}</>
  }

  // 일반 페이지 → 사이드바 + 푸터 포함
  return (
    <>
      <DisclaimerModal />
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 lg:ml-[260px] flex flex-col">
          <div className="flex-1">
            {children}
          </div>
          <footer
            className="px-6 py-4 text-center"
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
    </>
  )
}
