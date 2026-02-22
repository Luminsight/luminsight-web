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

export interface NewsSummary {
  ticker: string
  summary: string
  positiveCount: number
  negativeCount: number
  neutralCount: number
  overallSentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
  generatedAt: string
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

export interface StockPricePoint {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type RsiSignal = 'OVERSOLD' | 'BEARISH' | 'NEUTRAL' | 'BULLISH' | 'OVERBOUGHT'

export interface RsiDataPoint {
  date: string
  value: number
  signal: RsiSignal
}

export interface TechnicalIndicatorData {
  ticker: string
  from: string
  to: string
  priceData: StockPricePoint[]
  rsi: RsiDataPoint[]
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
