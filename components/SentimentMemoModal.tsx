'use client'

/**
 * SentimentMemoModal
 *
 * 종목 상세 페이지의 "이 시점 메모" 버튼에서 열리는 경량 투자 메모 모달.
 * ticker + 현재 감성 점수가 자동으로 스냅샷되며, 사용자는 메모 한 줄과
 * 선택적으로 매수/매도 정보만 입력하면 됩니다.
 *
 * 토론 결론:
 * - "일지"라는 무거운 프레임 대신 차트 옆에서 즉시 기록
 * - 감성 점수가 자동 캡처되어 나중에 "그때 왜 샀는지" 복기 가능
 */

import { useState } from 'react'
import { journalApi, sentimentApi } from '@/lib/api'
import type { CreateJournalRequest, TradeType, SentimentLabel } from '@/types'

interface Props {
  ticker: string
  /** 현재 감성 점수 (-1~1), 없으면 null */
  sentimentScore: number | null
  sentimentLabel: SentimentLabel | null
  onClose: () => void
  onSaved: () => void
}

const TRADE_COLOR: Record<TradeType, { bg: string; light: string }> = {
  BUY:  { bg: '#22c55e', light: '#f0fdf4' },
  SELL: { bg: '#f43f5e', light: '#fff1f3' },
}

function sentimentColor(score: number | null): string {
  if (score === null) return '#9e9ab8'
  if (score >= 0.2)  return '#f43f5e'   // 긍정 (한국 빨강)
  if (score <= -0.2) return '#3b82f6'   // 부정 (파랑)
  return '#8b7fd4'                       // 중립
}

