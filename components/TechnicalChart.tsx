'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ResponsiveContainer,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  ComposedChart,
  Area,
  Bar,
  Cell,
} from 'recharts'
import { technicalApi } from '@/lib/api'
import type { TechnicalIndicatorData, RsiSignal, MacdCross } from '@/types'

interface Props { ticker: string }
type Period = 7 | 30 | 60 | 90
interface IndicatorToggle { id: string; label: string; color: string; enabled: boolean }

const rsiColor = (signal: RsiSignal): string => {
  switch (signal) {
    case 'OVERBOUGHT': return '#ef4444'
    case 'BULLISH':    return '#f97316'
    case 'NEUTRAL':    return '#64748b'
    case 'BEARISH':    return '#3b82f6'
    case 'OVERSOLD':   return '#22c55e'
  }
}

// ── 공통 툴팁 래퍼 스타일 ─────────────────────────────────────────────────────
const tooltipStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '10px',
  padding: '10px 14px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
  fontSize: '12px',
  lineHeight: '1.7',
}

const PriceTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div style={tooltipStyle}>
      <p style={{ color: '#94a3b8', marginBottom: '4px' }}>{label}</p>
      <p style={{ color: '#0f172a', fontWeight: 600 }}>종가 ${d?.close?.toFixed(2)}</p>
      <p style={{ color: '#64748b' }}>고가 ${d?.high?.toFixed(2)} / 저가 ${d?.low?.toFixed(2)}</p>
      {d?.bbUpper != null && (
        <>
          <p style={{ color: '#6366f1', marginTop: '4px' }}>BB 상단 ${d.bbUpper?.toFixed(2)}</p>
          <p style={{ color: '#8b5cf6' }}>BB 중간 ${d.bbMiddle?.toFixed(2)}</p>
          <p style={{ color: '#6366f1' }}>BB 하단 ${d.bbLower?.toFixed(2)}</p>
        </>
      )}
      {d?.maSma20 != null && <p style={{ color: '#10b981', marginTop: '4px' }}>SMA20 ${d.maSma20?.toFixed(2)}</p>}
      {d?.maSma50 != null && <p style={{ color: '#f97316' }}>SMA50 ${d.maSma50?.toFixed(2)}</p>}
      <p style={{ color: '#94a3b8' }}>거래량 {d?.volume?.toLocaleString()}</p>
    </div>
  )
}

const RsiTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const rsi    = payload[0]?.value as number
  const signal = payload[0]?.payload?.signal as RsiSignal
  const statusMap: Record<RsiSignal, string> = {
    OVERBOUGHT: '과매수 ⚠️', BULLISH: '강세', NEUTRAL: '중립',
    BEARISH: '약세', OVERSOLD: '과매도 🔔',
  }
  return (
    <div style={tooltipStyle}>
      <p style={{ color: '#94a3b8', marginBottom: '4px' }}>{label}</p>
      <p style={{ color: rsiColor(signal), fontWeight: 600 }}>RSI {rsi?.toFixed(1)}</p>
      <p style={{ color: '#64748b' }}>{statusMap[signal]}</p>
    </div>
  )
}

const MacdTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const d     = payload[0]?.payload
  const cross = d?.crossType as MacdCross | null
  return (
    <div style={tooltipStyle}>
      <p style={{ color: '#94a3b8', marginBottom: '4px' }}>{label}</p>
      <p style={{ color: '#3d5af1' }}>MACD {d?.macd?.toFixed(3)}</p>
      <p style={{ color: '#f97316' }}>Signal {d?.signal?.toFixed(3)}</p>
      <p style={{ color: d?.histogram >= 0 ? '#10b981' : '#ef4444' }}>
        히스토그램 {d?.histogram >= 0 ? '+' : ''}{d?.histogram?.toFixed(3)}
      </p>
      {cross && (
        <p style={{ fontWeight: 600, color: cross === 'GOLDEN' ? '#10b981' : '#ef4444' }}>
          {cross === 'GOLDEN' ? '⬆ 골든크로스!' : '⬇ 데드크로스!'}
        </p>
      )}
    </div>
  )
}

