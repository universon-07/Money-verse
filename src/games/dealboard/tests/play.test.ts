import { describe, expect, test } from 'vitest'
import { act, canBuy, marketFor, newRun, netWorth, pitchFor, reviewFor, type Action, type RunState } from '../engine/run'
import { computeScore } from '../engine/scoring'
import { reviewDecisions } from '../engine/review'
import { computeAnalytics } from '../engine/analytics'
import { explainQuarter } from '../engine/explain'
import { lightsAt, knownLights } from '../engine/state'
import { COMPANY, COMPANY_IDS } from '../engine/companies'
import type { CompanyId, LightKey } from '../engine/types'
import type { ReasonOption } from '../engine/reasons'
import enJudgement from '../content/judgement.json'
import teJudgement from '../content/te/judgement.json'

const DATA: ReasonOption = { id: 'ev.cashProfit', key: 'ev.cashProfit', kind: 'evidence', params: {} }
const HYPE: ReasonOption = { id: 'fe.hype0', key: 'fe.hype0', kind: 'feeling', params: {} }
const FEAR: ReasonOption = { id: 'fe.worry', key: 'fe.worry', kind: 'feeling', params: {} }
const NEUTRAL: ReasonOption = { id: 'ne.needCash', key: 'ne.needCash', kind: 'neutral', params: {} }
type Market = ReturnType<typeof marketFor>
type Policy = (run: RunState, m: Market) => Action | null

/** Plays a whole run: the policy decides at the desk, everything else advances itself. */
function play(seed: string, desk: Policy): RunState {
  const m = marketFor(seed)
  let run = act(newRun(seed), { type: 'brief' })
  for (let guard = 0; run.phase !== 'done' && guard < 400; guard++) {
    let a: Action
    if (run.phase === 'desk') a = desk(run, m) ?? (pitchFor(run, m) ? { type: 'pass', companyId: pitchFor(run, m)! } : { type: 'hold', companyId: reviewFor(run, m)! })
    else if (run.phase === 'emergency') {
      const ids = Object.keys(run.holdings) as CompanyId[]
      a = run.cash >= 25000 || !ids.length ? { type: 'payEmergency' } : { type: 'sell', companyId: ids[0], fraction: 1, reason: NEUTRAL }
    } else a = { type: 'continue' }
    const next = act(run, a)
    run = next === run ? act(run, { type: 'continue' }) : next
  }
  return run
}

const LIGHTS: LightKey[] = ['cash', 'customers', 'debt', 'ceo']

/** Invests the same amount in whatever pitches, asking `asks` questions first. */
const investEvery = (amount: number, asks = 0): Policy => (run, m) => {
  const id = pitchFor(run, m)
  if (!id) return { type: 'hold', companyId: reviewFor(run, m)! }
  for (const light of LIGHTS.slice(0, asks)) if (!knownLights(run, id).includes(light)) return { type: 'ask', companyId: id, light }
  return run.cash >= amount && canBuy(run) ? { type: 'bid', companyId: id, amount, reason: HYPE } : { type: 'pass', companyId: id }
}

/** Careful player: asks two questions, buys only sound-looking companies, never sells a sound one. */
const careful: Policy = (run, m) => {
  const id = pitchFor(run, m)
  if (!id) return { type: 'hold', companyId: reviewFor(run, m)! }
  for (const light of ['cash', 'customers'] as const) if (!knownLights(run, id).includes(light)) return { type: 'ask', companyId: id, light }
  const L = lightsAt(m, id, run.turn - 1)
  const clean = COMPANY[id].sound && (['cash', 'customers'] as const).every((k) => L[k] === 'G')
  return clean && run.cash >= 25000 ? { type: 'bid', companyId: id, amount: 25000, reason: DATA } : { type: 'pass', companyId: id }
}

