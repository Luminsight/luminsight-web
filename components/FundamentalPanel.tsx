'use client'

import { useEffect, useState } from 'react'
import { fundamentalApi } from '@/lib/api'
import { FundamentalData, EarningsHistory } from '@/types'

interface Props { ticker: string }

// ── 디자인 토큰 (기존 컴포넌트와 동일) ──────────────────────
const CARD: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: '20px',
  padding: '28px',
  boxShadow: '0 4px 24px rgba(139,127,212,0.10)',
}
const DIVIDER: React.CSSProperties = {
  borderTop: '1.5px solid #f0ecfb',
  margin: '16px 0',
}

// ── 유틸 ────────────────────────────────────────────────────
function fmt(val: number | null | undefined, digits = 2): string {
  if (val == null) return 'N/A'
  return val.toFixed(digits)
}
function fmtPct(val: number | null | undefined): string {
  if (val == null) return 'N/A'
  return `${(val * 100).toFixed(1)}%`
}
function fmtCap(val: number | null | undefined): string {
  if (val == null) return 'N/A'
  if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`
  if (val >= 1e9)  return `$${(val / 1e9).toFixed(1)}B`
  if (val >= 1e6)  return `$${(val / 1e6).toFixed(1)}M`
  return `$${val.toLocaleString()}`
}
function daysUntil(d: string | null | undefined): number | null {
  if (!d) return null
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
}

// ── 서브 컴포넌트 ────────────────────────────────────────────
function MetricRow({
  label, value, sub, valueColor,
}: { label: string; value: string; sub?: string; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f3fd' }}>
      <span style={{ fontSize: 13, color: '#9e9ab8' }}>{label}</span>
      <div style={{ textAlign: 'right' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: valueColor ?? '#18162a' }}>{value}</span>
        {sub && <span style={{ fontSize: 11, color: '#c4c0d8', marginLeft: 6 }}>{sub}</span>}
      </div>
    </div>
  )
}

function EarningsRow({ q, idx }: { q: EarningsHistory['quarters'][number]; idx: number }) {
  const beat = q.beat
  const surpColor = beat === true ? '#ef4444' : beat === false ? '#2563eb' : '#9e9ab8'
  const label = beat === true ? '✅ Beat' : beat === false ? '❌ Miss' : '-'
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
      gap: 8, padding: '7px 0',
      borderBottom: idx > 0 ? '1px solid #f5f3fd' : undefined,
      fontSize: 12,
    }}>
      <span style={{ color: '#9e9ab8' }}>{q.earningsDate ? String(q.earningsDate).slice(0, 7) : '-'}</span>
      <span style={{ color: '#18162a', textAlign: 'right' }}>{fmt(q.epsEstimate)}</span>
      <span style={{ color: '#18162a', textAlign: 'right' }}>{fmt(q.epsActual)}</span>
      <span style={{ color: surpColor, textAlign: 'right', fontWeight: 600 }}>
        {q.surprisePct != null ? `${q.surprisePct > 0 ? '+' : ''}${fmt(q.surprisePct, 1)}%` : label}
      </span>
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 0' }}>
      <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #e0dbf5', borderTopColor: '#8b7fd4', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontSize: 13, color: '#9e9ab8' }}>불러오는 중...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ── 메인 컴포넌트 ────────────────────────────────────────────
export default function FundamentalPanel({ ticker }: Props) {
  const [fundamental, setFundamental] = useState<FundamentalData | null>(null)
  const [earnings, setEarnings]       = useState<EarningsHistory | null>(null)
  const [loading, setLoading]         = useState(true)
  const [expanded, setExpanded]       = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.allSettled([
      fundamentalApi.getFundamental(ticker),
      fundamentalApi.getEarnings(ticker),
    ]).then(([f, e]) => {
      if (f.status === 'fulfilled') setFundamental(f.value)
      if (e.status === 'fulfilled') setEarnings(e.value)
      setLoading(false)
    })
  }, [ticker])

  const days = daysUntil(fundamental?.nextEarningsDate ?? earnings?.nextEarningsDate)

  return (
    <div style={CARD}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#18162a', margin: 0 }}>📊 펀더멘털 분석</h3>
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: '#f0eefb', color: '#8b7fd4' }}>{ticker}</span>
          {fundamental?.sector && (
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: '#f5f3fd', color: '#a89fe0' }}>{fundamental.sector}</span>
          )}
        </div>
        <button onClick={() => setExpanded(p => !p)} style={{ fontSize: 12, color: '#c4c0d8', background: 'none', border: 'none', cursor: 'pointer' }}>
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {loading && <Spinner />}

      {!loading && !fundamental && (
        <p style={{ fontSize: 13, color: '#c4c0d8', padding: '12px 0' }}>
          데이터가 아직 없습니다. <code style={{ fontSize: 11, background: '#f5f3fd', padding: '2px 6px', borderRadius: 4 }}>fundamental_import.py</code> 실행 후 확인하세요.
        </p>
      )}

      {!loading && fundamental && expanded && (
        <>
          {/* 다음 실적발표 배너 */}
          {days != null && days >= 0 && (
            <div style={{ background: days <= 7 ? '#fefce8' : '#f5f3fd', borderRadius: 10, padding: '8px 12px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#9e9ab8' }}>📅 다음 실적발표</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: days <= 7 ? '#ca8a04' : '#8b7fd4' }}>
                {days === 0 ? '오늘!' : `${days}일 후`}
              </span>
            </div>
          )}

          {/* 밸류에이션 */}
          <p style={{ fontSize: 11, fontWeight: 700, color: '#c4c0d8', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px' }}>밸류에이션</p>
          <MetricRow label="P/E (Trailing)"  value={fmt(fundamental.trailingPe)} />
          <MetricRow label="P/E (Forward)"   value={fmt(fundamental.forwardPe)} />
          <MetricRow label="P/B"             value={fmt(fundamental.priceToBook)} />
          <MetricRow label="P/S"             value={fmt(fundamental.priceToSales)} />
          <MetricRow label="EV/EBITDA"       value={fmt(fundamental.evToEbitda)} />
          <MetricRow label="시가총액"         value={fmtCap(fundamental.marketCap)} />

          <div style={DIVIDER} />

          {/* 성장성 & 수익성 */}
          <p style={{ fontSize: 11, fontWeight: 700, color: '#c4c0d8', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px' }}>성장성 · 수익성</p>
          <MetricRow label="매출 성장률"     value={fmtPct(fundamental.revenueGrowth)}
            valueColor={fundamental.revenueGrowth != null ? (fundamental.revenueGrowth > 0 ? '#ef4444' : '#2563eb') : undefined} />
          <MetricRow label="영업이익률"      value={fmtPct(fundamental.operatingMargins)}
            valueColor={fundamental.operatingMargins != null ? (fundamental.operatingMargins > 0.15 ? '#ef4444' : '#9e9ab8') : undefined} />
          <MetricRow label="순이익률"        value={fmtPct(fundamental.profitMargins)}
            valueColor={fundamental.profitMargins != null ? (fundamental.profitMargins > 0.10 ? '#ef4444' : '#9e9ab8') : undefined} />
          <MetricRow label="EPS (TTM)"       value={`$${fmt(fundamental.trailingEps)}`} />
          <MetricRow label="EPS (Forward)"   value={`$${fmt(fundamental.forwardEps)}`} />

          {/* 어닝 히스토리 */}
          {earnings?.quarters && earnings.quarters.length > 0 && (
            <>
              <div style={DIVIDER} />
              <p style={{ fontSize: 11, fontWeight: 700, color: '#c4c0d8', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>어닝 서프라이즈</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, paddingBottom: 6, borderBottom: '1px solid #f0ecfb' }}>
                {['분기', '예상 EPS', '실제 EPS', '서프라이즈'].map(h => (
                  <span key={h} style={{ fontSize: 10, fontWeight: 600, color: '#c4c0d8', textAlign: h === '분기' ? 'left' : 'right' }}>{h}</span>
                ))}
              </div>
              {earnings.quarters.slice(0, 4).map((q, i) => <EarningsRow key={i} q={q} idx={i} />)}
            </>
          )}

          <p style={{ fontSize: 11, color: '#c4c0d8', marginTop: 12, paddingTop: 8, borderTop: '1px solid #f5f3fd' }}>
            ⚠️ 참고용 지표이며 투자 조언이 아닙니다. 출처: Yahoo Finance
          </p>
        </>
      )}
    </div>
  )
}
