'use client'

import { useEffect, useState } from 'react'
import { fundamentalApi } from '@/lib/api'
import { PeerComparison, FundamentalData } from '@/types'

interface Props {
  ticker: string
}

function formatPct(val: number | null): string {
  if (val === null) return '—'
  return `${(val * 100).toFixed(1)}%`
}

function formatNum(val: number | null, digits = 1): string {
  if (val === null) return '—'
  return val.toFixed(digits)
}

function CellValue({ value, sectorAvg, higherIsBetter = true }: {
  value: number | null
  sectorAvg: number | null
  higherIsBetter?: boolean
}) {
  const display = value !== null ? (value < 1 ? formatPct(value) : formatNum(value)) : '—'
  let color = 'text-gray-300'
  if (value !== null && sectorAvg !== null) {
    const better = higherIsBetter ? value > sectorAvg : value < sectorAvg
    color = better ? 'text-green-400' : 'text-red-400'
  }
  return <span className={`text-sm font-semibold ${color}`}>{display}</span>
}

export default function PeerComparisonTable({ ticker }: Props) {
  const [data, setData] = useState<PeerComparison | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ticker) return
    setLoading(true)
    setError(null)
    fundamentalApi.getPeers(ticker)
      .then(setData)
      .catch(() => setError('동종업계 데이터를 불러올 수 없습니다.'))
      .finally(() => setLoading(false))
  }, [ticker])

  if (loading) {
    return (
      <div className="rounded-xl p-5 animate-pulse" style={{ backgroundColor: '#1e1b35' }}>
        <div className="h-5 w-48 rounded bg-white/10 mb-4" />
        <div className="h-32 rounded bg-white/5" />
      </div>
    )
  }

  if (error || !data || (data.peers.length === 0 && !data.target)) {
    return (
      <div className="rounded-xl p-5 text-center" style={{ backgroundColor: '#1e1b35' }}>
        <p className="text-gray-500 text-sm">
          {error ?? '동종업계 비교 데이터가 아직 없습니다.'}
        </p>
      </div>
    )
  }

  const allTickers = [data.target, ...data.peers].filter(Boolean) as FundamentalData[]
  const { sectorAverage: avg } = data

  const metrics: { label: string; key: keyof FundamentalData; higherIsBetter: boolean; avgVal: number | null }[] = [
    { label: 'P/E',       key: 'trailingPe',       higherIsBetter: false, avgVal: avg.trailingPe },
    { label: 'P/B',       key: 'priceToBook',      higherIsBetter: false, avgVal: avg.priceToBook },
    { label: '매출성장률',  key: 'revenueGrowth',    higherIsBetter: true,  avgVal: avg.revenueGrowth },
    { label: '영업이익률',  key: 'operatingMargins', higherIsBetter: true,  avgVal: avg.operatingMargins },
    { label: '순이익률',    key: 'profitMargins',    higherIsBetter: true,  avgVal: avg.profitMargins },
  ]

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: '#1e1b35' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white text-base">🏢 동종업계 비교</h3>
        {data.sector && (
          <span className="text-xs px-2 py-0.5 rounded-full text-purple-300 border border-purple-500/30">
            {data.sector}
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left text-xs text-gray-500 pb-2 pr-4 font-medium">지표</th>
              {allTickers.map(t => (
                <th key={t.ticker}
                    className={`text-center text-xs pb-2 px-3 font-semibold ${
                      t.ticker === ticker.toUpperCase() ? 'text-purple-400' : 'text-gray-400'
                    }`}>
                  {t.ticker}
                  {t.ticker === ticker.toUpperCase() && (
                    <span className="ml-1 text-purple-500">●</span>
                  )}
                </th>
              ))}
              <th className="text-center text-xs text-gray-500 pb-2 px-3 font-medium">섹터 평균</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map(metric => (
              <tr key={metric.label} className="border-t border-white/5">
                <td className="py-2.5 pr-4 text-gray-400 text-xs">{metric.label}</td>
                {allTickers.map(t => (
                  <td key={t.ticker} className="py-2.5 px-3 text-center">
                    <CellValue
                      value={t[metric.key] as number | null}
                      sectorAvg={metric.avgVal}
                      higherIsBetter={metric.higherIsBetter}
                    />
                  </td>
                ))}
                <td className="py-2.5 px-3 text-center">
                  <span className="text-xs text-gray-500">
                    {metric.avgVal !== null
                      ? (metric.avgVal < 1 ? formatPct(metric.avgVal) : formatNum(metric.avgVal))
                      : '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-600 mt-3">
        * 색상: <span className="text-green-400">초록</span> = 섹터 대비 유리, <span className="text-red-400">빨강</span> = 불리
      </p>
    </div>
  )
}
