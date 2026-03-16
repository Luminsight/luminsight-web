'use client'

import React, { useState } from 'react'

// ─────────────────────────────────────────────
// 점수 → 강도 레이블 (한글)
// -1.0 ~ +1.0 범위 기준
// ─────────────────────────────────────────────
export function scoreToLabel(score: number): string {
  if (score >= 0.6)  return '강한 긍정'
  if (score >= 0.3)  return '긍정'
  if (score >= 0.1)  return '약한 긍정'
  if (score > -0.1)  return '중립'
  if (score > -0.3)  return '약한 부정'
  if (score > -0.6)  return '부정'
  return '강한 부정'
}

// 점수 → 색상
export function scoreToColor(score: number): string {
  if (score >= 0.3)  return '#ef4444'  // 긍정 — 빨강
  if (score <= -0.3) return '#2563eb'  // 부정 — 파랑
  return '#8b7fd4'                     // 중립 — 보라
}

// 점수 → 배경색 (연한)
export function scoreToBackground(score: number): string {
  if (score >= 0.3)  return '#fff1f1'
  if (score <= -0.3) return '#eff6ff'
  return '#f5f4fa'
}

// ─────────────────────────────────────────────
// 양방향 게이지바 컴포넌트
// score: -1.0 ~ +1.0
// ─────────────────────────────────────────────
interface SentimentGaugeProps {
  score: number
  label?: string | null           // POSITIVE | NEGATIVE | NEUTRAL (없으면 score로 자동 계산)
  newsCount?: number              // 분석된 뉴스 건수 (신뢰도 맥락)
  size?: 'xs' | 'sm' | 'md'      // 크기 variant
  showScore?: boolean             // 숫자 표시 여부
  showNewsCount?: boolean         // 뉴스 건수 표시 여부
  showTooltip?: boolean           // 범위 설명 툴팁 여부
  className?: string
}

export default function SentimentGauge({
  score,
  label,
  newsCount,
  size = 'sm',
  showScore = true,
  showNewsCount = true,
  showTooltip = true,
  className = '',
}: SentimentGaugeProps) {
  const [tooltipOpen, setTooltipOpen] = useState(false)

  const color      = scoreToColor(score)
  const background = scoreToBackground(score)
  const textLabel  = scoreToLabel(score)

  // 게이지 너비: 절댓값 × 100% (최대 100%)
  const fillPct = Math.min(Math.abs(score) * 100, 100)
  // 음수면 왼쪽, 양수면 오른쪽에서 채움
  const fillDir = score < 0 ? 'right' : 'left'

  // 신뢰도 힌트: 뉴스 건수 기반
  function reliabilityHint(n: number): string {
    if (n >= 20) return '높음'
    if (n >= 10) return '보통'
    if (n >= 3)  return '낮음'
    return '매우 낮음'
  }

  // 크기별 스타일
  const barHeight = size === 'xs' ? 3 : size === 'md' ? 6 : 4
  const textSizeLabel = size === 'xs' ? '10px' : size === 'md' ? '13px' : '11px'
  const textSizeScore = size === 'xs' ? '10px' : size === 'md' ? '12px' : '11px'

  return (
    <div className={`relative ${className}`} style={{ userSelect: 'none' }}>
      {/* 레이블 행 */}
      <div className="flex items-center justify-between gap-1 mb-1">
        {/* 강도 레이블 */}
        <span
          className="font-semibold"
          style={{ fontSize: textSizeLabel, color }}
        >
          {textLabel}
        </span>

        <div className="flex items-center gap-1.5">
          {/* 점수 숫자 */}
          {showScore && (
            <span style={{ fontSize: textSizeScore, color, fontWeight: 600 }}>
              {score > 0 ? '+' : ''}{score.toFixed(2)}
            </span>
          )}

          {/* 뉴스 건수 배지 */}
          {showNewsCount && newsCount != null && (
            <span
              className="px-1.5 py-0.5 rounded-full"
              style={{
                fontSize: '10px',
                background: '#f3f1fa',
                color: '#9e9ab8',
                fontWeight: 500,
                whiteSpace: 'nowrap',
              }}
              title={`${newsCount}건 분석 기준 — 신뢰도 ${reliabilityHint(newsCount)}`}
            >
              뉴스 {newsCount}건
            </span>
          )}

          {/* 툴팁 아이콘 */}
          {showTooltip && (
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setTooltipOpen(true)}
                onMouseLeave={() => setTooltipOpen(false)}
                onTouchStart={() => setTooltipOpen(v => !v)}
                style={{
                  width: 14, height: 14,
                  borderRadius: '50%',
                  background: '#ece9f5',
                  color: '#9e9ab8',
                  fontSize: '9px',
                  fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: 'none', cursor: 'pointer', flexShrink: 0,
                }}
                aria-label="감성지수 설명"
              >
                ?
              </button>

              {tooltipOpen && (
                <div
                  className="absolute z-50 right-0 bottom-5"
                  style={{
                    width: 200,
                    background: '#18162a',
                    color: '#e8e5f5',
                    borderRadius: 10,
                    padding: '10px 12px',
                    fontSize: '11px',
                    lineHeight: 1.6,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    pointerEvents: 'none',
                  }}
                >
                  <p className="font-semibold mb-1" style={{ color: '#c4b9f5' }}>감성지수 범위 안내</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px' }}>
                    {[
                      { range: '+0.6 이상', label: '강한 긍정', color: '#ef4444' },
                      { range: '+0.3 ~ +0.6', label: '긍정', color: '#ef4444' },
                      { range: '+0.1 ~ +0.3', label: '약한 긍정', color: '#f87171' },
                      { range: '-0.1 ~ +0.1', label: '중립', color: '#8b7fd4' },
                      { range: '-0.3 ~ -0.1', label: '약한 부정', color: '#60a5fa' },
                      { range: '-0.6 ~ -0.3', label: '부정', color: '#2563eb' },
                      { range: '-0.6 이하', label: '강한 부정', color: '#2563eb' },
                    ].map(({ range, label: l, color: c }) => (
                      <React.Fragment key={range}>
                        <span style={{ color: '#9e9ab8' }}>{range}</span>
                        <span style={{ color: c, fontWeight: 600 }}>{l}</span>
                      </React.Fragment>
                    ))}
                  </div>
                  {newsCount != null && (
                    <p className="mt-1.5 pt-1.5" style={{ borderTop: '1px solid #2d2a45', color: '#9e9ab8' }}>
                      신뢰도: {reliabilityHint(newsCount)} ({newsCount}건 분석)
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 양방향 게이지 바 */}
      <div
        style={{
          height: barHeight,
          background: '#f3f1fa',
          borderRadius: barHeight,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* 중앙 기준선 */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            width: 1,
            height: '100%',
            background: '#ddd9f0',
            transform: 'translateX(-50%)',
            zIndex: 1,
          }}
        />
        {/* 채움 바 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            height: '100%',
            width: `${fillPct / 2}%`,         // 최대 50% (전체 바의 절반)
            [fillDir]: '50%',                  // 중앙에서 시작해 방향으로 채움
            background: color,
            borderRadius: barHeight,
            transition: 'width 0.5s ease',
          }}
        />
      </div>

      {/* 양 끝 레이블 (md 사이즈만) */}
      {size === 'md' && (
        <div className="flex justify-between mt-0.5" style={{ fontSize: '10px', color: '#c4c0d8' }}>
          <span>강한 부정</span>
          <span>중립</span>
          <span>강한 긍정</span>
        </div>
      )}
    </div>
  )
}
