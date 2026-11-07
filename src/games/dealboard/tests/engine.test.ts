import { describe, expect, test } from 'vitest'
import { simulateMarket } from '../engine/simulate'
import { COMPANY, COMPANY_IDS, pickCompanies } from '../engine/companies'
import { RING, RING_SIZE, TURNS, lotTile, quarterTile } from '../engine/board'
import { buildBanners, emergencyTurn } from '../engine/events'
import { hashSeed, mulberry32, normal } from '../engine/rng'
import type { CompanyId, MarketRun } from '../engine/types'

const SEEDS = Array.from({ length: 300 }, (_, i) => `seed-${i}`)
const RUNS: MarketRun[] = SEEDS.map(simulateMarket)
const share = (pred: (m: MarketRun) => boolean) => RUNS.filter(pred).length / RUNS.length
const hist = (m: MarketRun, id: CompanyId) => m.history[id]
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[xs.length >> 1]

describe('seeded randomness', () => {
  test('mulberry32 and the string hash are stable', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
    expect(hashSeed('deal')).toBe(hashSeed('deal'))
    expect(hashSeed('deal')).not.toBe(hashSeed('board'))
  })

  test('normal noise is clipped to ±2 sigma', () => {
    const r = mulberry32(7)
    for (let i = 0; i < 5000; i++) expect(Math.abs(normal(r, 0.1))).toBeLessThanOrEqual(0.2 + 1e-12)
  })

  test('same seed gives an identical market; a different seed does not', () => {
    expect(simulateMarket('abc')).toEqual(simulateMarket('abc'))
    expect(simulateMarket('abc').history.dailyBasket).not.toEqual(simulateMarket('abd').history.dailyBasket)
  })
})

describe('run setup', () => {
  test('four companies, at least one sound and at least two traps', () => {
    for (const s of SEEDS) {
      const p = pickCompanies(s)
      expect(new Set(p).size).toBe(4)
      expect(p.some((id) => COMPANY[id].sound)).toBe(true)
      expect(p.filter((id) => !COMPANY[id].sound).length).toBeGreaterThanOrEqual(2)
    }
  })

  test('the ring has four company corners and eight quarters in order', () => {
    expect(RING_SIZE).toBe(12)
    expect(RING.filter((s) => s.kind === 'lot').map((s) => (s.kind === 'lot' ? s.index : -1))).toEqual([0, 1, 2, 3])
    expect(RING.filter((s) => s.kind === 'quarter').map((s) => (s.kind === 'quarter' ? s.q : -1))).toEqual(Array.from({ length: TURNS }, (_, i) => i + 1))
    for (let i = 0; i < 4; i++) expect(RING[lotTile(i)]).toEqual({ kind: 'lot', index: i })
    for (let q = 1; q <= TURNS; q++) expect(RING[quarterTile(q)]).toEqual({ kind: 'quarter', q })
  })

  test('market fall lands in Q5-Q7 and starts at -12%', () => {
    for (const s of SEEDS.slice(0, 50)) {
      const { banners, fallQ } = buildBanners(s, pickCompanies(s))
      expect(fallQ).toBeGreaterThanOrEqual(5)
      expect(fallQ).toBeLessThanOrEqual(7)
      expect(banners[fallQ - 1].marketShock).toBe(-0.12)
    }
  })

  test('the family emergency lands between quarters 5 and 7', () => {
    for (const s of SEEDS) {
      const t = emergencyTurn(s)
      expect(t).toBeGreaterThanOrEqual(5)
      expect(t).toBeLessThanOrEqual(7)
    }
    expect(new Set(SEEDS.map(emergencyTurn)).size).toBeGreaterThan(1)
  })

  test('starting valuations match the spec', () => {
    const m = RUNS[0]
    expect(hist(m, 'dailyBasket')[0].valuationYears).toBeCloseTo(15, 5)
    expect(hist(m, 'solarGrid')[0].valuationYears).toBeCloseTo(12, 5)
    expect(hist(m, 'medLink')[0].valuationYears).toBeCloseTo(20, 5)
    expect(hist(m, 'steelWorks')[0].valuationYears).toBeCloseTo(6, 5)
    expect(hist(m, 'steelWorks')[0].price).toBe(40)
    expect(hist(m, 'payEasy')[0].valuationYears).toBeNull()
  })
})

