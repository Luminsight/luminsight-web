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

  const getSentimentStyle = (score: number) => {
    if (score >= 0.5) return { color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' }
    if (score <= -0.5) return { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' }
    return { color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' }
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

  const displayTitle    = isKorean && hasTranslation ? news.titleKo    : news.title
  const displayContent  = isKorean && hasTranslation ? news.contentKo  : news.content
  const displayReasoning = isKorean && hasTranslation ? news.sentimentReasoningKo : news.sentimentReasoning

  const sentStyle = getSentimentStyle(news.sentimentScore)

  return (
    <article
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
      }}
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.07)'
        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
      }}
    >
      {/* 헤더 */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* 티커 배지 */}
          <span style={{
            padding: '3px 10px',
            borderRadius: '8px',
            background: '#3d5af1',
            color: '#fff',
            fontWeight: 700,
            fontSize: '13px',
            letterSpacing: '0.02em',
          }}>
            {news.ticker}
          </span>

          {/* 감성 점수 */}
          <span style={{ fontSize: '18px' }}>{getSentimentIcon(news.sentimentScore)}</span>
          <span style={{ fontWeight: 700, fontSize: '16px', color: sentStyle.color }}>
            {news.sentimentScore >= 0 ? '+' : ''}{news.sentimentScore.toFixed(2)}
          </span>

          {/* 신뢰도 */}
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            신뢰도 <strong style={{ color: '#475569' }}>{(news.confidence * 100).toFixed(0)}%</strong>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* 번역 상태 */}
          {hasTranslation ? (
            <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}>
              ✓ 번역됨
            </span>
          ) : (
            <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: '#f8fafc', color: '#94a3b8', border: '1px solid #e2e8f0' }}>
              번역 대기
            </span>
          )}

          {/* 언어 토글 */}
          {hasTranslation && (
            <button
              onClick={handleToggle}
              title={localOverride !== null ? '클릭 시 전체 설정으로 되돌림' : '클릭 시 개별 설정'}
              style={{
                padding: '3px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                border: 'none',
                background: isKorean ? '#3d5af1' : '#f1f5f9',
                color: isKorean ? '#fff' : '#475569',
                transition: 'all 0.15s ease',
              }}
            >
              {localOverride !== null && <span style={{ color: '#fbbf24', fontSize: '10px' }}>✦</span>}
              {isKorean ? 'KO' : 'EN'}
            </button>
          )}
        </div>
      </div>

      {/* 본문 */}
      <div style={{ padding: '18px 20px', background: sentStyle.bg }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '10px', lineHeight: 1.5 }}>
          {displayTitle}
        </h3>
        <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.7, marginBottom: '14px',
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {displayContent}
        </p>

        {/* AI 분석 박스 */}
        <div style={{
          background: '#ffffff',
          border: `1px solid ${sentStyle.border}`,
          borderRadius: '10px',
          padding: '12px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px' }}>🤖</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>AI 감성 분석</span>
          </div>
          <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.65, margin: 0 }}>{displayReasoning}</p>
        </div>

        {/* 푸터 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
            🕒 {formatDate(news.publishedAt)}
          </span>
          <a
            href={news.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '12px', fontWeight: 600, color: '#3d5af1', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
          >
            원문 보기
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </article>
  )
}
