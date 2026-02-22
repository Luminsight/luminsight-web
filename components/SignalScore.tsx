'use client'

import { useState, useEffect, useCallback } from 'react'
import { technicalApi, DEFAULT_WEIGHTS } from '@/lib/api'
import type { SignalWeights } from '@/lib/api'
import type { SignalScoreResult, ComponentScore } from '@/types'

interface Props {
  ticker: string
}

const STORAGE_KEY = 'luminsight_signal_weights'

// ── 점수 → 색상 ──────────────────────────────────────────────────────────────
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

// ── 반원형 게이지 ─────────────────────────────────────────────────────────────
function ScoreGauge({ score }: { score: number }) {
  const color = scoreColor(score)
  const r = 52, cx = 64, cy = 64
  const circumference = Math.PI * r
  const filled = (score / 100) * circumference
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`

  return (
    <svg width="128" height="72" viewBox="0 0 128 72">
      <path d={arcPath} fill="none" stroke="#374151" strokeWidth="10" strokeLinecap="round" />
      <path
        d={arcPath} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={`${filled} ${circumference}`}
        style={{ filter: `drop-shadow(0 0 4px ${color}88)` }}
      />
      <text x="64" y="60" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold">
        {score}
      </text>
    </svg>
  )
}

// ── 점수 범위 가이드 ──────────────────────────────────────────────────────────
function ScoreGuide({ score }: { score: number }) {
  const ranges = [
    { label: '강한 약세', range: '0~25',   color: '#ef4444', min: 0,  max: 25  },
    { label: '약세',      range: '25~40',  color: '#f97316', min: 25, max: 40  },
    { label: '중립',      range: '40~60',  color: '#94a3b8', min: 40, max: 60  },
    { label: '강세',      range: '60~75',  color: '#22c55e', min: 60, max: 75  },
    { label: '강한 강세', range: '75~100', color: '#10b981', min: 75, max: 100 },
  ]
  return (
    <div className="flex gap-1 mt-2 flex-wrap">
      {ranges.map(r => {
        const active = score >= r.min && score < r.max
        return (
          <span
            key={r.label}
            className={`text-xs px-2 py-0.5 rounded-full border transition-all ${active ? 'font-bold' : 'opacity-40'}`}
            style={{
              borderColor: r.color,
              color: active ? r.color : '#9ca3af',
              backgroundColor: active ? `${r.color}22` : 'transparent',
            }}
          >
            {r.label} ({r.range})
          </span>
        )
      })}
    </div>
  )
}

// ── 컴포넌트 점수 바 ──────────────────────────────────────────────────────────
function ComponentBar({ comp }: { comp: ComponentScore }) {
  const pct       = ((comp.rawScore + 1) / 2) * 100   // -1..1 → 0..100
  const color     = rawScoreColor(comp.rawScore)
  const weightPct = Math.round(comp.weight * 100)

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-300 font-medium">{comp.name}</span>
        <span className="text-gray-500">가중치 {weightPct}%</span>
      </div>

      {/* 바 트랙 — group 호버로 툴팁 제어 */}
      <div className="relative h-2 rounded-full group/bar" style={{ overflow: 'visible' }}>
        {/* 배경 트랙 (overflow-hidden으로 fill을 깔끔하게 클리핑) */}
        <div className="absolute inset-0 bg-gray-700 rounded-full overflow-hidden">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-500 z-10" />
          <div
            className="absolute top-0 bottom-0 transition-all duration-500"
            style={{
              left:  pct >= 50 ? '50%' : `${pct}%`,
              width: `${Math.abs(pct - 50)}%`,
              backgroundColor: color,
              opacity: 0.45,
            }}
          />
        </div>

        {/* 마커 원 — 정확한 위치를 점으로 표시 */}
        <div
          className="absolute z-20 transition-all duration-500"
          style={{
            left:            `${pct}%`,
            top:             '50%',
            transform:       'translate(-50%, -50%)',
            width:           '10px',
            height:          '10px',
            borderRadius:    '50%',
            backgroundColor: color,
            border:          '2px solid #111827',
            boxShadow:       `0 0 6px ${color}99`,
          }}
        />

        {/* 호버 툴팁 — 마커 위에 신호 강도 % 표시 */}
        <div
          className="absolute z-30 pointer-events-none opacity-0 group-hover/bar:opacity-100 transition-opacity duration-150"
          style={{
            left:      `${pct}%`,
            bottom:    '14px',
            transform: 'translateX(-50%)',
          }}
        >
          <div
            className="px-1.5 py-0.5 rounded text-xs font-mono font-semibold whitespace-nowrap"
            style={{
              backgroundColor: '#1f2937',
              border:          `1px solid ${color}66`,
              color,
            }}
          >
            {comp.rawScore > 0
              ? `+${Math.round(comp.rawScore * 100)}%`
              : `${Math.round(comp.rawScore * 100)}%`}
          </div>
          {/* 툴팁 꼬리 */}
          <div
            className="mx-auto mt-0.5 w-1.5 h-1.5 rotate-45"
            style={{ backgroundColor: '#1f2937', borderRight: `1px solid ${color}66`, borderBottom: `1px solid ${color}66` }}
          />
        </div>
      </div>

      <div className="flex justify-between text-gray-600 text-xs">
        <span>◀ 약세</span>
        <span className="text-gray-500 flex-1 text-center truncate px-2">{comp.description}</span>
        <span>강세 ▶</span>
      </div>
    </div>
  )
}

// ── 가중치 슬라이더 ───────────────────────────────────────────────────────────
const WEIGHT_KEYS: { key: keyof SignalWeights; label: string; desc: string }[] = [
  { key: 'rsiWeight',       label: 'RSI',         desc: '과매수/과매도 모멘텀' },
  { key: 'macdWeight',      label: 'MACD',        desc: '추세 전환 신호' },
  { key: 'bbWeight',        label: '볼린저 밴드',  desc: '가격 위치 & 변동성' },
  { key: 'maWeight',        label: '이동평균선',   desc: '중장기 추세 방향' },
  { key: 'sentimentWeight', label: '뉴스 감성',    desc: '시장 심리 분석' },
]

function WeightSliders({
  weights,
  onChange,
  onApply,
  onReset,
}: {
  weights: SignalWeights
  onChange: (key: keyof SignalWeights, val: number) => void
  onApply: () => void
  onReset: () => void
}) {
  const total   = Object.values(weights).reduce((a, b) => a + b, 0)
  const isValid = total === 100

  return (
    <div className="mt-3 pt-3 border-t border-gray-700 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 font-medium">⚖️ 가중치 직접 설정</span>
        <span className={`text-xs font-bold ${isValid ? 'text-emerald-400' : 'text-red-400'}`}>
          합계: {total}% {isValid ? '✓' : '→ 100%가 되어야 해요'}
        </span>
      </div>

      <p className="text-xs text-gray-600">
        중요하게 보는 지표의 비중을 높이면 그 지표가 점수에 더 크게 반영돼요.
      </p>

      {WEIGHT_KEYS.map(({ key, label, desc }) => (
        <div key={key} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-gray-300 font-medium">{label}</span>
              <span className="text-gray-600">{desc}</span>
            </div>
            <span className="text-indigo-400 font-bold w-10 text-right">{weights[key]}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={weights[key]}
            onChange={e => onChange(key, Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: '#6366f1' }}
          />
        </div>
      ))}

      <div className="flex gap-2 pt-1">
        <button
          onClick={onApply}
          disabled={!isValid}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            isValid
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          적용하기
        </button>
        <button
          onClick={onReset}
          className="px-3 py-1.5 rounded-lg text-xs text-gray-400 bg-gray-700 hover:bg-gray-600 transition-all"
        >
          기본값으로
        </button>
      </div>
    </div>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export default function SignalScore({ ticker }: Props) {
  const [data, setData]               = useState<SignalScoreResult | null>(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [expanded, setExpanded]       = useState(true)
  const [showWeights, setShowWeights] = useState(false)

  // localStorage에서 저장된 가중치 불러오기
  const [weights, setWeights] = useState<SignalWeights>(() => {
    if (typeof window === 'undefined') return DEFAULT_WEIGHTS
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? { ...DEFAULT_WEIGHTS, ...JSON.parse(saved) } : DEFAULT_WEIGHTS
    } catch {
      return DEFAULT_WEIGHTS
    }
  })

  // 슬라이더 임시 상태 (적용 전 draft)
  const [draftWeights, setDraftWeights] = useState<SignalWeights>(weights)

  const fetchScore = useCallback(async (w: SignalWeights) => {
    setLoading(true)
    setError(null)
    try {
      const result = await technicalApi.getSignalScore(ticker, 30, w)
      setData(result)
    } catch {
      setError('시그널 스코어를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [ticker])

  useEffect(() => { fetchScore(weights) }, [fetchScore, weights])

  const handleWeightChange = (key: keyof SignalWeights, val: number) => {
    setDraftWeights(prev => ({ ...prev, [key]: val }))
  }

  const handleApply = () => {
    setWeights(draftWeights)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draftWeights))
    setShowWeights(false)
  }

  const handleReset = () => {
    setDraftWeights(DEFAULT_WEIGHTS)
    setWeights(DEFAULT_WEIGHTS)
    localStorage.removeItem(STORAGE_KEY)
    setShowWeights(false)
  }

  const color = data ? scoreColor(data.score) : '#94a3b8'
  const isCustomWeights = JSON.stringify(weights) !== JSON.stringify(DEFAULT_WEIGHTS)

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm">🎯</span>
          <h3 className="text-white font-semibold text-sm">종합 시그널 스코어</h3>
          <span className="text-xs text-gray-500 px-2 py-0.5 rounded-full bg-gray-700">{ticker}</span>
          {isCustomWeights && (
            <span className="text-xs text-indigo-400 px-2 py-0.5 rounded-full bg-indigo-900/40 border border-indigo-700">
              커스텀 가중치
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowWeights(!showWeights); setDraftWeights(weights) }}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              showWeights ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            ⚖️ 가중치
          </button>
          <button
            onClick={() => fetchScore(weights)}
            className="text-gray-400 hover:text-white text-xs px-2 py-1 bg-gray-700 rounded transition-colors"
          >
            ↺
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            {expanded ? '접기 ▲' : '펼치기 ▼'}
          </button>
        </div>
      </div>

      {/* 로딩 */}
      {loading && (
        <div className="flex items-center gap-2 py-4 text-gray-500 text-sm">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-400" />
          <span>지표 분석 중...</span>
        </div>
      )}

      {/* 에러 */}
      {error && !loading && (
        <div className="text-red-400 text-sm py-2">{error}</div>
      )}

      {/* 스코어 본문 */}
      {!loading && !error && data && (
        <>
          {/* 게이지 + 레이블 */}
          <div className="flex items-center gap-5 mb-2">
            <ScoreGauge score={data.score} />
            <div>
              <div className="text-2xl font-bold leading-none mb-1" style={{ color }}>
                {data.emoji} {data.label}
              </div>
              <ScoreGuide score={data.score} />
              <div className="text-xs text-gray-600 mt-1">
                분석: {new Date(data.analyzedAt).toLocaleTimeString('ko-KR')}
              </div>
            </div>
          </div>

          {/* 가중치 슬라이더 패널 */}
          {showWeights && (
            <WeightSliders
              weights={draftWeights}
              onChange={handleWeightChange}
              onApply={handleApply}
              onReset={handleReset}
            />
          )}

          {/* 컴포넌트 상세 */}
          {expanded && !showWeights && (
            <div className="border-t border-gray-700 pt-3 space-y-3">
              <ComponentBar comp={data.rsi} />
              <ComponentBar comp={data.macd} />
              <ComponentBar comp={data.bollingerBand} />
              <ComponentBar comp={data.movingAverage} />
              <ComponentBar comp={data.sentiment} />

              <div className="mt-3 pt-3 border-t border-gray-700">
                <p className="text-xs text-gray-600 leading-relaxed">
                  ⚠️ 이 점수는 기술적 지표를 수치화한 참고용 정보이며, 투자 조언이 아닙니다.
                  투자 결정은 본인의 판단과 책임 하에 이루어져야 합니다.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
