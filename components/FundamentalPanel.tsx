'use client'

import { useEffect, useState } from 'react'
import { fundamentalApi } from '@/lib/api'
import { FundamentalData, EarningsHistory } from '@/types'

interface Props {
  ticker: string
}

function formatPct(val: number | null): string {
  if (val === null) return 'N/A'
  return `${(val * 100).toFixed(1)}%`
}

function formatNum(val: number | null, digits = 2): string {
  if (val === null) return 'N/A'
  return val.toFixed(digits)
}

function formatMarketCap(val: number | null): string {
  if (val === null) return 'N/A'
  if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`
  if (val >= 1e9)  return `$${(val / 1e9).toFixed(1)}B`
  if (val >= 1e6)  return `$${(val / 1e6).toFixed(1)}M`
  return `$${val.toLocaleString()}`
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

interface MetricRowProps {
  label: string
  value: string
  sectorAvg?: string
  higherIsBetter?: boolean  // true = green when value > avg, false = green when value < avg
  actualVal?: number | null
  avgVal?: number | null
}

function MetricRow({ label, value, sectorAvg, higherIsBetter = true, actualVal, avgVal }: MetricRowProps) {
  let valueColor = 'text-gray-200'
  if (actualVal !== null && actualVal !== undefined && avgVal !== null && avgVal !== undefined) {
    const better = higherIsBetter ? actualVal > avgVal : actualVal < avgVal
    valueColor = better ? 'text-green-400' : 'text-red-400'
  }
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-sm text-gray-400">{label}</span>
      <div className="flex items-center gap-3">
        {sectorAvg && (
          <span className="text-xs text-gray-500">섹터 {sectorAvg}</span>
        )}
        <span className={`text-sm font-semibold ${valueColor}`}>{value}</span>
      </div>
    </div>
  )
}

export default function FundamentalPanel({ ticker }: Props) {
  const [fundamental, setFundamental] = useState<FundamentalData | null>(null)
  const [earnings, setEarnings] = useState<EarningsHistory | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ticker) return
    setLoading(true)
    setError(null)

    Promise.allSettled([
      fundamentalApi.getFundamental(ticker),
      fundamentalApi.getEarnings(ticker),
    ]).then(([fundResult, earningsResult]) => {
      if (fundResult.status === 'fulfilled') setFundamental(fundResult.value)
      if (earningsResult.status === 'fulfilled') setEarnings(earningsResult.value)
      if (fundResult.status === 'rejected' && earningsResult.status === 'rejected') {
        setError('펀더멘털 데이터를 불러올 수 없습니다.')
      }
    }).finally(() => setLoading(false))
  }, [ticker])

  if (loading) {
    return (
      <div className="rounded-xl p-5 animate-pulse" style={{ backgroundColor: '#1e1b35' }}>
        <div className="h-5 w-40 rounded bg-white/10 mb-4" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-4 rounded bg-white/5 mb-3" />
        ))}
      </div>
    )
  }

  if (error || !fundamental) {
    return (
      <div className="rounded-xl p-5 text-center" style={{ backgroundColor: '#1e1b35' }}>
        <p className="text-gray-500 text-sm">
          {error ?? '펀더멘털 데이터가 아직 없습니다. 스케줄러 실행 후 확인해주세요.'}
        </p>
      </div>
    )
  }

  const daysToEarnings = daysUntil(fundamental.nextEarningsDate)

  return (
    <div className="rounded-xl p-5 space-y-5" style={{ backgroundColor: '#1e1b35' }}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white text-base">📊 펀더멘털 분석</h3>
        <div className="flex items-center gap-2">
          {fundamental.sector && (
            <span className="text-xs px-2 py-0.5 rounded-full text-purple-300 border border-purple-500/30">
              {fundamental.sector}
            </span>
          )}
          <span className="text-xs text-gray-500">{fundamental.industry}</span>
        </div>
      </div>

      {/* 다음 실적 발표일 */}
      {fundamental.nextEarningsDate && (
        <div className="rounded-lg px-4 py-2 flex items-center justify-between"
             style={{ backgroundColor: '#2a2550' }}>
          <span className="text-sm text-gray-300">📅 다음 실적 발표</span>
          <div className="text-right">
            <span className="text-sm font-semibold text-yellow-400">
              {fundamental.nextEarningsDate}
            </span>
            {daysToEarnings !== null && daysToEarnings > 0 && (
              <span className="text-xs text-gray-400 ml-2">({daysToEarnings}일 후)</span>
            )}
          </div>
        </div>
      )}

      {/* 밸류에이션 지표 */}
      <div>
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">밸류에이션</p>
        <div className="rounded-lg px-4 py-1" style={{ backgroundColor: '#13112a' }}>
          <MetricRow
            label="P/E (Trailing)"
            value={formatNum(fundamental.trailingPe)}
            higherIsBetter={false}
            actualVal={fundamental.trailingPe}
            avgVal={null}
          />
          <MetricRow
            label="P/E (Forward)"
            value={formatNum(fundamental.forwardPe)}
            higherIsBetter={false}
          />
          <MetricRow label="P/B" value={formatNum(fundamental.priceToBook)} higherIsBetter={false} />
          <MetricRow label="P/S" value={formatNum(fundamental.priceToSales)} higherIsBetter={false} />
          <MetricRow label="EV/EBITDA" value={formatNum(fundamental.evToEbitda)} higherIsBetter={false} />
          <MetricRow label="시가총액" value={formatMarketCap(fundamental.marketCap)} />
        </div>
      </div>

      {/* 성장성 & 수익성 */}
      <div>
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">성장성 · 수익성</p>
        <div className="rounded-lg px-4 py-1" style={{ backgroundColor: '#13112a' }}>
          <MetricRow label="매출 성장률 (YoY)" value={formatPct(fundamental.revenueGrowth)} higherIsBetter={true} actualVal={fundamental.revenueGrowth} avgVal={0} />
          <MetricRow label="EPS 성장률 (YoY)" value={formatPct(fundamental.earningsGrowth)} higherIsBetter={true} actualVal={fundamental.earningsGrowth} avgVal={0} />
          <MetricRow label="영업이익률" value={formatPct(fundamental.operatingMargins)} higherIsBetter={true} actualVal={fundamental.operatingMargins} avgVal={0} />
          <MetricRow label="순이익률" value={formatPct(fundamental.profitMargins)} higherIsBetter={true} actualVal={fundamental.profitMargins} avgVal={0} />
          <MetricRow label="EPS (TTM)" value={formatNum(fundamental.trailingEps)} />
          <MetricRow label="EPS (Forward)" value={formatNum(fundamental.forwardEps)} />
        </div>
      </div>

      {/* 분기별 실적 (어닝 서프라이즈) */}
      {earnings && earnings.quarters.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">분기별 실적 (EPS)</p>
          <div className="space-y-2">
            {earnings.quarters.slice(0, 4).map((q) => (
              <div key={q.earningsDate}
                   className="rounded-lg px-4 py-2.5 flex items-center justify-between"
                   style={{ backgroundColor: '#13112a' }}>
                <div>
                  <p className="text-xs text-gray-400">{q.earningsDate}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">예상 {q.epsEstimate !== null ? q.epsEstimate.toFixed(2) : 'N/A'}</span>
                    <span className="text-gray-600">→</span>
                    <span className="text-sm font-bold text-white">
                      실제 {q.epsActual !== null ? q.epsActual.toFixed(2) : 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  {q.beat !== null && (
                    <span className={`text-lg ${q.beat ? 'text-green-400' : 'text-red-400'}`}>
                      {q.beat ? '✅' : '❌'}
                    </span>
                  )}
                  {q.surprisePct !== null && (
                    <p className={`text-xs font-semibold mt-0.5 ${q.surprisePct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {q.surprisePct >= 0 ? '+' : ''}{q.surprisePct.toFixed(1)}%
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
