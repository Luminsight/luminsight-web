'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'luminsight_disclaimer_agreed'

export default function DisclaimerModal() {
  const [visible, setVisible] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    try {
      const agreed = localStorage.getItem(STORAGE_KEY)
      if (!agreed) setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  const handleAgree = () => {
    try { localStorage.setItem(STORAGE_KEY, 'true') } catch { /* 무시 */ }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(24,22,42,0.65)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden fade-in"
        style={{
          background: '#ffffff',
          boxShadow: '0 24px 80px rgba(139,127,212,0.28)',
        }}
      >
        {/* 헤더 */}
        <div
          className="px-7 pt-7 pb-5"
          style={{ borderBottom: '1px solid #f0ecfb' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg, #8b7fd4, #6a5fc4)' }}
            >
              ⚠️
            </div>
            <div>
              <h2 className="font-bold text-base" style={{ color: '#18162a' }}>
                서비스 이용 전 주의사항
              </h2>
              <p className="text-xs mt-0.5" style={{ color: '#9e9ab8' }}>
                LuminSight 이용 약관 동의
              </p>
            </div>
          </div>
        </div>

        {/* 본문 */}
        <div className="px-7 py-5 space-y-4">
          <div
            className="rounded-2xl p-4 text-sm leading-relaxed space-y-3"
            style={{ background: '#faf9fe', border: '1px solid #ede9f8', color: '#3d3960' }}
          >
            <p>
              <b style={{ color: '#8b7fd4' }}>본 서비스는 투자 정보 제공 목적의 서비스입니다.</b>
            </p>
            <ul className="space-y-2 text-xs" style={{ color: '#5e5a78' }}>
              <li className="flex gap-2">
                <span style={{ color: '#8b7fd4', flexShrink: 0 }}>•</span>
                AI 감성 분석 및 기술적 지표는 <b>투자 조언, 매수·매도 권유가 아닙니다.</b>
              </li>
              <li className="flex gap-2">
                <span style={{ color: '#8b7fd4', flexShrink: 0 }}>•</span>
                모든 투자 결정과 그에 따른 손익은 <b>투자자 본인의 책임</b>입니다.
              </li>
              <li className="flex gap-2">
                <span style={{ color: '#8b7fd4', flexShrink: 0 }}>•</span>
                제공되는 정보는 시장 상황에 따라 오차가 있을 수 있으며,
                실시간 정확성을 보장하지 않습니다.
              </li>
              <li className="flex gap-2">
                <span style={{ color: '#8b7fd4', flexShrink: 0 }}>•</span>
                과거 데이터 기반 분석이 미래 수익을 보장하지 않습니다.
              </li>
            </ul>
          </div>

          {/* 체크박스 */}
          <label
            className="flex items-start gap-3 cursor-pointer group"
            onClick={() => setChecked(!checked)}
          >
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-all duration-150"
              style={{
                background: checked ? 'linear-gradient(135deg, #8b7fd4, #6a5fc4)' : '#f5f4fa',
                border: `1.5px solid ${checked ? '#8b7fd4' : '#d4cff2'}`,
              }}
            >
              {checked && (
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className="text-sm leading-relaxed" style={{ color: '#3d3960' }}>
              위 내용을 모두 읽었으며, 본 서비스가 <b>투자 조언을 제공하지 않음</b>을
              이해하고 동의합니다.
            </span>
          </label>
        </div>

        {/* 버튼 */}
        <div className="px-7 pb-7">
          <button
            onClick={handleAgree}
            disabled={!checked}
            className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all duration-150"
            style={{
              background: checked
                ? 'linear-gradient(135deg, #8b7fd4, #6a5fc4)'
                : '#f0eefb',
              color: checked ? '#ffffff' : '#c4c0d8',
              cursor: checked ? 'pointer' : 'not-allowed',
              boxShadow: checked ? '0 4px 20px rgba(139,127,212,0.35)' : 'none',
            }}
          >
            {checked ? '동의하고 서비스 이용하기 →' : '위 항목에 체크 후 동의해 주세요'}
          </button>
        </div>
      </div>
    </div>
  )
}
