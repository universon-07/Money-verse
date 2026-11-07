import type { CompanyId } from './types'
import { COMPANY } from './companies'
import { reasonCarry } from './reasons'
import { redFlags } from './lights'
import { HOUSE, investedAt, lightsAt, sectorShares, type RunState } from './state'
import type { MarketRun } from './types'

/**
 * Lite lesson cards (spec "Lessons in Lite"): numbers 1-11 are the Lite rows; 101/102 are the positive "Earned it" cards.
 * Each number maps to appendix lessons the "Learn more" button opens.
 */
export const LITE_APPENDIX: Record<number, number[]> = { 1: [1], 2: [2, 3], 3: [7], 4: [5], 5: [14], 6: [16], 7: [11], 8: [21], 9: [22], 10: [20], 11: [10] }
export const EARNED_SOLD = 101
export const EARNED_PASSED = 102

export interface LessonRef {
  id: number
  /** which wording of the "what happened" line to use (a, b ...) */
  variant?: string
  /**
   * Values for the card text. Keys starting with r_ are rupees (formatted by the UI),
   * `companyId` and `sector` are translated by the UI, everything else is shown as is.
   */
  params: Record<string, string | number>
}

export interface QuarterEvents {
  jail: boolean
  /** the family emergency that just ended this quarter */
  emergency: null | { companyId: CompanyId; lossPct: number | null }
}

const num = (n: number) => Math.round(n).toLocaleString('en-IN')

/** Lessons whose trigger fired for the quarter that just ended. At most one is shown per quarter; the rest wait. */
export function collectLessons(r: RunState, m: MarketRun, ev: QuarterEvents): LessonRef[] {
  const t = r.turn
  const out: LessonRef[] = []
  const add = (ref: LessonRef, key?: string) => {
    const k = key ?? `${ref.id}`
    if (r.flagged.includes(k)) return
    r.flagged.push(k)
    out.push(ref)
  }

  for (const d of r.log.filter((x) => x.q === t && x.type === 'INVEST')) {
    const id = d.companyId
    const q = t - 1
    const s = m.history[id][q]
    const L = lightsAt(m, id, q)
    if (L.cash !== 'G') add({ id: 1, params: { companyId: id, y: (-s.profit).toFixed(1), z: Math.round(s.runwayMonths ?? 0) } }, `1:${id}`)
    if (L.customers === 'R') add({ id: 2, params: { companyId: id, n: num(s.users), m: num(s.customers), a: num(s.newCust), b: num(s.lostCust) } }, `2:${id}`)
    if (L.ceo === 'R') add({ id: 3, params: { companyId: id, quarters: `${m.history[id].slice(Math.max(1, q - 2), q + 1).filter((h) => h.ceoTrade === 'SELL').length} of the last 3` } }, `3:${id}`)
    if (L.debt === 'R') add({ id: 4, variant: 'b', params: { companyId: id, debtShare: Math.round((s.debt / Math.max(1, s.revenue * 4)) * 100) } }, `4:${id}`)
    // hype and tips are not evidence: fires when the stated reason was a feeling or something heard
    if (d.reasonKind === 'feeling') add({ id: 5, params: { companyId: id, ...reasonCarry(d) } }, `5:${id}`)
  }

  // held (not only bought) with a red CEO light
  for (const id of Object.keys(r.holdings) as CompanyId[]) {
    if (lightsAt(m, id, t).ceo === 'R') add({ id: 3, params: { companyId: id, quarters: `${m.history[id].slice(Math.max(1, t - 2), t + 1).filter((h) => h.ceoTrade === 'SELL').length} of the last 3` } }, `3:${id}`)
  }

  // borrowed and a holding fell
  if (r.loan > 0) {
    for (const id of Object.keys(r.holdings) as CompanyId[]) {
      const fall = 1 - m.history[id][t].price / m.history[id][t - 1].price
      if (fall >= 0.05) add({ id: 4, variant: 'a', params: { r_x: r.loan, r_i: r.loanInterest, y: Math.round(fall * 100), companyId: id } }, `4:loan`)
    }
  }

  // colour concentration: over half of the invested money in one sector
  const shares = sectorShares(r, m, t)
  const top = Object.entries(shares).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]
  if (top && (top[1] ?? 0) > 0.5) {
    const sector = top[0]
    const ids = (Object.keys(r.holdings) as CompanyId[]).filter((id) => COMPANY[id].sector === sector)
    const change = ids.reduce((s, id) => s + r.holdings[id]!.units * (m.history[id][t].price - m.history[id][t - 1].price), 0)
    const x = Math.round((top[1] ?? 0) * 100)
    if (change < 0) add({ id: 6, params: { x, sector, r_loss: Math.round(-change) } })
    else add({ id: 6, variant: 'b', params: { x, sector, r_loss: Math.round(0.3 * ids.reduce((s, id) => s + r.holdings[id]!.units * m.history[id][t].price, 0)) } })
  }

  if (ev.jail) add({ id: 7, params: {} })

  if (r.cashStreak >= 6) add({ id: 8, params: { n: r.cashStreak, r_c: r.cashDragLost } })

  if (ev.emergency) {
    if (ev.emergency.lossPct !== null) add({ id: 9, params: { companyId: ev.emergency.companyId, x: ev.emergency.lossPct } })
    else add({ id: 9, variant: 'b', params: { companyId: ev.emergency.companyId } })
  }

  if ((r.trades >= 6 && t <= 6) || r.feesPaid > 0.03 * 100000) add({ id: 10, params: { n: r.trades, r_f: r.feesPaid, g: ((r.feesPaid / 100000) * 100).toFixed(1) } })

  return out
}

/**
 * Positive reinforcement: good reads that have since paid off, at most one per year. A decision made in quarter t-1
 * is judged once quarter t has happened, so the card never shows results the player has not lived through yet.
 */
export function collectEarned(r: RunState, m: MarketRun): LessonRef[] {
  const t = r.turn
  if (t < 2 || r.positives.includes(Math.ceil(t / 4))) return []
  const out: LessonRef[] = []
  for (const d of r.log.filter((x) => x.q === t - 1)) {
    const h = m.history[d.companyId]
    const before = h[d.q - 1].price
    const later = h[t].price
    if (d.type === 'SELL' && d.price && later <= d.price * 0.9) {
      out.push({ id: EARNED_SOLD, params: { companyId: d.companyId, r_p: Math.round(d.price), y: Math.round((1 - later / d.price) * 100) } })
    }
    if (d.type === 'REJECT' && !COMPANY[d.companyId].sound && before > 0 && later <= before * 0.85) {
      out.push({ id: EARNED_PASSED, params: { companyId: d.companyId, y: Math.round((1 - later / before) * 100) } })
    }
  }
  return out.slice(0, 1)
}

/** Year-end "houses" card: your gains earn gains. Uses the player's own numbers when they hold anything. */
export function houseCard(r: RunState, m: MarketRun): LessonRef {
  const cost = Object.values(r.holdings).reduce((s, h) => s + (h?.cost ?? 0), 0)
  const value = investedAt(r, m, r.turn)
  if (cost > 0 && value > cost) return { id: 11, params: { r_a: Math.round(cost), r_b: Math.round(value), houses: Math.floor(cost / HOUSE) } }
  return { id: 11, variant: 'b', params: {} }
}

export const trapRedFlags = (m: MarketRun, id: CompanyId, q: number): number => redFlags(lightsAt(m, id, q))
