'use client'

import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { sentimentApi } from '@/lib/api'
import type { SentimentTimeSeries } from '@/types'

interface SentimentChartProps {
  ticker: string
  hours?: number
}

// Custom Tooltip 컴포넌트
interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  // payload[0]에서 원본 데이터 가져오기
  const data = payload[0].payload
  const scoreColor = data.score > 0 ? '#10b981' : data.score < 0 ? '#ef4444' : '#6b7280'

  return (
    <div
      style={{
        backgroundColor: 'rgba(26, 31, 58, 0.95)',
        border: '1px solid #374151',
        borderRadius: '12px',
        padding: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#f9fafb', fontSize: '12px' }}>{label}</p>
      <p style={{ margin: '4px 0', color: scoreColor, fontWeight: '600' }}>
        {data.score > 0 ? '✅' : data.score < 0 ? '❌' : '⚪'} 감성 점수: {data.score.toFixed(3)}
      </p>
      <p style={{ margin: '4px 0', color: '#d1d5db', fontWeight: '600' }}>
        📰 뉴스 개수: {data.count}
      </p>
    </div>
  )
}

export default function SentimentChart({ ticker, hours = 24 }: SentimentChartProps) {
  const [data, setData] = useState<SentimentTimeSeries | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const result = await sentimentApi.getTimeSeries(ticker, hours)
        setData(result)
      } catch (err: any) {
        console.error('시계열 데이터 로드 실패:', err)
        setError('차트 데이터를 불러오는데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }

    if (ticker) {
      fetchData()
    }
  }, [ticker, hours])

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue glow-effect"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card border-2 border-negative/50">
        <div className="text-center text-negative">
          <p>❌ {error}</p>
        </div>
      </div>
    )
  }

  if (!data || !data.dataPoints || data.dataPoints.length === 0) {
    return (
      <div className="card">
        <div className="text-center text-text-secondary">
          <p>시계열 데이터가 없습니다.</p>
          <p className="text-sm mt-2 text-text-muted">최소 2개 이상의 뉴스가 필요합니다.</p>
        </div>
      </div>
    )
  }

  // 차트 데이터 변환
  const chartData = data.dataPoints.map((point) => ({
    time: new Date(point.timestamp).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    score: point.averageScore,
    count: point.totalCount,
  }))

  return (
    <div className="card card-glow fade-in">
      <div className="mb-4">
        <h3 className="text-lg font-bold gradient-text">
          📈 감성 점수 추이 ({ticker})
        </h3>
        <p className="text-sm text-text-secondary">
          최근 {hours}시간 • {data.dataPoints.length}개 데이터 포인트
        </p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            angle={-45}
            textAnchor="end"
            height={80}
            stroke="#6b7280"
            tickLine={false}
          />
          <YAxis
            domain={[-1, 1]}
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            label={{ value: '감성 점수', angle: -90, position: 'insideLeft', fill: '#d1d5db' }}
            stroke="#6b7280"
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ color: '#d1d5db', fontSize: '14px' }}
            iconType="circle"
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
            name="감성 점수"
            filter="drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* 통계 요약 */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div className="glass p-3 rounded-lg border border-border">
          <p className="text-xs text-text-muted">평균 점수</p>
          <p className="text-lg font-bold gradient-text">
            {data.summary.averageScore.toFixed(3)}
          </p>
        </div>
        <div className="glass p-3 rounded-lg border border-border">
          <p className="text-xs text-text-muted">총 뉴스</p>
          <p className="text-lg font-bold text-text-primary">
            {data.summary.totalNews}
          </p>
        </div>
        <div className="glass p-3 rounded-lg border border-border">
          <p className="text-xs text-text-muted">최근 점수</p>
          <p
            className={`text-lg font-bold ${
              data.dataPoints[data.dataPoints.length - 1].averageScore > 0
                ? 'text-positive'
                : data.dataPoints[data.dataPoints.length - 1].averageScore < 0
                ? 'text-negative'
                : 'text-neutral'
            }`}
          >
            {data.dataPoints[data.dataPoints.length - 1].averageScore > 0 ? '✅' : data.dataPoints[data.dataPoints.length - 1].averageScore < 0 ? '❌' : '⚪'} {data.dataPoints[data.dataPoints.length - 1].averageScore.toFixed(3)}
          </p>
        </div>
      </div>
    </div>
  )
}
