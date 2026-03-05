'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

/**
 * OAuth2 콜백 페이지
 *
 * 백엔드가 로그인 성공 후 /auth/callback?token=... 으로 리다이렉트합니다.
 * 이 페이지에서 JWT를 저장하고 메인 페이지로 이동합니다.
 */
export default function AuthCallbackPage() {
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
          className="inline-block w-10 h-10 rounded-full border-4 border-t-transparent animate-spin mb-4"
          style={{ borderColor: '#8b7fd4', borderTopColor: 'transparent' }}
        />
        <p style={{ color: '#18162a', fontWeight: 600 }}>로그인 처리 중...</p>
      </div>
    </div>
  )
}
