import axios from 'axios'
import type { News, SentimentTimeSeries, Alert } from '@/types'

// 백엔드 API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

// Axios 인스턴스 생성
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 뉴스 API
export const newsApi = {
  // 종목별 최신 뉴스 조회
  getNewsByTicker: async (ticker: string, limit: number = 20): Promise<News[]> => {
    const response = await api.get(`/news/${ticker}`, { params: { limit } })
    return response.data
  },

  // 모든 뉴스 조회
  getAllNews: async (limit: number = 50): Promise<News[]> => {
    const response = await api.get('/news', { params: { limit } })
    return response.data
  },
}

// 감성 분석 API
export const sentimentApi = {
  // 감성 시계열 데이터 조회 (시간 단위)
  getTimeSeries: async (
    ticker: string,
    hours: number = 24
  ): Promise<SentimentTimeSeries> => {
    // 24시간이면 전용 엔드포인트 사용
    if (hours === 24) {
      const response = await api.get(`/sentiment/timeseries/${ticker}/last24hours`)
      return response.data
    }

    // 그 외에는 days로 변환해서 recent 엔드포인트 사용
    const days = Math.ceil(hours / 24)
    const response = await api.get(`/sentiment/timeseries/${ticker}/recent`, {
      params: { days, interval: 'HOURLY' },
    })
    return response.data
  },
}

// 알림 API
export const alertApi = {
  // 알림 목록 조회
  getAlerts: async (ticker?: string, unreadOnly: boolean = false): Promise<Alert[]> => {
    const params: any = { unreadOnly }
    if (ticker) params.ticker = ticker

    const response = await api.get('/alerts', { params })
    return response.data.alerts
  },

  // 알림 읽음 처리
  markAsRead: async (alertId: number): Promise<void> => {
    await api.put(`/alerts/${alertId}/read`)
  },
}

// 종목 API (나중에 추가)
export const stockApi = {
  // 지원 종목 목록
  getSupportedTickers: async (): Promise<string[]> => {
    // 임시로 하드코딩
    return ['AAPL', 'TSLA', 'NVDA', 'GOOGL', 'MSFT', 'AMZN', 'META']
  },
}
