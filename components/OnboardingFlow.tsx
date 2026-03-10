'use client'

import { useState, useEffect, useCallback } from 'react'
import { watchlistApi, api } from '@/lib/api'

// ── 상수 ────────────────────────────────────────────────────
const STORAGE_KEY = 'luminsight_onboarding_done'

const POPULAR_TICKERS = [
  { ticker: 'AAPL',  name: '애플',         emoji: '🍎',  sector: '테크' },
  { ticker: 'TSLA',  name: '테슬라',        emoji: '⚡',  sector: '전기차' },
  { ticker: 'NVDA',  name: '엔비디아',      emoji: '🎮',  sector: 'AI 반도체' },
  { ticker: 'MSFT',  name: '마이크로소프트', emoji: '🪟',  sector: '테크' },
  { ticker: 'GOOGL', name: '구글',          emoji: '🔍',  sector: '빅테크' },
  { ticker: 'AMZN',  name: '아마존',        emoji: '📦',  sector: '이커머스' },
  { ticker: 'META',  name: '메타',          emoji: '📘',  sector: 'SNS' },
  { ticker: 'NFLX',  name: '넷플릭스',      emoji: '🎬',  sector: '엔터테인먼트' },
  { ticker: 'AMD',   name: 'AMD',           emoji: '💻',  sector: '반도체' },
  { ticker: 'SPY',   name: 'S&P500 ETF',    emoji: '📊',  sector: 'ETF' },
]

// ── VAPID 유틸 ────────────────────────────────────────────
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const outputArray = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// ── ServiceWorker ready (타임아웃 포함) ───────────────────
// iOS 등에서 SW 설치 실패 시 navigator.serviceWorker.ready가
// 영원히 pending 상태로 남아 있는 버그 방지
function swReady(timeoutMs = 8000): Promise<ServiceWorkerRegistration> {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('서비스 워커 준비 시간 초과')), timeoutMs)
    ),
  ])
}

// ── 타입 ─────────────────────────────────────────────────
interface Props {
  onComplete: (selectedTickers: string[]) => void
}

