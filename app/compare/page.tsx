'use client'

import { useState, useEffect } from 'react'
import { newsApi, technicalApi } from '@/lib/api'
import type { NewsSummary, SignalScoreResult } from '@/types'

const CARD: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: '20px',
  padding: '24px',
  boxShadow: '0 2px 12px rgba(139,127,212,0.09)',
}

const sentimentBadgeColor = (sentiment: string | undefined) => {
  if (!sentiment) return { bg: '#f5f4fa', text: '#9e9ab8' }
  if (sentiment === 'POSITIVE') return { bg: '#dcfce7', text: '#16a34a' }
  if (sentiment === 'NEGATIVE') return { bg: '#fee2e2', text: '#ef4444' }
  return { bg: '#f3e8ff', text: '#8b7fd4' }
}

const scoreColor = (s: number) =>
  s >= 75 ? '#16a34a' : s >= 60 ? '#22c55e' : s >= 40 ? '#8b7fd4' : s >= 25 ? '#f97316' : '#ef4444'

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

function IndicatorCard({ label, value, unit = '' }: { label: string; value: string | number; unit?: string }) {
  return (
    <div style={CARD} className="text-center">
      <p style={{ color: '#9e9ab8', fontSize: 12, marginBottom: 8 }}>{label}</p>
      <p style={{ color: '#18162a', fontSize: 18, fontWeight: 700 }}>
        {value}{unit}
      </p>
    </div>
  )
}

