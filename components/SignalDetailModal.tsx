'use client'

import { useEffect, useRef } from 'react'
import type { TradingSignal, SignalBreakdown, ContributingNews } from '@/types'
import { scoreToLabel, scoreToColor } from '@/components/SentimentGauge'

interface Props {
  signal: TradingSignal
  onClose: () => void
  highlightAxis?: string
}

// ── 색상 헬퍼 ─────────────────────────────────────────────────
const scoreColor = scoreToColor

const sentimentColor = (label: string) =>
  label === 'POSITIVE' ? '#22c55e' : label === 'NEGATIVE' ? '#ef4444' : '#8b7fd4'

const sentimentLabel = (label: string) =>
  label === 'POSITIVE' ? '긍정' : label === 'NEGATIVE' ? '부정' : '중립'

const signalConfig = {
  BUY:  { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', emoji: '🟢' },
  SELL: { bg: '#fef2f2', color: '#ef4444', border: '#fecaca', emoji: '🔴' },
  HOLD: { bg: '#f5f3ff', color: '#8b7fd4', border: '#ddd6fe', emoji: '⚪️' },
}

function signalLabel(op: 'BUY' | 'SELL' | 'HOLD', conf: number): string {
  if (op === 'BUY') {
    if (conf >= 0.75) return '강한 긍정 신호'
    if (conf >= 0.60) return '긍정적 신호'
    return '약한 긍정 신호'
  }
  if (op === 'SELL') {
    if (conf >= 0.75) return '강한 부정 신호'
    if (conf >= 0.60) return '부정적 신호'
    return '약한 부정 신호'
  }
  return '중립 관망'
}

function confContext(conf: number, bd: ReturnType<typeof Object.create> | null | undefined): string | null {
  if (!bd || conf >= 0.75) return null
  const techAbs = Math.abs(bd.technicalContrib ?? 0)
  const sentAbs = Math.abs(bd.sentimentContrib ?? 0)
  const fundAbs = Math.abs(bd.fundamentalContrib ?? 0)
  const total   = techAbs + sentAbs + fundAbs + Math.abs(bd.marketContrib ?? 0)
  const techPct = total > 0 ? techAbs / total : 0
  if (conf < 0.60 && techPct < 0.15) return '기술적 신호 미약 — 진입 타이밍 별도 확인 권장'
  if (conf < 0.60) return '신호 강도 약함 — 추가 지표 확인 권장'
  if (techPct < 0.20) return '차트보다 감성·펀더멘털 주도 — 기술적 확인 후 진입 검토'
  return null
}

// ── 4축 기여도 바 ──────────────────────────────────────────────
function BreakdownBar({
  label, weight, score, contrib, detail, axisKey, highlight
}: {
  label: string
  weight: string
  score: number
  contrib: number
  detail?: string
  axisKey?: string
  highlight?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const pct = ((score + 1) / 2) * 100
  const color = scoreColor(score)

  useEffect(() => {
    if (highlight && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlight])

  return (
    <div
      ref={ref}
      id={axisKey ? `breakdown-${axisKey}` : undefined}
      className="space-y-1.5 rounded-xl transition-all duration-300"
      style={{
        padding: highlight ? '10px 12px' : '2px 0',
        background: highlight ? (color + '10') : 'transparent',
        border: highlight ? `1.5px solid ${color}44` : '1.5px solid transparent',
        marginLeft: highlight ? -12 : 0,
        marginRight: highlight ? -12 : 0,
      }}
    >
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span style={{ color: '#18162a', fontWeight: highlight ? 800 : 600 }}>{label}</span>
          <span className="px-1.5 py-0.5 rounded-full text-xs"
            style={{ background: '#f0eefb', color: '#8b7fd4' }}>{weight}</span>
          <span style={{ fontWeight: 700, color }}>{scoreToLabel(score)}</span>
          {highlight && (
            <span style={{
              fontSize: 9, fontWeight: 700, color,
              background: color + '18', border: `1px solid ${color}44`,
              padding: '1px 5px', borderRadius: 5,
            }}>
              주도 축
            </span>
          )}
        </div>
        <span className="font-mono font-bold text-xs" style={{ color }}>
          {contrib > 0 ? `+${contrib.toFixed(2)}` : contrib.toFixed(2)}
        </span>
      </div>
      <div className="relative h-2 rounded-full" style={{ background: '#f0eefb', overflow: 'visible' }}>
        {/* 중앙선 */}
        <div className="absolute top-0 bottom-0 w-px" style={{ left: '50%', background: '#c4c0d8' }} />
        {/* 점수 바 */}
        <div className="absolute top-0 bottom-0 rounded-full transition-all duration-500" style={{
          left: pct >= 50 ? '50%' : `${pct}%`,
          width: `${Math.abs(pct - 50)}%`,
          background: color,
          opacity: 0.5,
        }} />
        {/* 점수 도트 */}
        <div className="absolute z-10" style={{
          left: `${pct}%`,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 12, height: 12,
          borderRadius: '50%',
          background: color,
          border: '2px solid #fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
        }} />
      </div>
      {detail && (
        <p className="text-xs" style={{ color: '#9e9ab8' }}>{detail}</p>
      )}
      <div className="flex justify-between text-xs" style={{ color: '#c4c0d8' }}>
        <span>◀ 약세</span>
        <span>강세 ▶</span>
      </div>
    </div>
  )
}

// ── 기여 뉴스 카드 ─────────────────────────────────────────────
function NewsCard({ news }: { news: ContributingNews }) {
  const color = sentimentColor(news.sentimentLabel)
  const label = sentimentLabel(news.sentimentLabel)
  const score = news.sentimentScore
  const date = new Date(news.publishedAt).toLocaleDateString('ko-KR', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  return (
    <a href={news.url} target="_blank" rel="noopener noreferrer"
      className="block rounded-xl p-3 transition-all hover:shadow-md"
      style={{ background: '#faf9ff', border: '1px solid #ede9f8', textDecoration: 'none' }}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
          {label} {score > 0 ? `+${score.toFixed(2)}` : score.toFixed(2)}
        </span>
        <span className="text-xs shrink-0" style={{ color: '#c4c0d8' }}>{news.source}</span>
      </div>
      <p className="text-sm font-medium leading-snug mb-1" style={{ color: '#18162a' }}>
        {news.titleKo || news.title}
      </p>
      <p className="text-xs" style={{ color: '#9e9ab8' }}>{date} · 원문 보기 →</p>
    </a>
  )
}

// ── 메인 모달 ──────────────────────────────────────────────────
export default function SignalDetailModal({ signal, onClose, highlightAxis }: Props) {
  const cfg   = signalConfig[signal.signal] ?? signalConfig.HOLD
  const bd    = signal.breakdown
  const conf  = signal.confidence ?? 0
  const label = signalLabel(signal.signal, conf)
  const ctx   = confContext(conf, bd)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(24,22,42,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ background: '#fff', boxShadow: '0 8px 40px rgba(139,127,212,0.20)' }}
      >
        {/* 헤더 */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
          style={{ background: '#fff', borderBottom: '1px solid #f0eefb' }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{cfg.emoji}</span>
            <div>
              <h2 className="font-bold text-base" style={{ color: '#18162a' }}>
                {signal.ticker} — AI 신호 근거
              </h2>
              <p className="text-xs" style={{ color: '#9e9ab8' }}>{signal.date}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-sm transition-colors"
            style={{ background: '#f0eefb', color: '#8b7fd4' }}>✕</button>
        </div>

        <div className="px-6 py-4 space-y-6">

          {/* 신호 배지 + 신뢰도 */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              {/* 상태 묘사 레이블 */}
              <span className="px-4 py-2 rounded-xl text-sm font-bold"
                style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                {label}
              </span>
              {/* BUY/SELL/HOLD 보조 뱃지 */}
              <span className="text-xs font-bold px-2 py-1 rounded-lg"
                style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                {signal.signal}
              </span>
              <span className="text-sm" style={{ color: '#9e9ab8' }}>
                신뢰도 {(conf * 100).toFixed(0)}%
              </span>
              {bd?.earningsRisk && (
                <span className="px-2 py-1 rounded-lg text-xs font-medium"
                  style={{ background: '#fff7ed', color: '#f97316', border: '1px solid #fed7aa' }}>
                  ⚠️ 어닝 임박
                </span>
              )}
            </div>
            {/* 신뢰도 맥락 문구 */}
            {ctx && (
              <p className="text-xs rounded-lg px-3 py-2"
                style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                ⚠️ {ctx}
              </p>
            )}
          </div>

          {/* 신호 이유 */}
          <div className="rounded-xl p-4" style={{ background: '#faf9ff', border: '1px solid #ede9f8' }}>
            <p className="text-xs font-semibold mb-1.5" style={{ color: '#8b7fd4' }}>📝 AI 분석 요약</p>
            <p className="text-sm leading-relaxed" style={{ color: '#18162a' }}>{signal.reason}</p>
          </div>

          {/* 4축 기여도 */}
          {bd && (
            <div>
              <p className="text-xs font-semibold mb-3" style={{ color: '#5e5a78' }}>
                📊 4축 종합 분석 (종합 점수: {signal.combinedScore != null
                  ? (signal.combinedScore > 0 ? `+${signal.combinedScore.toFixed(2)}` : signal.combinedScore.toFixed(2))
                  : '-'})
              </p>
              <div className="space-y-4">
                <BreakdownBar
                  label="기술적 분석"
                  weight="40%"
                  score={bd.technicalScore}
                  contrib={bd.technicalContrib}
                  detail={bd.technicalDetail || undefined}
                  axisKey="technical"
                  highlight={highlightAxis === 'technical'}
                />
                <BreakdownBar
                  label="뉴스 감성"
                  weight="30%"
                  score={bd.sentimentScore}
                  contrib={bd.sentimentContrib}
                  axisKey="sentiment"
                  highlight={highlightAxis === 'sentiment'}
                />
                <BreakdownBar
                  label="펀더멘털"
                  weight="20%"
                  score={bd.fundamentalScore}
                  contrib={bd.fundamentalContrib}
                  detail={bd.fundamentalDetail || undefined}
                  axisKey="fundamental"
                  highlight={highlightAxis === 'fundamental'}
                />
                <BreakdownBar
                  label="시장 컨텍스트"
                  weight="10%"
                  score={bd.marketScore}
                  contrib={bd.marketContrib}
                  axisKey="market"
                  highlight={highlightAxis === 'market'}
                />
              </div>
            </div>
          )}

          {/* 기여 뉴스 Top 3 */}
          {signal.contributingNews && signal.contributingNews.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-3" style={{ color: '#5e5a78' }}>
                📰 신호에 기여한 뉴스 Top {signal.contributingNews.length}
              </p>
              <div className="space-y-2">
                {signal.contributingNews.map((news, i) => (
                  <NewsCard key={i} news={news} />
                ))}
              </div>
            </div>
          )}

          {/* 면책 조항 */}
          <p className="text-xs pb-2" style={{ color: '#c4c0d8', borderTop: '1px solid #f0eefb', paddingTop: 12 }}>
            ⚠️ 본 분석은 AI 참고 자료이며 투자 권유가 아닙니다. 투자 결정은 본인 판단에 따르시기 바랍니다.
          </p>
        </div>
      </div>
    </div>
  )
}
