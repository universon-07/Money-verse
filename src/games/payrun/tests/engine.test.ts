import { describe, expect, test } from 'vitest'
import { rngFor } from '../../../lib/rng'
import { ECON, CARDS, card } from '../engine/content'
import { goalWeeks, pace, weeksToGoal } from '../engine/goal'
import { buildLedger, weekLedger } from '../engine/ledger'
import { replaySeason } from '../engine/replay'
import { makeScript } from '../engine/script'
import { NO_RULES, DAYS, type Decision, type State, type WeekScript } from '../engine/types'
import { applyDecision, initialState, lostCashAmount, shortfallOptions, startWeek, treatPrice } from '../engine/week'

const SCRIPT = makeScript('test')
const week = (n: number) => SCRIPT[n - 1]

/** Applies decisions in order, returning the final state. */
function run(state: State, script: WeekScript, ds: Decision[]): State {
  return ds.reduce((s, d) => applyDecision(s, script, d).state, state)
}
/** A state that has just opened `w` with the given balances and rules. */
function opening(w: number, pocket: number, jar: number, patch: Partial<State> = {}): State {
  return startWeek({ ...initialState(), pocket, jar, ...patch }, week(w)).state
}
const plan = (r: Partial<typeof NO_RULES> = {}, extra = 0): Decision => ({ k: 'rules', rules: { ...NO_RULES, ...r }, extra, testing: null })
const skipTreats = (days: number[]): Decision[] => days.map((d) => ({ k: 'treat', day: d as 1, yes: false }))

describe('the eight scripted weeks match the spec exactly', () => {
  const EXPECTED: Record<number, (string | null)[]> = {
    1: [null, 'S3', 'T3', null, 'T2', null],
    2: [null, 'T6', 'P1', 'S2', null, null],
    3: ['P2', 'T7', null, 'L1', 'S1', 'F1'],
    4: [null, 'T9', 'S2', 'L1', 'S7', null],
    5: ['P3', 'S3', 'G1', 'T8', 'S4', null],
    6: ['T5', null, 'T1', 'S3', 'P4', 'T10'],
    7: ['P1', 'S1', 'T4', 'S8', null, '@listed'],
    8: ['F2', 'T6', 'P5', 'F4', 'S2', null],
  }
  test('every day, every week', () => {
    for (const [w, days] of Object.entries(EXPECTED)) expect(DAYS.map((d) => week(Number(w)).days[d])).toEqual(days)
  })
  test('every card id exists; week 4 day 5 is the big ₹250 bill; week 7 day 4 is the ₹300 bill', () => {
    for (const s of SCRIPT.slice(0, 8)) for (const d of DAYS) if (s.days[d] && s.days[d] !== '@listed') expect(card(s.days[d]!)).toBeTruthy()
    expect(card(week(4).days[5]!)).toMatchObject({ amount: 250, big: true })
    expect(card(week(7).days[4]!)).toMatchObject({ amount: 300, big: true })
  })
  test('planned costs are listed for the Plan screen, surprises are not', () => {
    expect(week(2).planned).toEqual([{ day: 3, id: 'P1' }])
    expect(week(1).planned).toEqual([])
  })
  test('rules unlock on schedule: week 1 is all off, Packed Lunch week 2, saving share week 3, Wait List week 6', () => {
    const asked: Decision = plan({ savePct: 30, lunch: true, waitlist: true })
    const rulesAt = (w: number) => applyDecision(opening(w, 0, 0), week(w), asked).state.rules
    expect(rulesAt(1)).toEqual(NO_RULES)
    expect(rulesAt(2)).toEqual({ savePct: 0, lunch: true, waitlist: false })
    expect(rulesAt(3)).toEqual({ savePct: 30, lunch: true, waitlist: false })
    expect(rulesAt(6)).toEqual({ savePct: 30, lunch: true, waitlist: true })
  })
})

