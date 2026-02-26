'use client'

import { useState } from 'react'
import type { News } from '@/types'

interface Props { news: News; globalIsKorean: boolean }

export default function NewsCard({ news, globalIsKorean }: Props) {
  const [localOverride, setLocalOverride] = useState<boolean | null>(null)
  const isKorean     = localOverride !== null ? localOverride : globalIsKorean
  const hasTranslation = news.titleKo !== null && news.contentKo !== null

  const handleToggle = () => setLocalOverride(localOverride === null ? !globalIsKorean : null)

  const sentStyle = (score: number) => {
    if (score >= 0.5) return { color: '#22c55e', bg: '#f0fdf4', border: 'rgba(34,197,94,0.2)'  }
    if (score <= -0.5) return { color: '#f43f5e', bg: '#fff1f3', border: 'rgba(244,63,94,0.2)'  }
    return { color: '#8b8fa8', bg: '#f8f7fd', border: '#ece9f5' }
  }
  const icon = (score: number) => score >= 0.5 ? '📈' : score <= -0.5 ? '📉' : '➖'

  const fmtDate = (s: string) => {
    const d = new Date(s), now = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
    if (diff < 3600)  return `${Math.floor(diff / 60)}분 전`
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
    if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`
    return d.toLocaleDateString('ko-KR')
  }

  const title    = isKorean && hasTranslation ? news.titleKo    : news.title
  const content  = isKorean && hasTranslation ? news.contentKo  : news.content
  const reason   = isKorean && hasTranslation ? news.sentimentReasoningKo : news.sentimentReasoning
  const st       = sentStyle(news.sentimentScore)

  return (
    <article
      style={{ background: '#ffffff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(139,127,212,0.08)' }}
      className="transition-all duration-200 hover:shadow-[0_4px_20px_rgba(139,127,212,0.15)] hover:-translate-y-0.5"
    >
      {/* 헤더 바 */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #f8f7fd', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ padding: '3px 10px', borderRadius: 8, background: 'linear-gradient(135deg,#8b7fd4,#6a5fc4)', color: '#fff', fontWeight: 700, fontSize: 12 }}>
            {news.ticker}
          </span>
          <span style={{ fontSize: 16 }}>{icon(news.sentimentScore)}</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: st.color }}>
            {news.sentimentScore >= 0 ? '+' : ''}{news.sentimentScore.toFixed(2)}
          </span>
          <span style={{ fontSize: 11, color: '#9e9ab8' }}>
            신뢰도 <b style={{ color: '#5e5a78' }}>{(news.confidence * 100).toFixed(0)}%</b>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {hasTranslation
            ? <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>✓ 번역됨</span>
            : <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#f8f7fd', color: '#c4c0d8', border: '1px solid #ece9f5' }}>번역 대기</span>
          }
          {hasTranslation && (
            <button onClick={handleToggle}
              title={localOverride !== null ? '전체 설정으로 되돌림' : '개별 설정'}
              style={{ padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, border: 'none', background: isKorean ? '#8b7fd4' : '#f0eefb', color: isKorean ? '#fff' : '#8b7fd4', transition: 'all 0.15s' }}>
              {localOverride !== null && <span style={{ color: '#fbbf24', fontSize: 10 }}>✦</span>}
              {isKorean ? 'KO' : 'EN'}
            </button>
          )}
        </div>
      </div>

      {/* 본문 */}
      <div style={{ padding: '18px 20px', background: st.bg }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#18162a', marginBottom: 10, lineHeight: 1.5 }}>{title}</h3>
        <p style={{ fontSize: 13, color: '#5e5a78', lineHeight: 1.7, marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {content}
        </p>
        <div style={{ background: '#ffffff', border: `1px solid ${st.border}`, borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 13 }}>🤖</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#8b7fd4', letterSpacing: '0.05em' }}>AI 감성 분석</span>
          </div>
          <p style={{ fontSize: 13, color: '#5e5a78', lineHeight: 1.65, margin: 0 }}>{reason}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(139,127,212,0.08)' }}>
          <span style={{ fontSize: 12, color: '#c4c0d8', display: 'flex', alignItems: 'center', gap: 5 }}>
            🕒 {fmtDate(news.publishedAt)}
          </span>
          <a href={news.url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 12, fontWeight: 600, color: '#8b7fd4', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
            원문 보기
            <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </article>
  )
}
