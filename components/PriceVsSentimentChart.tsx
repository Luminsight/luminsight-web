'use client'

import { useEffect, useState } from 'react'
import {
  ComposedChart, Area, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer, Legend,
} from 'recharts'
import { sentimentApi, technicalApi } from '@/lib/api'
import type { SentimentTimeSeries, TechnicalIndicatorData } from '@/types'

// ── 상수 ────────────────────────────────────────────────────────
const ACCENT    = '#8b7fd4'
const PRICE_CLR = '#94a3b8'
const POS_CLR   = '#ef4444'
const NEG_CLR   = '#2563eb'

const CARD: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: '18px',
  padding: '24px',
  boxShadow: '0 2px 12px rgba(139,127,212,0.09)',
}

// ── 날짜 포맷 ────────────────────────────────────────────────────
function toDateKey(str: string): string {
  // "2026-02-05T00:00:00" → "2026-02-05"
  // "2026-02-05"         → "2026-02-05"
  return str.slice(0, 10)
}

function fmtLabel(dateKey: string): string {
  const [, m, d] = dateKey.split('-')
  return `${parseInt(m)}/${parseInt(d)}`
}

// ── 피어슨 상관계수 ──────────────────────────────────────────────
function pearson(xs: number[], ys: number[]): number {
  const n = xs.length
  if (n < 2) return 0
  const mx = xs.reduce((s, v) => s + v, 0) / n
  const my = ys.reduce((s, v) => s + v, 0) / n
  let num = 0, dx = 0, dy = 0
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx
    const b = ys[i] - my
    num += a * b
    dx  += a * a
    dy  += b * b
  }
  if (dx === 0 || dy === 0) return 0
  return num / Math.sqrt(dx * dy)
}

// ── 감성 선행 분석 (최적 리드/래그 일수) ────────────────────────
function findLeadDays(
  priceArr: number[],
  sentArr:  number[],
): { lead: number; corr: number } {
  let best = { lead: 0, corr: 0 }
  for (let lag = -3; lag <= 3; lag++) {
    const aligned = priceArr.slice(Math.max(0, lag), priceArr.length + Math.min(0, lag))
    const sAligned = sentArr.slice(Math.max(0, -lag), sentArr.length + Math.min(0, -lag))
    const len = Math.min(aligned.length, sAligned.length)
    if (len < 5) continue
    const c = Math.abs(pearson(aligned.slice(0, len), sAligned.slice(0, len)))
    if (c > Math.abs(best.corr)) best = { lead: lag, corr: c }
  }
  return best
}

// ── 가격 변화율 정규화 (-1 ~ 1) ──────────────────────────────────
function normalizePrices(prices: number[]): number[] {
  if (prices.length < 2) return prices.map(() => 0)
  const first = prices[0]
  return prices.map(p => (p - first) / Math.max(first, 1))
}

// ── 커스텀 툴팁 ──────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const priceEntry = payload.find((p: { dataKey: string }) => p.dataKey === 'price')
  const sentEntry  = payload.find((p: { dataKey: string }) => p.dataKey === 'sentiment')
  const sent = sentEntry?.value as number | undefined

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #ece9f5',
      borderRadius: '12px',
      padding: '12px 16px',
      boxShadow: '0 4px 20px rgba(139,127,212,0.13)',
      fontSize: 12,
      minWidth: 150,
    }}>
      <p style={{ color: '#9e9ab8', marginBottom: 8, fontWeight: 500 }}>{label}</p>
      {priceEntry?.value != null && (
        <p style={{ color: '#475569', marginBottom: 4 }}>
          주가 <span style={{ fontWeight: 700, color: '#1e293b' }}>${Number(priceEntry.value).toFixed(2)}</span>
        </p>
      )}
      {sent != null && (
        <p style={{ color: sent > 0 ? POS_CLR : sent < 0 ? NEG_CLR : '#8b8fa8' }}>
          감성 <span style={{ fontWeight: 700 }}>{sent > 0 ? '+' : ''}{sent.toFixed(3)}</span>
        </p>
      )}
    </div>
  )
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────
interface Props { ticker: string }

interface ChartRow {
  date:      string
  price:     number | null
  sentiment: number | null
}

