'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { journalApi, tradingApi, stockApi } from '@/lib/api'
import type { JournalEntry, CreateJournalRequest, PositionSummary, InvestOpinion, TradeType, SentimentLabel } from '@/types'

// ──────────────────────────────────────────────
// 상수 / 헬퍼
// ──────────────────────────────────────────────

const FALLBACK_TICKERS = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'META', 'AMZN']

// 티커 → 회사명 매핑 (자동완성 검색용)
const STOCK_NAMES: Record<string, string> = {
  AAPL: 'Apple',
  TSLA: 'Tesla',
  NVDA: 'NVIDIA',
  MSFT: 'Microsoft',
  GOOGL: 'Alphabet (Google)',
  META: 'Meta Platforms',
  AMZN: 'Amazon',
  NFLX: 'Netflix',
  AMD: 'AMD',
  INTC: 'Intel',
  ORCL: 'Oracle',
  CRM: 'Salesforce',
  ADBE: 'Adobe',
  PYPL: 'PayPal',
  UBER: 'Uber',
  LYFT: 'Lyft',
  SNAP: 'Snap',
  SPOT: 'Spotify',
  COIN: 'Coinbase',
  PLTR: 'Palantir',
  RBLX: 'Roblox',
  HOOD: 'Robinhood',
  ABNB: 'Airbnb',
  DASH: 'DoorDash',
  RIVN: 'Rivian',
  LCID: 'Lucid Motors',
  NIO: 'NIO',
  BABA: 'Alibaba',
  JD: 'JD.com',
  BIDU: 'Baidu',
  JPM: 'JPMorgan Chase',
  BAC: 'Bank of America',
  GS: 'Goldman Sachs',
  MS: 'Morgan Stanley',
  V: 'Visa',
  MA: 'Mastercard',
  BRK: 'Berkshire Hathaway',
  UNH: 'UnitedHealth',
  JNJ: 'Johnson & Johnson',
  PFE: 'Pfizer',
  MRNA: 'Moderna',
  SPY: 'S&P 500 ETF',
  QQQ: 'Nasdaq 100 ETF',
  DIS: 'Disney',
  NKLA: 'Nikola',
  SOFI: 'SoFi Technologies',
  GME: 'GameStop',
  AMC: 'AMC Entertainment',
}

const fmt = {
  price:  (v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  amount: (v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
  pct:    (v: number) => `${(v * 100).toFixed(0)}%`,
  date:   (s: string) => new Date(s).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }),
  qty:    (v: number) => v % 1 === 0 ? v.toString() : v.toFixed(4),
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

// 카드 공통 스타일 (대시보드와 동일)
const CARD: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: '18px',
  padding: '22px 24px',
  boxShadow: '0 2px 12px rgba(139,127,212,0.09)',
}

// 매수/매도 색상
const TRADE_COLOR: Record<TradeType, { bg: string; text: string; light: string }> = {
  BUY:  { bg: '#22c55e', text: '#fff', light: '#f0fdf4' },
  SELL: { bg: '#f43f5e', text: '#fff', light: '#fff1f3' },
}

// AI 신호 색상
const SIGNAL_COLOR: Record<string, string> = {
  BUY:  '#22c55e',
  SELL: '#f43f5e',
  HOLD: '#8b7fd4',
}

// 감성 스냅샷 색상 / 레이블
function sentimentSnapshotColor(label: SentimentLabel | null): string {
  if (label === 'POSITIVE') return '#f43f5e'
  if (label === 'NEGATIVE') return '#3b82f6'
  return '#8b7fd4'
}
function sentimentSnapshotText(label: SentimentLabel | null, score: number | null): string {
  const prefix = label === 'POSITIVE' ? '긍정' : label === 'NEGATIVE' ? '부정' : '중립'
  const num = score != null ? ` ${score > 0 ? '+' : ''}${score.toFixed(2)}` : ''
  return prefix + num
}

// 티커 → 한글 회사명 매핑
const STOCK_NAMES_KO: Record<string, string> = {
  AAPL: '애플', TSLA: '테슬라', NVDA: '엔비디아', MSFT: '마이크로소프트',
  GOOGL: '알파벳 (구글)', META: '메타 플랫폼스', AMZN: '아마존', NFLX: '넷플릭스',
  AMD: 'AMD', INTC: '인텔', ORCL: '오라클', CRM: '세일즈포스', ADBE: '어도비',
  PYPL: '페이팔', UBER: '우버', LYFT: '리프트', SNAP: '스냅', SPOT: '스포티파이',
  COIN: '코인베이스', PLTR: '팔란티어', RBLX: '로블록스', HOOD: '로빈후드',
  ABNB: '에어비앤비', DASH: '도어대시', RIVN: '리비안', LCID: '루시드 모터스',
  NIO: '니오', BABA: '알리바바', JD: 'JD닷컴', BIDU: '바이두',
  JPM: 'JP모건 체이스', BAC: '뱅크오브아메리카', GS: '골드만삭스', MS: '모건스탠리',
  V: '비자', MA: '마스터카드', BRK: '버크셔 해서웨이', UNH: '유나이티드헬스',
  JNJ: '존슨앤존슨', PFE: '화이자', MRNA: '모더나', SPY: 'S&P 500 ETF',
  QQQ: '나스닥 100 ETF', DIS: '디즈니', GME: '게임스탑', SOFI: '소파이',
}

function isKorean(s: string): boolean {
  return /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(s)
}

// ──────────────────────────────────────────────
// 티커 자동완성 검색 컴포넌트
// (모달 종목 입력 + 향후 재사용 가능)
// ──────────────────────────────────────────────

