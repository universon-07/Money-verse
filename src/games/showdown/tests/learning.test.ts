import { describe, expect, test } from 'vitest'
import { factsOf, lowestConcepts, masteryOf } from '../engine/concepts'
import { lessonFor } from '../engine/lessons'
import type { Decision } from '../engine/log'
import { reportOf, toGameResult } from '../engine/report'
import { presetLog } from '../state/presets'

const ANSWERS: Decision[] = [{ k: 'predict', id: 'P2', answer: 'reliable' }, { k: 'predict', id: 'P4', answer: 'parts' }]
const planB = (): Decision[] => [...presetLog('B', 'futures'), { k: 'seen', screen: 'futures' } as Decision, ...ANSWERS]
const planA = (): Decision[] => [...presetLog('A', 'futures'), { k: 'seen', screen: 'futures' } as Decision]

describe('what play shows about each concept (section 9: prediction + behaviour)', () => {
  test('Plan B shows every concept: both signals met on all six', () => {
    const f = factsOf(planB())
    for (const c of Object.keys(f.signals) as (keyof typeof f.signals)[]) expect(f.signals[c], c).toMatchObject({ prediction: true, flag: true })
  })
  test('Plan A: the late payment and the cancelled sound are exactly what the signals pick up', () => {
    const f = factsOf(planA())
    expect(f.signals.C1).toMatchObject({ prediction: true, flag: false }) // it guessed "no" and Week 3 did break
    expect(f.signals.C2).toMatchObject({ prediction: true, flag: false }) // two goals met, but an item was cancelled
    expect(f.signals.C5).toMatchObject({ prediction: false, flag: false }) // thin cushion, survived 3 of 10
    expect(f.signals.C4).toMatchObject({ prediction: false, flag: true }) // P2 never asked, but Basic was not signed
    expect(f.survived).toBe(3)
  })
  test('the three weakest concepts are the ones that showed least in play (ties in concept order)', () => {
    expect(lowestConcepts(factsOf(planA()))).toEqual(['C5', 'C1', 'C2'])
    expect(lowestConcepts(factsOf(planB()))).toEqual(['C1', 'C2', 'C3']) // all tied, so the first three
  })
  test('"not sure" is no point and is logged as unsure', () => {
    const log = [...presetLog('B', 'futures'), { k: 'seen', screen: 'futures' } as Decision, { k: 'predict', id: 'P2', answer: 'unsure' } as Decision, { k: 'predict', id: 'P4', answer: 'parts' } as Decision]
    expect(factsOf(log).signals.C4).toMatchObject({ prediction: false, unsure: true })
  })
})

describe('mastery and the minaret', () => {
  test('from play only: Got it = guess and behaviour both shown, Getting there = one, otherwise Not yet', () => {
    const m = masteryOf(factsOf(planB()))
    expect(Object.values(m).every((x) => x.level === 'got')).toBe(true)
    const a = masteryOf(factsOf(planA()))
    expect(a.C4).toEqual({ points: 1, level: 'getting' })
    expect(a.C5).toEqual({ points: 0, level: 'not' })
    expect(a.C3.level).toBe('got')
  })
  test('the minaret needs at least 4 of 6 concepts at "Got it"', () => {
    expect(reportOf(planB()).minaretLit).toBe(true)
    const a = reportOf(planA())
    expect(a.minaretLit).toBe(false)
    expect(Object.values(a.mastery).filter((m) => m.level === 'got').length).toBeLessThan(4)
  })
})

describe('the report and the result for the hub', () => {
  test('scores: Plan B 98 and Plan A 45, with the title and stars from the spec', () => {
    const b = reportOf(planB())
    expect(b.score).toMatchObject({ goals: 40, onTime: 20, resilience: 18, smart: 20, total: 98 })
    expect(b.title).toBe('master')
    expect(b.stars).toEqual({ goals: true, onTime: true, resilient: true, cleanBooks: true })
    const a = reportOf(planA())
    expect(a.score.total).toBe(45)
    expect(a.title).toBe('careful')
  })
  test('the lessons on the report are for the three lowest concepts, in the player\'s own numbers', () => {
    const a = reportOf(planA())
    expect(a.lowest).toEqual(['C5', 'C1', 'C2'])
    expect(a.lessons.map((l) => l.id)).toEqual(['L5', 'L1', 'L2'])
    expect(a.lessons[1]).toMatchObject({ key: 'L1.what', vars: { when: 'W3', due: 10500, cash: 6870 } })
    expect(a.lessons[2]).toMatchObject({ key: 'L2.what', vars: { item: 'reliable', goal: 'G3' } })
    expect(a.lessons[0]).toMatchObject({ key: 'L5.what', vars: { k: 3 } })
  })
  test('predictions are revealed with the truth; P1 is a made-up 12% rise', () => {
    const r = reportOf(planB())
    expect(r.predictions.map((p) => [p.id, p.truth, p.correct])).toEqual([['P1', '12', true], ['P2', 'reliable', true], ['P3', 'yes', true], ['P4', 'parts', true]])
  })
  test('the result has the shape the hub expects and holds no personal data', () => {
    const res = toGameResult(reportOf(planB()), 'K7M2', 'local', ['L1'])
    expect(res).toMatchObject({ game: 'festival', cohortCode: 'local', seed: 'K7M2', minaretLit: true, stars: { goals: true, onTime: true, resilient: true, cleanBooks: true }, score: { total: 98 } })
    expect(res.evidence).toMatchObject({ C1: 2, C2: 2, C3: 2, C4: 2, C5: 2, C7: 2, futuresSurvived: 9 })
    expect(JSON.stringify(res)).not.toMatch(/@|phone|name/i)
  })
  test('Learn-more variants exist for every card, and the lesson line changes with what the player did', () => {
    const f = factsOf(planB())
    expect(lessonFor('C1', planB(), f).key).toBe('L1.ok')
    expect(lessonFor('C4', planB(), f).key).toBe('L4.skip')
    const withBasic = [...presetLog('B', 'market'), { k: 'drop', item: 'big' } as Decision, { k: 'sign', item: 'basic' } as Decision]
    expect(lessonFor('C4', withBasic, factsOf(withBasic)).key).toBe('L4.what')
  })
})
