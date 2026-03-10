'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

// URL-safe base64 → Uint8Array (VAPID 공개키 변환)
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const outputArray = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// serviceWorker.ready 에 타임아웃 추가 — 무한 대기 방지
function swReady(timeoutMs = 8000): Promise<ServiceWorkerRegistration> {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('서비스 워커 준비 시간 초과. 앱을 새로고침 해주세요.')), timeoutMs)
    ),
  ])
}

export default function PushNotificationButton() {
  const [permission, setPermission] = useState<PermissionState>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [errorMsg, setErrorMsg]     = useState<string | null>(null)

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setPermission('unsupported')
      return
    }
    setPermission(Notification.permission as PermissionState)

    // 현재 구독 여부 확인 (타임아웃 적용)
    swReady()
      .then(async (reg) => {
        const sub = await reg.pushManager.getSubscription()
        setSubscribed(!!sub)
      })
      .catch(() => {
        // 초기 확인 실패 시 구독 상태 false 유지 (무시)
      })
  }, [])

  async function handleSubscribe() {
    if (loading) return
    setLoading(true)
    setErrorMsg(null)
    try {
      // 1) 알림 권한 요청
      const result = await Notification.requestPermission()
      setPermission(result as PermissionState)
      if (result !== 'granted') {
        setErrorMsg('알림 권한이 거부됐습니다. 브라우저/기기 설정에서 허용해주세요.')
        return
      }

      // 2) VAPID 공개키 조회
      const { data } = await api.get<{ publicKey: string }>('/push/vapid-public-key')
      const applicationServerKey = urlBase64ToUint8Array(data.publicKey)

      // 3) 서비스 워커 준비 대기 (타임아웃 8초)
      const reg = await swReady()

      // 4) 브라우저 PushSubscription 생성
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      })

      // 5) 구독 정보 백엔드 전송
      const subJson = sub.toJSON()
      await api.post('/push/subscribe', {
        endpoint:  sub.endpoint,
        p256dh:    subJson.keys?.p256dh ?? '',
        auth:      subJson.keys?.auth ?? '',
        userAgent: navigator.userAgent.slice(0, 200),
      })

      setSubscribed(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      setErrorMsg(msg)
      console.error('푸시 구독 실패:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleUnsubscribe() {
    if (loading) return
    setLoading(true)
    setErrorMsg(null)
    try {
      const reg = await swReady()
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await api.post('/push/unsubscribe', { endpoint: sub.endpoint })
        await sub.unsubscribe()
      }
      setSubscribed(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      setErrorMsg(msg)
      console.error('구독 해제 실패:', err)
    } finally {
      setLoading(false)
    }
  }

  if (permission === 'unsupported') return null

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-2 text-xs rounded-xl px-3 py-2"
        style={{ background: '#fef3c7', color: '#92400e' }}>
        <span>⚠️</span>
        <span>브라우저 설정에서 알림을 허용해주세요</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={subscribed ? handleUnsubscribe : handleSubscribe}
        disabled={loading}
        className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all"
        style={{
          background: subscribed
            ? '#f8f7fd'
            : 'linear-gradient(135deg, #8b7fd4, #6a5fc4)',
          color:   subscribed ? '#8b7fd4' : '#ffffff',
          border:  subscribed ? '1.5px solid #ece9f5' : 'none',
          opacity: loading ? 0.7 : 1,
          cursor:  loading ? 'wait' : 'pointer',
        }}
      >
        <span>{subscribed ? '🔔' : '🔕'}</span>
        <span>
          {loading
            ? '처리 중...'
            : subscribed
            ? '푸시 알림 켜짐'
            : '푸시 알림 받기'}
        </span>
      </button>

      {errorMsg && (
        <div className="flex items-start gap-2 text-xs rounded-xl px-3 py-2"
          style={{ background: '#fff1f3', color: '#f43f5e' }}>
          <span className="shrink-0">⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  )
}