// ── 단계 인디케이터 ────────────────────────────────────────
function StepDot({ active, done }: { active: boolean; done: boolean }) {
  return (
    <span
      className="transition-all duration-300"
      style={{
        display: 'inline-block',
        width:   active ? 20 : 8,
        height:  8,
        borderRadius: 4,
        background: done || active ? '#8b7fd4' : '#e0dbf5',
      }}
    />
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────
export default function OnboardingFlow({ onComplete }: Props) {
  const [step, setStep]             = useState(1) // 1 | 2 | 3
  const [selected, setSelected]     = useState<Set<string>>(new Set())
  const [customInput, setCustomInput] = useState('')
  const [saving, setSaving]         = useState(false)
  const [pushState, setPushState]   = useState<'idle' | 'loading' | 'done' | 'denied' | 'error'>('idle')
  const [pushError, setPushError]   = useState<string | null>(null)
  const [animating, setAnimating]   = useState(false)

  // 애니메이션과 함께 다음 단계로
  const goNext = useCallback((nextStep: number) => {
    setAnimating(true)
    setTimeout(() => {
      setStep(nextStep)
      setAnimating(false)
    }, 200)
  }, [])

  const toggleTicker = (ticker: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(ticker)) next.delete(ticker)
      else next.add(ticker)
      return next
    })
  }

  const addCustom = () => {
    const t = customInput.trim().toUpperCase()
    if (t && t.length <= 10) {
      setSelected(prev => new Set([...prev, t]))
      setCustomInput('')
    }
  }

  // Step 2 완료 → 관심 종목 저장
  const handleSaveTickers = async () => {
    setSaving(true)
    try {
      const tickers = Array.from(selected)
      for (const t of tickers) {
        await watchlistApi.addTicker(t)
      }
    } catch { /* silent */ }
    setSaving(false)
    goNext(3)
  }

  // Step 3 푸시 알림 구독
  const handleEnablePush = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      // 브라우저가 알림을 지원하지 않으면 바로 완료 처리
      handleFinish()
      return
    }
    setPushState('loading')
    setPushError(null)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setPushState('denied')
        return
      }
      const { data } = await api.get<{ publicKey: string }>('/push/vapid-public-key')
      const applicationServerKey = urlBase64ToUint8Array(data.publicKey)
      // swReady(): 타임아웃 포함 — iOS에서 SW 설치 실패 시 무한 대기 방지
      const reg = await swReady(8000)
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })
      const subJson = sub.toJSON()
      await api.post('/push/subscribe', {
        endpoint:  sub.endpoint,
        p256dh:    subJson.keys?.p256dh ?? '',
        auth:      subJson.keys?.auth ?? '',
        userAgent: navigator.userAgent.slice(0, 200),
      })
      setPushState('done')
      setTimeout(handleFinish, 1200)
    } catch (e) {
      const msg = e instanceof Error ? e.message : '알 수 없는 오류'
      setPushError(msg)
      setPushState('error')
    }
  }

  const handleFinish = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    onComplete(Array.from(selected))
  }

  // ── 단계별 렌더 ──────────────────────────────────────────
  const content = (() => {
    if (step === 1) return (
      <div className="text-center">
        {/* 로고 */}
        <div className="mx-auto mb-5 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
          style={{ background: 'linear-gradient(135deg, #8b7fd4, #6a5fc4)', boxShadow: '0 8px 24px rgba(139,127,212,0.4)' }}>
          🔮
        </div>

        <h2 className="text-2xl font-bold mb-2" style={{ color: '#18162a' }}>
          LuminSight에 오신 것을<br />환영합니다!
        </h2>
        <p className="text-sm leading-relaxed mb-8" style={{ color: '#6b7280', maxWidth: 280, margin: '8px auto 32px' }}>
          AI가 실시간으로 주식 뉴스를 읽고 감성을 분석해 드립니다.
          투자 습관을 기록하고 패턴을 발견하세요.
        </p>

        {/* 핵심 기능 3가지 */}
        <div className="space-y-3 text-left mb-8">
          {[
            { icon: '📊', title: '실시간 감성 분석',   desc: 'GPT-4o가 뉴스를 긍정·부정으로 분류' },
            { icon: '📒', title: '투자 일지',           desc: 'AI 신호 대비 내 매매 패턴 기록' },
            { icon: '🔔', title: '이상 감지 알림',      desc: '감성 급변 시 즉시 푸시 알림' },
          ].map(f => (
            <div key={f.icon} className="flex items-center gap-3 p-3 rounded-2xl"
              style={{ background: '#f5f4fa' }}>
              <span className="text-xl w-8 text-center">{f.icon}</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#18162a' }}>{f.title}</p>
                <p className="text-xs" style={{ color: '#9e9ab8' }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => goNext(2)}
          className="w-full py-3.5 rounded-2xl text-base font-bold text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #8b7fd4, #6a5fc4)', boxShadow: '0 6px 20px rgba(139,127,212,0.35)' }}
        >
          시작하기 →
        </button>
      </div>
    )

    if (step === 2) return (
      <div>
        <div className="text-center mb-6">
          <span className="text-3xl mb-3 block">📈</span>
          <h2 className="text-xl font-bold mb-1" style={{ color: '#18162a' }}>관심 종목을 선택하세요</h2>
          <p className="text-sm" style={{ color: '#9e9ab8' }}>
            분석하고 싶은 종목을 1개 이상 선택하세요
          </p>
        </div>

        {/* 인기 종목 그리드 */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {POPULAR_TICKERS.map(({ ticker, name, emoji, sector }) => {
            const isSelected = selected.has(ticker)
            return (
              <button
                key={ticker}
                onClick={() => toggleTicker(ticker)}
                className="flex items-center gap-2.5 p-3 rounded-xl text-left transition-all"
                style={{
                  background: isSelected ? '#f0eefb' : '#ffffff',
                  border: `1.5px solid ${isSelected ? '#8b7fd4' : '#ece9f5'}`,
                  boxShadow: isSelected ? '0 2px 8px rgba(139,127,212,0.15)' : 'none',
                }}
              >
                <span className="text-xl">{emoji}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold" style={{ color: isSelected ? '#8b7fd4' : '#18162a' }}>
                    {ticker}
                  </p>
                  <p className="text-xs truncate" style={{ color: '#9e9ab8' }}>{sector}</p>
                </div>
                {isSelected && (
                  <span className="ml-auto shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                    style={{ background: '#8b7fd4', color: '#fff' }}>✓</span>
                )}
              </button>
            )
          })}
        </div>

        {/* 직접 입력 */}
        <div className="flex gap-2 mb-5">
          <input
            type="text"
            value={customInput}
            onChange={e => setCustomInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && addCustom()}
            placeholder="직접 입력 (예: BABA, 005930)"
            maxLength={10}
            className="flex-1 px-3 py-2 text-sm rounded-xl outline-none transition-all uppercase"
            style={{ background: '#f8f7fd', border: '1.5px solid #ece9f5', color: '#18162a' }}
            onFocus={e => (e.target.style.borderColor = '#8b7fd4')}
            onBlur={e => (e.target.style.borderColor = '#ece9f5')}
          />
          <button
            onClick={addCustom}
            disabled={!customInput.trim()}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
            style={{ background: '#8b7fd4', color: '#fff' }}
          >
            추가
          </button>
        </div>

        {/* 선택된 커스텀 종목 태그 */}
        {Array.from(selected).filter(t => !POPULAR_TICKERS.find(p => p.ticker === t)).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {Array.from(selected)
              .filter(t => !POPULAR_TICKERS.find(p => p.ticker === t))
              .map(t => (
                <span
                  key={t}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold"
                  style={{ background: '#f0eefb', color: '#8b7fd4', border: '1px solid #d4cff2' }}
                >
                  {t}
                  <button onClick={() => toggleTicker(t)} style={{ lineHeight: 1 }}>×</button>
                </span>
              ))}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleFinish}
            className="py-3 rounded-2xl text-sm font-medium transition-all"
            style={{ color: '#9e9ab8', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            건너뛰기
          </button>
          <button
            onClick={handleSaveTickers}
            disabled={selected.size === 0 || saving}
            className="flex-1 py-3 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #8b7fd4, #6a5fc4)', boxShadow: '0 4px 16px rgba(139,127,212,0.3)' }}
          >
            {saving ? '저장 중...' : `${selected.size > 0 ? selected.size + '개 선택 · ' : ''}다음 →`}
          </button>
        </div>
      </div>
    )

    // Step 3
    return (
      <div className="text-center">
        <span className="text-4xl mb-4 block">
          {pushState === 'done' ? '🎉' : '🔔'}
        </span>

        {pushState === 'done' ? (
          <>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#18162a' }}>준비 완료!</h2>
            <p className="text-sm" style={{ color: '#9e9ab8' }}>
              감성이 급변하면 바로 알려드릴게요
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#18162a' }}>
              실시간 알림을 받으시겠어요?
            </h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#6b7280', maxWidth: 260, margin: '8px auto 24px' }}>
              감성 급변이나 키워드 감지 시<br />
              즉시 푸시 알림을 보내드립니다.
            </p>

            {pushState === 'denied' ? (
              <div className="mb-6 p-4 rounded-2xl text-sm" style={{ background: '#fef3c7', color: '#92400e' }}>
                브라우저 설정에서 알림을 허용해주세요. 나중에 알림 설정 탭에서도 켤 수 있습니다.
              </div>
            ) : pushState === 'error' ? (
              <div className="mb-6 p-4 rounded-2xl text-sm" style={{ background: '#fff1f3', color: '#be123c' }}>
                <p className="font-semibold mb-1">알림 설정에 실패했습니다</p>
                <p className="text-xs" style={{ color: '#9e9ab8' }}>{pushError}</p>
                <p className="text-xs mt-2" style={{ color: '#be123c' }}>
                  나중에 설정 탭에서 다시 시도할 수 있습니다.
                </p>
              </div>
            ) : (
              <div className="mb-6 space-y-2 text-left">
                {[
                  '감성 점수 급변 시 즉시 알림',
                  '키워드 뉴스 감지 알림',
                  '언제든지 알림 해제 가능',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2 text-sm" style={{ color: '#5e5a78' }}>
                    <span className="text-purple-500 font-bold">✓</span>
                    {item}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleEnablePush}
              disabled={pushState === 'loading'}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white mb-3 transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #8b7fd4, #6a5fc4)', boxShadow: '0 4px 16px rgba(139,127,212,0.3)' }}
            >
              {pushState === 'loading'
                ? '설정 중...'
                : pushState === 'error'
                ? '🔔 다시 시도'
                : '🔔 알림 받기'}
            </button>
            <button
              onClick={handleFinish}
              className="w-full py-2.5 rounded-2xl text-sm font-medium transition-all"
              style={{ background: '#f5f4fa', color: '#9e9ab8' }}
            >
              나중에 설정하기
            </button>
          </>
        )}
      </div>
    )
  })()

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(24, 22, 42, 0.5)', backdropFilter: 'blur(4px)' }}
    >
      {/* 모달 시트 */}
      <div
        className="w-full sm:w-auto sm:max-w-sm rounded-t-3xl sm:rounded-3xl overflow-y-auto transition-all duration-200"
        style={{
          background: '#ffffff',
          maxHeight: '92dvh',
          padding: '32px 24px 40px',
          boxShadow: '0 -8px 48px rgba(139,127,212,0.2)',
          opacity: animating ? 0 : 1,
          transform: animating ? 'translateY(8px)' : 'translateY(0)',
        }}
      >
        {/* 단계 인디케이터 */}
        <div className="flex flex-col items-center gap-1.5 mb-6">
          <div className="flex items-center gap-1.5">
            <StepDot active={step === 1} done={step > 1} />
            <StepDot active={step === 2} done={step > 2} />
            <StepDot active={step === 3} done={step > 3} />
          </div>
          <p className="text-xs" style={{ color: '#c4c0d8' }}>{step} / 3단계</p>
        </div>

        {content}
      </div>
    </div>
  )
}

// ── 온보딩 완료 여부 확인 헬퍼 ───────────────────────────
export function isOnboardingDone(): boolean {
  if (typeof window === 'undefined') return true
  return localStorage.getItem(STORAGE_KEY) === '1'
}
