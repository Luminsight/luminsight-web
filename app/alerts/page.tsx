'use client'

import { useEffect, useState } from 'react'
import type { Alert } from '@/types'
import { alertApi } from '@/lib/api'

type FilterTab = 'all' | 'unread' | 'high'

// 상대 시간 포맷터 (예: "3분 전", "2시간 전")
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (secondsAgo < 60) return '방금 전'
  if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}분 전`
  if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}시간 전`
  if (secondsAgo < 604800) return `${Math.floor(secondsAgo / 86400)}일 전`
  return date.toLocaleDateString('ko-KR')
}

// alertType을 한국어로 변환
function translateAlertType(alertType: string): string {
  const typeMap: Record<string, string> = {
    'RSI_OVERBOUGHT': 'RSI 과매수',
    'RSI_OVERSOLD': 'RSI 과매도',
    'MACD_CROSS': 'MACD 크로스',
    'MACD_GOLDEN': 'MACD 골든크로스',
    'MACD_DEAD': 'MACD 데드크로스',
    'SENTIMENT_SPIKE': '감성 급등',
    'SENTIMENT_CRASH': '감성 급락',
    'PRICE_BREAKOUT': '가격 돌파',
    'PRICE_BREAKDOWN': '가격 붕괴',
    'BOLLINGER_BREAK_UPPER': '볼린저밴드 상단 돌파',
    'BOLLINGER_BREAK_LOWER': '볼린저밴드 하단 돌파',
  }
  return typeMap[alertType] || alertType
}

// Severity에 따른 왼쪽 바 색상
function getColorByServerity(severity: string): string {
  switch (severity) {
    case 'HIGH':
      return '#ef4444' // red-500
    case 'MEDIUM':
      return '#f97316' // orange-500
    case 'LOW':
      return '#22c55e' // green-500
    default:
      return '#94a3b8' // slate-400
  }
}

// 스켈레톤 로딩 컴포넌트
function SkeletonLoader() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-24 bg-gray-200 rounded-2xl animate-pulse"
        />
      ))}
    </div>
  )
}

// 빈 상태 UI
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">🔔</div>
      <p className="text-gray-600 text-lg">알림이 없습니다</p>
      <p className="text-gray-400 text-sm mt-2">새로운 알림이 생기면 여기 표시됩니다</p>
    </div>
  )
}

// 에러 상태 UI
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center bg-red-50 rounded-2xl border border-red-200">
      <div className="text-4xl mb-4">⚠️</div>
      <p className="text-red-600 text-lg mb-4">알림을 불러올 수 없습니다</p>
      <button
        onClick={onRetry}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        재시도
      </button>
    </div>
  )
}

// 알림 카드 컴포넌트
function AlertCard({
  alert,
  onMarkAsRead,
}: {
  alert: Alert
  onMarkAsRead: (id: number) => void
}) {
  const barColor = getColorByServerity(alert.severity)
  const bgColor = alert.isRead ? '#ffffff' : '#faf9fe'
  const textOpacity = alert.isRead ? 'text-gray-500' : 'text-gray-900'

  return (
    <div
      onClick={() => !alert.isRead && onMarkAsRead(alert.id)}
      className="flex gap-4 p-5 rounded-2xl cursor-pointer transition-all hover:shadow-lg"
      style={{
        backgroundColor: bgColor,
        boxShadow: '0 2px 12px rgba(139, 127, 212, 0.08)',
      }}
    >
      {/* 왼쪽 컬러 바 */}
      <div
        className="w-1 rounded-full flex-shrink-0"
        style={{ backgroundColor: barColor }}
      />

      {/* 콘텐츠 */}
      <div className="flex-1 min-w-0">
        {/* 헤더: 타입, 티커, 미읽음 표시 */}
        <div className="flex items-center gap-3 mb-2">
          <span className={`text-sm font-semibold ${textOpacity}`}>
            {translateAlertType(alert.alertType)}
          </span>
          <span className="px-2.5 py-1 text-xs font-medium text-white bg-purple-500 rounded-full">
            {alert.ticker}
          </span>
          {!alert.isRead && (
            <span className="text-purple-600 text-lg leading-none">●</span>
          )}
        </div>

        {/* 메시지 본문 */}
        <p className={`text-sm mb-3 leading-relaxed ${textOpacity}`}>
          {alert.message}
        </p>

        {/* 푸터: 상대 시간 */}
        <p className="text-xs text-gray-400">
          {formatRelativeTime(alert.createdAt)}
        </p>
      </div>
    </div>
  )
}

// 메인 페이지 컴포넌트
export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([])
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 초기 로드: 모든 알림 조회
  const fetchAlerts = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await alertApi.getAlerts()
      setAlerts(data)
      applyFilter(data, 'all')
    } catch (err) {
      setError(err instanceof Error ? err.message : '알림을 불러올 수 없습니다')
    } finally {
      setLoading(false)
    }
  }

  // 필터 적용
  const applyFilter = (allAlerts: Alert[], tab: FilterTab) => {
    let result = allAlerts
    if (tab === 'unread') {
      result = allAlerts.filter((a) => !a.isRead)
    } else if (tab === 'high') {
      result = allAlerts.filter((a) => a.severity === 'HIGH')
    }
    setFilteredAlerts(result)
  }

  // 탭 변경
  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab)
    applyFilter(alerts, tab)
  }

  // 알림 읽음 처리
  const handleMarkAsRead = async (id: number) => {
    try {
      await alertApi.markAsRead(id)
      // 로컬 상태 업데이트
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isRead: true } : a))
      )
      applyFilter(
        alerts.map((a) => (a.id === id ? { ...a, isRead: true } : a)),
        activeTab
      )
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }

  // 컴포넌트 마운트 시 알림 조회
  useEffect(() => {
    fetchAlerts()
  }, [])

  // 미읽음 건수 계산
  const unreadCount = alerts.filter((a) => !a.isRead).length
  const highSeverityCount = alerts.filter((a) => a.severity === 'HIGH').length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-3xl font-bold text-gray-900">🔔 알림</h1>
          {unreadCount > 0 && (
            <span className="px-3 py-1 text-sm font-semibold text-white bg-red-500 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>

        {/* 필터 탭 */}
        <div className="flex gap-2">
          <button
            onClick={() => handleTabChange('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => handleTabChange('unread')}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
              activeTab === 'unread'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
            }`}
          >
            미읽음
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => handleTabChange('high')}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
              activeTab === 'high'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
            }`}
          >
            HIGH 긴급
            {highSeverityCount > 0 && (
              <span className="px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">
                {highSeverityCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {loading && <SkeletonLoader />}
        {error && !loading && <ErrorState onRetry={fetchAlerts} />}
        {!loading && !error && filteredAlerts.length === 0 && <EmptyState />}
        {!loading && !error && filteredAlerts.length > 0 && (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onMarkAsRead={handleMarkAsRead}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
