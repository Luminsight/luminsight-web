'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ResponsiveContainer, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ReferenceArea, ComposedChart, Area, Bar, Cell,
} from 'recharts'
import { technicalApi, DEFAULT_WEIGHTS } from '@/lib/api'
import type { SignalWeights } from '@/lib/api'
import type { TechnicalIndicatorData, SignalScoreResult, ComponentScore, RsiSignal, MacdCross } from '@/types'

interface Props { ticker: string }
type Period = 7 | 30 | 60 | 90

// ── 디자인 토큰 ───────────────────────────────────────────────
const CARD: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: '20px',
  padding: '28px',
  boxShadow: '0 4px 24px rgba(139,127,212,0.10)',
}
const AXIS_TICK = { fill: '#a8a4c0', fontSize: 10 }
const GRID  = { strokeDasharray: '3 3' as const, stroke: '#ede9f8', vertical: false }
const TT: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e0dbf5',
  borderRadius: 12,
  padding: '10px 14px',
  boxShadow: '0 4px 20px rgba(139,127,212,0.15)',
  fontSize: 12,
}
const SECTION_DIVIDER: React.CSSProperties = {
  borderTop: '1.5px solid #f0ecfb',
  margin: '20px 0',
}
const STORAGE_KEY = 'luminsight_signal_weights'

const scoreColor = (s: number) =>
  s >= 75 ? '#16a34a' : s >= 60 ? '#22c55e' : s >= 40 ? '#8b7fd4' : s >= 25 ? '#f97316' : '#ef4444'
const rawColor = (r: number) =>
  r > 0.3 ? '#16a34a' : r > 0 ? '#22c55e' : r > -0.3 ? '#f97316' : '#ef4444'
const rsiColor = (s: RsiSignal) =>
  ({ OVERBOUGHT: '#ef4444', BULLISH: '#f97316', NEUTRAL: '#8b8fa8', BEARISH: '#8b7fd4', OVERSOLD: '#16a34a' }[s])

// ── Tooltip ───────────────────────────────────────────────────

const PriceTT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div style={TT}>
      <p style={{ color: '#9e9ab8', marginBottom: 4, fontSize: 11 }}>{label}</p>
      <p style={{ color: '#18162a', fontWeight: 700, fontSize: 13 }}>종가 ${d?.close?.toFixed(2)}</p>
      <p style={{ color: '#7e7a98', marginTop: 2 }}>고가 ${d?.high?.toFixed(2)} / 저가 ${d?.low?.toFixed(2)}</p>
      {d?.bbUpper != null && <>
        <div style={{ borderTop: '1px solid #f0ecfb', margin: '6px 0 4px' }} />
        <p style={{ color: '#8b7fd4' }}>BB 상단 ${d.bbUpper?.toFixed(2)}</p>
        <p style={{ color: '#a89fe0' }}>BB 중간 ${d.bbMiddle?.toFixed(2)}</p>
        <p style={{ color: '#8b7fd4' }}>BB 하단 ${d.bbLower?.toFixed(2)}</p>
      </>}
      {d?.maSma20 != null && <p style={{ color: '#22c55e', marginTop: 4 }}>SMA20 ${d.maSma20?.toFixed(2)}</p>}
      {d?.maSma50 != null && <p style={{ color: '#f97316' }}>SMA50 ${d.maSma50?.toFixed(2)}</p>}
    </div>
  )
}

const RsiTT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const rsi = payload[0]?.value as number
  const sig  = payload[0]?.payload?.signal as RsiSignal
  const map: Record<RsiSignal, string> = {
    OVERBOUGHT: '과매수 ⚠️', BULLISH: '강세', NEUTRAL: '중립', BEARISH: '약세', OVERSOLD: '과매도 🔔',
  }
  return (
    <div style={TT}>
      <p style={{ color: '#9e9ab8', marginBottom: 4, fontSize: 11 }}>{label}</p>
      <p style={{ fontWeight: 700, color: rsiColor(sig), fontSize: 13 }}>RSI {rsi?.toFixed(1)}</p>
      <p style={{ color: '#7e7a98' }}>{map[sig]}</p>
    </div>
  )
}

