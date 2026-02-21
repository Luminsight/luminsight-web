// ============================================================
// lib/api.ts 에 추가할 내용
// newsApi 객체 안에 아래 함수를 추가하세요
// ============================================================

// 1) import에 NewsSummary 타입 추가
//    기존: import type { News } from '@/types'
//    변경: import type { News, NewsSummary } from '@/types'

// 2) newsApi 객체 안에 아래 함수 추가:
//
//   getSummary: async (ticker: string): Promise<NewsSummary> => {
//     const response = await api.get(`/news/${ticker}/summary`)
//     return response.data
//   },

// ============================================================
// 아래는 최종 lib/api.ts 형태 예시 (axios 기준)
// ============================================================

import axios from 'axios'
import type { News, NewsSummary } from '@/types'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
})

export const newsApi = {
  getNewsByTicker: async (ticker: string, limit: number = 20): Promise<News[]> => {
    const response = await api.get(`/news/${ticker}`, { params: { limit } })
    return response.data
  },

  getAllNews: async (limit: number = 50): Promise<News[]> => {
    const response = await api.get('/news', { params: { limit } })
    return response.data
  },

  // ✅ 새로 추가
  getSummary: async (ticker: string): Promise<NewsSummary> => {
    const response = await api.get(`/news/${ticker}/summary`)
    return response.data
  },
}
