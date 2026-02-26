'use client'

import { useState, useEffect, useCallback } from 'react'
import { technicalApi, DEFAULT_WEIGHTS } from '@/lib/api'
import type { SignalWeights } from '@/lib/api'
import type { SignalScoreResult, ComponentScore } from '@/types'

interface Props { ticker: string }
const STORAGE_KEY = 'luminsight_signal_weights'
const CARD: React.CSSProperties = { background: '#ffffff', borderRadius: '18px', padding: '20px', boxShadow: '0 2px 12px rgba(139,127,212,0.09)' }

const scoreColor = (s: number) => s >= 75 ? '#22c55e' : s >= 60 ? '#4ade80' : s >= 40 ? '#8b7fd4' : s >= 25 ? '#fb923c' : '#f43f5e'
const rawColor   = (r: number) => r > 0.3 ? '#22c55e' : r > 0 ? '#4ade80' : r > -0.3 ? '#fb923c' : '#f43f5e'

function ScoreGauge({ score }: { score: number }) {
  const color = scoreColor(score)
  const r = 52, cx = 64, cy = 64
  const circumference = Math.PI * r
  const filled = (score / 100) * circumference
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`
  return (
    <svg width="128" height="72" viewBox="0 0 128 72">
      <path d={arcPath} fill="none" stroke="#f0eefb" strokeWidth="10" strokeLinecap="round" />
      <path d={arcPath} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={`${filled} ${circumference}`} />
      <text x="64" y="60" textAnchor="middle" fill={color} fontSize="22" fontWeight="bold">{score}</text>
    </svg>
  )
}

function ScoreGuide({ score }: { score: number }) {
  const ranges = [
    { label: '강한 약세', min: 0,  max: 25,  color: '#f43f5e' },
    { label: '약세',      min: 25, max: 40,  color: '#fb923c' },
    { label: '중립',      min: 40, max: 60,  color: '#8b7fd4' },
    { label: '강세',      min: 60, max: 75,  color: '#4ade80' },
    { label: '강한 강세', min: 75, max: 100, color: '#22c55e' },
  ]
  return (
    <div className="flex gap-1 mt-2 flex-wrap">
      {ranges.map(r => {
        const active = score >= r.min && score < r.max
        return (
          <span key={r.label} className="text-xs px-2 py-0.5 rounded-full transition-all"
            style={{
              border: `1px solid ${active ? r.color : '#ece9f5'}`,
              color: active ? r.color : '#c4c0d8',
              background: active ? `${r.color}15` : 'transparent',
              fontWeight: active ? 700 : 400,
            }}>
            {r.label}
          </span>
        )
      })}
    </div>
  )
}

function ComponentBar({ comp }: { comp: ComponentScore }) {
  const pct   = ((comp.rawScore + 1) / 2) * 100
  const color = rawColor(comp.rawScore)
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: '#18162a', fontWeight: 500 }}>{comp.name}</span>
        <span style={{ color: '#9e9ab8' }}>가중치 {Math.round(comp.weight * 100)}%</span>
      </div>
      <div className="relative h-1.5 rounded-full group/bar" style={{ overflow: 'visible', background: '#f0eefb' }}>
        <div className="absolute top-0 bottom-0 transition-all duration-500" style={{
          left:  pct >= 50 ? '50%' : `${pct}%`,
          width: `${Math.abs(pct - 50)}%`,
          background: color, opacity: 0.5, borderRadius: 4,
        }} />
        <div className="absolute z-20 transition-all duration-500" style={{
          left: `${pct}%`, top: '50%', transform: 'translate(-50%,-50%)',
          width: 10, height: 10, borderRadius: '50%',
          background: color, border: '2px solid #fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
        }} />
        {/* hover tooltip */}
        <div className="absolute z-30 pointer-events-none opacity-0 group-hover/bar:opacity-100 transition-opacity duration-150"
          style={{ left: `${pct}%`, bottom: '14px', transform: 'translateX(-50%)' }}>
          <div className="px-2 py-0.5 rounded text-xs font-mono font-semibold whitespace-nowrap"
            style={{ background: '#fff', border: `1px solid ${color}55`, color, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            {comp.rawScore > 0 ? `+${Math.round(comp.rawScore * 100)}%` : `${Math.round(comp.rawScore * 100)}%`}
          </div>
          <div className="mx-auto mt-0.5 w-1.5 h-1.5 rotate-45"
            style={{ background: '#fff', borderRight: `1px solid ${color}55`, borderBottom: `1px solid ${color}55` }} />
        </div>
      </div>
      <div className="flex justify-between text-xs">
        <span style={{ color: '#c4c0d8' }}>◀ 약세</span>
        <span className="flex-1 text-center truncate px-2" style={{ color: '#9e9ab8', fontSize: 10 }}>{comp.description}</span>
        <span style={{ color: '#c4c0d8' }}>강세 ▶</span>
      </div>
    </div>
  )
}

const WEIGHT_KEYS: { key: keyof SignalWeights; label: string }[] = [
  { key: 'rsiWeight',       label: 'RSI' },
  { key: 'macdWeight',      label: 'MACD' },
  { key: 'bbWeight',        label: '볼린저 밴드' },
  { key: 'maWeight',        label: '이동평균선' },
  { key: 'sentimentWeight', label: '뉴스 감성' },
]

function WeightSliders({ weights, onChange, onApply, onReset }: {
  weights: SignalWeights
  onChange: (k: keyof SignalWeights, v: number) => void
  onApply: () => void
  onReset: () => void
}) {
  const total   = Object.values(weights).reduce((a, b) => a + b, 0)
  const isValid = total === 100
  return (
    <div className="mt-3 pt-3 space-y-3" style={{ borderTop: '1px solid #f3f1fa' }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: '#5e5a78' }}>⚖️ 가중치 설정</span>
        <span className="text-xs font-bold" style={{ color: isValid ? '#22c55e' : '#f43f5e' }}>
          합계: {total}% {isValid ? '✓' : '→ 100% 필요'}
        </span>
      </div>
      {WEIGHT_KEYS.map(({ key, label }) => (
        <div key={key} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: '#18162a', fontWeight: 500 }}>{label}</span>
            <span style={{ color: '#8b7fd4', fontWeight: 700 }}>{weights[key]}%</span>
          </div>
          <input type="range" min={0} max={100} step={5} value={weights[key]}
            onChange={e => onChange(key, Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: '#8b7fd4' }} />
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <button onClick={onApply} disabled={!isValid}
          className="flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all"
          style={{ background: isValid ? '#8b7fd4' : '#f0eefb', color: isValid ? '#fff' : '#c4c0d8', cursor: isValid ? 'pointer' : 'not-allowed' }}>
          적용
        </button>
        <button onClick={onReset}
          className="px-3 py-1.5 rounded-xl text-xs"
          style={{ background: '#f8f7fd', color: '#9e9ab8' }}>
          초기화
        </button>
      </div>
    </div>
  )
}

export default function SignalScore({ ticker }: Props) {
  const [data, setData]               = useState<SignalScoreResult | null>(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [expanded, setExpanded]       = useState(true)
  const [showWeights, setShowWeights] = useState(false)

  const [weights, setWeights] = useState<SignalWeights>(() => {
    if (typeof window === 'undefined') return DEFAULT_WEIGHTS
    try { const s = localStorage.getItem(STORAGE_KEY); return s ? { ...DEFAULT_WEIGHTS, ...JSON.parse(s) } : DEFAULT_WEIGHTS }
    catch { return DEFAULT_WEIGHTS }
  })
  const [draft, setDraft] = useState<SignalWeights>(weights)

  const fetchScore = useCallback(async (w: SignalWeights) => {
    setLoading(true); setError(null)
    try { setData(await technicalApi.getSignalScore(ticker, 30, w)) }
    catch { setError('시그널 스코어를 불러오지 못했습니다.') }
    finally { setLoading(false) }
  }, [ticker])

  useEffect(() => { fetchScore(weights) }, [fetchScore, weights])

  const color = data ? scoreColor(data.score) : '#8b7fd4'
  const isCustom = JSON.stringify(weights) !== JSON.stringify(DEFAULT_WEIGHTS)

  return (
    <div style={CARD}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-sm" style={{ color: '#18162a' }}>🎯 종합 시그널 스코어</h3>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#f0eefb', color: '#8b7fd4' }}>{ticker}</span>
          {isCustom && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#f0eefb', color: '#8b7fd4', border: '1px solid #d4cff2' }}>커스텀</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowWeights(!showWeights); setDraft(weights) }}
            className="text-xs px-2 py-1 rounded-lg transition-colors"
            style={{ background: showWeights ? '#8b7fd4' : '#f0eefb', color: showWeights ? '#fff' : '#8b7fd4' }}>
            ⚖️ 가중치
          </button>
          <button onClick={() => fetchScore(weights)}
            className="text-xs px-2 py-1 rounded-lg" style={{ background: '#f8f7fd', color: '#9e9ab8' }}>↺</button>
          <button onClick={() => setExpanded(!expanded)}
            className="text-xs" style={{ color: '#c4c0d8' }}>
            {expanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-4">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent"
            style={{ borderColor: '#8b7fd4', borderTopColor: 'transparent' }} />
          <span className="text-sm" style={{ color: '#9e9ab8' }}>분석 중...</span>
        </div>
      )}
      {error && !loading && <p className="text-sm py-2" style={{ color: '#f43f5e' }}>{error}</p>}

      {!loading && !error && data && (
        <>
          <div className="flex items-center gap-5 mb-2">
            <ScoreGauge score={data.score} />
            <div>
              <div className="text-xl font-bold" style={{ color }}>{data.emoji} {data.label}</div>
              <ScoreGuide score={data.score} />
              <p className="text-xs mt-1" style={{ color: '#c4c0d8' }}>
                {new Date(data.analyzedAt).toLocaleTimeString('ko-KR')}
              </p>
            </div>
          </div>
          {showWeights && (
            <WeightSliders weights={draft} onChange={(k, v) => setDraft(p => ({ ...p, [k]: v }))}
              onApply={() => { setWeights(draft); localStorage.setItem(STORAGE_KEY, JSON.stringify(draft)); setShowWeights(false) }}
              onReset={() => { setDraft(DEFAULT_WEIGHTS); setWeights(DEFAULT_WEIGHTS); localStorage.removeItem(STORAGE_KEY); setShowWeights(false) }} />
          )}
          {expanded && !showWeights && (
            <div className="pt-3 space-y-3" style={{ borderTop: '1px solid #f3f1fa' }}>
              <ComponentBar comp={data.rsi} />
              <ComponentBar comp={data.macd} />
              <ComponentBar comp={data.bollingerBand} />
              <ComponentBar comp={data.movingAverage} />
              <ComponentBar comp={data.sentiment} />
              <p className="text-xs pt-2" style={{ color: '#c4c0d8', borderTop: '1px solid #f3f1fa', paddingTop: 8 }}>
                ⚠️ 참고용 지표이며 투자 조언이 아닙니다.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
