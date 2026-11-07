import { TURNS } from './board'
import type { CompanyId, MarketRun } from './types'
import { COMPANY } from './companies'
import { redFlags } from './lights'
import { START_CASH, lightsAt, netWorthAt, type RunState } from './state'

export const PASS_MARK = 60

export interface Score {
  research: number
  skepticism: number
  spread: number
  calm: number
  habits: number
  /** judgement score out of 100: never profit */
  total: number
  cleared: boolean
  /** which skills have had a chance to show yet (the live score only counts what has come up) */
  measured: Record<'research' | 'skepticism' | 'spread' | 'calm' | 'habits', boolean>
  netWorth: number
  profit: number
  counters: { investDecisions: number; flipsPerBuy: number; trapsMet: number; trapsAvoided: number; prematureSells: number; feesPaid: number; concentrationPeak: number; jails: number }
  /** per-trap result, for the report */
  traps: { companyId: CompanyId; result: 'avoided' | 'soldEarly' | 'soldLate' | 'held'; points: number }[]
}

/** First quarter a careful player could have seen trouble: two red flags, else the company turning loss-making. */
export function tellQuarter(m: MarketRun, id: CompanyId): number {
  const h = m.history[id]
  const deflects = id === 'payEasy' || id === 'quickRide' ? 1 : 0
  for (let q = 0; q <= TURNS; q++) if (redFlags(lightsAt(m, id, q)) + deflects >= 2) return q
  for (let q = 0; q <= TURNS; q++) if (h[q].profit < 0) return q
  return TURNS
}

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x))

/** Judgement score (spec "Scoring in Lite"): five skills of 20, computed from the decision log, never from profit. */
export function computeScore(run: RunState, m: MarketRun): Score {
  const invests = run.log.filter((d) => d.type === 'INVEST')
  const sells = run.log.filter((d) => d.type === 'SELL')

  // Research: lights flipped before each purchase (0 = 0, 1 = 0.5, 2 = 1)
  const flipValue = (n: number) => (n >= 2 ? 1 : n === 1 ? 0.5 : 0)
  const research = invests.length ? (invests.reduce((s, d) => s + flipValue(d.flips ?? 0), 0) / invests.length) * 20 : 0

  // Skepticism: traps met, were they avoided or left in time? (rumour buys cost half a point)
  const traps = run.pitched.filter((id) => !COMPANY[id].sound).map((id) => {
    const tell = tellQuarter(m, id)
    const bought = invests.filter((d) => d.companyId === id)
    const rumour = bought.some((d) => d.rumour)
    const sale = sells.filter((d) => d.companyId === id).at(-1)
    const stillHeld = !!run.holdings[id]
    let points: number
    let result: Score['traps'][number]['result']
    if (!bought.length) [points, result] = [1, 'avoided']
    else if (!stillHeld && sale && sale.q - 1 <= tell) [points, result] = [1, 'soldEarly']
    else if (!stillHeld && sale && sale.q - 1 <= tell + 1) [points, result] = [0.5, 'soldLate']
    else [points, result] = [0, 'held']
    if (rumour) points = Math.max(0, points - 0.5)
    return { companyId: id, result, points }
  })
  const skepticism = traps.length ? (traps.reduce((s, x) => s + x.points, 0) / traps.length) * 20 : 10

  // Spread: average largest sector share while invested (35% or less = 20, 80% or more = 0)
  const investedQs = run.spread.filter((s) => s.holdings > 0)
  const avgTop = investedQs.length ? investedQs.reduce((s, x) => s + x.top, 0) / investedQs.length : 1
  let spread = investedQs.length ? clamp(((0.8 - avgTop) / 0.45) * 20, 0, 20) : 0
  if (run.spread.slice(4).filter((s) => s.holdings < 2).length > 4) spread = Math.min(spread, 10)

  // Calm and patience: panic-sell jail visits and flipping a sound company early for a small gain
  const premature = sells.filter((d) => COMPANY[d.companyId].sound && (d.held ?? 99) <= 2 && (d.gain ?? 1) < 0.1).length
  const calm = clamp(20 - 7 * run.jails - 4 * premature, 0, 20)

  // Money habits: fees, an emergency that forced a sale, idle cash
  const feeHit = run.feesPaid > 0.03 * START_CASH
  const habits = clamp(20 - (feeHit ? 5 : 0) - (run.emergencyForcedSale ? 5 : 0) - (run.cashStreakMax >= 6 ? 5 : 0), 0, 20)

  const total = Math.round(research + skepticism + spread + calm + habits)
  const netWorth = netWorthAt(run, m, Math.min(TURNS, run.turn))
  return {
    research: Math.round(research * 10) / 10,
    skepticism: Math.round(skepticism * 10) / 10,
    spread: Math.round(spread * 10) / 10,
    calm,
    habits,
    total,
    cleared: total >= PASS_MARK,
    measured: { research: invests.length > 0, skepticism: traps.length > 0, spread: investedQs.length > 0, calm: invests.length + sells.length > 0, habits: invests.length + sells.length > 0 },
    netWorth,
    profit: netWorth - START_CASH,
    traps,
    counters: {
      investDecisions: invests.length,
      flipsPerBuy: invests.length ? invests.reduce((s, d) => s + (d.flips ?? 0), 0) / invests.length : 0,
      trapsMet: traps.length,
      trapsAvoided: traps.filter((x) => x.points >= 1).length,
      prematureSells: premature,
      feesPaid: run.feesPaid,
      concentrationPeak: Math.round(Math.max(0, ...run.spread.map((s) => s.top)) * 100),
      jails: run.jails,
    },
  }
}

/** Stars for the hub: 1 = cleared, 2 = strong, 3 = excellent. */
export const starsFor = (score: number): 0 | 1 | 2 | 3 => (score >= 88 ? 3 : score >= 75 ? 2 : score >= PASS_MARK ? 1 : 0)

/**
 * Live score for the Judgement button: the average of the skills that have come up so far, out of 100.
 * The final report uses the full five-skill total; this is only a progress read.
 */
export function liveScore(score: Score): { value: number | null; skills: number } {
  const keys = ['research', 'skepticism', 'spread', 'calm', 'habits'] as const
  const on = keys.filter((k) => score.measured[k])
  if (!on.length) return { value: null, skills: 0 }
  return { value: Math.round((on.reduce((a, k) => a + score[k], 0) / (20 * on.length)) * 100), skills: on.length }
}
