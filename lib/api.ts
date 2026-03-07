import axios from 'axios'
import type { News, NewsSummary, TechnicalIndicatorData, SignalScoreResult, SentimentTimeSeries, Alert, FundamentalData, EarningsHistory, PeerComparison, JournalEntry, CreateJournalRequest, UpdateJournalRequest, PositionSummary } from '@/types'


// 백엔드 API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

// ── 에러 코드별 한국어 메시지 ─────────────────────────────────
const ERROR_MESSAGES: Record<number, string> = {
  400: '잘못된 요청입니다. 입력값을 확인해 주세요.',
  401: '인증이 필요합니다. 다시 로그인해 주세요.',
  403: '접근 권한이 없습니다.',
  404: '요청한 데이터를 찾을 수 없습니다.',
  429: 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.',
  500: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  503: '서비스가 일시적으로 중단됐습니다. 잠시 후 다시 시도해 주세요.',
}

// ── 인메모리 캐시 ─────────────────────────────────────────────
interface CacheEntry<T> {
  data: T
  expiresAt: number
}

class ApiCache {
  private store = new Map<string, CacheEntry<unknown>>()

  get<T>(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }
    return entry.data as T
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    this.store.set(key, { data, expiresAt: Date.now() + ttlMs })
  }

  invalidate(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key)
    }
  }
}

export const cache = new ApiCache()

// TTL 상수 (밀리초)
const TTL = {
  NEWS: 3 * 60 * 1000,           // 뉴스: 3분
  SUMMARY: 5 * 60 * 1000,        // AI 브리핑: 5분
  SENTIMENT_SERIES: 2 * 60 * 1000, // 감성 시계열: 2분
  TECHNICAL: 5 * 60 * 1000,      // 기술 지표: 5분
  SIGNAL_SCORE: 5 * 60 * 1000,   // 시그널 스코어: 5분
}

// ── 지수 백오프 재시도 유틸 ───────────────────────────────────
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  baseDelayMs = 500
): Promise<T> {
  let lastError: Error | null = null
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err as Error
      // 4xx 에러는 재시도 불필요
      if (axios.isAxiosError(err) && err.response?.status && err.response.status < 500) {
        throw err
      }
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, baseDelayMs * Math.pow(2, attempt)))
      }
    }
  }
  throw lastError
}

// ── Axios 인스턴스 생성 ────────────────────────────────────────
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10초 타임아웃
})

// ── 요청 인터셉터 ──────────────────────────────────────────────
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
)

// ── 응답 인터셉터 ──────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status

      // 타임아웃
      if (error.code === 'ECONNABORTED') {
        return Promise.reject(new Error('요청 시간이 초과됐습니다. 네트워크 연결을 확인해 주세요.'))
      }

      // 네트워크 오류 (서버 다운 등)
      if (!error.response) {
        return Promise.reject(new Error('서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.'))
      }

      // 상태 코드별 한국어 메시지
      if (status && ERROR_MESSAGES[status]) {
        return Promise.reject(new Error(ERROR_MESSAGES[status]))
      }
    }
    return Promise.reject(error)
  }
)