describe('the spec worked week (week 3, steady wage, 20% saving share, ₹180 pocket and ₹340 jar)', () => {
  test('matches the table row by row and the ledger balances', () => {
    const w3 = week(3)
    let s = opening(3, 180, 340)
    s = run(s, w3, [plan({ savePct: 20 })])
    expect([s.pocket, s.jar]).toEqual([650, 520]) // Payday: +900, -250, -180 moved to the jar
    s = run(s, w3, [{ k: 'treat', day: 1, yes: true }]) // chai yes; the planned gift (₹150) pays itself
    expect([s.pocket, s.jar]).toEqual([490, 520])
    s = run(s, w3, [{ k: 'treat', day: 2, yes: false }, { k: 'want', day: 2, id: 'T7', choice: 'skip' }])
    expect(s.pocket).toBe(490)
    s = run(s, w3, [{ k: 'treat', day: 3, yes: true }]) // phone top-up
    expect(s.pocket).toBe(470)
    s = run(s, w3, [{ k: 'treat', day: 4, yes: false }]) // lost cash: 30% of 470
    expect(s.pocket).toBe(329)
    s = run(s, w3, [{ k: 'treat', day: 5, yes: true }]) // cold drink, then the ₹150 bill
    expect(s.pocket).toBe(159)
    s = run(s, w3, [{ k: 'treat', day: 6, yes: false }, { k: 'friend', day: 6, id: 'F1', choice: 'lend50' }])
    // the lend takes the pocket to ₹109; closing day 6 opens the Week Review, where Arjun repays ₹50
    expect(s.events.slice(-2)).toEqual([{ t: 'lend', day: 6, id: 'F1', amount: 50 }, { t: 'repaid', id: 'F1', amount: 50 }])
    expect(s.pocket).toBe(159)
    expect(s.phase).toEqual({ at: 'review' })
    s = run(s, w3, [{ k: 'sweep', amount: 100 }])
    expect([s.pocket, s.jar]).toEqual([59, 620])
    expect(s.history[0].jarGain).toBe(280)

    const l = buildLedger(s.events, { pocket: 180, jar: 340 })
    // spec check: money in ₹1,080 (₹180 + ₹900), money out ₹741, jar deposits ₹280, closing pocket ₹59
    // (the ₹50 lent to Arjun came back, so here it is ₹50 out and ₹50 in)
    expect(l.moneyIn).toBe(900 + 50)
    expect(l.moneyOut).toBe(741 + 50)
    expect(l.toJar).toBe(280)
    expect(l.closingPocket).toBe(59)
    expect(180 + l.moneyIn).toBe(l.moneyOut + l.toJar + l.closingPocket)
  })
})