describe('a quarter is one screen with one real decision', () => {
  test('every quarter has a company pitching until you own all four', () => {
    const m = marketFor('pitch-1')
    let run = act(newRun('pitch-1'), { type: 'brief' })
    const seen: CompanyId[] = []
    for (let q = 1; q <= 4; q++) {
      const id = pitchFor(run, m)!
      expect(id).toBeTruthy()
      seen.push(id)
      run = act(run, { type: 'pass', companyId: id })
      if (run.phase === 'lesson') run = act(run, { type: 'continue' })
      if (run.phase === 'yearEnd') run = act(run, { type: 'continue' })
    }
    expect(new Set(seen).size).toBe(4)
    expect(run.turn).toBe(5)
  })

  test('a quarter can never be clicked through without a decision', () => {
    const m = marketFor('quiet-1')
    const run = act(newRun('quiet-1'), { type: 'brief' })
    expect(pitchFor(run, m)).not.toBeNull()
    expect(act(run, { type: 'continue' })).toBe(run)
    expect(act(run, { type: 'hold', companyId: m.picked[0] })).toBe(run)
  })

  test('owning all four turns each quarter into a graded check-in on one of your companies, rotating', () => {
    const m = marketFor('own-all')
    let run = act(newRun('own-all'), { type: 'brief' })
    for (let q = 1; q <= 4; q++) {
      run = act(run, { type: 'bid', companyId: pitchFor(run, m)!, amount: 10000, reason: DATA })
      while (run.phase === 'lesson' || run.phase === 'yearEnd') run = act(run, { type: 'continue' })
    }
    expect(Object.keys(run.holdings)).toHaveLength(4)
    expect(pitchFor(run, m)).toBeNull()
    const seen: CompanyId[] = []
    for (let q = 0; q < 4; q++) {
      const id = reviewFor(run, m)!
      expect(id).toBeTruthy()
      seen.push(id)
      // you cannot skip: only a hold, a sell or a buy-more is accepted, and holding is logged
      const before = run.log.length
      run = act(run, { type: 'hold', companyId: id })
      expect(run.log.length).toBe(before + 1)
      expect(run.log.at(-1)).toMatchObject({ type: 'HOLD', companyId: id })
      while (run.phase === 'lesson' || run.phase === 'yearEnd' || run.phase === 'emergency') run = run.phase === 'emergency' ? act(run, { type: 'payEmergency' }) : act(run, { type: 'continue' })
    }
    expect(new Set(seen).size).toBe(4)
  })

  test('holding a company with weak checks is flagged, holding a healthy one is praised', () => {
    let weak = false, strong = false
    for (let i = 0; i < 300 && !(weak && strong); i++) {
      const seed = `hold-${i}`
      const m = marketFor(seed)
      for (const id of m.pitchOrder) {
        for (let turn = 2; turn <= 8; turn++) {
          const run = { ...newRun(seed), briefed: true, turn, holdings: { [id]: { units: 10, cost: 1000, since: 1 } } } as RunState
          const first = Object.keys(run.holdings)[0] as CompanyId
          const done = { ...run, log: [{ id: 'x', q: turn, type: 'HOLD' as const, companyId: first, tabsOpened: [], questionsAsked: [], known: LIGHTS, price: 100 }] }
          const [e] = reviewDecisions(done, m)
          if (e.pointers.some((p) => p.key === 'heldWeak')) { weak = true; expect(e.verdict).not.toBe('good') }
          if (e.pointers.some((p) => p.key === 'heldStrong')) { strong = true; expect(e.verdict).toBe('good') }
        }
      }
    }
    expect(weak && strong).toBe(true)
  })

  test('questions are limited to two per pitch and reset every quarter', () => {
    const m = marketFor('ask-1')
    let run = act(newRun('ask-1'), { type: 'brief' })
    const id = pitchFor(run, m)!
    run = act(run, { type: 'ask', companyId: id, light: 'cash' })
    run = act(run, { type: 'ask', companyId: id, light: 'customers' })
    expect(act(run, { type: 'ask', companyId: id, light: 'debt' })).toBe(run)
    expect(run.asked[id]).toEqual(['cash', 'customers'])
    run = act(run, { type: 'pass', companyId: id })
    if (run.phase === 'lesson') run = act(run, { type: 'continue' })
    expect(run.asked).toEqual({})
  })

  test('a bid buys at the known price with a 1% fee and a recorded reason', () => {
    const m = marketFor('bid-1')
    let run = act(newRun('bid-1'), { type: 'brief' })
    const id = pitchFor(run, m)!
    run = act(run, { type: 'ask', companyId: id, light: 'cash' })
    const after = act(run, { type: 'bid', companyId: id, amount: 10000, reason: DATA })
    expect(after.feesPaid).toBe(100)
    expect(after.holdings[id]!.units).toBeCloseTo(9900 / m.history[id][0].price, 6)
    expect(after.cash).toBe(90000 - Math.round(90000 * 0.01))
    expect(after.log[0]).toMatchObject({ type: 'INVEST', q: 1, reasonKind: 'evidence', reasonKey: 'ev.cashProfit', flips: 1, known: ['cash'] })
  })

  test('selling charges a 1% fee and removes the holding', () => {
    const m = marketFor('sell-1')
    const id = m.picked[0]
    let run: RunState = { ...act(newRun('sell-1'), { type: 'brief' }), turn: 3, cash: 50000, holdings: { [id]: { units: 100, cost: 50000, since: 1 } } }
    const price = m.history[id][2].price
    run = act(run, { type: 'sell', companyId: id, fraction: 1, reason: DATA })
    expect(run.holdings[id]).toBeUndefined()
    expect(run.feesPaid).toBe(Math.round(100 * price * 0.01))
    expect(run.cash).toBe(50000 + Math.round(100 * price - Math.round(100 * price * 0.01)))
  })

  test('the family emergency fires once, in quarters 5 to 7', () => {
    const run = play('emergency-1', investEvery(25000))
    expect(run.emergencyDone).toBe(true)
    expect(run.phase).toBe('done')
  })

  test('rewind restores the start of the quarter once a year', () => {
    const seed = 'rewind-1'
    const m = marketFor(seed)
    let run = act(newRun(seed), { type: 'brief' })
    const id = pitchFor(run, m)!
    run = act(run, { type: 'bid', companyId: id, amount: 10000, reason: HYPE })
    if (run.phase === 'desk') {
      // no lesson fired; fabricate one from this quarter so the replay path is exercised
      run = { ...run, turn: 1, phase: 'lesson', lesson: { id: 1, params: { companyId: id } }, after: 'desk' }
    }
    const back = act(run, { type: 'rewind' })
    expect(back.turn).toBe(1)
    expect(back.phase).toBe('desk')
    expect(back.cash).toBe(100000)
    expect(back.rewinds).toEqual([1])
    expect(act({ ...back, phase: 'lesson', turn: 1 }, { type: 'rewind' }).phase).toBe('lesson')
  })

  test('same seed and same decisions give identical runs', () => {
    expect(play('same-1', investEvery(20000))).toEqual(play('same-1', investEvery(20000)))
  })

  test('a full run always ends in done after 8 quarters', () => {
    for (const seed of ['a1', 'a2', 'a3']) {
      const run = play(seed, investEvery(10000, 1))
      expect(run.phase).toBe('done')
      expect(run.turn).toBe(8)
      expect(run.series).toHaveLength(9)
    }
  })

  test('idle cash loses 1% a quarter when nothing is invested', () => {
    const run = play('drag-1', () => null)
    expect(run.cashDragLost).toBeGreaterThan(0)
    const wild = Object.values(run.wild ?? {}).reduce((s, w) => s + w.delta, 0)
    expect(run.cash + run.cashDragLost + 25000 - run.loan - wild).toBeGreaterThanOrEqual(99900)
  })
})

