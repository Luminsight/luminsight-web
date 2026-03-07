'use client'

import { useEffect, useState } from 'react'
import {
  ComposedChart, Area, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { sentimentApi } from '@/lib/api'
import type { SentimentTimeSeries, SentimentTrend } from '@/types'

// ── 상수 ────────────────────────────────────────────────────────
const ACCENT   = '#8b7fd4'
const POSITIVE = '#ef4444'  // 한국 증시 관례: 빨강 = 상승/긍정
const NEGATIVE = '#2563eb'  // 파랑 = 하락/부정

const TREND_CONFIG: Record<SentimentTrend, { label: string; color: string; bg: string; icon: string }> = {
  IMPROVING:    { label: '개선 중',  color: '#ef4444', bg: '#fff1f1', icon: '↑' },
  DETERIORATING:{ label: '악화 중',  color: '#2563eb', bg: '#eff6ff', icon: '↓' },
  STABLE:       { label: '안정적',   color: '#6b7280', bg: '#f3f4f6', icon: '━' },
  VOLATILE:     { label: '변동 큰', color: '#d97706', bg: '#fffbeb', icon: '⚡' },
}

const DAY_OPTIONS = [
  { label: '7일',  value: 7 },
  { label: '30일', value: 30 },
  { label: '90일', value: 90 },
]

// ── 날짜 포맷 ────────────────────────────────────────────────────
function formatDate(timestamp: string, days: number): string {
  const d = new Date(timestamp)
  if (days <= 7) {
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}시`
  }
  return `${d.getMonth() + 1}/${d.getDate()}`
}

// ── 차트 데이터 변환 ─────────────────────────────────────────────
function toChartData(points: SentimentTimeSeries['dataPoints'], days: number) {
  return points.map(d => ({
    date:          formatDate(d.timestamp, days),
    score:         parseFloat(d.averageScore.toFixed(3)),
    positiveZone:  d.averageScore > 0 ? parseFloat(d.averageScore.toFixed(3)) : 0,
    negativeZone:  d.averageScore < 0 ? parseFloat(d.averageScore.toFixed(3)) : 0,
    totalCount:    d.totalCount,
    positiveCount: d.positiveCount ?? 0,
    negativeCount: d.negativeCount ?? 0,
    neutralCount:  d.neutralCount  ?? 0,
  }))
}

// ── 커스텀 툴팁 ──────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  const val   = d.score as number
  const color = val > 0 ? POSITIVE : val < 0 ? NEGATIVE : '#8b8fa8'

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #ece9f5',
      borderRadius: '12px',
      padding: '12px 16px',
      boxShadow: '0 4px 20px rgba(139,127,212,0.13)',
      fontSize: 12,
      minWidth: 140,
    }}>
      <p style={{ color: '#9e9ab8', marginBottom: 6, fontWeight: 500 }}>{label}</p>
      <p style={{ fontWeight: 700, color, fontSize: 15, marginBottom: 6 }}>
        {val > 0 ? '+' : ''}{val.toFixed(3)}
      </p>
      {d.totalCount > 0 && (
        <div style={{ borderTop: '1px solid #f3f1fa', paddingTop: 6, display: 'flex', gap: 10 }}>
          <span style={{ color: POSITIVE }}>↑ {d.positiveCount}</span>
          <span style={{ color: NEGATIVE }}>↓ {d.negativeCount}</span>
          <span style={{ color: '#8b8fa8' }}>− {d.neutralCount}</span>
        </div>
      )}
    </div>
  )
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────
interface Props { ticker: string }

const CARD: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: '18px',
  padding: '24px',
  boxShadow: '0 2px 12px rgba(139,127,212,0.09)',
}

export default function SentimentTrendChart({ ticker }: Props) {
  const [selectedDays, setSelectedDays] = useState(30)
  const [data,   setData]   = useState<SentimentTimeSeries | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    setLoading(true); setError(null)
    sentimentApi.getTimeSeriesByDays(ticker, selectedDays)
      .then(setData)
      .catch(() => setError('데이터를 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [ticker, selectedDays])

  // ── 로딩 ────────────────────────────────────────────────────
  if (loading) return (
    <div style={CARD}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ height: 14, width: 80, background: '#f3f1fa', borderRadius: 6, marginBottom: 6 }} />
          <div style={{ height: 10, width: 120, background: '#f8f7fd', borderRadius: 4 }} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {DAY_OPTIONS.map(o => (
            <div key={o.value} style={{ height: 28, width: 44, background: '#f8f7fd', borderRadius: 8 }} />
          ))}
        </div>
      </div>
      <div style={{ height: 220, background: '#f8f7fd', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-pulse" style={{ color: '#c4c0d8', fontSize: 13 }}>로딩 중...</div>
      </div>
    </div>
  )

  // ── 에러 / 빈 데이터 ────────────────────────────────────────
  if (error || !data?.dataPoints.length) return (
    <div style={CARD}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <h3 style={{ fontWeight: 600, fontSize: 14, color: '#18162a' }}>일별 감성 추이</h3>
        <DayTabs selected={selectedDays} onChange={setSelectedDays} />
      </div>
      <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c4c0d8', fontSize: 13 }}>
        {error ?? `${selectedDays}일간 데이터가 없습니다.`}
      </div>
    </div>
  )

  const chartData = toChartData(data.dataPoints, selectedDays)
  const summary   = data.summary
  const trend     = (summary.trend as SentimentTrend) ?? 'STABLE'
  const trendCfg  = TREND_CONFIG[trend] ?? TREND_CONFIG.STABLE

  const scoreChange = chartData.length >= 2
    ? chartData[chartData.length - 1].score - chartData[0].score
    : 0

  return (
    <div style={CARD} className="fade-in">

      {/* ── 헤더 ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h3 style={{ fontWeight: 600, fontSize: 14, color: '#18162a', margin: 0 }}>일별 감성 추이</h3>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              background: trendCfg.bg, color: trendCfg.color,
            }}>
              {trendCfg.icon} {trendCfg.label}
            </span>
          </div>
          <p style={{ fontSize: 12, color: '#9e9ab8', margin: 0 }}>
            {ticker} · {summary.totalNews}건 뉴스 분석
          </p>
        </div>
        <DayTabs selected={selectedDays} onChange={setSelectedDays} />
      </div>

      {/* ── 요약 수치 행 ─────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: '평균 점수', value: (summary.averageScore > 0 ? '+' : '') + summary.averageScore.toFixed(3), color: summary.averageScore > 0 ? POSITIVE : summary.averageScore < 0 ? NEGATIVE : '#8b8fa8' },
          { label: '기간 변화', value: (scoreChange > 0 ? '+' : '') + scoreChange.toFixed(3), color: scoreChange > 0 ? POSITIVE : scoreChange < 0 ? NEGATIVE : '#8b8fa8' },
          { label: '변동성',   value: (summary.volatility ?? 0).toFixed(3),                  color: (summary.volatility ?? 0) > 0.5 ? '#d97706' : '#8b8fa8' },
        ].map(stat => (
          <div key={stat.label} style={{ background: '#f8f7fd', borderRadius: 10, padding: '6px 12px', textAlign: 'center', flex: 1, minWidth: 70 }}>
            <p style={{ fontSize: 10, color: '#9e9ab8', margin: '0 0 2px' }}>{stat.label}</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: stat.color, margin: 0 }}>{stat.value}</p>
          </div>
        ))}
        {/* 감성 분포 */}
        <div style={{ background: '#f8f7fd', borderRadius: 10, padding: '6px 12px', flex: 2, minWidth: 120 }}>
          <p style={{ fontSize: 10, color: '#9e9ab8', margin: '0 0 4px' }}>뉴스 분포</p>
          <div style={{ display: 'flex', gap: 8, fontSize: 12, fontWeight: 600 }}>
            <span style={{ color: POSITIVE }}>↑ {summary.positiveCount ?? 0}</span>
            <span style={{ color: NEGATIVE }}>↓ {summary.negativeCount ?? 0}</span>
            <span style={{ color: '#8b8fa8' }}>− {summary.neutralCount ?? 0}</span>
          </div>
        </div>
      </div>

      {/* ── 차트 ─────────────────────────────────────────────── */}
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="posGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={POSITIVE} stopOpacity={0.18} />
              <stop offset="100%" stopColor={POSITIVE} stopOpacity={0.03} />
            </linearGradient>
            <linearGradient id="negGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%"   stopColor={NEGATIVE} stopOpacity={0.18} />
              <stop offset="100%" stopColor={NEGATIVE} stopOpacity={0.03} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#f3f1fa" vertical={false} />

          <XAxis
            dataKey="date"
            tick={{ fill: '#c4c0d8', fontSize: 10 }}
            axisLine={false} tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fill: '#c4c0d8', fontSize: 10 }}
            axisLine={false} tickLine={false}
            width={38}
            tickFormatter={v => v.toFixed(1)}
          />

          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#d4cff2" strokeWidth={1.5} strokeDasharray="4 2" />

          {/* 긍정 영역 */}
          <Area
            type="monotone"
            dataKey="positiveZone"
            fill="url(#posGrad)"
            stroke="none"
            isAnimationActive={false}
          />
          {/* 부정 영역 */}
          <Area
            type="monotone"
            dataKey="negativeZone"
            fill="url(#negGrad)"
            stroke="none"
            isAnimationActive={false}
          />
          {/* 실제 점수 라인 */}
          <Line
            type="monotone"
            dataKey="score"
            stroke={ACCENT}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: ACCENT, strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* ── 범례 ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 16, marginTop: 12, justifyContent: 'center', fontSize: 11, color: '#9e9ab8' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 12, height: 3, background: ACCENT, borderRadius: 2, display: 'inline-block' }} />
          감성 점수
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 12, height: 8, background: `${POSITIVE}30`, borderRadius: 2, display: 'inline-block' }} />
          긍정 구간
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 12, height: 8, background: `${NEGATIVE}30`, borderRadius: 2, display: 'inline-block' }} />
          부정 구간
        </span>
      </div>
    </div>
  )
}

// ── 일수 탭 ─────────────────────────────────────────────────────
function DayTabs({ selected, onChange }: { selected: number; onChange: (d: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: 4, background: '#f8f7fd', padding: '3px', borderRadius: 10 }}>
      {DAY_OPTIONS.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          style={{
            padding: '4px 10px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: selected === o.value ? 600 : 400,
            background: selected === o.value ? '#8b7fd4' : 'transparent',
            color:      selected === o.value ? '#ffffff' : '#9e9ab8',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
