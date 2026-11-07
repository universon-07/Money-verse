import { describe, expect, test } from 'vitest'
import { cashLight, ceoLight, computeLights, customersLight, debtLight, founderAnswer, redFlags } from '../engine/lights'
import { simulateMarket, startStats } from '../engine/simulate'
import { COMPANY } from '../engine/companies'
import type { QuarterStats } from '../engine/types'

const base: QuarterStats = startStats(COMPANY.dailyBasket)
const s = (o: Partial<QuarterStats>): QuarterStats => ({ ...base, ...o })

describe('cash light', () => {
  test.each([
    [{ profit: 1, runwayMonths: null }, 'G'],
    [{ profit: -1, runwayMonths: 12 }, 'G'],
    [{ profit: -1, runwayMonths: 11.9 }, 'A'],
    [{ profit: -1, runwayMonths: 6 }, 'A'],
    [{ profit: -1, runwayMonths: 5.9 }, 'R'],
    [{ profit: 1, failed: true }, 'R'],
  ] as const)('%o -> %s', (o, want) => expect(cashLight(s(o))).toBe(want))
})

describe('customers light', () => {
  const c = { customers: 1000, users: 1200 }
  test.each([
    [{ ...c, newCust: 110, lostCust: 100, retention: 0.75 }, 'G'],
    [{ ...c, newCust: 110, lostCust: 100, retention: 0.74 }, 'A'],
    [{ ...c, newCust: 100, lostCust: 100, retention: 0.8 }, 'A'],
    [{ ...c, newCust: 90, lostCust: 100, retention: 0.9 }, 'R'],
    [{ ...c, newCust: 110, lostCust: 100, retention: 0.59 }, 'R'],
    [{ customers: 99, users: 1000, newCust: 110, lostCust: 100, retention: 0.9 }, 'R'],
  ] as const)('%o -> %s', (o, want) => expect(customersLight(s(o))).toBe(want))
})

describe('debt light', () => {
  // cover = (profit + interest) / interest
  test.each([
    [{ debt: 0 }, 100, 0.1, 'G'],
    [{ debt: 10, profit: 2, interest: 1 }, 10, 0.1, 'G'],
    [{ debt: 10, profit: 1.9, interest: 1 }, 10, 0.1, 'A'],
    [{ debt: 10, profit: 0.5, interest: 1 }, 10, 0.1, 'A'],
    [{ debt: 10, profit: 0.49, interest: 1 }, 10, 0.1, 'R'],
    [{ debt: 11.6, profit: 5, interest: 1, margin: 0.09 }, 10, 0.1, 'R'],
    [{ debt: 11.6, profit: 5, interest: 1, margin: 0.11 }, 10, 0.1, 'G'],
  ] as const)('%o prevDebt=%d prevMargin=%d -> %s', (o, pd, pm, want) => expect(debtLight(s(o), pd, pm)).toBe(want))
})

test('CEO light: 0 sales green, 1 amber, 2+ red', () => {
  expect([0, 1, 2, 3].map(ceoLight)).toEqual(['G', 'A', 'R', 'R'])
})

describe('lights on real company paths', () => {
  const m = simulateMarket('lights')
  const at = (id: keyof typeof COMPANY, q: number) => computeLights(m.history[id], COMPANY[id], q)

  test('first pitch: traps show their tell, sound companies look clean', () => {
    expect(at('dailyBasket', 0)).toEqual({ cash: 'G', customers: 'G', debt: 'G', ceo: 'G' })
    expect(at('payEasy', 0).customers).toBe('R')
    expect(at('medLink', 0).debt).toBe('R')
    expect(at('steelWorks', 0).customers).toBe('R')
    expect(at('quickRide', 0).customers).toBe('R')
  })

  test('weak founders dodge one question each', () => {
    expect(founderAnswer(at('payEasy', 0), 'payEasy', 'cash')).toBe('X')
    expect(founderAnswer(at('quickRide', 0), 'quickRide', 'ceo')).toBe('X')
    expect(founderAnswer(at('dailyBasket', 0), 'dailyBasket', 'cash')).toBe('G')
    expect(redFlags({ cash: 'X', customers: 'R', debt: 'G' })).toBe(2)
  })

  test('QuickRide CEO light turns red after the Q3-Q5 sales', () => {
    expect(at('quickRide', 5).ceo).toBe('R')
  })

  test('sound companies rarely show a red Customers light', () => {
    let red = 0
    let total = 0
    for (let i = 0; i < 200; i++) {
      const run = simulateMarket(`sound-${i}`)
      for (const id of ['dailyBasket', 'solarGrid'] as const)
        for (let q = 0; q <= 8; q++) {
          total++
          if (computeLights(run.history[id], COMPANY[id], q).customers === 'R') red++
        }
    }
    expect(red / total).toBeLessThan(0.05)
  })
})
