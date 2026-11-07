import { describe, expect, test } from 'vitest'
import { applyAnswer, applyStatus, biggestGroup, learnState, lessonFor, nextLearnStep, predictionScore, predictionTruth, weekConcepts } from '../engine/learn'
import { weekLedger } from '../engine/ledger'
import { makeScript } from '../engine/script'
import { NO_RULES, type Decision, type Rules, type State } from '../engine/types'
import { applyDecision, initialState, startWeek } from '../engine/week'
import learnmore from '../content/learnmore.json'

const SCRIPT = makeScript('learn')

interface Policy {
  rules?: Partial<Rules>
  treat?: boolean
  want?: 'buy' | 'skip' | 'list'
  friend?: 'lend200' | 'lend50' | 'no'
  shortfall?: 'jar' | 'quickcash' | 'late'
  extra?: number
  sweep?: number
}

/** Plays the given week through to the done phase with a simple policy. */
function playWeek(state: State, week: number, p: Policy = {}): State {
  const script = SCRIPT[week - 1]
  let s = startWeek(state, script).state
  for (let guard = 0; s.phase.at !== 'done' && guard < 60; guard++) {
    const ph = s.phase
    let d: Decision
    if (ph.at === 'plan') d = { k: 'rules', rules: { ...NO_RULES, ...p.rules }, extra: p.extra ?? 0, testing: null }
    else if (ph.at === 'treat') d = { k: 'treat', day: ph.day, yes: p.treat ?? false }
    else if (ph.at === 'card') {
      const kind = ph.id.startsWith('T') ? 'want' : ph.id.startsWith('F') ? 'friend' : 'windfall'
      d = kind === 'want' ? { k: 'want', day: ph.day, id: ph.id, choice: p.want ?? 'skip' } : kind === 'friend' ? { k: 'friend', day: ph.day, id: ph.id, choice: p.friend ?? 'no' } : { k: 'windfall', day: ph.day, choice: 'keep' }
    } else if (ph.at === 'shortfall') d = { k: 'shortfall', day: ph.day, id: ph.id, choice: p.shortfall ?? 'late' }
    else d = { k: 'sweep', amount: p.sweep ?? 0 }
    s = applyDecision(s, script, d).state
  }
  return s
}
const at = (_week: number, pocket: number, jar: number, patch: Partial<State> = {}): State => ({ ...initialState(), pocket, jar, ...patch })
const ctx = (week: number, state: State) => ({ script: SCRIPT[week - 1], state })

describe('predictions: the truth comes from the student\'s own week, and a wrong guess costs nothing', () => {
  test('week 1: pocket plus jar at the end, in the three buckets', () => {
    const s = playWeek(at(1, 0, 0), 1, { treat: true, want: 'buy' }) // 650 - 105 - 120 - 250 - 150 = 25 ... all bought
    expect(predictionTruth(1, ctx(1, s))).toBe('low')
    expect(predictionTruth(1, ctx(1, playWeek(at(1, 0, 0), 1)))).toBe('high') // skipped everything: ₹530
    expect(predictionTruth(1, ctx(1, playWeek(at(1, 0, 0), 1, { treat: true, want: 'buy' })))).toBeDefined()
  })
  test('week 2: small treats this week; week 3: how much the jar grew', () => {
    expect(predictionTruth(2, ctx(2, playWeek(at(2, 0, 0), 2, { treat: true })))).toBe('high') // ₹105 is over the ₹100 edge
    expect(predictionTruth(2, ctx(2, playWeek(at(2, 0, 0), 2, { treat: true, rules: { lunch: true } })))).toBe('mid') // ₹80
    expect(predictionTruth(2, ctx(2, playWeek(at(2, 0, 0), 2)))).toBe('low')
    expect(predictionTruth(3, ctx(3, playWeek(at(3, 0, 0), 3, { rules: { savePct: 30 } })))).toBe('mid') // jar grew ₹270
    expect(predictionTruth(3, ctx(3, playWeek(at(3, 0, 0), 3, { rules: { savePct: 0 } })))).toBe('low')
  })
  test('week 4: where the big bill\'s money came from (pocket, jar, or borrowing/paying late)', () => {
    expect(predictionTruth(4, ctx(4, playWeek(at(4, 600, 0), 4)))).toBe('pocket')
    expect(predictionTruth(4, ctx(4, playWeek(at(4, 0, 500), 4, { treat: true, want: 'buy', shortfall: 'jar' })))).toMatch(/pocket|jar/)
    const poor = at(4, 0, 0)
    expect(predictionTruth(4, ctx(4, playWeek(poor, 4, { treat: true, want: 'buy', shortfall: 'quickcash' })))).toMatch(/pocket|borrow/)
  })
  test('weeks 5-8 have fixed truths from the script', () => {
    expect(predictionTruth(5, ctx(5, playWeek(at(5, 0, 0), 5)))).toBe('many') // two surprise bills
    expect(predictionTruth(6, ctx(6, playWeek(at(6, 0, 0), 6)))).toBe('3') // ₹1,000 of offers at ₹250 a week
    expect(predictionTruth(7, ctx(7, playWeek(at(7, 0, 0), 7)))).toBe('50')
    expect(predictionTruth(8, ctx(8, playWeek(at(8, 0, 0), 8)))).toBe('one') // Sunny repays, Ayesha does not
    expect(predictionTruth(9, ctx(8, playWeek(at(8, 0, 0), 8)))).toBeNull()
  })
  test('scoring: 1 exact, 0.5 one bucket away (ordered questions), 0 otherwise; the where-from question is exact only', () => {
    expect([predictionScore(1, 'mid', 'mid'), predictionScore(1, 'low', 'mid'), predictionScore(1, 'low', 'high')]).toEqual([1, 0.5, 0])
    expect([predictionScore(4, 'jar', 'jar'), predictionScore(4, 'jar', 'pocket')]).toEqual([1, 0])
    expect(predictionScore(8, 'both', 'one')).toBe(0.5)
  })
})

