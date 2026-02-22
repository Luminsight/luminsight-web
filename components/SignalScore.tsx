'use client'

import { useState, useEffect, useCallback } from 'react'
import { technicalApi } from '@/lib/api'
import type { SignalScoreResult, ComponentScore } from '@/types'

interface Props {
  ticker: string
}

const scoreColor = (score: number): string => {
  if (score >= 75) return '#10b981'
  if (score >= 60) return '#22c55e'
  if (score >= 40) return '#94a3b8'
  if (score >= 25) return '#f97316'
  return '#ef4444'
}

const rawScoreColor = (raw: number): string => {
  if (raw > 0.3)  return '#22c55e'
  if (raw > 0)    return '#86efac'
  if (raw > -0.3) return '#fca5a5'
  return '#ef4444'
}

function ScoreGauge({ score }: { score: number }) {
  const color = scoreColor(score)
  const r = 52
  const cx = 64
  const cy = 64
  const circumference = Math.PI * r
  const filled = (score / 100) * circumference
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`

  return (
    <svg width="128" height="72" viewBox="0 0 128 72">
      <path d={arcPath} fill="none" stroke="#374151" strokeWidth="10" strokeLinecap="round" />
      <path
        d={arcPath}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circumference}`}
        style={{ filter: `drop-shadow(0 0 4px ${color}88)` }}
      />
      <text x="64" y="60" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold">
        {score}
      </text>
    </svg>
  )
}

function ComponentBar({ comp }: { comp: ComponentScore }) {
  const pct = ((comp.rawScore + 1) / 2) * 100
  const color = rawScoreColor(comp.rawScore)
  const weightPct = Math.round(comp.weight * 100)

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400 font-medium">{comp.name}</span>
        <span className="text-gray-500">{weightPct}%</span>
      </div>
      <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-500 z-10" />
        <div
          className="absolute top-0 bottom-0 rounded-full transition-all duration-500"
          style={{
            left:  pct >= 50 ? '50%' : `${pct}%`,
            width: `${Math.abs(pct - 50)}%`,
            backgroundColor: color,
            boxShadow: `0 0 4px ${color}88`,
          }}
        />
      </div>
      <p className="text-gray-500 text-xs leading-snug">{comp.description}</p>
    </div>
  )
}

export default function SignalScore({ ticker }: Props) {
  const [data, setData]         = useState<SignalScoreResult | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [expanded, setExpanded] = useState(true)

  const fetchScore = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await technicalApi.getSignalScore(ticker, 30)
      setData(result)
    } catch {
      setError('시그널 스코어를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [ticker])

  useEffect(() => { fetchScore() }, [fetchScore])

  const color = data ? scoreColor(data.score) : '#94a3b8'

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm">🎯</span>
          <h3 className="text-white font-semibold text-sm">종합 시그널 스코어</h3>
          <span className="text-xs text-gray-500 px-2 py-0.5 rounded-full bg-gray-700">{ticker}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchScore} className="text-gray-400 hover:text-white text-xs px-2 py-1 bg-gray-700 rounded">↺</button>
          <button onClick={() => setExpanded(!expanded)} className="text-xs text-gray-500 hover:text-gray-300">
            {expanded ? '접기 ▲' : '펼치기 ▼'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-4 text-gray-500 text-sm">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-400" />
          <span>지표 분석 중...</span>
        </div>
      )}

      {error && !loading && <div className="text-red-400 text-sm py-2">{error}</div>}

      {!loading && !error && data && (
        <>
          <div className="flex items-center gap-5 mb-3">
            <ScoreGauge score={data.score} />
            <div>
              <div className="text-2xl font-bold leading-none mb-1" style={{ color }}>
                {data.emoji} {data.label}
              </div>
              <div className="text-xs text-gray-500">0(약세) ── 50(중립) ── 100(강세)</div>
              <div className="text-xs text-gray-600 mt-1">
                분석: {new Date(data.analyzedAt).toLocaleTimeString('ko-KR')}
              </div>
            </div>
          </div>

          {expanded && (
            <>
              <div className="border-t border-gray-700 pt-3 space-y-3">
                <ComponentBar comp={data.rsi} />
                <ComponentBar comp={data.macd} />
                <ComponentBar comp={data.bollingerBand} />
                <ComponentBar comp={data.movingAverage} />
                <ComponentBar comp={data.sentiment} />
              </div>
              <div className="mt-3 pt-3 border-t border-gray-700">
                <p className="text-xs text-gray-600 leading-relaxed">
                  ⚠️ 이 점수는 기술적 지표를 수치화한 참고용 정보이며, 투자 조언이 아닙니다.
                  투자 결정은 본인의 판단과 책임 하에 이루어져야 합니다.
                </p>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}