const MacdTT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  const cross = d?.crossType as MacdCross | null
  return (
    <div style={TT}>
      <p style={{ color: '#9e9ab8', marginBottom: 4, fontSize: 11 }}>{label}</p>
      <p style={{ color: '#8b7fd4' }}>MACD {d?.macd?.toFixed(3)}</p>
      <p style={{ color: '#f97316' }}>Signal {d?.signal?.toFixed(3)}</p>
      <p style={{ color: d?.histogram >= 0 ? '#22c55e' : '#ef4444' }}>
        히스토그램 {d?.histogram >= 0 ? '+' : ''}{d?.histogram?.toFixed(3)}
      </p>
      {cross && (
        <p style={{ fontWeight: 700, color: cross === 'GOLDEN' ? '#16a34a' : '#ef4444', marginTop: 4 }}>
          {cross === 'GOLDEN' ? '⬆ 골든크로스!' : '⬇ 데드크로스!'}
        </p>
      )}
    </div>
  )
}

// ── ScoreGauge ────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const color = scoreColor(score)
  const r = 52, cx = 64, cy = 64
  const circumference = Math.PI * r
  const filled = (score / 100) * circumference
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`
  return (
    <svg width="128" height="72" viewBox="0 0 128 72">
      <path d={arcPath} fill="none" stroke="#e8e4f6" strokeWidth="11" strokeLinecap="round" />
      <path d={arcPath} fill="none" stroke={color} strokeWidth="11" strokeLinecap="round"
        strokeDasharray={`${filled} ${circumference}`} />
      <text x="64" y="60" textAnchor="middle" fill={color} fontSize="23" fontWeight="800">{score}</text>
    </svg>
  )
}

function ScoreGuide({ score }: { score: number }) {
  const ranges = [
    { label: '강한 약세', min: 0,  max: 25,  color: '#ef4444' },
    { label: '약세',      min: 25, max: 40,  color: '#f97316' },
    { label: '중립',      min: 40, max: 60,  color: '#8b7fd4' },
    { label: '강세',      min: 60, max: 75,  color: '#22c55e' },
    { label: '강한 강세', min: 75, max: 101, color: '#16a34a' },
  ]
  return (
    <div className="flex gap-1 mt-2 flex-wrap justify-center">
      {ranges.map(r => {
        const active = score >= r.min && score < r.max
        return (
          <span key={r.label} className="text-xs px-2 py-0.5 rounded-full"
            style={{
              border: `1.5px solid ${active ? r.color : '#ddd9f0'}`,
              color:  active ? r.color : '#9e9ab8',
              background: active ? `${r.color}18` : 'transparent',
              fontWeight: active ? 700 : 500,
              fontSize: 10,
            }}>
            {r.label}
          </span>
        )
      })}
    </div>
  )
}

// ── 신호 카드 (가로 배치) ─────────────────────────────────────

function SignalCard({ title, value, status, statusColor }: {
  title: string; value: string; status: string; statusColor: string
}) {
  return (
    <div style={{
      flex: '1 1 0',
      background: statusColor + '12',
      borderRadius: 14,
      padding: '14px 16px',
      border: `1.5px solid ${statusColor}44`,
      borderTop: `3px solid ${statusColor}`,
      minWidth: 100,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}>
      <p style={{ fontSize: 11, color: '#7e7a98', marginBottom: 6, fontWeight: 600 }}>{title}</p>
      <p style={{ fontSize: 22, fontWeight: 800, color: '#18162a', lineHeight: 1, marginBottom: 6 }}>{value}</p>
      <p style={{ fontSize: 12, fontWeight: 700, color: statusColor, lineHeight: 1.4 }}>{status}</p>
    </div>
  )
}

// ── ComponentBar ──────────────────────────────────────────────

function ComponentBar({ comp }: { comp: ComponentScore }) {
  const pct   = ((comp.rawScore + 1) / 2) * 100
  const color = rawColor(comp.rawScore)
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between" style={{ fontSize: 12 }}>
        <span style={{ color: '#2e2a45', fontWeight: 600 }}>{comp.name}</span>
        <span style={{ color: '#7e7a98' }}>가중치 {Math.round(comp.weight * 100)}%</span>
      </div>
      <div className="relative h-2 rounded-full group/bar" style={{ overflow: 'visible', background: '#ede9f8' }}>
        <div className="absolute top-0 bottom-0 transition-all duration-500" style={{
          left:  pct >= 50 ? '50%' : `${pct}%`,
          width: `${Math.abs(pct - 50)}%`,
          background: color, opacity: 0.6, borderRadius: 4,
        }} />
        <div className="absolute z-20 transition-all duration-500" style={{
          left: `${pct}%`, top: '50%', transform: 'translate(-50%,-50%)',
          width: 12, height: 12, borderRadius: '50%',
          background: color, border: '2px solid #fff',
          boxShadow: '0 1px 6px rgba(0,0,0,0.18)',
        }} />
        <div className="absolute z-30 pointer-events-none opacity-0 group-hover/bar:opacity-100 transition-opacity duration-150"
          style={{ left: `${pct}%`, bottom: '16px', transform: 'translateX(-50%)' }}>
          <div className="px-2 py-0.5 rounded text-xs font-mono font-bold whitespace-nowrap"
            style={{ background: '#fff', border: `1px solid ${color}66`, color, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
            {comp.rawScore > 0 ? `+${Math.round(comp.rawScore * 100)}%` : `${Math.round(comp.rawScore * 100)}%`}
          </div>
          <div className="mx-auto mt-0.5 w-1.5 h-1.5 rotate-45"
            style={{ background: '#fff', borderRight: `1px solid ${color}55`, borderBottom: `1px solid ${color}55` }} />
        </div>
      </div>
      <div className="flex justify-between" style={{ fontSize: 10 }}>
        <span style={{ color: '#b0accc' }}>◀ 약세</span>
        <span className="flex-1 text-center truncate px-2" style={{ color: '#9e9ab8' }}>{comp.description}</span>
        <span style={{ color: '#b0accc' }}>강세 ▶</span>
      </div>
    </div>
  )
}

// ── 가중치 슬라이더 ───────────────────────────────────────────

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
    <div className="space-y-4 pt-5" style={SECTION_DIVIDER}>
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 13, fontWeight: 700, color: '#2e2a45' }}>⚖️ 가중치 설정</span>
        <span style={{
          fontSize: 12, fontWeight: 700,
          color: isValid ? '#16a34a' : '#ef4444',
          background: isValid ? '#f0fdf4' : '#fef2f2',
          padding: '2px 10px', borderRadius: 8,
        }}>
          합계: {total}% {isValid ? '✓' : '→ 100% 필요'}
        </span>
      </div>
      {WEIGHT_KEYS.map(({ key, label }) => (
        <div key={key} className="space-y-1.5">
          <div className="flex items-center justify-between" style={{ fontSize: 12 }}>
            <span style={{ color: '#2e2a45', fontWeight: 600 }}>{label}</span>
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
          className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
          style={{
            background: isValid ? 'linear-gradient(135deg,#8b7fd4,#6a5fc4)' : '#f0eefb',
            color: isValid ? '#fff' : '#c4c0d8',
            cursor: isValid ? 'pointer' : 'not-allowed',
            boxShadow: isValid ? '0 2px 10px rgba(139,127,212,0.28)' : 'none',
          }}>
          적용
        </button>
        <button onClick={onReset}
          className="px-4 py-2 rounded-xl text-sm font-medium"
          style={{ background: '#f5f4fa', color: '#7e7a98', border: '1.5px solid #e8e4f6' }}>
          초기화
        </button>
      </div>
    </div>
  )
}

// ── 차트 섹션 레이블 ──────────────────────────────────────────

function ChartLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 12, fontWeight: 700, color: '#3d3960', marginBottom: 8, marginLeft: 2 }}>
      {children}
    </p>
  )
}

function StatusBadge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, color,
      background: color + '15',
      border: `1px solid ${color}44`,
      padding: '2px 8px', borderRadius: 8,
    }}>
      {children}
    </span>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────

export default function TechnicalPanel({ ticker }: Props) {
  const [techData, setTechData]     = useState<TechnicalIndicatorData | null>(null)
  const [signalData, setSignalData] = useState<SignalScoreResult | null>(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [period, setPeriod]         = useState<Period>(30)
  const [showWeights, setShowWeights] = useState(false)
  const [showDetail, setShowDetail]   = useState(false)

  const [inds, setInds] = useState([
    { id: 'price',     label: '주가',       color: '#8b7fd4', on: true },
    { id: 'bollinger', label: '볼린저 밴드', color: '#a89fe0', on: true },
    { id: 'ma',        label: '이동평균선',  color: '#22c55e', on: true },
    { id: 'rsi',       label: 'RSI',        color: '#f97316', on: true },
    { id: 'macd',      label: 'MACD',       color: '#8b7fd4', on: true },
  ])

  const [weights, setWeights] = useState<SignalWeights>(() => {
    if (typeof window === 'undefined') return DEFAULT_WEIGHTS
    try {
      const s = localStorage.getItem(STORAGE_KEY)
      return s ? { ...DEFAULT_WEIGHTS, ...JSON.parse(s) } : DEFAULT_WEIGHTS
    } catch { return DEFAULT_WEIGHTS }
  })
  const [draft, setDraft] = useState<SignalWeights>(weights)

  const fetchAll = useCallback(async (w: SignalWeights) => {
    setLoading(true); setError(null)
    try {
      const [tech, signal] = await Promise.all([
        technicalApi.getIndicators(ticker, period),
        technicalApi.getSignalScore(ticker, period, w),
      ])
      setTechData(tech)
      setSignalData(signal)
    } catch {
      setError('데이터를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [ticker, period])

  useEffect(() => { fetchAll(weights) }, [fetchAll, weights])

  const toggle  = (id: string) => setInds(p => p.map(i => i.id === id ? { ...i, on: !i.on } : i))
  const ind     = (id: string) => inds.find(i => i.id === id)?.on
  const fmtDate = (d: string) => d?.slice(5) ?? ''

  const merged = useMemo(() => {
    if (!techData) return []
    const bbM = new Map((techData.bollingerBands ?? []).map(b => [b.date, b]))
    const maM = new Map((techData.movingAverages ?? []).map(m => [m.date, m]))
    return techData.priceData.map(p => ({
      ...p,
      bbUpper:  bbM.get(p.date)?.upper,
      bbMiddle: bbM.get(p.date)?.middle,
      bbLower:  bbM.get(p.date)?.lower,
      maSma20:  maM.get(p.date)?.sma20 ?? undefined,
      maSma50:  maM.get(p.date)?.sma50 ?? undefined,
    }))
  }, [techData])

  const priceY = useMemo(() => {
    if (!merged.length) return [0, 100]
    const vals = merged.flatMap(p => [
      p.close,
      ind('bollinger') ? (p.bbUpper ?? p.close) : p.close,
      ind('bollinger') ? (p.bbLower ?? p.close) : p.close,
    ])
    return [Math.min(...vals) * 0.98, Math.max(...vals) * 1.02]
  }, [merged, inds])

  // ── 신호 카드 데이터 ─────────────────────────────────────────

  const rsiCard = useMemo(() => {
    if (!techData?.rsi?.length) return null
    const l = techData.rsi[techData.rsi.length - 1]
    const map: Record<RsiSignal, { text: string; color: string }> = {
      OVERBOUGHT: { text: '과매수 — 조정 주의', color: '#ef4444' },
      BULLISH:    { text: '강세 구간',           color: '#f97316' },
      NEUTRAL:    { text: '중립',                color: '#8b8fa8' },
      BEARISH:    { text: '약세 구간',            color: '#8b7fd4' },
      OVERSOLD:   { text: '과매도 — 반등 기대',  color: '#16a34a' },
    }
    const s = map[l.signal]
    return { value: l.value.toFixed(1), status: s.text, color: s.color }
  }, [techData])

  const macdCard = useMemo(() => {
    if (!techData?.macd?.length) return null
    const l = techData.macd[techData.macd.length - 1]
    const recentCross = techData.macd.slice(-5).find(d => d.crossType != null)
    let status = l.histogram > 0 ? '상승 모멘텀' : '하락 모멘텀'
    let color  = l.histogram > 0 ? '#16a34a' : '#ef4444'
    if (recentCross) {
      status = recentCross.crossType === 'GOLDEN' ? '⬆ 골든크로스' : '⬇ 데드크로스'
      color  = recentCross.crossType === 'GOLDEN' ? '#16a34a' : '#ef4444'
    }
    return { value: (l.histogram > 0 ? '+' : '') + l.histogram.toFixed(3), status, color }
  }, [techData])

  const bbCard = useMemo(() => {
    if (!techData?.bollingerBands?.length) return null
    const l = techData.bollingerBands[techData.bollingerBands.length - 1]
    const posText  = l.percentB > 1 ? '상단 돌파 ⚠️' : l.percentB > 0.8 ? '상단 근접' : l.percentB < 0 ? '하단 돌파 🔔' : l.percentB < 0.2 ? '하단 근접' : '밴드 중간'
    const posColor = l.percentB > 0.8 ? '#ef4444' : l.percentB < 0.2 ? '#16a34a' : '#7e7a98'
    return { value: `${(l.percentB * 100).toFixed(0)}%`, status: posText, color: posColor }
  }, [techData])

  const maCard = useMemo(() => {
    if (!techData?.movingAverages?.length) return null
    const l     = techData.movingAverages[techData.movingAverages.length - 1]
    const price = techData.priceData[techData.priceData.length - 1]?.close
    const golden     = l.sma20 != null && l.sma50 != null && l.sma20 > l.sma50
    const aboveSma20 = price != null && l.sma20 != null && price > l.sma20
    const status = `${golden ? '골든크로스' : '데드크로스'} · SMA20 ${aboveSma20 ? '위' : '아래'}`
    return { value: l.sma20 != null ? `$${l.sma20.toFixed(0)}` : '-', status, color: golden ? '#16a34a' : '#ef4444' }
  }, [techData])

  const isCustom = JSON.stringify(weights) !== JSON.stringify(DEFAULT_WEIGHTS)
  const scoreCol = signalData ? scoreColor(signalData.score) : '#8b7fd4'

  // ── 주가 + 등락률 계산 (priceData 마지막 2개 사용) ──────────
  const latestPrice  = techData?.priceData?.at(-1)
  const prevPrice    = techData?.priceData?.at(-2)
  const changePct    = latestPrice && prevPrice && prevPrice.close > 0
    ? ((latestPrice.close - prevPrice.close) / prevPrice.close) * 100
    : null
  const priceUp      = changePct !== null && changePct >= 0
  const priceColor   = changePct === null ? '#9e9ab8' : priceUp ? '#16a34a' : '#ef4444'

  return (
    <div style={CARD}>

      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#18162a' }}>📊 기술적 분석</h3>
          <span style={{
            fontSize: 11, fontWeight: 700, color: '#8b7fd4',
            background: '#f0eefb', padding: '2px 10px', borderRadius: 8,
            border: '1px solid #d4cff2',
          }}>{ticker}</span>
          {isCustom && (
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#8b7fd4',
              background: '#f0eefb', padding: '2px 10px', borderRadius: 8,
              border: '1px solid #d4cff2',
            }}>커스텀</span>
          )}
          {/* ── 주가 + 등락률 배지 ── */}
          {latestPrice && (
            <div className="flex items-center gap-1.5" style={{ marginLeft: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#18162a', letterSpacing: '-0.3px' }}>
                ${latestPrice.close.toFixed(2)}
              </span>
              {changePct !== null && (
                <span style={{
                  fontSize: 12, fontWeight: 700, color: priceColor,
                  background: priceUp ? '#dcfce7' : '#fee2e2',
                  padding: '1px 7px', borderRadius: 6,
                }}>
                  {priceUp ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}%
                </span>
              )}
              <span style={{
                fontSize: 10, color: '#9e9ab8',
                background: '#f5f4fa', padding: '1px 6px', borderRadius: 5,
              }}>
                📅 종가
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* 기간 버튼 */}
          <div className="flex gap-1" style={{ background: '#f5f4fa', borderRadius: 10, padding: '3px' }}>
            {([7, 30, 60, 90] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                style={{
                  padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: period === p ? '#8b7fd4' : 'transparent',
                  color: period === p ? '#fff' : '#9e9ab8',
                  transition: 'all 0.15s',
                }}>
                {p}일
              </button>
            ))}
          </div>
          <button onClick={() => { setShowWeights(!showWeights); setDraft(weights) }}
            style={{
              fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 9,
              background: showWeights ? '#8b7fd4' : '#f0eefb',
              color: showWeights ? '#fff' : '#6a5fc4',
              border: '1.5px solid ' + (showWeights ? '#8b7fd4' : '#d4cff2'),
            }}>
            ⚖️ 가중치
          </button>
          <button onClick={() => fetchAll(weights)}
            style={{
              fontSize: 13, padding: '5px 10px', borderRadius: 9,
              background: '#f5f4fa', color: '#7e7a98',
              border: '1.5px solid #e8e4f6',
            }}>↺</button>
        </div>
      </div>

      {/* ── 로딩 / 에러 ── */}
      {loading && (
        <div className="flex items-center justify-center h-56">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-[3px]"
              style={{ borderColor: '#e8e4f6', borderTopColor: '#8b7fd4' }} />
            <span style={{ fontSize: 13, color: '#9e9ab8' }}>분석 중...</span>
          </div>
        </div>
      )}
      {error && !loading && (
        <div className="flex items-center justify-center h-48"
          style={{ fontSize: 13, color: '#ef4444' }}>{error}</div>
      )}

      {!loading && !error && techData && signalData && (
        <>
          {/* ── 종합 점수 + 신호 카드 ── */}
          <div className="flex gap-5 mb-2 flex-wrap items-center">

            {/* 게이지 */}
            <div className="flex flex-col items-center justify-center"
              style={{ minWidth: 136, background: '#faf9fe', borderRadius: 16, padding: '16px 12px' }}>
              <ScoreGauge score={signalData.score} />
              <p style={{ fontSize: 16, fontWeight: 800, marginTop: 4, color: scoreCol }}>
                {signalData.emoji} {signalData.label}
              </p>
              <ScoreGuide score={signalData.score} />
              <button
                onClick={() => setShowDetail(!showDetail)}
                style={{
                  marginTop: 10, fontSize: 11, fontWeight: 600,
                  color: '#8b7fd4', background: '#f0eefb',
                  padding: '3px 10px', borderRadius: 8,
                  border: '1px solid #d4cff2',
                }}>
                {showDetail ? '상세 접기 ▲' : '지표 상세 ▼'}
              </button>
            </div>

            {/* 신호 카드 4개 */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, alignItems: 'stretch' }}>
              {rsiCard  && <SignalCard title="RSI (14)"        value={rsiCard.value}  status={rsiCard.status}  statusColor={rsiCard.color} />}
              {macdCard && <SignalCard title="MACD 히스토그램" value={macdCard.value} status={macdCard.status} statusColor={macdCard.color} />}
              {bbCard   && <SignalCard title="볼린저 %B"       value={bbCard.value}   status={bbCard.status}   statusColor={bbCard.color} />}
              {maCard   && <SignalCard title="이동평균 SMA20"   value={maCard.value}   status={maCard.status}   statusColor={maCard.color} />}
            </div>
          </div>

          {/* ── 지표 상세 (ComponentBar) ── */}
          {showDetail && !showWeights && (
            <div className="space-y-4" style={{ ...SECTION_DIVIDER, paddingTop: 4 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#5e5a78' }}>가중치 적용 점수 상세</p>
              <ComponentBar comp={signalData.rsi} />
              <ComponentBar comp={signalData.macd} />
              <ComponentBar comp={signalData.bollingerBand} />
              <ComponentBar comp={signalData.movingAverage} />
              <ComponentBar comp={signalData.sentiment} />
            </div>
          )}

          {/* ── 가중치 설정 ── */}
          {showWeights && (
            <WeightSliders
              weights={draft}
              onChange={(k, v) => setDraft(p => ({ ...p, [k]: v }))}
              onApply={() => { setWeights(draft); localStorage.setItem(STORAGE_KEY, JSON.stringify(draft)); setShowWeights(false) }}
              onReset={() => { setDraft(DEFAULT_WEIGHTS); setWeights(DEFAULT_WEIGHTS); localStorage.removeItem(STORAGE_KEY); setShowWeights(false) }}
            />
          )}

          {/* ── 지표 토글 ── */}
          <div style={SECTION_DIVIDER} />
          <div className="flex gap-2 mb-5 flex-wrap">
            {inds.map(i => (
              <button key={i.id} onClick={() => toggle(i.id)}
                className="flex items-center gap-1.5 transition-all"
                style={{
                  padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  ...(i.on
                    ? { background: i.color + '1a', border: `1.5px solid ${i.color}88`, color: i.color }
                    : { background: '#f5f4fa',       border: '1.5px solid #ddd9f0',     color: '#9e9ab8' }),
                }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: i.on ? i.color : '#c4c0d8', display: 'inline-block' }} />
                {i.label}
              </button>
            ))}
          </div>

          {/* ── 차트 영역 ── */}
          <div className="space-y-6">

            {/* 주가 + BB + MA */}
            {ind('price') && merged.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <ChartLabel>주가 (종가)</ChartLabel>
                    {ind('bollinger') && <StatusBadge color="#a89fe0">볼린저 밴드</StatusBadge>}
                    {ind('ma') && <>
                      <StatusBadge color="#22c55e">SMA20</StatusBadge>
                      <StatusBadge color="#f97316">SMA50</StatusBadge>
                    </>}
                  </div>
                  {(() => {
                    if (!ind('bollinger') || !techData.bollingerBands?.length) return null
                    const l = techData.bollingerBands[techData.bollingerBands.length - 1]
                    const posText  = l.percentB > 1 ? '상단 돌파 ⚠️' : l.percentB > 0.8 ? '상단 근접' : l.percentB < 0 ? '하단 돌파' : l.percentB < 0.2 ? '하단 근접' : '밴드 중간'
                    const posColor = l.percentB > 0.8 ? '#ef4444' : l.percentB < 0.2 ? '#16a34a' : '#7e7a98'
                    return <StatusBadge color={posColor}>{posText}</StatusBadge>
                  })()}
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart data={merged} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#8b7fd4" stopOpacity={0.14} />
                        <stop offset="95%" stopColor="#8b7fd4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid {...GRID} />
                    <XAxis dataKey="date" tickFormatter={fmtDate} tick={AXIS_TICK} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis domain={priceY} tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={v => `$${v.toFixed(0)}`} width={48} />
                    <Tooltip content={<PriceTT />} />
                    {ind('bollinger') && <>
                      <Area type="monotone" dataKey="bbUpper"  stroke="#a89fe0" strokeWidth={1} strokeDasharray="4 3" fill="none" dot={false} activeDot={false} connectNulls />
                      <Area type="monotone" dataKey="bbLower"  stroke="#a89fe0" strokeWidth={1} strokeDasharray="4 3" fill="none" dot={false} activeDot={false} connectNulls />
                      <Line type="monotone" dataKey="bbMiddle" stroke="#c4bde8" strokeWidth={1} dot={false} activeDot={false} connectNulls />
                    </>}
                    {ind('ma') && <>
                      <Line type="monotone" dataKey="maSma20" stroke="#22c55e" strokeWidth={1.5} dot={false} activeDot={false} connectNulls />
                      <Line type="monotone" dataKey="maSma50" stroke="#f97316" strokeWidth={1.5} dot={false} activeDot={false} connectNulls />
                    </>}
                    <Area type="monotone" dataKey="close" stroke="#8b7fd4" strokeWidth={2.5} fill="url(#pGrad)" dot={false} activeDot={{ r: 4, fill: '#8b7fd4', strokeWidth: 0 }} />
                  </ComposedChart>
                </ResponsiveContainer>
                {/* MA 수치 */}
                {ind('ma') && techData.movingAverages?.length > 0 && (() => {
                  const l     = techData.movingAverages[techData.movingAverages.length - 1]
                  const price = techData.priceData[techData.priceData.length - 1]?.close
                  const golden = l.sma20 != null && l.sma50 != null && l.sma20 > l.sma50
                  return (
                    <div className="flex items-center gap-4 mt-2 ml-1 flex-wrap" style={{ fontSize: 12 }}>
                      {l.sma20 != null && (
                        <span style={{ color: '#7e7a98' }}>SMA20 <b style={{ color: '#22c55e' }}>${l.sma20.toFixed(2)}</b>
                          {price != null && <b style={{ color: price > l.sma20 ? '#16a34a' : '#ef4444' }}>{price > l.sma20 ? ' ↑' : ' ↓'}</b>}
                        </span>
                      )}
                      {l.sma50 != null && (
                        <span style={{ color: '#7e7a98' }}>SMA50 <b style={{ color: '#f97316' }}>${l.sma50.toFixed(2)}</b>
                          {price != null && <b style={{ color: price > l.sma50 ? '#16a34a' : '#ef4444' }}>{price > l.sma50 ? ' ↑' : ' ↓'}</b>}
                        </span>
                      )}
                      {l.sma20 != null && l.sma50 != null && (
                        <span style={{ fontWeight: 700, color: golden ? '#16a34a' : '#ef4444' }}>
                          {golden ? '골든크로스' : '데드크로스'}
                        </span>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}

            {/* RSI */}
            {ind('rsi') && techData.rsi.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <ChartLabel>RSI (14일)</ChartLabel>
                  {(() => {
                    const l = techData.rsi[techData.rsi.length - 1]
                    const map: Record<RsiSignal, { text: string; color: string }> = {
                      OVERBOUGHT: { text: '과매수 ⚠️', color: '#ef4444' },
                      BULLISH:    { text: '강세',       color: '#f97316' },
                      NEUTRAL:    { text: '중립',       color: '#8b8fa8' },
                      BEARISH:    { text: '약세',       color: '#8b7fd4' },
                      OVERSOLD:   { text: '과매도 🔔', color: '#16a34a' },
                    }
                    const s = map[l.signal]
                    return (
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 15, fontWeight: 800, color: '#18162a' }}>{l.value.toFixed(1)}</span>
                        <StatusBadge color={s.color}>{s.text}</StatusBadge>
                      </div>
                    )
                  })()}
                </div>
                <ResponsiveContainer width="100%" height={120}>
                  <ComposedChart data={techData.rsi} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid {...GRID} />
                    <XAxis dataKey="date" tickFormatter={fmtDate} tick={AXIS_TICK} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis domain={[0, 100]} ticks={[0, 30, 50, 70, 100]} tick={AXIS_TICK} axisLine={false} tickLine={false} width={28} />
                    <Tooltip content={<RsiTT />} />
                    <ReferenceArea y1={70} y2={100} fill="#ef444408" />
                    <ReferenceArea y1={0}   y2={30}  fill="#16a34a08" />
                    <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1}
                      label={{ value: '과매수', position: 'insideTopRight', fill: '#ef4444', fontSize: 10 }} />
                    <ReferenceLine y={30} stroke="#16a34a" strokeDasharray="4 3" strokeWidth={1}
                      label={{ value: '과매도', position: 'insideBottomRight', fill: '#16a34a', fontSize: 10 }} />
                    <ReferenceLine y={50} stroke="#e8e4f6" strokeDasharray="2 4" strokeWidth={1} />
                    <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2.5} dot={false}
                      activeDot={{ r: 4, fill: '#f97316', strokeWidth: 0 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* MACD */}
            {ind('macd') && techData.macd?.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <ChartLabel>MACD (12, 26, 9)</ChartLabel>
                    <StatusBadge color="#8b7fd4">— MACD</StatusBadge>
                    <StatusBadge color="#f97316">- - Signal</StatusBadge>
                  </div>
                  {(() => {
                    const l = techData.macd[techData.macd.length - 1]
                    if (!l) return null
                    const cross = techData.macd.slice(-5).find(d => d.crossType != null)
                    if (cross) return (
                      <StatusBadge color={cross.crossType === 'GOLDEN' ? '#16a34a' : '#ef4444'}>
                        {cross.crossType === 'GOLDEN' ? '⬆ 골든크로스' : '⬇ 데드크로스'}
                      </StatusBadge>
                    )
                    return (
                      <StatusBadge color={l.histogram > 0 ? '#16a34a' : '#ef4444'}>
                        {l.histogram > 0 ? '상승 모멘텀' : '하락 모멘텀'}
                      </StatusBadge>
                    )
                  })()}
                </div>
                <ResponsiveContainer width="100%" height={120}>
                  <ComposedChart data={techData.macd} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid {...GRID} />
                    <XAxis dataKey="date" tickFormatter={fmtDate} tick={AXIS_TICK} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={v => v.toFixed(1)} width={42} />
                    <Tooltip content={<MacdTT />} />
                    <ReferenceLine y={0} stroke="#ddd9f0" strokeWidth={1.5} />
                    <Bar dataKey="histogram" maxBarSize={8} radius={[2, 2, 0, 0]}>
                      {techData.macd.map((e, i) => <Cell key={i} fill={e.histogram >= 0 ? '#22c55e88' : '#ef444488'} />)}
                    </Bar>
                    <Line type="monotone" dataKey="macd"   stroke="#8b7fd4" strokeWidth={2}   dot={false} activeDot={{ r: 3, fill: '#8b7fd4', strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="signal" stroke="#f97316" strokeWidth={2} strokeDasharray="5 2" dot={false} activeDot={{ r: 3, fill: '#f97316', strokeWidth: 0 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}

            {!ind('price') && !ind('rsi') && !ind('macd') && (
              <div className="flex items-center justify-center h-32"
                style={{ fontSize: 13, color: '#b0accc' }}>
                표시할 지표를 선택하세요
              </div>
            )}
          </div>

          <p style={{ fontSize: 11, color: '#b0accc', marginTop: 20, paddingTop: 16, borderTop: '1px solid #f0ecfb' }}>
            ⚠️ 참고용 지표이며 투자 조언이 아닙니다.
          </p>
        </>
      )}
    </div>
  )
}
