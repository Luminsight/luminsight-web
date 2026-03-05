import { Suspense } from 'react'
import AuthCallbackContent from './AuthCallbackContent'

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackLoader />}>
      <AuthCallbackContent />
    </Suspense>
  )
}

function CallbackLoader() {
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
