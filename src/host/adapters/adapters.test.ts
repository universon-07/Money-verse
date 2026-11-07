import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PILLAR_IDS } from '../../content/data'
import { caseFilesPayload, dealBoardPayload, festivalPayload, payRunPayload, RUN_KINDS, type RunKind } from '../placeholders/payloads'
import { ADAPTERS, adaptCaseFiles, adaptDealBoard, adaptFestival, adaptPayRun } from './index'
import type { GameResult } from '../types'

const base = { seed: 'mm-test', cohortCode: null, festival: 'diwali' as const }

let warn: ReturnType<typeof vi.spyOn>
beforeEach(() => {
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())

/** every adapter must return a well-formed GameResult whatever it is given */
function expectWellFormed(r: GameResult, pillar: string) {
  expect(r.pillar).toBe(pillar)
  expect(typeof r.cleared).toBe('boolean')
  for (const n of [r.quality, r.partial]) {
    expect(Number.isFinite(n)).toBe(true)
    expect(n).toBeGreaterThanOrEqual(0)
    expect(n).toBeLessThanOrEqual(1)
  }
  if (!r.cleared) expect(r.partial).toBeLessThan(1)
  if (r.cleared) expect(r.partial).toBe(1)
  for (const v of Object.values(r.skills)) {
    expect(Number.isFinite(v)).toBe(true)
    expect(v).toBeGreaterThanOrEqual(0)
    expect(v).toBeLessThanOrEqual(1)
  }
  expect(Array.isArray(r.lessonsSeen)).toBe(true)
  for (const v of Object.values(r.joySignals)) expect(Number.isFinite(v)).toBe(true)
}

describe('every adapter, every sample payload (what the placeholder games send)', () => {
  const builders = { plan: festivalPayload, save: payRunPayload, invest: dealBoardPayload, safe: caseFilesPayload } as const
  const expectedCleared: Record<RunKind, boolean> = { great: true, ok: true, poor: false, quit: false }
  for (const pillar of PILLAR_IDS) {
    for (const kind of RUN_KINDS) {
      it(`${pillar} / ${kind}: ${expectedCleared[kind] ? 'cleared' : 'not cleared'} and well formed`, () => {
        const r = ADAPTERS[pillar](builders[pillar](kind, base))
        expectWellFormed(r, pillar)
        expect(r.cleared).toBe(expectedCleared[kind])
      })
    }
  }
})

describe('every adapter survives garbage input without throwing', () => {
  const garbage: unknown[] = [undefined, null, 0, 1, 'text', true, [], [1, 2], {}, { a: 1 }, NaN, Infinity, () => 1, { stars: 'x', score: 'y', parts: 5, skills: [], shieldPieces: 'protect', status: 7, diamonds: 'lots' }]
  for (const pillar of PILLAR_IDS) {
    it(`${pillar}`, () => {
      for (const g of garbage) {
        let r!: GameResult
        expect(() => { r = ADAPTERS[pillar](g) }).not.toThrow()
        expectWellFormed(r, pillar)
        expect(r.cleared).toBe(false)
      }
    })
  }
  it('keeps the original payload in raw, untouched', () => {
    const p = payRunPayload('great', base)
    expect(adaptPayRun(p).raw).toBe(p)
  })
})

describe('Festival Countdown', () => {
  it('a great run: all four stars, every skill full, friendship from the Balance score', () => {
    const r = adaptFestival(festivalPayload('great', base))
    expect(r).toMatchObject({ pillar: 'plan', cleared: true, quality: 1, partial: 1 })
    expect(r.skills).toEqual({ prioritising: 1, planning: 1, patience: 1, saving: 1 })
    expect(r.joySignals).toMatchObject({ friendship: 75, restedOrBalanced: 3, treatsBought: 0 })
    expect(r.lessonsSeen).toContain('needs-before-wants')
  })
  it('an OK run clears on 3 stars; Balance 8 means a middling friendship', () => {
    const r = adaptFestival(festivalPayload('ok', base))
    expect(r.cleared).toBe(true)
    expect(r.quality).toBe(0.75)
    expect(r.joySignals.friendship).toBe(50)
  })
  it('a poor run does not clear, keeps partial below 1, and reports ring-toss plays as treats', () => {
    const r = adaptFestival(festivalPayload('poor', base))
    expect(r.cleared).toBe(false)
    expect(r.quality).toBe(0.35)
    expect(r.partial).toBe(0.35)
    expect(r.joySignals).toMatchObject({ treatsBought: 3, friendship: 25 })
  })
  it.each([
    ['exactly 3 stars, low score', { ghar: true, gift: true, dost: true, plan: false }, 10, true],
    ['2 stars, score 69', { ghar: true, gift: true, dost: false, plan: false }, 69, false],
    ['no stars, score exactly 70', { ghar: false, gift: false, dost: false, plan: false }, 70, true],
    ['4 stars', { ghar: true, gift: true, dost: true, plan: true }, 0, true],
    ['score above 100 is clamped', { ghar: false, gift: false, dost: false, plan: false }, 500, true],
  ])('clear rule: %s', (_name, stars, total, expected) => {
    const r = adaptFestival({ stars, score: { total } })
    expect(r.cleared).toBe(expected)
    expect(r.quality).toBeLessThanOrEqual(1)
  })
  it('only a literal true counts as a star', () => {
    expect(adaptFestival({ stars: { ghar: 'true', gift: 1, dost: 'yes', plan: {} }, score: { total: 10 } }).cleared).toBe(false)
  })
  it('a quit (no stars or score) is not cleared and uses the optional progress', () => {
    const r = adaptFestival(festivalPayload('quit', base))
    expect(r).toMatchObject({ cleared: false, quality: 0, partial: 0.34 })
    expect(warn).toHaveBeenCalled()
  })
  it('an explicit friendship in the evidence overrides the one derived from Balance', () => {
    const r = adaptFestival({ stars: { dost: true }, score: { total: 50, balance: 15 }, evidence: { friendship: 90 } })
    expect(r.joySignals.friendship).toBe(90)
  })
  it('falls back to the Dost star when there is no Balance score', () => {
    expect(adaptFestival({ stars: { dost: true }, score: { total: 50 } }).joySignals.friendship).toBe(75)
    expect(adaptFestival({ stars: { dost: false }, score: { total: 50 } }).joySignals.friendship).toBe(40)
  })
  it('ignores numeric strings, NaN and unknown keys', () => {
    const r = adaptFestival({ stars: { ghar: true }, score: { total: '90', needs: NaN, shopping: 10, bogus: 5 }, extra: 1 })
    expect(r.quality).toBe(0.25)
    expect(r.skills).toEqual({ patience: 0.5 })
    expect(r.cleared).toBe(false)
  })
  it('swaps and ring toss become non-negative signals', () => {
    const r = adaptFestival({ stars: { ghar: true }, score: { total: 50 }, evidence: { swaps: -4, ringTossPlays: -1 } })
    expect(r.joySignals).toMatchObject({ restedOrBalanced: 0, treatsBought: 0 })
  })
})

describe('Pay Run', () => {
  it('a great run clears by reaching the goal; skills map from the five parts', () => {
    const r = adaptPayRun(payRunPayload('great', base))
    expect(r).toMatchObject({ pillar: 'save', cleared: true, partial: 1 })
    expect(r.quality).toBeCloseTo(0.95)
    expect(r.skills.planning).toBe(1)
    expect(r.skills.riskSense).toBe(1)
    expect(r.skills.prioritising).toBeCloseTo(22 / 25)
    expect(r.skills.saving).toBe(1)
  })
  it('an OK run clears by habits alone even though the goal was not reached', () => {
    const r = adaptPayRun(payRunPayload('ok', base))
    expect(r.cleared).toBe(true)
    expect(r.quality).toBeCloseTo(0.72)
  })
  it('a poor run does not clear; partial is the jar over the goal', () => {
    const r = adaptPayRun(payRunPayload('poor', base))
    expect(r.cleared).toBe(false)
    expect(r.partial).toBeCloseTo(900 / 5000)
    expect(r.joySignals).toMatchObject({ treatsBought: 6, treatsSkipped: 0, lentToFriends: 3 })
  })
  it.each([
    ['habit score exactly 70', { saving: 20, buffer: 15, spending: 15, planning: 10, lending: 10 }, false, true],
    ['habit score 69', { saving: 20, buffer: 15, spending: 15, planning: 10, lending: 9 }, false, false],
    ['goal reached with a low score', { saving: 1, buffer: 1, spending: 1, planning: 1, lending: 1 }, true, true],
  ])('clear rule: %s', (_n, parts, goalReached, expected) => {
    expect(adaptPayRun({ parts, goalReached, shifts: 12 }).cleared).toBe(expected)
  })
  it('clamps each part to its maximum', () => {
    const r = adaptPayRun({ parts: { saving: 999, buffer: 999, spending: 999, planning: 999, lending: 999 }, shifts: 5 })
    expect(r.quality).toBe(1)
    expect(Object.values(r.skills).every((v) => v <= 1)).toBe(true)
  })
  it('accepts the alias names for parts and the parts container', () => {
    const r = adaptPayRun({ habitScore: { savingHabit: 25, spendingControl: 25, buffer: 20, planning: 15, lending: 15 } })
    expect(r.cleared).toBe(true)
    expect(r.quality).toBe(1)
  })
  it('uses a reported habit total when the parts are missing', () => {
    expect(adaptPayRun({ habitTotal: 80 }).cleared).toBe(true)
  })
  it('partial falls back to shifts/12 when the jar is not reported', () => {
    expect(adaptPayRun({ parts: { saving: 1 }, shifts: 6 }).partial).toBe(0.5)
  })
  it('all work, no joy: many shifts with no purchase bought, inferred when there are no counters', () => {
    const r = adaptPayRun({ parts: { spending: 25 }, shifts: 8 })
    expect(r.joySignals).toMatchObject({ treatsBought: 0, treatsSkipped: 8 })
  })
  it('at least one purchase is assumed when Spending control is low and there are no counters', () => {
    expect(adaptPayRun({ parts: { spending: 4 }, shifts: 8 }).joySignals).toMatchObject({ treatsBought: 1, treatsSkipped: 0 })
  })
  it('reported counters win over inference', () => {
    const r = adaptPayRun({ parts: { spending: 25 }, shifts: 8, counters: { purchasesBought: 2, purchasesSkipped: 1, friendsLent: 4 } })
    expect(r.joySignals).toEqual({ treatsBought: 2, treatsSkipped: 1, lentToFriends: 4 })
  })
  it('a quit uses the optional progress', () => {
    const r = adaptPayRun(payRunPayload('quit', base))
    expect(r).toMatchObject({ cleared: false, quality: 0, partial: 0.25 })
  })
})

describe('Deal Board (lite)', () => {
  it('a great run clears; skills are normalised from 0..20 and mapped', () => {
    const r = adaptDealBoard(dealBoardPayload('great', base))
    expect(r).toMatchObject({ pillar: 'invest', cleared: true, partial: 1 })
    expect(r.quality).toBe(0.82)
    expect(r.skills).toEqual({ planning: 18 / 20, scamSense: 17 / 20, riskSense: 16 / 20, patience: 15 / 20, saving: 16 / 20 })
  })
  it.each([
    [60, true],
    [59, false],
    [59.99, false],
    [100, true],
    [0, false],
  ])('clear rule: judgement %s -> %s', (judgement, expected) => {
    expect(adaptDealBoard({ judgement }).cleared).toBe(expected)
  })
  it('derives the judgement from the five skills when it is not reported', () => {
    const r = adaptDealBoard({ skills: { research: 12, skepticism: 12, spread: 12, calm: 12, habits: 12 } })
    expect(r.quality).toBe(0.6)
    expect(r.cleared).toBe(true)
  })
  it('a poor run is not cleared and its partial is capped below 1', () => {
    const r = adaptDealBoard(dealBoardPayload('poor', base))
    expect(r.cleared).toBe(false)
    expect(r.partial).toBe(0.99)
  })
  it('a quit uses the quarters played', () => {
    expect(adaptDealBoard(dealBoardPayload('quit', base)).partial).toBeCloseTo(5 / 12)
  })
  it('never reads play-money amounts: profit and net worth reach neither skills, quality nor joy signals', () => {
    const r = adaptDealBoard({ ...dealBoardPayload('great', base), netWorth: 9_999_999, profit: 8_888_888, cash: 7_777_777 })
    const { raw: _raw, ...rest } = r
    const text = JSON.stringify(rest)
    for (const amount of ['9999999', '8888888', '7777777', '123456', '23456']) expect(text).not.toContain(amount)
    expect(Object.keys(r.joySignals)).toEqual(['restedOrBalanced'])
    expect(r.joySignals.restedOrBalanced).toBeLessThanOrEqual(2)
  })
  it('clamps skills above their maximum and ignores unknown keys', () => {
    const r = adaptDealBoard({ judgement: 80, skills: { research: 99, extra: 5 } })
    expect(r.skills.planning).toBe(1)
    expect(Object.keys(r.skills)).toEqual(['planning'])
  })
})

describe('Case Files: Mohalla Detective', () => {
  it('a finished game clears and carries the rewards through', () => {
    const r = adaptCaseFiles(caseFilesPayload('great', base))
    expect(r).toMatchObject({ pillar: 'safe', cleared: true, partial: 1, quality: 0.9 })
    expect(r.rewards).toEqual({ diamonds: 505, shieldPieces: ['protect', 'verify', 'pause'], title: 'Chief Inspector' })
    expect(r.skills).toEqual({ scamSense: 0.9 })
    expect(r.joySignals).toEqual({})
  })
  it('in progress does not clear; partial follows the stage reached', () => {
    const r = adaptCaseFiles(caseFilesPayload('poor', base))
    expect(r.cleared).toBe(false)
    expect(r.partial).toBeCloseTo(2 / 6)
    expect(r.rewards?.shieldPieces).toEqual(['protect'])
  })
  it.each([
    ['tutorial', 1 / 6],
    ['case3', 4 / 6],
    ['master', 1],
  ])('stage %s gives partial %s', (stage, expected) => {
    const r = adaptCaseFiles({ status: 'in_progress', stage })
    expect(r.partial).toBeCloseTo(Math.min(0.99, expected))
  })
  it('quality falls back to shield pieces out of 3 when accuracy is not reported', () => {
    expect(adaptCaseFiles({ status: 'complete', shieldPieces: ['protect', 'verify'] }).quality).toBeCloseTo(2 / 3)
  })
  it('partial falls back to shield pieces when there is no stage or progress', () => {
    expect(adaptCaseFiles({ status: 'in_progress', shieldPieces: ['protect', 'verify'] }).partial).toBe(0.5)
  })
  it('an invalid or missing status is never a clear, and warns', () => {
    expect(adaptCaseFiles({ status: 'done', shieldPieces: ['protect'] }).cleared).toBe(false)
    expect(adaptCaseFiles({}).cleared).toBe(false)
    expect(warn).toHaveBeenCalled()
  })
  it('drops unknown shield pieces, negative diamonds and an empty title', () => {
    const r = adaptCaseFiles({ status: 'in_progress', shieldPieces: ['protect', 'sword'], diamonds: -20, title: '   ' })
    expect(r.rewards).toEqual({ diamonds: 0, shieldPieces: ['protect'] })
  })
  it('floors fractional diamonds', () => {
    expect(adaptCaseFiles({ status: 'complete', diamonds: 31.9 }).rewards?.diamonds).toBe(31)
  })
  it('a quit uses the optional progress', () => {
    expect(adaptCaseFiles({ status: 'in_progress', progress: 0.4 }).partial).toBe(0.4)
  })
})

describe('Pocket Panic (save)', () => {
  const ev = { payFirst: true, track: true, small: true, emergency: true, plan: true, wait: true, goals: true, borrow: true, lend: true }
  const cafe = (over: object = {}) => ({ game: 'cafe', cohortCode: '', seed: 's', score: { balance: 3, saved: 500, behaviours: 9, total: 9 }, evidence: ev, lessonsSeen: ['a'], minaretLit: true, ...over })
  it('a full run is cleared with top quality and skills, and ignores play money', () => {
    const r = ADAPTERS.save(cafe())
    expect(r).toMatchObject({ pillar: 'save', cleared: true, quality: 1, partial: 1, lessonsSeen: ['a'] })
    expect(r.skills).toEqual({ saving: 1, planning: 1, patience: 1 })
  })
  it('treats, kindness and a balanced month lift Happy; refusing everything does not', () => {
    const warm = ADAPTERS.save(cafe({ joy: { treatsBought: 3, treatsSkipped: 1, lent: 1, stars: 3 } }))
    expect(warm.joySignals).toEqual({ treatsBought: 3, treatsSkipped: 1, lentToFriends: 1, restedOrBalanced: 2 })
    const grim = ADAPTERS.save(cafe({ joy: { treatsBought: 0, treatsSkipped: 5, lent: 0, stars: 0 } }))
    expect(grim.joySignals).toMatchObject({ treatsBought: 0, treatsSkipped: 5, restedOrBalanced: 0 })
  })
  it('a weak run is not cleared and is partial', () => {
    const r = ADAPTERS.save(cafe({ minaretLit: false, score: { balance: 0, saved: 0, behaviours: 3, total: 3 }, evidence: { payFirst: true } }))
    expect(r.cleared).toBe(false)
    expect(r.partial).toBeCloseTo(3 / 9)
  })
  it('a quit has no skills and keeps progress below 1', () => {
    const r = ADAPTERS.save({ game: 'cafe', progress: 0.4 })
    expect(r).toMatchObject({ cleared: false, partial: 0.4, skills: {} })
  })
  it('an old Pay Run payload still goes to the Pay Run adapter', () => {
    expect(ADAPTERS.save({ game: 'payrun', goalReached: true, jar: 1800, goal: 1800, shifts: 8 }).cleared).toBe(true)
  })
})

describe('one point system across all four games', () => {
  it('a perfect clear is worth the same share of the goal in every pillar', () => {
    const results = [
      ADAPTERS.plan({ game: 'festival', stars: { goals: true, onTime: true, resilient: true, cleanBooks: true }, score: { goals: 40, onTime: 20, resilience: 20, smart: 20, total: 100 }, minaretLit: true }),
      ADAPTERS.save({ game: 'cafe', score: { total: 9 }, evidence: { payFirst: true, track: true, small: true, emergency: true, plan: true, wait: true, goals: true, borrow: true, lend: true }, minaretLit: true }),
      ADAPTERS.invest({ game: 'dealboard', judgement: 100, skills: { research: 20, skepticism: 20, spread: 20, calm: 20, habits: 20 } }),
      ADAPTERS.safe({ status: 'complete', shieldPieces: ['protect', 'verify', 'pause'], firstTryAccuracy: 1 }),
    ]
    for (const r of results) expect(r).toMatchObject({ cleared: true, quality: 1, partial: 1 })
  })
  it('happiness signals only ever use the shared set, and a game that reports none leaves Happy alone', () => {
    const allowed = ['friendship', 'treatsBought', 'treatsSkipped', 'lentToFriends', 'scammed', 'restedOrBalanced']
    const plan = ADAPTERS.plan({ game: 'festival', stars: { goals: true, resilient: true }, score: { goals: 40, resilience: 20, total: 80 }, minaretLit: true })
    expect(plan.joySignals.restedOrBalanced).toBe(1)
    for (const r of [plan, ADAPTERS.safe({ status: 'complete', shieldPieces: [] }), ADAPTERS.invest({ judgement: 90 })]) {
      for (const k of Object.keys(r.joySignals)) expect(allowed).toContain(k)
    }
    expect(ADAPTERS.safe({ status: 'complete', shieldPieces: [] }).joySignals).toEqual({})
    expect(ADAPTERS.invest({ judgement: 90, skills: { calm: 20, spread: 5 } }).joySignals).toEqual({ restedOrBalanced: 1 })
  })
})