describe('economy rules', () => {
  test('Packed Lunch halves food treats rounded up to ₹5 and leaves the phone top-up and game pack alone', () => {
    expect(DAYS.map((d) => treatPrice(d, false))).toEqual([10, 15, 20, 25, 20, 15])
    expect(DAYS.map((d) => treatPrice(d, true))).toEqual([5, 10, 20, 25, 10, 10])
    expect([10, 15, 20, 25, 20, 15].reduce((a, b) => a + b)).toBe(105)
    expect([5, 10, 20, 25, 10, 10].reduce((a, b) => a + b)).toBe(80)
  })
  test('Lost cash is 30% of the pocket, ₹30 to ₹150, never more than the pocket, and nothing from an empty pocket', () => {
    expect([0, 20, 100, 470, 600, 2000].map(lostCashAmount)).toEqual([0, 20, 30, 141, 150, 150])
  })
  test('the saving share moves to the jar before any spending', () => {
    const s = run(opening(3, 0, 0), week(3), [plan({ savePct: 30 })])
    expect(s.jar).toBe(270)
    expect(s.pocket).toBe(900 - 250 - 270)
  })
  test('"Not enough on you" blocks a buy and a lend instead of overdrawing the pocket', () => {
    let s = opening(1, 0, 0)
    s = run(s, week(1), [plan(), ...skipTreats([1, 2, 3])]) // week 1 day 3 is T3 (₹250)
    expect(s.pocket).toBe(650 - 120) // S3 pharmacy bill on day 2
    const poor = { ...s, pocket: 100 }
    const after = applyDecision(poor, week(1), { k: 'want', day: 3, id: 'T3', choice: 'buy' }).state
    expect(after.pocket).toBe(100)
    expect(after.events.some((e) => e.t === 'blocked')).toBe(true)
  })

  describe('the Shortfall card (a ₹300 bill with ₹100 in the pocket)', () => {
    // week 7 day 4 is S8, ₹300
    const base = () => {
      let s = opening(7, 0, 0)
      s = run(s, week(7), [plan(), ...skipTreats([1])])
      s = { ...s, pocket: 100, jar: 400, phase: { at: 'treat', day: 4 } }
      return applyDecision(s, week(7), { k: 'treat', day: 4, yes: false }).state
    }
    test('the pocket is emptied into the bill first; the shortfall is what is left', () => {
      const s = base()
      expect(s.pocket).toBe(0)
      expect(s.phase).toMatchObject({ at: 'shortfall', amount: 300, shortfall: 200 })
    })
    test('Break the jar: no extra cost, rounded up to ₹50, jar can be disabled', () => {
      expect(shortfallOptions({ jar: 400 }, 120).jar).toEqual({ enabled: true, amount: 150 })
      expect(shortfallOptions({ jar: 100 }, 120).jar.enabled).toBe(false)
      const s = applyDecision(base(), week(7), { k: 'shortfall', day: 4, id: 'S8', choice: 'jar' }).state
      expect([s.pocket, s.jar]).toEqual([0, 200])
    })
    test('Quick Cash: borrows to the next ₹100, owes 1.5 times, repaid in two equal instalments at the next two Paydays', () => {
      const o = shortfallOptions({ jar: 0 }, 200)
      expect(o.quickcash).toMatchObject({ amount: 200, owed: 300, extra: 100, instalment: 150 })
      let s = applyDecision(base(), week(7), { k: 'shortfall', day: 4, id: 'S8', choice: 'quickcash' }).state
      expect(s.loans).toEqual([{ id: '7:S8', amount: 200, instalment: 150, left: 2 }])
      s = run(s, week(7), [...skipTreats([5, 6]), { k: 'sweep', amount: 0 }])
      const next = startWeek(s, week(8)).state
      expect(next.events.filter((e) => e.t === 'instalment')).toEqual([{ t: 'instalment', amount: 150 }])
      expect(next.loans[0].left).toBe(1)
      const after = startWeek({ ...next, phase: { at: 'done' } }, SCRIPT[8]).state
      expect(after.events.filter((e) => e.t === 'instalment')).toEqual([{ t: 'instalment', amount: 150 }])
      expect(after.loans).toEqual([])
    })
    test('Pay late: what the pocket held is paid now; the rest plus ₹30 comes out of next week, fee once', () => {
      let s = applyDecision(base(), week(7), { k: 'shortfall', day: 4, id: 'S8', choice: 'late' }).state
      expect(s.lateDue).toBe(200 + 30)
      s = run(s, week(7), [...skipTreats([5, 6]), { k: 'sweep', amount: 0 }])
      const next = startWeek(s, week(8)).state
      expect(next.events.find((e) => e.t === 'late')).toEqual({ t: 'late', amount: 230, fee: 0, carried: 0 })
      expect(next.lateDue).toBe(0)
    })
    test('a shortfall choice that is not allowed is refused', () => {
      const s = { ...base(), jar: 50 }
      expect(() => applyDecision(s, week(7), { k: 'shortfall', day: 4, id: 'S8', choice: 'jar' })).toThrow()
    })
  })
})