// ── 뉴스 API ──────────────────────────────────────────────────
export const newsApi = {
  // 종목별 최신 뉴스 조회 (캐시 3분)
  getNewsByTicker: async (ticker: string, limit: number = 20): Promise<News[]> => {
    const cacheKey = `news:${ticker}:${limit}`
    const cached = cache.get<News[]>(cacheKey)
    if (cached) return cached

    return withRetry(async () => {
      const response = await api.get(`/news/${ticker}`, { params: { limit } })
      cache.set(cacheKey, response.data, TTL.NEWS)
      return response.data
    })
  },

  // 모든 뉴스 조회
  getAllNews: async (limit: number = 50): Promise<News[]> => {
    const cacheKey = `news:all:${limit}`
    const cached = cache.get<News[]>(cacheKey)
    if (cached) return cached

    return withRetry(async () => {
      const response = await api.get('/news', { params: { limit } })
      cache.set(cacheKey, response.data, TTL.NEWS)
      return response.data
    })
  },

  // AI 브리핑 요약 (캐시 5분)
  getSummary: async (ticker: string): Promise<NewsSummary> => {
    const cacheKey = `summary:${ticker}`
    const cached = cache.get<NewsSummary>(cacheKey)
    if (cached) return cached

    return withRetry(async () => {
      const response = await api.get(`/news/${ticker}/summary`)
      cache.set(cacheKey, response.data, TTL.SUMMARY)
      return response.data
    })
  },

  // 캐시 강제 갱신 (수동 새로고침용)
  invalidateCache: (ticker: string) => {
    cache.invalidate(`news:${ticker}`)
    cache.invalidate(`summary:${ticker}`)
  },
}

// ── 감성 분석 API ──────────────────────────────────────────────
export const sentimentApi = {
  // 감성 시계열 데이터 조회 (캐시 2분)
  getTimeSeries: async (
    ticker: string,
    hours: number = 24
  ): Promise<SentimentTimeSeries> => {
    const cacheKey = `sentiment:${ticker}:${hours}`
    const cached = cache.get<SentimentTimeSeries>(cacheKey)
    if (cached) return cached

    return withRetry(async () => {
      let response
      if (hours === 24) {
        response = await api.get(`/sentiment/timeseries/${ticker}/last24hours`)
      } else {
        const days = Math.ceil(hours / 24)
        response = await api.get(`/sentiment/timeseries/${ticker}/recent`, {
          params: { days, interval: 'HOURLY' },
        })
      }
      cache.set(cacheKey, response.data, TTL.SENTIMENT_SERIES)
      return response.data
    })
  },
}

// ── 알림 API ──────────────────────────────────────────────────
export const alertApi = {
  getAlerts: async (ticker?: string, unreadOnly: boolean = false): Promise<Alert[]> => {
    const params: Record<string, unknown> = { unreadOnly }
    if (ticker) params.ticker = ticker
    const response = await api.get('/alerts', { params })
    return response.data.alerts
  },

  markAsRead: async (alertId: number): Promise<void> => {
    await api.put(`/alerts/${alertId}/read`)
  },
}

// ── 종목 API ──────────────────────────────────────────────────
// ── 매매 신호 API ─────────────────────────────────────────────
export const tradingApi = {
  getSignal: async (ticker: string) => {
    const res = await api.get(`/trading/signals/${ticker.toUpperCase()}`)
    if (!res.data.success) throw new Error('No signal available')
    return res.data.signal as import('@/types').TradingSignal
  },
}

export const stockApi = {
  // 지원 종목 목록 (추후 백엔드 API 연동 예정)
  getSupportedTickers: async (): Promise<string[]> => {
    try {
      const response = await api.get('/stocks/supported')
      return response.data
    } catch {
      // 백엔드 미구현 시 기본 종목 반환
      return ['AAPL', 'TSLA', 'NVDA', 'GOOGL', 'MSFT', 'AMZN', 'META',
              'NFLX', 'AMD', 'INTC', 'BABA', 'SHOP', 'SPOT', 'UBER', 'LYFT']
    }
  },
}

// ── 시그널 가중치 타입 ─────────────────────────────────────────
export interface SignalWeights {
  rsiWeight: number        // 0~100
  macdWeight: number
  bbWeight: number
  maWeight: number
  sentimentWeight: number
}

export const DEFAULT_WEIGHTS: SignalWeights = {
  rsiWeight: 20,
  macdWeight: 25,
  bbWeight: 20,
  maWeight: 15,
  sentimentWeight: 20,
}

