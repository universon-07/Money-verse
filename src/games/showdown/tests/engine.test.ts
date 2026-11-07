import { describe, expect, test } from 'vitest'
import { mulberry32 } from '../../../lib/rng'
import { canExtend, schedule, unitPrice } from '../engine/contract'
import { FUTURES, ITEMS, item } from '../engine/content'
import { cashLines } from '../engine/lines'
import { runPlan } from '../engine/run'
import { score, stars, title } from '../engine/score'
import { survival } from '../engine/survival'
import { POINTS, type Choices, type Contract, type GoalId, type Plan, type ShortfallAction } from '../engine/types'
import reference from './fixtures/reference.json'

const C = (id: string, haggles = 0, qty = 1, late = false): Contract => ({ id, haggles, qty, late })
const HALL = C('hall')

/** The spec's named plans (section 12). */
const planB: Plan = { contracts: [HALL, C('big', 2), C('lightsC', 1), C('plates', 3, 450), C('kids', 1), C('p1')], ranks: ['G3', 'G2', 'G1'] }
const planA: Plan = { contracts: [HALL, C('reliable'), C('lights'), C('plates', 0, 450), C('kids'), C('p1')], ranks: ['G1', 'G2', 'G3'] }
const cheapest: Plan = { contracts: [HALL, C('basic'), C('lights'), C('plates', 0, 450), C('kids'), C('p1')] }
const hoarder: Plan = { contracts: [HALL, C('mini')] }

type Ref = (typeof reference)[number]
const planOf = (e: Ref): Plan => ({ contracts: e.contracts.map((c) => C(c.id, c.h, c.q, c.l)), ranks: e.ranks as GoalId[] })

describe('matches the Python prototype exactly', () => {
  test(`all ${reference.length} cases (named plans in every choice combination, plus 40 random plans) across the ten futures`, () => {
    for (const e of reference) {
      const plan = planOf(e)
      for (const f of FUTURES) {
        const want = e.results[f.id as keyof typeof e.results] as Record<string, unknown>
        const got = runPlan(plan, f.id, e.choices as Choices)
        const where = `${e.name} ${JSON.stringify(e.choices)} ${f.id}`
        expect({ end: got.end, crowd: got.crowd, goals: got.goals, shortfalls: got.shortfalls, cancelled: got.cancelled, events: got.events, unpaid: got.unpaid, ext: got.extensionFees, survived: got.survived }, where).toEqual({
          end: want.end, crowd: want.crowd, goals: want.goals, shortfalls: want.shortfalls, cancelled: want.cancelled, events: want.events, unpaid: want.unpaid, ext: want.ext, survived: want.survived,
        })
        expect(POINTS.map((p) => got.ledger[p]!.cash), where).toEqual(want.cash)
        expect(POINTS.map((p) => Math.round(got.ledger[p]!.arr)), where).toEqual(want.arr)
        if (want.pay) for (const p of POINTS) expect(got.ledger[p]!.pay, `${where} ${p}`).toEqual((want.pay as Record<string, unknown>)[p])
      }
      expect(survival(plan, e.choices as Choices), e.name).toBe(e.survival)
    }
  })
  test('the two cash lines match the prototype', () => {
    for (const e of reference) {
      const l = cashLines(planOf(e).contracts)
      const want = e.lines as { optimistic: Record<string, number>; cautious: Record<string, number> }
      expect(l.optimistic, e.name).toEqual(want.optimistic)
      expect(l.cautious, e.name).toEqual(want.cautious)
    }
  })
})