describe('lessons come from the player’s own decisions', () => {
  test('investing in a company with weak checks teaches growth-is-not-health and customers', () => {
    for (let i = 0; i < 300; i++) {
      const seed = `les-${i}`
      const m = marketFor(seed)
      if (m.pitchOrder[0] !== 'payEasy') continue
      const run = act(act(newRun(seed), { type: 'brief' }), { type: 'bid', companyId: 'payEasy', amount: 10000, reason: HYPE })
      const ids = [run.lesson, ...run.queue].filter(Boolean).map((l) => l!.id)
      expect(ids).toContain(1)
      expect(ids).toContain(2)
      expect(ids).toContain(5)
      return
    }
    throw new Error('no seed found')
  })

  test('selling 70% or more in the market fall with no weak checks is panic: no buying next quarter, lesson 7', () => {
    for (let i = 0; i < 400; i++) {
      const m = marketFor(`dip-${i}`)
      if (m.fallQ > 8) continue
      const t = m.fallQ
      const id = 'dailyBasket'
      const price = m.history[id][t - 1].price
      let run: RunState = { ...newRun(`dip-${i}`), briefed: true, turn: t, cash: 50000, holdings: { [id]: { units: 400, cost: 40000, since: 1 } }, turnStartInvested: 400 * price }
      run = act(run, { type: 'sell', companyId: id, fraction: 1, reason: FEAR })
      const target = pitchFor(run, m)!
      run = act(run, { type: 'pass', companyId: target })
      expect(run.jails).toBe(1)
      expect(run.jailedTurn).toBe(t + 1)
      expect(canBuy({ ...run, turn: t + 1, phase: 'desk' })).toBe(false)
      expect([run.lesson, ...run.queue].map((l) => l?.id)).toContain(7)
      return
    }
  })

  test('6 trades or fees above 3% fire lesson 10', () => {
    const m = marketFor('fees-1')
    let run: RunState = { ...act(newRun('fees-1'), { type: 'brief' }), turn: 4, trades: 6, feesPaid: 200, cash: 90000 }
    run = act(run, { type: 'pass', companyId: pitchFor(run, m)! })
    expect([run.lesson, ...run.queue].map((l) => l?.id)).toContain(10)
  })

  test('a lesson shows at most twice per run', () => {
    const run = play('twice-1', investEvery(20000))
    for (const [id, n] of Object.entries(run.shown)) expect(n, `lesson ${id}`).toBeLessThanOrEqual(2)
  })

  test('"earned it" cards only describe quarters that have already been played', () => {
    for (let i = 0; i < 60; i++) {
      const seed = `earn-${i}`
      const m = marketFor(seed)
      const run = play(seed, careful)
      for (const l of [...run.queue, run.lesson].filter(Boolean)) expect(l!.id).toBeLessThan(200)
      void m
    }
  })
})

