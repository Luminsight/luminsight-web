'use client'
import { useState, useEffect } from 'react'
import { newsApi } from '@/lib/api'
import type { News } from '@/types'
import SentimentChart from '@/components/SentimentChart'
import SentimentDonutChart from '@/components/SentimentDonutChart'

type SentimentFilter = 'ALL' | 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'

export default function DashboardPage() {
  const [ticker, setTicker] = useState('AAPL')
  const [news, setNews] = useState<News[]>([])
  const [filteredNews, setFilteredNews] = useState<News[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<SentimentFilter>('ALL')
  const [timeRange, setTimeRange] = useState(24)
  const [isKorean, setIsKorean] = useState(true) // 언어 토글 상태

  // 뉴스 가져오기
  const fetchNews = async (tickerSymbol: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await newsApi.getNewsByTicker(tickerSymbol.toUpperCase(), 50)
      setNews(data)
      setFilteredNews(data)
    } catch (err: any) {
      console.error('뉴스 로드 실패:', err)
      setError('뉴스를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
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
              <span className="text-sm text-text-secondary font-medium">
                📅 시간 범위:
              </span>
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
            {filteredNews.map((item) => {
              const hasTranslation = item.titleKo !== null
              const displayTitle = isKorean && hasTranslation ? item.titleKo! : item.title
              const displayContent = isKorean && item.contentKo ? item.contentKo : item.content
              const displayReasoning = isKorean && item.sentimentReasoningKo
                ? item.sentimentReasoningKo
                : item.sentimentReasoning

              return (
                <article key={item.id} className="card hover-lift fade-in">
                  {/* 상단: 감성 배지 + 번역 상태 + 날짜 */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full font-semibold text-sm ${
                          item.sentimentLabel === 'POSITIVE'
                            ? 'bg-positive/20 text-positive border border-positive/30'
                            : item.sentimentLabel === 'NEGATIVE'
                            ? 'bg-negative/20 text-negative border border-negative/30'
                            : 'bg-neutral/20 text-neutral border border-neutral/30'
                        }`}
                      >
                        {item.sentimentLabel === 'POSITIVE' ? '✅' : item.sentimentLabel === 'NEGATIVE' ? '❌' : '⚪'} {item.sentimentScore?.toFixed(2)}
                      </span>
                      {hasTranslation ? (
                        <span className="text-xs px-2 py-1 rounded-md bg-accent-green/10 text-accent-green border border-accent-green/30">
                          ✓ 번역됨
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-md bg-text-muted/10 text-text-muted border border-text-muted/30">
                          번역 대기
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <span>📅 {new Date(item.publishedAt).toLocaleDateString('ko-KR')}</span>
                      <span>📰 {item.source}</span>
                    </div>
                  </div>

                  {/* 제목 */}
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    <h2 className="text-lg font-bold text-text-primary group-hover:text-accent-cyan transition-colors mb-2">
                      {displayTitle} 🔗
                    </h2>
                  </a>

                  {/* 본문 */}
                  <p className="text-sm text-text-secondary mb-3 line-clamp-2">
                    {displayContent}
                  </p>

                  {/* 감성 분석 이유 */}
                  {displayReasoning && (
                    <details className="mt-3">
                      <summary className="text-sm text-text-secondary cursor-pointer hover:text-text-primary transition-colors">
                        💡 감성 분석 이유
                      </summary>
                      <p className="mt-2 text-sm text-text-tertiary glass p-3 rounded-lg border border-border">
                        {displayReasoning}
                      </p>
                    </details>
                  )}
                </article>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 card">
            <p className="text-text-secondary">뉴스가 없습니다.</p>
            <p className="text-sm text-text-muted mt-2">
              다른 티커를 검색해보세요.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