describe('friends, windfall and the Wait List', () => {
  test('scripted outcomes: Sunny repays, Ayesha does not', () => {
    // week 8: F2 Sunny asks on day 1, T6 on day 2, P5 on day 3, F4 Ayesha asks on day 4
    const w8 = week(8)
    const t = (day: number, yes = false): Decision => ({ k: 'treat', day: day as 1, yes })
    let s = opening(8, 0, 0)
    s = run(s, w8, [plan(), t(1), { k: 'friend', day: 1, id: 'F2', choice: 'lend200' }, t(2), { k: 'want', day: 2, id: 'T6', choice: 'skip' }, t(3), t(4), { k: 'friend', day: 4, id: 'F4', choice: 'lend50' }, t(5), t(6)])
    expect(s.phase).toEqual({ at: 'review' })
    expect(s.events.filter((e) => e.t === 'repaid')).toEqual([{ t: 'repaid', id: 'F2', amount: 200 }])
    expect(s.events.filter((e) => e.t === 'lend').map((e) => e.t === 'lend' && e.amount)).toEqual([200, 50])
  })
  test('windfall: add all to the jar, split ₹50 and ₹50, or keep in the pocket', () => {
    const at = (choice: 'jar' | 'split' | 'keep') => {
      let s = opening(5, 0, 0)
      s = run(s, week(5), [plan(), ...skipTreats([1, 2]), { k: 'treat', day: 3, yes: false }])
      s = { ...s, pocket: 300, jar: 0 }
      const t = applyDecision(s, week(5), { k: 'windfall', day: 3, choice })
      return [t.state.pocket, t.state.jar]
    }
    expect([at('jar'), at('split'), at('keep')]).toEqual([[300, 100], [350, 50], [400, 0]])
  })
  test('Wait List: listing costs nothing; at the next Plan "No" records the saving, "Yes" brings the want back at the return price', () => {
    // week 6 day 1: T5 headphones (₹300 today, ₹600 next week)
    let s = opening(6, 0, 0)
    s = run(s, week(6), [plan({ waitlist: true }), { k: 'treat', day: 1, yes: false }, { k: 'want', day: 1, id: 'T5', choice: 'list' }])
    expect(s.list).toEqual([{ id: 'T5', returnPrice: 600, fromWeek: 6 }])
    expect(s.pocket).toBe(650) // listing never costs anything

    // week 7: two items were listed; T5 fades, T1 sneakers does not. Plenty of cash so nothing else interferes.
    let w7 = opening(7, 2000, 0, { list: [{ id: 'T5', returnPrice: 600, fromWeek: 6 }, { id: 'T1', returnPrice: 400, fromWeek: 6 }] })
    w7 = run(w7, week(7), [{ k: 'stillwant', id: 'T5', yes: false }, { k: 'stillwant', id: 'T1', yes: true }])
    expect(w7.events.at(-1)).toEqual({ t: 'saved', id: 'T5', amount: 300 })
    expect(w7.returning).toEqual([{ id: 'T1', price: 400 }])
    const t = (day: number): Decision => ({ k: 'treat', day: day as 1, yes: false })
    w7 = run(w7, week(7), [plan(), t(1), t(2), t(3), { k: 'want', day: 3, id: 'T4', choice: 'skip' }, t(4), t(5), t(6)])
    expect(w7.phase).toEqual({ at: 'card', day: 6, id: 'T1' }) // the listed item comes back on Day 6
    const before = w7.pocket
    w7 = run(w7, week(7), [{ k: 'want', day: 6, id: 'T1', choice: 'buy' }])
    expect(before - w7.pocket).toBe(400)
  })
})