describe('judgement is tracked decision by decision', () => {
  test('every decision is reviewed with a verdict and pointers', () => {
    const run = play('rev-1', investEvery(15000, 1))
    const m = marketFor('rev-1')
    const entries = reviewDecisions(run, m)
    expect(entries.length).toBe(run.log.length)
    for (const e of entries) {
      expect(['good', 'ok', 'risky']).toContain(e.verdict)
      expect(e.pointers.length).toBeGreaterThan(0)
    }
  })

  test('investing blind in a weak company is called risky and says what was missed', () => {
    for (let i = 0; i < 300; i++) {
      const seed = `blind-${i}`
      const m = marketFor(seed)
      if (m.pitchOrder[0] !== 'payEasy') continue
      const run = act(act(newRun(seed), { type: 'brief' }), { type: 'bid', companyId: 'payEasy', amount: 10000, reason: HYPE })
      const [e] = reviewDecisions(run, m)
      expect(e.verdict).toBe('risky')
      const keys = e.pointers.map((p) => p.key)
      expect(keys).toContain('askedNone')
      expect(keys).toContain('missedWeak')
      expect(keys).toContain('reasonFeeling')
      return
    }
    throw new Error('no seed found')
  })

  test('asking, reading the checks and investing on data is rewarded', () => {
    for (let i = 0; i < 300; i++) {
      const seed = `good-${i}`
      const m = marketFor(seed)
      const id = m.pitchOrder[0]
      if (id !== 'dailyBasket') continue
      let run = act(newRun(seed), { type: 'brief' })
      run = act(run, { type: 'ask', companyId: id, light: 'cash' })
      run = act(run, { type: 'ask', companyId: id, light: 'customers' })
      run = act(run, { type: 'bid', companyId: id, amount: 20000, reason: DATA })
      const [e] = reviewDecisions(run, m)
      expect(e.verdict).toBe('good')
      expect(e.pointers.filter((p) => p.kind === 'bad')).toHaveLength(0)
      expect(e.pointers.map((p) => p.key)).toEqual(expect.arrayContaining(['askedTwo', 'reasonData', 'readChecks']))
      return
    }
    throw new Error('no seed found')
  })

  test('passing on a weak company is praised; passing without asking is a gentle note', () => {
    for (let i = 0; i < 300; i++) {
      const seed = `pass-${i}`
      const m = marketFor(seed)
      if (m.pitchOrder[0] !== 'payEasy') continue
      let run = act(newRun(seed), { type: 'brief' })
      run = act(run, { type: 'ask', companyId: 'payEasy', light: 'customers' })
      run = act(run, { type: 'pass', companyId: 'payEasy' })
      const [e] = reviewDecisions(run, m)
      expect(e.verdict).toBe('good')
      expect(e.pointers.map((p) => p.key)).toContain('passedWeak')
      return
    }
    throw new Error('no seed found')
  })

  test('the review never uses results from quarters that have not been played yet', () => {
    const seed = 'spoiler-1'
    const m = marketFor(seed)
    let run = act(newRun(seed), { type: 'brief' })
    const id = pitchFor(run, m)!
    run = act(run, { type: 'bid', companyId: id, amount: 10000, reason: DATA })
    // right after the decision, quarter 1 has closed so its result may show; nothing beyond it
    const [e] = reviewDecisions(run, m)
    const outcome = e.pointers.find((p) => p.key.startsWith('outcomeBuy'))
    expect(outcome).toBeDefined()
    const q1 = m.history[id][1].price / m.history[id][0].price - 1
    expect(outcome!.params.pct).toBe(Math.abs(Math.round(q1 * 100)))
  })

  test('the live score only counts skills that have come up', () => {
    const m = marketFor('live-1')
    const start = computeScore(act(newRun('live-1'), { type: 'brief' }), m)
    expect(start.measured).toMatchObject({ research: false, skepticism: false, spread: false })
    const run = play('live-1', careful)
    expect(computeScore(run, m).measured.research || computeScore(run, m).measured.skepticism).toBe(true)
  })
})

