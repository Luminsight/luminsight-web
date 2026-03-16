'use client'

import { useEffect, useState } from 'react'
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts'
import { sentimentApi } from '@/lib/api'
import type { SentimentTimeSeries } from '@/types'
import { scoreToLabel, scoreToColor } from '@/components/SentimentGauge'

interface Props { ticker: string; hours: number }

const ACCENT = '#8b7fd4'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const val = payload[0].value as number
  const color = scoreToColor(val)
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #ece9f5',
      borderRadius: '12px',
      padding: '10px 14px',
      boxShadow: '0 4px 20px rgba(139,127,212,0.13)',
      fontSize: 12,
    }}>
      <p style={{ color: '#9e9ab8', marginBottom: 4 }}>{label}</p>
      <p style={{ fontWeight: 700, color }}>
        {val > 0 ? '+' : ''}{val.toFixed(2)}
      </p>
      <p style={{ color, fontSize: 11, marginTop: 2 }}>{scoreToLabel(val)}</p>
    </div>
  )
}

export default function SentimentChart({ ticker, hours }: Props) {
  const [data, setData]       = useState<SentimentTimeSeries | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    setLoading(true); setError(null)
    sentimentApi.getTimeSeries(ticker, hours)
      .then(setData)
      .catch(() => setError('데이터를 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [ticker, hours])

  const CARD: React.CSSProperties = {
    background: '#ffffff',
    borderRadius: '18px',
    padding: '24px',
    boxShadow: '0 2px 12px rgba(139,127,212,0.09)',
  }

  if (loading) return (
    <div style={CARD}>
      <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-pulse" style={{ color: '#c4c0d8', fontSize: 13 }}>로딩 중...</div>
      </div>
    </div>
  )

  if (error || !data?.dataPoints.length) return (
    <div style={CARD}>
      <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c4c0d8', fontSize: 13 }}>
        {error ?? '데이터가 없습니다.'}
      </div>
    </div>
  )

  const points = data!.dataPoints
  const avg = points.reduce((s, d) => s + d.averageScore, 0) / points.length
  const max = Math.max(...points.map(d => d.averageScore))
  const min = Math.min(...points.map(d => d.averageScore))
  const trend = points.length >= 2
    ? points[points.length - 1].averageScore - points[0].averageScore
    : 0
  const trendColor = trend > 0 ? '#22c55e' : trend < 0 ? '#f43f5e' : '#8b8fa8'

  return (
    <div style={CARD} className="fade-in">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="font-semibold text-sm" style={{ color: '#18162a' }}>감성 추이</h3>
          <p className="text-xs mt-0.5" style={{ color: '#9e9ab8' }}>{ticker} · {hours}시간</p>
        </div>
        <div className="flex gap-3">
          {[
            { label: '평균', val: avg.toFixed(2), sublabel: scoreToLabel(avg), color: scoreToColor(avg) },
            { label: '최고', val: max.toFixed(2), sublabel: scoreToLabel(max), color: '#22c55e' },
            { label: '최저', val: min.toFixed(2), sublabel: scoreToLabel(min), color: '#f43f5e' },
            { label: '추세', val: (trend > 0 ? '+' : '') + trend.toFixed(2), sublabel: trend > 0 ? '상승' : trend < 0 ? '하락' : '보합', color: trendColor },
          ].map(s => (
            <div key={s.label} style={{
              background: '#f8f7fd', borderRadius: 10, padding: '6px 10px', textAlign: 'center',
            }}>
              <p style={{ fontSize: 10, color: '#9e9ab8' }}>{s.label}</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.val}</p>
              <p style={{ fontSize: 9, color: s.color, opacity: 0.8, marginTop: 1 }}>{s.sublabel}</p>
            </div>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={points} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="sentimentGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={ACCENT} stopOpacity={0.15} />
              <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f1fa" vertical={false} />
          <XAxis
            dataKey="timestamp"
            tick={{ fill: '#c4c0d8', fontSize: 10 }}
            axisLine={false} tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fill: '#c4c0d8', fontSize: 10 }}
            axisLine={false} tickLine={false}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#ece9f5" strokeWidth={1.5} />
          <Line
            type="monotone" dataKey="averageScore"
            stroke={ACCENT} strokeWidth={2.5}
            dot={false} activeDot={{ r: 4, fill: ACCENT, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
