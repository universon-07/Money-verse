// Deal Board core types. Money inside the engine is in ₹ lakh per quarter (1 lakh = ₹1,00,000),
// except player cash and trades, which are plain rupees.

export type Archetype = 'steady' | 'hype' | 'cyclical' | 'leveraged' | 'fading' | 'smoke'
export type CompanyId = 'dailyBasket' | 'payEasy' | 'solarGrid' | 'medLink' | 'steelWorks' | 'quickRide'
export type SectorId = 'food' | 'fintech' | 'energy' | 'health' | 'industrial' | 'mobility'

/** G green, A amber, R red, X grey "No answer" (a deflecting founder; scored like a red flag). */
export type Light = 'G' | 'A' | 'R' | 'X'
export type LightKey = 'cash' | 'customers' | 'debt' | 'ceo'
export type Lights = Record<LightKey, Light>

export interface LayoffRule {
  /** first quarter with layoffs (99 = never) */
  from: number
  base: number
  /** added each quarter after `from` */
  step: number
  cap: number
  /** only in quarters where the seasonal pattern is negative */
  weakSeasonOnly?: boolean
}

export interface CompanyParams {
  g: number
  dm: number
  gd: number
  churn: number
  newBase: number
  newGrowth: number
  userGrowth: number
  layoff: LayoffRule
  ceoSellProb: number
  ceoForcedSell?: number[]
  ceoBuyProb: number
  sentiment: number
  /** sentiment applies while q < sentimentUntil (a collapse ends it early) */
  sentimentUntil: number
  sigmaRev: number
  sigmaPrice: number
  season?: number[]
  collapse?: 'downRoundOrFail' | 'restate'
}

export interface CompanyStart {
  revenue: number
  margin: number
  debt: number
  cash: number
  employees: number
  customers: number
  users: number
  retention: number
  price: number
  shares: number
}

export interface Company {
  id: CompanyId
  sector: SectorId
  archetype: Archetype
  /** sound companies are the ones a careful player can hold; the rest are traps */
  sound: boolean
  params: CompanyParams
  start: CompanyStart
}

export type CeoTrade = 'BUY' | 'SELL' | 'NONE'
export type CompanyEvent = 'raised' | 'downRound' | 'failed' | 'restated' | 'layoffNews' | 'rumourSpike'

export interface QuarterStats {
  q: number
  revenue: number
  margin: number
  interest: number
  profit: number
  debt: number
  cash: number
  /** cash raised from outside investors this quarter (lakh) */
  raised: number
  runwayMonths: number | null
  employees: number
  hires: number
  layoffs: number
  newCust: number
  lostCust: number
  customers: number
  users: number
  retention: number
  complaints: number
  ceoTrade: CeoTrade
  ceoNetWorth: number
  price: number
  shares: number
  valuationYears: number | null
  failed: boolean
  events: CompanyEvent[]
}

export interface Banner {
  key: string
  marketShock: number
  sector?: SectorId
  sectorShock?: number
}

/** Everything the seed decides. Company paths never depend on player decisions, so the whole market is precomputed. */
export interface MarketRun {
  seed: string
  picked: CompanyId[]
  /** order in which companies pitch (quarter 1 pitches the first, and so on, skipping ones you own) */
  pitchOrder: CompanyId[]
  /** index t-1: what the whole market did in quarter t */
  banners: Banner[]
  /** turn the family emergency fires (between 8 and 10) */
  emergencyTurn: number
  /** quarter of the broad market fall */
  fallQ: number
  payEasyPath: 'downRound' | 'fail'
  /** index q = stats at end of quarter q; index 0 = starting values at the first pitch */
  history: Record<CompanyId, QuarterStats[]>
}

export type DecisionType = 'INVEST' | 'SELL' | 'REJECT' | 'WATCH' | 'HOLD'

export interface Decision {
  id: string
  q: number
  type: DecisionType
  companyId: CompanyId
  amount?: number
  /** id of the reason option the player picked, and what it said and meant */
  reason?: string
  reasonKey?: string
  reasonKind?: 'evidence' | 'caution' | 'headline' | 'feeling' | 'neutral'
  reasonParams?: Record<string, string | number>
  tabsOpened: string[]
  questionsAsked: string[]
  /** share price at the decision */
  price?: number
  /** lights the player had seen before deciding (founder questions + banker clues), 0-2 */
  flips?: number
  /** SELL: gain after fees as a fraction, and quarters held */
  gain?: number
  held?: number
  /** INVEST: a rumour card named this company this quarter */
  rumour?: boolean
  /** lights the player had seen at the decision (founder questions) */
  known?: LightKey[]
  /** INVEST: largest sector share (0-1) and cash left after the purchase */
  share?: number
  cashAfter?: number
  /** companies owned after this purchase */
  positions?: number
  /** share of net worth this purchase made up */
  size?: number
  /** SELL made while paying the family emergency */
  forced?: boolean
}

export interface Lesson {
  id: number
  title: string
  trigger: string
  mvp: boolean
  text: { did: string; showed: string; signal: string; rule: string }
}