// ── 기술적 분석 API ───────────────────────────────────────────
export const technicalApi = {
  // 기술 지표 조회 (캐시 5분)
  getIndicators: async (ticker: string, days: number = 30): Promise<TechnicalIndicatorData> => {
    const cacheKey = `technical:indicators:${ticker}:${days}`
    const cached = cache.get<TechnicalIndicatorData>(cacheKey)
    if (cached) return cached

    return withRetry(async () => {
      const response = await api.get(`/technical/${ticker}/indicators`, { params: { days } })
      cache.set(cacheKey, response.data, TTL.TECHNICAL)
      return response.data
    })
  },

  // 종합 시그널 스코어 (커스텀 가중치 지원, 캐시 5분)
  getSignalScore: async (
    ticker: string,
    days: number = 30,
    weights: SignalWeights = DEFAULT_WEIGHTS
  ): Promise<SignalScoreResult> => {
    const weightsKey = Object.values(weights).join('-')
    const cacheKey = `technical:signal:${ticker}:${days}:${weightsKey}`
    const cached = cache.get<SignalScoreResult>(cacheKey)
    if (cached) return cached

    return withRetry(async () => {
      const response = await api.get(`/technical/${ticker}/signal-score`, {
        params: { days, ...weights }
      })
      cache.set(cacheKey, response.data, TTL.SIGNAL_SCORE)
      return response.data
    })
  },
}

// ===== 투자 일지 API =====
export const journalApi = {
  /** 목록 조회 (ticker, from, to 선택) */
  getJournals: async (params?: { ticker?: string; from?: string; to?: string }): Promise<JournalEntry[]> => {
    const response = await api.get('/journal', { params })
    return response.data
  },

  /** 단일 항목 조회 */
  getJournal: async (id: number): Promise<JournalEntry> => {
    const response = await api.get(`/journal/${id}`)
    return response.data
  },

  /** 새 기록 추가 */
  createJournal: async (request: CreateJournalRequest): Promise<JournalEntry> => {
    const response = await api.post('/journal', request)
    return response.data
  },

  /** 수정 */
  updateJournal: async (id: number, request: UpdateJournalRequest): Promise<JournalEntry> => {
    const response = await api.put(`/journal/${id}`, request)
    return response.data
  },

  /** 삭제 */
  deleteJournal: async (id: number): Promise<void> => {
    await api.delete(`/journal/${id}`)
  },

  /** 전체 포트폴리오 요약 */
  getPortfolioSummary: async (): Promise<PositionSummary[]> => {
    const response = await api.get('/journal/portfolio')
    return response.data
  },

  /** 티커별 포지션 요약 */
  getPositionSummary: async (ticker: string): Promise<PositionSummary> => {
    const response = await api.get(`/journal/position/${ticker.toUpperCase()}`)
    return response.data
  },

  /** AI 역행 매매 기록 */
  getContraryTrades: async (): Promise<JournalEntry[]> => {
    const response = await api.get('/journal/contrary')
    return response.data
  },
}

// ===== 관심 종목(Watchlist) API =====
export const watchlistApi = {
  /** 내 관심 종목 목록 */
  getWatchlist: async (): Promise<string[]> => {
    const response = await api.get('/watchlist')
    return response.data.tickers as string[]
  },

  /** 관심 종목 추가 */
  addTicker: async (ticker: string): Promise<void> => {
    await api.post(`/watchlist/${ticker.toUpperCase()}`)
  },

  /** 관심 종목 삭제 */
  removeTicker: async (ticker: string): Promise<void> => {
    await api.delete(`/watchlist/${ticker.toUpperCase()}`)
  },
}

// ===== 펀더멘털 분석 API =====
export const fundamentalApi = {
  getFundamental: (ticker: string): Promise<FundamentalData> =>
    api.get(`/fundamental/${ticker}`).then(r => r.data),

  getEarnings: (ticker: string): Promise<EarningsHistory> =>
    api.get(`/fundamental/${ticker}/earnings`).then(r => r.data),

  getPeers: (ticker: string): Promise<PeerComparison> =>
    api.get(`/fundamental/${ticker}/peers`).then(r => r.data),
}
