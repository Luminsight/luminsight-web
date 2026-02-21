'use client'
import { useState, useEffect } from 'react'
import { newsApi } from '@/lib/api'
import type { News, NewsSummary } from '@/types'
import SentimentChart from '@/components/SentimentChart'
import SentimentDonutChart from '@/components/SentimentDonutChart'
import NewsCard from '@/components/NewsCard'

type SentimentFilter = 'ALL' | 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'

export default function DashboardPage() {
  const [ticker, setTicker] = useState('AAPL')
  const [news, setNews] = useState<News[]>([])
  const [filteredNews, setFilteredNews] = useState<News[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<SentimentFilter>('ALL')
  const [timeRange, setTimeRange] = useState(24)
  const [isKorean, setIsKorean] = useState(true) // 전체 언어 토글

  // AI 브리핑 상태
  const [summary, setSummary] = useState<NewsSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [showSummary, setShowSummary] = useState(true)

  // 뉴스 가져오기
  const fetchNews = async (tickerSymbol: string) => {
    setLoading(true)
    setError(null)
    setSummary(null)
    setSummaryError(null)
    try {
      const data = await newsApi.getNewsByTicker(tickerSymbol.toUpperCase(), 50)
      setNews(data)
      setFilteredNews(data)
      // 뉴스 로드 후 자동으로 AI 브리핑 생성
      if (data.length > 0) {
        fetchSummary(tickerSymbol.toUpperCase())
      }
    } catch (err: any) {
      console.error('뉴스 로드 실패:', err)
      setError('뉴스를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // AI 브리핑 가져오기
  const fetchSummary = async (tickerSymbol: string) => {
    setSummaryLoading(true)
    setSummaryError(null)
    try {
      const data = await newsApi.getSummary(tickerSymbol)
      setSummary(data)
    } catch (err: any) {
      console.error('AI 브리핑 로드 실패:', err)
      setSummaryError('AI 브리핑을 불러오는데 실패했습니다.')
    } finally {
      setSummaryLoading(false)
    }
  }

  // 초기 로드
  useEffect(() => {
    fetchNews(ticker)
  }, [])

  // 필터 적용
  useEffect(() => {
    if (filter === 'ALL') {
      setFilteredNews(news)
    } else {
      setFilteredNews(news.filter(item => item.sentimentLabel === filter))
    }
  }, [filter, news])

  // 감성 통계 계산
  const stats = {
    total: news.length,
    positive: news.filter(n => n.sentimentLabel === 'POSITIVE').length,
    negative: news.filter(n => n.sentimentLabel === 'NEGATIVE').length,
    neutral: news.filter(n => n.sentimentLabel === 'NEUTRAL').length,
  }

  // 번역된 뉴스 개수
  const translatedCount = news.filter(n => n.titleKo !== null).length

  // 티커 검색 핸들러
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (ticker.trim()) {
      fetchNews(ticker)
      setFilter('ALL')
    }
  }

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <header className="glass border-b border-border-light backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* 티커 검색 */}
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="티커 입력 (예: AAPL)"
                className="px-4 py-2 glass border border-border rounded-lg focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 uppercase text-text-primary placeholder:text-text-muted transition-all"
                maxLength={10}
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-br from-accent-blue to-blue-700 text-white rounded-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
              >
                {loading ? '로딩...' : '검색'}
              </button>
            </form>

            {/* 언어 토글 버튼 */}
            <div className="flex items-center gap-3">
              {!loading && news.length > 0 && (
                <span className="text-xs text-text-muted hidden sm:block">
                  번역 {translatedCount}/{news.length}
                </span>
              )}
              <button
                onClick={() => setIsKorean(!isKorean)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  isKorean
                    ? 'bg-gradient-to-br from-accent-blue to-blue-700 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]'
                    : 'glass border border-border text-text-secondary hover:border-accent-blue hover:text-accent-blue'
                }`}
              >
                🌐 {isKorean ? '한국어' : 'English'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 glass border-2 border-negative/50 text-negative rounded-lg neon-border-red fade-in">
            ❌ {error}
          </div>
        )}

        {/* AI 브리핑 섹션 */}
        {!loading && news.length > 0 && (
          <div className="mb-6 fade-in">
            <div className="card">
              {/* 브리핑 헤더 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg">🤖</span>
                  <h2 className="font-bold text-text-primary">AI 뉴스 브리핑</h2>
                  <span className="text-xs text-text-muted px-2 py-0.5 rounded-full bg-accent-blue/10 border border-accent-blue/20">
                    {ticker}
                  </span>
                  {summary && (
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        summary.overallSentiment === 'POSITIVE'
                          ? 'bg-positive/20 text-positive border border-positive/30'
                          : summary.overallSentiment === 'NEGATIVE'
                          ? 'bg-negative/20 text-negative border border-negative/30'
                          : 'bg-neutral/20 text-neutral border border-neutral/30'
                      }`}
                    >
                      {summary.overallSentiment === 'POSITIVE'
                        ? '✅ 긍정'
                        : summary.overallSentiment === 'NEGATIVE'
                        ? '❌ 부정'
                        : '⚪ 중립'}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowSummary(!showSummary)}
                  className="text-xs text-text-muted hover:text-text-secondary transition-colors ml-2 shrink-0"
                >
                  {showSummary ? '접기 ▲' : '펼치기 ▼'}
                </button>
              </div>

              {showSummary && (
                <>
                  {summaryLoading ? (
                    <div className="flex items-center gap-3 py-4">
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-accent-blue"></div>
                      <span className="text-sm text-text-secondary">AI가 뉴스를 분석하고 있습니다...</span>
                    </div>
                  ) : summaryError ? (
                    <div className="text-sm text-negative py-2">
                      {summaryError}
                      <button
                        onClick={() => fetchSummary(ticker)}
                        className="ml-2 underline hover:no-underline"
                      >
                        재시도
                      </button>
                    </div>
                  ) : summary ? (
                    <>
                      <p className="text-sm text-text-secondary leading-relaxed mb-3">
                        {summary.summary}
                      </p>
                      <div className="flex items-center flex-wrap gap-3 text-xs text-text-muted border-t border-border pt-3">
                        <span>
                          분석 기준: 최근 뉴스{' '}
                          {summary.positiveCount + summary.negativeCount + summary.neutralCount}건
                        </span>
                        <span>✅ 긍정 {summary.positiveCount}</span>
                        <span>❌ 부정 {summary.negativeCount}</span>
                        <span>⚪ 중립 {summary.neutralCount}</span>
                        {summary.generatedAt && (
                          <span className="ml-auto">
                            생성: {new Date(summary.generatedAt).toLocaleTimeString('ko-KR')}
                          </span>
                        )}
                      </div>
                    </>
                  ) : null}
                </>
              )}
            </div>
          </div>
        )}

        {/* 통계 요약 카드 */}
        {!loading && news.length > 0 && (
          <div className="mb-6 fade-in">
            <div className="card card-glow hover-lift text-center">
              <p className="text-sm text-text-secondary mb-2">📊 총 뉴스 개수</p>
              <p className="text-5xl font-bold gradient-text mb-2">{stats.total}</p>
              <p className="text-sm text-text-muted">
                감성 분석 완료된 뉴스 • 상세 비율은 차트에서 확인
              </p>
            </div>
          </div>
        )}

        {/* 감성 시계열 차트 */}
        {!loading && news.length > 0 && (
          <div className="mb-6">
            <div className="mb-4 flex flex-wrap gap-2 items-center">
              <span className="text-sm text-text-secondary font-medium">📅 시간 범위:</span>
              {[
                { label: '24시간', value: 24 },
                { label: '3일', value: 72 },
                { label: '7일', value: 168 },
                { label: '30일', value: 720 },
              ].map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setTimeRange(value)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    timeRange === value
                      ? 'bg-gradient-to-br from-accent-blue to-blue-700 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]'
                      : 'glass border border-border text-text-secondary hover:border-accent-blue hover:text-accent-blue'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <SentimentChart ticker={ticker} hours={timeRange} />
              <SentimentDonutChart
                positive={stats.positive}
                negative={stats.negative}
                neutral={stats.neutral}
              />
            </div>
          </div>
        )}

        {/* 필터 버튼 */}
        {!loading && news.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                filter === 'ALL'
                  ? 'bg-gradient-to-br from-accent-blue to-blue-700 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]'
                  : 'glass border border-border text-text-secondary hover:border-accent-blue hover:text-accent-blue'
              }`}
            >
              📊 전체 ({stats.total})
            </button>
            <button
              onClick={() => setFilter('POSITIVE')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                filter === 'POSITIVE'
                  ? 'bg-gradient-to-br from-positive to-green-700 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                  : 'glass border border-border text-text-secondary hover:border-positive hover:text-positive'
              }`}
            >
              ✅ 긍정 ({stats.positive})
            </button>
            <button
              onClick={() => setFilter('NEGATIVE')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                filter === 'NEGATIVE'
                  ? 'bg-gradient-to-br from-negative to-red-700 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                  : 'glass border border-border text-text-secondary hover:border-negative hover:text-negative'
              }`}
            >
              ❌ 부정 ({stats.negative})
            </button>
            <button
              onClick={() => setFilter('NEUTRAL')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                filter === 'NEUTRAL'
                  ? 'bg-gradient-to-br from-neutral to-gray-700 text-white shadow-[0_0_20px_rgba(107,114,128,0.4)]'
                  : 'glass border border-border text-text-secondary hover:border-neutral hover:text-neutral'
              }`}
            >
              ⚪ 중립 ({stats.neutral})
            </button>
          </div>
        )}

        {/* 뉴스 목록 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue glow-effect"></div>
            <p className="mt-4 text-text-secondary">뉴스를 불러오는 중...</p>
          </div>
        ) : filteredNews.length > 0 ? (
          <div className="grid gap-4">
            {filteredNews.map((item) => (
              <NewsCard
                key={item.id}
                news={item}
                globalIsKorean={isKorean}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 card">
            <p className="text-text-secondary">뉴스가 없습니다.</p>
            <p className="text-sm text-text-muted mt-2">다른 티커를 검색해보세요.</p>
          </div>
        )}
      </main>
    </div>
  )
}
