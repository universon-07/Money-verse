import type { Company, CompanyId, CompanyStart, SectorId } from './types'
import { shuffle, streamFor } from './rng'

/**
 * Engine constants that are not printed in the spec, or that had to move so the six story arcs hold.
 * Every deviation from the literal spec is listed in DECISIONS.md.
 */
export const TUNING = {
  /** company debt interest per quarter (spec formula says 0.03; that makes MedLink loss-making at its first pitch) */
  interestRate: 0.0075,
  /** player loan: ₹600 a turn on ₹20,000 */
  loanRate: 0.03,
  surpriseWeight: 0.5,
  marketWeight: 0.4,
  sectorWeight: 0.3,
  /** how hard the broad market fall hits each archetype */
  marketBeta: { steady: 0.8, hype: 1.5, cyclical: 1.1, leveraged: 2.2, fading: 1.0, smoke: 1.5 },
  sigmaMargin: 0.003,
  sigmaCust: 0.015,
  sigmaUsers: 0.02,
  /** hype companies keep raising money; their runway glides down this path (months, index = quarter) */
  hypeRunway: [10.3, 8.0, 5.9, 4.0, 2.2, 1.6, 1.3, 1.0, 0.8],
  /** while the story sells, loss-making hype prices ignore profit surprises */
  smokeSpike: { quarters: [3, 4] as number[], bump: 0.08 },
  postCollapseSentiment: -0.12,
  downRound: { priceMult: 0.55, newShares: 0.3, runwayMonths: 9 },
  restate: { priceMult: 0.5, usersMult: 0.4 },
  /** starting valuation targets from the spec */
  valuationYears: { dailyBasket: 15, solarGrid: 12, medLink: 20, steelWorks: 6 } as Partial<Record<CompanyId, number>>,
  revenueMultiple: { payEasy: 8, quickRide: 10 } as Partial<Record<CompanyId, number>>,
} as const

export const SECTOR_COLOUR: Record<SectorId, string> = {
  food: '#F28C28',
  fintech: '#8E5BB5',
  energy: '#E8B04A',
  health: '#2F8F8A',
  industrial: '#6E86A0',
  mobility: '#D8503A',
}

type Raw = Omit<Company, 'start'> & { start: Omit<CompanyStart, 'shares'> }

