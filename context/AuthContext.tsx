'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'

// ── 타입 정의 ──────────────────────────────────────────────────
export interface AuthUser {
  id: number | null
  email: string
  name: string
  pictureUrl: string | null
  role: string
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: () => void
  logout: () => void
  setTokenAndFetchUser: (token: string) => Promise<void>
}

// ── Context ────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null)

const TOKEN_KEY = 'luminsight_jwt'
const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8080'

// ── Provider ───────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  /**
   * JWT를 Authorization 헤더에 주입하도록 axios 인터셉터 설정
   */
  useEffect(() => {
    const interceptorId = api.interceptors.request.use((config) => {
      const token = localStorage.getItem(TOKEN_KEY)
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
      }
      return config
    })

    return () => api.interceptors.request.eject(interceptorId)
  }, [])

  /**
   * 앱 로드 시 저장된 JWT로 사용자 정보 복원
   */
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      fetchCurrentUser().finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get<AuthUser>('/auth/me')
      setUser(res.data)
    } catch {
      // 토큰 만료 또는 유효하지 않음 → 삭제
      localStorage.removeItem(TOKEN_KEY)
      setUser(null)
    }
  }

  /**
   * OAuth2 콜백에서 토큰 수신 후 사용자 정보 조회
   */
  const setTokenAndFetchUser = useCallback(async (token: string) => {
    localStorage.setItem(TOKEN_KEY, token)
    await fetchCurrentUser()
  }, [])

  /**
   * Google 로그인 시작: 백엔드 OAuth2 진입점으로 리다이렉트
   */
  const login = useCallback(() => {
    window.location.href = `${API_BASE}/oauth2/authorization/google`
  }, [])

  /**
   * 로그아웃: 토큰 삭제 + 로그인 페이지로 이동
   */
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
    window.location.href = '/login'
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      logout,
      setTokenAndFetchUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Hook ───────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
