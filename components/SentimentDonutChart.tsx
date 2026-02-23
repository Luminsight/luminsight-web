'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface SentimentDonutChartProps {
  positive: number
  negative: number
  neutral: number
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  const total = d.payload.total
  const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0.0'
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '10px',
      padding: '10px 14px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
      fontSize: '13px',
    }}>
      <p style={{ margin: '0 0 4px', fontWeight: 700, color: d.payload.color }}>{d.name}</p>
      <p style={{ margin: 0, color: '#475569' }}>{d.value}건 ({pct}%)</p>
    </div>
  )
}

export default function SentimentDonutChart({
  positive,
  negative,
  neutral,
}: SentimentDonutChartProps) {
  const total = positive + negative + neutral

  const cardStyle = {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
  }

  if (total === 0) {
    return (
      <div style={cardStyle}>
        <p className="text-center text-sm py-8" style={{ color: '#94a3b8' }}>데이터가 없습니다.</p>
      </div>
    )
  }

  const data = [
    { name: '긍정', value: positive, color: '#10b981', total },
    { name: '부정', value: negative, color: '#ef4444', total },
    { name: '중립', value: neutral,  color: '#94a3b8', total },
  ]

  const stats = [
    { label: '긍정', value: positive, color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
    { label: '부정', value: negative, color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)' },
    { label: '중립', value: neutral,  color: '#64748b', bg: '#f8fafc',               border: '#e2e8f0' },
  ]

  return (
    <div style={cardStyle} className="fade-in">
      <div className="mb-4">
        <h3 className="font-semibold mb-0.5" style={{ color: '#0f172a' }}>감성 비율</h3>
        <p className="text-xs" style={{ color: '#94a3b8' }}>총 {total}건 뉴스</p>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={58}
            outerRadius={96}
            paddingAngle={4}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* 통계 요약 */}
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        {stats.map(({ label, value, color, bg, border }) => (
          <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: '10px', padding: '10px' }}>
            <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>{label}</p>
            <p style={{ fontSize: '18px', fontWeight: 700, color, lineHeight: 1.2 }}>{value}</p>
            <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              {total > 0 ? ((value / total) * 100).toFixed(1) : 0}%
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
