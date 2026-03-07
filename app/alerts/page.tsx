'use client'
import { useEffect, useState, useCallback } from 'react'
import type { Alert, AlertRule, AlertRuleType, CreateAlertRuleRequest } from '@/types'
import { alertApi, alertRuleApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

// ── 상수 ─────────────────────────────────────────────────────
const CARD: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: '18px',
  padding: '24px',
  boxShadow: '0 2px 12px rgba(139,127,212,0.09)',
}

const RULE_TYPE_OPTIONS: { value: AlertRuleType; label: string; desc: string }[] = [
  { value: 'SENTIMENT_SPIKE',    label: '감성 급변',     desc: '감성 점수가 급격히 변화할 때' },
  { value: 'SENTIMENT_POSITIVE', label: '긍정 변화',     desc: '감성이 긍정 방향으로 크게 변화할 때' },
  { value: 'SENTIMENT_NEGATIVE', label: '부정 변화',     desc: '감성이 부정 방향으로 크게 변화할 때' },
  { value: 'KEYWORD_DETECTED',   label: '키워드 감지',   desc: '특정 키워드가 뉴스에 등장할 때' },
  { value: 'NEWS_VOLUME_SPIKE',  label: '뉴스 급증',     desc: '단시간 뉴스량이 급격히 늘어날 때' },
]

type FilterTab = 'all' | 'unread' | 'high'
type MainTab   = 'history' | 'settings'

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
    SENTIMENT_SPIKE:    '감성 급변',
    SENTIMENT_POSITIVE: '긍정 변화',
    SENTIMENT_NEGATIVE: '부정 변화',
    KEYWORD_DETECTED:   '키워드 감지',
    NEWS_VOLUME_SPIKE:  '뉴스 급증',
  }
  return map[type] ?? type
}

function severityConfig(severity: string) {
  switch (severity) {
    case 'CRITICAL': return { color: '#ef4444', bg: '#fff1f1', label: '긴급', icon: '🔴' }
    case 'WARNING':  return { color: '#f97316', bg: '#fff7ed', label: '주의', icon: '🟡' }
    default:         return { color: '#22c55e', bg: '#f0fdf4', label: '정보', icon: '🟢' }
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
        <div style={{ width: 4, background: sev.color, flexShrink: 0 }} />
        <div className="flex-1 px-4 py-4">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-xs">{sev.icon}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: '#f0eefb', color: '#8b7fd4' }}>
              {alert.ticker}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: sev.bg, color: sev.color }}>
              {translateAlertType(alert.alertType)}
            </span>
            {!alert.isRead && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full ml-auto" style={{ background: '#f0eefb', color: '#8b7fd4' }}>
                NEW
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed" style={{ color: alert.isRead ? '#9e9ab8' : '#18162a' }}>
            {alert.message}
          </p>
          <p className="text-xs mt-2" style={{ color: '#c4c0d8' }}>
            {timeAgo(alert.createdAt)}
            {!alert.isRead && <span className="ml-2" style={{ color: '#8b7fd4' }}>클릭하면 읽음 처리</span>}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── 탭 버튼 ──────────────────────────────────────────────────
function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
      style={{ background: active ? '#8b7fd4' : 'transparent', color: active ? '#fff' : '#9e9ab8', fontWeight: active ? 600 : 400 }}
    >
      {children}
    </button>
  )
}

