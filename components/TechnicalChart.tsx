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
    case 'NEUTRAL':    return '#6b7280'
    case 'BEARISH':    return '#3b82f6'
    case 'OVERSOLD':   return '#22c55e'
  }
}

const PriceTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs shadow-xl space-y-0.5">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="text-white font-semibold">종가 ${d?.close?.toFixed(2)}</p>
      <p className="text-gray-400">고가 ${d?.high?.toFixed(2)} / 저가 ${d?.low?.toFixed(2)}</p>
      {d?.bbUpper != null && (
        <>
          <p className="text-indigo-400 mt-1">BB 상단 ${d.bbUpper?.toFixed(2)}</p>
          <p className="text-indigo-300">BB 중간 ${d.bbMiddle?.toFixed(2)}</p>
          <p className="text-indigo-400">BB 하단 ${d.bbLower?.toFixed(2)}</p>
        </>
      )}
      {d?.maSma20 != null && (
        <p className="text-emerald-400 mt-1">SMA20 ${d.maSma20?.toFixed(2)}</p>
      )}
      {d?.maSma50 != null && (
        <p className="text-orange-400">SMA50 ${d.maSma50?.toFixed(2)}</p>
      )}
      <p className="text-gray-500">거래량 {d?.volume?.toLocaleString()}</p>
    </div>
  )
}

const RsiTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const rsi = payload[0]?.value as number
  const signal = payload[0]?.payload?.signal as RsiSignal
  const statusMap: Record<RsiSignal, string> = {
    OVERBOUGHT: '과매수 ⚠️', BULLISH: '강세', NEUTRAL: '중립',
    BEARISH: '약세', OVERSOLD: '과매도 🔔',
  }
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="font-semibold" style={{ color: rsiColor(signal) }}>RSI {rsi?.toFixed(1)}</p>
      <p className="text-gray-400">{statusMap[signal]}</p>
    </div>
  )
}

const MacdTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  const cross = d?.crossType as MacdCross | null
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs shadow-xl space-y-0.5">
      <p className="text-gray-400 mb-1">{label}</p>
      <p style={{ color: '#3b82f6' }}>MACD {d?.macd?.toFixed(3)}</p>
      <p style={{ color: '#f97316' }}>Signal {d?.signal?.toFixed(3)}</p>
      <p style={{ color: d?.histogram >= 0 ? '#22c55e' : '#ef4444' }}>
        히스토그램 {d?.histogram >= 0 ? '+' : ''}{d?.histogram?.toFixed(3)}
      </p>
      {cross && (
        <p className="font-semibold" style={{ color: cross === 'GOLDEN' ? '#22c55e' : '#ef4444' }}>
          {cross === 'GOLDEN' ? '⬆ 골든크로스!' : '⬇ 데드크로스!'}
        </p>
      )}
    </div>
  )
}

