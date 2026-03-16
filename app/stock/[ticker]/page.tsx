'use client'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { newsApi, watchlistApi, tradingApi } from '@/lib/api'
import type { News, NewsSummary, SentimentLabel, SignalHistory, InvestOpinion } from '@/types'
import SentimentChart from '@/components/SentimentChart'
import SentimentDonutChart from '@/components/SentimentDonutChart'
import SentimentTrendChart from '@/components/SentimentTrendChart'
import PriceVsSentimentChart from '@/components/PriceVsSentimentChart'
import SentimentMemoModal from '@/components/SentimentMemoModal'
import NewsCard from '@/components/NewsCard'
import NewsCardSkeleton from '@/components/NewsCardSkeleton'
import TechnicalPanel from '@/components/TechnicalPanel'
import FundamentalPanel from '@/components/FundamentalPanel'
import PeerComparisonTable from '@/components/PeerComparisonTable'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

type SentimentFilter = 'ALL' | 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
type DetailTab = 'overview' | 'technical' | 'fundamental' | 'news' | 'signals'
type DateRange = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH'

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: 'ALL',   label: '전체' },
  { value: 'TODAY', label: '오늘' },
  { value: 'WEEK',  label: '이번 주' },
  { value: 'MONTH', label: '이번 달' },
]

function dateRangeStart(range: DateRange): number {
  const now = Date.now()
  if (range === 'TODAY') return new Date().setHours(0, 0, 0, 0)
  if (range === 'WEEK')  return now - 7  * 24 * 60 * 60 * 1000
  if (range === 'MONTH') return now - 30 * 24 * 60 * 60 * 1000
  return 0
}

const CARD: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: '18px',
  padding: '24px',
  boxShadow: '0 2px 12px rgba(139,127,212,0.09)',
}

function TabBtn({
  active, onClick, children, color = '#8b7fd4',
}: { active: boolean; onClick: () => void; children: React.ReactNode; color?: string }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150"
      style={{
        background: active ? color : 'transparent',
        color:      active ? '#fff' : '#9e9ab8',
        fontWeight: active ? 600 : 400,
      }}
    >
      {children}
    </button>
  )
}

// 뉴스 더보기 단위
const NEWS_PAGE_SIZE = 8

