import { describe, expect, test } from 'vitest'
import { simulateMarket } from '../engine/simulate'
import { rivalAlerts } from '../engine/rivals'

describe('rival alerts', () => {
  test('fire at most once per company, and only from real data', () => {
    let fired = 0
    for (let s = 0; s < 60; s++) {
      const m = simulateMarket(`seed${s}`)
      const seen = new Set<string>()
      for (let q = 1; q <= 12; q++) for (const id of rivalAlerts(m, q)) { expect(seen.has(id)).toBe(false); seen.add(id); fired++ }
    }
    expect(fired).toBeGreaterThan(10)
  })
})

import { wildcardFor } from '../engine/wildcards'
import { emergencyTurn } from '../engine/events'
import { pickCompanies } from '../engine/companies'

describe('wildcards', () => {
  test('four per run, in different quarters between 2 and 8, never the emergency quarter, one of each kind plus a second tip', () => {
    for (let s = 0; s < 80; s++) {
      const seed = `w${s}`
      const picked = pickCompanies(seed)
      const em = emergencyTurn(seed)
      const ws = Array.from({ length: 8 }, (_, i) => ({ t: i + 1, w: wildcardFor(seed, i + 1, picked, em) })).filter((x) => x.w)
      expect(ws).toHaveLength(4)
      expect(ws.every((x) => x.t >= 2 && x.t !== em)).toBe(true)
      expect(ws.map((x) => x.w!.kind).sort()).toEqual(['bill', 'gift', 'tip', 'tip'])
      for (const x of ws) if (x.w!.kind === 'tip') expect(picked).toContain(x.w!.companyId)
    }
  })
})

import { act, marketFor, newRun } from '../engine/run'

describe('windfall task', () => {
  test('the reward is only paid for the right answer, and only once', () => {
    for (let s = 0; s < 40; s++) {
      const seed = `g${s}`
      const m = marketFor(seed)
      const turn = Array.from({ length: 8 }, (_, i) => i + 1).find((t) => wildcardFor(seed, t, m.picked, m.emergencyTurn)?.kind === 'gift')!
      const w = wildcardFor(seed, turn, m.picked, m.emergencyTurn)!
      const base = { ...newRun(seed), briefed: true, turn, phase: 'desk' as const }
      expect(act(base, { type: 'task', choice: 1 }).cash).toBe(base.cash)
      const right = act(base, { type: 'task', choice: 0 })
      expect(right.cash).toBe(base.cash + w.amount)
      expect(right.wild?.[turn]?.state).toBe('earned')
      expect(act(right, { type: 'task', choice: 0 }).cash).toBe(right.cash)
      expect(act(act(base, { type: 'task', choice: 2 }), { type: 'task', choice: 0 }).cash).toBe(base.cash)
    }
  })
})
