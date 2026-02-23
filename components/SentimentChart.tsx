'use client'

import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { sentimentApi } from '@/lib/api'
import type { SentimentTimeSeries } from '@/types'

interface SentimentChartProps {
  ticker: string
  hours?: number
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const color = d.score > 0 ? '#10b981' : d.score < 0 ? '#ef4444' : '#64748b'
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '10px',
      padding: '10px 14px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
      fontSize: '13px',
    }}>
      <p style={{ margin: '0 0 6px', color: '#475569', fontWeight: 600 }}>{label}</p>
      <p style={{ margin: '2px 0', color, fontWeight: 700 }}>
        감성 점수: {d.score > 0 ? '+' : ''}{d.score.toFixed(3)}
      </p>
      <p style={{ margin: '2px 0', color: '#94a3b8' }}>뉴스 {d.count}건</p>
    </div>
  )
}

export default function SentimentChart({ ticker, hours = 24 }: SentimentChartProps) {
  const [data, setData] = useState<SentimentTimeSeries | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ticker) return
    setLoading(true)
    setError(null)
    sentimentApi.getTimeSeries(ticker, hours)
      .then(setData)
      .catch(() => setError('차트 데이터를 불러오는데 실패했습니다.'))
      .finally(() => setLoading(false))
  }, [ticker, hours])

  const cardStyle = {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
  }

  if (loading) return (
    <div style={cardStyle} className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent" style={{ borderColor: '#3d5af1', borderTopColor: 'transparent' }} />
    </div>
  )

  if (error) return (
    <div style={{ ...cardStyle, border: '1px solid #fecaca' }}>
      <p className="text-center text-sm" style={{ color: '#ef4444' }}>{error}</p>
    </div>
  )

  if (!data?.dataPoints?.length) return (
    <div style={cardStyle}>
      <p className="text-center text-sm" style={{ color: '#94a3b8' }}>시계열 데이터가 없습니다.</p>
    </div>
  )

  const chartData = data.dataPoints.map(p => ({
    time: new Date(p.timestamp).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    score: p.averageScore,
    count: p.totalCount,
  }))

  const avgScore = data.summary.averageScore
  const lastScore = data.dataPoints[data.dataPoints.length - 1].averageScore
  const scoreColor = (v: number) => v > 0 ? '#10b981' : v < 0 ? '#ef4444' : '#64748b'

  return (
    <div style={cardStyle} className="fade-in">
      <div className="mb-5">
        <h3 className="font-semibold mb-0.5" style={{ color: '#0f172a' }}>감성 점수 추이</h3>
        <p className="text-xs" style={{ color: '#94a3b8' }}>
          {ticker} · 최근 {hours}시간 · {data.dataPoints.length}개 포인트
        </p>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" />
          <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            angle={-35}
            textAnchor="end"
            height={60}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[-1, 1]}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#3d5af1"
            strokeWidth={2.5}
            dot={{ r: 3.5, fill: '#3d5af1', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#3d5af1', stroke: '#fff', strokeWidth: 2 }}
            name="감성 점수"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* 통계 요약 */}
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        {[
          { label: '평균 점수', value: avgScore.toFixed(3),  color: scoreColor(avgScore) },
          { label: '총 뉴스',  value: data.summary.totalNews, color: '#0f172a' },
          { label: '최근 점수', value: lastScore.toFixed(3),  color: scoreColor(lastScore) },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px' }}>
            <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>{label}</p>
            <p style={{ fontSize: '16px', fontWeight: 700, color }}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
