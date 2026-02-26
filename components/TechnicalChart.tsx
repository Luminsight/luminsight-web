'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ResponsiveContainer, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ReferenceArea, ComposedChart, Area, Bar, Cell,
} from 'recharts'
import { technicalApi } from '@/lib/api'
import type { TechnicalIndicatorData, RsiSignal, MacdCross } from '@/types'

interface Props { ticker: string }
type Period = 7 | 30 | 60 | 90

const CARD: React.CSSProperties = { background: '#ffffff', borderRadius: '18px', padding: '20px', boxShadow: '0 2px 12px rgba(139,127,212,0.09)' }
const AXIS_TICK = { fill: '#c4c0d8', fontSize: 10 }
const GRID  = { strokeDasharray: '3 3' as const, stroke: '#f3f1fa', vertical: false }
const TT: React.CSSProperties = { background: '#ffffff', border: '1px solid #ece9f5', borderRadius: 12, padding: '10px 14px', boxShadow: '0 4px 20px rgba(139,127,212,0.13)', fontSize: 12 }

const rsiColor = (s: RsiSignal) => ({ OVERBOUGHT:'#f43f5e', BULLISH:'#fb923c', NEUTRAL:'#8b8fa8', BEARISH:'#8b7fd4', OVERSOLD:'#22c55e' }[s])

const PriceTT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div style={TT}>
      <p style={{ color: '#9e9ab8', marginBottom: 4 }}>{label}</p>
      <p style={{ color: '#18162a', fontWeight: 600 }}>종가 ${d?.close?.toFixed(2)}</p>
      <p style={{ color: '#9e9ab8' }}>고가 ${d?.high?.toFixed(2)} / 저가 ${d?.low?.toFixed(2)}</p>
      {d?.bbUpper != null && <>
        <p style={{ color: '#8b7fd4', marginTop: 4 }}>BB 상단 ${d.bbUpper?.toFixed(2)}</p>
        <p style={{ color: '#a89fe0' }}>BB 중간 ${d.bbMiddle?.toFixed(2)}</p>
        <p style={{ color: '#8b7fd4' }}>BB 하단 ${d.bbLower?.toFixed(2)}</p>
      </>}
      {d?.maSma20 != null && <p style={{ color: '#22c55e', marginTop: 4 }}>SMA20 ${d.maSma20?.toFixed(2)}</p>}
      {d?.maSma50 != null && <p style={{ color: '#fb923c' }}>SMA50 ${d.maSma50?.toFixed(2)}</p>}
    </div>
  )
}

const RsiTT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const rsi = payload[0]?.value as number
  const sig  = payload[0]?.payload?.signal as RsiSignal
  const map: Record<RsiSignal, string> = { OVERBOUGHT:'과매수 ⚠️', BULLISH:'강세', NEUTRAL:'중립', BEARISH:'약세', OVERSOLD:'과매도 🔔' }
  return <div style={TT}><p style={{ color: '#9e9ab8', marginBottom: 4 }}>{label}</p><p style={{ fontWeight: 600, color: rsiColor(sig) }}>RSI {rsi?.toFixed(1)}</p><p style={{ color: '#9e9ab8' }}>{map[sig]}</p></div>
}

const MacdTT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  const cross = d?.crossType as MacdCross | null
  return (
    <div style={TT}>
      <p style={{ color: '#9e9ab8', marginBottom: 4 }}>{label}</p>
      <p style={{ color: '#8b7fd4' }}>MACD {d?.macd?.toFixed(3)}</p>
      <p style={{ color: '#fb923c' }}>Signal {d?.signal?.toFixed(3)}</p>
      <p style={{ color: d?.histogram >= 0 ? '#22c55e' : '#f43f5e' }}>히스토그램 {d?.histogram >= 0 ? '+' : ''}{d?.histogram?.toFixed(3)}</p>
      {cross && <p style={{ fontWeight: 600, color: cross === 'GOLDEN' ? '#22c55e' : '#f43f5e' }}>{cross === 'GOLDEN' ? '⬆ 골든크로스!' : '⬇ 데드크로스!'}</p>}
    </div>
  )
}