export default function TechnicalChart({ ticker }: Props) {
  const [data, setData] = useState<TechnicalIndicatorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<Period>(30)
  const [indicators, setIndicators] = useState<IndicatorToggle[]>([
    { id: 'price',     label: '주가',        color: '#818cf8', enabled: true },
    { id: 'bollinger', label: '볼린저 밴드', color: '#6366f1', enabled: true },
    { id: 'ma',        label: '이동평균선',  color: '#10b981', enabled: true },
    { id: 'rsi',       label: 'RSI (14)',    color: '#f59e0b', enabled: true },
    { id: 'macd', label: 'MACD', color: '#3b82f6', enabled: true },
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
  const macdEnabled = indicators.find(i => i.id === 'macd')?.enabled

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

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-sm">📈 기술적 지표 — {ticker}</h3>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {([7, 30, 60, 90] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  period === p ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}>{p}일</button>
            ))}
          </div>
          <button onClick={fetchData} className="text-gray-400 hover:text-white text-xs px-2 py-1 bg-gray-700 rounded">↺</button>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {indicators.map(ind => (
          <button key={ind.id} onClick={() => toggleIndicator(ind.id)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all"
            style={ind.enabled
              ? { backgroundColor: ind.color + '33', borderColor: ind.color, color: ind.color }
              : { borderColor: '#4b5563', color: '#6b7280' }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ind.enabled ? ind.color : '#4b5563' }} />
            {ind.label}
          </button>
        ))}
      </div>

      {loading && <div className="flex items-center justify-center h-48 text-gray-500 text-sm"><span className="animate-pulse">데이터 로딩 중...</span></div>}
      {error && <div className="flex items-center justify-center h-48 text-red-400 text-sm">{error}</div>}

      {!loading && !error && data && (
        <div className="space-y-4">

          {/* 주가 + 볼린저 밴드 + 이동평균선 */}
          {priceEnabled && mergedPriceData.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-1 ml-1">
                <p className="text-gray-500 text-xs">주가 (종가)</p>
                {bollingerEnabled && <p className="text-indigo-400 text-xs">+ 볼린저 밴드 (20일, ±2σ)</p>}
                {maEnabled && <p className="text-emerald-400 text-xs">+ SMA20 / <span className="text-orange-400">SMA50</span></p>}
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={mergedPriceData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#818cf8" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="bbGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#6366f1" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis domain={priceYDomain} tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v.toFixed(0)}`} width={48} />
                  <Tooltip content={<PriceTooltip />} />

                  {bollingerEnabled && (
                    <>
                      <Area type="monotone" dataKey="bbUpper" stroke="#6366f1" strokeWidth={1} strokeDasharray="3 3" fill="url(#bbGrad)" dot={false} activeDot={false} connectNulls />
                      <Area type="monotone" dataKey="bbLower" stroke="#6366f1" strokeWidth={1} strokeDasharray="3 3" fill="#1f2937" dot={false} activeDot={false} connectNulls />
                      <Line type="monotone" dataKey="bbMiddle" stroke="#6366f160" strokeWidth={1} dot={false} activeDot={false} connectNulls />
                    </>
                  )}

                  {maEnabled && (
                    <>
                      <Line type="monotone" dataKey="maSma20" stroke="#10b981" strokeWidth={1.5} dot={false} activeDot={false} connectNulls />
                      <Line type="monotone" dataKey="maSma50" stroke="#f97316" strokeWidth={1.5} dot={false} activeDot={false} connectNulls />
                    </>
                  )}

                  <Area type="monotone" dataKey="close" stroke="#818cf8" strokeWidth={2} fill="url(#priceGrad)" dot={false} activeDot={{ r: 4, fill: '#818cf8' }} />
                </ComposedChart>
              </ResponsiveContainer>

              {/* 볼린저 밴드 현재값 요약 */}
              {bollingerEnabled && data.bollingerBands?.length > 0 && (() => {
                const latest = data.bollingerBands[data.bollingerBands.length - 1]
                const position = latest.percentB
                const posText = position > 1 ? '상단 돌파 (과매수)' : position > 0.8 ? '상단 근접' : position < 0 ? '하단 돌파 (과매도)' : position < 0.2 ? '하단 근접' : '밴드 중간'
                const posColor = position > 1 || position > 0.8 ? '#ef4444' : position < 0 || position < 0.2 ? '#22c55e' : '#6b7280'
                return (
                  <div className="flex items-center gap-4 mt-2 ml-1 text-xs">
                    <span className="text-gray-500">BB 상단 <span className="text-gray-300">${latest.upper.toFixed(2)}</span></span>
                    <span className="text-gray-500">중간 <span className="text-gray-300">${latest.middle.toFixed(2)}</span></span>
                    <span className="text-gray-500">하단 <span className="text-gray-300">${latest.lower.toFixed(2)}</span></span>
                    <span className="font-medium" style={{ color: posColor }}>{posText}</span>
                  </div>
                )
              })()}

              {/* 이동평균선 현재값 요약 */}
              {maEnabled && data.movingAverages?.length > 0 && (() => {
                const latest = data.movingAverages[data.movingAverages.length - 1]
                const price = data.priceData[data.priceData.length - 1]?.close
                const isGoldenCross = latest.sma20 != null && latest.sma50 != null && latest.sma20 > latest.sma50
                return (
                  <div className="flex items-center gap-4 mt-2 ml-1 text-xs">
                    {latest.sma20 != null && (
                      <span className="text-gray-500">
                        SMA20 <span className="text-emerald-400">${latest.sma20.toFixed(2)}</span>
                        {price != null && <span className={price > latest.sma20 ? ' text-emerald-400' : ' text-red-400'}>{price > latest.sma20 ? ' ↑' : ' ↓'}</span>}
                      </span>
                    )}
                    {latest.sma50 != null && (
                      <span className="text-gray-500">
                        SMA50 <span className="text-orange-400">${latest.sma50.toFixed(2)}</span>
                        {price != null && <span className={price > latest.sma50 ? ' text-emerald-400' : ' text-red-400'}>{price > latest.sma50 ? ' ↑' : ' ↓'}</span>}
                      </span>
                    )}
                    {latest.sma20 != null && latest.sma50 != null && (
                      <span className={`font-medium ${isGoldenCross ? 'text-emerald-400' : 'text-red-400'}`}>
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
              <p className="text-gray-500 text-xs mb-1 ml-1">RSI (14일)</p>
              <ResponsiveContainer width="100%" height={140}>
                <ComposedChart data={data.rsi} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis domain={[0, 100]} ticks={[0, 30, 50, 70, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<RsiTooltip />} />
                  <ReferenceArea y1={70} y2={100} fill="#ef444415" />
                  <ReferenceArea y1={0}   y2={30}  fill="#22c55e15" />
                  <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1} label={{ value: '과매수', position: 'insideTopRight', fill: '#ef4444', fontSize: 9 }} />
                  <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="4 3" strokeWidth={1} label={{ value: '과매도', position: 'insideBottomRight', fill: '#22c55e', fontSize: 9 }} />
                  <ReferenceLine y={50} stroke="#4b5563" strokeDasharray="2 4" strokeWidth={1} />
                  <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#f59e0b' }} />
                </ComposedChart>
              </ResponsiveContainer>
              {(() => {
                const latest = data.rsi[data.rsi.length - 1]
                const statusMap: Record<RsiSignal, { text: string; color: string }> = {
                  OVERBOUGHT: { text: '과매수 — 조정 가능', color: '#ef4444' },
                  BULLISH:    { text: '강세 구간',          color: '#f97316' },
                  NEUTRAL:    { text: '중립',               color: '#6b7280' },
                  BEARISH:    { text: '약세 구간',          color: '#3b82f6' },
                  OVERSOLD:   { text: '과매도 — 반등 기대', color: '#22c55e' },
                }
                const status = statusMap[latest.signal]
                return (
                  <div className="flex items-center gap-2 mt-2 ml-1">
                    <span className="text-gray-500 text-xs">현재 RSI</span>
                    <span className="text-white text-xs font-semibold">{latest.value.toFixed(1)}</span>
                    <span className="text-xs font-medium" style={{ color: status.color }}>{status.text}</span>
                  </div>
                )
              })()}
            </div>
          )}

          {/* ── MACD 차트 ──────────────────────────────────── */}
          {macdEnabled && data.macd?.length > 0 && (
            <div>
                <div className="flex items-center gap-3 mb-1 ml-1">
                    <p className="text-gray-500 text-xs">MACD (12, 26, 9)</p>
                    <span className="text-xs" style={{ color: '#3b82f6' }}>─ MACD</span>
                    <span className="text-xs" style={{ color: '#f97316' }}>- - Signal</span>
                    <span className="text-xs text-emerald-500/70">▌ 히스토그램</span>
                    </div>
                    <ResponsiveContainer width="100%" height={140}>
                        <ComposedChart data={data.macd} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                            <XAxis
                            dataKey="date"
                            tickFormatter={fmtDate}
                            tick={{ fill: '#6b7280', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            interval="preserveStartEnd"
                            />
                            <YAxis
                            tick={{ fill: '#6b7280', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={v => v.toFixed(1)}
                            width={42}
                            />
                            <Tooltip content={<MacdTooltip />} />
                            <ReferenceLine y={0} stroke="#4b5563" strokeWidth={1} />
                            <Bar dataKey="histogram" maxBarSize={8} radius={[1, 1, 0, 0]}>
                            {data.macd.map((entry, index) => (
                                <Cell
                                key={`macd-hist-${index}`}
                                fill={entry.histogram >= 0 ? '#22c55e88' : '#ef444488'}
                                />
                            ))}
                            </Bar>
                            <Line
                            type="monotone"
                            dataKey="macd"
                            stroke="#3b82f6"
                            strokeWidth={1.5}
                            dot={false}
                            activeDot={{ r: 3, fill: '#3b82f6' }}
                            />
                            <Line
                            type="monotone"
                            dataKey="signal"
                            stroke="#f97316"
                            strokeWidth={1.5}
                            strokeDasharray="4 2"
                            dot={false}
                            activeDot={{ r: 3, fill: '#f97316' }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                    {/* MACD 현재값 요약 */}
                    {(() => {
                        const latest = data.macd[data.macd.length - 1]
                        if (!latest) return null
                        const isBullish = latest.histogram > 0
                        const recentCross = data.macd.slice(-5).find(d => d.crossType != null)
                        const diverging = data.macd.length >= 3 && (() => {
                        const last3 = data.macd.slice(-3)
                        const histValues = last3.map(d => d.histogram)
                        const allRising = histValues.every((v, i) => i === 0 || v > histValues[i - 1])
                        const allFalling = histValues.every((v, i) => i === 0 || v < histValues[i - 1])
                        return allRising ? '모멘텀 강화 중 ▲' : allFalling ? '모멘텀 약화 중 ▼' : null
                        })()  
                        return (
                            <div className="flex items-center gap-3 mt-2 ml-1 text-xs flex-wrap">
                            <span className="text-gray-500">
                                MACD <span style={{ color: '#3b82f6' }}>{latest.macd > 0 ? '+' : ''}{latest.macd.toFixed(3)}</span>
                            </span>
                            <span className="text-gray-500">
                                Signal <span style={{ color: '#f97316' }}>{latest.signal.toFixed(3)}</span>
                            </span>
                            <span className="text-gray-500">
                                히스토그램{' '}
                                <span style={{ color: isBullish ? '#22c55e' : '#ef4444' }}>
                                {isBullish ? '+' : ''}{latest.histogram.toFixed(3)}
                                </span>
                            </span>
                            {recentCross && (
                                <span className="font-medium" style={{ color: recentCross.crossType === 'GOLDEN' ? '#22c55e' : '#ef4444' }}>
                                {recentCross.crossType === 'GOLDEN' ? '⬆ 골든크로스' : '⬇ 데드크로스'} (최근 5일)
                                </span>
                            )}
                            {!recentCross && diverging && (
                                <span className="text-gray-400">{diverging}</span>
                            )}
                        </div>
                    )
                })()}
            </div>
        )}

          {!priceEnabled && !rsiEnabled && !macdEnabled && (
            <div className="flex items-center justify-center h-32 text-gray-600 text-sm">표시할 지표를 선택하세요</div>
          )}
        </div>
      )}
    </div>
  )
}