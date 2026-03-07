'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { newsApi, watchlistApi } from '@/lib/api'
import type { News, NewsSummary } from '@/types'
import SentimentChart from '@/components/SentimentChart'
import SentimentDonutChart from '@/components/SentimentDonutChart'
import SentimentTrendChart from '@/components/SentimentTrendChart'
import NewsCard from '@/components/NewsCard'
import NewsCardSkeleton from '@/components/NewsCardSkeleton'
import TechnicalPanel from '@/components/TechnicalPanel'
import FundamentalPanel from '@/components/FundamentalPanel'
import PeerComparisonTable from '@/components/PeerComparisonTable'
import { useAuth } from '@/context/AuthContext'

type SentimentFilter = 'ALL' | 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
type DetailTab = 'overview' | 'technical' | 'fundamental' | 'news'

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
  const { isAuthenticated } = useAuth()

  const ticker = (params.ticker as string).toUpperCase()

  const [news, setNews]             = useState<News[]>([])
  const [filteredNews, setFilteredNews] = useState<News[]>([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [filter, setFilter]         = useState<SentimentFilter>('ALL')
  const [timeRange, setTimeRange]   = useState(24)
  const [isKorean, setIsKorean]     = useState(true)
  const [activeTab, setActiveTab]   = useState<DetailTab>('overview')
  const [visibleCount, setVisibleCount] = useState(NEWS_PAGE_SIZE)

  const [summary, setSummary]             = useState<NewsSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError]   = useState<string | null>(null)

  const [inWatchlist, setInWatchlist]       = useState(false)
  const [watchlistLoading, setWatchlistLoading] = useState(false)

  // ── 데이터 로드 ─────────────────────────────────────────────
  const fetchNews = useCallback(async (sym: string) => {
    setLoading(true); setError(null); setSummary(null); setSummaryError(null)
    setVisibleCount(NEWS_PAGE_SIZE)
    try {
      const data = await newsApi.getNewsByTicker(sym, 50)
      setNews(data); setFilteredNews(data)
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

  useEffect(() => { fetchNews(ticker) }, [ticker, fetchNews])
  useEffect(() => { checkWatchlist() }, [checkWatchlist])
  useEffect(() => {
    setFilteredNews(filter === 'ALL' ? news : news.filter(n => n.sentimentLabel === filter))
    setVisibleCount(NEWS_PAGE_SIZE)
  }, [filter, news])

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
    { key: 'news',        label: '📰 뉴스' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4fa' }}>

      {/* ── 상단 헤더 ───────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30 px-6 py-3"
        style={{ background: '#ffffff', borderBottom: '1px solid #ece9f5', boxShadow: '0 1px 6px rgba(139,127,212,0.06)' }}
      >
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          {/* 뒤로가기 */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: '#9e9ab8' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            대시보드
          </button>

          <div className="flex items-center gap-3 flex-1">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background: 'linear-gradient(135deg, #8b7fd4, #6a5fc4)' }}
            >
              {ticker.slice(0, 2)}
            </div>
            <div className="hidden sm:block">
              <p className="font-bold text-base" style={{ color: '#18162a' }}>{ticker}</p>
              <p className="text-xs" style={{ color: '#9e9ab8' }}>뉴스 감성 분석</p>
            </div>

            {/* 티커 변경 검색바 */}
            <form
              onSubmit={e => {
                e.preventDefault()
                const val = (e.currentTarget.elements.namedItem('jump') as HTMLInputElement).value.trim().toUpperCase()
                if (val && val !== ticker) router.push(`/stock/${val}`)
              }}
              className="flex gap-1.5 ml-2"
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

          <div className="flex items-center gap-2">
            {/* 관심 종목 버튼 */}
            {isAuthenticated && (
              <button
                onClick={toggleWatchlist}
                disabled={watchlistLoading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: inWatchlist ? '#fef3c7' : '#f8f7fd',
                  color:      inWatchlist ? '#d97706' : '#9e9ab8',
                  border: `1.5px solid ${inWatchlist ? '#fcd34d' : '#ece9f5'}`,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24"
                  fill={inWatchlist ? 'currentColor' : 'none'}
                  stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                {inWatchlist ? '관심 종목' : '+ 관심 추가'}
              </button>
            )}

            {/* 언어 토글 */}
            <button
              onClick={() => setIsKorean(!isKorean)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: isKorean ? '#f0eefb' : '#f8f7fd',
                color:      isKorean ? '#8b7fd4' : '#9e9ab8',
                border: `1.5px solid ${isKorean ? '#d4cff2' : '#ece9f5'}`,
              }}
            >
              {isKorean ? '한국어' : 'English'}
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
          <div style={{ ...CARD, padding: '6px 8px', display: 'inline-flex', gap: '2px' }}>
            {detailTabs.map(t => (
              <TabBtn key={t.key} active={activeTab === t.key} onClick={() => setActiveTab(t.key)}>
                {t.label}
              </TabBtn>
            ))}
          </div>
        )}

        {/* ── 개요 탭 ─────────────────────────────────────── */}
        {!loading && news.length > 0 && activeTab === 'overview' && (
          <div className="space-y-5">
            {/* 기간 탭 */}
            <div style={{ ...CARD, padding: '6px 8px', display: 'inline-flex', gap: '2px' }}>
              {[
                { label: '24시간', value: 24 },
                { label: '3일',   value: 72 },
                { label: '7일',   value: 168 },
                { label: '30일',  value: 720 },
              ].map(({ label, value }) => (
                <TabBtn key={value} active={timeRange === value} onClick={() => setTimeRange(value)}>
                  {label}
                </TabBtn>
              ))}
            </div>

            {/* 일별 감성 추이 — 핵심 차트 */}
            <SentimentTrendChart ticker={ticker} />

            <div className="grid lg:grid-cols-2 gap-5">
              <SentimentChart ticker={ticker} hours={timeRange} />
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

        {/* ── 뉴스 탭 ─────────────────────────────────────── */}
        {(activeTab === 'news' || (activeTab === 'overview' && !loading && news.length > 0)) && (
          <div className="space-y-3">
            {/* 필터 */}
            {!loading && news.length > 0 && (
              <div style={{ ...CARD, padding: '6px 8px', display: 'inline-flex', gap: '2px' }}>
                <TabBtn active={filter === 'ALL'}      onClick={() => setFilter('ALL')}>전체 ({stats.total})</TabBtn>
                <TabBtn active={filter === 'POSITIVE'} onClick={() => setFilter('POSITIVE')} color="#22c55e">긍정 ({stats.positive})</TabBtn>
                <TabBtn active={filter === 'NEGATIVE'} onClick={() => setFilter('NEGATIVE')} color="#f43f5e">부정 ({stats.negative})</TabBtn>
                <TabBtn active={filter === 'NEUTRAL'}  onClick={() => setFilter('NEUTRAL')}  color="#8b8fa8">중립 ({stats.neutral})</TabBtn>
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
    </div>
  )
}