// ── 알림 규칙 카드 ────────────────────────────────────────────
function RuleCard({ rule, onToggle, onDelete }: {
  rule: AlertRule
  onToggle: (id: number, enabled: boolean) => void
  onDelete: (id: number) => void
}) {
  const [deleting, setDeleting] = useState(false)
  const typeInfo = RULE_TYPE_OPTIONS.find(o => o.value === rule.type)

  const handleDelete = async () => {
    setDeleting(true)
    onDelete(rule.id)
  }

  return (
    <div
      style={{
        background: rule.isEnabled ? '#ffffff' : '#f8f7fd',
        borderRadius: '14px',
        border: `1.5px solid ${rule.isEnabled ? '#d4cff2' : '#e8e6f4'}`,
        padding: '16px 18px',
        opacity: rule.isEnabled ? 1 : 0.65,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: '#f0eefb', color: '#8b7fd4' }}>
              {rule.ticker}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#f0eefb', color: '#6a5fc4' }}>
              {typeInfo?.label ?? rule.type}
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: '#9e9ab8' }}>
            {rule.type === 'KEYWORD_DETECTED' && rule.keywords.length > 0
              ? `키워드: ${rule.keywords.join(', ')}`
              : rule.type === 'NEWS_VOLUME_SPIKE'
              ? `볼륨 임계값: ${rule.volumeThreshold}개`
              : `임계값: ${(rule.sentimentChangeThreshold * 100).toFixed(0)}% | ${rule.timeWindowHours}시간`
            }
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* 토글 스위치 */}
          <button
            onClick={() => onToggle(rule.id, !rule.isEnabled)}
            className="relative rounded-full transition-colors"
            style={{
              width: 36, height: 20,
              background: rule.isEnabled ? '#8b7fd4' : '#d4cff2',
            }}
            title={rule.isEnabled ? '비활성화' : '활성화'}
          >
            <span
              className="absolute top-0.5 rounded-full transition-transform"
              style={{
                width: 16, height: 16,
                background: '#fff',
                left: 2,
                transform: rule.isEnabled ? 'translateX(16px)' : 'translateX(0)',
              }}
            />
          </button>
          {/* 삭제 버튼 */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs px-2 py-1 rounded-lg transition-all disabled:opacity-40"
            style={{ background: '#fff1f1', color: '#ef4444' }}
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 알림 규칙 추가 폼 ─────────────────────────────────────────
function AddRuleForm({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen]         = useState(false)
  const [ticker, setTicker]     = useState('')
  const [type, setType]         = useState<AlertRuleType>('SENTIMENT_SPIKE')
  const [threshold, setThreshold] = useState(30)
  const [hours, setHours]       = useState(24)
  const [keywords, setKeywords] = useState('')
  const [volume, setVolume]     = useState(10)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!ticker.trim()) { setError('티커를 입력하세요.'); return }
    setSaving(true); setError(null)
    try {
      const req: CreateAlertRuleRequest = {
        ticker: ticker.trim().toUpperCase(),
        type,
        sentimentChangeThreshold: threshold / 100,
        timeWindowHours: hours,
        volumeThreshold: volume,
        keywords: type === 'KEYWORD_DETECTED'
          ? keywords.split(',').map(k => k.trim()).filter(Boolean)
          : undefined,
      }
      await alertRuleApi.createRule(req)
      setOpen(false)
      setTicker('')
      setKeywords('')
      onAdded()
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패')
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 rounded-2xl text-sm font-semibold transition-all"
        style={{ background: '#f0eefb', color: '#8b7fd4', border: '1.5px dashed #d4cff2' }}
      >
        + 새 알림 규칙 추가
      </button>
    )
  }

  return (
    <div style={{ ...CARD, border: '1.5px solid #d4cff2' }}>
      <p className="font-semibold text-sm mb-4" style={{ color: '#18162a' }}>새 알림 규칙</p>

      {/* 티커 */}
      <div className="mb-3">
        <label className="block text-xs font-medium mb-1" style={{ color: '#5e5a78' }}>종목 티커</label>
        <input
          value={ticker}
          onChange={e => setTicker(e.target.value.toUpperCase())}
          placeholder="AAPL, TSLA ..."
          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: '#f8f7fd', border: '1.5px solid #e0dcf5', color: '#18162a' }}
          maxLength={10}
        />
      </div>

      {/* 유형 */}
      <div className="mb-3">
        <label className="block text-xs font-medium mb-1" style={{ color: '#5e5a78' }}>알림 유형</label>
        <div className="grid grid-cols-1 gap-1.5">
          {RULE_TYPE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setType(opt.value)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs transition-all"
              style={{
                background: type === opt.value ? '#f0eefb' : '#f8f7fd',
                border: `1.5px solid ${type === opt.value ? '#8b7fd4' : 'transparent'}`,
                color: type === opt.value ? '#8b7fd4' : '#5e5a78',
              }}
            >
              <span className="font-semibold">{opt.label}</span>
              <span style={{ color: '#9e9ab8' }}>— {opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 유형별 추가 설정 */}
      {type === 'KEYWORD_DETECTED' ? (
        <div className="mb-3">
          <label className="block text-xs font-medium mb-1" style={{ color: '#5e5a78' }}>키워드 (쉼표로 구분)</label>
          <input
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
            placeholder="earnings, revenue, lawsuit ..."
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: '#f8f7fd', border: '1.5px solid #e0dcf5', color: '#18162a' }}
          />
        </div>
      ) : type === 'NEWS_VOLUME_SPIKE' ? (
        <div className="mb-3">
          <label className="block text-xs font-medium mb-1" style={{ color: '#5e5a78' }}>
            뉴스 볼륨 임계값: <strong>{volume}개</strong>
          </label>
          <input
            type="range" min={3} max={50} value={volume}
            onChange={e => setVolume(Number(e.target.value))}
            className="w-full accent-purple-500"
          />
          <div className="flex justify-between text-xs mt-0.5" style={{ color: '#c4c0d8' }}>
            <span>3개</span><span>50개</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#5e5a78' }}>
              감성 변화 임계값: <strong>{threshold}%</strong>
            </label>
            <input
              type="range" min={10} max={80} step={5} value={threshold}
              onChange={e => setThreshold(Number(e.target.value))}
              className="w-full accent-purple-500"
            />
            <div className="flex justify-between text-xs mt-0.5" style={{ color: '#c4c0d8' }}>
              <span>10%</span><span>80%</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#5e5a78' }}>
              시간 윈도우: <strong>{hours}시간</strong>
            </label>
            <input
              type="range" min={1} max={72} step={1} value={hours}
              onChange={e => setHours(Number(e.target.value))}
              className="w-full accent-purple-500"
            />
            <div className="flex justify-between text-xs mt-0.5" style={{ color: '#c4c0d8' }}>
              <span>1h</span><span>72h</span>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-xs mb-3" style={{ color: '#ef4444' }}>{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={() => { setOpen(false); setError(null) }}
          className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ background: '#f3f1fa', color: '#9e9ab8' }}
        >
          취소
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
          style={{ background: '#8b7fd4', color: '#fff' }}
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  )
}