describe('bonus weeks and varied pay', () => {
  test('every bonus week: at most 5 cards, one per day, no bill on Day 1, only real cards', () => {
    for (let i = 0; i < 300; i++) {
      for (const w of makeScript(`seed-${i}`).slice(8)) {
        const ids = DAYS.map((d) => w.days[d]).filter(Boolean) as string[]
        expect(ids.length).toBeLessThanOrEqual(5)
        const d1 = w.days[1]
        if (d1 && d1 !== '@listed') expect(['surprise', 'planned']).not.toContain(card(d1).kind)
        for (const id of ids) if (id !== '@listed') expect(card(id)).toBeTruthy()
        expect(w.scripted).toBe(false)
      }
    }
  })
  test('weeks 1-8 are identical for every seed; the seed only changes bonus weeks', () => {
    expect(makeScript('a').slice(0, 8)).toEqual(makeScript('b').slice(0, 8).map((w) => ({ ...w, seed: 'a' })))
    expect(makeScript('a').slice(8)).not.toEqual(makeScript('b').slice(8))
    expect(makeScript('a')).toEqual(makeScript('a'))
  })
  test('varied pay: ₹900 in week 1, then a seeded shuffle averaging ₹900', () => {
    const wages = makeScript('varied-1', true).slice(0, 8).map((w) => w.wage)
    expect(wages[0]).toBe(900)
    expect([...wages.slice(1)].sort()).toEqual([...ECON.variedWages].sort())
    expect(wages.slice(1).reduce((a, b) => a + b) / 7).toBe(900)
  })
})