function sentimentEmoji(label: SentimentLabel | null): string {
  if (label === 'POSITIVE') return '🔴'
  if (label === 'NEGATIVE') return '🔵'
  return '⚪'
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function SentimentMemoModal({ ticker, sentimentScore, sentimentLabel, onClose, onSaved }: Props) {
  const [memo, setMemo]             = useState('')
  const [tradeType, setTradeType]   = useState<TradeType>('BUY')
  const [price, setPrice]           = useState('')
  const [quantity, setQuantity]     = useState('')
  const [showTrade, setShowTrade]   = useState(false)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState<string | null>(null)

  async function handleSave() {
    if (!memo.trim()) return setError('메모를 입력해주세요.')
    setError(null)
    setSaving(true)

    try {
      const req: CreateJournalRequest = {
        ticker,
        tradeType,
        tradeDate: today(),
        price:    showTrade && price    ? parseFloat(price)    : 0,
        quantity: showTrade && quantity ? parseFloat(quantity) : 0,
        memo: memo.trim(),
        sentimentScore: sentimentScore ?? undefined,
        sentimentLabel: sentimentLabel ?? undefined,
      }
      await journalApi.createJournal(req)
      onSaved()
    } catch {
      setError('저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSaving(false)
    }
  }

  const scoreColor = sentimentColor(sentimentScore)
  const inputStyle: React.CSSProperties = {
    background: '#f8f7fd', border: '1.5px solid #ece9f5',
    color: '#18162a', borderRadius: 12, padding: '10px 14px',
    fontSize: 14, outline: 'none', width: '100%',
  }

  return (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center z-50"
      style={{ background: 'rgba(24,22,42,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden"
        style={{ background: '#fff', boxShadow: '0 -8px 40px rgba(139,127,212,0.2)', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 상단 핸들 (모바일) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: '#e0ddf5' }} />
        </div>

        <div style={{ padding: '20px 24px 28px' }}>
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #8b7fd4, #6a5fc4)' }}
              >
                {ticker.slice(0, 2)}
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: '#18162a' }}>{ticker}</p>
                <p className="text-xs" style={{ color: '#9e9ab8' }}>이 시점 메모</p>
              </div>
            </div>
            <button onClick={onClose} style={{ color: '#c4c0d8', fontSize: 20, lineHeight: 1 }}>×</button>
          </div>

          {/* 감성 스냅샷 — 자동 캡처 */}
          <div
            className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-4"
            style={{ background: '#f8f7fd', border: `1.5px solid ${scoreColor}22` }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: `${scoreColor}15`, color: scoreColor }}
            >
              {sentimentEmoji(sentimentLabel)}
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium mb-0.5" style={{ color: '#9e9ab8' }}>지금 감성 스냅샷</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold" style={{ color: scoreColor }}>
                  {sentimentScore !== null ? (sentimentScore > 0 ? '+' : '') + sentimentScore.toFixed(2) : '–'}
                </span>
                {sentimentLabel && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: `${scoreColor}15`, color: scoreColor }}
                  >
                    {sentimentLabel === 'POSITIVE' ? '긍정' : sentimentLabel === 'NEGATIVE' ? '부정' : '중립'}
                  </span>
                )}
                <span className="text-xs" style={{ color: '#c4c0d8' }}>자동 저장</span>
              </div>
            </div>
          </div>

          {/* 메모 입력 */}
          <div className="mb-4">
            <label className="block text-xs font-medium mb-2" style={{ color: '#9e9ab8' }}>메모</label>
            <textarea
              rows={3}
              placeholder="왜 지금 이 종목이 눈에 들어왔나요? 어떤 뉴스를 봤나요?"
              value={memo}
              onChange={e => setMemo(e.target.value)}
              style={{ ...inputStyle, resize: 'none' }}
              autoFocus
            />
          </div>

          {/* 매매 정보 토글 (선택) */}
          <button
            type="button"
            onClick={() => setShowTrade(!showTrade)}
            className="flex items-center gap-1.5 text-xs mb-3 transition-colors"
            style={{ color: showTrade ? '#8b7fd4' : '#c4c0d8' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              {showTrade
                ? <polyline points="18 15 12 9 6 15" />
                : <polyline points="6 9 12 15 18 9" />
              }
            </svg>
            매매 정보도 기록하기 (선택)
          </button>

          {showTrade && (
            <div className="space-y-3 mb-4 rounded-2xl p-4" style={{ background: '#f8f7fd' }}>
              {/* 매수/매도 */}
              <div className="flex gap-2">
                {(['BUY', 'SELL'] as TradeType[]).map(t => (
                  <button
                    key={t} type="button"
                    onClick={() => setTradeType(t)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      background: tradeType === t ? TRADE_COLOR[t].bg : '#fff',
                      color:      tradeType === t ? '#fff' : '#9e9ab8',
                      border: `1.5px solid ${tradeType === t ? TRADE_COLOR[t].bg : '#ece9f5'}`,
                    }}
                  >
                    {t === 'BUY' ? '매수' : '매도'}
                  </button>
                ))}
              </div>

              {/* 단가 + 수량 */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#9e9ab8' }}>단가 ($)</label>
                  <input
                    type="number" step="0.01" min="0" placeholder="0.00"
                    value={price} onChange={e => setPrice(e.target.value)}
                    style={{ ...inputStyle, padding: '8px 12px' }}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#9e9ab8' }}>수량 (주)</label>
                  <input
                    type="number" step="0.001" min="0" placeholder="0"
                    value={quantity} onChange={e => setQuantity(e.target.value)}
                    style={{ ...inputStyle, padding: '8px 12px' }}
                  />
                </div>
              </div>

              {/* 예상 총액 */}
              {price && quantity && parseFloat(price) > 0 && parseFloat(quantity) > 0 && (
                <div className="text-right text-xs" style={{ color: '#9e9ab8' }}>
                  총액 <strong style={{ color: '#8b7fd4' }}>
                    ${(parseFloat(price) * parseFloat(quantity)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                </div>
              )}
            </div>
          )}

          {/* 에러 */}
          {error && (
            <div className="rounded-xl px-4 py-2.5 text-xs mb-3" style={{ background: '#fff1f3', color: '#f43f5e' }}>
              {error}
            </div>
          )}

          {/* 저장 버튼 */}
          <button
            onClick={handleSave}
            disabled={saving || !memo.trim()}
            className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all"
            style={{
              background: (saving || !memo.trim()) ? '#d1d5db' : 'linear-gradient(135deg, #8b7fd4, #6a5fc4)',
              cursor: (saving || !memo.trim()) ? 'not-allowed' : 'pointer',
              boxShadow: (saving || !memo.trim()) ? 'none' : '0 4px 14px rgba(139,127,212,0.35)',
            }}
          >
            {saving ? '저장 중...' : '📝 메모 저장'}
          </button>

          <p className="text-center text-xs mt-2" style={{ color: '#c4c0d8' }}>
            투자 일지에서 전체 기록을 확인할 수 있어요
          </p>
        </div>
      </div>
    </div>
  )
}