export default function TechnicalChart({ ticker }: Props) {
  const [data, setData]         = useState<TechnicalIndicatorData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [period, setPeriod]     = useState<Period>(30)
  const [indicators, setIndicators] = useState<IndicatorToggle[]>([
    { id: 'price',     label: '주가',        color: '#6366f1', enabled: true },
    { id: 'bollinger', label: '볼린저 밴드', color: '#8b5cf6', enabled: true },
    { id: 'ma',        label: '이동평균선',  color: '#10b981', enabled: true },
    { id: 'rsi',       label: 'RSI (14)',    color: '#f59e0b', enabled: true },
    { id: 'macd',      label: 'MACD',        color: '#3d5af1', enabled: true },
  ])

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      setData(await technicalApi.getIndicators(ticker, period))
    } catch {
      setError('기술적 지표 데이터를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [ticker, period])

  useEffect(() => { fetchData() }, [fetchData])

  const toggleIndicator = (id: string) =>
    setIndicators(prev => prev.map(ind => ind.id === id ? { ...ind, enabled: !ind.enabled } : ind))

  const priceEnabled     = indicators.find(i => i.id === 'price')?.enabled
  const bollingerEnabled = indicators.find(i => i.id === 'bollinger')?.enabled
  const maEnabled        = indicators.find(i => i.id === 'ma')?.enabled
  const rsiEnabled       = indicators.find(i => i.id === 'rsi')?.enabled
  const macdEnabled      = indicators.find(i => i.id === 'macd')?.enabled

  const fmtDate = (d: string) => d?.slice(5) ?? ''

  const mergedPriceData = useMemo(() => {
    if (!data) return []
    const bbMap = new Map((data.bollingerBands ?? []).map(b => [b.date, b]))
    const maMap = new Map((data.movingAverages ?? []).map(m => [m.date, m]))
    return data.priceData.map(p => ({
      ...p,
      bbUpper:  bbMap.get(p.date)?.upper,
      bbMiddle: bbMap.get(p.date)?.middle,
      bbLower:  bbMap.get(p.date)?.lower,
      maSma20:  maMap.get(p.date)?.sma20 ?? undefined,
      maSma50:  maMap.get(p.date)?.sma50 ?? undefined,
    }))
  }, [data])

  const priceYDomain = useMemo(() => {
    if (!mergedPriceData.length) return [0, 100]
    const values = mergedPriceData.flatMap(p => [
      p.close,
      bollingerEnabled ? (p.bbUpper ?? p.close) : p.close,
      bollingerEnabled ? (p.bbLower ?? p.close) : p.close,
      maEnabled && p.maSma20 != null ? p.maSma20 : p.close,
      maEnabled && p.maSma50 != null ? p.maSma50 : p.close,
    ])
    return [Math.min(...values) * 0.98, Math.max(...values) * 1.02]
  }, [mergedPriceData, bollingerEnabled, maEnabled])

  // ── 공통 축 스타일 ─────────────────────────────────────────────────────────
  const axisTick = { fill: '#94a3b8', fontSize: 10 }
  const gridProps = { strokeDasharray: '3 3' as const, stroke: '#f1f5f9', vertical: false }

  const cardStyle: React.CSSProperties = {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
  }

  return (
    <div style={cardStyle}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm" style={{ color: '#0f172a' }}>📈 기술적 지표 — {ticker}</h3>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {([7, 30, 60, 90] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="px-2 py-1 rounded text-xs font-medium transition-colors"
                style={{
                  background: period === p ? '#3d5af1' : '#f1f5f9',
                  color:      period === p ? '#ffffff' : '#64748b',
                }}
              >
                {p}일
              </button>
            ))}
          </div>
          <button
            onClick={fetchData}
            className="text-xs px-2 py-1 rounded transition-colors"
            style={{ background: '#f1f5f9', color: '#64748b' }}
          >
            ↺
          </button>
        </div>
      </div>

      {/* 지표 토글 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {indicators.map(ind => (
          <button
            key={ind.id}
            onClick={() => toggleIndicator(ind.id)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all"
            style={ind.enabled
              ? { backgroundColor: ind.color + '18', borderColor: ind.color, color: ind.color }
              : { borderColor: '#e2e8f0', color: '#94a3b8', background: '#f8fafc' }
            }
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ind.enabled ? ind.color : '#cbd5e1' }} />
            {ind.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center h-48 text-sm" style={{ color: '#94a3b8' }}>
          <span className="animate-pulse">데이터 로딩 중...</span>
        </div>
      )}
      {error && (
        <div className="flex items-center justify-center h-48 text-sm" style={{ color: '#ef4444' }}>{error}</div>
      )}

      {!loading && !error && data && (
        <div className="space-y-4">

          {/* 주가 + 볼린저 밴드 + 이동평균선 */}
          {priceEnabled && mergedPriceData.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-1 ml-1 flex-wrap">
                <p className="text-xs" style={{ color: '#94a3b8' }}>주가 (종가)</p>
                {bollingerEnabled && <p className="text-xs" style={{ color: '#8b5cf6' }}>+ 볼린저 밴드 (20일, ±2σ)</p>}
                {maEnabled && (
                  <p className="text-xs">
                    <span style={{ color: '#10b981' }}>+ SMA20</span>
                    {' / '}
                    <span style={{ color: '#f97316' }}>SMA50</span>
                  </p>
                )}
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={mergedPriceData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="bbGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#8b5cf6" stopOpacity={0.08} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="date" tickFormatter={fmtDate} tick={axisTick} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis domain={priceYDomain} tick={axisTick} axisLine={false} tickLine={false} tickFormatter={v => `$${v.toFixed(0)}`} width={48} />
                  <Tooltip content={<PriceTooltip />} />

                  {bollingerEnabled && (
                    <>
                      <Area type="monotone" dataKey="bbUpper"  stroke="#8b5cf6" strokeWidth={1} strokeDasharray="3 3" fill="url(#bbGrad)" dot={false} activeDot={false} connectNulls />
                      <Area type="monotone" dataKey="bbLower"  stroke="#8b5cf6" strokeWidth={1} strokeDasharray="3 3" fill="none"         dot={false} activeDot={false} connectNulls />
                      <Line type="monotone" dataKey="bbMiddle" stroke="#c4b5fd" strokeWidth={1} dot={false} activeDot={false} connectNulls />
                    </>
                  )}
                  {maEnabled && (
                    <>
                      <Line type="monotone" dataKey="maSma20" stroke="#10b981" strokeWidth={1.5} dot={false} activeDot={false} connectNulls />
                      <Line type="monotone" dataKey="maSma50" stroke="#f97316" strokeWidth={1.5} dot={false} activeDot={false} connectNulls />
                    </>
                  )}
                  <Area type="monotone" dataKey="close" stroke="#6366f1" strokeWidth={2} fill="url(#priceGrad)" dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
                </ComposedChart>
              </ResponsiveContainer>

              {/* 볼린저 밴드 현재값 요약 */}
              {bollingerEnabled && data.bollingerBands?.length > 0 && (() => {
                const latest = data.bollingerBands[data.bollingerBands.length - 1]
                const position = latest.percentB
                const posText  = position > 1 ? '상단 돌파 (과매수)' : position > 0.8 ? '상단 근접' : position < 0 ? '하단 돌파 (과매도)' : position < 0.2 ? '하단 근접' : '밴드 중간'
                const posColor = position > 1 || position > 0.8 ? '#ef4444' : position < 0 || position < 0.2 ? '#10b981' : '#64748b'
                return (
                  <div className="flex items-center gap-4 mt-2 ml-1 text-xs flex-wrap">
                    <span style={{ color: '#94a3b8' }}>BB 상단 <strong style={{ color: '#475569' }}>${latest.upper.toFixed(2)}</strong></span>
                    <span style={{ color: '#94a3b8' }}>중간 <strong style={{ color: '#475569' }}>${latest.middle.toFixed(2)}</strong></span>
                    <span style={{ color: '#94a3b8' }}>하단 <strong style={{ color: '#475569' }}>${latest.lower.toFixed(2)}</strong></span>
                    <span style={{ color: posColor, fontWeight: 600 }}>{posText}</span>
                  </div>
                )
              })()}

              {/* 이동평균선 현재값 요약 */}
              {maEnabled && data.movingAverages?.length > 0 && (() => {
                const latest = data.movingAverages[data.movingAverages.length - 1]
                const price  = data.priceData[data.priceData.length - 1]?.close
                const isGoldenCross = latest.sma20 != null && latest.sma50 != null && latest.sma20 > latest.sma50
                return (
                  <div className="flex items-center gap-4 mt-2 ml-1 text-xs flex-wrap">
                    {latest.sma20 != null && (
                      <span style={{ color: '#94a3b8' }}>
                        SMA20 <span style={{ color: '#10b981' }}>${latest.sma20.toFixed(2)}</span>
                        {price != null && <span style={{ color: price > latest.sma20 ? '#10b981' : '#ef4444' }}>{price > latest.sma20 ? ' ↑' : ' ↓'}</span>}
                      </span>
                    )}
                    {latest.sma50 != null && (
                      <span style={{ color: '#94a3b8' }}>
                        SMA50 <span style={{ color: '#f97316' }}>${latest.sma50.toFixed(2)}</span>
                        {price != null && <span style={{ color: price > latest.sma50 ? '#10b981' : '#ef4444' }}>{price > latest.sma50 ? ' ↑' : ' ↓'}</span>}
                      </span>
                    )}
                    {latest.sma20 != null && latest.sma50 != null && (
                      <span style={{ fontWeight: 600, color: isGoldenCross ? '#10b981' : '#ef4444' }}>
                        {isGoldenCross ? '골든크로스 구간' : '데드크로스 구간'}
                      </span>
                    )}
                  </div>
                )
              })()}
            </div>
          )}

          {/* RSI 차트 */}
          {rsiEnabled && data.rsi.length > 0 && (
            <div>
              <p className="text-xs mb-1 ml-1" style={{ color: '#94a3b8' }}>RSI (14일)</p>
              <ResponsiveContainer width="100%" height={140}>
                <ComposedChart data={data.rsi} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="date" tickFormatter={fmtDate} tick={axisTick} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis domain={[0, 100]} ticks={[0, 30, 50, 70, 100]} tick={axisTick} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<RsiTooltip />} />
                  <ReferenceArea y1={70} y2={100} fill="#ef444408" />
                  <ReferenceArea y1={0}   y2={30}  fill="#10b98108" />
                  <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1} label={{ value: '과매수', position: 'insideTopRight', fill: '#ef4444', fontSize: 9 }} />
                  <ReferenceLine y={30} stroke="#10b981" strokeDasharray="4 3" strokeWidth={1} label={{ value: '과매도', position: 'insideBottomRight', fill: '#10b981', fontSize: 9 }} />
                  <ReferenceLine y={50} stroke="#e2e8f0" strokeDasharray="2 4" strokeWidth={1} />
                  <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#f59e0b' }} />
                </ComposedChart>
              </ResponsiveContainer>
              {(() => {
                const latest = data.rsi[data.rsi.length - 1]
                const statusMap: Record<RsiSignal, { text: string; color: string }> = {
                  OVERBOUGHT: { text: '과매수 — 조정 가능', color: '#ef4444' },
                  BULLISH:    { text: '강세 구간',          color: '#f97316' },
                  NEUTRAL:    { text: '중립',               color: '#64748b' },
                  BEARISH:    { text: '약세 구간',          color: '#3b82f6' },
                  OVERSOLD:   { text: '과매도 — 반등 기대', color: '#10b981' },
                }
                const status = statusMap[latest.signal]
                return (
                  <div className="flex items-center gap-2 mt-2 ml-1">
                    <span className="text-xs" style={{ color: '#94a3b8' }}>현재 RSI</span>
                    <span className="text-xs font-semibold" style={{ color: '#0f172a' }}>{latest.value.toFixed(1)}</span>
                    <span className="text-xs font-medium" style={{ color: status.color }}>{status.text}</span>
                  </div>
                )
              })()}
            </div>
          )}

          {/* MACD 차트 */}
          {macdEnabled && data.macd?.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-1 ml-1 flex-wrap">
                <p className="text-xs" style={{ color: '#94a3b8' }}>MACD (12, 26, 9)</p>
                <span className="text-xs" style={{ color: '#3d5af1' }}>─ MACD</span>
                <span className="text-xs" style={{ color: '#f97316' }}>- - Signal</span>
                <span className="text-xs" style={{ color: '#10b981' }}>▌ 히스토그램</span>
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <ComposedChart data={data.macd} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="date" tickFormatter={fmtDate} tick={axisTick} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={v => v.toFixed(1)} width={42} />
                  <Tooltip content={<MacdTooltip />} />
                  <ReferenceLine y={0} stroke="#e2e8f0" strokeWidth={1} />
                  <Bar dataKey="histogram" maxBarSize={8} radius={[1, 1, 0, 0]}>
                    {data.macd.map((entry, index) => (
                      <Cell key={`macd-hist-${index}`} fill={entry.histogram >= 0 ? '#10b98166' : '#ef444466'} />
                    ))}
                  </Bar>
                  <Line type="monotone" dataKey="macd"   stroke="#3d5af1" strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: '#3d5af1' }} />
                  <Line type="monotone" dataKey="signal" stroke="#f97316" strokeWidth={1.5} strokeDasharray="4 2" dot={false} activeDot={{ r: 3, fill: '#f97316' }} />
                </ComposedChart>
              </ResponsiveContainer>
              {(() => {
                const latest = data.macd[data.macd.length - 1]
                if (!latest) return null
                const isBullish    = latest.histogram > 0
                const recentCross  = data.macd.slice(-5).find(d => d.crossType != null)
                const diverging    = data.macd.length >= 3 && (() => {
                  const last3       = data.macd.slice(-3)
                  const histValues  = last3.map(d => d.histogram)
                  const allRising   = histValues.every((v, i) => i === 0 || v > histValues[i - 1])
                  const allFalling  = histValues.every((v, i) => i === 0 || v < histValues[i - 1])
                  return allRising ? '모멘텀 강화 중 ▲' : allFalling ? '모멘텀 약화 중 ▼' : null
                })()
                return (
                  <div className="flex items-center gap-3 mt-2 ml-1 text-xs flex-wrap">
                    <span style={{ color: '#94a3b8' }}>MACD <span style={{ color: '#3d5af1' }}>{latest.macd > 0 ? '+' : ''}{latest.macd.toFixed(3)}</span></span>
                    <span style={{ color: '#94a3b8' }}>Signal <span style={{ color: '#f97316' }}>{latest.signal.toFixed(3)}</span></span>
                    <span style={{ color: '#94a3b8' }}>히스토그램 <span style={{ color: isBullish ? '#10b981' : '#ef4444' }}>{isBullish ? '+' : ''}{latest.histogram.toFixed(3)}</span></span>
                    {recentCross && (
                      <span style={{ fontWeight: 600, color: recentCross.crossType === 'GOLDEN' ? '#10b981' : '#ef4444' }}>
                        {recentCross.crossType === 'GOLDEN' ? '⬆ 골든크로스' : '⬇ 데드크로스'} (최근 5일)
                      </span>
                    )}
                    {!recentCross && diverging && (
                      <span style={{ color: '#64748b' }}>{diverging}</span>
                    )}
                  </div>
                )
              })()}
            </div>
          )}

          {!priceEnabled && !rsiEnabled && !macdEnabled && (
            <div className="flex items-center justify-center h-32 text-sm" style={{ color: '#94a3b8' }}>표시할 지표를 선택하세요</div>
          )}
        </div>
      )}
    </div>
  )
}
