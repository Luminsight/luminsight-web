'use client'

import { useState, useEffect } from 'react'
import { newsApi } from '@/lib/api'
import type { News } from '@/types'

type SentimentFilter = 'ALL' | 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'

export default function DashboardPage() {
  const [ticker, setTicker] = useState('AAPL')
  const [news, setNews] = useState<News[]>([])
  const [filteredNews, setFilteredNews] = useState<News[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<SentimentFilter>('ALL')

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

  // 티커 검색 핸들러
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (ticker.trim()) {
      fetchNews(ticker)
      setFilter('ALL')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900">
              📊 LuminSight
            </h1>

            {/* 티커 검색 */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="티커 입력 (예: AAPL)"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                maxLength={10}
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {loading ? '로딩...' : '검색'}
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* 감성 통계 */}
        {!loading && news.length > 0 && (
          <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">전체</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg shadow">
              <p className="text-sm text-green-600">긍정</p>
              <p className="text-2xl font-bold text-green-700">{stats.positive}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg shadow">
              <p className="text-sm text-red-600">부정</p>
              <p className="text-2xl font-bold text-red-700">{stats.negative}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">중립</p>
              <p className="text-2xl font-bold text-gray-700">{stats.neutral}</p>
            </div>
          </div>
        )}

        {/* 필터 버튼 */}
        {!loading && news.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'ALL'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              전체 ({stats.total})
            </button>
            <button
              onClick={() => setFilter('POSITIVE')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'POSITIVE'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              긍정 ({stats.positive})
            </button>
            <button
              onClick={() => setFilter('NEGATIVE')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'NEGATIVE'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              부정 ({stats.negative})
            </button>
            <button
              onClick={() => setFilter('NEUTRAL')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'NEUTRAL'
                  ? 'bg-gray-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              중립 ({stats.neutral})
            </button>
          </div>
        )}

        {/* 뉴스 목록 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">뉴스를 불러오는 중...</p>
          </div>
        ) : filteredNews.length > 0 ? (
          <div className="grid gap-4">
            {filteredNews.map((item) => (
              <article
                key={item.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                    {item.title} 🔗
                  </h2>
                </a>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {item.content}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span
                    className={`px-3 py-1 rounded-full font-semibold ${
                      item.sentimentLabel === 'POSITIVE'
                        ? 'bg-green-100 text-green-700'
                        : item.sentimentLabel === 'NEGATIVE'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {item.sentimentLabel} {item.sentimentScore?.toFixed(2)}
                  </span>
                  <span className="text-gray-500">
                    📅 {new Date(item.publishedAt).toLocaleDateString('ko-KR')}
                  </span>
                  <span className="text-gray-500">
                    📰 {item.source}
                  </span>
                </div>

                {item.sentimentReasoning && (
                  <details className="mt-3">
                    <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                      💡 감성 분석 이유
                    </summary>
                    <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      {item.sentimentReasoning}
                    </p>
                  </details>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">뉴스가 없습니다.</p>
            <p className="text-sm text-gray-500 mt-2">
              다른 티커를 검색해보세요.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