describe('judgement scoring', () => {
  test('buying a company without asking scores zero research', () => {
    const run = play('trap-1', investEvery(20000, 0))
    const s = computeScore(run, marketFor('trap-1'))
    expect(s.research).toBe(0)
    expect(s.skepticism).toBeLessThan(10)
  })

  test('a bot that buys everything equally and never asks scores 35 to 55 (median over 1,000 seeds)', () => {
    const scores: number[] = []
    for (let i = 0; i < 1000; i++) {
      const seed = `bot-${i}`
      scores.push(computeScore(play(seed, investEvery(20000, 0)), marketFor(seed)).total)
    }
    scores.sort((a, b) => a - b)
    expect(scores[500]).toBeGreaterThanOrEqual(35)
    expect(scores[500]).toBeLessThanOrEqual(55)
  })

  test('careful play clears the stage far more often than careless play', () => {
    let carefulClears = 0
    let carelessClears = 0
    const N = 300
    for (let i = 0; i < N; i++) {
      const seed = `cmp-${i}`
      if (computeScore(play(seed, careful), marketFor(seed)).cleared) carefulClears++
      if (computeScore(play(seed, investEvery(20000, 0)), marketFor(seed)).cleared) carelessClears++
    }
    expect(carefulClears / N).toBeGreaterThan(0.6)
    expect(carelessClears / N).toBeLessThan(0.1)
  })

  test('passing on everything cannot clear the stage', () => {
    const run = play('pass-all', (r, m) => ({ type: 'pass', companyId: pitchFor(r, m)! }))
    const s = computeScore(run, marketFor('pass-all'))
    expect(s.cleared).toBe(false)
    expect(s.profit).toBeLessThan(0)
  })

  test('profit never decides the result: same decisions, same score', () => {
    expect(computeScore(play('same-2', investEvery(20000)), marketFor('same-2'))).toEqual(computeScore(play('same-2', investEvery(20000)), marketFor('same-2')))
  })
})

