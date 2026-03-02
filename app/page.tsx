'use client'
import { useState, useEffect } from 'react'
import { newsApi } from '@/lib/api'
import type { News, NewsSummary } from '@/types'
import SentimentChart from '@/components/SentimentChart'
import SentimentDonutChart from '@/components/SentimentDonutChart'
import NewsCard from '@/components/NewsCard'
import NewsCardSkeleton from '@/components/NewsCardSkeleton'
import TechnicalPanel from '@/components/TechnicalPanel'
import FundamentalPanel from '@/components/FundamentalPanel'
import PeerComparisonTable from '@/components/PeerComparisonTable'

type SentimentFilter = 'ALL' | 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'

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


export default function DashboardPage() {
  const [ticker, setTicker] = useState('AAPL')
  const [news, setNews]     = useState<News[]>([])
  const [filteredNews, setFilteredNews] = useState<News[]>([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [filter, setFilter]     = useState<SentimentFilter>('ALL')
  const [timeRange, setTimeRange] = useState(24)
  const [isKorean, setIsKorean]   = useState(true)

  const [summary, setSummary]               = useState<NewsSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError]     = useState<string | null>(null)
  const [showSummary, setShowSummary]       = useState(true)

  const fetchNews = async (sym: string) => {
    setLoading(true); setError(null); setSummary(null); setSummaryError(null)
    try {
      const data = await newsApi.getNewsByTicker(sym.toUpperCase(), 50)
      setNews(data); setFilteredNews(data)
      if (data.length > 0) fetchSummary(sym.toUpperCase())
    } catch {
      setError('뉴스를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = async (sym: string) => {
    setSummaryLoading(true); setSummaryError(null)
    try { setSummary(await newsApi.getSummary(sym)) }
    catch { setSummaryError('AI 브리핑을 불러오는데 실패했습니다.') }
    finally { setSummaryLoading(false) }
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

  const overallColor = (s: string) =>
    s === 'POSITIVE' ? '#22c55e' : s === 'NEGATIVE' ? '#f43f5e' : '#8b8fa8'
  const overallLabel = (s: string) =>
    s === 'POSITIVE' ? '긍정' : s === 'NEGATIVE' ? '부정' : '중립'

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4fa' }}>

      {/* ── 헤더 ────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30 px-6 py-3"
        style={{ background: '#ffffff', borderBottom: '1px solid #ece9f5', boxShadow: '0 1px 6px rgba(139,127,212,0.06)' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-sm">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="15" height="15"
                viewBox="0 0 24 24" fill="none" stroke="#9e9ab8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text" value={ticker}
                onChange={e => setTicker(e.target.value.toUpperCase())}
                placeholder="티커 입력 (예: AAPL)"
                maxLength={10}
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl uppercase outline-none transition-all"
                style={{ background: '#f8f7fd', border: '1.5px solid #ece9f5', color: '#18162a' }}
                onFocus={e  => (e.target.style.borderColor = '#8b7fd4')}
                onBlur={e   => (e.target.style.borderColor = '#ece9f5')}
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #8b7fd4, #6a5fc4)' }}
            >
              {loading ? '로딩...' : '검색'}
            </button>
          </form>

          <div className="flex items-center gap-3">
            {!loading && news.length > 0 && (
              <span className="text-xs hidden sm:block" style={{ color: '#9e9ab8' }}>
                번역 {translatedCount}/{news.length}
              </span>
            )}
            <button
              onClick={() => setIsKorean(!isKorean)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: isKorean ? '#f0eefb' : '#f8f7fd',
                color:      isKorean ? '#8b7fd4' : '#9e9ab8',
                border: `1.5px solid ${isKorean ? '#d4cff2' : '#ece9f5'}`,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              {isKorean ? '한국어' : 'English'}
            </button>
          </div>
        </div>
      </header>

      {/* ── 메인 ────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-2xl text-sm fade-in"
            style={{ background: '#fff1f3', border: '1px solid #ffd5db', color: '#f43f5e' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* ── AI 브리핑 히어로 카드 ────────────────── */}
        {!loading && news.length > 0 && (
          <div className="fade-in" style={{
            background: 'linear-gradient(135deg, #8b7fd4 0%, #6a5fc4 100%)',
            borderRadius: '20px',
            padding: '28px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(139,127,212,0.28)',
          }}>
            {/* 배경 장식 원 */}
            <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160,
              borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -30, right: 60, width: 100, height: 100,
              borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: 20, right: 100, width: 60, height: 60,
              borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 flex-wrap">
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
                <button onClick={() => setShowSummary(!showSummary)}
                  className="text-xs transition-colors" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {showSummary ? '접기 ▲' : '펼치기 ▼'}
                </button>
              </div>

              {showSummary && (
                summaryLoading ? (
                  <div className="flex items-center gap-3 py-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent"
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
                      <span style={{ color: 'rgba(255,255,255,0.65)' }}>최근 {summary.positiveCount + summary.negativeCount + summary.neutralCount}건 분석</span>
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
                ) : null
              )}
            </div>
          </div>
        )}

        {/* ── 차트 ─────────────────────────────────── */}
        {!loading && news.length > 0 && (
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

            <div className="grid lg:grid-cols-2 gap-5">
              <SentimentChart ticker={ticker} hours={timeRange} />
              <SentimentDonutChart positive={stats.positive} negative={stats.negative} neutral={stats.neutral} />
            </div>

            <TechnicalPanel ticker={ticker} />

            {/* 펀더멘털 분석 */}
            <FundamentalPanel ticker={ticker} />

            {/* 동종업계 비교 */}
            <PeerComparisonTable ticker={ticker} />
          </div>
        )}

        {/* ── 뉴스 필터 탭 ─────────────────────────── */}
        {!loading && news.length > 0 && (
          <div style={{ ...CARD, padding: '6px 8px', display: 'inline-flex', gap: '2px' }}>
            <TabBtn active={filter === 'ALL'}      onClick={() => setFilter('ALL')}>전체 ({stats.total})</TabBtn>
            <TabBtn active={filter === 'POSITIVE'} onClick={() => setFilter('POSITIVE')} color="#22c55e">긍정 ({stats.positive})</TabBtn>
            <TabBtn active={filter === 'NEGATIVE'} onClick={() => setFilter('NEGATIVE')} color="#f43f5e">부정 ({stats.negative})</TabBtn>
            <TabBtn active={filter === 'NEUTRAL'}  onClick={() => setFilter('NEUTRAL')}  color="#8b8fa8">중립 ({stats.neutral})</TabBtn>
          </div>
        )}

        {/* ── 뉴스 목록 ─────────────────────────────── */}
        {loading ? (
          <div className="grid gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <NewsCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredNews.length > 0 ? (
          <div className="grid gap-3">
            {filteredNews.map(item => (
              <NewsCard key={item.id} news={item} globalIsKorean={isKorean} />
            ))}
          </div>
        ) : (
          <div style={{ ...CARD, textAlign: 'center', paddingTop: 48, paddingBottom: 48 }}>
            <p className="font-medium" style={{ color: '#5e5a78' }}>뉴스가 없습니다.</p>
            <p className="text-sm mt-1" style={{ color: '#9e9ab8' }}>다른 티커를 검색해보세요.</p>
          </div>
        )}
      </main>
    </div>
  )
}
