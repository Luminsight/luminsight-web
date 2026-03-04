'use client'

import { useState, useEffect, useCallback } from 'react'
import { journalApi, tradingApi } from '@/lib/api'
import type { JournalEntry, CreateJournalRequest, PositionSummary, InvestOpinion, TradeType } from '@/types'

// ──────────────────────────────────────────────
// 상수 / 헬퍼
// ──────────────────────────────────────────────

const WATCHLIST = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'META', 'AMZN']

const fmt = {
  price:  (v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  amount: (v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
  pct:    (v: number) => `${(v * 100).toFixed(0)}%`,
  date:   (s: string) => {
    const d = new Date(s)
    return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
  },
  qty:    (v: number) => v % 1 === 0 ? v.toString() : v.toFixed(4),
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

const signalColor: Record<string, string> = {
  BUY:  '#22c55e',
  SELL: '#ef4444',
  HOLD: '#94a3b8',
}
const tradeColor: Record<TradeType, string> = {
  BUY:  '#22c55e',
  SELL: '#ef4444',
}

// ──────────────────────────────────────────────
// 포지션 카드
// ──────────────────────────────────────────────

function PositionCard({ pos }: { pos: PositionSummary }) {
  const isLong = pos.netQuantity > 0

  return (
    <div style={{
      background: '#1e293b',
      borderRadius: 12,
      padding: '16px 18px',
      border: `1px solid ${isLong ? '#16a34a33' : '#1e293b'}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#f1f5f9' }}>{pos.ticker}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            {pos.tradeCount}건 ({pos.buyCount}매수 · {pos.sellCount}매도)
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, color: isLong ? '#22c55e' : '#94a3b8', fontWeight: 600 }}>
            {isLong ? `+${fmt.qty(pos.netQuantity)}주 보유` : '포지션 없음'}
          </div>
          {pos.avgBuyPrice > 0 && (
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
              평균 {fmt.price(pos.avgBuyPrice)}
            </div>
          )}
        </div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        gap: 8, marginTop: 12,
      }}>
        <div style={{ background: '#0f172a', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: '#64748b' }}>총 매수</div>
          <div style={{ fontSize: 13, color: '#f1f5f9', fontWeight: 600, marginTop: 2 }}>
            {fmt.amount(pos.totalBuyAmount)}
          </div>
        </div>
        <div style={{ background: '#0f172a', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: '#64748b' }}>총 매도</div>
          <div style={{ fontSize: 13, color: '#f1f5f9', fontWeight: 600, marginTop: 2 }}>
            {fmt.amount(pos.totalSellAmount)}
          </div>
        </div>
        <div style={{ background: '#0f172a', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: '#64748b' }}>실현 손익</div>
          <div style={{
            fontSize: 13, fontWeight: 600, marginTop: 2,
            color: pos.realizedPnl == null ? '#64748b'
              : pos.realizedPnl >= 0 ? '#22c55e' : '#ef4444',
          }}>
            {pos.realizedPnl == null ? '–' : fmt.amount(pos.realizedPnl)}
          </div>
        </div>
      </div>

      {pos.signalMatchRate != null && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 11, color: '#64748b' }}>AI 신호 일치율</div>
          <div style={{ flex: 1, height: 4, background: '#0f172a', borderRadius: 2 }}>
            <div style={{
              height: '100%', borderRadius: 2,
              width: fmt.pct(pos.signalMatchRate),
              background: pos.signalMatchRate >= 0.7 ? '#22c55e'
                : pos.signalMatchRate >= 0.4 ? '#f59e0b' : '#ef4444',
            }} />
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
            {fmt.pct(pos.signalMatchRate)}
          </div>
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
// 기록 행
// ──────────────────────────────────────────────

function JournalRow({
  entry,
  onDelete,
}: {
  entry: JournalEntry
  onDelete: (id: number) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{
      background: '#1e293b',
      borderRadius: 10,
      padding: '12px 16px',
      border: '1px solid #334155',
      cursor: 'pointer',
    }} onClick={() => setExpanded(e => !e)}>
      {/* 요약 행 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* 매수/매도 배지 */}
        <div style={{
          background: tradeColor[entry.tradeType] + '22',
          color: tradeColor[entry.tradeType],
          borderRadius: 6, padding: '2px 8px',
          fontSize: 11, fontWeight: 700, minWidth: 38, textAlign: 'center',
        }}>
          {entry.tradeType === 'BUY' ? '매수' : '매도'}
        </div>

        {/* 티커 */}
        <span style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9', minWidth: 48 }}>
          {entry.ticker}
        </span>

        {/* 날짜 */}
        <span style={{ fontSize: 12, color: '#64748b' }}>{fmt.date(entry.tradeDate)}</span>

        <div style={{ flex: 1 }} />

        {/* 금액 */}
        <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
          {fmt.amount(entry.totalAmount)}
        </span>

        {/* AI 신호 */}
        {entry.aiSignal && (
          <div style={{
            background: signalColor[entry.aiSignal] + '22',
            color: signalColor[entry.aiSignal],
            borderRadius: 6, padding: '2px 7px',
            fontSize: 10, fontWeight: 600,
          }}>
            AI {entry.aiSignal}
          </div>
        )}

        {/* 일치 여부 */}
        {entry.signalMatched != null && (
          <span style={{ fontSize: 13 }}>{entry.signalMatched ? '✅' : '⚠️'}</span>
        )}

        {/* 확장 화살표 */}
        <span style={{ fontSize: 12, color: '#64748b', transform: expanded ? 'rotate(180deg)' : 'none', transition: '0.15s' }}>▾</span>
      </div>

      {/* 상세 */}
      {expanded && (
        <div style={{
          marginTop: 12, paddingTop: 12,
          borderTop: '1px solid #334155',
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: 10,
        }} onClick={e => e.stopPropagation()}>
          <div>
            <div style={{ fontSize: 10, color: '#64748b' }}>단가</div>
            <div style={{ fontSize: 13, color: '#f1f5f9', marginTop: 2 }}>{fmt.price(entry.price)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#64748b' }}>수량</div>
            <div style={{ fontSize: 13, color: '#f1f5f9', marginTop: 2 }}>{fmt.qty(entry.quantity)}주</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#64748b' }}>총액</div>
            <div style={{ fontSize: 13, color: '#f1f5f9', marginTop: 2 }}>{fmt.amount(entry.totalAmount)}</div>
          </div>

          {entry.aiSignal && (
            <div>
              <div style={{ fontSize: 10, color: '#64748b' }}>AI 신호</div>
              <div style={{ fontSize: 13, color: signalColor[entry.aiSignal], marginTop: 2, fontWeight: 600 }}>
                {entry.aiSignal}
                {entry.aiConfidence != null && ` (${fmt.pct(entry.aiConfidence)})`}
              </div>
            </div>
          )}

          {entry.realizedPnl != null && (
            <div>
              <div style={{ fontSize: 10, color: '#64748b' }}>실현 손익</div>
              <div style={{
                fontSize: 13, marginTop: 2, fontWeight: 600,
                color: entry.realizedPnl >= 0 ? '#22c55e' : '#ef4444',
              }}>
                {entry.realizedPnl >= 0 ? '+' : ''}{fmt.amount(entry.realizedPnl)}
              </div>
            </div>
          )}

          {entry.memo && (
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 10, color: '#64748b' }}>메모</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{entry.memo}</div>
            </div>
          )}

          {/* 신호 불일치 경고 */}
          {entry.signalMatched === false && (
            <div style={{
              gridColumn: '1 / -1',
              background: '#f59e0b11', border: '1px solid #f59e0b33',
              borderRadius: 6, padding: '6px 10px',
              fontSize: 11, color: '#f59e0b',
            }}>
              ⚠️ AI 신호({entry.aiSignal})와 반대 방향으로 매매했습니다.
            </div>
          )}

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => onDelete(entry.id)}
              style={{
                background: '#ef444422', color: '#ef4444',
                border: '1px solid #ef444433', borderRadius: 6,
                padding: '4px 12px', fontSize: 11, cursor: 'pointer',
              }}
            >
              삭제
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
// 기록 추가 모달
// ──────────────────────────────────────────────

type FormState = {
  ticker: string
  tradeType: TradeType
  tradeDate: string
  price: string
  quantity: string
  memo: string
  realizedPnl: string
  fetchAiSignal: boolean
}

function AddJournalModal({
  onClose,
  onSaved,
}: {
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<FormState>({
    ticker:      'AAPL',
    tradeType:   'BUY',
    tradeDate:   today(),
    price:       '',
    quantity:    '',
    memo:        '',
    realizedPnl: '',
    fetchAiSignal: true,
  })
  const [aiSignal, setAiSignal]       = useState<InvestOpinion | null>(null)
  const [aiConfidence, setAiConfidence] = useState<number | null>(null)
  const [loadingSignal, setLoadingSignal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  // 티커 변경 시 AI 신호 자동 조회
  useEffect(() => {
    if (!form.fetchAiSignal) return
    setLoadingSignal(true)
    setAiSignal(null)
    tradingApi.getSignal(form.ticker)
      .then(s => {
        setAiSignal(s.signal)
        setAiConfidence(s.confidence)
      })
      .catch(() => { /* 없으면 null 유지 */ })
      .finally(() => setLoadingSignal(false))
  }, [form.ticker, form.fetchAiSignal])

  function set(field: keyof FormState, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const price    = parseFloat(form.price)
    const quantity = parseFloat(form.quantity)
    if (isNaN(price) || price <= 0)    return setError('유효한 단가를 입력해주세요.')
    if (isNaN(quantity) || quantity <= 0) return setError('유효한 수량을 입력해주세요.')

    const req: CreateJournalRequest = {
      ticker:    form.ticker,
      tradeType: form.tradeType,
      tradeDate: form.tradeDate,
      price,
      quantity,
      memo:      form.memo || undefined,
      aiSignal:  aiSignal ?? undefined,
      aiConfidence: aiConfidence ?? undefined,
      realizedPnl: form.realizedPnl ? parseFloat(form.realizedPnl) : undefined,
    }

    setSaving(true)
    try {
      await journalApi.createJournal(req)
      onSaved()
    } catch {
      setError('저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    background: '#0f172a', border: '1px solid #334155', borderRadius: 8,
    padding: '8px 12px', color: '#f1f5f9', fontSize: 13, width: '100%',
    outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 11, color: '#64748b', marginBottom: 4, display: 'block',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#00000088',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: '#1e293b', borderRadius: 16, padding: 28,
        width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px #00000066',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>매매 기록 추가</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 티커 + 매수/매도 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>종목</label>
              <select value={form.ticker} onChange={e => set('ticker', e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}>
                {WATCHLIST.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>구분</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['BUY', 'SELL'] as TradeType[]).map(t => (
                  <button key={t} type="button"
                    onClick={() => set('tradeType', t)}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', border: 'none',
                      background: form.tradeType === t ? tradeColor[t] : '#0f172a',
                      color: form.tradeType === t ? '#fff' : '#64748b',
                    }}>
                    {t === 'BUY' ? '매수' : '매도'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 날짜 */}
          <div>
            <label style={labelStyle}>매매 날짜</label>
            <input type="date" value={form.tradeDate}
              onChange={e => set('tradeDate', e.target.value)}
              style={inputStyle} required />
          </div>

          {/* 단가 + 수량 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>단가 ($)</label>
              <input type="number" step="0.01" min="0" placeholder="0.00"
                value={form.price} onChange={e => set('price', e.target.value)}
                style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>수량 (주)</label>
              <input type="number" step="0.0001" min="0" placeholder="0"
                value={form.quantity} onChange={e => set('quantity', e.target.value)}
                style={inputStyle} required />
            </div>
          </div>

          {/* 예상 총액 표시 */}
          {form.price && form.quantity && (
            <div style={{ background: '#0f172a', borderRadius: 8, padding: '8px 12px',
              fontSize: 12, color: '#94a3b8', textAlign: 'right' }}>
              예상 총액: <strong style={{ color: '#f1f5f9' }}>
                {fmt.amount(parseFloat(form.price) * parseFloat(form.quantity))}
              </strong>
            </div>
          )}

          {/* 실현 손익 (SELL일 때만) */}
          {form.tradeType === 'SELL' && (
            <div>
              <label style={labelStyle}>실현 손익 ($, 선택)</label>
              <input type="number" step="0.01" placeholder="+1234.00 또는 -500.00"
                value={form.realizedPnl} onChange={e => set('realizedPnl', e.target.value)}
                style={inputStyle} />
            </div>
          )}

          {/* AI 신호 */}
          <div style={{ background: '#0f172a', borderRadius: 10, padding: '10px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>AI 신호 자동 조회</span>
              <button type="button"
                onClick={() => set('fetchAiSignal', !form.fetchAiSignal)}
                style={{
                  width: 36, height: 20, borderRadius: 10,
                  background: form.fetchAiSignal ? '#3b82f6' : '#334155',
                  border: 'none', cursor: 'pointer', position: 'relative',
                }}>
                <span style={{
                  position: 'absolute', top: 2, borderRadius: '50%',
                  width: 16, height: 16, background: '#fff',
                  left: form.fetchAiSignal ? 18 : 2,
                  transition: 'left 0.15s',
                }} />
              </button>
            </div>
            {form.fetchAiSignal && (
              <div style={{ marginTop: 8, fontSize: 12 }}>
                {loadingSignal ? (
                  <span style={{ color: '#64748b' }}>조회 중...</span>
                ) : aiSignal ? (
                  <span>
                    현재 신호:{' '}
                    <strong style={{ color: signalColor[aiSignal] }}>{aiSignal}</strong>
                    {aiConfidence != null && (
                      <span style={{ color: '#64748b' }}> (신뢰도 {fmt.pct(aiConfidence)})</span>
                    )}
                  </span>
                ) : (
                  <span style={{ color: '#64748b' }}>신호 없음</span>
                )}
              </div>
            )}
          </div>

          {/* 메모 */}
          <div>
            <label style={labelStyle}>메모 (선택)</label>
            <textarea rows={2} placeholder="매매 이유, 감상 등..."
              value={form.memo} onChange={e => set('memo', e.target.value)}
              style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          {error && (
            <div style={{ color: '#ef4444', fontSize: 12, background: '#ef444411',
              borderRadius: 8, padding: '8px 12px' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={saving}
            style={{
              background: saving ? '#334155' : '#3b82f6',
              color: '#fff', border: 'none', borderRadius: 10,
              padding: '11px 0', fontSize: 14, fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              marginTop: 4,
            }}>
            {saving ? '저장 중...' : '기록 저장'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// 메인 페이지
// ──────────────────────────────────────────────

export default function JournalPage() {
  const [entries, setEntries]       = useState<JournalEntry[]>([])
  const [portfolio, setPortfolio]   = useState<PositionSummary[]>([])
  const [loading, setLoading]       = useState(true)
  const [showAdd, setShowAdd]       = useState(false)
  const [filterTicker, setFilterTicker] = useState<string>('')
  const [activeTab, setActiveTab]   = useState<'list' | 'portfolio'>('list')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [j, p] = await Promise.all([
        journalApi.getJournals(filterTicker ? { ticker: filterTicker } : undefined),
        journalApi.getPortfolioSummary(),
      ])
      setEntries(j)
      setPortfolio(p)
    } catch {
      // 에러 시 빈 배열 유지
    } finally {
      setLoading(false)
    }
  }, [filterTicker])

  useEffect(() => { loadData() }, [loadData])

  async function handleDelete(id: number) {
    if (!confirm('이 기록을 삭제할까요?')) return
    try {
      await journalApi.deleteJournal(id)
      loadData()
    } catch {
      alert('삭제에 실패했습니다.')
    }
  }

  // 집계
  const totalBuy  = entries.filter(e => e.tradeType === 'BUY').reduce((s, e) => s + e.totalAmount, 0)
  const totalSell = entries.filter(e => e.tradeType === 'SELL').reduce((s, e) => s + e.totalAmount, 0)
  const totalPnl  = entries.reduce((s, e) => s + (e.realizedPnl ?? 0), 0)
  const contraryCount = entries.filter(e => e.signalMatched === false).length

  return (
    <div style={{
      minHeight: '100vh', background: '#0f172a', color: '#f1f5f9',
      padding: '28px 24px', maxWidth: 780, margin: '0 auto',
    }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#f1f5f9' }}>📒 투자 일지</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            AI 신호 대비 실제 매매를 기록하고 분석하세요
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            background: '#3b82f6', color: '#fff',
            border: 'none', borderRadius: 10,
            padding: '9px 18px', fontSize: 13, fontWeight: 700,
            cursor: 'pointer',
          }}>
          + 기록 추가
        </button>
      </div>

      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
        {[
          { label: '총 매수',   value: fmt.amount(totalBuy),   color: '#22c55e' },
          { label: '총 매도',   value: fmt.amount(totalSell),  color: '#ef4444' },
          { label: '실현 손익', value: totalPnl === 0 ? '–' : (totalPnl > 0 ? '+' : '') + fmt.amount(totalPnl),
            color: totalPnl > 0 ? '#22c55e' : totalPnl < 0 ? '#ef4444' : '#64748b' },
          { label: 'AI 역행',   value: `${contraryCount}건`,   color: contraryCount > 0 ? '#f59e0b' : '#64748b' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: '#1e293b', borderRadius: 10, padding: '12px 14px',
            border: '1px solid #334155',
          }}>
            <div style={{ fontSize: 10, color: '#64748b' }}>{label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 18, background: '#1e293b', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {(['list', 'portfolio'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{
              background: activeTab === tab ? '#3b82f6' : 'transparent',
              color: activeTab === tab ? '#fff' : '#64748b',
              border: 'none', borderRadius: 8, padding: '6px 16px',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
            {tab === 'list' ? '매매 기록' : '포지션 요약'}
          </button>
        ))}
      </div>

      {/* 기록 목록 탭 */}
      {activeTab === 'list' && (
        <>
          {/* 티커 필터 */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilterTicker('')}
              style={{
                background: filterTicker === '' ? '#3b82f6' : '#1e293b',
                color: filterTicker === '' ? '#fff' : '#64748b',
                border: '1px solid #334155', borderRadius: 8,
                padding: '5px 12px', fontSize: 12, cursor: 'pointer',
              }}>
              전체
            </button>
            {WATCHLIST.map(t => (
              <button key={t} onClick={() => setFilterTicker(filterTicker === t ? '' : t)}
                style={{
                  background: filterTicker === t ? '#3b82f633' : '#1e293b',
                  color: filterTicker === t ? '#93c5fd' : '#64748b',
                  border: `1px solid ${filterTicker === t ? '#3b82f6' : '#334155'}`,
                  borderRadius: 8, padding: '5px 12px', fontSize: 12, cursor: 'pointer',
                }}>
                {t}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>불러오는 중...</div>
          ) : entries.length === 0 ? (
            <div style={{
              textAlign: 'center', color: '#64748b', padding: '60px 0',
              background: '#1e293b', borderRadius: 12, border: '1px dashed #334155',
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
              <div style={{ fontSize: 14 }}>기록이 없습니다</div>
              <div style={{ fontSize: 12, marginTop: 6 }}>위의 &quot;기록 추가&quot; 버튼으로 첫 매매를 기록해보세요.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {entries.map(e => (
                <JournalRow key={e.id} entry={e} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </>
      )}

      {/* 포지션 요약 탭 */}
      {activeTab === 'portfolio' && (
        <>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>불러오는 중...</div>
          ) : portfolio.length === 0 ? (
            <div style={{
              textAlign: 'center', color: '#64748b', padding: '60px 0',
              background: '#1e293b', borderRadius: 12, border: '1px dashed #334155',
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
              <div style={{ fontSize: 14 }}>매매 기록이 없습니다</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {portfolio.map(p => <PositionCard key={p.ticker} pos={p} />)}
            </div>
          )}
        </>
      )}

      {/* 추가 모달 */}
      {showAdd && (
        <AddJournalModal
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); loadData() }}
        />
      )}
    </div>
  )
}