describe('lessons: the "what happened" line is chosen from the student\'s own numbers', () => {
  test('L1 track it: close or far, with the actual amount', () => {
    const s = playWeek(at(1, 0, 0), 1)
    expect(lessonFor(1, ctx(1, s), { answer: 'high', truth: 'high' })).toMatchObject({ key: 'L1.close', vars: { actual: 530 } })
    expect(lessonFor(1, ctx(1, s), { answer: 'low', truth: 'high' }).key).toBe('L1.far')
  })
  test('L2 small spends: how many, how much, and a month of it', () => {
    const s = playWeek(at(2, 0, 0), 2, { treat: true })
    expect(lessonFor(2, ctx(2, s)).vars).toEqual({ n: 6, x: 105, y: 420 })
  })
  test('L3 pay yourself first: a share set aside, or what was saved from what was left', () => {
    const withShare = playWeek(at(3, 0, 0), 3, { rules: { savePct: 20 } })
    expect(lessonFor(3, ctx(3, withShare))).toMatchObject({ key: 'L3.share', vars: { s: 180 } })
    const without = playWeek(at(3, 0, 0), 3, { sweep: 100 })
    expect(lessonFor(3, ctx(3, without))).toMatchObject({ key: 'L3.none', vars: { m: 100, x: 180 } })
  })
  test('L4 emergency fund: jar, borrowed, paid late, or pocket (and the cash that slipped out on day 4)', () => {
    const key = (p: Policy, pocket: number, jar: number) => lessonFor(4, ctx(4, playWeek(at(4, pocket, jar), 4, p))).key
    expect(key({ treat: true, want: 'buy', shortfall: 'jar' }, 0, 800)).toMatch(/L4\.(jar|pocket)/)
    expect(lessonFor(4, ctx(4, playWeek(at(4, 600, 0), 4))).key).toBe('L4.pocket')
    expect(lessonFor(4, ctx(4, playWeek(at(4, 600, 0), 4))).vars.lost).toBeGreaterThan(0)
  })
  test('L5 plan for surprises: how many, how much, and the running average', () => {
    const first = playWeek(at(1, 0, 0), 1)
    const s = playWeek({ ...first, phase: { at: 'done' } }, 2)
    const l = lessonFor(5, ctx(5, { ...s, history: [{ ...s.history[0], surprises: 100 }, { ...s.history[0], surprises: 300 }] }))
    expect(l.key).toBe('L5.any')
    expect(l.vars.a).toBe(200)
  })
  test('L6 and L7: offers with a pressure trick, and a price in goal-weeks (bought or passed on)', () => {
    const passed = playWeek(at(6, 0, 0), 6)
    expect(lessonFor(6, ctx(6, passed)).vars).toEqual({ n: 3, b: 0 })
    expect(lessonFor(7, ctx(6, passed))).toMatchObject({ key: 'L7.passed', vars: { t: 1000 } })
    const bought = playWeek(at(6, 2000, 0), 6, { want: 'buy' })
    expect(lessonFor(7, ctx(6, bought))).toMatchObject({ key: 'L7.bought', vars: { item: 'T5', p: 300 } })
  })
  test('L8 cost of borrowing: Quick Cash, the jar, paying late, or the pocket', () => {
    const run = (p: Policy, pocket: number, jar: number) => lessonFor(8, ctx(7, playWeek(at(7, pocket, jar), 7, p)))
    expect(run({ shortfall: 'quickcash', treat: true, want: 'buy' }, 0, 0).key).toMatch(/L8\.(quickcash|pocket)/)
    expect(run({ shortfall: 'late' }, 0, 0).key).toMatch(/L8\.(late|pocket)/)
    expect(run({}, 3000, 0).key).toBe('L8.pocket')
  })
  test('L9 lending: not repaid, repaid, a smaller amount, or said no kindly', () => {
    expect(lessonFor(9, ctx(8, playWeek(at(8, 0, 0), 8, { friend: 'no' })))).toMatchObject({ key: 'L9.no', vars: { x: 200 } })
    expect(lessonFor(9, ctx(8, playWeek(at(8, 0, 0), 8, { friend: 'lend200' }))).key).toBe('L9.notRepaid') // Ayesha does not repay
    expect(lessonFor(9, ctx(8, playWeek(at(8, 0, 0), 8, { friend: 'lend50' }))).key).toMatch(/L9\.small/)
  })
  test('every lesson has its Learn more script with all five parts', () => {
    for (let c = 1; c <= 9; c++) {
      const m = (learnmore as Record<string, Record<string, string>>)[String(c)]
      for (const part of ['idea', 'example', 'real', 'ask', 'rule']) expect(m[part]?.length, `${c}.${part}`).toBeGreaterThan(10)
    }
    expect(learnmore['9'].rule).toBe('Lend only what you could afford to lose.')
  })
})

