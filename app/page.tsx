'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { newsApi, watchlistApi, alertApi } from '@/lib/api'
import type { News, Alert } from '@/types'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

// ── 상수 ───────────────────────────────────────────────────────
const CARD: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: '18px',
  padding: '24px',
  boxShadow: '0 2px 12px rgba(139,127,212,0.09)',
}

const DEFAULT_TICKERS = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL']

// ── 감성 색상 유틸 ────────────────────────────────────────────
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

function sentimentLabel(label: string) {
  if (label === 'POSITIVE') return '긍정'
  if (label === 'NEGATIVE') return '부정'
  return '중립'
}

// ── 시간 포맷 유틸 ────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금 전'
  if (mins < 60) return `${mins}분 전`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}시간 전`
  return `${Math.floor(hrs / 24)}일 전`
}

// ── 관심 종목 미니 카드 ───────────────────────────────────────
interface WatchlistCardProps {
  ticker: string
  news: News[]
  onClick: () => void
  onRemove: () => void
}

function WatchlistCard({ ticker, news, onClick, onRemove }: WatchlistCardProps) {
  const tickerNews  = news.filter(n => n.ticker === ticker)
  const positive    = tickerNews.filter(n => n.sentimentLabel === 'POSITIVE').length
  const negative    = tickerNews.filter(n => n.sentimentLabel === 'NEGATIVE').length
  const total       = tickerNews.length

  // 평균 감성 점수
  const avgScore = total > 0
    ? tickerNews.reduce((sum, n) => sum + n.sentimentScore, 0) / total
    : 0

  // 대표 감성
  let dominant: string
  if (positive > negative) dominant = 'POSITIVE'
  else if (negative > positive) dominant = 'NEGATIVE'
  else dominant = 'NEUTRAL'

  const score = Math.round((avgScore + 1) * 50) // -1~1 → 0~100

  return (
    <div
      onClick={onClick}
      className="cursor-pointer transition-all duration-200 hover:shadow-md relative group"
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: '0 2px 8px rgba(139,127,212,0.08)',
        border: '1.5px solid #ece9f5',
        minWidth: '140px',
      }}
    >
      {/* 삭제 버튼 */}
      <button
        onClick={e => { e.stopPropagation(); onRemove() }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg"
        style={{ color: '#c4c0d8', background: '#f8f7fd' }}
        title="관심 종목 삭제"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      {/* 티커 */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
          style={{ background: 'linear-gradient(135deg, #8b7fd4, #6a5fc4)' }}
        >
          {ticker.slice(0, 2)}
        </div>
        <span className="font-bold text-sm" style={{ color: '#18162a' }}>{ticker}</span>
      </div>

      {/* 감성 뱃지 */}
      <div
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold mb-2"
        style={{ background: sentimentBg(dominant), color: sentimentColor(dominant) }}
      >
        <span>{dominant === 'POSITIVE' ? '↑' : dominant === 'NEGATIVE' ? '↓' : '−'}</span>
        <span>{sentimentLabel(dominant)}</span>
      </div>

      {/* 점수 바 */}
      <div className="mb-1">
        <div className="flex justify-between text-xs mb-0.5" style={{ color: '#9e9ab8' }}>
          <span>감성</span>
          <span style={{ color: sentimentColor(dominant), fontWeight: 600 }}>{score}</span>
        </div>
        <div style={{ height: 4, background: '#f3f1fa', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${score}%`,
            background: sentimentColor(dominant),
            borderRadius: 4,
            transition: 'width 0.6s ease',
          }} />
        </div>
      </div>

      {/* 뉴스 수 */}
      <p className="text-xs mt-2" style={{ color: '#c4c0d8' }}>
        뉴스 {total}건
      </p>
    </div>
  )
}

// ── 뉴스 피드 아이템 ─────────────────────────────────────────
interface NewsFeedItemProps {
  news: News
  isPriority?: boolean
  onTickerClick: (ticker: string) => void
}

