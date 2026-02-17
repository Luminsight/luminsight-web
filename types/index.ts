// 뉴스 감성 타입
export interface News {
  id: number
  ticker: string
  title: string
  content: string
  source: string
  url: string
  publishedAt: string
  sentimentLabel: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
  sentimentScore: number
  sentimentConfidence: number
  sentimentReasoning?: string
  createdAt: string
}

// 감성 시계열 데이터
export interface SentimentDataPoint {
  timestamp: string
  averageScore: number
  positiveCount: number
  negativeCount: number
  neutralCount: number
  totalCount: number
  confidence: number
}

export interface SentimentSummary {
  totalNews: number
  averageScore: number
  positiveCount: number
  negativeCount: number
  neutralCount: number
  trend: 'IMPROVING' | 'DETERIORATING' | 'STABLE' | 'VOLATILE'
  volatility: number
}

export interface SentimentTimeSeries {
  ticker: string
  startDate: string
  endDate: string
  interval: string
  dataPoints: SentimentDataPoint[]
  summary: SentimentSummary
}

// 알림 타입
export interface Alert {
  id: number
  ticker: string
  type: 'KEYWORD_DETECTED' | 'SENTIMENT_POSITIVE' | 'SENTIMENT_NEGATIVE' | 'SENTIMENT_SPIKE'
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  message: string
  triggeredAt: string
  isRead: boolean
  sentimentChange?: number
}

// API 응답 타입
export interface ApiResponse<T> {
  data: T
  message?: string
}
