'use client'

import { useState } from 'react'
import type { News } from '@/types'

interface NewsCardProps {
  news: News
  globalIsKorean: boolean
}

export default function NewsCard({ news, globalIsKorean }: NewsCardProps) {
  const [localOverride, setLocalOverride] = useState<boolean | null>(null)
  const isKorean = localOverride !== null ? localOverride : globalIsKorean
  const hasTranslation = news.titleKo !== null && news.contentKo !== null

  const handleToggle = () => {
    if (localOverride === null) {
      setLocalOverride(!globalIsKorean)
    } else {
      setLocalOverride(null)
    }
  }

  const getSentimentColor = (score: number) => {
    if (score >= 0.5) return 'text-accent-green'
    if (score <= -0.5) return 'text-accent-pink'
    return 'text-text-secondary'
  }

  const getSentimentGradient = (score: number) => {
    if (score >= 0.5) return 'from-green-500/10 to-transparent'
    if (score <= -0.5) return 'from-pink-500/10 to-transparent'
    return 'from-gray-500/10 to-transparent'
  }

  const getSentimentIcon = (score: number) => {
    if (score >= 0.5) return '📈'
    if (score <= -0.5) return '📉'
    return '➖'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffMins < 60) return `${diffMins}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    if (diffDays < 7) return `${diffDays}일 전`
    return date.toLocaleDateString('ko-KR')
  }

  const displayTitle = isKorean && hasTranslation ? news.titleKo : news.title
  const displayContent = isKorean && hasTranslation ? news.contentKo : news.content
  const displayReasoning = isKorean && hasTranslation ? news.sentimentReasoningKo : news.sentimentReasoning

  return (
    <article className="glass rounded-xl border border-border hover:border-accent-blue transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] overflow-hidden">
      <div className="p-4 border-b border-border flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-lg bg-gradient-to-br from-accent-blue to-blue-700 text-white font-bold text-sm shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            {news.ticker}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xl">{getSentimentIcon(news.sentimentScore)}</span>
            <span className={`font-bold text-lg ${getSentimentColor(news.sentimentScore)}`}>
              {news.sentimentScore >= 0 ? '+' : ''}{news.sentimentScore.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-text-muted">신뢰도</span>
            <span className="text-sm font-semibold text-accent-cyan">
              {(news.confidence * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasTranslation ? (
            <span className="text-xs px-2 py-1 rounded-md bg-accent-green/20 text-accent-green border border-accent-green/30">
              ✓ 번역됨
            </span>
          ) : (
            <span className="text-xs px-2 py-1 rounded-md bg-text-muted/20 text-text-muted border border-text-muted/30">
              번역 대기
            </span>
          )}
          {hasTranslation && (
            <button
              onClick={handleToggle}
              title={localOverride !== null ? '클릭 시 전체 설정으로 되돌림' : '클릭 시 개별 설정'}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1 ${
                isKorean
                  ? 'bg-gradient-to-br from-accent-blue to-blue-700 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                  : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary border border-border'
              }`}
            >
              {localOverride !== null && <span className="text-yellow-300 text-[10px]">✦</span>}
              {isKorean ? 'KO' : 'EN'}
            </button>
          )}
        </div>
      </div>

      <div className={`bg-gradient-to-br ${getSentimentGradient(news.sentimentScore)} p-6`}>
        <h3 className="text-xl font-bold text-text-primary mb-3 leading-tight">{displayTitle}</h3>
        <p className="text-text-secondary leading-relaxed mb-4 line-clamp-3">{displayContent}</p>
        <div className="glass rounded-lg p-4 border border-border-light">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">🤖</span>
            <span className="text-xs font-semibold text-accent-cyan">AI 감성 분석</span>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">{displayReasoning}</p>
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span>🕒</span>
            <span>{formatDate(news.publishedAt)}</span>
          </div>
          <a href={news.url} target="_blank" rel="noopener noreferrer"
            className="text-xs font-semibold text-accent-cyan hover:text-accent-blue transition-colors flex items-center gap-1">
            원문 보기
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </article>
  )
}