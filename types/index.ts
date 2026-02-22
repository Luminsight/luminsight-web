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

export interface BollingerDataPoint {
  date: string
  upper: number
  middle: number
  lower: number
  percentB: number
}

export interface MaDataPoint {
  date: string
  sma20: number | null
  sma50: number | null
}

export interface TechnicalIndicatorData {
  ticker: string
  from: string
  to: string
  priceData: StockPricePoint[]
  rsi: RsiDataPoint[]
  bollingerBands: BollingerDataPoint[]
  movingAverages: MaDataPoint[]
  macd: MacdDataPoint[]
}

export interface ComponentScore {
  name: string
  rawScore: number
  weight: number
  description: string
}

export interface SignalScoreResult {
  ticker: string
  score: number
  label: string
  emoji: string
  rsi: ComponentScore
  macd: ComponentScore
  bollingerBand: ComponentScore
  movingAverage: ComponentScore
  sentiment: ComponentScore
  analyzedAt: string
}

export type MacdCross = 'GOLDEN' | 'DEAD'

export interface MacdDataPoint {
  date: string
  macd: number
  signal: number
  histogram: number
  crossType: MacdCross | null
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
