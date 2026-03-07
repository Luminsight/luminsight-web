export type SentimentLabel = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'

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
  sentimentConfidence: number | null
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
  positiveCount: number
  negativeCount: number
  neutralCount: number
  confidence: number
}

export type SentimentTrend = 'IMPROVING' | 'DETERIORATING' | 'STABLE' | 'VOLATILE'

export interface SentimentWeeklySummary {
  ticker: string
  recent7Days: {
    averageScore: number
    positiveRatio: number
    negativeRatio: number
    neutralRatio: number
    totalNews: number
    trend: SentimentTrend
  }
  previous7Days: {
    averageScore: number
    positiveRatio: number
    totalNews: number
  }
  change: {
    scoreChange: number
    positiveRatioChange: number
  }
}

export interface SentimentTimeSeries {
  ticker: string
  startDate: string
  endDate: string
  interval: 'HOURLY' | 'DAILY' | 'WEEKLY'
  dataPoints: SentimentDataPoint[]
  summary: {
    averageScore: number
    totalNews: number
    trend: SentimentTrend
    volatility: number
    positiveCount: number
    negativeCount: number
    neutralCount: number
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

export type MacdCross = 'GOLDEN' | 'DEAD'

export interface MacdDataPoint {
  date: string
  macd: number
  signal: number
  histogram: number
  crossType: MacdCross | null
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

export type InvestOpinion = 'BUY' | 'HOLD' | 'SELL'

export interface SignalBreakdown {
  technicalScore: number
  technicalContrib: number
  sentimentScore: number
  sentimentContrib: number
  fundamentalScore: number
  fundamentalContrib: number
  marketScore: number
  marketContrib: number
  earningsRisk: boolean
  technicalDetail: string
  fundamentalDetail: string
}

export interface ContributingNews {
  title: string
  titleKo: string
  url: string
  sentimentScore: number
  sentimentLabel: string
  publishedAt: string
  source: string
}

export interface TradingSignal {
  ticker: string
  date: string
  signal: InvestOpinion
  reason: string
  confidence: number
  currentPrice: number | null
  sentimentScore: number | null
  combinedScore: number | null
  strategyName: string | null
  breakdown: SignalBreakdown | null
  contributingNews: ContributingNews[]
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

export type AlertRuleType =
  | 'SENTIMENT_SPIKE'
  | 'SENTIMENT_POSITIVE'
  | 'SENTIMENT_NEGATIVE'
  | 'KEYWORD_DETECTED'
  | 'NEWS_VOLUME_SPIKE'

export interface AlertRule {
  id: number
  ticker: string
  type: AlertRuleType
  isEnabled: boolean
  keywords: string[]
  sentimentChangeThreshold: number
  timeWindowHours: number
  volumeThreshold: number
  createdAt: string
}

export interface CreateAlertRuleRequest {
  ticker: string
  type: AlertRuleType
  keywords?: string[]
  sentimentChangeThreshold?: number
  timeWindowHours?: number
  volumeThreshold?: number
}
// ===== 펀더멘털 분석 타입 =====

export interface FundamentalData {
  ticker: string
  trailingPe: number | null
  forwardPe: number | null
  priceToBook: number | null
  priceToSales: number | null
  evToEbitda: number | null
  marketCap: number | null
  sector: string | null
  industry: string | null
  revenueGrowth: number | null
  earningsGrowth: number | null
  operatingMargins: number | null
  profitMargins: number | null
  trailingEps: number | null
  forwardEps: number | null
  nextEarningsDate: string | null
  updatedAt: string
}

export interface EarningsQuarter {
  earningsDate: string
  epsEstimate: number | null
  epsActual: number | null
  surprisePct: number | null
  beat: boolean | null
}

export interface EarningsHistory {
  ticker: string
  quarters: EarningsQuarter[]
  nextEarningsDate: string | null
}

export interface SectorAverage {
  trailingPe: number | null
  priceToBook: number | null
  revenueGrowth: number | null
  operatingMargins: number | null
  profitMargins: number | null
}

// ===== 투자 일지 타입 =====

export type TradeType = 'BUY' | 'SELL'

export interface JournalEntry {
  id: number
  ticker: string
  tradeType: TradeType
  tradeDate: string          // 'YYYY-MM-DD'
  price: number
  quantity: number
  totalAmount: number
  memo: string | null
  aiSignal: InvestOpinion | null
  aiConfidence: number | null
  realizedPnl: number | null
  /** AI 신호 방향과 실제 매매 일치 여부 */
  signalMatched: boolean | null
  /** 기록 시점의 감성 점수 스냅샷 (-1 ~ 1) */
  sentimentScore: number | null
  /** 기록 시점의 감성 레이블 */
  sentimentLabel: SentimentLabel | null
  createdAt: string
  updatedAt: string
}

export interface CreateJournalRequest {
  ticker: string
  tradeType: TradeType
  tradeDate: string
  price: number
  quantity: number
  memo?: string
  aiSignal?: InvestOpinion
  aiConfidence?: number
  realizedPnl?: number
  /** 기록 시점 감성 점수 스냅샷 */
  sentimentScore?: number
  sentimentLabel?: SentimentLabel
}

export interface UpdateJournalRequest {
  tradeDate?: string
  price?: number
  quantity?: number
  memo?: string
  aiSignal?: InvestOpinion
  aiConfidence?: number
  realizedPnl?: number
}

export interface PositionSummary {
  ticker: string
  /** 순 보유 수량 (매수 - 매도) */
  netQuantity: number
  /** 평균 매수 단가 */
  avgBuyPrice: number
  totalBuyAmount: number
  totalSellAmount: number
  realizedPnl: number | null
  tradeCount: number
  buyCount: number
  sellCount: number
  /** AI 신호 추천 방향과 실제 매매 일치율 (0~1) */
  signalMatchRate: number | null
}

export interface PeerComparison {
  ticker: string
  sector: string | null
  target: FundamentalData | null
  peers: FundamentalData[]
  sectorAverage: SectorAverage
}