function NewsFeedItem({ news, isPriority, onTickerClick }: NewsFeedItemProps) {
  if (isPriority) {
    // 주요 뉴스 — 크게
    return (
      <a
        href={news.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block transition-all duration-200 hover:shadow-md"
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(139,127,212,0.08)',
          border: `1.5px solid ${sentimentColor(news.sentimentLabel)}30`,
          textDecoration: 'none',
        }}
      >
        <div className="flex items-start gap-3">
          <div>
            {/* 헤더 */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <button
                onClick={e => { e.preventDefault(); onTickerClick(news.ticker) }}
                className="text-xs font-bold px-2 py-0.5 rounded-lg transition-colors"
                style={{ background: '#f0eefb', color: '#8b7fd4' }}
              >
                {news.ticker}
              </button>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: sentimentBg(news.sentimentLabel), color: sentimentColor(news.sentimentLabel) }}
              >
                {sentimentLabel(news.sentimentLabel)}
              </span>
              <span className="text-xs" style={{ color: '#c4c0d8' }}>{news.source}</span>
              <span className="text-xs" style={{ color: '#c4c0d8' }}>{timeAgo(news.publishedAt)}</span>
            </div>

            {/* 제목 */}
            <p className="font-semibold text-sm leading-snug mb-1" style={{ color: '#18162a' }}>
              {news.titleKo || news.title}
            </p>

            {/* 감성 이유 (요약) */}
            {news.sentimentReasoningKo && (
              <p className="text-xs leading-relaxed" style={{ color: '#9e9ab8' }}>
                {news.sentimentReasoningKo.length > 80
                  ? news.sentimentReasoningKo.slice(0, 80) + '...'
                  : news.sentimentReasoningKo}
              </p>
            )}

            {/* 감성 점수 */}
            <div className="flex items-center gap-1 mt-2">
              <div style={{
                width: 32, height: 4,
                background: `linear-gradient(to right, ${sentimentColor(news.sentimentLabel)}, ${sentimentColor(news.sentimentLabel)}60)`,
                borderRadius: 4,
              }} />
              <span className="text-xs font-semibold" style={{ color: sentimentColor(news.sentimentLabel) }}>
                {news.sentimentScore > 0 ? '+' : ''}{news.sentimentScore.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </a>
    )
  }

  // 일반 뉴스 — 한 줄
  return (
    <a
      href={news.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 hover:bg-gray-50"
      style={{ textDecoration: 'none', border: '1px solid #f3f1fa' }}
    >
      <button
        onClick={e => { e.preventDefault(); onTickerClick(news.ticker) }}
        className="text-xs font-bold px-1.5 py-0.5 rounded-md shrink-0 transition-colors"
        style={{ background: '#f0eefb', color: '#8b7fd4' }}
      >
        {news.ticker}
      </button>

      <span
        className="text-xs font-semibold px-1.5 py-0.5 rounded-full shrink-0"
        style={{ background: sentimentBg(news.sentimentLabel), color: sentimentColor(news.sentimentLabel) }}
      >
        {news.sentimentLabel === 'POSITIVE' ? '↑' : news.sentimentLabel === 'NEGATIVE' ? '↓' : '−'}
      </span>

      <p className="text-sm flex-1 truncate" style={{ color: '#18162a' }}>
        {news.titleKo || news.title}
      </p>

      <span className="text-xs shrink-0" style={{ color: '#c4c0d8' }}>
        {timeAgo(news.publishedAt)}
      </span>

      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c4c0d8" strokeWidth="2"
        className="shrink-0">
        <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
      </svg>
    </a>
  )
}

// ── 티커 추가 입력 ───────────────────────────────────────────
function AddTickerInput({ onAdd }: { onAdd: (ticker: string) => void }) {
  const [value, setValue] = useState('')
  const [open, setOpen]   = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const t = value.trim().toUpperCase()
    if (t) { onAdd(t); setValue(''); setOpen(false) }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
        style={{ background: '#f8f7fd', color: '#9e9ab8', border: '1.5px dashed #d4cff2' }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        추가
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1">
      <input
        autoFocus
        type="text"
        value={value}
        onChange={e => setValue(e.target.value.toUpperCase())}
        placeholder="티커 (예: AAPL)"
        maxLength={10}
        className="px-3 py-1.5 text-sm rounded-xl outline-none uppercase"
        style={{
          background: '#f8f7fd',
          border: '1.5px solid #8b7fd4',
          color: '#18162a',
          width: 120,
        }}
      />
      <button
        type="submit"
        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
        style={{ background: '#8b7fd4' }}
      >
        추가
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="px-2 py-1.5 rounded-xl text-xs"
        style={{ color: '#9e9ab8' }}
      >
        취소
      </button>
    </form>
  )
}

