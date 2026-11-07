import type { CompanyId, Decision, LightKey, Lights, MarketRun, SectorId } from './types'
import { COMPANY } from './companies'
import { computeLights } from './lights'
import { simulateMarket } from './simulate'
import type { LessonRef } from './lessons'

export const START_CASH = 100000
export const TRADE_FEE = 0.01
export const CASH_DRAG = 0.01
export const MIN_BID = 5000
export const HOUSE = 10000

/**
 * desk       the quarter's one screen: last quarter's results, a company pitching, trading
 * emergency  family emergency: raise the cash, then pay
 * lesson     a lesson card from the quarter that just ended
 * yearEnd    review after quarters 4, 8 and 12
 * done       run finished
 */
export type Phase = 'desk' | 'emergency' | 'lesson' | 'yearEnd' | 'done'

export interface Holding {
  units: number
  /** rupees paid in (fees included) for the units still held */
  cost: number
  /** quarter of the first purchase */
  since: number
}

export interface EmergencySale {
  companyId: CompanyId
  atLoss: boolean
  inDip: boolean
}

/** One point on the net worth chart. q = 0 is the start. */
export interface SeriesPoint {
  q: number
  cash: number
  invested: number
  loan: number
}

export interface RunState {
  seed: string
  /** the quarter being played (1 to 12); after a quarter closes it stays until the next desk opens */
  turn: number
  phase: Phase
  cash: number
  /** money owed after a family emergency the player could not cover */
  loan: number
  loanInterest: number
  holdings: Partial<Record<CompanyId, Holding>>
  feesPaid: number
  trades: number
  cashDragLost: number
  /** idle-cash loss at the last quarter tick */
  lastDrag: number
  /** companies that have pitched, in order */
  pitched: CompanyId[]
  /** questions asked at this quarter's pitch (max 2 per pitch; cleared each quarter) */
  asked: Partial<Record<CompanyId, LightKey[]>>
  /** every health check ever unlocked per company, so earlier answers stay visible in its study sheet */
  unlocked: Partial<Record<CompanyId, LightKey[]>>
  log: Decision[]
  /** the player has seen the introduction to this game's companies */
  briefed: boolean
  series: SeriesPoint[]

  // this quarter
  turnStartInvested: number
  soldThisTurn: number
  soldRed: boolean
  emergencySales: EmergencySale[]

  // run-long tracking for scoring and lessons
  emergencyDone: boolean
  /** wildcards met: quarter -> what happened and the cash it moved */
  wild?: Record<number, { state: 'applied' | 'followed' | 'ignored' | 'earned' | 'missed'; delta: number }>
  emergencyForcedSale: boolean
  jails: number
  jailedTurn: number
  cashStreak: number
  cashStreakMax: number
  spread: { top: number; holdings: number }[]

  // lessons
  queue: LessonRef[]
  lesson: LessonRef | null
  after: 'desk' | 'yearEnd'
  shown: Record<number, number>
  seen: number[]
  flagged: string[]
  positives: number[]

  // rewind: once per year, back to the start of the quarter a lesson came from
  rewinds: number[]
  checkpoints: Record<number, Omit<RunState, 'checkpoints'>>
}

export const newRun = (seed: string): RunState => ({
  seed,
  turn: 1,
  phase: 'desk',
  cash: START_CASH,
  loan: 0,
  loanInterest: 0,
  holdings: {},
  feesPaid: 0,
  trades: 0,
  cashDragLost: 0,
  lastDrag: 0,
  pitched: [],
  asked: {},
  unlocked: {},
  log: [],
  briefed: false,
  series: [{ q: 0, cash: START_CASH, invested: 0, loan: 0 }],
  turnStartInvested: 0,
  soldThisTurn: 0,
  soldRed: false,
  emergencySales: [],
  emergencyDone: false,
  wild: {},
  emergencyForcedSale: false,
  jails: 0,
  jailedTurn: -1,
  cashStreak: 0,
  cashStreakMax: 0,
  spread: [],
  queue: [],
  lesson: null,
  after: 'desk',
  shown: {},
  seen: [],
  flagged: [],
  positives: [],
  rewinds: [],
  checkpoints: {},
})

// The market is a pure function of the seed; cache the last one so renders stay cheap.
let cached: MarketRun | null = null
export function marketFor(seed: string): MarketRun {
  if (cached?.seed !== seed) cached = simulateMarket(seed)
  return cached
}

/** Latest quarter whose results the player can see: while deciding it is the previous quarter. */
export const knownQuarter = (run: RunState): number => (run.phase === 'desk' || run.phase === 'emergency' ? run.turn - 1 : run.turn)

/** Decisions belong to the quarter being played. */
export const decisionQ = (run: RunState): number => run.turn

export const priceAt = (m: MarketRun, id: CompanyId, q: number): number => m.history[id][q].price

export const holdingValueAt = (run: RunState, m: MarketRun, id: CompanyId, q: number): number => {
  const h = run.holdings[id]
  return h ? h.units * priceAt(m, id, q) : 0
}

export const investedAt = (run: RunState, m: MarketRun, q: number): number =>
  (Object.keys(run.holdings) as CompanyId[]).reduce((sum, id) => sum + holdingValueAt(run, m, id, q), 0)

export const holdingValue = (run: RunState, m: MarketRun, id: CompanyId): number => holdingValueAt(run, m, id, knownQuarter(run))
export const invested = (run: RunState, m: MarketRun): number => investedAt(run, m, knownQuarter(run))
export const netWorthAt = (run: RunState, m: MarketRun, q: number): number => run.cash + investedAt(run, m, q) - run.loan
export const netWorth = (run: RunState, m: MarketRun): number => netWorthAt(run, m, knownQuarter(run))

/**
 * The company pitching this quarter: the pitch order rotates one company a quarter and skips companies you
 * already own, so there is always something real to decide until you own all four.
 */
export function pitchFor(run: RunState, m: MarketRun): CompanyId | null {
  const order = m.pitchOrder
  for (let k = 0; k < order.length; k++) {
    const id = order[(run.turn - 1 + k) % order.length]
    if (!run.holdings[id]) return id
  }
  return null
}

/**
 * When you own all four companies nothing pitches, so each quarter you check in on one of them (they rotate).
 * Returns null while a company is still pitching.
 */
export function reviewFor(run: RunState, m: MarketRun): CompanyId | null {
  if (pitchFor(run, m) !== null) return null
  const held = m.pitchOrder.filter((id) => run.holdings[id])
  return held.length ? held[(run.turn - 1) % held.length] : null
}

export const lightsAt = (m: MarketRun, id: CompanyId, q: number): Lights => computeLights(m.history[id], COMPANY[id], q)

/** Health checks the player has seen for a company this quarter (founder answers). */
export function knownLights(run: RunState, id: CompanyId): LightKey[] {
  return run.asked[id] ?? []
}

/** Share of invested money per sector (0 when nothing is invested). */
export function sectorShares(run: RunState, m: MarketRun, q: number): Partial<Record<SectorId, number>> {
  const total = investedAt(run, m, q)
  const out: Partial<Record<SectorId, number>> = {}
  if (total <= 0) return out
  for (const id of Object.keys(run.holdings) as CompanyId[]) {
    const s = COMPANY[id].sector
    out[s] = (out[s] ?? 0) + holdingValueAt(run, m, id, q) / total
  }
  return out
}

export const houses = (h: Holding): number => Math.floor(h.cost / HOUSE)
