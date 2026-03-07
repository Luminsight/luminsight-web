'use client'
import { useEffect, useState } from 'react'
import type { Alert } from '@/types'
import { alertApi } from '@/lib/api'

// ── 상수 ─────────────────────────────────────────────────────
const CARD: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: '18px',
  padding: '24px',
  boxShadow: '0 2px 12px rgba(139,127,212,0.09)',
}

type FilterTab = 'all' | 'unread' | 'high'

// ── 유틸 ─────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금 전'
  if (mins < 60) return `${mins}분 전`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}시간 전`
  if (hrs < 168) return `${Math.floor(hrs / 24)}일 전`
  return new Date(dateStr).toLocaleDateString('ko-KR')
}

function translateAlertType(type: string): string {
  const map: Record<string, string> = {
    RSI_OVERBOUGHT:          'RSI 과매수',
    RSI_OVERSOLD:            'RSI 과매도',
    MACD_CROSS:              'MACD 크로스',
    MACD_GOLDEN:             'MACD 골든크로스',
    MACD_DEAD:               'MACD 데드크로스',
    SENTIMENT_SPIKE:         '감성 급등',
    SENTIMENT_CRASH:         '감성 급락',
    SENTIMENT_CHANGE:        '감성 변화',
    KEYWORD_DETECTED:        '키워드 감지',
    PRICE_BREAKOUT:          '가격 돌파',
    PRICE_BREAKDOWN:         '가격 붕괴',
    BOLLINGER_BREAK_UPPER:   '볼린저 상단 돌파',
    BOLLINGER_BREAK_LOWER:   '볼린저 하단 이탈',
  }
  return map[type] ?? type
}

function severityConfig(severity: string) {
  switch (severity) {
    case 'HIGH':   return { color: '#ef4444', bg: '#fff1f1', label: '높음', icon: '🔴' }
    case 'MEDIUM': return { color: '#f97316', bg: '#fff7ed', label: '중간', icon: '🟡' }
    case 'LOW':    return { color: '#22c55e', bg: '#f0fdf4', label: '낮음', icon: '🟢' }
    default:       return { color: '#8b8fa8', bg: '#f3f4f6', label: '정보', icon: '⚪' }
  }
}

// ── 알림 카드 ─────────────────────────────────────────────────
function AlertCard({ alert, onMarkRead }: { alert: Alert; onMarkRead: (id: number) => void }) {
  const sev = severityConfig(alert.severity)

  return (
    <div
      onClick={() => !alert.isRead && onMarkRead(alert.id)}
      className="transition-all duration-150 cursor-pointer"
      style={{
        background: alert.isRead ? '#ffffff' : '#faf9fe',
        borderRadius: '14px',
        border: `1.5px solid ${alert.isRead ? '#ece9f5' : sev.color + '30'}`,
        boxShadow: alert.isRead ? '0 1px 4px rgba(139,127,212,0.06)' : '0 2px 12px rgba(139,127,212,0.1)',
        overflow: 'hidden',
      }}
    >
      <div className="flex">
        {/* 좌측 컬러 바 */}
        <div style={{ width: 4, background: sev.color, flexShrink: 0 }} />

        <div className="flex-1 px-4 py-4">
          {/* 헤더 */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-xs" title={alert.severity}>{sev.icon}</span>

            <span
              className="text-xs font-bold px-2 py-0.5 rounded-lg"
              style={{ background: '#f0eefb', color: '#8b7fd4' }}
            >
              {alert.ticker}
            </span>

            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: sev.bg, color: sev.color }}
            >
              {translateAlertType(alert.alertType)}
            </span>

            {!alert.isRead && (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full ml-auto"
                style={{ background: '#f0eefb', color: '#8b7fd4' }}
              >
                NEW
              </span>
            )}
          </div>

          {/* 메시지 */}
          <p
            className="text-sm leading-relaxed"
            style={{ color: alert.isRead ? '#9e9ab8' : '#18162a' }}
          >
            {alert.message}
          </p>

          {/* 시간 */}
          <p className="text-xs mt-2" style={{ color: '#c4c0d8' }}>
            {timeAgo(alert.createdAt)}
            {!alert.isRead && (
              <span className="ml-2" style={{ color: '#8b7fd4' }}>클릭하면 읽음 처리</span>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── 탭 버튼 ──────────────────────────────────────────────────
function TabBtn({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
      style={{
        background: active ? '#8b7fd4' : 'transparent',
        color:      active ? '#fff' : '#9e9ab8',
        fontWeight: active ? 600 : 400,
      }}
    >
      {children}
    </button>
  )
}

// ── 메인 페이지 ──────────────────────────────────────────────
export default function AlertsPage() {
  const [alerts, setAlerts]           = useState<Alert[]>([])
  const [filtered, setFiltered]       = useState<Alert[]>([])
  const [activeTab, setActiveTab]     = useState<FilterTab>('all')
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [markingAll, setMarkingAll]   = useState(false)

  const fetchAlerts = async () => {
    setLoading(true); setError(null)
    try {
      const data = await alertApi.getAlerts()
      setAlerts(data)
      applyFilter(data, activeTab)
    } catch (e) {
      setError(e instanceof Error ? e.message : '알림을 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  const applyFilter = (all: Alert[], tab: FilterTab) => {
    if (tab === 'unread') setFiltered(all.filter(a => !a.isRead))
    else if (tab === 'high') setFiltered(all.filter(a => a.severity === 'HIGH'))
    else setFiltered(all)
  }

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab)
    applyFilter(alerts, tab)
  }

  const handleMarkRead = async (id: number) => {
    try {
      await alertApi.markAsRead(id)
      const updated = alerts.map(a => a.id === id ? { ...a, isRead: true } : a)
      setAlerts(updated)
      applyFilter(updated, activeTab)
    } catch { /* silent */ }
  }

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      await Promise.all(
        alerts.filter(a => !a.isRead).map(a => alertApi.markAsRead(a.id))
      )
      const updated = alerts.map(a => ({ ...a, isRead: true }))
      setAlerts(updated)
      applyFilter(updated, activeTab)
    } catch { /* silent */ } finally {
      setMarkingAll(false)
    }
  }

  useEffect(() => { fetchAlerts() }, [])

  const unreadCount = alerts.filter(a => !a.isRead).length
  const highCount   = alerts.filter(a => a.severity === 'HIGH').length

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4fa' }}>

      {/* ── 헤더 ──────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30 px-6 py-3"
        style={{ background: '#ffffff', borderBottom: '1px solid #ece9f5', boxShadow: '0 1px 6px rgba(139,127,212,0.06)' }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="font-bold text-base" style={{ color: '#18162a' }}>🔔 알림</p>
            {unreadCount > 0 && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: '#ef4444', color: '#fff' }}
              >
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="text-xs font-medium px-3 py-1.5 rounded-xl transition-all disabled:opacity-50"
              style={{ background: '#f0eefb', color: '#8b7fd4', border: '1.5px solid #d4cff2' }}
            >
              {markingAll ? '처리 중...' : '전체 읽음'}
            </button>
          )}
        </div>
      </header>

      {/* ── 메인 ──────────────────────────────────────────── */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* 탭 + 통계 */}
        <div style={{ ...CARD, padding: '6px 8px', display: 'inline-flex', gap: '2px' }}>
          <TabBtn active={activeTab === 'all'}    onClick={() => handleTabChange('all')}>
            전체 ({alerts.length})
          </TabBtn>
          <TabBtn active={activeTab === 'unread'} onClick={() => handleTabChange('unread')}>
            미읽음 {unreadCount > 0 && `(${unreadCount})`}
          </TabBtn>
          <TabBtn active={activeTab === 'high'}   onClick={() => handleTabChange('high')}>
            🔴 긴급 {highCount > 0 && `(${highCount})`}
          </TabBtn>
        </div>

        {/* 심각도 요약 카드 */}
        {!loading && alerts.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'HIGH',   ...severityConfig('HIGH') },
              { key: 'MEDIUM', ...severityConfig('MEDIUM') },
              { key: 'LOW',    ...severityConfig('LOW') },
            ].map(s => (
              <div
                key={s.key}
                onClick={() => handleTabChange(s.key === 'HIGH' ? 'high' : 'all')}
                className="cursor-pointer text-center transition-all hover:shadow-md"
                style={{
                  background: '#ffffff',
                  borderRadius: '14px',
                  padding: '14px',
                  border: `1.5px solid ${s.color}22`,
                  boxShadow: '0 2px 8px rgba(139,127,212,0.07)',
                }}
              >
                <p className="text-xl mb-1">{s.icon}</p>
                <p className="text-xl font-bold" style={{ color: '#18162a' }}>
                  {alerts.filter(a => a.severity === s.key).length}
                </p>
                <p className="text-xs mt-0.5" style={{ color: s.color, fontWeight: 600 }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* 알림 목록 */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl"
                style={{ height: 96, background: '#f3f1fa' }} />
            ))}
          </div>
        ) : error ? (
          <div style={{ ...CARD, textAlign: 'center', paddingTop: 48, paddingBottom: 48 }}>
            <p className="text-2xl mb-3">⚠️</p>
            <p className="font-medium" style={{ color: '#f43f5e' }}>{error}</p>
            <button
              onClick={fetchAlerts}
              className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: '#8b7fd4' }}
            >
              재시도
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ ...CARD, textAlign: 'center', paddingTop: 48, paddingBottom: 48 }}>
            <p className="text-4xl mb-3">🔔</p>
            <p className="font-medium" style={{ color: '#5e5a78' }}>
              {activeTab === 'unread' ? '읽지 않은 알림이 없습니다.' :
               activeTab === 'high'   ? '긴급 알림이 없습니다.' :
               '알림이 없습니다.'}
            </p>
            <p className="text-sm mt-1" style={{ color: '#9e9ab8' }}>
              감성 급변이나 키워드 감지 시 알림이 생성됩니다.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(alert => (
              <AlertCard key={alert.id} alert={alert} onMarkRead={handleMarkRead} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