// ── 랜딩 페이지 (비로그인) ────────────────────────────────────
function LandingPage({ news }: { news: News[] }) {
  const router = useRouter()

  // 인기 티커별 감성 집계
  const FEATURED = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN']
  const tickerStats = FEATURED.map(ticker => {
    const tn  = news.filter(n => n.ticker === ticker)
    const pos = tn.filter(n => n.sentimentLabel === 'POSITIVE').length
    const neg = tn.filter(n => n.sentimentLabel === 'NEGATIVE').length
    const avg = tn.length > 0 ? tn.reduce((s, n) => s + n.sentimentScore, 0) / tn.length : 0
    const dominant = pos > neg ? 'POSITIVE' : neg > pos ? 'NEGATIVE' : 'NEUTRAL'
    return { ticker, count: tn.length, avg, dominant }
  }).filter(t => t.count > 0)

  const totalNews = news.length
  const totalTickers = new Set(news.map(n => n.ticker)).size

  const FEATURES = [
    { icon: '📊', title: '실시간 감성 분석', desc: 'GPT-4o가 뉴스 하나하나를 읽고 긍정·부정·중립으로 분류합니다.' },
    { icon: '📈', title: '추이 차트', desc: '7일·30일·90일 감성 흐름으로 시장 분위기 변화를 한눈에 확인하세요.' },
    { icon: '🔔', title: '이상 감지 알림', desc: '감성이 급변하면 즉시 알려드립니다. 중요한 순간을 놓치지 마세요.' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4fa' }}>

      {/* ── 네비 ──────────────────────────────────────────────── */}
      <header style={{ background: '#ffffff', borderBottom: '1px solid #ece9f5', position: 'sticky', top: 0, zIndex: 30 }}>
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'linear-gradient(135deg, #8b7fd4, #6a5fc4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 16 }}>🔮</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: 16, color: '#18162a', letterSpacing: '-0.3px' }}>LuminSight</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/login')}
              style={{ fontSize: 13, fontWeight: 500, color: '#8b7fd4', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 12px' }}
            >
              로그인
            </button>
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #8b7fd4, #6a5fc4)' }}
            >
              무료로 시작하기
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6">

        {/* ── Hero ──────────────────────────────────────────────── */}
        <div style={{ padding: '80px 0 60px', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#f0eefb', borderRadius: 20, padding: '4px 14px',
            fontSize: 12, fontWeight: 600, color: '#8b7fd4', marginBottom: 24,
          }}>
            <span>✨</span> AI 기반 주식 뉴스 감성 분석
          </div>

          <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, color: '#18162a', lineHeight: 1.15, margin: '0 0 20px', letterSpacing: '-1px' }}>
            AI가 읽는 주식 뉴스,<br />
            <span style={{ background: 'linear-gradient(135deg, #8b7fd4, #6a5fc4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              투자 감각을 높여드립니다
            </span>
          </h1>

          <p style={{ fontSize: 17, color: '#6b7280', maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.7 }}>
            수천 건의 뉴스를 실시간으로 분석해 내 관심 종목의 시장 분위기를 한눈에 보여드립니다.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-3 rounded-2xl text-base font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #8b7fd4, #6a5fc4)', boxShadow: '0 4px 20px rgba(139,127,212,0.4)' }}
            >
              무료로 시작하기 →
            </button>
            <button
              onClick={() => router.push('/stock/AAPL')}
              className="px-6 py-3 rounded-2xl text-base font-semibold transition-all"
              style={{ background: '#ffffff', color: '#8b7fd4', border: '1.5px solid #d4cff2' }}
            >
              AAPL 직접 분석해보기
            </button>
          </div>

          {/* 실시간 수치 */}
          {totalNews > 0 && (
            <div style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { value: totalNews.toLocaleString(), label: '오늘 분석된 뉴스' },
                { value: totalTickers.toString(), label: '추적 중인 종목' },
                { value: 'GPT-4o', label: 'AI 엔진' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 22, fontWeight: 800, color: '#18162a', margin: '0 0 2px' }}>{s.value}</p>
                  <p style={{ fontSize: 12, color: '#9e9ab8', margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 지금 주목할 종목 ─────────────────────────────────── */}
        {tickerStats.length > 0 && (
          <div style={{ marginBottom: 64 }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#18162a', margin: '0 0 6px' }}>지금 주목할 종목</h2>
              <p style={{ fontSize: 14, color: '#9e9ab8', margin: 0 }}>실시간 뉴스 감성 분석 결과</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
              {tickerStats.map(({ ticker, count, avg, dominant }) => (
                <button
                  key={ticker}
                  onClick={() => router.push(`/stock/${ticker}`)}
                  style={{
                    background: '#ffffff', borderRadius: 16, padding: '20px 16px',
                    border: `1.5px solid ${sentimentColor(dominant)}20`,
                    cursor: 'pointer', textAlign: 'left',
                    boxShadow: '0 2px 8px rgba(139,127,212,0.07)',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(139,127,212,0.15)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(139,127,212,0.07)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: 'linear-gradient(135deg, #8b7fd4, #6a5fc4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 11, fontWeight: 700,
                    }}>
                      {ticker.slice(0, 2)}
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                      background: sentimentBg(dominant), color: sentimentColor(dominant),
                    }}>
                      {dominant === 'POSITIVE' ? '↑ 긍정' : dominant === 'NEGATIVE' ? '↓ 부정' : '− 중립'}
                    </span>
                  </div>
                  <p style={{ fontWeight: 700, fontSize: 15, color: '#18162a', margin: '0 0 2px' }}>{ticker}</p>
                  <p style={{ fontSize: 12, color: sentimentColor(dominant), fontWeight: 600, margin: '0 0 6px' }}>
                    {avg > 0 ? '+' : ''}{avg.toFixed(2)}
                  </p>
                  <p style={{ fontSize: 11, color: '#c4c0d8', margin: 0 }}>뉴스 {count}건</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── 기능 소개 ─────────────────────────────────────────── */}
        <div style={{ marginBottom: 64 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#18162a', margin: '0 0 6px' }}>핵심 기능</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{
                background: '#ffffff', borderRadius: 18, padding: '28px 24px',
                boxShadow: '0 2px 12px rgba(139,127,212,0.08)', border: '1px solid #f3f1fa',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, fontSize: 22,
                  background: '#f0eefb', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 14,
                }}>
                  {f.icon}
                </div>
                <p style={{ fontWeight: 700, fontSize: 15, color: '#18162a', margin: '0 0 8px' }}>{f.title}</p>
                <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── 최하단 CTA ─────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #8b7fd4 0%, #6a5fc4 100%)',
          borderRadius: 24, padding: '48px 32px', textAlign: 'center', marginBottom: 64,
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(139,127,212,0.3)',
        }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -30, left: 60, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
          <div className="relative">
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#ffffff', margin: '0 0 10px' }}>
              지금 무료로 시작하세요
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: '0 0 28px' }}>
              관심 종목을 등록하고 AI 감성 분석을 바로 받아보세요.
            </p>
            <button
              onClick={() => router.push('/login')}
              style={{
                background: '#ffffff', color: '#8b7fd4',
                padding: '12px 32px', borderRadius: 14, fontSize: 15, fontWeight: 700,
                border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              무료 계정 만들기 →
            </button>
          </div>
        </div>

      </main>

      {/* ── 푸터 ──────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid #ece9f5', padding: '20px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: '#c4c0d8', margin: 0 }}>
          © 2026 LuminSight · AI 기반 주식 뉴스 감성 분석
        </p>
      </footer>
    </div>
  )
}

// ── 메인 대시보드 ────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  const [watchlist, setWatchlist]           = useState<string[]>([])
  const [watchlistLoaded, setWatchlistLoaded] = useState(false)
  const [isEmptyWatchlist, setIsEmptyWatchlist] = useState(false)  // 온보딩 트리거
  const [allNews, setAllNews]               = useState<News[]>([])
  const [newsLoading, setNewsLoading]       = useState(false)
  const [showCount, setShowCount]           = useState(10)
  const [recentAlerts, setRecentAlerts]     = useState<Alert[]>([])

  // ── 관심 종목 로드 ─────────────────────────────────────────
  const loadWatchlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWatchlist(DEFAULT_TICKERS)
      setIsEmptyWatchlist(false)
      setWatchlistLoaded(true)
      return
    }
    try {
      const tickers = await watchlistApi.getWatchlist()
      if (tickers.length > 0) {
        setWatchlist(tickers)
        setIsEmptyWatchlist(false)
      } else {
        setWatchlist(DEFAULT_TICKERS)
        setIsEmptyWatchlist(true)   // 온보딩 표시
      }
    } catch {
      setWatchlist(DEFAULT_TICKERS)
      setIsEmptyWatchlist(false)
    } finally {
      setWatchlistLoaded(true)
    }
  }, [isAuthenticated])

  // ── 전체 뉴스 로드 ────────────────────────────────────────
  const loadAllNews = useCallback(async () => {
    setNewsLoading(true)
    try {
      const data = await newsApi.getAllNews(100)
      setAllNews(data)
    } catch {
      setAllNews([])
    } finally {
      setNewsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isLoading) loadWatchlist()
  }, [isLoading, loadWatchlist])

  useEffect(() => {
    loadAllNews()
  }, [loadAllNews])

  // ── 최근 알림 로드 (로그인 시만) ──────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return
    alertApi.getAlerts()
      .then(data => setRecentAlerts(data.filter(a => !a.isRead).slice(0, 3)))
      .catch(() => {})
  }, [isAuthenticated])

  // ── 비로그인 → 랜딩 페이지 ──────────────────────────────
  if (!isLoading && !isAuthenticated) {
    return <LandingPage news={allNews} />
  }

  // ── 관심 종목 추가/삭제 ──────────────────────────────────
  const handleAdd = async (ticker: string) => {
    if (watchlist.includes(ticker)) return
    if (isAuthenticated) {
      try { await watchlistApi.addTicker(ticker) } catch { /* silent */ }
      // 첫 종목 추가 시 온보딩 해제, 기본 티커 제거
      if (isEmptyWatchlist) {
        setIsEmptyWatchlist(false)
        setWatchlist([ticker])
        return
      }
    }
    setWatchlist(prev => [...prev, ticker])
  }

  const handleRemove = async (ticker: string) => {
    if (isAuthenticated) {
      try { await watchlistApi.removeTicker(ticker) } catch { /* silent */ }
    }
    setWatchlist(prev => prev.filter(t => t !== ticker))
  }

  const goToStock = (ticker: string) => router.push(`/stock/${ticker}`)

  // ── 뉴스 분류 ────────────────────────────────────────────
  // 관심 종목 뉴스는 상단 우선, 나머지는 하단
  const watchlistNews = allNews.filter(n => watchlist.includes(n.ticker))
  const otherNews     = allNews.filter(n => !watchlist.includes(n.ticker))

  // 오늘의 주요 신호: 절대값이 큰 감성 뉴스 (watchlist 기준)
  const topSignals = [...watchlistNews]
    .sort((a, b) => Math.abs(b.sentimentScore) - Math.abs(a.sentimentScore))
    .slice(0, 3)

  // 표시할 뉴스 (관심 종목 우선 + 나머지)
  const orderedNews = [...watchlistNews, ...otherNews]
  const visibleNews = orderedNews.slice(0, showCount)

  // 오늘의 전반적 감성
  const watchlistSentiment = (() => {
    const pos = watchlistNews.filter(n => n.sentimentLabel === 'POSITIVE').length
    const neg = watchlistNews.filter(n => n.sentimentLabel === 'NEGATIVE').length
    if (pos > neg) return { label: '긍정 우세', color: '#ef4444', icon: '↑' }
    if (neg > pos) return { label: '부정 우세', color: '#2563eb', icon: '↓' }
    return { label: '혼조', color: '#8b8fa8', icon: '−' }
  })()

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4fa' }}>

      {/* ── 헤더 ───────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30 px-6 py-3"
        style={{ background: '#ffffff', borderBottom: '1px solid #ece9f5', boxShadow: '0 1px 6px rgba(139,127,212,0.06)' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-base" style={{ color: '#18162a' }}>대시보드</p>
            <p className="text-xs" style={{ color: '#9e9ab8' }}>
              {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
            </p>
          </div>

          {/* 검색 — 상세 페이지로 이동 */}
          <form
            onSubmit={e => {
              e.preventDefault()
              const val = (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value.trim().toUpperCase()
              if (val) router.push(`/stock/${val}`)
            }}
            className="flex gap-2 flex-1 max-w-xs"
          >
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14"
                viewBox="0 0 24 24" fill="none" stroke="#9e9ab8" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                name="q"
                type="text"
                placeholder="티커 검색 (예: AAPL)"
                maxLength={10}
                className="w-full pl-8 pr-4 py-2 text-sm rounded-xl uppercase outline-none transition-all"
                style={{ background: '#f8f7fd', border: '1.5px solid #ece9f5', color: '#18162a' }}
                onFocus={e => (e.target.style.borderColor = '#8b7fd4')}
                onBlur={e  => (e.target.style.borderColor = '#ece9f5')}
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #8b7fd4, #6a5fc4)' }}
            >
              분석
            </button>
          </form>
        </div>
      </header>

      {/* ── 메인 ───────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── 온보딩: 빈 관심 종목 (로그인 유저 전용) ──── */}
        {isAuthenticated && isEmptyWatchlist && watchlistLoaded && (
          <div style={{
            background: 'linear-gradient(135deg, #8b7fd4 0%, #6a5fc4 100%)',
            borderRadius: '20px', padding: '28px',
            position: 'relative', overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(139,127,212,0.25)',
          }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120,
              borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -20, left: 40, width: 80, height: 80,
              borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />

            <div className="relative">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 24 }}>👋</span>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 16, color: '#ffffff', margin: 0 }}>관심 종목을 추가해 보세요</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', margin: '2px 0 0' }}>
                    아래 추천 종목 중 분석하고 싶은 종목을 선택하세요
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
                {[
                  { ticker: 'AAPL', name: '애플', emoji: '🍎' },
                  { ticker: 'TSLA', name: '테슬라', emoji: '⚡' },
                  { ticker: 'NVDA', name: '엔비디아', emoji: '🎮' },
                  { ticker: 'MSFT', name: '마이크로소프트', emoji: '🪟' },
                  { ticker: 'GOOGL', name: '구글', emoji: '🔍' },
                  { ticker: 'AMZN', name: '아마존', emoji: '📦' },
                ].map(({ ticker, name, emoji }) => (
                  <button
                    key={ticker}
                    onClick={() => handleAdd(ticker)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 14px', borderRadius: 12, cursor: 'pointer',
                      background: 'rgba(255,255,255,0.15)',
                      border: '1px solid rgba(255,255,255,0.25)',
                      color: '#ffffff', fontSize: 13, fontWeight: 600,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                  >
                    <span>{emoji}</span>
                    <span>{ticker}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 400 }}>{name}</span>
                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15 }}>+</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsEmptyWatchlist(false)}
                style={{
                  marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.5)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  textDecoration: 'underline',
                }}
              >
                나중에 추가하기
              </button>
            </div>
          </div>
        )}

        {/* ── Hero: 오늘의 시장 감성 ─────────────────────── */}
        {watchlistNews.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #8b7fd4 0%, #6a5fc4 100%)',
            borderRadius: '20px', padding: '24px 28px',
            position: 'relative', overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(139,127,212,0.25)',
          }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160,
              borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -30, right: 60, width: 100, height: 100,
              borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

            <div className="relative flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  관심 종목 뉴스 감성
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-white">{watchlistSentiment.icon}</span>
                  <span className="text-xl font-bold text-white">{watchlistSentiment.label}</span>
                </div>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  최근 뉴스 {watchlistNews.length}건 기준
                </p>
              </div>

              <div className="flex gap-4 text-sm">
                <div className="text-center">
                  <p className="font-bold text-lg text-white">
                    {watchlistNews.filter(n => n.sentimentLabel === 'POSITIVE').length}
                  </p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>긍정</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg text-white">
                    {watchlistNews.filter(n => n.sentimentLabel === 'NEGATIVE').length}
                  </p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>부정</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg text-white">
                    {watchlistNews.filter(n => n.sentimentLabel === 'NEUTRAL').length}
                  </p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>중립</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 관심 종목 ──────────────────────────────────── */}
        <div style={CARD}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-bold" style={{ color: '#18162a' }}>관심 종목</p>
              {!isAuthenticated && watchlistLoaded && (
                <p className="text-xs mt-0.5" style={{ color: '#c4c0d8' }}>
                  로그인하면 종목이 저장됩니다
                </p>
              )}
            </div>
            <AddTickerInput onAdd={handleAdd} />
          </div>

          {watchlistLoaded ? (
            watchlist.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
                {watchlist.map(ticker => (
                  <WatchlistCard
                    key={ticker}
                    ticker={ticker}
                    news={allNews}
                    onClick={() => goToStock(ticker)}
                    onRemove={() => handleRemove(ticker)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm" style={{ color: '#9e9ab8' }}>관심 종목을 추가해 보세요.</p>
              </div>
            )
          ) : (
            <div className="flex gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl"
                  style={{ width: 140, height: 120, background: '#f3f1fa', flexShrink: 0 }} />
              ))}
            </div>
          )}
        </div>

        {/* ── 주요 신호 ──────────────────────────────────── */}
        {topSignals.length > 0 && (
          <div style={CARD}>
            <p className="font-bold mb-3" style={{ color: '#18162a' }}>
              ⚡ 오늘의 주요 신호
              <span className="text-xs font-normal ml-2" style={{ color: '#9e9ab8' }}>
                관심 종목 중 감성 강도 상위
              </span>
            </p>
            <div className="space-y-2">
              {topSignals.map(news => (
                <div
                  key={news.id}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors hover:bg-gray-50"
                  onClick={() => goToStock(news.ticker)}
                  style={{ border: `1px solid ${sentimentColor(news.sentimentLabel)}20` }}
                >
                  <span
                    className="text-xs font-bold px-2 py-1 rounded-lg shrink-0"
                    style={{ background: sentimentBg(news.sentimentLabel), color: sentimentColor(news.sentimentLabel) }}
                  >
                    {news.ticker}
                  </span>

                  <p className="text-sm flex-1 truncate" style={{ color: '#18162a' }}>
                    {news.titleKo || news.title}
                  </p>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-semibold"
                      style={{ color: sentimentColor(news.sentimentLabel) }}>
                      {news.sentimentScore > 0 ? '+' : ''}{news.sentimentScore.toFixed(2)}
                    </span>
                    <span className="text-xs" style={{ color: '#c4c0d8' }}>{timeAgo(news.publishedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 알림 미리보기 (로그인 + 읽지 않은 알림 있을 때) ── */}
        {isAuthenticated && recentAlerts.length > 0 && (
          <div style={CARD}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <p className="font-bold" style={{ color: '#18162a' }}>🔔 새 알림</p>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: '#ef4444', color: '#fff' }}>
                  {recentAlerts.length}
                </span>
              </div>
              <Link href="/alerts"
                className="text-xs font-medium px-3 py-1.5 rounded-xl transition-all"
                style={{ background: '#f0eefb', color: '#8b7fd4', border: '1.5px solid #d4cff2' }}>
                전체 보기
              </Link>
            </div>
            <div className="space-y-2">
              {recentAlerts.map(alert => (
                <Link key={alert.id} href="/alerts"
                  className="flex items-start gap-3 p-3 rounded-xl transition-colors hover:bg-gray-50 block"
                  style={{ border: '1px solid #f3f0fc' }}>
                  <span className="text-base flex-shrink-0 mt-0.5">
                    {alert.severity === 'HIGH' ? '🔴' : alert.severity === 'MEDIUM' ? '🟡' : '🟢'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                        style={{ background: '#f0eefb', color: '#8b7fd4' }}>
                        {alert.ticker}
                      </span>
                      <span className="text-xs" style={{ color: '#c4c0d8' }}>
                        {(() => {
                          const diff = Date.now() - new Date(alert.createdAt).getTime()
                          const m = Math.floor(diff / 60000)
                          if (m < 1) return '방금'
                          if (m < 60) return `${m}분 전`
                          return `${Math.floor(m / 60)}시간 전`
                        })()}
                      </span>
                    </div>
                    <p className="text-xs truncate" style={{ color: '#5e5a78' }}>{alert.message}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── 뉴스 피드 ──────────────────────────────────── */}
        <div style={CARD}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-bold" style={{ color: '#18162a' }}>📰 최신 뉴스</p>
              <p className="text-xs mt-0.5" style={{ color: '#9e9ab8' }}>
                관심 종목 우선 · 전체 뉴스 포함
              </p>
            </div>
            <span className="text-xs px-2 py-1 rounded-lg"
              style={{ background: '#f0eefb', color: '#8b7fd4' }}>
              {orderedNews.length}건
            </span>
          </div>

          {newsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: '#f8f7fd' }}>
                  <div className="w-12 h-5 rounded-lg bg-gray-200" />
                  <div className="flex-1 h-4 rounded bg-gray-200" />
                  <div className="w-16 h-4 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : orderedNews.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm" style={{ color: '#9e9ab8' }}>뉴스가 없습니다.</p>
            </div>
          ) : (
            <>
              {/* 관심 종목 뉴스 구분선 */}
              {watchlistNews.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold" style={{ color: '#8b7fd4' }}>관심 종목</span>
                  <div style={{ flex: 1, height: 1, background: '#ece9f5' }} />
                </div>
              )}

              {/* 상위 3개는 크게 (관심 종목 중 주요 뉴스) */}
              {visibleNews.slice(0, 3).filter(n => watchlist.includes(n.ticker)).length > 0 && (
                <div className="grid gap-3 mb-4">
                  {visibleNews
                    .filter(n => watchlist.includes(n.ticker))
                    .slice(0, 3)
                    .map(n => (
                      <NewsFeedItem
                        key={n.id}
                        news={n}
                        isPriority={true}
                        onTickerClick={goToStock}
                      />
                    ))}
                </div>
              )}

              {/* 나머지는 한 줄씩 */}
              {visibleNews.length > 0 && (
                <>
                  {watchlistNews.length > 0 && otherNews.length > 0 && (
                    <div className="flex items-center gap-2 my-3">
                      <span className="text-xs font-semibold" style={{ color: '#c4c0d8' }}>전체 뉴스</span>
                      <div style={{ flex: 1, height: 1, background: '#ece9f5' }} />
                    </div>
                  )}
                  <div className="space-y-1">
                    {visibleNews
                      .filter(n => !watchlist.includes(n.ticker) || visibleNews.indexOf(n) >= 3)
                      .map(n => (
                        <NewsFeedItem
                          key={n.id}
                          news={n}
                          isPriority={false}
                          onTickerClick={goToStock}
                        />
                      ))}
                  </div>
                </>
              )}

              {/* 더 보기 */}
              {showCount < orderedNews.length && (
                <button
                  onClick={() => setShowCount(c => c + 20)}
                  className="w-full mt-4 py-3 rounded-xl text-sm font-medium transition-all"
                  style={{ background: '#f0eefb', color: '#8b7fd4', border: '1.5px solid #d4cff2' }}
                >
                  더 보기 ({orderedNews.length - showCount}건 남음)
                </button>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