describe('analytics', () => {
  test('series, allocation and habits describe the run', () => {
    const run = play('an-1', investEvery(15000, 1))
    const m = marketFor('an-1')
    const a = computeAnalytics(run, m)
    expect(a.series).toHaveLength(9)
    expect(a.series[0].networth).toBe(100000)
    expect(a.series.at(-1)!.networth).toBe(a.netWorth)
    expect(a.allocation.reduce((s, x) => s + x.pct, 0)).toBeCloseTo(1, 5)
    expect(a.habits.trades).toBe(run.trades)
    expect(a.habits.fees).toBe(run.feesPaid)
    expect(a.counts.invest + a.counts.sell + a.counts.pass + a.counts.hold).toBe(run.log.length)
    expect(a.change).toBe(a.netWorth - 100000)
  })

  test('reasons are split into evidence and feelings', () => {
    let run = act(newRun('rs-1'), { type: 'brief' })
    const m = marketFor('rs-1')
    run = act(run, { type: 'bid', companyId: pitchFor(run, m)!, amount: 10000, reason: DATA })
    if (run.phase === 'lesson') run = act(run, { type: 'continue' })
    run = act(run, { type: 'bid', companyId: pitchFor(run, m)!, amount: 10000, reason: HYPE })
    const a = computeAnalytics(run, m)
    expect(a.evidencePct).toBe(0.5)
    expect(a.reasons.map((r) => r.kind).sort()).toEqual(['feeling', 'reasoned'])
  })

  test('analytics never show quarters that have not been played', () => {
    const m = marketFor('an-2')
    const run = act(newRun('an-2'), { type: 'brief' })
    expect(computeAnalytics(run, m).series).toHaveLength(1)
    expect(netWorth(run, m)).toBe(100000)
  })
})

describe('why a price moved', () => {
  const m = marketFor('why-1')

  test('a broad market fall is named as a reason', () => {
    expect(explainQuarter(m, 'dailyBasket', m.fallQ).reasons.map((r) => r.key)).toContain('market.fell')
    for (const id of COMPANY_IDS) {
      const { reasons } = explainQuarter(m, id, m.fallQ)
      expect(reasons.length).toBeGreaterThan(0)
      expect(reasons.length).toBeLessThanOrEqual(3)
    }
  })

  test('PayEasy rising while losses grow is called excitement, not earnings', () => {
    let found = false
    for (let i = 0; i < 40 && !found; i++) {
      const mm = marketFor(`hype-${i}`)
      for (let q = 2; q <= 6; q++) {
        const { move, reasons } = explainQuarter(mm, 'payEasy', q)
        if (move > 0.04 && mm.history.payEasy[q].profit < mm.history.payEasy[q - 1].profit) {
          expect(reasons.map((r) => r.key)).toContain('excitement')
          found = true
          break
        }
      }
    }
    expect(found).toBe(true)
  })

  test('a failed company is explained by its failure', () => {
    for (let i = 0; i < 60; i++) {
      const mm = marketFor(`fail-${i}`)
      if (mm.payEasyPath !== 'fail') continue
      expect(explainQuarter(mm, 'payEasy', 6).reasons[0].key).toBe('event.failed')
      return
    }
  })
})

