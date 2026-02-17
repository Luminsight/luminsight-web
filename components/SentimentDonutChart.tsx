'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface SentimentDonutChartProps {
  positive: number
  negative: number
  neutral: number
}

export default function SentimentDonutChart({
  positive,
  negative,
  neutral,
}: SentimentDonutChartProps) {
  const total = positive + negative + neutral

  // 데이터가 없는 경우
  if (total === 0) {
    return (
      <div className="card">
        <div className="text-center text-text-secondary py-8">
          <p>데이터가 없습니다.</p>
        </div>
      </div>
    )
  }

  const data = [
    { name: '긍정', value: positive, color: '#10b981' },
    { name: '부정', value: negative, color: '#ef4444' },
    { name: '중립', value: neutral, color: '#6b7280' },
  ]

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) {
      return null
    }

    const data = payload[0]
    const percentage = ((data.value / total) * 100).toFixed(1)

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
        <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: data.payload.color }}>
          {data.name}
        </p>
        <p style={{ margin: '0', color: '#d1d5db', fontSize: '14px' }}>
          {data.value}개 ({percentage}%)
        </p>
      </div>
    )
  }

  return (
    <div className="card card-glow fade-in">
      <div className="mb-4">
        <h3 className="text-lg font-bold gradient-text">
          🍩 감성 비율
        </h3>
        <p className="text-sm text-text-secondary">
          총 {total}개 뉴스
        </p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                style={{
                  filter: `drop-shadow(0 0 8px ${entry.color}80)`,
                }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ color: '#d1d5db', fontSize: '14px' }}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>

      {/* 통계 요약 */}
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="glass p-2 rounded-lg border border-positive/30">
          <p className="text-xs text-text-muted">긍정</p>
          <p className="text-lg font-bold text-positive">
            {positive}
          </p>
          <p className="text-xs text-text-muted">
            {total > 0 ? ((positive / total) * 100).toFixed(1) : 0}%
          </p>
        </div>
        <div className="glass p-2 rounded-lg border border-negative/30">
          <p className="text-xs text-text-muted">부정</p>
          <p className="text-lg font-bold text-negative">
            {negative}
          </p>
          <p className="text-xs text-text-muted">
            {total > 0 ? ((negative / total) * 100).toFixed(1) : 0}%
          </p>
        </div>
        <div className="glass p-2 rounded-lg border border-neutral/30">
          <p className="text-xs text-text-muted">중립</p>
          <p className="text-lg font-bold text-neutral">
            {neutral}
          </p>
          <p className="text-xs text-text-muted">
            {total > 0 ? ((neutral / total) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>
    </div>
  )
}