export default function StockDetailPage() {
  const params  = useParams()
  const router  = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  const ticker = (params.ticker as string).toUpperCase()

  const [news, setNews]             = useState<News[]>([])
  const [filteredNews, setFilteredNews] = useState<News[]>([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)
  const [filter, setFilter]         = useState<SentimentFilter>('ALL')
  const [dateRange, setDateRange]   = useState<DateRange>('ALL')
  const [isKorean, setIsKorean]     = useState(true)
  const [activeTab, setActiveTab]   = useState<DetailTab>('overview')
  const [visibleCount, setVisibleCount] = useState(NEWS_PAGE_SIZE)

  const [summary, setSummary]             = useState<NewsSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError]   = useState<string | null>(null)

  const [inWatchlist, setInWatchlist]       = useState(false)
  const [watchlistLoading, setWatchlistLoading] = useState(false)

  const [showMemoModal, setShowMemoModal] = useState(false)

  // 신호 히스토리
  const [signalHistory, setSignalHistory]             = useState<SignalHistory[]>([])
  const [signalHistoryLoading, setSignalHistoryLoading] = useState(false)
  const [signalHistoryDays, setSignalHistoryDays]     = useState(90)

  // 최근 뉴스에서 현재 감성 점수 계산 (최근 10건 평균)
  const currentSentiment = useMemo(() => {
    const recent = news.slice(0, 10).filter(n => n.sentimentScore != null)
    if (recent.length === 0) return { score: null, label: null as SentimentLabel | null }
    const avg = recent.reduce((s, n) => s + (n.sentimentScore ?? 0), 0) / recent.length
    const score = parseFloat(avg.toFixed(3))
    const label: SentimentLabel = score >= 0.2 ? 'POSITIVE' : score <= -0.2 ? 'NEGATIVE' : 'NEUTRAL'
    return { score, label }
  }, [news])

  // ── 데이터 로드 ─────────────────────────────────────────────
  const fetchNews = useCallback(async (sym: string) => {
    setLoading(true); setError(null); setSummary(null); setSummaryError(null)
    setVisibleCount(NEWS_PAGE_SIZE)
    try {
      const data = await newsApi.getNewsByTicker(sym, 50)
      setNews(data); setFilteredNews(data)
      setLastFetched(new Date())
      if (data.length > 0) fetchSummary(sym)
    } catch {
      setError('뉴스를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchSummary = async (sym: string) => {
    setSummaryLoading(true); setSummaryError(null)
    try { setSummary(await newsApi.getSummary(sym)) }
    catch { setSummaryError('AI 브리핑을 불러오는데 실패했습니다.') }
    finally { setSummaryLoading(false) }
  }

  // 관심 종목 여부 확인
  const checkWatchlist = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const tickers = await watchlistApi.getWatchlist()
      setInWatchlist(tickers.includes(ticker))
    } catch { /* silent */ }
  }, [isAuthenticated, ticker])

  const fetchSignalHistory = useCallback(async (sym: string, days: number) => {
    setSignalHistoryLoading(true)
    try {
      const res = await tradingApi.getSignalHistory(sym, days)
      setSignalHistory(res.history ?? [])
    } catch {
      setSignalHistory([])
    } finally {
      setSignalHistoryLoading(false)
    }
  }, [])

  useEffect(() => { fetchNews(ticker) }, [ticker, fetchNews])
  useEffect(() => { checkWatchlist() }, [checkWatchlist])
  useEffect(() => {
    const rangeStart = dateRangeStart(dateRange)
    const result = news
      .filter(n => filter === 'ALL' || n.sentimentLabel === filter)
      .filter(n => dateRange === 'ALL' || new Date(n.publishedAt).getTime() >= rangeStart)
    setFilteredNews(result)
    setVisibleCount(NEWS_PAGE_SIZE)
  }, [filter, dateRange, news])

  const stats = {
    total:    news.length,
    positive: news.filter(n => n.sentimentLabel === 'POSITIVE').length,
    negative: news.filter(n => n.sentimentLabel === 'NEGATIVE').length,
    neutral:  news.filter(n => n.sentimentLabel === 'NEUTRAL').length,
  }

  const overallColor = (s: string) =>
    s === 'POSITIVE' ? '#22c55e' : s === 'NEGATIVE' ? '#f43f5e' : '#8b8fa8'
  const overallLabel = (s: string) =>
    s === 'POSITIVE' ? '긍정' : s === 'NEGATIVE' ? '부정' : '중립'

  // 관심 종목 토글
  const toggleWatchlist = async () => {
    if (!isAuthenticated) return
    setWatchlistLoading(true)
    try {
      if (inWatchlist) {
        await watchlistApi.removeTicker(ticker)
        setInWatchlist(false)
      } else {
        await watchlistApi.addTicker(ticker)
        setInWatchlist(true)
      }
    } catch { /* silent */ } finally {
      setWatchlistLoading(false)
    }
  }

  const detailTabs: { key: DetailTab; label: string }[] = [
    { key: 'overview',    label: '📊 개요' },
    { key: 'technical',   label: '📈 기술적' },
    { key: 'fundamental', label: '🏢 펀더멘털' },
    { key: 'signals',     label: '🔔 신호 히스토리' },
    { key: 'news',        label: '📰 뉴스' },
  ]

  // 신호 히스토리 탭 진입 시 데이터 로드
  useEffect(() => {
    if (activeTab === 'signals' && signalHistory.length === 0 && !signalHistoryLoading) {
      fetchSignalHistory(ticker, signalHistoryDays)
    }
  }, [activeTab, ticker, signalHistory.length, signalHistoryLoading, signalHistoryDays, fetchSignalHistory])

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4fa', width: '100%' }}>

      {/* ── 상단 헤더 ───────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30 px-6 py-3"
        style={{ background: '#ffffff', borderBottom: '1px solid #ece9f5', boxShadow: '0 1px 6px rgba(139,127,212,0.06)' }}
      >
        <div className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-4">
          {/* 뒤로가기 */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1 sm:gap-1.5 text-sm transition-colors shrink-0"
            style={{ color: '#9e9ab8' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            <span className="hidden sm:inline">대시보드</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background: 'linear-gradient(135deg, #8b7fd4, #6a5fc4)' }}
            >
              {ticker.slice(0, 2)}
            </div>
            <div>
              <p className="font-bold text-sm sm:text-base" style={{ color: '#18162a' }}>{ticker}</p>
              <div className="flex items-center gap-2">
                <p className="text-xs hidden sm:block" style={{ color: '#9e9ab8' }}>뉴스 감성 분석</p>
                {lastFetched && (
                  <span
                    className="hidden sm:inline text-xs px-2 py-0.5 rounded-full"
                    style={{ background: '#f0eefb', color: '#8b7fd4', border: '1px solid #d4cff2' }}
                  >
                    🕒 {Math.floor((Date.now() - lastFetched.getTime()) / 60000) < 1
                      ? '방금 수집'
                      : `${Math.floor((Date.now() - lastFetched.getTime()) / 60000)}분 전 수집`}
                  </span>
                )}
              </div>
            </div>

            {/* 티커 변경 검색바 — 모바일 숨김 */}
            <form
              onSubmit={e => {
                e.preventDefault()
                const val = (e.currentTarget.elements.namedItem('jump') as HTMLInputElement).value.trim().toUpperCase()
                if (val && val !== ticker) router.push(`/stock/${val}`)
              }}
              className="hidden sm:flex gap-1.5 ml-2"
            >
              <div className="relative">
                <input
                  name="jump"
                  type="text"
                  placeholder="다른 종목..."
                  maxLength={10}
                  className="pl-3 pr-8 py-1.5 text-sm rounded-xl uppercase outline-none transition-all w-32"
                  style={{ background: '#f8f7fd', border: '1.5px solid #ece9f5', color: '#18162a' }}
                  onFocus={e => (e.target.style.borderColor = '#8b7fd4')}
                  onBlur={e  => (e.target.style.borderColor = '#ece9f5')}
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  style={{ color: '#c4c0d8' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              </div>
            </form>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* 관심 종목 버튼 */}
            {isAuthenticated && (
              <button
                onClick={toggleWatchlist}
                disabled={watchlistLoading}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: inWatchlist ? '#fef3c7' : '#f8f7fd',
                  color:      inWatchlist ? '#d97706' : '#9e9ab8',
                  border: `1.5px solid ${inWatchlist ? '#fcd34d' : '#ece9f5'}`,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24"
                  fill={inWatchlist ? 'currentColor' : 'none'}
                  stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span className="hidden sm:inline">{inWatchlist ? '관심 종목' : '+ 관심 추가'}</span>
              </button>
            )}

            {/* 언어 토글 */}
            <button
              onClick={() => setIsKorean(!isKorean)}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all"
              style={{
                background: isKorean ? '#f0eefb' : '#f8f7fd',
                color:      isKorean ? '#8b7fd4' : '#9e9ab8',
                border: `1.5px solid ${isKorean ? '#d4cff2' : '#ece9f5'}`,
              }}
            >
              {isKorean ? '한' : 'EN'}
              <span className="hidden sm:inline">{isKorean ? '국어' : 'glish'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── 메인 ────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-2xl text-sm"
            style={{ background: '#fff1f3', border: '1px solid #ffd5db', color: '#f43f5e' }}>
            {error}
          </div>
        )}

        {/* ── AI 브리핑 ───────────────────────────────────── */}
        {!loading && news.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #8b7fd4 0%, #6a5fc4 100%)',
            borderRadius: '20px', padding: '28px',
            position: 'relative', overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(139,127,212,0.28)',
          }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160,
              borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -30, right: 60, width: 100, height: 100,
              borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />

            <div className="relative">
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.2)', fontSize: 16 }}>🤖</div>
                <span className="font-bold text-white text-base">AI 뉴스 브리핑</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                  {ticker}
                </span>
                {summary && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                    {overallLabel(summary.overallSentiment)}
                  </span>
                )}
              </div>

              {summaryLoading ? (
                <div className="flex items-center gap-3 py-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2"
                    style={{ borderColor: 'rgba(255,255,255,0.7)', borderTopColor: 'transparent' }} />
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>AI가 뉴스를 분석하고 있습니다...</span>
                </div>
              ) : summaryError ? (
                <div className="text-sm py-1" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  {summaryError}
                  <button onClick={() => fetchSummary(ticker)} className="ml-2 underline">재시도</button>
                </div>
              ) : summary ? (
                <>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.92)' }}>
                    {summary.summary}
                  </p>
                  <div className="flex flex-wrap gap-4 pt-3 text-xs"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.65)' }}>
                      최근 {summary.positiveCount + summary.negativeCount + summary.neutralCount}건 분석
                    </span>
                    <span style={{ color: '#a8f5c9' }}>긍정 {summary.positiveCount}</span>
                    <span style={{ color: '#ffa5b4' }}>부정 {summary.negativeCount}</span>
                    <span style={{ color: 'rgba(255,255,255,0.55)' }}>중립 {summary.neutralCount}</span>
                    {summary.generatedAt && (
                      <span className="ml-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {new Date(summary.generatedAt).toLocaleTimeString('ko-KR')}
                      </span>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}

        {/* ── 탭 네비게이션 ───────────────────────────────── */}
        {!loading && news.length > 0 && (
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <div style={{ ...CARD, padding: '6px 8px', display: 'inline-flex', gap: '2px', whiteSpace: 'nowrap', minWidth: 'max-content' }}>
              {detailTabs.map(t => (
                <TabBtn key={t.key} active={activeTab === t.key} onClick={() => setActiveTab(t.key)}>
                  {t.label}
                </TabBtn>
              ))}
            </div>
          </div>
        )}

        {/* ── 개요 탭 ─────────────────────────────────────── */}
        {!loading && news.length > 0 && activeTab === 'overview' && (
          <div className="space-y-5">
            {/* 일별 감성 추이 — 핵심 차트 (내부 탭: 7일/30일/90일) */}
            <div style={{ position: 'relative' }}>
              <SentimentTrendChart ticker={ticker} />

              {/* 이 시점 메모 — 로그인 사용자만 표시 */}
              {isAuthenticated && (
                <button
                  onClick={() => setShowMemoModal(true)}
                  className="absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: '#f0eefb',
                    color: '#8b7fd4',
                    border: '1.5px solid #d4cff2',
                    zIndex: 10,
                  }}
                  title="이 시점의 감성 점수와 함께 메모를 저장합니다"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  이 시점 메모
                </button>
              )}
            </div>

            {/* 주가 vs 감성 상관 차트 */}
            <PriceVsSentimentChart ticker={ticker} />

            <div className="grid lg:grid-cols-2 gap-5">
              <SentimentChart ticker={ticker} hours={168} />
              <SentimentDonutChart
                positive={stats.positive}
                negative={stats.negative}
                neutral={stats.neutral}
              />
            </div>
          </div>
        )}

        {/* ── 기술적 분석 탭 ──────────────────────────────── */}
        {!loading && activeTab === 'technical' && (
          <TechnicalPanel ticker={ticker} />
        )}

        {/* ── 펀더멘털 탭 ─────────────────────────────────── */}
        {!loading && activeTab === 'fundamental' && (
          <div className="space-y-5">
            <FundamentalPanel ticker={ticker} />
            <PeerComparisonTable ticker={ticker} />
          </div>
        )}

        {/* ── 신호 히스토리 탭 ────────────────────────────── */}
        {activeTab === 'signals' && (
          <SignalHistoryTab
            ticker={ticker}
            history={signalHistory}
            loading={signalHistoryLoading}
            days={signalHistoryDays}
            onChangeDays={(d) => {
              setSignalHistoryDays(d)
              setSignalHistory([])
              fetchSignalHistory(ticker, d)
            }}
          />
        )}

        {/* ── 뉴스 탭 ─────────────────────────────────────── */}
        {(activeTab === 'news' || (activeTab === 'overview' && !loading && news.length > 0)) && (
          <div className="space-y-3">
            {/* 필터 */}
            {!loading && news.length > 0 && (
              <div style={{ ...CARD, padding: '10px 14px' }} className="space-y-2.5">
                {/* 감성 필터 */}
                <div className="overflow-x-auto -mx-2 px-2">
                  <div style={{ display: 'inline-flex', gap: '2px', whiteSpace: 'nowrap', minWidth: 'max-content' }}>
                    <TabBtn active={filter === 'ALL'}      onClick={() => setFilter('ALL')}>전체 ({stats.total})</TabBtn>
                    <TabBtn active={filter === 'POSITIVE'} onClick={() => setFilter('POSITIVE')} color="#22c55e">긍정 ({stats.positive})</TabBtn>
                    <TabBtn active={filter === 'NEGATIVE'} onClick={() => setFilter('NEGATIVE')} color="#f43f5e">부정 ({stats.negative})</TabBtn>
                    <TabBtn active={filter === 'NEUTRAL'}  onClick={() => setFilter('NEUTRAL')}  color="#8b8fa8">중립 ({stats.neutral})</TabBtn>
                  </div>
                </div>
                {/* 날짜 필터 */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold shrink-0" style={{ color: '#c4c0d8' }}>기간</span>
                  {DATE_RANGE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setDateRange(opt.value)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: dateRange === opt.value ? '#6366f1' : '#f3f1fa',
                        color:      dateRange === opt.value ? '#fff' : '#9e9ab8',
                        border:     `1px solid ${dateRange === opt.value ? '#6366f1' : 'transparent'}`,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                  {(filter !== 'ALL' || dateRange !== 'ALL') && filteredNews.length !== news.length && (
                    <span className="text-xs ml-1" style={{ color: '#c4c0d8' }}>
                      {filteredNews.length}건 표시
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 목록 */}
            {loading ? (
              <div className="grid gap-3">
                {Array.from({ length: 5 }).map((_, i) => <NewsCardSkeleton key={i} />)}
              </div>
            ) : filteredNews.length > 0 ? (
              <>
                <div className="grid gap-3">
                  {filteredNews.slice(0, visibleCount).map(item => (
                    <NewsCard key={item.id} news={item} globalIsKorean={isKorean} />
                  ))}
                </div>
                {visibleCount < filteredNews.length && (
                  <button
                    onClick={() => setVisibleCount(v => v + NEWS_PAGE_SIZE)}
                    className="w-full py-3 rounded-2xl text-sm font-medium transition-all"
                    style={{ background: '#f0eefb', color: '#8b7fd4', border: '1.5px solid #d4cff2' }}
                  >
                    더 보기 ({filteredNews.length - visibleCount}건 남음)
                  </button>
                )}
              </>
            ) : (
              <div style={{ ...CARD, textAlign: 'center', paddingTop: 48, paddingBottom: 48 }}>
                <p className="font-medium" style={{ color: '#5e5a78' }}>뉴스가 없습니다.</p>
              </div>
            )}
          </div>
        )}

        {/* 로딩 */}
        {loading && (
          <div className="grid gap-3">
            {Array.from({ length: 5 }).map((_, i) => <NewsCardSkeleton key={i} />)}
          </div>
        )}
      </main>

      {/* ── 감성 메모 모달 ─────────────────────────────────── */}
      {showMemoModal && (
        <SentimentMemoModal
          ticker={ticker}
          sentimentScore={currentSentiment.score}
          sentimentLabel={currentSentiment.label}
          onClose={() => setShowMemoModal(false)}
          onSaved={() => setShowMemoModal(false)}
        />
      )}

      {/* ── 비로그인 CTA 배너 (하단 고정) ─────────────────── */}
      {!isAuthenticated && !isLoading && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 px-4 py-3"
          style={{
            background: 'linear-gradient(135deg, #8b7fd4 0%, #6a5fc4 100%)',
            boxShadow: '0 -4px 24px rgba(107,95,196,0.3)',
          }}
        >
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-white">
                🔔 {ticker} 감성 변화 알림 받기
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.8)' }}>
                무료 가입하고 감성 급변 시 실시간 알림을 받아보세요.
              </p>
            </div>
            <Link
              href="/login"
              className="shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all"
              style={{ background: '#ffffff', color: '#8b7fd4', whiteSpace: 'nowrap' }}
            >
              무료 가입
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

// ── 신호 히스토리 탭 컴포넌트 ─────────────────────────────────

const SIGNAL_COLOR: Record<InvestOpinion, string> = {
  BUY:  '#22c55e',
  SELL: '#f43f5e',
  HOLD: '#8b8fa8',
}

const SIGNAL_BG: Record<InvestOpinion, string> = {
  BUY:  '#f0fdf4',
  SELL: '#fff1f3',
  HOLD: '#f3f4f6',
}

const SIGNAL_LABEL: Record<InvestOpinion, string> = {
  BUY:  '매수',
  SELL: '매도',
  HOLD: '보유',
}

const SIGNAL_EMOJI: Record<InvestOpinion, string> = {
  BUY:  '🟢',
  SELL: '🔴',
  HOLD: '⚪️',
}

function SignalHistoryTab({
  ticker,
  history,
  loading,
  days,
  onChangeDays,
}: {
  ticker: string
  history: SignalHistory[]
  loading: boolean
  days: number
  onChangeDays: (d: number) => void
}) {
  const DAYS_OPTIONS = [30, 90, 180, 365]

  // 신호 분포 계산
  const dist = history.reduce(
    (acc, h) => { acc[h.signal] = (acc[h.signal] ?? 0) + 1; return acc },
    {} as Record<string, number>
  )

  return (
    <div className="space-y-4">
      {/* 기간 선택 + 요약 */}
      <div style={{ ...CARD, padding: '16px 20px' }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: '#5e5a78' }}>기간</span>
            {DAYS_OPTIONS.map(d => (
              <button
                key={d}
                onClick={() => onChangeDays(d)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: days === d ? '#8b7fd4' : '#f3f1fa',
                  color:      days === d ? '#fff'    : '#9e9ab8',
                }}
              >
                {d >= 365 ? '1년' : `${d}일`}
              </button>
            ))}
          </div>
          {!loading && history.length > 0 && (
            <div className="flex items-center gap-3 text-xs">
              {(['BUY', 'HOLD', 'SELL'] as InvestOpinion[]).map(s => (
                <span key={s} className="flex items-center gap-1">
                  <span>{SIGNAL_EMOJI[s]}</span>
                  <span style={{ color: SIGNAL_COLOR[s], fontWeight: 600 }}>{SIGNAL_LABEL[s]}</span>
                  <span style={{ color: '#9e9ab8' }}>{dist[s] ?? 0}회</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 히스토리 목록 */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ ...CARD, padding: '16px 20px' }}>
              <div className="animate-pulse flex gap-4">
                <div className="w-14 h-14 rounded-xl" style={{ background: '#f3f1fa' }} />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 rounded" style={{ background: '#f3f1fa', width: '40%' }} />
                  <div className="h-3 rounded" style={{ background: '#f3f1fa', width: '70%' }} />
                  <div className="h-3 rounded" style={{ background: '#f3f1fa', width: '55%' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : history.length === 0 ? (
        <div style={{ ...CARD, textAlign: 'center', paddingTop: 48, paddingBottom: 48 }}>
          <p style={{ fontSize: 36, marginBottom: 12 }}>📭</p>
          <p className="font-medium" style={{ color: '#5e5a78' }}>신호 기록이 없습니다</p>
          <p className="text-sm mt-1" style={{ color: '#9e9ab8' }}>
            매일 22:30 UTC 장 마감 후 자동 생성됩니다
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((h) => (
            <SignalHistoryCard key={h.id} item={h} ticker={ticker} />
          ))}
        </div>
      )}
    </div>
  )
}

function SignalHistoryCard({ item, ticker }: { item: SignalHistory; ticker: string }) {
  const [expanded, setExpanded] = React.useState(false)
  const signal = item.signal as InvestOpinion

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: `1.5px solid ${expanded ? SIGNAL_COLOR[signal] + '40' : '#ece9f5'}`,
        overflow: 'hidden',
        transition: 'border-color 0.15s',
        boxShadow: '0 2px 8px rgba(139,127,212,0.07)',
      }}
    >
      {/* 헤더 행 */}
      <button
        className="w-full flex items-center gap-4 p-4 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        {/* 신호 뱃지 */}
        <div
          className="shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-0.5"
          style={{ background: SIGNAL_BG[signal] }}
        >
          <span style={{ fontSize: 18 }}>{SIGNAL_EMOJI[signal]}</span>
          <span className="text-xs font-bold" style={{ color: SIGNAL_COLOR[signal] }}>
            {SIGNAL_LABEL[signal]}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-bold" style={{ color: '#18162a' }}>
              {new Date(item.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: '#f0eefb', color: '#8b7fd4', border: '1px solid #d4cff2' }}
            >
              {item.strategyName?.includes('v2') ? 'v2' : '폴백'}
            </span>
            <span className="text-xs ml-auto" style={{ color: '#9e9ab8' }}>
              신뢰도 {Math.round(item.confidence * 100)}%
            </span>
          </div>

          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: '#6b6886' }}>
            {item.reason}
          </p>

          {/* 수치 한 줄 요약 */}
          <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: '#9e9ab8' }}>
            <span>종가 <strong style={{ color: '#5e5a78' }}>${item.currentPrice.toLocaleString()}</strong></span>
            <span>감성
              <strong style={{ color: item.sentimentScore > 0.1 ? '#22c55e' : item.sentimentScore < -0.1 ? '#f43f5e' : '#8b8fa8' }}>
                {' '}{item.sentimentScore >= 0 ? '+' : ''}{item.sentimentScore.toFixed(2)}
              </strong>
            </span>
            {item.rsiValue && <span>RSI <strong style={{ color: '#5e5a78' }}>{item.rsiValue.toFixed(1)}</strong></span>}
            <span>복합점수 <strong style={{ color: '#8b7fd4' }}>{item.combinedScore.toFixed(3)}</strong></span>
          </div>
        </div>

        {/* 펼치기 화살표 */}
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="#c4c0d8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="shrink-0 transition-transform"
          style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
        >
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>

      {/* 확장 상세 (breakdown) */}
      {expanded && item.breakdown && (
        <div style={{ borderTop: '1px solid #f0eefb', padding: '12px 16px 16px', background: '#faf9fe' }}>
          <p className="text-xs font-semibold mb-3" style={{ color: '#9e9ab8' }}>4축 분석 기여도</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: '기술적', score: item.breakdown.technicalScore, contrib: item.breakdown.technicalContrib, detail: item.breakdown.technicalDetail },
              { label: '감성', score: item.breakdown.sentimentScore, contrib: item.breakdown.sentimentContrib, detail: '' },
              { label: '펀더멘털', score: item.breakdown.fundamentalScore, contrib: item.breakdown.fundamentalContrib, detail: item.breakdown.fundamentalDetail },
              { label: '시장', score: item.breakdown.marketScore, contrib: item.breakdown.marketContrib, detail: '' },
            ].map(axis => (
              <div key={axis.label} style={{ background: '#ffffff', borderRadius: 10, padding: '10px 12px', border: '1px solid #ece9f5' }}>
                <p className="text-xs font-medium mb-1" style={{ color: '#9e9ab8' }}>{axis.label}</p>
                <p className="text-sm font-bold" style={{ color: axis.score > 0 ? '#22c55e' : axis.score < 0 ? '#f43f5e' : '#5e5a78' }}>
                  {axis.score >= 0 ? '+' : ''}{axis.score.toFixed(3)}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#8b7fd4' }}>
                  기여 {axis.contrib >= 0 ? '+' : ''}{axis.contrib.toFixed(3)}
                </p>
                {axis.detail && (
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: '#9e9ab8' }}>{axis.detail}</p>
                )}
              </div>
            ))}
          </div>
          {item.breakdown.earningsRisk && (
            <div className="mt-3 flex items-center gap-1.5 text-xs"
              style={{ color: '#d97706', background: '#fffbeb', borderRadius: 8, padding: '6px 10px', border: '1px solid #fde68a' }}>
              ⚠️ 어닝 발표 임박 — 변동성 주의
            </div>
          )}
        </div>
      )}
    </div>
  )
}
