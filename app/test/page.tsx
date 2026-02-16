'use client'

import { useState } from 'react'
import { newsApi } from '@/lib/api'
import type { News } from '@/types'

export default function TestPage() {
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNews = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await newsApi.getNewsByTicker('AAPL', 10)
      setNews(data)
      console.log('뉴스 데이터:', data)
    } catch (err) {
      console.error('에러 발생:', err)
      setError('뉴스를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">백엔드 API 테스트</h1>

      <button
        onClick={fetchNews}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {loading ? '로딩 중...' : 'AAPL 뉴스 가져오기'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {news.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xl font-bold mb-2">뉴스 {news.length}개</h2>
          {news.map((item) => (
            <div key={item.id} className="border p-4 mb-2 rounded hover:shadow-lg transition-shadow">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-blue-600 hover:text-blue-800 hover:underline block mb-2"
              >
                {item.title} 🔗
              </a>
              <p className="text-sm text-gray-600">
                감성: <span className={
                  item.sentimentLabel === 'POSITIVE' ? 'text-green-600 font-semibold' :
                  item.sentimentLabel === 'NEGATIVE' ? 'text-red-600 font-semibold' :
                  'text-gray-600 font-semibold'
                }>
                  {item.sentimentLabel}
                </span> ({item.sentimentScore?.toFixed(2)})
              </p>
              <p className="text-xs text-gray-400">
                {new Date(item.publishedAt).toLocaleString('ko-KR')}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                출처: {item.source}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
