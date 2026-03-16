'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { watchlistApi, newsApi, sentimentApi, alertApi, tradingApi } from '@/lib/api'
import type { News, SentimentWeeklySummary, TradingSignal } from '@/types'
import { useAuth } from '@/context/AuthContext'
import SentimentGauge from '@/components/SentimentGauge'

// ── 상수 ──────────────────────────────────────────────────────
const CARD: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: '18px',
  padding: '24px',
  boxShadow: '0 2px 12px rgba(139,127,212,0.09)',
}

// ── 감성 유틸 ──────────────────────────────────────────────────
function sentimentColor(label: string) {
  if (label === 'POSITIVE') return '#ef4444'
  if (label === 'NEGATIVE') return '#2563eb'
  return '#8b8fa8'
}
function sentimentBg(label: string) {
  if (label === 'POSITIVE') return '#fff1f1'
  if (label === 'NEGATIVE') return '#eff6ff'
  return '#f3f4f6'
}
function sentimentLabel(label: string) {
  if (label === 'POSITIVE') return '↑ 긍정'
  if (label === 'NEGATIVE') return '↓ 부정'
  return '− 중립'
}
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금 전'
  if (mins < 60) return `${mins}분 전`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}시간 전`
  return `${Math.floor(hrs / 24)}일 전`
}

// ── 신호 유틸 ─────────────────────────────────────────────────
function signalStyle(action: string) {
  if (action === 'BUY')  return { color: '#16a34a', bg: '#f0fdf4', border: 'rgba(22,163,74,0.25)', label: '매수' }
  if (action === 'SELL') return { color: '#dc2626', bg: '#fef2f2', border: 'rgba(220,38,38,0.25)', label: '매도' }
  return { color: '#d97706', bg: '#fffbeb', border: 'rgba(217,119,6,0.25)', label: '보유' }
}

// ── 오늘 뉴스 수 계산 ──────────────────────────────────────────
function countTodayNews(news: News[]): number {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  return news.filter(n => new Date(n.publishedAt) >= todayStart).length
}

// ── 종목별 집계 유틸 ───────────────────────────────────────────
interface TickerStats {
  dominant: string
  avgScore: number
  scoreBar: number  // 0~100
  positive: number
  negative: number
  neutral: number
  total: number
  todayCount: number
  latestNews: News | null
}

function calcStats(news: News[]): TickerStats {
  const positive = news.filter(n => n.sentimentLabel === 'POSITIVE').length
  const negative = news.filter(n => n.sentimentLabel === 'NEGATIVE').length
  const neutral  = news.filter(n => n.sentimentLabel === 'NEUTRAL').length
  const total    = news.length
  const avgScore = total > 0 ? news.reduce((s, n) => s + n.sentimentScore, 0) / total : 0
  const scoreBar = Math.round((avgScore + 1) * 50)
  let dominant: string
  if (positive > negative) dominant = 'POSITIVE'
  else if (negative > positive) dominant = 'NEGATIVE'
  else dominant = 'NEUTRAL'
  const latestNews = news.length > 0
    ? news.reduce((a, b) => new Date(a.publishedAt) > new Date(b.publishedAt) ? a : b)
    : null
  return { dominant, avgScore, scoreBar, positive, negative, neutral, total, todayCount: countTodayNews(news), latestNews }
}

// ── 관심 종목 카드 ─────────────────────────────────────────────
interface WatchCardProps {
  ticker: string
  news: News[]
  newsLoading: boolean
  signal: TradingSignal | null
  weekly: SentimentWeeklySummary | null
  alertCount: number
  onNavigate: (ticker: string) => void
  onRemove: (ticker: string) => void
}

function WatchCard({ ticker, news, newsLoading, signal, weekly, alertCount, onNavigate, onRemove }: WatchCardProps) {
  const stats = calcStats(news)
  const sig = signal ? signalStyle(signal.signal) : null

  // 주간 점수 변화
  const scoreChange = weekly?.change?.scoreChange ?? null
  const hasChange = scoreChange !== null && !isNaN(scoreChange)
  const changePositive = hasChange && scoreChange! > 0

  return (
    <div
      className="group relative cursor-pointer transition-all duration-200 hover:shadow-md"
      style={{
        background: '#ffffff',
        borderRadius: '18px',
        border: '1.5px solid #ece9f5',
        boxShadow: '0 2px 8px rgba(139,127,212,0.08)',
        overflow: 'hidden',
      }}
      onClick={() => onNavigate(ticker)}
    >
      {/* 상단 액센트 바 */}
      <div style={{
        height: 3,
        background: sig
          ? `linear-gradient(to right, ${sig.color}, ${sig.color}60)`
          : `linear-gradient(to right, ${sentimentColor(stats.dominant)}, ${sentimentColor(stats.dominant)}60)`,
      }} />

      <div className="p-4">
        {/* 헤더 행: 티커 + 감성 배지 + 알림 + 삭제 */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {/* 아바타 */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background: 'linear-gradient(135deg, #8b7fd4, #6a5fc4)' }}
            >
              {ticker.slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm leading-none" style={{ color: '#18162a' }}>{ticker}</p>
              {!newsLoading && (
                <span
                  className="inline-block text-xs font-semibold px-1.5 py-0.5 rounded-full mt-1"
                  style={{ background: sentimentBg(stats.dominant), color: sentimentColor(stats.dominant) }}
                >
                  {sentimentLabel(stats.dominant)}
                </span>
              )}
            </div>
          </div>

          {/* 알림 배지 + 삭제 */}
          <div className="flex items-center gap-1.5 shrink-0">
            {alertCount > 0 && (
              <span
                className="flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)' }}
                title={`미읽은 알림 ${alertCount}건`}
              >
                🔔{alertCount > 9 ? '9+' : alertCount}
              </span>
            )}
            <button
              onClick={e => { e.stopPropagation(); onRemove(ticker) }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg"
              style={{ color: '#c4c0d8', background: '#f8f7fd' }}
              title="관심 종목 삭제"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* 신호 + 주간 변화 행 */}
        {!newsLoading && (sig || hasChange) && (
          <div className="flex items-center gap-2 mb-3">
            {sig && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-lg"
                style={{ background: sig.bg, color: sig.color, border: `1px solid ${sig.border}` }}
              >
                {sig.label} {signal?.combinedScore != null ? `${Math.round(signal.combinedScore)}점` : ''}
              </span>
            )}
            {hasChange && (
              <span
                className="text-xs font-semibold flex items-center gap-0.5"
                style={{ color: changePositive ? '#16a34a' : scoreChange! < 0 ? '#dc2626' : '#8b8fa8' }}
              >
                {changePositive ? '▲' : scoreChange! < 0 ? '▼' : '−'}
                {Math.abs(scoreChange!).toFixed(2)} <span style={{ color: '#c4c0d8', fontWeight: 400 }}>주간</span>
              </span>
            )}
            {stats.todayCount > 0 && (
              <span
                className="text-xs font-medium ml-auto px-1.5 py-0.5 rounded-md"
                style={{ background: '#f0eefb', color: '#8b7fd4' }}
              >
                오늘 {stats.todayCount}건
              </span>
            )}
          </div>
        )}

        {/* 로딩 스켈레톤 */}
        {newsLoading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-3 rounded bg-gray-100 w-3/4" />
            <div className="h-2 rounded bg-gray-100 w-full" />
            <div className="h-2 rounded bg-gray-100 w-1/2" />
          </div>
        ) : stats.total === 0 ? (
          <p className="text-xs" style={{ color: '#c4c0d8' }}>최근 뉴스 없음</p>
        ) : (
          <>
            {/* 감성 점수 게이지 */}
            <div className="mb-3">
              <SentimentGauge
                score={stats.avgScore}
                newsCount={stats.total}
                size="sm"
                showTooltip={true}
              />
            </div>

            {/* 뉴스 분포 */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs" style={{ color: '#ef4444' }}>↑{stats.positive}</span>
              <span className="text-xs" style={{ color: '#2563eb' }}>↓{stats.negative}</span>
              <span className="text-xs" style={{ color: '#8b8fa8' }}>−{stats.neutral}</span>
              <span className="text-xs ml-auto" style={{ color: '#c4c0d8' }}>총 {stats.total}건</span>
            </div>

            {/* 최신 뉴스 제목 */}
            {stats.latestNews && (
              <div
                className="rounded-xl px-3 py-2"
                style={{ background: '#f8f7fd', border: '1px solid #ece9f5' }}
              >
                <p className="text-xs truncate min-w-0" style={{ color: '#5e5a78' }}>
                  {stats.latestNews.titleKo || stats.latestNews.title}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#c4c0d8' }}>
                  {timeAgo(stats.latestNews.publishedAt)}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── 티커 추가 입력 ─────────────────────────────────────────────
function AddTickerBar({ onAdd, disabled }: { onAdd: (ticker: string) => void; disabled?: boolean }) {
  const [value, setValue] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const v = value.trim().toUpperCase()
    if (v) { onAdd(v); setValue('') }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14"
          viewBox="0 0 24 24" fill="none" stroke="#9e9ab8" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          value={value}
          onChange={e => setValue(e.target.value.toUpperCase())}
          placeholder="티커 추가 (예: AAPL)"
          maxLength={10}
          disabled={disabled}
          className="w-full pl-8 pr-3 py-2.5 text-sm rounded-xl outline-none transition-all disabled:opacity-50"
          style={{ background: '#f8f7fd', border: '1.5px solid #ece9f5', color: '#18162a' }}
          onFocus={e => (e.target.style.borderColor = '#8b7fd4')}
          onBlur={e  => (e.target.style.borderColor = '#ece9f5')}
        />
      </div>
      <button
        type="submit"
        disabled={!value.trim() || disabled}
        className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
        style={{ background: 'linear-gradient(135deg, #8b7fd4, #6a5fc4)', flexShrink: 0 }}
      >
        추가
      </button>
    </form>
  )
}

// ── 메인 페이지 ───────────────────────────────────────────────
export default function WatchlistPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  const [watchlist, setWatchlist]   = useState<string[]>([])
  const [newsMap, setNewsMap]       = useState<Record<string, News[]>>({})
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({})
  const [signalMap, setSignalMap]   = useState<Record<string, TradingSignal | null>>({})
  const [weeklyMap, setWeeklyMap]   = useState<Record<string, SentimentWeeklySummary | null>>({})
  const [alertCountMap, setAlertCountMap] = useState<Record<string, number>>({})
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [adding, setAdding]         = useState(false)
  const [addError, setAddError]     = useState<string | null>(null)

  // ── 관심 종목 로드 ────────────────────────────────────────
  const fetchWatchlist = useCallback(async () => {
    if (!isAuthenticated) { setPageLoading(false); return }
    try {
      const tickers = await watchlistApi.getWatchlist()
      setWatchlist(tickers)
    } catch {
      setError('관심 종목을 불러올 수 없습니다.')
    } finally {
      setPageLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!authLoading) fetchWatchlist()
  }, [authLoading, fetchWatchlist])

  // ── 종목별 뉴스 로드 ──────────────────────────────────────
  useEffect(() => {
    watchlist.forEach(ticker => {
      if (newsMap[ticker] !== undefined) return
      setLoadingMap(prev => ({ ...prev, [ticker]: true }))
      newsApi.getNewsByTicker(ticker, 20)
        .then(data => setNewsMap(prev => ({ ...prev, [ticker]: data })))
        .catch(() => setNewsMap(prev => ({ ...prev, [ticker]: [] })))
        .finally(() => setLoadingMap(prev => ({ ...prev, [ticker]: false })))
    })
  }, [watchlist])  // newsMap 제외: 무한루프 방지

  // ── 종목별 신호 / 주간 요약 / 알림 로드 ──────────────────
  useEffect(() => {
    watchlist.forEach(ticker => {
      // 매매 신호
      if (signalMap[ticker] === undefined) {
        tradingApi.getSignal(ticker)
          .then(sig => setSignalMap(prev => ({ ...prev, [ticker]: sig })))
          .catch(() => setSignalMap(prev => ({ ...prev, [ticker]: null })))
      }
      // 주간 감성 요약
      if (weeklyMap[ticker] === undefined) {
        sentimentApi.getWeeklySummary(ticker)
          .then(w => setWeeklyMap(prev => ({ ...prev, [ticker]: w })))
          .catch(() => setWeeklyMap(prev => ({ ...prev, [ticker]: null })))
      }
      // 미읽은 알림 수
      alertApi.getAlerts(ticker, true)
        .then(alerts => setAlertCountMap(prev => ({ ...prev, [ticker]: alerts.length })))
        .catch(() => setAlertCountMap(prev => ({ ...prev, [ticker]: 0 })))
    })
  }, [watchlist])  // signalMap/weeklyMap 제외: 무한루프 방지

  // ── 추가 ─────────────────────────────────────────────────
  const handleAdd = async (ticker: string) => {
    if (watchlist.includes(ticker)) {
      setAddError(`${ticker}은(는) 이미 추가된 종목입니다.`)
      setTimeout(() => setAddError(null), 2500)
      return
    }
    setAdding(true); setAddError(null)
    try {
      await watchlistApi.addTicker(ticker)
      setWatchlist(prev => [...prev, ticker])
    } catch {
      setAddError('추가에 실패했습니다. 티커를 확인해 주세요.')
      setTimeout(() => setAddError(null), 2500)
    } finally {
      setAdding(false)
    }
  }

  // ── 삭제 ─────────────────────────────────────────────────
  const handleRemove = async (ticker: string) => {
    try {
      await watchlistApi.removeTicker(ticker)
      setWatchlist(prev => prev.filter(t => t !== ticker))
      setNewsMap(prev => { const n = { ...prev }; delete n[ticker]; return n })
      setSignalMap(prev => { const n = { ...prev }; delete n[ticker]; return n })
      setWeeklyMap(prev => { const n = { ...prev }; delete n[ticker]; return n })
      setAlertCountMap(prev => { const n = { ...prev }; delete n[ticker]; return n })
    } catch { /* silent */ }
  }

  // ── 전체 감성 요약 ────────────────────────────────────────
  const allNews = Object.values(newsMap).flat()
  const totalPos = allNews.filter(n => n.sentimentLabel === 'POSITIVE').length
  const totalNeg = allNews.filter(n => n.sentimentLabel === 'NEGATIVE').length
  const totalNeu = allNews.filter(n => n.sentimentLabel === 'NEUTRAL').length
  const overallSentiment = totalPos > totalNeg ? 'POSITIVE' : totalNeg > totalPos ? 'NEGATIVE' : 'NEUTRAL'

  // ── 전체 미읽은 알림 ──────────────────────────────────────
  const totalUnreadAlerts = Object.values(alertCountMap).reduce((a, b) => a + b, 0)

  // ── 미로그인 ──────────────────────────────────────────────
  if (!authLoading && !isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f4fa', width: '100%', overflowX: 'hidden' }}>
        <header
          className="sticky top-0 z-30 px-4 sm:px-6 py-3"
          style={{ background: '#ffffff', borderBottom: '1px solid #ece9f5', boxShadow: '0 1px 6px rgba(139,127,212,0.06)' }}
        >
          <p className="font-bold text-base" style={{ color: '#18162a' }}>⭐ 관심 종목</p>
        </header>
        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
          <p className="text-5xl mb-4">🔐</p>
          <p className="font-bold text-lg mb-2" style={{ color: '#18162a' }}>로그인이 필요합니다</p>
          <p className="text-sm mb-6" style={{ color: '#9e9ab8' }}>관심 종목 기능은 로그인 후 이용할 수 있습니다.</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 rounded-2xl text-sm font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #8b7fd4, #6a5fc4)' }}
          >
            로그인하기
          </button>
        </main>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4fa', width: '100%', overflowX: 'hidden' }}>

      {/* ── 헤더 ──────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30 px-4 sm:px-6 py-3"
        style={{ background: '#ffffff', borderBottom: '1px solid #ece9f5', boxShadow: '0 1px 6px rgba(139,127,212,0.06)' }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="font-bold text-base" style={{ color: '#18162a' }}>⭐ 관심 종목</p>
            {watchlist.length > 0 && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: '#f0eefb', color: '#8b7fd4' }}
              >
                {watchlist.length}개
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* 전체 알림 배지 */}
            {totalUnreadAlerts > 0 && (
              <button
                onClick={() => router.push('/alerts')}
                className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full transition-all"
                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)' }}
              >
                🔔 알림 {totalUnreadAlerts > 9 ? '9+' : totalUnreadAlerts}건
              </button>
            )}
            {/* 전체 감성 요약 배지 */}
            {allNews.length > 0 && (
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: sentimentBg(overallSentiment), color: sentimentColor(overallSentiment) }}
              >
                {sentimentLabel(overallSentiment)} 우세
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-5 space-y-5 pb-10">

        {/* ── 티커 추가 바 ─────────────────────────────────── */}
        <div style={CARD}>
          <AddTickerBar onAdd={handleAdd} disabled={adding} />
          {addError && (
            <p className="text-xs mt-2" style={{ color: '#ef4444' }}>{addError}</p>
          )}
        </div>

        {/* ── 로딩 ─────────────────────────────────────────── */}
        {(pageLoading || authLoading) ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl" style={{ height: 200, background: '#f3f1fa' }} />
            ))}
          </div>
        ) : error ? (
          <div style={{ ...CARD, textAlign: 'center', paddingTop: 40, paddingBottom: 40 }}>
            <p className="text-2xl mb-2">⚠️</p>
            <p className="text-sm font-medium" style={{ color: '#ef4444' }}>{error}</p>
            <button
              onClick={fetchWatchlist}
              className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: '#8b7fd4' }}
            >
              재시도
            </button>
          </div>

        ) : watchlist.length === 0 ? (
          /* 빈 상태 */
          <div style={{ ...CARD, textAlign: 'center', paddingTop: 52, paddingBottom: 52 }}>
            <p className="text-5xl mb-4">⭐</p>
            <p className="font-bold text-base mb-2" style={{ color: '#18162a' }}>관심 종목이 없습니다</p>
            <p className="text-sm mb-1" style={{ color: '#9e9ab8' }}>
              궁금한 종목을 추가하면 감성 현황을 한눈에 확인할 수 있어요.
            </p>
            <p className="text-xs" style={{ color: '#c4c0d8' }}>
              위 입력창에 티커를 입력해 보세요. (예: AAPL, TSLA, NVDA)
            </p>
          </div>

        ) : (
          <>
            {/* ── 감성 요약 카드 ────────────────────────────── */}
            {allNews.length > 0 && (
              <div
                style={{
                  background: 'linear-gradient(135deg, #8b7fd4 0%, #6a5fc4 100%)',
                  borderRadius: '18px',
                  padding: '20px 24px',
                  boxShadow: '0 6px 24px rgba(139,127,212,0.22)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* 배경 장식 */}
                <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100,
                  borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />

                <p className="text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  관심 종목 전체 감성
                </p>
                <p className="font-bold text-xl mb-3" style={{ color: '#fff' }}>
                  {overallSentiment === 'POSITIVE' ? '↑ 긍정 우세'
                    : overallSentiment === 'NEGATIVE' ? '↓ 부정 우세'
                    : '− 중립'}
                </p>
                <div className="flex gap-5" style={{ borderTop: '1px solid rgba(255,255,255,0.18)', paddingTop: 12 }}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold" style={{ color: '#fca5a5' }}>↑ 긍정</span>
                    <span className="font-bold text-sm text-white">{totalPos}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold" style={{ color: '#93c5fd' }}>↓ 부정</span>
                    <span className="font-bold text-sm text-white">{totalNeg}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>− 중립</span>
                    <span className="font-bold text-sm text-white">{totalNeu}</span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>총</span>
                    <span className="font-bold text-sm text-white">{allNews.length}건</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── 종목 카드 그리드 ───────────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
              {watchlist.map(ticker => (
                <WatchCard
                  key={ticker}
                  ticker={ticker}
                  news={newsMap[ticker] ?? []}
                  newsLoading={loadingMap[ticker] ?? true}
                  signal={signalMap[ticker] ?? null}
                  weekly={weeklyMap[ticker] ?? null}
                  alertCount={alertCountMap[ticker] ?? 0}
                  onNavigate={t => router.push(`/stock/${t}`)}
                  onRemove={handleRemove}
                />
              ))}
            </div>

            {/* ── 종목 추가 유도 (5개 미만) ──────────────────── */}
            {watchlist.length < 5 && (
              <button
                onClick={() => {
                  const input = document.querySelector<HTMLInputElement>('input[placeholder*="티커 추가"]')
                  input?.focus()
                }}
                className="w-full py-3 rounded-2xl text-sm font-semibold transition-all"
                style={{ background: '#f0eefb', color: '#8b7fd4', border: '1.5px dashed #d4cff2' }}
              >
                + 종목 추가하기
              </button>
            )}
          </>
        )}
      </main>
    </div>
  )
}