export default function TechnicalChart({ ticker }: Props) {
  const [data, setData]   = useState<TechnicalIndicatorData | null>(null)
  const [loading, setL]   = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<Period>(30)
  const [inds, setInds] = useState([
    { id: 'price',     label: '주가',       color: '#8b7fd4', on: true },
    { id: 'bollinger', label: '볼린저 밴드', color: '#a89fe0', on: true },
    { id: 'ma',        label: '이동평균선',  color: '#22c55e', on: true },
    { id: 'rsi',       label: 'RSI (14)',   color: '#fb923c', on: true },
    { id: 'macd',      label: 'MACD',       color: '#8b7fd4', on: true },
  ])

  const fetch = useCallback(async () => {
    setL(true); setError(null)
    try { setData(await technicalApi.getIndicators(ticker, period)) }
    catch { setError('데이터를 불러오지 못했습니다.') }
    finally { setL(false) }
  }, [ticker, period])

  useEffect(() => { fetch() }, [fetch])

  const toggle = (id: string) => setInds(p => p.map(i => i.id === id ? { ...i, on: !i.on } : i))
  const ind    = (id: string) => inds.find(i => i.id === id)?.on

  const fmtDate = (d: string) => d?.slice(5) ?? ''

  const merged = useMemo(() => {
    if (!data) return []
    const bbM = new Map((data.bollingerBands ?? []).map(b => [b.date, b]))
    const maM = new Map((data.movingAverages ?? []).map(m => [m.date, m]))
    return data.priceData.map(p => ({
      ...p,
      bbUpper: bbM.get(p.date)?.upper, bbMiddle: bbM.get(p.date)?.middle, bbLower: bbM.get(p.date)?.lower,
      maSma20: maM.get(p.date)?.sma20 ?? undefined, maSma50: maM.get(p.date)?.sma50 ?? undefined,
    }))
  }, [data])

  const priceY = useMemo(() => {
    if (!merged.length) return [0, 100]
    const vals = merged.flatMap(p => [p.close, ind('bollinger') ? (p.bbUpper ?? p.close) : p.close, ind('bollinger') ? (p.bbLower ?? p.close) : p.close])
    return [Math.min(...vals) * 0.98, Math.max(...vals) * 1.02]
  }, [merged, inds])

  return (
    <div style={CARD}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm" style={{ color: '#18162a' }}>📈 기술적 지표 — {ticker}</h3>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {([7, 30, 60, 90] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className="px-2 py-1 rounded-lg text-xs font-medium transition-colors"
                style={{ background: period === p ? '#8b7fd4' : '#f0eefb', color: period === p ? '#fff' : '#8b7fd4' }}>
                {p}일
              </button>
            ))}
          </div>
          <button onClick={fetch} className="text-xs px-2 py-1 rounded-lg"
            style={{ background: '#f8f7fd', color: '#9e9ab8' }}>↺</button>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {inds.map(i => (
          <button key={i.id} onClick={() => toggle(i.id)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all"
            style={i.on
              ? { background: i.color + '18', borderColor: i.color, color: i.color }
              : { background: '#f8f7fd', borderColor: '#ece9f5', color: '#c4c0d8' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: i.on ? i.color : '#ece9f5' }} />
            {i.label}
          </button>
        ))}
      </div>

      {loading && <div className="flex items-center justify-center h-48"><span className="animate-pulse text-sm" style={{ color: '#c4c0d8' }}>데이터 로딩 중...</span></div>}
      {error   && <div className="flex items-center justify-center h-48 text-sm" style={{ color: '#f43f5e' }}>{error}</div>}

      {!loading && !error && data && (
        <div className="space-y-4">

          {ind('price') && merged.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-1 ml-1 flex-wrap text-xs">
                <span style={{ color: '#9e9ab8' }}>주가 (종가)</span>
                {ind('bollinger') && <span style={{ color: '#a89fe0' }}>+ 볼린저 밴드</span>}
                {ind('ma') && <span><span style={{ color: '#22c55e' }}>+ SMA20</span> / <span style={{ color: '#fb923c' }}>SMA50</span></span>}
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={merged} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#8b7fd4" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#8b7fd4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...GRID} />
                  <XAxis dataKey="date" tickFormatter={fmtDate} tick={AXIS_TICK} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis domain={priceY} tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={v => `$${v.toFixed(0)}`} width={48} />
                  <Tooltip content={<PriceTT />} />
                  {ind('bollinger') && <>
                    <Area type="monotone" dataKey="bbUpper"  stroke="#a89fe0" strokeWidth={1} strokeDasharray="3 3" fill="none" dot={false} activeDot={false} connectNulls />
                    <Area type="monotone" dataKey="bbLower"  stroke="#a89fe0" strokeWidth={1} strokeDasharray="3 3" fill="none" dot={false} activeDot={false} connectNulls />
                    <Line type="monotone" dataKey="bbMiddle" stroke="#c4bde8" strokeWidth={1} dot={false} activeDot={false} connectNulls />
                  </>}
                  {ind('ma') && <>
                    <Line type="monotone" dataKey="maSma20" stroke="#22c55e" strokeWidth={1.5} dot={false} activeDot={false} connectNulls />
                    <Line type="monotone" dataKey="maSma50" stroke="#fb923c" strokeWidth={1.5} dot={false} activeDot={false} connectNulls />
                  </>}
                  <Area type="monotone" dataKey="close" stroke="#8b7fd4" strokeWidth={2.5} fill="url(#pGrad)" dot={false} activeDot={{ r: 4, fill: '#8b7fd4', strokeWidth: 0 }} />
                </ComposedChart>
              </ResponsiveContainer>
              {ind('bollinger') && data.bollingerBands?.length > 0 && (() => {
                const l = data.bollingerBands[data.bollingerBands.length - 1]
                const posText  = l.percentB > 1 ? '상단 돌파' : l.percentB > 0.8 ? '상단 근접' : l.percentB < 0 ? '하단 돌파' : l.percentB < 0.2 ? '하단 근접' : '밴드 중간'
                const posColor = l.percentB > 0.8 ? '#f43f5e' : l.percentB < 0.2 ? '#22c55e' : '#8b8fa8'
                return <div className="flex items-center gap-4 mt-2 ml-1 text-xs flex-wrap">
                  <span style={{ color: '#9e9ab8' }}>상단 <b style={{ color: '#5e5a78' }}>${l.upper.toFixed(2)}</b></span>
                  <span style={{ color: '#9e9ab8' }}>중간 <b style={{ color: '#5e5a78' }}>${l.middle.toFixed(2)}</b></span>
                  <span style={{ color: '#9e9ab8' }}>하단 <b style={{ color: '#5e5a78' }}>${l.lower.toFixed(2)}</b></span>
                  <span style={{ color: posColor, fontWeight: 600 }}>{posText}</span>
                </div>
              })()}
              {ind('ma') && data.movingAverages?.length > 0 && (() => {
                const l = data.movingAverages[data.movingAverages.length - 1]
                const price = data.priceData[data.priceData.length - 1]?.close
                const golden = l.sma20 != null && l.sma50 != null && l.sma20 > l.sma50
                return <div className="flex items-center gap-4 mt-2 ml-1 text-xs flex-wrap">
                  {l.sma20 != null && <span style={{ color: '#9e9ab8' }}>SMA20 <b style={{ color: '#22c55e' }}>${l.sma20.toFixed(2)}</b>{price != null && <b style={{ color: price > l.sma20 ? '#22c55e' : '#f43f5e' }}>{price > l.sma20 ? ' ↑' : ' ↓'}</b>}</span>}
                  {l.sma50 != null && <span style={{ color: '#9e9ab8' }}>SMA50 <b style={{ color: '#fb923c' }}>${l.sma50.toFixed(2)}</b>{price != null && <b style={{ color: price > l.sma50 ? '#22c55e' : '#f43f5e' }}>{price > l.sma50 ? ' ↑' : ' ↓'}</b>}</span>}
                  {l.sma20 != null && l.sma50 != null && <span style={{ color: golden ? '#22c55e' : '#f43f5e', fontWeight: 600 }}>{golden ? '골든크로스' : '데드크로스'}</span>}
                </div>
              })()}
            </div>
          )}

          {ind('rsi') && data.rsi.length > 0 && (
            <div>
              <p className="text-xs mb-1 ml-1" style={{ color: '#9e9ab8' }}>RSI (14일)</p>
              <ResponsiveContainer width="100%" height={130}>
                <ComposedChart data={data.rsi} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid {...GRID} />
                  <XAxis dataKey="date" tickFormatter={fmtDate} tick={AXIS_TICK} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis domain={[0, 100]} ticks={[0, 30, 50, 70, 100]} tick={AXIS_TICK} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<RsiTT />} />
                  <ReferenceArea y1={70} y2={100} fill="#f43f5e08" />
                  <ReferenceArea y1={0}   y2={30}  fill="#22c55e08" />
                  <ReferenceLine y={70} stroke="#f43f5e" strokeDasharray="4 3" strokeWidth={1} label={{ value: '과매수', position: 'insideTopRight', fill: '#f43f5e', fontSize: 9 }} />
                  <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="4 3" strokeWidth={1} label={{ value: '과매도', position: 'insideBottomRight', fill: '#22c55e', fontSize: 9 }} />
                  <ReferenceLine y={50} stroke="#ece9f5" strokeDasharray="2 4" strokeWidth={1} />
                  <Line type="monotone" dataKey="value" stroke="#fb923c" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#fb923c', strokeWidth: 0 }} />
                </ComposedChart>
              </ResponsiveContainer>
              {(() => {
                const l = data.rsi[data.rsi.length - 1]
                const map: Record<RsiSignal, { text: string; color: string }> = {
                  OVERBOUGHT: { text: '과매수 — 조정 가능', color: '#f43f5e' },
                  BULLISH:    { text: '강세 구간',          color: '#fb923c' },
                  NEUTRAL:    { text: '중립',               color: '#8b8fa8' },
                  BEARISH:    { text: '약세 구간',          color: '#8b7fd4' },
                  OVERSOLD:   { text: '과매도 — 반등 기대', color: '#22c55e' },
                }
                const s = map[l.signal]
                return <div className="flex items-center gap-2 mt-2 ml-1">
                  <span className="text-xs" style={{ color: '#9e9ab8' }}>현재 RSI</span>
                  <span className="text-xs font-semibold" style={{ color: '#18162a' }}>{l.value.toFixed(1)}</span>
                  <span className="text-xs font-medium" style={{ color: s.color }}>{s.text}</span>
                </div>
              })()}
            </div>
          )}

          {ind('macd') && data.macd?.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-1 ml-1 flex-wrap text-xs">
                <span style={{ color: '#9e9ab8' }}>MACD (12, 26, 9)</span>
                <span style={{ color: '#8b7fd4' }}>─ MACD</span>
                <span style={{ color: '#fb923c' }}>- - Signal</span>
              </div>
              <ResponsiveContainer width="100%" height={130}>
                <ComposedChart data={data.macd} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid {...GRID} />
                  <XAxis dataKey="date" tickFormatter={fmtDate} tick={AXIS_TICK} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={v => v.toFixed(1)} width={42} />
                  <Tooltip content={<MacdTT />} />
                  <ReferenceLine y={0} stroke="#ece9f5" strokeWidth={1} />
                  <Bar dataKey="histogram" maxBarSize={8} radius={[1, 1, 0, 0]}>
                    {data.macd.map((e, i) => <Cell key={i} fill={e.histogram >= 0 ? '#22c55e66' : '#f43f5e66'} />)}
                  </Bar>
                  <Line type="monotone" dataKey="macd"   stroke="#8b7fd4" strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: '#8b7fd4', strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="signal" stroke="#fb923c" strokeWidth={1.5} strokeDasharray="4 2" dot={false} activeDot={{ r: 3, fill: '#fb923c', strokeWidth: 0 }} />
                </ComposedChart>
              </ResponsiveContainer>
              {(() => {
                const l = data.macd[data.macd.length - 1]
                if (!l) return null
                const bull = l.histogram > 0
                const cross = data.macd.slice(-5).find(d => d.crossType != null)
                return <div className="flex items-center gap-3 mt-2 ml-1 text-xs flex-wrap">
                  <span style={{ color: '#9e9ab8' }}>MACD <b style={{ color: '#8b7fd4' }}>{l.macd > 0 ? '+' : ''}{l.macd.toFixed(3)}</b></span>
                  <span style={{ color: '#9e9ab8' }}>Signal <b style={{ color: '#fb923c' }}>{l.signal.toFixed(3)}</b></span>
                  <span style={{ color: '#9e9ab8' }}>히스토그램 <b style={{ color: bull ? '#22c55e' : '#f43f5e' }}>{bull ? '+' : ''}{l.histogram.toFixed(3)}</b></span>
                  {cross && <span style={{ fontWeight: 600, color: cross.crossType === 'GOLDEN' ? '#22c55e' : '#f43f5e' }}>{cross.crossType === 'GOLDEN' ? '⬆ 골든크로스' : '⬇ 데드크로스'} (최근 5일)</span>}
                </div>
              })()}
            </div>
          )}

          {!ind('price') && !ind('rsi') && !ind('macd') && (
            <div className="flex items-center justify-center h-32 text-sm" style={{ color: '#c4c0d8' }}>표시할 지표를 선택하세요</div>
          )}
        </div>
      )}
    </div>
  )
}