describe('money is never lost or made up', () => {
  /** A random but legal player: any choice that is allowed, drawn from a seed. */
  function randomSeason(seed: string): State[] {
    const r = rngFor(`play:${seed}`)
    const script = makeScript(seed)
    const weeks: State[] = []
    let s = initialState()
    for (let w = 1; w <= 14; w++) {
      const sc = script[w - 1]
      s = startWeek(s, sc).state
      for (let guard = 0; s.phase.at !== 'done' && guard < 60; guard++) {
        const ph = s.phase
        let d: Decision
        if (ph.at === 'plan') {
          if (s.list.length) d = { k: 'stillwant', id: s.list[0].id, yes: r() < 0.3 }
          else d = { k: 'rules', rules: { savePct: ([0, 10, 20, 30] as const)[Math.floor(r() * 4)], lunch: r() < 0.5, waitlist: r() < 0.5 }, extra: Math.floor(r() * 4) * 50, testing: null }
        } else if (ph.at === 'treat') d = { k: 'treat', day: ph.day, yes: r() < 0.6 }
        else if (ph.at === 'card') {
          const c = card(ph.id)
          if (c.kind === 'want') d = { k: 'want', day: ph.day, id: ph.id, choice: (['buy', 'skip', 'list'] as const)[Math.floor(r() * 3)] }
          else if (c.kind === 'friend') d = { k: 'friend', day: ph.day, id: ph.id, choice: (['lend200', 'lend50', 'no'] as const)[Math.floor(r() * 3)] }
          else d = { k: 'windfall', day: ph.day, choice: (['jar', 'split', 'keep'] as const)[Math.floor(r() * 3)] }
        } else if (ph.at === 'shortfall') {
          const opts = shortfallOptions(s, ph.shortfall)
          const choices = (opts.jar.enabled ? ['jar', 'quickcash', 'late'] : ['quickcash', 'late']) as ('jar' | 'quickcash' | 'late')[]
          d = { k: 'shortfall', day: ph.day, id: ph.id, choice: choices[Math.floor(r() * choices.length)] }
        } else d = { k: 'sweep', amount: Math.floor(r() * 5) * 50 }
        s = applyDecision(s, sc, d).state
      }
      weeks.push(s)
    }
    return weeks
  }

  test('1,000 random seasons: pocket and jar never go negative, and every week\'s ledger balances', () => {
    for (let i = 0; i < 1000; i++) {
      const seasons = randomSeason(`s${i}`)
      expect(seasons).toHaveLength(14)
      let prev = { pocket: 0, jar: 0 }
      for (const s of seasons) {
        expect(s.pocket).toBeGreaterThanOrEqual(0)
        expect(s.jar).toBeGreaterThanOrEqual(0)
        weekLedger(s.events, prev.pocket) // throws if carried in + money in != money out + set aside + pocket now
        const l = buildLedger(s.events, prev)
        expect([l.closingPocket, l.closingJar]).toEqual([s.pocket, s.jar])
        prev = { pocket: s.pocket, jar: s.jar }
      }
    }
  })
  test('the same decisions give the same season', () => {
    expect(randomSeason('repeat')).toEqual(randomSeason('repeat'))
  })
  test('the card table has every card the spec lists', () => {
    expect(CARDS.map((c) => c.id).sort()).toEqual(
      ['F1', 'F2', 'F3', 'F4', 'G1', 'L1', 'P1', 'P2', 'P3', 'P4', 'P5', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'T1', 'T10', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9'].sort(),
    )
  })
})

describe('goal pace, ledger rows and resuming a saved season', () => {
  test('goal-weeks: ₹250 a week before history, the average of the last three weeks after, never below ₹50', () => {
    const hist = (gains: number[]) => gains.map((g, i) => ({ week: i + 1, openPocket: 0, openJar: 0, closePocket: 0, closeJar: 0, jarGain: g, surprises: 0 }))
    expect(pace([])).toBe(250)
    expect(goalWeeks([], 400)).toBe(1.5)
    expect(pace(hist([100, 500, 280, 220]))).toBe(333) // last three: 500, 280, 220
    expect(pace(hist([0, 0, 0]))).toBe(50)
    expect(weeksToGoal(hist([300]), 600)).toBe(4) // ₹1,200 to go at ₹300 a week
  })
  test('the worked week produces the spec ledger rows', () => {
    const w3 = week(3)
    let s = opening(3, 180, 340)
    const t = (d: number, yes = false): Decision => ({ k: 'treat', day: d as 1, yes })
    s = run(s, w3, [plan({ savePct: 20 }), t(1, true), t(2), { k: 'want', day: 2, id: 'T7', choice: 'skip' }, t(3, true), t(4), t(5, true), t(6), { k: 'friend', day: 6, id: 'F1', choice: 'lend50' }, { k: 'sweep', amount: 100 }])
    const l = weekLedger(s.events, 180)
    expect(l.in).toEqual([{ key: 'carried', amount: 180 }, { key: 'wage', amount: 900 }, { key: 'repaid', amount: 50 }])
    expect(l.out.map((r) => [r.key, r.amount])).toEqual([['musthave', 250], ['bills', 300], ['treats', 50], ['lent', 50], ['lost', 141]])
    expect(l.aside).toEqual([{ key: 'share', amount: 180 }, { key: 'moved', amount: 100 }])
    expect(l.left).toBe(59)
  })
  test('replaying the saved decisions rebuilds the exact state, including across weeks', () => {
    const script = makeScript('resume')
    const t = (d: number): Decision => ({ k: 'treat', day: d as 1, yes: false })
    const w1: Decision[] = [plan(), t(1), t(2), t(3), { k: 'want', day: 3, id: 'T3', choice: 'skip' }, t(4), t(5), { k: 'want', day: 5, id: 'T2', choice: 'skip' }, t(6), { k: 'sweep', amount: 200 }]
    const mid = replaySeason(script, w1.slice(0, 4))
    expect(mid.state.phase).toEqual({ at: 'card', day: 3, id: 'T3' })
    const done = replaySeason(script, w1)
    expect(done.state.phase).toEqual({ at: 'done' })
    expect(done.state.history[0].jarGain).toBe(200)
    const next = replaySeason(script, [...w1, { k: 'nextweek' }])
    expect(next.script.week).toBe(2)
    expect(next.state.phase).toEqual({ at: 'plan' })
    expect(next.state.jar).toBe(200)
  })
})