describe('story arcs (spec "Story arc of each company")', () => {
  const positive = (id: CompanyId) => share((m) => hist(m, id)[8].price > hist(m, id)[0].price)

  test('Daily Basket: dull and sound', () => {
    const growth = median(RUNS.map((m) => Math.pow(hist(m, 'dailyBasket')[8].revenue / 40, 1 / 8) - 1))
    expect(growth).toBeGreaterThan(0.03)
    expect(growth).toBeLessThan(0.05)
    expect(share((m) => hist(m, 'dailyBasket').every((s) => s.retention > 0.85))).toBeGreaterThan(0.95)
    expect(share((m) => hist(m, 'dailyBasket')[8].margin > 0.1)).toBeGreaterThan(0.9)
    expect(positive('dailyBasket')).toBeGreaterThan(0.85)
  })

  test('PayEasy: booms, runway shrinks while price rises, then down-round or failure', () => {
    for (const m of RUNS) {
      const h = hist(m, 'payEasy')
      expect(h[4].runwayMonths!).toBeLessThan(3)
      if (m.payEasyPath === 'downRound') expect(h[5].events).toContain('downRound')
      else expect(h[6].failed).toBe(true)
    }
    expect(median(RUNS.map((m) => hist(m, 'payEasy')[3].price))).toBeGreaterThan(100)
    expect(positive('payEasy')).toBeLessThan(0.25)
  })

  test('SolarGrid: profit follows a four-quarter wave', () => {
    expect(share((m) => {
      const p = hist(m, 'solarGrid').map((s) => s.profit)
      return p[1] > p[3] && p[4] > p[3] && p[5] > p[7] && p[8] > p[7]
    })).toBeGreaterThan(0.9)
  })

  test('MedLink: debt outruns profit, margin negative by Q7, hit hardest in the fall', () => {
    for (const m of RUNS) {
      const h = hist(m, 'medLink')
      expect(h[6].debt / h[0].debt).toBeGreaterThan(2.5)
    }
    expect(share((m) => hist(m, 'medLink')[7].margin < 0)).toBeGreaterThan(0.85)
    const fallMove = (m: MarketRun, id: CompanyId) => hist(m, id)[m.fallQ].price / hist(m, id)[m.fallQ - 1].price
    const medFall = median(RUNS.map((m) => fallMove(m, 'medLink')))
    for (const id of ['dailyBasket', 'solarGrid', 'steelWorks'] as CompanyId[]) expect(medFall).toBeLessThan(median(RUNS.map((m) => fallMove(m, id))))
    expect(positive('medLink')).toBeLessThan(0.25)
  })

  test('SteelWorks: customers shrink, layoffs rise, price drifts down', () => {
    expect(share((m) => {
      const h = hist(m, 'steelWorks')
      return h.slice(1).every((s, i) => s.customers < h[i].customers)
    })).toBeGreaterThan(0.9)
    const h = hist(RUNS[0], 'steelWorks')
    const rate = (q: number) => h[q].layoffs / h[q - 1].employees
    for (let q = 2; q <= 5; q++) expect(rate(q)).toBeGreaterThan(rate(q - 1))
    expect(positive('steelWorks')).toBeLessThan(0.25)
  })

  test('QuickRide: users soar, paying flat, CEO sells Q2-Q4, crash at Q5', () => {
    for (const m of RUNS) {
      const h = hist(m, 'quickRide')
      expect([2, 3, 4].map((q) => h[q].ceoTrade)).toEqual(['SELL', 'SELL', 'SELL'])
      expect(h[5].events).toContain('restated')
      expect(h[4].users / h[0].users).toBeGreaterThan(3)
      expect(Math.abs(h[4].customers / h[0].customers - 1)).toBeLessThan(0.2)
    }
    expect(median(RUNS.map((m) => hist(m, 'quickRide')[4].price))).toBeGreaterThan(150)
    expect(positive('quickRide')).toBeLessThan(0.25)
  })

  test('layoffs are reported as an event the first quarter they happen', () => {
    const h = hist(RUNS[0], 'steelWorks')
    expect(h[1].events).toContain('layoffNews')
    expect(h[2].events).not.toContain('layoffNews')
  })

  test('every company has 9 snapshots (start + 8 quarters)', () => {
    for (const id of COMPANY_IDS) expect(hist(RUNS[0], id)).toHaveLength(9)
  })
})
