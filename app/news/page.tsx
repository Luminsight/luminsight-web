'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { newsApi } from '@/lib/api'
import type { News } from '@/types'

// ── 상수 ─────────────────────────────────────────────────────
const CARD: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: '18px',
  padding: '24px',
  boxShadow: '0 2px 12px rgba(139,127,212,0.09)',
}

const PAGE_SIZE = 20

type SentimentFilter = 'ALL' | 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
type SortOrder = 'latest' | 'score_high' | 'score_low'

// ── 유틸 ─────────────────────────────────────────────────────
function sentimentColor(label: string) {
  if (label === 'POSITIVE') return '#ef4444'
  if (label === 'NEGATIVE') return '#2563eb'
  return '#8b8fa8'
}
function sentimentBg(label: string) {
  if (label === 'POSITIVE') return '#fff1f1'
  if (label === 'NEGATIVE') return '#eff6ff'
  return '#f3f4f6'
}
function sentimentKo(label: string) {
  if (label === 'POSITIVE') return '긍정'
  if (label === 'NEGATIVE') return '부정'
  return '중립'
}
function sentimentIcon(label: string) {
  if (label === 'POSITIVE') return '↑'
  if (label === 'NEGATIVE') return '↓'
  return '−'
}
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금 전'
  if (mins < 60) return `${mins}분 전`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}시간 전`
  return `${Math.floor(hrs / 24)}일 전`
}

// ── 뉴스 카드 ─────────────────────────────────────────────────
function NewsRow({ news, onTickerClick }: { news: News; onTickerClick: (t: string) => void }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '14px',
        border: `1.5px solid ${sentimentColor(news.sentimentLabel)}18`,
        overflow: 'hidden',
        transition: 'box-shadow 0.15s',
      }}
      className="hover:shadow-md transition-shadow"
    >
      {/* 메인 행 */}
      <div
        className="flex items-start gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
        {/* 감성 컬러 사이드바 */}
        <div style={{
          width: 3, minHeight: 48, borderRadius: 4, flexShrink: 0, marginTop: 2,
          background: sentimentColor(news.sentimentLabel),
        }} />

        <div className="flex-1 min-w-0">
          {/* 상단 태그 라인 */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <button
              onClick={e => { e.stopPropagation(); onTickerClick(news.ticker) }}
              className="text-xs font-bold px-2 py-0.5 rounded-lg transition-colors"
              style={{ background: '#f0eefb', color: '#8b7fd4' }}
            >
              {news.ticker}
            </button>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: sentimentBg(news.sentimentLabel), color: sentimentColor(news.sentimentLabel) }}
            >
              {sentimentIcon(news.sentimentLabel)} {sentimentKo(news.sentimentLabel)}
            </span>
            <span className="text-xs" style={{ color: '#c4c0d8' }}>{news.source}</span>
            <span className="text-xs ml-auto" style={{ color: '#c4c0d8' }}>{timeAgo(news.publishedAt)}</span>
          </div>

          {/* 제목 */}
          <p className="text-sm font-semibold leading-snug" style={{ color: '#18162a' }}>
            {news.titleKo || news.title}
          </p>

          {/* 감성 점수 인라인 */}
          <div className="flex items-center gap-2 mt-1.5">
            <div style={{
              width: 40, height: 3, borderRadius: 3,
              background: `linear-gradient(to right, ${sentimentColor(news.sentimentLabel)}, ${sentimentColor(news.sentimentLabel)}40)`,
            }} />
            <span className="text-xs font-semibold" style={{ color: sentimentColor(news.sentimentLabel) }}>
              {news.sentimentScore > 0 ? '+' : ''}{news.sentimentScore.toFixed(2)}
            </span>
            {news.sentimentConfidence != null && (
              <span className="text-xs" style={{ color: '#c4c0d8' }}>
                신뢰도 {(news.sentimentConfidence * 100).toFixed(0)}%
              </span>
            )}
            <span className="ml-auto text-xs" style={{ color: '#c4c0d8' }}>
              {expanded ? '▲ 접기' : '▼ 상세'}
            </span>
          </div>
        </div>
      </div>

      {/* 확장 패널 */}
      {expanded && (
        <div
          className="px-5 pb-4 pt-0"
          style={{ borderTop: '1px solid #f3f1fa' }}
        >
          {/* 원문 제목 */}
          {news.titleKo && (
            <p className="text-xs mb-2 mt-3" style={{ color: '#9e9ab8' }}>
              원문: {news.title}
            </p>
          )}

          {/* 감성 이유 */}
          {(news.sentimentReasoningKo || news.sentimentReasoning) && (
            <div className="mt-2 p-3 rounded-xl" style={{ background: '#f8f7fd' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: '#8b7fd4' }}>AI 감성 분석</p>
              <p className="text-xs leading-relaxed" style={{ color: '#5e5a78' }}>
                {news.sentimentReasoningKo || news.sentimentReasoning}
              </p>
            </div>
          )}

          {/* 원문 링크 */}
          <a
            href={news.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium transition-colors"
            style={{ color: '#8b7fd4' }}
            onClick={e => e.stopPropagation()}
          >
            원문 보기
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
            </svg>
          </a>
        </div>
      )}
    </div>
  )
}

// ── 필터 탭 버튼 ─────────────────────────────────────────────
function FilterChip({
  active, onClick, children, color = '#8b7fd4',
}: { active: boolean; onClick: () => void; children: React.ReactNode; color?: string }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
      style={{
        background: active ? color : '#f8f7fd',
        color:      active ? '#fff' : '#9e9ab8',
        border:     `1.5px solid ${active ? color : '#ece9f5'}`,
      }}
    >
      {children}
    </button>
  )
}

// ── 메인 페이지 ──────────────────────────────────────────────
export default function NewsPage() {
  const router = useRouter()

  const [allNews, setAllNews]     = useState<News[]>([])
  const [loading, setLoading]     = useState(true)
  const [sentiment, setSentiment] = useState<SentimentFilter>('ALL')
  const [tickerQuery, setTickerQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('latest')
  const [page, setPage]           = useState(1)

  const inputRef = useRef<HTMLInputElement>(null)

  // ── 뉴스 로드 ──────────────────────────────────────────────
  const loadNews = useCallback(async () => {
    setLoading(true)
    try {
      const data = await newsApi.getAllNews(200)
      setAllNews(data)
    } catch {
      setAllNews([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadNews() }, [loadNews])

  // 필터/정렬 변경 시 페이지 초기화
  useEffect(() => { setPage(1) }, [sentiment, tickerQuery, sortOrder])

  // ── 필터링 + 정렬 ─────────────────────────────────────────
  const filtered = allNews
    .filter(n => sentiment === 'ALL' || n.sentimentLabel === sentiment)
    .filter(n => !tickerQuery.trim() || n.ticker.includes(tickerQuery.trim().toUpperCase()))
    .sort((a, b) => {
      if (sortOrder === 'latest')     return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      if (sortOrder === 'score_high') return b.sentimentScore - a.sentimentScore
      return a.sentimentScore - b.sentimentScore
    })

  const totalPages   = Math.ceil(filtered.length / PAGE_SIZE)
  const visibleNews  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // 감성별 통계
  const stats = {
    pos: allNews.filter(n => n.sentimentLabel === 'POSITIVE').length,
    neg: allNews.filter(n => n.sentimentLabel === 'NEGATIVE').length,
    neu: allNews.filter(n => n.sentimentLabel === 'NEUTRAL').length,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4fa', width: '100%' }}>

      {/* ── 헤더 ──────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30 px-6 py-3"
        style={{ background: '#ffffff', borderBottom: '1px solid #ece9f5', boxShadow: '0 1px 6px rgba(139,127,212,0.06)' }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-bold text-base" style={{ color: '#18162a' }}>📰 뉴스 피드</p>
            <p className="text-xs" style={{ color: '#9e9ab8' }}>전체 뉴스 탐색</p>
          </div>

          {/* 티커 검색 */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="13" height="13"
              viewBox="0 0 24 24" fill="none" stroke="#9e9ab8" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={tickerQuery}
              onChange={e => setTickerQuery(e.target.value)}
              placeholder="티커 필터 (예: AAPL)"
              maxLength={10}
              className="pl-8 pr-4 py-2 text-sm rounded-xl uppercase outline-none transition-all w-40"
              style={{ background: '#f8f7fd', border: '1.5px solid #ece9f5', color: '#18162a' }}
              onFocus={e => (e.target.style.borderColor = '#8b7fd4')}
              onBlur={e  => (e.target.style.borderColor = '#ece9f5')}
            />
            {tickerQuery && (
              <button
                onClick={() => setTickerQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2"
                style={{ color: '#c4c0d8' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── 메인 ──────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* 감성 통계 카드 3개 */}
        {!loading && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: '긍정', count: stats.pos, color: '#ef4444', bg: '#fff1f1', icon: '↑' },
              { label: '부정', count: stats.neg, color: '#2563eb', bg: '#eff6ff', icon: '↓' },
              { label: '중립', count: stats.neu, color: '#8b8fa8', bg: '#f3f4f6', icon: '−' },
            ].map(s => (
              <div
                key={s.label}
                onClick={() => setSentiment(s.label === '긍정' ? 'POSITIVE' : s.label === '부정' ? 'NEGATIVE' : 'NEUTRAL')}
                className="cursor-pointer transition-all hover:shadow-md"
                style={{
                  background: '#ffffff',
                  borderRadius: '14px',
                  padding: '16px',
                  border: `1.5px solid ${s.color}22`,
                  boxShadow: '0 2px 8px rgba(139,127,212,0.07)',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-bold" style={{ color: s.color }}>{s.icon}</span>
                  <span className="text-xs font-semibold" style={{ color: s.color }}>{s.label}</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: '#18162a' }}>{s.count}</p>
                <p className="text-xs mt-0.5" style={{ color: '#c4c0d8' }}>건</p>
              </div>
            ))}
          </div>
        )}

        {/* 필터 + 정렬 바 */}
        <div style={CARD} className="flex flex-wrap items-center gap-3">
          {/* 감성 필터 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold" style={{ color: '#9e9ab8' }}>감성</span>
            <FilterChip active={sentiment === 'ALL'}      onClick={() => setSentiment('ALL')}>전체</FilterChip>
            <FilterChip active={sentiment === 'POSITIVE'} onClick={() => setSentiment('POSITIVE')} color="#ef4444">↑ 긍정</FilterChip>
            <FilterChip active={sentiment === 'NEGATIVE'} onClick={() => setSentiment('NEGATIVE')} color="#2563eb">↓ 부정</FilterChip>
            <FilterChip active={sentiment === 'NEUTRAL'}  onClick={() => setSentiment('NEUTRAL')}  color="#8b8fa8">− 중립</FilterChip>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="text-xs font-semibold" style={{ color: '#9e9ab8' }}>정렬</span>
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value as SortOrder)}
              className="text-sm rounded-xl px-3 py-1.5 outline-none"
              style={{ background: '#f8f7fd', border: '1.5px solid #ece9f5', color: '#5e5a78' }}
            >
              <option value="latest">최신순</option>
              <option value="score_high">긍정 강도순</option>
              <option value="score_low">부정 강도순</option>
            </select>
          </div>
        </div>

        {/* 결과 카운트 */}
        {!loading && (
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: '#9e9ab8' }}>
              {tickerQuery && <span className="font-semibold" style={{ color: '#8b7fd4' }}>{tickerQuery.toUpperCase()} · </span>}
              총 <span className="font-semibold" style={{ color: '#18162a' }}>{filtered.length}</span>건
            </p>
            {totalPages > 1 && (
              <p className="text-xs" style={{ color: '#c4c0d8' }}>{page} / {totalPages} 페이지</p>
            )}
          </div>
        )}

        {/* 뉴스 목록 */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl"
                style={{ height: 88, background: '#f3f1fa' }} />
            ))}
          </div>
        ) : visibleNews.length === 0 ? (
          <div style={{ ...CARD, textAlign: 'center', paddingTop: 48, paddingBottom: 48 }}>
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-medium" style={{ color: '#5e5a78' }}>조건에 맞는 뉴스가 없습니다.</p>
            <p className="text-sm mt-1" style={{ color: '#9e9ab8' }}>필터를 변경해 보세요.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleNews.map(n => (
              <NewsRow
                key={n.id}
                news={n}
                onTickerClick={t => router.push(`/stock/${t}`)}
              />
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              disabled={page === 1}
              onClick={() => { setPage(p => p - 1); window.scrollTo(0, 0) }}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
              style={{ background: '#f0eefb', color: '#8b7fd4', border: '1.5px solid #d4cff2' }}
            >
              ← 이전
            </button>

            {/* 페이지 번호 */}
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = totalPages <= 7 ? i + 1 : (
                page <= 4 ? i + 1 :
                page >= totalPages - 3 ? totalPages - 6 + i :
                page - 3 + i
              )
              return (
                <button
                  key={p}
                  onClick={() => { setPage(p); window.scrollTo(0, 0) }}
                  className="w-9 h-9 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: page === p ? '#8b7fd4' : '#f8f7fd',
                    color:      page === p ? '#fff' : '#9e9ab8',
                    border:     `1.5px solid ${page === p ? '#8b7fd4' : '#ece9f5'}`,
                  }}
                >
                  {p}
                </button>
              )
            })}

            <button
              disabled={page === totalPages}
              onClick={() => { setPage(p => p + 1); window.scrollTo(0, 0) }}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
              style={{ background: '#f0eefb', color: '#8b7fd4', border: '1.5px solid #d4cff2' }}
            >
              다음 →
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
