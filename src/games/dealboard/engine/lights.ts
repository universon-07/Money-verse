import type { Company, CompanyId, Light, LightKey, Lights, QuarterStats } from './types'

export const LIGHT_KEYS: LightKey[] = ['cash', 'customers', 'debt', 'ceo']

// Thresholds from the spec's "Property card and the four lights" table.

export function cashLight(s: QuarterStats): Light {
  if (s.failed) return 'R'
  if (s.profit >= 0 || (s.runwayMonths ?? 0) >= 12) return 'G'
  if ((s.runwayMonths ?? 0) >= 6) return 'A'
  return 'R'
}

/** `net` is the net-customer trend (two-quarter average) so one noisy quarter does not flip a sound company red. */
export function customersLight(s: QuarterStats, net = s.newCust - s.lostCust): Light {
  if (s.failed) return 'R'
  const payingShare = s.users > 0 ? s.customers / s.users : 1
  if (net < 0 || s.retention < 0.6 || payingShare < 0.1) return 'R'
  if (net > 0 && s.retention >= 0.75) return 'G'
  return 'A'
}

/** Interest cover = profit before interest / interest. */
export const interestCover = (s: Pick<QuarterStats, 'profit' | 'interest'>): number =>
  s.interest > 0 ? (s.profit + s.interest) / s.interest : Infinity

export function debtLight(s: QuarterStats, prevDebt: number, prevMargin: number): Light {
  if (s.failed) return 'R'
  if (s.debt <= 0.01) return 'G'
  const cover = interestCover(s)
  const debtGrowth = prevDebt > 0 ? s.debt / prevDebt - 1 : 0
  if (cover < 1.5 || (debtGrowth >= 0.15 && s.margin < prevMargin)) return 'R'
  if (cover >= 3) return 'G'
  return 'A'
}

export function ceoLight(sales: number): Light {
  if (sales === 0) return 'G'
  if (sales === 1) return 'A'
  return 'R'
}

/** All four lights for a company at the end of quarter q (q = 0 is the first pitch). */
export function computeLights(hist: QuarterStats[], co: Company, q: number): Lights {
  const s = hist[q]
  // at q = 0 the previous quarter is implied by the drift parameters
  const prevDebt = q > 0 ? hist[q - 1].debt : s.debt / (1 + co.params.gd)
  const prevMargin = q > 0 ? hist[q - 1].margin : s.margin - co.params.dm
  const sales = hist.slice(Math.max(1, q - 2), q + 1).filter((h) => h.ceoTrade === 'SELL').length
  const net = (h: QuarterStats) => h.newCust - h.lostCust
  const netTrend = q > 0 && !hist[q - 1].failed ? (net(s) + net(hist[q - 1])) / 2 : net(s)
  return {
    cash: cashLight(s),
    customers: customersLight(s, netTrend),
    debt: debtLight(s, prevDebt, prevMargin),
    ceo: ceoLight(sales),
  }
}

/** Questions a weak founder dodges at the pitch (spec "Which questions crack which company"). */
const DEFLECTS: Partial<Record<CompanyId, LightKey[]>> = {
  payEasy: ['cash'],
  quickRide: ['ceo'],
}

/** What the player sees after asking the founder about one light: the real light, or grey "No answer". */
export function founderAnswer(lights: Lights, companyId: CompanyId, key: LightKey): Light {
  return DEFLECTS[companyId]?.includes(key) ? 'X' : lights[key]
}

/** Red flags for scoring: red lights plus grey "No answer". */
export const redFlags = (lights: Partial<Lights>): number => Object.values(lights).filter((l) => l === 'R' || l === 'X').length