describe('the spec numbers (section 12)', () => {
  test('Plan B on the played future F2, to the rupee', () => {
    const r = runPlan(planB, 'F2')
    expect(r.ledger.W1).toMatchObject({ cash: 6930, pay: [['permits', 2000], ['hall', 5000], ['big', 1220], ['lightsC', 620], ['plates', 2610], ['kids', 620], ['p1', 1000]] })
    expect(r.ledger.W2!.cash).toBe(10930) // +5,000 donation, -1,000 electrical
    expect(r.ledger.W3!.cash).toBe(5930)
    expect(r.ledger.FD!.pay.filter(([k]) => k !== 'permits')).toEqual([['big', 6080], ['lightsC', 2480], ['plates', 10440], ['kids', 2480]])
    expect(r.ledger.FD!.cash).toBe(9034)
    expect(r.crowd).toBe(448)
    expect(r.goals).toEqual(['G1', 'G2', 'G3'])
  })
  test('Plan B: cash lines, survival 9 of 10, fails F5 with a ₹966 shortfall on Festival Day', () => {
    const l = cashLines(planB.contracts)
    expect(POINTS.map((p) => l.optimistic[p])).toEqual([6930, 26930, 21930, 10450])
    expect([l.cautious.W1, l.cautious.W2, l.cautious.W3]).toEqual([6930, 6930, 1930])
    expect(l.cushion).toBe(1930)
    expect(survival(planB)).toBe(9)
    expect(runPlan(planB, 'F5').shortfalls).toEqual([['FD', 966]])
  })
  test('Plan A: Reliable is cancelled in Week 3 (₹4,000 lost), survives 3 of 10, cautious line goes to -7,630', () => {
    const r = runPlan(planA, 'F2')
    expect([r.ledger.W1!.cash, r.ledger.W2!.cash]).toEqual([2870, 6870])
    expect(r.shortfalls).toEqual([['W3', 3630]])
    expect(r.cancelled).toEqual([['reliable', 'W3']])
    expect(r.avoidable.lostPaid).toBe(4000)
    expect(r.end).toBe(10434)
    expect(r.goals).toEqual(['G1', 'G2'])
    expect(survival(planA)).toBe(3)
    expect(cashLines(planA.contracts).cautious.W3).toBe(-7630)
  })
  test('scores: Plan B 98, Plan A 45, the hoarder about 24 (hoarding is not winning)', () => {
    const sB = score(planB, runPlan(planB, 'F2'), survival(planB))
    expect(sB).toMatchObject({ goals: 40, onTime: 20, resilience: 18, smart: 20, total: 98 })
    expect(score(planA, runPlan(planA, 'F2'), survival(planA))).toMatchObject({ goals: 30, onTime: 13, resilience: 6, smart: 0, total: 45 })
    const h = runPlan(hoarder, 'F2')
    expect(survival(hoarder)).toBe(10)
    expect(h.goals).toEqual([])
    expect(score(hoarder, h, 10).total).toBe(24)
  })
  test('the cheapest headline plan breaks in Week 1 and survives 0 of 10; the Combo-only plan survives 3', () => {
    const r = runPlan(cheapest, 'F2')
    expect(r.shortfalls[0]).toEqual(['W1', 1630])
    expect(survival(cheapest)).toBe(0)
    expect(survival({ contracts: [HALL, C('combo', 1), C('plates', 0, 450), C('kids')] }, { e4: 'cash' })).toBe(3)
  })
  test('stars and titles', () => {
    const played = runPlan(planB, 'F2')
    expect(stars(planB, played, 9)).toEqual({ goals: true, onTime: true, resilient: true, cleanBooks: true })
    expect(stars(planA, runPlan(planA, 'F2'), 3)).toEqual({ goals: false, onTime: false, resilient: false, cleanBooks: true })
    expect([title(39), title(40), title(69), title(70), title(89), title(90)]).toEqual(['rookie', 'careful', 'careful', 'steady', 'steady', 'master'])
    // Sunny's cash advance leaves ₹800 unrecorded, which costs the Clean books star
    const withSunny = runPlan(planB, 'F2', { e4: 'cash' })
    expect(withSunny.avoidable.unrecorded).toBe(800)
    expect(stars(planB, withSunny, 9).cleanBooks).toBe(false)
  })
})

describe('the rules and the data', () => {
  test('haggle ladders never go up, and every payment plan adds to 100%', () => {
    for (const d of ITEMS) {
      for (let i = 1; i < d.ladder.length; i++) expect(d.ladder[i], d.id).toBeLessThanOrEqual(d.ladder[i - 1])
      const sum = (t: Record<string, number>) => Object.values(t).reduce((a, b) => a + b, 0)
      expect(sum(d.terms), d.id).toBeCloseTo(1, 9)
      if (d.late) expect(sum(d.late), d.id).toBeCloseTo(1, 9)
    }
  })
  test('the Combo "was ₹28,000" is a trap: the same three parts cost ₹13,000 at Daam Fix', () => {
    const parts = ['reliable', 'lights', 'safety'].reduce((a, id) => a + unitPrice(C(id)), 0)
    expect(parts).toBe(13000)
    expect(unitPrice(C('combo'))).toBe(14000)
  })
  test('required extras are always billed: Basic sound costs ₹8,500 not ₹5,500, Big sound has a ₹1,200 technician', () => {
    expect(schedule(C('basic'))[1]).toBe(8500)
    expect(schedule(C('big'))[1]).toBe(6600 + 1200)
    expect(schedule(C('basic'))[0]).toEqual({ W1: 8500 })
  })
  test('pay-later (Chacha only) moves everything to Festival Day for 5% more; Daam Fix never extends', () => {
    expect(schedule(C('kids', 0, 1, true))[0]).toEqual({ FD: 3300 * 1.05 })
    expect(item('kids').vendor).toBe('chacha')
    expect(canExtend('kids')).toBe(true)
    expect(canExtend('reliable')).toBe(false)
  })
  test('the same decisions twice give the same result', () => {
    expect(runPlan(planB, 'F6', { e2: 'stage', e4: 'bill' })).toEqual(runPlan(planB, 'F6', { e2: 'stage', e4: 'bill' }))
  })
})