function TickerCard({
  ticker,
  summary,
  signalScore,
  loading,
  error,
  isWinner,
}: {
  ticker: string
  summary: NewsSummary | null
  signalScore: SignalScoreResult | null
  loading: boolean
  error: string | null
  isWinner: boolean
}) {
  const sentimentColor = sentimentBadgeColor(summary?.overallSentiment)

  return (
    <div
      style={{
        ...CARD,
        border: isWinner ? '2px solid #8b7fd4' : '2px solid transparent',
        boxShadow: isWinner
          ? '0 4px 24px rgba(139,127,212,0.2)'
          : '0 2px 12px rgba(139,127,212,0.09)',
      }}
      className="relative"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-6" style={{ borderBottom: '1px solid #f0eefb' }}>
        <h2 style={{ color: '#18162a', fontSize: 20, fontWeight: 700 }}>{ticker}</h2>
        {summary && (
          <span
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              background: sentimentColor.bg,
              color: sentimentColor.text,
            }}
          >
            {summary.overallSentiment === 'POSITIVE' && '긍정'}
            {summary.overallSentiment === 'NEGATIVE' && '부정'}
            {summary.overallSentiment === 'NEUTRAL' && '중립'}
          </span>
        )}
      </div>

      {error && (
        <div
          className="p-4 rounded-lg mb-6 text-sm"
          style={{ background: '#fee2e2', color: '#991b1b' }}
        >
          {error}
        </div>
      )}

      {loading && !summary && !signalScore ? (
        <div className="space-y-4">
          <div className="h-20 rounded-lg animate-pulse" style={{ background: '#f5f4fa' }} />
          <div className="h-12 rounded-lg animate-pulse" style={{ background: '#f5f4fa' }} />
          <div className="h-12 rounded-lg animate-pulse" style={{ background: '#f5f4fa' }} />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 rounded-lg animate-pulse" style={{ background: '#f5f4fa' }} />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Signal Score */}
          {signalScore && (
            <div className="mb-8 pb-8 text-center" style={{ borderBottom: '1px solid #f0eefb' }}>
              <p style={{ color: '#9e9ab8', fontSize: 12, marginBottom: 12 }}>종합 시그널 스코어</p>
              <div className="flex justify-center mb-4">
                <ScoreGauge score={signalScore.score} />
              </div>
              <p style={{ color: '#18162a', fontSize: 12, fontWeight: 600 }}>
                {signalScore.label} {signalScore.emoji}
              </p>
            </div>
          )}

          {/* Sentiment Distribution */}
          {summary && (
            <div className="mb-8 pb-8" style={{ borderBottom: '1px solid #f0eefb' }}>
              <p style={{ color: '#9e9ab8', fontSize: 12, marginBottom: 12 }}>감성 분포</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: '#18162a', fontWeight: 500 }}>긍정</span>
                  <span style={{ color: '#16a34a', fontWeight: 700 }}>{summary.positiveCount}건</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: '#f0eefb' }}>
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      background: '#16a34a',
                      width: `${
                        summary.positiveCount +
                        summary.negativeCount +
                        summary.neutralCount >
                        0
                          ? (summary.positiveCount /
                              (summary.positiveCount +
                                summary.negativeCount +
                                summary.neutralCount)) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-sm mt-4">
                  <span style={{ color: '#18162a', fontWeight: 500 }}>부정</span>
                  <span style={{ color: '#ef4444', fontWeight: 700 }}>{summary.negativeCount}건</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: '#f0eefb' }}>
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      background: '#ef4444',
                      width: `${
                        summary.positiveCount +
                        summary.negativeCount +
                        summary.neutralCount >
                        0
                          ? (summary.negativeCount /
                              (summary.positiveCount +
                                summary.negativeCount +
                                summary.neutralCount)) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-sm mt-4">
                  <span style={{ color: '#18162a', fontWeight: 500 }}>중립</span>
                  <span style={{ color: '#8b7fd4', fontWeight: 700 }}>{summary.neutralCount}건</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: '#f0eefb' }}>
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      background: '#8b7fd4',
                      width: `${
                        summary.positiveCount +
                        summary.negativeCount +
                        summary.neutralCount >
                        0
                          ? (summary.neutralCount /
                              (summary.positiveCount +
                                summary.negativeCount +
                                summary.neutralCount)) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* AI Briefing */}
          {summary && (
            <div className="mb-8 pb-8" style={{ borderBottom: '1px solid #f0eefb' }}>
              <p style={{ color: '#9e9ab8', fontSize: 12, marginBottom: 12 }}>AI 브리핑</p>
              <p
                style={{
                  color: '#18162a',
                  fontSize: 13,
                  lineHeight: 1.6,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {summary.summary}
              </p>
            </div>
          )}

          {/* Technical Indicators */}
          {signalScore && (
            <div>
              <p style={{ color: '#9e9ab8', fontSize: 12, marginBottom: 12 }}>기술 지표</p>
              <div className="grid grid-cols-2 gap-3">
                <IndicatorCard
                  label="RSI"
                  value={signalScore.rsi.rawScore.toFixed(2)}
                  unit=""
                />
                <IndicatorCard
                  label="MACD"
                  value={signalScore.macd.rawScore.toFixed(3)}
                  unit=""
                />
                <IndicatorCard
                  label="Bollinger Band"
                  value={signalScore.bollingerBand.rawScore.toFixed(2)}
                  unit=""
                />
                <IndicatorCard
                  label="Moving Average"
                  value={signalScore.movingAverage.rawScore.toFixed(2)}
                  unit=""
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function ComparePage() {
  const [tickerA, setTickerA] = useState('AAPL')
  const [tickerB, setTickerB] = useState('TSLA')

  const [summaryA, setSummaryA] = useState<NewsSummary | null>(null)
  const [summaryB, setSummaryB] = useState<NewsSummary | null>(null)

  const [scoreA, setScoreA] = useState<SignalScoreResult | null>(null)
  const [scoreB, setScoreB] = useState<SignalScoreResult | null>(null)

  const [loadingA, setLoadingA] = useState(false)
  const [loadingB, setLoadingB] = useState(false)

  const [errorA, setErrorA] = useState<string | null>(null)
  const [errorB, setErrorB] = useState<string | null>(null)

  const [searched, setSearched] = useState(false)

  const fetchData = async () => {
    if (!tickerA.trim() || !tickerB.trim()) return

    setLoadingA(true)
    setLoadingB(true)
    setErrorA(null)
    setErrorB(null)
    setSummaryA(null)
    setSummaryB(null)
    setScoreA(null)
    setScoreB(null)
    setSearched(true)

    const tickerAUpper = tickerA.toUpperCase()
    const tickerBUpper = tickerB.toUpperCase()

    // Fetch both in parallel
    Promise.all([
      (async () => {
        try {
          const [summary, score] = await Promise.all([
            newsApi.getSummary(tickerAUpper),
            technicalApi.getSignalScore(tickerAUpper),
          ])
          setSummaryA(summary)
          setScoreA(score)
        } catch (err) {
          setErrorA(
            err instanceof Error ? err.message : `${tickerAUpper} 데이터를 불러올 수 없습니다.`
          )
        } finally {
          setLoadingA(false)
        }
      })(),
      (async () => {
        try {
          const [summary, score] = await Promise.all([
            newsApi.getSummary(tickerBUpper),
            technicalApi.getSignalScore(tickerBUpper),
          ])
          setSummaryB(summary)
          setScoreB(score)
        } catch (err) {
          setErrorB(
            err instanceof Error ? err.message : `${tickerBUpper} 데이터를 불러올 수 없습니다.`
          )
        } finally {
          setLoadingB(false)
        }
      })(),
    ])
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchData()
  }

  // Determine winner
  const scoreAValue = scoreA?.score ?? -1
  const scoreBValue = scoreB?.score ?? -1
  const isAWinner = scoreAValue > scoreBValue && scoreAValue >= 0
  const isBWinner = scoreBValue > scoreAValue && scoreBValue >= 0

  return (
    <div style={{ background: '#f5f4fa', minHeight: '100vh', paddingTop: '24px', paddingBottom: '24px' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 style={{ color: '#18162a', fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 700, marginBottom: 8 }}>
            📊 종목 비교
          </h1>
          <p style={{ color: '#9e9ab8', fontSize: 14 }} className="hidden sm:block">
            두 종목의 시그널 스코어, 감성 분석, 기술 지표를 한눈에 비교하세요.
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label style={{ color: '#18162a', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                첫 번째 종목
              </label>
              <input
                type="text"
                value={tickerA}
                onChange={e => setTickerA(e.target.value)}
                placeholder="예: AAPL"
                className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-all uppercase"
                style={{
                  borderColor: '#e0dbf5',
                  color: '#18162a',
                  background: '#ffffff',
                }}
                onFocus={e => (e.target.style.borderColor = '#8b7fd4')}
                onBlur={e => (e.target.style.borderColor = '#e0dbf5')}
              />
            </div>

            <div>
              <label style={{ color: '#18162a', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                두 번째 종목
              </label>
              <input
                type="text"
                value={tickerB}
                onChange={e => setTickerB(e.target.value)}
                placeholder="예: TSLA"
                className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-all uppercase"
                style={{
                  borderColor: '#e0dbf5',
                  color: '#18162a',
                  background: '#ffffff',
                }}
                onFocus={e => (e.target.style.borderColor = '#8b7fd4')}
                onBlur={e => (e.target.style.borderColor = '#e0dbf5')}
              />
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-150 hover:opacity-90"
              style={{
                background: '#8b7fd4',
                color: '#ffffff',
              }}
            >
              🔍 비교 시작
            </button>
          </div>
        </form>

        {/* Comparison Grid */}
        {searched && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TickerCard
              ticker={tickerA}
              summary={summaryA}
              signalScore={scoreA}
              loading={loadingA}
              error={errorA}
              isWinner={isAWinner}
            />
            <TickerCard
              ticker={tickerB}
              summary={summaryB}
              signalScore={scoreB}
              loading={loadingB}
              error={errorB}
              isWinner={isBWinner}
            />
          </div>
        )}

        {/* Initial Message */}
        {!searched && (
          <div
            className="text-center py-16"
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              border: '1px dashed #e0dbf5',
            }}
          >
            <p style={{ color: '#9e9ab8', fontSize: 16, marginBottom: 8 }}>
              비교를 시작하려면 두 종목을 입력하고 「비교 시작」을 눌러주세요.
            </p>
            <p style={{ color: '#c4c0d8', fontSize: 12 }}>
              기본값: AAPL vs TSLA
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