export default function PriceVsSentimentChart({ ticker }: Props) {
  const [chartData,   setChartData]   = useState<ChartRow[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [correlation, setCorrelation] = useState<number | null>(null)
  const [leadDays,    setLeadDays]    = useState<number>(0)
  const [priceRange,  setPriceRange]  = useState<{ min: number; max: number } | null>(null)

  useEffect(() => {
    setLoading(true); setError(null)

    Promise.all([
      technicalApi.getIndicators(ticker, 30),
      sentimentApi.getTimeSeriesByDays(ticker, 30),
    ])
      .then(([tech, sent]: [TechnicalIndicatorData, SentimentTimeSeries]) => {
        buildChart(tech, sent)
      })
      .catch(() => setError('데이터를 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [ticker])

  function buildChart(tech: TechnicalIndicatorData, sent: SentimentTimeSeries) {
    // 날짜 → 종가 맵
    const priceMap = new Map<string, number>()
    for (const p of tech.priceData) {
      priceMap.set(toDateKey(p.date), p.close)
    }

    // 날짜 → 감성 맵
    const sentMap = new Map<string, number>()
    for (const s of sent.dataPoints) {
      sentMap.set(toDateKey(s.timestamp), s.averageScore)
    }

    // 모든 날짜 정렬
    const allDates = Array.from(
      new Set([...priceMap.keys(), ...sentMap.keys()])
    ).sort()

    const rows: ChartRow[] = allDates.map(dk => ({
      date:      fmtLabel(dk),
      price:     priceMap.get(dk) ?? null,
      sentiment: sentMap.get(dk) ?? null,
    }))

    setChartData(rows)

    // 상관 분석
    const paired = rows.filter(r => r.price != null && r.sentiment != null)
    if (paired.length >= 5) {
      const prices = paired.map(r => r.price!)
      const sents  = paired.map(r => r.sentiment!)

      const corr = pearson(normalizePrices(prices), sents)
      setCorrelation(corr)

      const { lead } = findLeadDays(normalizePrices(prices), sents)
      setLeadDays(lead)
    }

    const allPrices = rows.map(r => r.price).filter(Boolean) as number[]
    if (allPrices.length > 0) {
      setPriceRange({ min: Math.min(...allPrices), max: Math.max(...allPrices) })
    }
  }

  // ── 로딩 ────────────────────────────────────────────────────
  if (loading) return (
    <div style={CARD}>
      <div style={{ height: 14, width: 160, background: '#f3f1fa', borderRadius: 6, marginBottom: 20 }} />
      <div style={{ height: 220, background: '#f8f7fd', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-pulse" style={{ color: '#c4c0d8', fontSize: 13 }}>로딩 중...</div>
      </div>
    </div>
  )

  // ── 에러 ────────────────────────────────────────────────────
  if (error || chartData.length === 0) return (
    <div style={CARD}>
      <h3 style={{ fontWeight: 600, fontSize: 14, color: '#18162a', marginBottom: 16 }}>주가 vs 감성</h3>
      <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c4c0d8', fontSize: 13 }}>
        {error ?? '데이터가 없습니다.'}
      </div>
    </div>
  )

  // ── 상관계수 UI ─────────────────────────────────────────────
  const corrLabel = correlation == null ? null
    : Math.abs(correlation) >= 0.6 ? (correlation > 0 ? '강한 양의 상관' : '강한 음의 상관')
    : Math.abs(correlation) >= 0.3 ? (correlation > 0 ? '약한 양의 상관' : '약한 음의 상관')
    : '상관관계 낮음'

  const corrColor = correlation == null ? '#8b8fa8'
    : Math.abs(correlation) >= 0.6 ? (correlation > 0 ? POS_CLR : NEG_CLR)
    : Math.abs(correlation) >= 0.3 ? (correlation > 0 ? '#f97316' : '#6366f1')
    : '#8b8fa8'

  const leadText = leadDays > 0
    ? `감성이 주가보다 ${leadDays}일 선행`
    : leadDays < 0
    ? `주가가 감성보다 ${Math.abs(leadDays)}일 선행`
    : '동행 관계'

  return (
    <div style={CARD} className="fade-in">

      {/* ── 헤더 ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h3 style={{ fontWeight: 600, fontSize: 14, color: '#18162a', margin: '0 0 4px' }}>주가 vs 감성 상관</h3>
          <p style={{ fontSize: 12, color: '#9e9ab8', margin: 0 }}>{ticker} · 최근 30일</p>
        </div>

        {/* 상관계수 뱃지 */}
        {correlation != null && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#f8f7fd', borderRadius: 12, padding: '8px 14px',
          }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 10, color: '#9e9ab8', margin: '0 0 2px' }}>상관계수</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: corrColor, margin: 0 }}>
                {correlation > 0 ? '+' : ''}{correlation.toFixed(2)}
              </p>
            </div>
            <div style={{ width: 1, height: 28, background: '#ece9f5' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 10, color: '#9e9ab8', margin: '0 0 2px' }}>관계</p>
              <p style={{ fontSize: 11, fontWeight: 600, color: corrColor, margin: 0 }}>{corrLabel}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── 인사이트 문구 ─────────────────────────────────────── */}
      {correlation != null && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', borderRadius: 10, marginBottom: 16,
          background: '#f8f7fd', border: '1px solid #ece9f5',
        }}>
          <span style={{ fontSize: 14 }}>💡</span>
          <p style={{ fontSize: 12, color: '#5e5a78', margin: 0 }}>
            <strong>{leadText}</strong>
            {corrLabel !== '상관관계 낮음'
              ? ` · AI 감성 신호와 주가 흐름이 ${corrLabel} 관계입니다.`
              : ' · 현재 구간에서는 감성과 주가 간 뚜렷한 연관성이 낮습니다.'}
          </p>
        </div>
      )}

      {/* ── 차트 ─────────────────────────────────────────────── */}
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={chartData} margin={{ top: 4, right: 48, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={PRICE_CLR} stopOpacity={0.25} />
              <stop offset="100%" stopColor={PRICE_CLR} stopOpacity={0.03} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#f3f1fa" vertical={false} />

          {/* 좌측 Y축: 주가 */}
          <YAxis
            yAxisId="price"
            orientation="left"
            domain={priceRange ? [priceRange.min * 0.97, priceRange.max * 1.03] : ['auto', 'auto']}
            tick={{ fill: '#c4c0d8', fontSize: 10 }}
            axisLine={false} tickLine={false}
            width={48}
            tickFormatter={v => `$${Math.round(v)}`}
          />

          {/* 우측 Y축: 감성 점수 */}
          <YAxis
            yAxisId="sentiment"
            orientation="right"
            domain={[-1, 1]}
            tick={{ fill: '#c4c0d8', fontSize: 10 }}
            axisLine={false} tickLine={false}
            width={36}
            tickFormatter={v => v.toFixed(1)}
          />

          <XAxis
            dataKey="date"
            tick={{ fill: '#c4c0d8', fontSize: 10 }}
            axisLine={false} tickLine={false}
            interval="preserveStartEnd"
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            verticalAlign="top"
            align="right"
            height={28}
            formatter={(value: string) => (
              <span style={{ fontSize: 11, color: '#9e9ab8' }}>
                {value === 'price' ? '주가 ($)' : '감성 점수'}
              </span>
            )}
          />

          {/* 주가 영역 */}
          <Area
            yAxisId="price"
            type="monotone"
            dataKey="price"
            fill="url(#priceGrad)"
            stroke={PRICE_CLR}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: PRICE_CLR, strokeWidth: 0 }}
            connectNulls
          />

          {/* 감성 기준선 */}
          <ReferenceLine yAxisId="sentiment" y={0} stroke="#d4cff2" strokeWidth={1.5} strokeDasharray="4 2" />

          {/* 감성 라인 */}
          <Line
            yAxisId="sentiment"
            type="monotone"
            dataKey="sentiment"
            stroke={ACCENT}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: ACCENT, strokeWidth: 0 }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* ── 범례 보조 ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 16, marginTop: 10, justifyContent: 'center', fontSize: 11, color: '#9e9ab8' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 14, height: 3, background: PRICE_CLR, borderRadius: 2, display: 'inline-block', opacity: 0.6 }} />
          주가 (좌축)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 14, height: 3, background: ACCENT, borderRadius: 2, display: 'inline-block' }} />
          감성 점수 (우축)
        </span>
      </div>
    </div>
  )
}
