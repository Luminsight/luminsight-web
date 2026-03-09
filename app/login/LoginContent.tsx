'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

/**
 * 로그인 페이지 내용 컴포넌트
 * useSearchParams()는 반드시 Suspense 경계 안에서 사용해야 함 (Next.js 14+)
 */
export default function LoginContent() {
  const { isAuthenticated, isLoading, login, loginWithKakao } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/')
    }
  }, [isLoading, isAuthenticated, router])

  const errorMessage = error === 'no_token'
    ? '로그인 처리 중 문제가 발생했습니다.'
    : error === 'auth_failed'
    ? '인증에 실패했습니다. 다시 시도해 주세요.'
    : null

  if (isLoading) return null

  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{ background: '#f5f4fa' }}
    >
      <div
        className="w-full max-w-sm p-8 rounded-2xl"
        style={{
          background: '#fff',
          boxShadow: '0 4px 24px rgba(139,127,212,0.12)',
        }}
      >
        {/* 로고 */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: 'rgba(139,127,212,0.12)' }}
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="10" stroke="#8b7fd4" strokeWidth="2.5" />
              <path d="M9 14 L12.5 17.5 L19 10" stroke="#8b7fd4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#18162a' }}>LuminSight</h1>
          <p className="text-sm mt-1" style={{ color: '#8b85a1' }}>AI 주식 감성 분석 대시보드</p>
        </div>

        {/* 에러 메시지 */}
        {errorMessage && (
          <div
            className="mb-4 px-4 py-3 rounded-xl text-sm text-center"
            style={{ background: '#fff0f0', color: '#e05c5c' }}
          >
            {errorMessage}
          </div>
        )}

        {/* Google 로그인 버튼 */}
        <button
          onClick={login}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all"
          style={{
            background: '#fff',
            border: '1.5px solid #e8e4f5',
            color: '#18162a',
            fontSize: '15px',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#f5f4fa')}
          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v8.51h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.14z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.49-1.47-.76-3.04-.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          </svg>
          Google로 계속하기
        </button>

        {/* Kakao 로그인 버튼 */}
        <button
          onClick={loginWithKakao}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all mt-3"
          style={{
            background: '#FEE500',
            border: 'none',
            color: '#191919',
            fontSize: '15px',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#F0D900')}
          onMouseLeave={e => (e.currentTarget.style.background = '#FEE500')}
        >
          {/* 카카오 공식 로고 SVG */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3C6.477 3 2 6.477 2 10.5c0 2.563 1.523 4.822 3.84 6.22-.169.633-.613 2.296-.7 2.655-.109.449.163.44.345.32.142-.094 2.26-1.535 3.175-2.16.42.059.852.09 1.34.09 5.523 0 10-3.477 10-7.5S17.523 3 12 3z"
              fill="#191919"
            />
          </svg>
          카카오로 계속하기
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px" style={{ background: '#f0ecfb' }} />
          <span className="text-xs" style={{ color: '#c4c0d8' }}>또는</span>
          <div className="flex-1 h-px" style={{ background: '#f0ecfb' }} />
        </div>

        <p className="text-xs text-center" style={{ color: '#b0accc' }}>
          비회원으로{' '}
          <a href="/stock/AAPL" style={{ color: '#8b7fd4', textDecoration: 'underline' }}>
            주식 정보 둘러보기
          </a>
        </p>

        <p className="text-xs text-center mt-6" style={{ color: '#c4c0d8' }}>
          로그인 시{' '}
          <a href="/terms" style={{ color: '#9e9ab8', textDecoration: 'underline' }}>이용약관</a>
          {' '}및{' '}
          <a href="/privacy" style={{ color: '#9e9ab8', textDecoration: 'underline' }}>개인정보처리방침</a>
          에 동의하게 됩니다.
        </p>
      </div>
    </div>
  )
}
