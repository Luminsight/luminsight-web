'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface Props { positive: number; negative: number; neutral: number }

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  const total = d.payload.total
  const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0.0'
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #ece9f5',
      borderRadius: '12px',
      padding: '10px 14px',
      boxShadow: '0 4px 20px rgba(139,127,212,0.13)',
      fontSize: 12,
    }}>
      <p style={{ fontWeight: 700, color: d.payload.color, marginBottom: 2 }}>{d.name}</p>
      <p style={{ color: '#9e9ab8' }}>{d.value}건 ({pct}%)</p>
    </div>
  )
}

export default function SentimentDonutChart({ positive, negative, neutral }: Props) {
  const total = positive + negative + neutral

  const CARD: React.CSSProperties = {
    background: '#ffffff',
    borderRadius: '18px',
    padding: '24px',
    boxShadow: '0 2px 12px rgba(139,127,212,0.09)',
  }

  if (total === 0) return (
    <div style={CARD}>
      <p style={{ textAlign: 'center', color: '#c4c0d8', fontSize: 13, padding: '60px 0' }}>데이터가 없습니다.</p>
    </div>
  )

  const data = [
    { name: '긍정', value: positive, color: '#22c55e', total },
    { name: '부정', value: negative, color: '#f43f5e', total },
    { name: '중립', value: neutral,  color: '#c4c0d8', total },
  ]

  const stats = [
    { label: '긍정', value: positive, color: '#22c55e', bg: '#f0fdf4' },
    { label: '부정', value: negative, color: '#f43f5e', bg: '#fff1f3' },
    { label: '중립', value: neutral,  color: '#8b8fa8', bg: '#f8f7fd' },
  ]

  return (
    <div style={CARD} className="fade-in">
      <div className="mb-4">
        <h3 className="font-semibold text-sm" style={{ color: '#18162a' }}>감성 비율</h3>
        <p className="text-xs mt-0.5" style={{ color: '#9e9ab8' }}>총 {total}건</p>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data} cx="50%" cy="50%"
            innerRadius={62} outerRadius={98}
            paddingAngle={3} dataKey="value" strokeWidth={0}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-3 gap-2 mt-3">
        {stats.map(({ label, value, color, bg }) => (
          <div key={label} style={{ background: bg, borderRadius: 12, padding: '10px', textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: '#9e9ab8', marginBottom: 2 }}>{label}</p>
            <p style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1.1 }}>{value}</p>
            <p style={{ fontSize: 11, color: '#9e9ab8', marginTop: 2 }}>
              {total > 0 ? ((value / total) * 100).toFixed(1) : 0}%
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
