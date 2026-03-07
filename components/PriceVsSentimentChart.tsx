'use client'

import { useEffect, useState } from 'react'
import {
  ComposedChart, Area, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { sentimentApi, technicalApi } from '@/lib/api'
import type { SentimentTimeSeries, TechnicalIndicatorData } from '@/types'

// ── 상수 ────────────────────────────────────────────────────────
const ACCENT    = '#8b7fd4'
const PRICE_CLR = '#94a3b8'

const CARD: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: '18px',
  padding: '24px',
  boxShadow: '0 2px 12px rgba(139,127,212,0.09)',
}

// ── 날짜 포맷 ────────────────────────────────────────────────────
function toDateKey(str: string): string {
  return str.slice(0, 10)
}

function fmtLabel(dateKey: string): string {
  const [, m, d] = dateKey.split('-')
  return `${parseInt(m)}/${parseInt(d)}`
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
        <p style={{ color: sent > 0 ? '#ef4444' : sent < 0 ? '#2563eb' : '#8b8fa8' }}>
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
  const [chartData,  setChartData]  = useState<ChartRow[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null)

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
    const priceMap = new Map<string, number>()
    for (const p of tech.priceData) {
      priceMap.set(toDateKey(p.date), p.close)
    }

    const sentMap = new Map<string, number>()
    for (const s of sent.dataPoints) {
      sentMap.set(toDateKey(s.timestamp), s.averageScore)
    }

    const allDates = Array.from(
      new Set([...priceMap.keys(), ...sentMap.keys()])
    ).sort()

    const rows: ChartRow[] = allDates.map(dk => ({
      date:      fmtLabel(dk),
      price:     priceMap.get(dk) ?? null,
      sentiment: sentMap.get(dk) ?? null,
    }))

    setChartData(rows)

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
      <h3 style={{ fontWeight: 600, fontSize: 14, color: '#18162a', marginBottom: 16 }}>시장 분위기 vs 주가</h3>
      <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c4c0d8', fontSize: 13 }}>
        {error ?? '데이터가 없습니다.'}
      </div>
    </div>
  )

  return (
    <div style={CARD} className="fade-in">

      {/* ── 헤더 ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontWeight: 600, fontSize: 14, color: '#18162a', margin: '0 0 4px' }}>시장 분위기 vs 주가</h3>
        <p style={{ fontSize: 12, color: '#9e9ab8', margin: 0 }}>{ticker} · 최근 30일</p>
      </div>

      {/* ── 차트 ─────────────────────────────────────────────── */}
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={chartData} margin={{ top: 4, right: 48, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id="priceGrad2" x1="0" y1="0" x2="0" y2="1">
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

          {/* 주가 영역 */}
          <Area
            yAxisId="price"
            type="monotone"
            dataKey="price"
            fill="url(#priceGrad2)"
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

      {/* ── 범례 ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 16, marginTop: 10, justifyContent: 'center', fontSize: 11, color: '#9e9ab8' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 14, height: 3, background: PRICE_CLR, borderRadius: 2, display: 'inline-block', opacity: 0.6 }} />
          주가 (좌축)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 14, height: 3, background: ACCENT, borderRadius: 2, display: 'inline-block' }} />
          시장 감성 (우축)
        </span>
      </div>
    </div>
  )
}