describe('the learning flow after each week', () => {
  test('weeks teach the spec concepts: week 6 carries two', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9].map(weekConcepts)).toEqual([[1], [2], [3], [4], [5], [6, 7], [8], [9], []])
  })
  test('Name it, then Apply (a wrong answer gets one retry), then the notebook page, concept by concept', () => {
    let l = learnState([])[1]
    expect(nextLearnStep(1, l)).toEqual({ step: 'nameit', concept: 1 })
    l = learnState([{ k: 'nameit', concept: 1 }])[1]
    expect(nextLearnStep(1, l)).toEqual({ step: 'apply', concept: 1 })
    l = learnState([{ k: 'nameit', concept: 1 }, { k: 'apply', concept: 1, answer: 'A' }])[1]
    expect(applyStatus(1, l.concepts[1].apply)).toBe('retry')
    expect(nextLearnStep(1, l)).toEqual({ step: 'apply', concept: 1 }) // one retry
    l = learnState([{ k: 'nameit', concept: 1 }, { k: 'apply', concept: 1, answer: 'A' }, { k: 'apply', concept: 1, answer: 'C' }])[1]
    expect(applyStatus(1, l.concepts[1].apply)).toBe('revealed') // the right answer is shown, then on
    expect(nextLearnStep(1, l)).toEqual({ step: 'notebook', concept: 1 })
    expect(applyAnswer(1)).toBe('B')
  })
  test('learning answers belong to the week they were given in and never change the money', () => {
    const ds = [{ k: 'predict', answer: 'mid' }, { k: 'nextweek' }, { k: 'predict', answer: 'low' }] as const
    const l = learnState([...ds])
    expect([l[1].predict, l[2].predict]).toEqual(['mid', 'low'])
  })
  test('the biggest group is spending only, never "saved"', () => {
    const s = playWeek(at(1, 0, 0), 1, { treat: true, want: 'buy' })
    const where = weekLedger(s.events, 0).where
    expect(biggestGroup(where)).toBe('wants') // ₹400 of wants against ₹250 of must-haves
    expect(where.map((g) => g.key)).not.toContain('saved')
  })
})