function TickerSearchInput({
  value,
  onChange,
  tickers,
  placeholder = '종목명 또는 티커 검색',
  inputWidth = '180px',
  autoFocus = false,
}: {
  value: string
  onChange: (ticker: string) => void
  tickers: string[]
  placeholder?: string
  inputWidth?: string
  autoFocus?: boolean
}) {
  const [inputVal, setInputVal]   = useState(value)
  const [open, setOpen]           = useState(false)
  const [focused, setFocused]     = useState(false)
  const [focusedIdx, setFocusedIdx] = useState(-1)
  const wrapRef                   = useRef<HTMLDivElement>(null)
  const listRef                   = useRef<HTMLDivElement>(null)

  // 부모 value 변경 시 동기화
  useEffect(() => { setInputVal(value) }, [value])

  // 바깥 클릭 시 닫기
  useEffect(() => {
    function onOut(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
        setFocused(false)
        setFocusedIdx(-1)
      }
    }
    document.addEventListener('mousedown', onOut)
    return () => document.removeEventListener('mousedown', onOut)
  }, [])

  // 후보 목록 — 한글이면 한글명, 영문이면 티커+영문명 검색
  const rawQuery = inputVal.trim()
  const ko = isKorean(rawQuery)
  const queryUp = rawQuery.toUpperCase()
  const candidates = rawQuery.length === 0
    ? []
    : tickers.filter(t => {
        if (ko) {
          return (STOCK_NAMES_KO[t] ?? '').includes(rawQuery)
        }
        const enName = (STOCK_NAMES[t] ?? '').toUpperCase()
        return t.startsWith(queryUp) || enName.includes(queryUp)
      }).slice(0, 8)

  // focusedIdx 범위 보정
  useEffect(() => { setFocusedIdx(-1) }, [rawQuery])

  function select(ticker: string) {
    setInputVal(ticker)
    setOpen(false)
    setFocused(false)
    setFocusedIdx(-1)
    onChange(ticker)
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    // 영문 입력이면 대문자 변환, 한글은 그대로
    setInputVal(isKorean(v) ? v : v.toUpperCase())
    setOpen(true)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || candidates.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIdx(prev => {
        const next = Math.min(prev + 1, candidates.length - 1)
        // 스크롤 처리
        listRef.current?.children[next]?.scrollIntoView({ block: 'nearest' })
        return next
      })
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIdx(prev => {
        const next = Math.max(prev - 1, 0)
        listRef.current?.children[next]?.scrollIntoView({ block: 'nearest' })
        return next
      })
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const idx = focusedIdx >= 0 ? focusedIdx : 0
      if (candidates[idx]) select(candidates[idx])
    } else if (e.key === 'Escape') {
      setOpen(false)
      setFocusedIdx(-1)
    }
  }

  const isActive = value !== ''

  return (
    <div ref={wrapRef} className="relative" style={{ width: inputWidth }}>
      <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl w-full"
        style={{
          background: '#f8f7fd',
          border: `1.5px solid ${isActive ? '#8b7fd4' : focused ? '#c4bcec' : '#e0dcf5'}`,
          transition: 'border-color 0.15s',
        }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke={isActive ? '#8b7fd4' : '#b0aacf'} strokeWidth="2.5" style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          value={inputVal}
          onChange={handleInput}
          onFocus={() => { setFocused(true); if (inputVal.length > 0) setOpen(true) }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          maxLength={20}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: '14px',
            color: isActive ? '#8b7fd4' : '#333',
            flex: 1,
            minWidth: 0,
          }}
        />
        {inputVal && (
          <button type="button"
            onMouseDown={e => { e.preventDefault(); setInputVal(''); onChange('') }}
            style={{ lineHeight: 1, color: '#b0aacf', flexShrink: 0 }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* 자동완성 드롭다운 */}
      {open && candidates.length > 0 && (
        <div ref={listRef}
          className="absolute left-0 top-full mt-1 z-50 rounded-xl overflow-y-auto"
          style={{
            background: '#fff',
            boxShadow: '0 8px 28px rgba(139,127,212,0.20)',
            border: '1px solid #ece9f5',
            width: '100%',
            minWidth: '220px',
            maxHeight: '280px',
          }}>
          {candidates.map((t, i) => {
            const isFocused = i === focusedIdx
            return (
              <button key={t} type="button"
                onMouseDown={e => { e.preventDefault(); select(t) }}
                onMouseEnter={() => setFocusedIdx(i)}
                className="w-full flex items-center gap-2.5 px-3 py-3 text-left"
                style={{
                  background: isFocused ? '#f0eefb' : 'transparent',
                  borderBottom: i < candidates.length - 1 ? '1px solid #f3f0fd' : 'none',
                  transition: 'background 0.1s',
                }}>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold text-white"
                  style={{ background: isFocused ? '#6a5fc4' : '#8b7fd4', minWidth: '44px', justifyContent: 'center' }}>
                  {t}
                </span>
                <span style={{ flex: 1 }}>
                  <span className="text-sm font-medium" style={{ color: '#18162a' }}>
                    {ko ? (STOCK_NAMES_KO[t] ?? t) : (STOCK_NAMES[t] ?? t)}
                  </span>
                  {ko && STOCK_NAMES[t] && (
                    <span className="text-xs ml-1.5" style={{ color: '#9e9ab8' }}>{STOCK_NAMES[t]}</span>
                  )}
                  {!ko && STOCK_NAMES_KO[t] && (
                    <span className="text-xs ml-1.5" style={{ color: '#9e9ab8' }}>{STOCK_NAMES_KO[t]}</span>
                  )}
                </span>
                {isFocused && (
                  <span className="text-xs" style={{ color: '#8b7fd4' }}>↵</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
// 포지션 카드
// ──────────────────────────────────────────────

function PositionCard({ pos }: { pos: PositionSummary }) {
  const isLong = pos.netQuantity > 0

  return (
    <div style={CARD}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white bg-purple-500 mr-2">
            {pos.ticker}
          </span>
          <span className="text-xs text-gray-400">{pos.tradeCount}건</span>
        </div>
        <span className={`text-sm font-semibold ${isLong ? 'text-green-500' : 'text-gray-400'}`}>
          {isLong ? `+${fmt.qty(pos.netQuantity)}주` : '포지션 없음'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: '총 매수',   value: fmt.amount(pos.totalBuyAmount),  color: 'text-gray-800' },
          { label: '총 매도',   value: fmt.amount(pos.totalSellAmount), color: 'text-gray-800' },
          { label: '실현 손익', value: pos.realizedPnl == null ? '–' : fmt.amount(pos.realizedPnl),
            color: pos.realizedPnl == null ? 'text-gray-400'
              : pos.realizedPnl >= 0 ? 'text-green-500' : 'text-red-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-3" style={{ background: '#f8f7fd' }}>
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className={`text-sm font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {pos.avgBuyPrice > 0 && (
        <p className="text-xs text-gray-400 mb-3">평균 매수가 {fmt.price(pos.avgBuyPrice)}</p>
      )}

      {pos.signalMatchRate != null && (
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-400">AI 신호 일치율</span>
            <span className="text-xs font-semibold" style={{ color: '#8b7fd4' }}>
              {fmt.pct(pos.signalMatchRate)}
            </span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: '#ece9f5' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: fmt.pct(pos.signalMatchRate),
                background: pos.signalMatchRate >= 0.7 ? '#8b7fd4'
                  : pos.signalMatchRate >= 0.4 ? '#f59e0b' : '#f43f5e',
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
// 기록 행
// ──────────────────────────────────────────────

function JournalRow({ entry, onDelete }: { entry: JournalEntry; onDelete: (id: number) => void }) {
  const [expanded, setExpanded] = useState(false)
  const tc = TRADE_COLOR[entry.tradeType]

  return (
    <div
      className="rounded-2xl cursor-pointer transition-all hover:shadow-lg"
      style={{
        background: '#ffffff',
        boxShadow: '0 2px 12px rgba(139,127,212,0.08)',
        borderLeft: `4px solid ${tc.bg}`,
      }}
      onClick={() => setExpanded(e => !e)}
    >
      {/* 요약 행 */}
      <div className="flex items-center gap-3 px-5 py-4">
        {/* 매수/매도 배지 */}
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
          style={{ background: tc.bg, color: tc.text }}
        >
          {entry.tradeType === 'BUY' ? '매수' : '매도'}
        </span>

        {/* 티커 */}
        <span className="font-bold text-sm" style={{ color: '#18162a', minWidth: 44 }}>
          {entry.ticker}
        </span>

        {/* 날짜 */}
        <span className="text-xs text-gray-400">{fmt.date(entry.tradeDate)}</span>

        <div className="flex-1" />

        {/* 감성 스냅샷 뱃지 — 기록 시점 감성 */}
        {entry.sentimentLabel && (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full hidden sm:inline-flex items-center gap-1"
            style={{
              background: sentimentSnapshotColor(entry.sentimentLabel) + '15',
              color: sentimentSnapshotColor(entry.sentimentLabel),
            }}
            title="기록 당시 감성 점수"
          >
            📊 {sentimentSnapshotText(entry.sentimentLabel, entry.sentimentScore)}
          </span>
        )}

        {/* AI 신호 */}
        {entry.aiSignal && (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: SIGNAL_COLOR[entry.aiSignal] + '18',
              color: SIGNAL_COLOR[entry.aiSignal],
            }}
          >
            AI {entry.aiSignal}
          </span>
        )}

        {/* 일치 여부 */}
        {entry.signalMatched === false && (
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: '#fef3c7', color: '#d97706' }}>
            ⚠️ 역행
          </span>
        )}

        {/* 금액 */}
        <span className="text-sm font-semibold" style={{ color: '#18162a' }}>
          {fmt.amount(entry.totalAmount)}
        </span>

        {/* 화살표 */}
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="#9e9ab8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: '0.15s', flexShrink: 0 }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {/* 상세 확장 영역 */}
      {expanded && (
        <div
          className="px-5 pb-4"
          style={{ borderTop: '1px solid #f3f0fc' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="rounded-xl p-3" style={{ background: '#f8f7fd' }}>
              <p className="text-xs text-gray-400 mb-1">단가</p>
              <p className="text-sm font-semibold text-gray-800">{fmt.price(entry.price)}</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: '#f8f7fd' }}>
              <p className="text-xs text-gray-400 mb-1">수량</p>
              <p className="text-sm font-semibold text-gray-800">{fmt.qty(entry.quantity)}주</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: '#f8f7fd' }}>
              <p className="text-xs text-gray-400 mb-1">총액</p>
              <p className="text-sm font-semibold text-gray-800">{fmt.amount(entry.totalAmount)}</p>
            </div>

            {entry.aiSignal && (
              <div className="rounded-xl p-3" style={{ background: '#f8f7fd' }}>
                <p className="text-xs text-gray-400 mb-1">AI 신호</p>
                <p className="text-sm font-semibold" style={{ color: SIGNAL_COLOR[entry.aiSignal] }}>
                  {entry.aiSignal}
                  {entry.aiConfidence != null && (
                    <span className="text-gray-400 font-normal"> ({fmt.pct(entry.aiConfidence)})</span>
                  )}
                </p>
              </div>
            )}

            {/* 감성 스냅샷 */}
            {entry.sentimentLabel && (
              <div className="rounded-xl p-3" style={{ background: '#f8f7fd' }}>
                <p className="text-xs text-gray-400 mb-1">당시 감성 점수</p>
                <p className="text-sm font-semibold" style={{ color: sentimentSnapshotColor(entry.sentimentLabel) }}>
                  {sentimentSnapshotText(entry.sentimentLabel, entry.sentimentScore)}
                </p>
              </div>
            )}

            {entry.realizedPnl != null && (
              <div className="rounded-xl p-3" style={{ background: '#f8f7fd' }}>
                <p className="text-xs text-gray-400 mb-1">실현 손익</p>
                <p className={`text-sm font-semibold ${entry.realizedPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {entry.realizedPnl >= 0 ? '+' : ''}{fmt.amount(entry.realizedPnl)}
                </p>
              </div>
            )}

            {entry.memo && (
              <div className="col-span-3 rounded-xl p-3" style={{ background: '#f8f7fd' }}>
                <p className="text-xs text-gray-400 mb-1">메모</p>
                <p className="text-sm text-gray-600">{entry.memo}</p>
              </div>
            )}
          </div>

          {/* AI 역행 경고 */}
          {entry.signalMatched === false && (
            <div className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs"
              style={{ background: '#fef3c7', color: '#92400e' }}>
              <span>⚠️</span>
              <span>AI 신호 <strong>{entry.aiSignal}</strong>와 반대 방향으로 매매했습니다.</span>
            </div>
          )}

          <div className="flex justify-end mt-3">
            <button
              onClick={() => onDelete(entry.id)}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-red-100"
              style={{ color: '#f43f5e', border: '1px solid #ffd5db' }}
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

function AddJournalModal({ onClose, onSaved, portfolio, tickers }: {
  onClose: () => void
  onSaved: () => void
  portfolio: PositionSummary[]
  tickers: string[]
}) {
  const [form, setForm] = useState<FormState>({
    ticker: tickers[0] ?? 'AAPL', tradeType: 'BUY', tradeDate: today(),
    price: '', quantity: '', memo: '', realizedPnl: '', fetchAiSignal: true,
  })
  const [aiSignal, setAiSignal]           = useState<InvestOpinion | null>(null)
  const [aiConfidence, setAiConfidence]   = useState<number | null>(null)
  const [loadingSignal, setLoadingSignal] = useState(false)
  const [saving, setSaving]               = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const [pnlAutoCalc, setPnlAutoCalc]     = useState<{ avgBuyPrice: number; estimated: number } | null>(null)

  useEffect(() => {
    if (!form.fetchAiSignal) return
    setLoadingSignal(true)
    setAiSignal(null)
    tradingApi.getSignal(form.ticker)
      .then(s => { setAiSignal(s.signal); setAiConfidence(s.confidence) })
      .catch(() => {})
      .finally(() => setLoadingSignal(false))
  }, [form.ticker, form.fetchAiSignal])

  // 매도 시 실현 손익 자동 계산
  useEffect(() => {
    if (form.tradeType !== 'SELL') {
      setPnlAutoCalc(null)
      return
    }
    const pos = portfolio.find(p => p.ticker === form.ticker)
    if (!pos || pos.avgBuyPrice <= 0) {
      setPnlAutoCalc(null)
      return
    }
    const price    = parseFloat(form.price)
    const quantity = parseFloat(form.quantity)
    if (isNaN(price) || isNaN(quantity) || price <= 0 || quantity <= 0) {
      setPnlAutoCalc(null)
      return
    }
    const estimated = (price - pos.avgBuyPrice) * quantity
    setPnlAutoCalc({ avgBuyPrice: pos.avgBuyPrice, estimated })
    setForm(prev => ({ ...prev, realizedPnl: estimated.toFixed(2) }))
  }, [form.tradeType, form.ticker, form.price, form.quantity, portfolio])

  function set(field: keyof FormState, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const price    = parseFloat(form.price)
    const quantity = parseFloat(form.quantity)
    if (isNaN(price) || price <= 0)       return setError('유효한 단가를 입력해주세요.')
    if (isNaN(quantity) || quantity <= 0) return setError('유효한 수량을 입력해주세요.')

    const req: CreateJournalRequest = {
      ticker: form.ticker, tradeType: form.tradeType, tradeDate: form.tradeDate,
      price, quantity,
      memo:         form.memo || undefined,
      aiSignal:     aiSignal ?? undefined,
      aiConfidence: aiConfidence ?? undefined,
      realizedPnl:  form.realizedPnl ? parseFloat(form.realizedPnl) : undefined,
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

  const inputCls = "w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
  const inputStyle: React.CSSProperties = {
    background: '#f8f7fd', border: '1.5px solid #ece9f5', color: '#18162a',
  }
  // 숫자 외 입력 차단 (e, E, +, - 방지 → 단가·수량용)
  const noInvalidKey = (e: React.KeyboardEvent) => {
    if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault()
  }
  // 실현손익은 음수 허용 (- 는 허용, e E + 만 차단)
  const noInvalidKeyAllowNeg = (e: React.KeyboardEvent) => {
    if (['e', 'E', '+'].includes(e.key)) e.preventDefault()
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(24,22,42,0.45)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-y-auto"
        style={{ background: '#fff', padding: '28px', maxHeight: '90vh', boxShadow: '0 20px 60px rgba(139,127,212,0.25)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold" style={{ color: '#18162a' }}>📒 매매 기록 추가</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 종목 검색 + 구분 */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">종목</label>
            <TickerSearchInput
              value={form.ticker}
              onChange={ticker => { if (ticker) set('ticker', ticker) }}
              tickers={tickers}
              placeholder="티커 또는 종목명 검색 (예: 애플, AAPL)"
              inputWidth="100%"
            />
            {/* 선택된 종목 표시 */}
            {form.ticker && (
              <div className="mt-1.5 flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold text-white"
                  style={{ background: '#8b7fd4' }}>{form.ticker}</span>
                <span className="text-xs" style={{ color: '#9e9ab8' }}>
                  {STOCK_NAMES_KO[form.ticker]
                    ? `${STOCK_NAMES_KO[form.ticker]} · ${STOCK_NAMES[form.ticker] ?? ''}`
                    : (STOCK_NAMES[form.ticker] ?? '')}
                </span>
              </div>
            )}
          </div>

          {/* 구분 */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">구분</label>
            <div className="flex gap-2">
              {(['BUY', 'SELL'] as TradeType[]).map(t => (
                <button key={t} type="button" onClick={() => set('tradeType', t)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: form.tradeType === t ? TRADE_COLOR[t].bg : '#f8f7fd',
                    color: form.tradeType === t ? '#fff' : '#9e9ab8',
                    border: `1.5px solid ${form.tradeType === t ? TRADE_COLOR[t].bg : '#ece9f5'}`,
                  }}>
                  {t === 'BUY' ? '매수' : '매도'}
                </button>
              ))}
            </div>
          </div>

          {/* 날짜 */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">매매 날짜</label>
            <input type="date" value={form.tradeDate} onChange={e => set('tradeDate', e.target.value)}
              className={inputCls} style={inputStyle} required />
          </div>

          {/* 단가 + 수량 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">단가 ($)</label>
              <input type="number" step="0.01" min="0" placeholder="0.00"
                value={form.price} onChange={e => set('price', e.target.value)}
                onKeyDown={noInvalidKey}
                className={inputCls} style={inputStyle} required />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">수량 (주)</label>
              <input type="number" step="any" min="0" placeholder="0"
                value={form.quantity} onChange={e => set('quantity', e.target.value)}
                onKeyDown={noInvalidKey}
                className={inputCls} style={inputStyle} required />
            </div>
          </div>

          {/* 예상 총액 */}
          {form.price && form.quantity && (
            <div className="rounded-xl px-4 py-3 text-right text-sm" style={{ background: '#f0eefb' }}>
              예상 총액 <strong style={{ color: '#8b7fd4' }}>
                {(() => {
                  const total = parseFloat(form.price) * parseFloat(form.quantity)
                  if (total === 0) return '$0'
                  if (total < 0.01) return `$${total.toPrecision(4)}`
                  if (total < 1)    return `$${total.toFixed(4)}`
                  return fmt.amount(total)
                })()}
              </strong>
            </div>
          )}

          {/* 실현 손익 (SELL) */}
          {form.tradeType === 'SELL' && (
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                실현 손익 ($)
                {pnlAutoCalc && (
                  <span className="ml-2 font-medium" style={{ color: '#8b7fd4' }}>자동 계산됨</span>
                )}
              </label>
              <input type="number" step="0.01" placeholder="+1234.00 또는 -500.00"
                value={form.realizedPnl} onChange={e => {
                  set('realizedPnl', e.target.value)
                  setPnlAutoCalc(null) // 직접 수정 시 자동 계산 표시 해제
                }}
                onKeyDown={noInvalidKeyAllowNeg}
                className={inputCls}
                style={pnlAutoCalc ? {
                  ...inputStyle,
                  border: `1.5px solid ${pnlAutoCalc.estimated >= 0 ? '#86efac' : '#fca5a5'}`,
                } : inputStyle} />
              {pnlAutoCalc && (
                <p className="mt-1 text-xs" style={{ color: '#9e9ab8' }}>
                  ⚠️ <strong style={{ color: '#b8a9e8' }}>앱 내 기록 기준 추정값</strong> · 평균 매수가 ${pnlAutoCalc.avgBuyPrice.toFixed(2)} ·{' '}
                  <span style={{ color: pnlAutoCalc.estimated >= 0 ? '#22c55e' : '#f43f5e', fontWeight: 600 }}>
                    {pnlAutoCalc.estimated >= 0 ? '+' : ''}{pnlAutoCalc.estimated.toFixed(2)}
                  </span>
                  <br />외부 거래소 매수가 있다면 직접 수정하세요
                </p>
              )}
              {!pnlAutoCalc && portfolio.find(p => p.ticker === form.ticker) === undefined && (
                <p className="mt-1 text-xs" style={{ color: '#c4c0d8' }}>⚠️ 앱 내 매수 기록 없음 · 실현 손익을 직접 입력하세요</p>
              )}
            </div>
          )}

          {/* AI 신호 */}
          <div className="rounded-xl px-4 py-3" style={{ background: '#f8f7fd', border: '1.5px solid #ece9f5' }}>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">AI 신호 자동 조회</span>
              <button type="button" onClick={() => set('fetchAiSignal', !form.fetchAiSignal)}
                className="relative rounded-full transition-colors"
                style={{
                  width: 36, height: 20,
                  background: form.fetchAiSignal ? '#8b7fd4' : '#d1d5db',
                }}>
                <span className="absolute top-0.5 rounded-full bg-white transition-all"
                  style={{ width: 16, height: 16, left: form.fetchAiSignal ? 18 : 2 }} />
              </button>
            </div>
            {form.fetchAiSignal && (
              <div className="mt-2 text-xs">
                {loadingSignal ? (
                  <span className="text-gray-400">조회 중...</span>
                ) : aiSignal ? (
                  <span className="text-gray-600">
                    현재 신호:{' '}
                    <strong style={{ color: SIGNAL_COLOR[aiSignal] }}>{aiSignal}</strong>
                    {aiConfidence != null && <span className="text-gray-400"> ({fmt.pct(aiConfidence)})</span>}
                  </span>
                ) : (
                  <span className="text-gray-400">신호 없음</span>
                )}
              </div>
            )}
          </div>

          {/* 메모 */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">메모 (선택)</label>
            <textarea rows={2} placeholder="매매 이유, 감상 등..."
              value={form.memo} onChange={e => set('memo', e.target.value)}
              className={inputCls} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          {error && (
            <div className="rounded-xl px-4 py-3 text-sm" style={{ background: '#fff1f3', color: '#f43f5e' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={saving}
            className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all"
            style={{
              background: saving ? '#d1d5db' : 'linear-gradient(135deg, #8b7fd4, #6a5fc4)',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}>
            {saving ? '저장 중...' : '기록 저장'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// 내 패턴 탭 (인사이트)
// ──────────────────────────────────────────────

const SENTIMENT_META: Record<string, { emoji: string; label: string; color: string; bg: string }> = {
  POSITIVE: { emoji: '📈', label: '긍정',  color: '#f43f5e', bg: '#fff1f3' },
  NEGATIVE: { emoji: '📉', label: '부정',  color: '#3b82f6', bg: '#eff6ff' },
  NEUTRAL:  { emoji: '➡️', label: '중립',  color: '#8b7fd4', bg: '#f5f4fd' },
}

// ──────────────────────────────────────────────
// 감성 타이밍 차트 (날짜 × 감성점수 + 매매 마커)
// ──────────────────────────────────────────────
function SentimentTimingChart({ entries }: { entries: JournalEntry[] }) {
  const data = entries
    .filter(e => e.sentimentScore != null)
    .sort((a, b) => a.tradeDate.localeCompare(b.tradeDate))

  if (data.length < 2) {
    return (
      <p className="text-sm text-center py-6" style={{ color: '#c4c0d8' }}>
        감성 스냅샷이 기록된 매매가 2건 이상 필요합니다.
      </p>
    )
  }

  const W = 320, H = 170
  const PADL = 32, PADR = 12, PADT = 14, PADB = 26
  const innerW = W - PADL - PADR
  const innerH = H - PADT - PADB

  const timestamps = data.map(e => new Date(e.tradeDate).getTime())
  const minTs = Math.min(...timestamps)
  const maxTs = Math.max(...timestamps)
  const tsRange = maxTs - minTs || 1

  const xPos = (d: string) =>
    PADL + ((new Date(d).getTime() - minTs) / tsRange) * innerW
  const yPos = (score: number) =>
    PADT + ((1 - score) / 2) * innerH
  const y0 = yPos(0)

  // X축: 최대 4개 날짜 레이블
  const step = Math.max(1, Math.floor((data.length - 1) / 3))
  const xLabels = Array.from({ length: 4 }, (_, i) => data[Math.min(i * step, data.length - 1)])
    .filter((v, i, arr) => arr.indexOf(v) === i)

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      {/* 영역 배경: 감성 고점(긍정) */}
      <rect x={PADL} y={PADT} width={innerW} height={y0 - PADT}
        fill="#fff1f1" opacity={0.4} />
      {/* 영역 배경: 감성 저점(부정) */}
      <rect x={PADL} y={y0} width={innerW} height={PADT + innerH - y0}
        fill="#eff6ff" opacity={0.4} />

      {/* Y 그리드 라인 */}
      {([-1, -0.5, 0, 0.5, 1] as number[]).map(v => (
        <g key={v}>
          <line
            x1={PADL} y1={yPos(v)} x2={W - PADR} y2={yPos(v)}
            stroke={v === 0 ? '#8b7fd4' : '#ece9f5'}
            strokeWidth={v === 0 ? 1.5 : 0.8}
            strokeDasharray={v === 0 ? '5,3' : undefined}
          />
          <text x={PADL - 4} y={yPos(v) + 3.5} textAnchor="end" fontSize={8} fill="#c4c0d8">
            {v > 0 ? `+${v}` : v}
          </text>
        </g>
      ))}

      {/* Y축 라벨 */}
      <text
        x={9} y={PADT + innerH / 2}
        textAnchor="middle" fontSize={7} fill="#9e9ab8"
        transform={`rotate(-90, 9, ${PADT + innerH / 2})`}
      >
        감성 점수
      </text>

      {/* 영역 레이블 */}
      <text x={PADL + 4} y={PADT + 11} fontSize={7.5} fill="#ef4444" opacity={0.7} fontWeight="600">
        긍정 구간
      </text>
      <text x={PADL + 4} y={PADT + innerH - 4} fontSize={7.5} fill="#2563eb" opacity={0.7} fontWeight="600">
        부정 구간
      </text>

      {/* 매매 마커 + 수직 드롭선 */}
      {data.map((e, i) => {
        const x = xPos(e.tradeDate)
        const y = yPos(e.sentimentScore!)
        const isBuy = e.tradeType === 'BUY'
        const color = isBuy ? '#22c55e' : '#f43f5e'
        return (
          <g key={i}>
            {/* 중립선까지 드롭선 */}
            <line
              x1={x} y1={Math.min(y, y0)} x2={x} y2={Math.max(y, y0)}
              stroke={color} strokeWidth={1.2} strokeDasharray="2,2" opacity={0.5}
            />
            {/* BUY: ▲ / SELL: ▽ */}
            {isBuy ? (
              <polygon
                points={`${x},${y - 7} ${x - 5.5},${y + 3.5} ${x + 5.5},${y + 3.5}`}
                fill={color} opacity={0.9}
              />
            ) : (
              <polygon
                points={`${x},${y + 7} ${x - 5.5},${y - 3.5} ${x + 5.5},${y - 3.5}`}
                fill={color} opacity={0.9}
              />
            )}
          </g>
        )
      })}

      {/* X축 날짜 레이블 */}
      {xLabels.map((e, i) => (
        <text key={i} x={xPos(e.tradeDate)} y={H - 4}
          textAnchor="middle" fontSize={7.5} fill="#c4c0d8">
          {new Date(e.tradeDate).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
        </text>
      ))}

      {/* 범례 */}
      <g transform={`translate(${W - PADR - 70}, ${PADT})`}>
        <polygon points="6,0 0,10 12,10" fill="#22c55e" opacity={0.9} />
        <text x={16} y={9} fontSize={7.5} fill="#5e5a78">매수 BUY</text>
        <polygon points={`6,${18} 0,${14} 12,${14}`} fill="#f43f5e" opacity={0.9}
          transform={`translate(0, 8)`} />
        <text x={16} y={25} fontSize={7.5} fill="#5e5a78">매도 SELL</text>
      </g>
    </svg>
  )
}

// ──────────────────────────────────────────────
// 감성 × 수익 산점도 (4분면)
// ──────────────────────────────────────────────
function SentimentPnlScatter({ entries }: { entries: JournalEntry[] }) {
  const data = entries.filter(e => e.sentimentScore != null && e.realizedPnl != null)

  if (data.length < 3) {
    return (
      <p className="text-sm text-center py-6" style={{ color: '#c4c0d8' }}>
        감성 스냅샷 + 실현 손익이 모두 기록된 매매가 3건 이상 필요합니다.
      </p>
    )
  }

  const W = 320, H = 185
  const PADL = 48, PADR = 12, PADT = 14, PADB = 28
  const innerW = W - PADL - PADR
  const innerH = H - PADT - PADB

  const xPos = (score: number) => PADL + ((score + 1) / 2) * innerW
  const x0 = xPos(0)

  const maxAbs = Math.max(...data.map(e => Math.abs(e.realizedPnl!)), 1)
  const yPos = (pnl: number) => PADT + ((maxAbs - pnl) / (2 * maxAbs)) * innerH
  const y0 = yPos(0)

  const fmtK = (v: number) =>
    Math.abs(v) >= 1000 ? `${v >= 0 ? '+' : ''}$${(v / 1000).toFixed(1)}k`
    : `${v >= 0 ? '+' : ''}$${Math.round(v)}`

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      {/* 4분면 배경 */}
      {/* 우상단: 긍정감성 + 수익 → 순방향 */}
      <rect x={x0} y={PADT} width={W - PADR - x0} height={y0 - PADT}
        fill="#f0fdf4" opacity={0.7} />
      {/* 좌상단: 부정감성 + 수익 → 역발상 수익 ✨ */}
      <rect x={PADL} y={PADT} width={x0 - PADL} height={y0 - PADT}
        fill="#fef9c3" opacity={0.6} />
      {/* 좌하단: 부정감성 + 손실 */}
      <rect x={PADL} y={y0} width={x0 - PADL} height={PADT + innerH - y0}
        fill="#f5f4fa" opacity={0.5} />
      {/* 우하단: 긍정감성 + 손실 → 고점 매수 손실 */}
      <rect x={x0} y={y0} width={W - PADR - x0} height={PADT + innerH - y0}
        fill="#fff1f3" opacity={0.6} />

      {/* 4분면 레이블 */}
      <text x={PADL + 4} y={PADT + 11} fontSize={7.5} fill="#92400e" fontWeight="600" opacity={0.8}>
        역발상 수익 ✨
      </text>
      <text x={x0 + 4} y={PADT + 11} fontSize={7.5} fill="#166534" fontWeight="600" opacity={0.8}>
        순방향 수익
      </text>
      <text x={PADL + 4} y={PADT + innerH - 4} fontSize={7.5} fill="#9e9ab8" opacity={0.7}>
        부정 구간 손실
      </text>
      <text x={x0 + 4} y={PADT + innerH - 4} fontSize={7.5} fill="#be123c" opacity={0.8}>
        고점 매수 손실 ⚠️
      </text>

      {/* X 그리드 + 레이블 */}
      {([-1, -0.5, 0, 0.5, 1] as number[]).map(v => (
        <g key={v}>
          <line
            x1={xPos(v)} y1={PADT} x2={xPos(v)} y2={PADT + innerH}
            stroke={v === 0 ? '#8b7fd4' : '#ece9f5'}
            strokeWidth={v === 0 ? 1.5 : 0.8}
            strokeDasharray={v === 0 ? '5,3' : undefined}
          />
          <text x={xPos(v)} y={H - 5} textAnchor="middle" fontSize={8} fill="#c4c0d8">
            {v > 0 ? `+${v}` : v}
          </text>
        </g>
      ))}
      <text x={W / 2} y={H} textAnchor="middle" fontSize={7.5} fill="#9e9ab8">
        감성 점수 (매매 시점)
      </text>

      {/* Y 중립선 */}
      <line x1={PADL} y1={y0} x2={W - PADR} y2={y0}
        stroke="#8b7fd4" strokeWidth={1.5} strokeDasharray="5,3" />

      {/* Y축 레이블 */}
      <text x={PADL - 4} y={PADT + 3} textAnchor="end" fontSize={7.5} fill="#c4c0d8">
        {fmtK(maxAbs)}
      </text>
      <text x={PADL - 4} y={y0 + 4} textAnchor="end" fontSize={7.5} fill="#c4c0d8">$0</text>
      <text x={PADL - 4} y={PADT + innerH} textAnchor="end" fontSize={7.5} fill="#c4c0d8">
        {fmtK(-maxAbs)}
      </text>
      <text
        x={11} y={PADT + innerH / 2}
        textAnchor="middle" fontSize={7} fill="#9e9ab8"
        transform={`rotate(-90, 11, ${PADT + innerH / 2})`}
      >
        실현 손익
      </text>

      {/* 데이터 포인트 */}
      {data.map((e, i) => {
        const x = xPos(e.sentimentScore!)
        const y = yPos(e.realizedPnl!)
        const isBuy = e.tradeType === 'BUY'
        return (
          <g key={i}>
            <circle
              cx={x} cy={y} r={6}
              fill={isBuy ? '#22c55e' : '#f43f5e'}
              opacity={0.82}
              stroke="#fff" strokeWidth={1.5}
            />
          </g>
        )
      })}

      {/* 범례 */}
      <g transform={`translate(${PADL}, ${PADT - 2})`}>
        <circle cx={5} cy={4} r={4} fill="#22c55e" opacity={0.85} />
        <text x={12} y={8} fontSize={7.5} fill="#5e5a78">매수</text>
        <circle cx={45} cy={4} r={4} fill="#f43f5e" opacity={0.85} />
        <text x={52} y={8} fontSize={7.5} fill="#5e5a78">매도</text>
      </g>
    </svg>
  )
}

// ──────────────────────────────────────────────
function RingChart({ rate, size = 80, strokeWidth = 9 }: { rate: number; size?: number; strokeWidth?: number }) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const filled = circ * rate
  const cx = size / 2
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#ece9f5" strokeWidth={strokeWidth} />
      <circle
        cx={cx} cy={cx} r={r} fill="none"
        stroke={rate >= 0.7 ? '#8b7fd4' : rate >= 0.4 ? '#f59e0b' : '#f43f5e'}
        strokeWidth={strokeWidth}
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
    </svg>
  )
}

function InsightsTab({ entries, portfolio }: { entries: JournalEntry[]; portfolio: PositionSummary[] }) {
  // ── 빈 상태 ──
  if (entries.length < 3) {
    return (
      <div className="flex flex-col items-center justify-center py-10 rounded-2xl gap-6"
        style={{ background: '#ffffff', boxShadow: '0 2px 12px rgba(139,127,212,0.08)' }}>
        <div className="text-5xl">🔍</div>
        <div className="text-center">
          <p className="font-semibold text-gray-700 mb-1">아직 데이터가 부족해요</p>
          <p className="text-sm text-gray-400">매매 기록 3건 이상이면 패턴을 분석할 수 있어요</p>
        </div>
        {/* 미리보기 카드 */}
        <div className="w-full max-w-sm px-4 space-y-3">
          {[
            { icon: '🤖', title: 'AI 신호 일치율', desc: 'AI가 추천한 방향으로 몇 번이나 매매했나요?' },
            { icon: '📊', title: '감성별 수익 패턴', desc: '어떤 시장 감성에서 수익이 났나요?' },
            { icon: '💡', title: '인사이트 요약', desc: '나만의 투자 성향을 텍스트로 분석해요' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: '#f8f7fd', border: '1px dashed #d0cbee' }}>
              <span className="text-xl">{icon}</span>
              <div>
                <p className="text-xs font-semibold text-gray-600">{title}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400">현재 {entries.length}건 / 3건 필요</p>
      </div>
    )
  }

  // ── 집계 ──

  // 1) AI 신호 일치율
  const signalEntries   = entries.filter(e => e.signalMatched !== null && e.signalMatched !== undefined)
  const matchedCount    = signalEntries.filter(e => e.signalMatched === true).length
  const overallRate     = signalEntries.length > 0 ? matchedCount / signalEntries.length : null

  // 2) 감성별 패턴
  type SentimentStat = { count: number; buy: number; sell: number; pnlSum: number; pnlCount: number }
  const bysentiment: Record<string, SentimentStat> = {}
  for (const e of entries) {
    const key = e.sentimentLabel ?? 'NEUTRAL'
    if (!bysentiment[key]) bysentiment[key] = { count: 0, buy: 0, sell: 0, pnlSum: 0, pnlCount: 0 }
    bysentiment[key].count++
    if (e.tradeType === 'BUY') bysentiment[key].buy++
    else bysentiment[key].sell++
    if (e.realizedPnl != null) { bysentiment[key].pnlSum += e.realizedPnl; bysentiment[key].pnlCount++ }
  }
  const sentimentKeys = Object.keys(bysentiment).sort((a, b) => bysentiment[b].count - bysentiment[a].count)

  // 3) 가장 수익이 좋은 감성
  let bestSentiment: string | null = null
  let bestAvg = -Infinity
  for (const k of sentimentKeys) {
    const s = bysentiment[k]
    if (s.pnlCount > 0) {
      const avg = s.pnlSum / s.pnlCount
      if (avg > bestAvg) { bestAvg = avg; bestSentiment = k }
    }
  }

  // 4) 종목별 일치율 (portfolio에서)
  const tickerRates = portfolio
    .filter(p => p.signalMatchRate != null)
    .sort((a, b) => (b.signalMatchRate ?? 0) - (a.signalMatchRate ?? 0))

  return (
    <div className="space-y-5">

      {/* ── 섹션 1: AI 신호 일치율 ── */}
      <div style={CARD}>
        <h3 className="text-sm font-bold mb-4" style={{ color: '#18162a' }}>🤖 AI 신호 일치율</h3>

        {overallRate === null ? (
          <p className="text-sm text-gray-400">AI 신호가 기록된 매매가 없습니다.</p>
        ) : (
          <>
            {/* 전체 */}
            <div className="flex items-center gap-6 mb-5">
              <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: 80, height: 80 }}>
                <RingChart rate={overallRate} />
                <span className="absolute text-base font-bold" style={{ color: '#18162a' }}>
                  {Math.round(overallRate * 100)}%
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">전체 일치율</p>
                <p className="text-2xl font-bold mb-1" style={{ color: overallRate >= 0.7 ? '#8b7fd4' : overallRate >= 0.4 ? '#f59e0b' : '#f43f5e' }}>
                  {Math.round(overallRate * 100)}%
                </p>
                <p className="text-xs" style={{ color: '#9e9ab8' }}>
                  {matchedCount}건 일치 / {signalEntries.length}건 기록
                </p>
                <p className="text-xs mt-1 font-medium" style={{
                  color: overallRate >= 0.7 ? '#8b7fd4' : overallRate >= 0.4 ? '#d97706' : '#f43f5e'
                }}>
                  {overallRate >= 0.7 ? '✨ AI 신호를 잘 따르고 있어요!'
                    : overallRate >= 0.4 ? '⚠️ AI 신호와 반대 매매가 많아요'
                    : '❌ AI 신호를 자주 역행하고 있어요'}
                </p>
              </div>
            </div>

            {/* 종목별 바 */}
            {tickerRates.length > 0 && (
              <div className="space-y-2.5">
                <p className="text-xs text-gray-400 mb-2">종목별 일치율</p>
                {tickerRates.map(p => (
                  <div key={p.ticker}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold" style={{ color: '#18162a' }}>{p.ticker}</span>
                      <span className="text-xs font-semibold" style={{
                        color: (p.signalMatchRate ?? 0) >= 0.7 ? '#8b7fd4'
                          : (p.signalMatchRate ?? 0) >= 0.4 ? '#f59e0b' : '#f43f5e'
                      }}>
                        {Math.round((p.signalMatchRate ?? 0) * 100)}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: '#ece9f5' }}>
                      <div className="h-full rounded-full transition-all" style={{
                        width: `${Math.round((p.signalMatchRate ?? 0) * 100)}%`,
                        background: (p.signalMatchRate ?? 0) >= 0.7 ? '#8b7fd4'
                          : (p.signalMatchRate ?? 0) >= 0.4 ? '#f59e0b' : '#f43f5e',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── 섹션 2: 감성별 매매 패턴 ── */}
      <div style={CARD}>
        <h3 className="text-sm font-bold mb-4" style={{ color: '#18162a' }}>📊 감성별 매매 패턴</h3>

        {sentimentKeys.length === 0 ? (
          <p className="text-sm text-gray-400">감성 스냅샷이 기록된 매매가 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {sentimentKeys.map(key => {
              const s = bysentiment[key]
              const meta = SENTIMENT_META[key] ?? SENTIMENT_META['NEUTRAL']
              const avgPnl = s.pnlCount > 0 ? s.pnlSum / s.pnlCount : null
              const buyPct = s.count > 0 ? (s.buy / s.count) : 0
              return (
                <div key={key} className="rounded-xl p-4" style={{ background: meta.bg, border: `1px solid ${meta.color}22` }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{meta.emoji}</span>
                      <span className="text-sm font-bold" style={{ color: meta.color }}>{meta.label} 감성</span>
                      {key === bestSentiment && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: '#fef3c7', color: '#92400e' }}>
                          최고 수익
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{s.count}건</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {/* 매수/매도 비율 */}
                    <div>
                      <p className="text-xs text-gray-400 mb-1.5">매수 비율</p>
                      <div className="h-1.5 rounded-full mb-1" style={{ background: '#e5e7eb' }}>
                        <div className="h-full rounded-full" style={{ width: `${buyPct * 100}%`, background: '#22c55e' }} />
                      </div>
                      <p className="text-xs font-semibold text-gray-600">
                        매수 {s.buy} / 매도 {s.sell}
                      </p>
                    </div>

                    {/* 평균 실현 손익 */}
                    <div>
                      <p className="text-xs text-gray-400 mb-1">평균 손익</p>
                      {avgPnl != null ? (
                        <p className="text-sm font-bold" style={{ color: avgPnl >= 0 ? '#22c55e' : '#f43f5e' }}>
                          {avgPnl >= 0 ? '+' : ''}{fmt.amount(avgPnl)}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400">–</p>
                      )}
                    </div>

                    {/* 누적 손익 */}
                    <div>
                      <p className="text-xs text-gray-400 mb-1">누적 손익</p>
                      {s.pnlCount > 0 ? (
                        <p className="text-sm font-bold" style={{ color: s.pnlSum >= 0 ? '#22c55e' : '#f43f5e' }}>
                          {s.pnlSum >= 0 ? '+' : ''}{fmt.amount(s.pnlSum)}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400">–</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── 섹션 3: 인사이트 요약 ── */}
      <div style={CARD}>
        <h3 className="text-sm font-bold mb-3" style={{ color: '#18162a' }}>💡 인사이트 요약</h3>
        <div className="space-y-2">
          {/* AI 신호 */}
          {overallRate !== null && (
            <div className="flex items-start gap-2 text-sm text-gray-600 leading-relaxed">
              <span className="mt-0.5 flex-shrink-0">
                {overallRate >= 0.7 ? '✅' : overallRate >= 0.4 ? '⚠️' : '🔴'}
              </span>
              <span>
                {overallRate >= 0.7
                  ? `AI 신호를 ${Math.round(overallRate * 100)}%의 높은 일치율로 따르고 있어요. 체계적인 투자를 하고 있어요!`
                  : overallRate >= 0.4
                  ? `AI 신호와 ${Math.round((1 - overallRate) * 100)}%의 매매가 반대 방향이에요. 신호를 더 참고해보세요.`
                  : `AI 신호를 자주 역행하고 있어요. 감성 분석 결과를 더 적극적으로 활용해보세요.`}
              </span>
            </div>
          )}

          {/* 감성 패턴 */}
          {bestSentiment && bysentiment[bestSentiment].pnlCount > 0 && (
            <div className="flex items-start gap-2 text-sm text-gray-600 leading-relaxed">
              <span className="mt-0.5 flex-shrink-0">📈</span>
              <span>
                <strong style={{ color: SENTIMENT_META[bestSentiment]?.color }}>
                  {SENTIMENT_META[bestSentiment]?.label} 감성
                </strong>
                {' '}일 때 평균 <strong style={{ color: '#22c55e' }}>+{fmt.amount(bestAvg)}</strong>로 가장 높은 수익을 기록했어요.
              </span>
            </div>
          )}

          {/* 역행 매매 */}
          {(() => {
            const contraryCount = entries.filter(e => e.signalMatched === false).length
            if (contraryCount === 0) return null
            return (
              <div className="flex items-start gap-2 text-sm text-gray-600 leading-relaxed">
                <span className="mt-0.5 flex-shrink-0">⚠️</span>
                <span>
                  총 <strong className="text-amber-600">{contraryCount}건</strong>의 AI 역행 매매가 있어요. 역행 시 손실이 발생했는지 확인해보세요.
                </span>
              </div>
            )
          })()}

          {/* 가장 많이 거래한 감성 */}
          {sentimentKeys.length > 0 && (() => {
            const topKey = sentimentKeys[0]
            const topMeta = SENTIMENT_META[topKey] ?? SENTIMENT_META['NEUTRAL']
            const topPct = Math.round((bysentiment[topKey].count / entries.length) * 100)
            return (
              <div className="flex items-start gap-2 text-sm text-gray-600 leading-relaxed">
                <span className="mt-0.5 flex-shrink-0">{topMeta.emoji}</span>
                <span>
                  매매의 <strong>{topPct}%</strong>가{' '}
                  <strong style={{ color: topMeta.color }}>{topMeta.label} 감성</strong> 구간에서 이루어졌어요.
                </span>
              </div>
            )
          })()}
        </div>
      </div>

      {/* ── 섹션 4: 감성 타이밍 차트 ── */}
      {entries.some(e => e.sentimentScore != null) && (
        <div style={CARD}>
          <h3 className="text-sm font-bold mb-1" style={{ color: '#18162a' }}>
            📍 매매 타이밍 vs 감성 점수
          </h3>
          <p className="text-xs mb-4" style={{ color: '#9e9ab8' }}>
            매수(▲)·매도(▽) 시점의 감성 점수를 시계열로 표시합니다.
            <br />긍정 고점에서 매수하면 추격 매수, 부정 저점에서 매수하면 역발상 매수예요.
          </p>
          <SentimentTimingChart entries={entries} />
          {/* 요약 통계 */}
          {(() => {
            const buyWithSentiment = entries.filter(e => e.tradeType === 'BUY' && e.sentimentScore != null)
            const sellWithSentiment = entries.filter(e => e.tradeType === 'SELL' && e.sentimentScore != null)
            const avgBuyScore = buyWithSentiment.length > 0
              ? buyWithSentiment.reduce((s, e) => s + e.sentimentScore!, 0) / buyWithSentiment.length
              : null
            const avgSellScore = sellWithSentiment.length > 0
              ? sellWithSentiment.reduce((s, e) => s + e.sentimentScore!, 0) / sellWithSentiment.length
              : null
            if (avgBuyScore === null && avgSellScore === null) return null
            return (
              <div className="grid grid-cols-2 gap-3 mt-4">
                {avgBuyScore !== null && (
                  <div className="rounded-xl p-3 text-center" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <p className="text-xs mb-1" style={{ color: '#16a34a' }}>매수 평균 감성</p>
                    <p className="text-lg font-bold" style={{ color: '#22c55e' }}>
                      {avgBuyScore > 0 ? '+' : ''}{avgBuyScore.toFixed(2)}
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#9e9ab8' }}>
                      {avgBuyScore > 0.3 ? '⚠️ 긍정 고점 추격 경향' : avgBuyScore < -0.2 ? '✨ 역발상 매수 경향' : '− 중립 구간 매수'}
                    </p>
                  </div>
                )}
                {avgSellScore !== null && (
                  <div className="rounded-xl p-3 text-center" style={{ background: '#fff1f3', border: '1px solid #fecdd3' }}>
                    <p className="text-xs mb-1" style={{ color: '#f43f5e' }}>매도 평균 감성</p>
                    <p className="text-lg font-bold" style={{ color: '#f43f5e' }}>
                      {avgSellScore > 0 ? '+' : ''}{avgSellScore.toFixed(2)}
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#9e9ab8' }}>
                      {avgSellScore < -0.3 ? '✨ 공포 구간 손절 경향' : avgSellScore > 0.2 ? '− 고점 익절 경향' : '− 중립 구간 매도'}
                    </p>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      )}

      {/* ── 섹션 5: 감성 × 수익 산점도 ── */}
      {entries.some(e => e.sentimentScore != null && e.realizedPnl != null) && (
        <div style={CARD}>
          <h3 className="text-sm font-bold mb-1" style={{ color: '#18162a' }}>
            🔬 감성 점수 × 실현 손익 상관관계
          </h3>
          <p className="text-xs mb-4" style={{ color: '#9e9ab8' }}>
            매매 시점의 감성 점수와 실현 손익의 관계를 4분면으로 분석합니다.
            <br />좌상단(역발상 수익)이 많을수록 역행 매매 전략이 유효한 투자자입니다.
          </p>
          <SentimentPnlScatter entries={entries} />
          {/* 분면별 집계 */}
          {(() => {
            const withBoth = entries.filter(e => e.sentimentScore != null && e.realizedPnl != null)
            const q = {
              contrarian: withBoth.filter(e => e.sentimentScore! < 0 && e.realizedPnl! > 0).length,
              follow:     withBoth.filter(e => e.sentimentScore! > 0 && e.realizedPnl! > 0).length,
              fearLoss:   withBoth.filter(e => e.sentimentScore! < 0 && e.realizedPnl! < 0).length,
              chaseLoss:  withBoth.filter(e => e.sentimentScore! > 0 && e.realizedPnl! < 0).length,
            }
            const total = withBoth.length
            if (total === 0) return null
            return (
              <div className="grid grid-cols-2 gap-2 mt-4">
                {[
                  { label: '역발상 수익 ✨', count: q.contrarian, color: '#92400e', bg: '#fef9c3' },
                  { label: '순방향 수익',   count: q.follow,     color: '#166534', bg: '#f0fdf4' },
                  { label: '부정 구간 손실', count: q.fearLoss,   color: '#9e9ab8', bg: '#f5f4fa' },
                  { label: '고점 매수 손실 ⚠️', count: q.chaseLoss, color: '#be123c', bg: '#fff1f3' },
                ].map(({ label, count, color, bg }) => (
                  <div key={label} className="rounded-xl p-3 flex items-center justify-between" style={{ background: bg }}>
                    <p className="text-xs font-semibold" style={{ color }}>{label}</p>
                    <p className="text-base font-bold" style={{ color }}>
                      {count}건
                      <span className="text-xs font-normal ml-1" style={{ color: '#9e9ab8' }}>
                        ({total > 0 ? Math.round(count / total * 100) : 0}%)
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
// 메인 페이지
// ──────────────────────────────────────────────

export default function JournalPage() {
  const [entries, setEntries]       = useState<JournalEntry[]>([])
  const [portfolio, setPortfolio]   = useState<PositionSummary[]>([])
  const [tickers, setTickers]       = useState<string[]>(FALLBACK_TICKERS)
  const [loading, setLoading]       = useState(true)
  const [authError, setAuthError]   = useState(false)
  const [showAdd, setShowAdd]       = useState(false)
  const [filterTicker, setFilterTicker] = useState('')
  const [activeTab, setActiveTab]   = useState<'list' | 'portfolio' | 'insights'>('list')

  // 지원 티커 목록 초기 로드 (application.properties 기준)
  useEffect(() => {
    stockApi.getSupportedTickers()
      .then(t => { if (t.length > 0) setTickers(t) })
      .catch(() => { /* 폴백 유지 */ })
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    setAuthError(false)
    try {
      // Promise.allSettled: 둘 중 하나 실패해도 나머지 결과는 반영
      const [journalResult, portfolioResult] = await Promise.allSettled([
        journalApi.getJournals(filterTicker ? { ticker: filterTicker } : undefined),
        journalApi.getPortfolioSummary(),
      ])

      // 두 요청 모두 실패 → 인증 오류 감지
      const bothFailed = journalResult.status === 'rejected' && portfolioResult.status === 'rejected'
      if (bothFailed) {
        const errMsg = (journalResult.reason as Error)?.message ?? ''
        if (errMsg.includes('인증') || errMsg.includes('로그인')) {
          setAuthError(true)
        }
        setLoading(false)
        return
      }

      const safeJ = journalResult.status === 'fulfilled'
        ? (Array.isArray(journalResult.value) ? journalResult.value : [])
        : null
      const safeP = portfolioResult.status === 'fulfilled'
        ? (Array.isArray(portfolioResult.value) ? portfolioResult.value : [])
        : null

      // 포트폴리오 독립 반영
      if (safeP !== null) setPortfolio(safeP)

      // 폴백 조건: 필터 없음 + (실패 OR 빈 배열 반환) + portfolio에 실제 종목 있음
      const needsFallback = !filterTicker
        && (safeJ === null || safeJ.length === 0)
        && safeP !== null && safeP.length > 0

      if (needsFallback) {
        // GET /api/journal 이 빈 배열 반환 → 포트폴리오 티커별 개별 조회 후 합산
        const ptickers = safeP!.map(p => p.ticker)
        const results = await Promise.allSettled(
          ptickers.map(t => journalApi.getJournals({ ticker: t }))
        )
        const combined = results
          .filter((r): r is PromiseFulfilledResult<JournalEntry[]> => r.status === 'fulfilled')
          .flatMap(r => r.value)
          .sort((a, b) => {
            const d = new Date(b.tradeDate).getTime() - new Date(a.tradeDate).getTime()
            return d !== 0 ? d : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          })
        setEntries(combined)
      } else {
        setEntries(safeJ ?? [])
      }
    } catch { /* 예외적 전체 실패 시 빈 배열 유지 */ }
    finally { setLoading(false) }
  }, [filterTicker])

  useEffect(() => { loadData() }, [loadData])

  async function handleDelete(id: number) {
    if (!confirm('이 기록을 삭제할까요?')) return
    try { await journalApi.deleteJournal(id); loadData() }
    catch { alert('삭제에 실패했습니다.') }
  }

  const totalBuy      = entries.filter(e => e.tradeType === 'BUY').reduce((s, e) => s + e.totalAmount, 0)
  const totalSell     = entries.filter(e => e.tradeType === 'SELL').reduce((s, e) => s + e.totalAmount, 0)
  const totalPnl      = entries.reduce((s, e) => s + (e.realizedPnl ?? 0), 0)
  const contraryCount = entries.filter(e => e.signalMatched === false).length

  return (
    <div className="min-h-screen w-full" style={{ background: '#f5f4fa' }}>
      {/* 헤더 */}
      <div className="sticky top-0 z-30 px-4 sm:px-6 py-3 sm:py-4"
        style={{ background: '#ffffff', borderBottom: '1px solid #ece9f5', boxShadow: '0 1px 6px rgba(139,127,212,0.06)' }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold" style={{ color: '#18162a' }}>📒 투자 일지</h1>
            <p className="text-xs mt-0.5 hidden sm:block" style={{ color: '#9e9ab8' }}>
              AI 신호 대비 실제 매매를 기록하고 분석하세요
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="shrink-0 flex items-center gap-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #8b7fd4, #6a5fc4)', boxShadow: '0 4px 12px rgba(139,127,212,0.3)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span>추가</span>
          </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* 요약 카드 4개 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: '총 매수',   value: fmt.amount(totalBuy),  color: '#22c55e' },
            { label: '총 매도',   value: fmt.amount(totalSell), color: '#f43f5e' },
            {
              label: '실현 손익',
              value: entries.some(e => e.realizedPnl != null)
                ? (totalPnl >= 0 ? '+' : '') + fmt.amount(totalPnl)
                : '–',
              color: totalPnl > 0 ? '#22c55e' : totalPnl < 0 ? '#f43f5e' : '#9e9ab8',
            },
            {
              label: 'AI 역행 매매',
              value: `${contraryCount}건`,
              color: contraryCount > 0 ? '#f59e0b' : '#9e9ab8',
            },
          ].map(({ label, value, color }) => (
            <div key={label} style={CARD}>
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className="text-lg font-bold" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── 인증 오류 배너 ── */}
        {authError && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: '#fff1f3', border: '1.5px solid #fda4af' }}>
            <span className="text-lg">🔒</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: '#e11d48' }}>로그인이 필요합니다</p>
              <p className="text-xs mt-0.5" style={{ color: '#9e9ab8' }}>투자 일지를 보려면 로그인 후 이용해 주세요.</p>
            </div>
            <a href="/login"
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
              style={{ background: '#e11d48' }}>
              로그인
            </a>
          </div>
        )}

        {/* ── 공유 티커 필터 (탭 위) — 내 투자 종목만 표시 ── */}
        {portfolio.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setFilterTicker('')}
              className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{
                background: filterTicker === '' ? '#8b7fd4' : '#ffffff',
                color:      filterTicker === '' ? '#fff' : '#9e9ab8',
                border:     `1.5px solid ${filterTicker === '' ? '#8b7fd4' : '#ece9f5'}`,
              }}>
              전체
            </button>

            {portfolio.map(p => p.ticker).sort().map(t => (
              <button key={t} onClick={() => setFilterTicker(filterTicker === t ? '' : t)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: filterTicker === t ? '#f0eefb' : '#ffffff',
                  color:      filterTicker === t ? '#8b7fd4' : '#9e9ab8',
                  border:     `1.5px solid ${filterTicker === t ? '#8b7fd4' : '#ece9f5'}`,
                }}>
                {t}
              </button>
            ))}
          </div>
        )}

        {/* 탭 */}
        <div className="flex gap-1 rounded-xl p-1 w-full sm:w-fit" style={{ background: '#ece9f5' }}>
          {([
            { key: 'list',      label: '매매 기록' },
            { key: 'portfolio', label: '포지션 요약' },
            { key: 'insights',  label: '내 패턴' },
          ] as { key: 'list' | 'portfolio' | 'insights'; label: string }[]).map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: activeTab === key ? '#ffffff' : 'transparent',
                color:      activeTab === key ? '#8b7fd4' : '#9e9ab8',
                fontWeight: activeTab === key ? 600 : 400,
                boxShadow:  activeTab === key ? '0 1px 4px rgba(139,127,212,0.15)' : 'none',
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── 매매 기록 탭 ── */}
        {activeTab === 'list' && (
          loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: '#e9e6f5' }} />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl"
              style={{ background: '#ffffff', boxShadow: '0 2px 12px rgba(139,127,212,0.08)' }}>
              <div className="text-4xl mb-3">📭</div>
              <p className="text-gray-500 font-medium">
                {filterTicker ? `${filterTicker} 매매 기록이 없습니다` : '기록이 없습니다'}
              </p>
              <p className="text-gray-400 text-sm mt-1">&quot;추가&quot; 버튼으로 첫 매매를 기록해보세요.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map(e => (
                <JournalRow key={e.id} entry={e} onDelete={handleDelete} />
              ))}
            </div>
          )
        )}

        {/* ── 포지션 요약 탭 ── */}
        {activeTab === 'portfolio' && (() => {
          // filterTicker 설정 시 해당 티커만 표시
          const visiblePortfolio = filterTicker
            ? portfolio.filter(p => p.ticker === filterTicker)
            : portfolio

          return loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map(i => (
                <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ background: '#e9e6f5' }} />
              ))}
            </div>
          ) : visiblePortfolio.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl"
              style={{ background: '#ffffff', boxShadow: '0 2px 12px rgba(139,127,212,0.08)' }}>
              <div className="text-4xl mb-3">📊</div>
              <p className="text-gray-500 font-medium">
                {filterTicker ? `${filterTicker} 포지션이 없습니다` : '매매 기록이 없습니다'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {visiblePortfolio.map(p => <PositionCard key={p.ticker} pos={p} />)}
            </div>
          )
        })()}

        {/* ── 내 패턴 탭 ── */}
        {activeTab === 'insights' && (
          loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-36 rounded-2xl animate-pulse" style={{ background: '#e9e6f5' }} />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl"
              style={{ background: '#ffffff', boxShadow: '0 2px 12px rgba(139,127,212,0.08)' }}>
              <div className="text-4xl mb-3">📈</div>
              <p className="text-gray-500 font-medium">
                {filterTicker ? `${filterTicker} 매매 기록이 없습니다` : '매매 기록이 없습니다'}
              </p>
              <p className="text-gray-400 text-sm mt-1">기록을 추가하면 패턴이 분석됩니다.</p>
            </div>
          ) : (
            <InsightsTab entries={entries} portfolio={portfolio} />
          )
        )}
      </main>

      {showAdd && (
        <AddJournalModal
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); loadData() }}
          portfolio={portfolio}
          tickers={tickers}
        />
      )}
    </div>
  )
}
