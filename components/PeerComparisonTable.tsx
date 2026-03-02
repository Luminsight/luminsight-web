'use client'

import { useEffect, useState } from 'react'
import { fundamentalApi } from '@/lib/api'
import { PeerComparison, FundamentalData } from '@/types'

interface Props { ticker: string }

// ── 디자인 토큰 (기존 컴포넌트와 동일) ──────────────────────
const CARD: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: '20px',
  padding: '28px',
  boxShadow: '0 4px 24px rgba(139,127,212,0.10)',
}

// ── 유틸 ────────────────────────────────────────────────────
function formatPct(val: number | null | undefined): string {
  if (val == null) return '—'
  return `${(val * 100).toFixed(1)}%`
}
function formatNum(val: number | null | undefined, digits = 1): string {
  if (val == null) return '—'
  return val.toFixed(digits)
}
function autoFmt(val: number | null | undefined): string {
  if (val == null) return '—'
  return val < 1 ? formatPct(val) : formatNum(val)
}

// ── 서브 컴포넌트 ────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 0' }}>
      <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #e0dbf5', borderTopColor: '#8b7fd4', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontSize: 13, color: '#9e9ab8' }}>불러오는 중...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function CellValue({
  value, sectorAvg, higherIsBetter = true, isSelf = false,
}: {
  value: number | null | undefined
  sectorAvg: number | null | undefined
  higherIsBetter?: boolean
  isSelf?: boolean
}) {
  const display = autoFmt(value)
  let color = '#18162a'
  if (value != null && sectorAvg != null) {
    const better = higherIsBetter ? value > sectorAvg : value < sectorAvg
    color = better ? '#16a34a' : '#ef4444'
  }
  return (
    <span style={{
      fontSize: 12, fontWeight: isSelf ? 700 : 500,
      color,
      background: isSelf ? '#f5f3fd' : 'transparent',
      borderRadius: 6, padding: isSelf ? '2px 6px' : undefined,
    }}>
      {display}
    </span>
  )
}

export default function PeerComparisonTable({ ticker }: Props) {
  const [data, setData]       = useState<PeerComparison | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    if (!ticker) return
    setLoading(true)
    setError(null)
    fundamentalApi.getPeers(ticker)
      .then(setData)
      .catch(() => setError('동종업계 데이터를 불러올 수 없습니다.'))
      .finally(() => setLoading(false))
  }, [ticker])

  return (
    <div style={CARD}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#18162a', margin: 0 }}>🏢 동종업계 비교</h3>
        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: '#f0eefb', color: '#8b7fd4' }}>{ticker}</span>
        {data?.sector && (
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: '#f5f3fd', color: '#a89fe0' }}>{data.sector}</span>
        )}
      </div>

      {loading && <Spinner />}

      {!loading && (error || !data || (data.peers.length === 0 && !data.target)) && (
        <p style={{ fontSize: 13, color: '#c4c0d8', padding: '12px 0' }}>
          {error ?? '동종업계 비교 데이터가 아직 없습니다.'}
        </p>
      )}

      {!loading && data && (data.target || data.peers.length > 0) && (() => {
        const allTickers = [data.target, ...data.peers].filter(Boolean) as FundamentalData[]
        const avg = data.sectorAverage

        const metrics: {
          label: string
          key: keyof FundamentalData
          higherIsBetter: boolean
          avgVal: number | null | undefined
        }[] = [
          { label: 'P/E',    key: 'trailingPe',       higherIsBetter: false, avgVal: avg.trailingPe },
          { label: 'P/B',    key: 'priceToBook',      higherIsBetter: false, avgVal: avg.priceToBook },
          { label: '매출성장률', key: 'revenueGrowth',    higherIsBetter: true,  avgVal: avg.revenueGrowth },
          { label: '영업이익률', key: 'operatingMargins', higherIsBetter: true,  avgVal: avg.operatingMargins },
          { label: '순이익률',   key: 'profitMargins',    higherIsBetter: true,  avgVal: avg.profitMargins },
        ]

        return (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#c4c0d8', paddingBottom: 8, paddingRight: 12 }}>지표</th>
                  {allTickers.map(t => (
                    <th key={t.ticker} style={{
                      textAlign: 'center', fontSize: 11, paddingBottom: 8, paddingLeft: 10, paddingRight: 10,
                      fontWeight: 700,
                      color: t.ticker === ticker.toUpperCase() ? '#8b7fd4' : '#9e9ab8',
                    }}>
                      {t.ticker}
                      {t.ticker === ticker.toUpperCase() && (
                        <span style={{ marginLeft: 3, fontSize: 8, color: '#8b7fd4' }}>●</span>
                      )}
                    </th>
                  ))}
                  <th style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: '#c4c0d8', paddingBottom: 8, paddingLeft: 10, paddingRight: 10 }}>섹터 평균</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((metric, mi) => (
                  <tr key={metric.label} style={{ borderTop: '1px solid #f5f3fd' }}>
                    <td style={{ padding: '9px 12px 9px 0', fontSize: 12, color: '#9e9ab8' }}>{metric.label}</td>
                    {allTickers.map(t => (
                      <td key={t.ticker} style={{ padding: '9px 10px', textAlign: 'center' }}>
                        <CellValue
                          value={t[metric.key] as number | null}
                          sectorAvg={metric.avgVal}
                          higherIsBetter={metric.higherIsBetter}
                          isSelf={t.ticker === ticker.toUpperCase()}
                        />
                      </td>
                    ))}
                    <td style={{ padding: '9px 10px', textAlign: 'center', fontSize: 12, color: '#c4c0d8' }}>
                      {autoFmt(metric.avgVal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p style={{ fontSize: 11, color: '#c4c0d8', marginTop: 12, paddingTop: 8, borderTop: '1px solid #f5f3fd' }}>
              * <span style={{ color: '#16a34a', fontWeight: 600 }}>초록</span> = 섹터 대비 유리&nbsp;&nbsp;
              <span style={{ color: '#ef4444', fontWeight: 600 }}>빨강</span> = 불리&nbsp;&nbsp;
              선택 종목은 <span style={{ background: '#f5f3fd', padding: '1px 5px', borderRadius: 4, color: '#8b7fd4', fontWeight: 700 }}>강조</span> 표시
            </p>
          </div>
        )
      })()}
    </div>
  )
}
