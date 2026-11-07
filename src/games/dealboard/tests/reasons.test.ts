import { describe, expect, test } from 'vitest'
import { reasonOptions } from '../engine/reasons'
import { act, marketFor, newRun, pitchFor, type RunState } from '../engine/run'
import { COMPANY_IDS } from '../engine/companies'
import type { CompanyId, LightKey } from '../engine/types'

const deskAt = (seed: string, turn: number, asked: LightKey[] = [], id?: CompanyId): { run: RunState; id: CompanyId } => {
  const m = marketFor(seed)
  let run: RunState = { ...act(newRun(seed), { type: 'brief' }), turn }
  const company = id ?? pitchFor(run, m)!
  run = { ...run, asked: { [company]: asked } }
  return { run, id: company }
}

describe('reasons are built from the company and what you looked at', () => {
  test('before asking anything there is no evidence option, so nothing hidden leaks', () => {
    for (let i = 0; i < 80; i++) {
      const seed = `r-${i}`
      const m = marketFor(seed)
      const { run, id } = deskAt(seed, 1)
      for (const ctx of ['invest', 'pass'] as const) expect(reasonOptions(ctx, run, m, id).some((o) => o.kind === 'evidence')).toBe(false)
    }
  })

  test('evidence only cites checks that were actually asked', () => {
    const cite: Record<string, LightKey> = { cashProfit: 'cash', cashLong: 'cash', cashShort: 'cash', noProfit: 'cash', priceCheap: 'cash', priceDear: 'cash', custStay: 'customers', custLeave: 'customers', custInflated: 'customers', debtNone: 'debt', debtCover: 'debt', debtHeavy: 'debt', ceoHolding: 'ceo', ceoSelling: 'ceo' }
    for (let i = 0; i < 120; i++) {
      const seed = `cite-${i}`
      const m = marketFor(seed)
      for (const asked of [['cash'], ['customers'], ['debt', 'ceo']] as LightKey[][]) {
        const { run, id } = deskAt(seed, 2, asked)
        for (const ctx of ['invest', 'pass'] as const) for (const o of reasonOptions(ctx, run, m, id)) if (o.kind === 'evidence') expect(asked, `${o.key} needs ${cite[o.key.slice(3)]}`).toContain(cite[o.key.slice(3)])
      }
    }
  })

  test('investing offers positive facts and passing offers warnings, both true to the numbers', () => {
    let pos = 0, neg = 0
    for (let i = 0; i < 200; i++) {
      const seed = `pn-${i}`
      const m = marketFor(seed)
      const { run, id } = deskAt(seed, 3, ['cash', 'customers'])
      for (const o of reasonOptions('invest', run, m, id)) if (o.kind === 'evidence') { pos++; expect(['ev.cashProfit', 'ev.cashLong', 'ev.priceCheap', 'ev.custStay']).toContain(o.key) }
      for (const o of reasonOptions('pass', run, m, id)) if (o.kind === 'evidence') { neg++; expect(['ev.cashShort', 'ev.noProfit', 'ev.priceDear', 'ev.custLeave', 'ev.custInflated']).toContain(o.key) }
    }
    expect(pos).toBeGreaterThan(20)
    expect(neg).toBeGreaterThan(20)
  })

  test('every prompt has three to five options and exactly one kind mix that includes a non-evidence way out', () => {
    for (let i = 0; i < 100; i++) {
      const seed = `n-${i}`
      const m = marketFor(seed)
      for (let turn = 1; turn <= 8; turn += 3) {
        const { run, id } = deskAt(seed, turn, ['cash', 'customers'])
        for (const ctx of ['invest', 'pass'] as const) {
          const opts = reasonOptions(ctx, run, m, id)
          expect(opts.length).toBeGreaterThanOrEqual(3)
          expect(opts.length).toBeLessThanOrEqual(5)
          expect(new Set(opts.map((o) => o.id)).size).toBe(opts.length)
          expect(opts.some((o) => o.kind !== 'evidence')).toBe(true)
        }
      }
    }
  })

  test('same seed, quarter and company give the same set; other quarters and companies give fresh wording', () => {
    const m = marketFor('var-1')
    const a = deskAt('var-1', 2)
    expect(reasonOptions('invest', a.run, m, a.id)).toEqual(reasonOptions('invest', a.run, m, a.id))
    const seen = new Set<string>()
    for (let i = 0; i < 40; i++) {
      const seed = `var-${i}`
      const mm = marketFor(seed)
      for (let turn = 1; turn <= 8; turn++) {
        const { run, id } = deskAt(seed, turn)
        for (const o of reasonOptions('invest', run, mm, id)) if (o.kind === 'feeling' || o.kind === 'headline') seen.add(o.id)
      }
    }
    // several different phrasings of hype and of the headline show up over a run
    expect([...seen].filter((k) => k.startsWith('fe.hype')).length).toBeGreaterThanOrEqual(3)
    expect([...seen].filter((k) => k.startsWith('hl.claim')).length).toBeGreaterThanOrEqual(3)
  })

  test('the order is shuffled, so the evidence is not always in the same place', () => {
    const firsts = new Set<string>()
    for (let i = 0; i < 60; i++) {
      const seed = `ord-${i}`
      const m = marketFor(seed)
      const { run, id } = deskAt(seed, 2, ['cash', 'customers'])
      firsts.add(reasonOptions('invest', run, m, id)[0].kind)
    }
    expect(firsts.size).toBeGreaterThan(1)
  })

  test('warning signs can only be cited for passing when they are real', () => {
    for (let i = 0; i < 100; i++) {
      const seed = `dodge-${i}`
      const m = marketFor(seed)
      const { run, id } = deskAt(seed, 2, ['cash'], 'payEasy')
      // PayEasy dodges the cash question: no cash evidence, but "dodged" is offered when passing
      const opts = reasonOptions('pass', run, m, id)
      expect(opts.some((o) => o.id === 'ca.dodged')).toBe(true)
      expect(opts.some((o) => o.key === 'ev.cashShort' || o.key === 'ev.noProfit')).toBe(false)
    }
    // a company that does not dodge never gets the "dodged" option
    const m = marketFor('dodge-x')
    const { run, id } = deskAt('dodge-x', 2, ['cash'], 'dailyBasket')
    expect(reasonOptions('pass', run, m, id).some((o) => o.id === 'ca.dodged')).toBe(false)
  })

  test('selling during the family emergency has a single honest reason; otherwise reasons fit the position', () => {
    const m = marketFor('sell-r')
    const base = { ...act(newRun('sell-r'), { type: 'brief' }), turn: 5, holdings: { dailyBasket: { units: 100, cost: 8000, since: 1 } } } as RunState
    expect(reasonOptions('sell', { ...base, phase: 'emergency' }, m, 'dailyBasket').map((o) => o.id)).toEqual(['ne.forced'])
    const opts = reasonOptions('sell', base, m, 'dailyBasket')
    expect(opts.length).toBeGreaterThanOrEqual(3)
    expect(opts.some((o) => o.kind === 'neutral')).toBe(true)
    expect(opts.some((o) => o.kind === 'feeling')).toBe(true)
  })

  test('every company can produce options in every quarter', () => {
    const m = marketFor('all-1')
    for (const id of COMPANY_IDS) {
      for (let turn = 1; turn <= 8; turn++) {
        const run = { ...act(newRun('all-1'), { type: 'brief' }), turn } as RunState
        expect(reasonOptions('invest', run, m, id).length).toBeGreaterThanOrEqual(3)
      }
    }
  })
})
