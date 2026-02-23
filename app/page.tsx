'use client'
import { useState, useEffect } from 'react'
import { newsApi } from '@/lib/api'
import type { News, NewsSummary } from '@/types'
import SentimentChart from '@/components/SentimentChart'
import SentimentDonutChart from '@/components/SentimentDonutChart'
import NewsCard from '@/components/NewsCard'
import TechnicalChart from '@/components/TechnicalChart'
import SignalScore from '@/components/SignalScore'

type SentimentFilter = 'ALL' | 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'

// ── 필터 버튼 ─────────────────────────────────────────────────────────────────
function FilterBtn({
  active, onClick, children,
  activeColor = '#3d5af1',
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  activeColor?: string
}) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150"
      style={{
        background:  active ? activeColor : '#ffffff',
        color:       active ? '#ffffff'   : '#475569',
        border:      active ? `1.5px solid ${activeColor}` : '1.5px solid #e2e8f0',
        boxShadow:   active ? '0 2px 8px rgba(0,0,0,0.12)' : '0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      {children}
    </button>
  )
}

// ── 통계 칩 ──────────────────────────────────────────────────────────────────
function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg"
      style={{ background: `${color}12`, border: `1px solid ${color}30` }}
    >
      <span className="text-xs font-medium" style={{ color }}>{label}</span>
      <span className="text-sm font-bold" style={{ color }}>{value}</span>
    </div>
  )
}