// ── 알림 설정 탭 ─────────────────────────────────────────────
function AlertSettingsTab() {
  const [rules, setRules]     = useState<AlertRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetchRules = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const data = await alertRuleApi.getRules()
      setRules(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : '알림 규칙을 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRules() }, [fetchRules])

  const handleToggle = async (id: number, enabled: boolean) => {
    try {
      await alertRuleApi.toggleRule(id, enabled)
      setRules(prev => prev.map(r => r.id === id ? { ...r, isEnabled: enabled } : r))
    } catch { /* silent */ }
  }

  const handleDelete = async (id: number) => {
    try {
      await alertRuleApi.deleteRule(id)
      setRules(prev => prev.filter(r => r.id !== id))
    } catch { /* silent */ }
  }

  return (
    <div className="space-y-3">
      <AddRuleForm onAdded={fetchRules} />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl" style={{ height: 72, background: '#f3f1fa' }} />
          ))}
        </div>
      ) : error ? (
        <div style={{ ...CARD, textAlign: 'center', paddingTop: 32, paddingBottom: 32 }}>
          <p style={{ color: '#f43f5e' }}>{error}</p>
          <button onClick={fetchRules} className="mt-3 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#8b7fd4' }}>
            재시도
          </button>
        </div>
      ) : rules.length === 0 ? (
        <div style={{ ...CARD, textAlign: 'center', paddingTop: 36, paddingBottom: 36 }}>
          <p className="text-3xl mb-2">🔕</p>
          <p className="font-medium text-sm" style={{ color: '#5e5a78' }}>등록된 알림 규칙이 없습니다.</p>
          <p className="text-xs mt-1" style={{ color: '#9e9ab8' }}>위에서 새 규칙을 추가해 보세요.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map(rule => (
            <RuleCard key={rule.id} rule={rule} onToggle={handleToggle} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── 메인 페이지 ──────────────────────────────────────────────
export default function AlertsPage() {
  const { isAuthenticated } = useAuth()
  const [mainTab, setMainTab]         = useState<MainTab>('history')
  const [alerts, setAlerts]           = useState<Alert[]>([])
  const [filtered, setFiltered]       = useState<Alert[]>([])
  const [activeTab, setActiveTab]     = useState<FilterTab>('all')
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [markingAll, setMarkingAll]   = useState(false)

  const fetchAlerts = useCallback(async () => {
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
  }, [activeTab])

  const applyFilter = (all: Alert[], tab: FilterTab) => {
    if (tab === 'unread') setFiltered(all.filter(a => !a.isRead))
    else if (tab === 'high') setFiltered(all.filter(a => a.severity === 'CRITICAL'))
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
      await alertApi.markAllAsRead()
      const updated = alerts.map(a => ({ ...a, isRead: true }))
      setAlerts(updated)
      applyFilter(updated, activeTab)
    } catch { /* silent */ } finally {
      setMarkingAll(false)
    }
  }

  useEffect(() => { fetchAlerts() }, [])

  const unreadCount = alerts.filter(a => !a.isRead).length
  const highCount   = alerts.filter(a => a.severity === 'CRITICAL').length

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
            {unreadCount > 0 && mainTab === 'history' && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#ef4444', color: '#fff' }}>
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && mainTab === 'history' && (
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

      {/* ── 메인 탭 ──────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-5">
        <div className="flex gap-1 p-1 rounded-2xl mb-5" style={{ background: '#eceaf8' }}>
          {([
            { key: 'history',  label: '알림 내역' },
            { key: 'settings', label: '알림 설정' },
          ] as { key: MainTab; label: string }[]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setMainTab(tab.key)}
              className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: mainTab === tab.key ? '#ffffff' : 'transparent',
                color: mainTab === tab.key ? '#8b7fd4' : '#9e9ab8',
                boxShadow: mainTab === tab.key ? '0 1px 4px rgba(139,127,212,0.15)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 메인 컨텐츠 ──────────────────────────────────── */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pb-10 space-y-5">

        {mainTab === 'history' ? (
          <>
            {/* 서브 필터 탭 */}
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

            {/* 심각도 요약 */}
            {!loading && alerts.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'CRITICAL', ...severityConfig('CRITICAL') },
                  { key: 'WARNING',  ...severityConfig('WARNING')  },
                  { key: 'INFO',     ...severityConfig('INFO')     },
                ].map(s => (
                  <div
                    key={s.key}
                    onClick={() => handleTabChange(s.key === 'CRITICAL' ? 'high' : 'all')}
                    className="cursor-pointer text-center transition-all hover:shadow-md"
                    style={{ background: '#ffffff', borderRadius: '14px', padding: '14px', border: `1.5px solid ${s.color}22`, boxShadow: '0 2px 8px rgba(139,127,212,0.07)' }}
                  >
                    <p className="text-xl mb-1">{s.icon}</p>
                    <p className="text-xl font-bold" style={{ color: '#18162a' }}>
                      {alerts.filter(a => a.severity === s.key).length}
                    </p>
                    <p className="text-xs mt-0.5 font-semibold" style={{ color: s.color }}>{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* 알림 목록 */}
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-2xl" style={{ height: 96, background: '#f3f1fa' }} />
                ))}
              </div>
            ) : error ? (
              <div style={{ ...CARD, textAlign: 'center', paddingTop: 48, paddingBottom: 48 }}>
                <p className="text-2xl mb-3">⚠️</p>
                <p className="font-medium" style={{ color: '#f43f5e' }}>{error}</p>
                <button onClick={fetchAlerts} className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#8b7fd4' }}>
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
          </>
        ) : (
          /* 알림 설정 탭 */
          isAuthenticated
            ? <AlertSettingsTab />
            : (
              <div style={{ ...CARD, textAlign: 'center', paddingTop: 48, paddingBottom: 48 }}>
                <p className="text-4xl mb-3">🔐</p>
                <p className="font-medium" style={{ color: '#5e5a78' }}>알림 설정은 로그인 후 이용 가능합니다.</p>
              </div>
            )
        )}
      </main>
    </div>
  )
}
