'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

/**
 * OAuth2 콜백 내용 컴포넌트
 * useSearchParams()는 반드시 Suspense 경계 안에서 사용해야 함 (Next.js 14+)
 */
export default function AuthCallbackContent() {
  const { setTokenAndFetchUser } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const processed = useRef(false)

  useEffect(() => {
    if (processed.current) return
    processed.current = true

    const token = searchParams.get('token')
    if (!token) {
      router.replace('/login?error=no_token')
      return
    }

    setTokenAndFetchUser(token)
      .then(() => router.replace('/'))
      .catch(() => router.replace('/login?error=auth_failed'))
  }, [searchParams, setTokenAndFetchUser, router])

  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{ background: '#f5f4fa' }}
    >
      <div className="text-center">
        <div
          className="inline-block w-10 h-10 rounded-full border-4 animate-spin mb-4"
          style={{ borderColor: '#8b7fd4', borderTopColor: 'transparent' }}
        />
        <p style={{ color: '#18162a', fontWeight: 600 }}>로그인 처리 중...</p>
      </div>
    </div>
  )
}