export default function DashboardPage() {
  const [ticker, setTicker] = useState('AAPL')
  const [news, setNews] = useState<News[]>([])
  const [filteredNews, setFilteredNews] = useState<News[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<SentimentFilter>('ALL')
  const [timeRange, setTimeRange] = useState(24)
  const [isKorean, setIsKorean] = useState(true)

  const [summary, setSummary] = useState<NewsSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [showSummary, setShowSummary] = useState(true)

  const fetchNews = async (tickerSymbol: string) => {
    setLoading(true)
    setError(null)
    setSummary(null)
    setSummaryError(null)
    try {
      const data = await newsApi.getNewsByTicker(tickerSymbol.toUpperCase(), 50)
      setNews(data)
      setFilteredNews(data)
      if (data.length > 0) fetchSummary(tickerSymbol.toUpperCase())
    } catch (err: any) {
      setError('뉴스를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = async (tickerSymbol: string) => {
    setSummaryLoading(true)
    setSummaryError(null)
    try {
      const data = await newsApi.getSummary(tickerSymbol)
      setSummary(data)
    } catch (err: any) {
      setSummaryError('AI 브리핑을 불러오는데 실패했습니다.')
    } finally {
      setSummaryLoading(false)
    }
  }

  useEffect(() => { fetchNews(ticker) }, [])

  useEffect(() => {
    setFilteredNews(filter === 'ALL' ? news : news.filter(n => n.sentimentLabel === filter))
  }, [filter, news])

  const stats = {
    total:    news.length,
    positive: news.filter(n => n.sentimentLabel === 'POSITIVE').length,
    negative: news.filter(n => n.sentimentLabel === 'NEGATIVE').length,
    neutral:  news.filter(n => n.sentimentLabel === 'NEUTRAL').length,
  }

  const translatedCount = news.filter(n => n.titleKo !== null).length

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (ticker.trim()) { fetchNews(ticker); setFilter('ALL') }
  }

  const sentimentBadgeStyle = (s: string) =>
    s === 'POSITIVE' ? { bg: '#10b981', text: '긍정' }
    : s === 'NEGATIVE' ? { bg: '#ef4444', text: '부정' }
    : { bg: '#64748b', text: '중립' }

  const cardStyle: React.CSSProperties = {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
  }

  return (
    <div className="min-h-screen" style={{ background: '#f0f2f5' }}>

      {/* ── 헤더 ─────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30 px-6 py-3"
        style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* 티커 검색 */}
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-sm">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                value={ticker}
                onChange={e => setTicker(e.target.value.toUpperCase())}
                placeholder="티커 입력 (예: AAPL)"
                maxLength={10}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg uppercase transition-all outline-none"
                style={{
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  color: '#0f172a',
                }}
                onFocus={e => (e.target.style.borderColor = '#3d5af1')}
                onBlur={e  => (e.target.style.borderColor = '#e2e8f0')}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: '#3d5af1' }}
            >
              {loading ? '로딩...' : '검색'}
            </button>
          </form>

          {/* 언어 토글 */}
          <div className="flex items-center gap-3">
            {!loading && news.length > 0 && (
              <span className="text-xs hidden sm:block" style={{ color: '#94a3b8' }}>
                번역 {translatedCount}/{news.length}
              </span>
            )}
            <button
              onClick={() => setIsKorean(!isKorean)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: isKorean ? '#3d5af1' : '#ffffff',
                color:      isKorean ? '#ffffff' : '#475569',
                border: '1.5px solid ' + (isKorean ? '#3d5af1' : '#e2e8f0'),
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              {isKorean ? '한국어' : 'English'}
            </button>
          </div>
        </div>
      </header>

      {/* ── 메인 ─────────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* 에러 */}
        {error && (
          <div
            className="flex items-center gap-3 p-4 rounded-xl text-sm fade-in"
            style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* ── AI 브리핑 ────────────────────────────────────────────────── */}
        {!loading && news.length > 0 && (
          <div style={cardStyle} className="fade-in">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                  style={{ background: '#ede9fe' }}
                >
                  🤖
                </div>
                <span className="font-semibold text-sm" style={{ color: '#0f172a' }}>AI 뉴스 브리핑</span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: '#eff6ff', color: '#3d5af1', border: '1px solid #bfdbfe' }}
                >
                  {ticker}
                </span>
                {summary && (() => {
                  const s = sentimentBadgeStyle(summary.overallSentiment)
                  return (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: `${s.bg}18`, color: s.bg, border: `1px solid ${s.bg}40` }}
                    >
                      {s.text}
                    </span>
                  )
                })()}
              </div>
              <button
                onClick={() => setShowSummary(!showSummary)}
                className="text-xs transition-colors"
                style={{ color: '#94a3b8' }}
              >
                {showSummary ? '접기 ▲' : '펼치기 ▼'}
              </button>
            </div>

            {showSummary && (
              summaryLoading ? (
                <div className="flex items-center gap-3 py-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent" style={{ borderColor: '#3d5af1', borderTopColor: 'transparent' }} />
                  <span className="text-sm" style={{ color: '#64748b' }}>AI가 뉴스를 분석하고 있습니다...</span>
                </div>
              ) : summaryError ? (
                <div className="text-sm py-2" style={{ color: '#ef4444' }}>
                  {summaryError}
                  <button onClick={() => fetchSummary(ticker)} className="ml-2 underline">재시도</button>
                </div>
              ) : summary ? (
                <>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: '#475569' }}>
                    {summary.summary}
                  </p>
                  <div
                    className="flex flex-wrap gap-3 pt-3 text-xs"
                    style={{ borderTop: '1px solid #f1f5f9', color: '#94a3b8' }}
                  >
                    <span>최근 {summary.positiveCount + summary.negativeCount + summary.neutralCount}건 분석</span>
                    <span style={{ color: '#10b981' }}>긍정 {summary.positiveCount}</span>
                    <span style={{ color: '#ef4444' }}>부정 {summary.negativeCount}</span>
                    <span style={{ color: '#64748b' }}>중립 {summary.neutralCount}</span>
                    {summary.generatedAt && (
                      <span className="ml-auto">
                        {new Date(summary.generatedAt).toLocaleTimeString('ko-KR')}
                      </span>
                    )}
                  </div>
                </>
              ) : null
            )}
          </div>
        )}

        {/* ── 통계 요약 ────────────────────────────────────────────────── */}
        {!loading && news.length > 0 && (
          <div style={cardStyle} className="fade-in">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>총 뉴스</p>
                <p className="text-4xl font-bold" style={{ color: '#3d5af1' }}>{stats.total}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <StatChip label="긍정" value={stats.positive} color="#10b981" />
                <StatChip label="부정" value={stats.negative} color="#ef4444" />
                <StatChip label="중립" value={stats.neutral}  color="#64748b" />
              </div>
            </div>
          </div>
        )}

        {/* ── 차트 영역 ────────────────────────────────────────────────── */}
        {!loading && news.length > 0 && (
          <div className="space-y-5">
            {/* 시간 범위 필터 */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>기간</span>
              {[
                { label: '24시간', value: 24 },
                { label: '3일',   value: 72 },
                { label: '7일',   value: 168 },
                { label: '30일',  value: 720 },
              ].map(({ label, value }) => (
                <FilterBtn key={value} active={timeRange === value} onClick={() => setTimeRange(value)}>
                  {label}
                </FilterBtn>
              ))}
            </div>

            {/* 감성 차트 */}
            <div className="grid lg:grid-cols-2 gap-5">
              <SentimentChart ticker={ticker} hours={timeRange} />
              <SentimentDonutChart positive={stats.positive} negative={stats.negative} neutral={stats.neutral} />
            </div>

            {/* 종합 시그널 */}
            <SignalScore ticker={ticker} />

            {/* 기술적 지표 */}
            <TechnicalChart ticker={ticker} />
          </div>
        )}

        {/* ── 뉴스 필터 ────────────────────────────────────────────────── */}
        {!loading && news.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            <FilterBtn active={filter === 'ALL'}      onClick={() => setFilter('ALL')}>
              전체 ({stats.total})
            </FilterBtn>
            <FilterBtn active={filter === 'POSITIVE'} onClick={() => setFilter('POSITIVE')} activeColor="#10b981">
              긍정 ({stats.positive})
            </FilterBtn>
            <FilterBtn active={filter === 'NEGATIVE'} onClick={() => setFilter('NEGATIVE')} activeColor="#ef4444">
              부정 ({stats.negative})
            </FilterBtn>
            <FilterBtn active={filter === 'NEUTRAL'}  onClick={() => setFilter('NEUTRAL')}  activeColor="#64748b">
              중립 ({stats.neutral})
            </FilterBtn>
          </div>
        )}

        {/* ── 뉴스 목록 ────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-transparent" style={{ borderColor: '#3d5af1', borderTopColor: 'transparent' }} />
            <p className="text-sm" style={{ color: '#94a3b8' }}>뉴스를 불러오는 중...</p>
          </div>
        ) : filteredNews.length > 0 ? (
          <div className="grid gap-3">
            {filteredNews.map(item => (
              <NewsCard key={item.id} news={item} globalIsKorean={isKorean} />
            ))}
          </div>
        ) : (
          <div style={{ ...cardStyle, textAlign: 'center', paddingTop: '48px', paddingBottom: '48px' }}>
            <p className="font-medium" style={{ color: '#475569' }}>뉴스가 없습니다.</p>
            <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>다른 티커를 검색해보세요.</p>
          </div>
        )}
      </main>
    </div>
  )
}
