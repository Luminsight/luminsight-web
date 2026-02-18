export interface News {
  id: number
  ticker: string
  title: string
  titleKo: string | null
  content: string
  contentKo: string | null
  sentimentScore: number
  sentimentLabel: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
  sentimentReasoning: string
  sentimentReasoningKo: string | null
  confidence: number
  source: string
  publishedAt: string
  url: string
}

export interface SentimentDataPoint {
  timestamp: string
  averageScore: number
  totalCount: number
}

export interface SentimentTimeSeries {
  ticker: string
  dataPoints: SentimentDataPoint[]
  summary: {
    averageScore: number
    totalNews: number
    trend: string
  }
}

export interface Alert {
  id: number
  ticker: string
  alertType: string
  severity: string
  message: string
  isRead: boolean
  createdAt: string
}