describe('the shortfall sheet: the player\'s own choices', () => {
  test('play mode pauses with the options when a date is short', () => {
    const r = runPlan(planA, 'F2', {}, { mode: 'play' })
    expect(r.pending).toBeDefined()
    expect(r.pending).toMatchObject({ point: 'W3', need: 3630 })
    expect(r.pending!.items.map((i) => i.item)).toContain('reliable')
    expect(r.pending!.items.find((i) => i.item === 'reliable')).toMatchObject({ canExtend: false, canCancel: true })
  })
  test('the autopilot\'s choices, entered as the player\'s own, give the identical result', () => {
    for (const e of reference.slice(0, 30)) {
      const plan = planOf(e)
      for (const f of ['F1', 'F2', 'F5']) {
        const auto = runPlan(plan, f, e.choices as Choices)
        const byPoint: Record<string, ShortfallAction[]> = {}
        for (const [kind, id, p] of auto.events) (byPoint[p] ??= []).push({ item: id, action: kind === 'extension' ? 'extend' : 'cancel' })
        for (const p of Object.keys(byPoint)) byPoint[p].push({ action: 'owe' })
        const play = runPlan(plan, f, e.choices as Choices, { mode: 'play', shortfall: byPoint })
        expect(play.pending, `${e.name} ${f}`).toBeUndefined()
        expect(play.end).toBe(auto.end)
        expect(play.goals).toEqual(auto.goals)
        expect(play.survived).toBe(auto.survived)
      }
    }
  })
  test('the hall and permits can never be cancelled, and Festival Day payments cannot be extended', () => {
    expect(() => runPlan(planA, 'F2', {}, { mode: 'play', shortfall: { W3: [{ item: 'hall', action: 'cancel' }] } })).toThrow()
    expect(() => runPlan(planB, 'F5', {}, { mode: 'play', shortfall: { FD: [{ item: 'big', action: 'extend' }] } })).toThrow()
  })
})

describe('every ranked goal triple has a plan that holds up (section 12 / 16.4)', () => {
  const GOALS: GoalId[] = ['G1', 'G2', 'G3', 'G5']
  const perms = (xs: GoalId[]): GoalId[][] => (xs.length <= 1 ? [xs] : xs.flatMap((x, i) => perms([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p])))
  const triples = GOALS.map((_, i) => GOALS.filter((__, j) => j !== i))

  /** A random plan, drawn from a seeded generator so the test is the same every time. */
  const randomPlan = (r: () => number, ranks: GoalId[]): Plan => {
    const pick = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)]
    const cs: Contract[] = [HALL]
    const sound = pick(['mini', 'big', 'basic', 'reliable', 'combo'])
    cs.push(C(sound, Math.floor(r() * 4), 1, (sound === 'mini' || sound === 'big') && r() < 0.3))
    if (sound !== 'combo') {
      const l = pick(['lights', 'lightsC'])
      cs.push(C(l, Math.floor(r() * 4), 1, l === 'lightsC' && r() < 0.3))
      if (r() < 0.6) cs.push(C('safety'))
    }
    if (r() < 0.85) cs.push(C('plates', Math.floor(r() * 4), 300 + 10 * Math.floor(r() * 31), r() < 0.3))
    if (r() < 0.7) cs.push(C('kids', Math.floor(r() * 4), 1, r() < 0.3))
    const p = pick([null, 'p1', 'p2'])
    if (p) cs.push(C(p))
    return { contracts: cs, ranks }
  }

  test('each of the 24 ranked triples has a plan that meets all three goals on F2 and survives at least 8 of 10 futures', () => {
    for (const triple of triples) {
      for (const ranks of perms(triple)) {
        const r = mulberry32(7)
        let found = 0
        for (let n = 0; n < 40000 && !found; n++) {
          const plan = randomPlan(r, ranks)
          const played = runPlan(plan, 'F2')
          if (ranks.every((g) => played.goals.includes(g)) && survival(plan) >= 8) found = survival(plan)
        }
        expect(found, ranks.join('+')).toBeGreaterThanOrEqual(8)
      }
    }
  })
})