const RAW: Raw[] = [
  {
    id: 'dailyBasket', sector: 'food', archetype: 'steady', sound: true,
    params: { g: 0.04, dm: 0.0045, gd: -0.03, churn: 0.12, newBase: 2200, newGrowth: 0.01, userGrowth: 0.03,
      layoff: { from: 99, base: 0, step: 0, cap: 0 }, ceoSellProb: 0.05, ceoBuyProb: 0.12, sentiment: 0, sentimentUntil: 0,
      sigmaRev: 0.01, sigmaPrice: 0.04 },
    start: { revenue: 40, margin: 0.08, debt: 10, cash: 60, employees: 220, customers: 18000, users: 20000, retention: 0.88, price: 100 },
  },
  {
    id: 'payEasy', sector: 'fintech', archetype: 'hype', sound: false,
    params: { g: 0.25, dm: -0.02, gd: 0.05, churn: 0.45, newBase: 6000, newGrowth: 0.06, userGrowth: 0.4,
      layoff: { from: 5, base: 0.15, step: 0, cap: 0.15 }, ceoSellProb: 0.2, ceoBuyProb: 0.02, sentiment: 0.1, sentimentUntil: 99,
      sigmaRev: 0.04, sigmaPrice: 0.12, collapse: 'downRoundOrFail' },
    start: { revenue: 25, margin: -0.35, debt: 5, cash: 30, employees: 150, customers: 12000, users: 400000, retention: 0.55, price: 100 },
  },
  {
    id: 'solarGrid', sector: 'energy', archetype: 'cyclical', sound: true,
    params: { g: 0.03, dm: 0, gd: 0.02, churn: 0.2, newBase: 1800, newGrowth: 0.02, userGrowth: 0.03,
      layoff: { from: 1, base: 0.03, step: 0, cap: 0.03, weakSeasonOnly: true }, ceoSellProb: 0.1, ceoBuyProb: 0.1, sentiment: 0, sentimentUntil: 0,
      sigmaRev: 0.03, sigmaPrice: 0.08, season: [0.25, -0.2, -0.2, 0.15] },
    start: { revenue: 35, margin: 0.1, debt: 40, cash: 50, employees: 180, customers: 9000, users: 11000, retention: 0.8, price: 100 },
  },
  {
    id: 'medLink', sector: 'health', archetype: 'leveraged', sound: false,
    params: { g: 0.12, dm: -0.01, gd: 0.2, churn: 0.16, newBase: 2800, newGrowth: 0.04, userGrowth: 0.04,
      layoff: { from: 6, base: 0.08, step: 0, cap: 0.08 }, ceoSellProb: 0.15, ceoBuyProb: 0.03, sentiment: 0.04, sentimentUntil: 5,
      sigmaRev: 0.02, sigmaPrice: 0.07 },
    start: { revenue: 30, margin: 0.06, debt: 90, cash: 25, employees: 300, customers: 15000, users: 17000, retention: 0.84, price: 100 },
  },
  {
    id: 'steelWorks', sector: 'industrial', archetype: 'fading', sound: false,
    params: { g: -0.03, dm: -0.008, gd: 0.04, churn: 0.22, newBase: 150, newGrowth: -0.04, userGrowth: -0.02,
      layoff: { from: 1, base: 0.05, step: 0.02, cap: 0.15 }, ceoSellProb: 0.2, ceoBuyProb: 0.02, sentiment: 0, sentimentUntil: 0,
      sigmaRev: 0.01, sigmaPrice: 0.05 },
    start: { revenue: 60, margin: 0.05, debt: 30, cash: 70, employees: 600, customers: 800, users: 900, retention: 0.78, price: 40 },
  },
  {
    id: 'quickRide', sector: 'mobility', archetype: 'smoke', sound: false,
    params: { g: 0, dm: 0, gd: 0.02, churn: 0.5, newBase: 3000, newGrowth: 0, userGrowth: 0.35,
      layoff: { from: 99, base: 0, step: 0, cap: 0 }, ceoSellProb: 0.7, ceoForcedSell: [2, 3, 4], ceoBuyProb: 0, sentiment: 0.12, sentimentUntil: 5,
      sigmaRev: 0.03, sigmaPrice: 0.15, collapse: 'restate' },
    start: { revenue: 20, margin: -0.05, debt: 15, cash: 35, employees: 90, customers: 6000, users: 250000, retention: 0.5, price: 100 },
  },
]

export const startProfit = (s: Pick<CompanyStart, 'revenue' | 'margin' | 'debt'>) => s.revenue * s.margin - s.debt * TUNING.interestRate

/** Share count chosen so the first-pitch valuation matches the spec (years of profit, or a revenue multiple). */
function sharesFor(r: Raw): number {
  const years = TUNING.valuationYears[r.id]
  const mult = TUNING.revenueMultiple[r.id]
  const marketValueLakh = years ? years * 4 * startProfit(r.start) : (mult ?? 1) * 4 * r.start.revenue
  return Math.round((marketValueLakh * 1e5) / r.start.price)
}

export const COMPANIES: Company[] = RAW.map((r) => ({ ...r, start: { ...r.start, shares: sharesFor(r) } }))
export const COMPANY: Record<CompanyId, Company> = Object.fromEntries(COMPANIES.map((c) => [c.id, c])) as Record<CompanyId, Company>
export const COMPANY_IDS = COMPANIES.map((c) => c.id)

/** Four of the six: always at least one sound company and at least two traps, in a seeded pitch order. */
export function pickCompanies(seed: string): CompanyId[] {
  const rng = streamFor(seed, 'pick')
  const order = shuffle(rng, COMPANY_IDS)
  let picked = order.slice(0, 4)
  if (!picked.some((id) => COMPANY[id].sound)) {
    const sound = order.slice(4).find((id) => COMPANY[id].sound)!
    picked = [...picked.slice(0, 3), sound]
  }
  return shuffle(rng, picked)
}