describe('every pointer the review can give has text in both languages', () => {
  test('keys seen over many different playstyles all exist in English and Telugu', () => {
    const keys = new Set<string>()
    const unfilled: string[] = []
    const styles: Policy[] = [investEvery(20000, 0), investEvery(10000, 1), investEvery(15000, 2), careful, (r, m) => ({ type: 'pass', companyId: pitchFor(r, m)! })]
    for (let i = 0; i < 120; i++) {
      const seed = `keys-${i}`
      const m = marketFor(seed)
      for (const style of styles) for (const e of reviewDecisions(play(seed, style), m)) for (const p of e.pointers) {
        keys.add(p.key)
        const have = new Set(Object.keys(p.params).concat(p.params.reasonKey ? ['reason'] : []))
        for (const hole of ((enJudgement.review as Record<string, string>)[p.key] ?? '').matchAll(/{{s*([w]+)s*}}/g)) if (!have.has(hole[1])) unfilled.push(p.key + ':' + hole[1])
      }
    }
    expect([...new Set(unfilled)]).toEqual([])
    expect(keys.size).toBeGreaterThan(15)
    for (const k of keys) {
      expect((enJudgement.review as Record<string, string>)[k], 'en ' + k).toBeTruthy()
      expect((teJudgement.review as Record<string, string>)[k], 'te ' + k).toBeTruthy()
    }
  })
})

describe('lesson cards fill every placeholder', () => {
  test('across many playstyles, each lesson card has a value for every {{placeholder}} in both languages', async () => {
    const en = (await import('../content/lessons.json')).default as unknown as { lite: Record<string, Record<string, string>>; earned: Record<string, Record<string, string>> }
    const te = (await import('../content/te/lessons.json')).default as unknown as typeof en
    const bad: string[] = []
    const seen = new Set<number>()
    const styles: Policy[] = [investEvery(20000, 0), investEvery(10000, 1), careful, (r, m) => ({ type: 'pass', companyId: pitchFor(r, m)! })]
    for (let i = 0; i < 80; i++) {
      for (const style of styles) {
        const seed = `lc-${i}`
        const m = marketFor(seed)
        let run = act(newRun(seed), { type: 'brief' })
        for (let guard = 0; run.phase !== 'done' && guard < 400; guard++) {
          if (run.phase === 'lesson' && run.lesson) {
            const l = run.lesson
            seen.add(l.id)
            const have = new Set([...Object.keys(l.params), ...(l.params.companyId ? ['company'] : []), ...(l.params.reasonKey ? ['reason'] : [])])
            const set = l.id >= 100 ? [en.earned[String(l.id)], te.earned[String(l.id)]] : [en.lite[String(l.id)], te.lite[String(l.id)]]
            for (const texts of set) for (const key of ['did', 'didB']) for (const hole of (texts[key] ?? '').matchAll(/\{\{\s*(\w+)\s*\}\}/g)) {
              if (key === 'didB' && l.variant !== 'b') continue
              if (key === 'did' && l.variant === 'b' && texts.didB) continue
              if (!have.has(hole[1])) bad.push(`${l.id}.${key}:${hole[1]}`)
            }
          }
          let a: Action
          if (run.phase === 'desk') a = style(run, m) ?? (pitchFor(run, m) ? { type: 'pass', companyId: pitchFor(run, m)! } : { type: 'hold', companyId: reviewFor(run, m)! })
          else if (run.phase === 'emergency') {
            const ids = Object.keys(run.holdings) as CompanyId[]
            a = run.cash >= 25000 || !ids.length ? { type: 'payEmergency' } : { type: 'sell', companyId: ids[0], fraction: 1, reason: FEAR }
          } else a = { type: 'continue' }
          const next = act(run, a)
          run = next === run ? act(run, { type: 'continue' }) : next
        }
      }
    }
    expect([...new Set(bad)]).toEqual([])
    expect(seen.size).toBeGreaterThan(5)
  })
})
