import { describe, expect, it } from 'vitest'
import { PILLAR_IDS } from '../content/data'
import { applyBurnout } from '../happy/apply'
import { HAPPY } from '../happy/config'
import { applyLifeMoment, LIFE_MOMENTS } from '../happy/moments'
import { applyGameResult } from '../progress/applyGameResult'
import { PROGRESS } from '../progress/config'
import { brightnessPenalty, earnedAmount, savedAmountFor } from '../progress/saved'
import { freshProgress, sanitizeProgress } from '../progress/state'
import type { PillarProgress, ProgressState } from '../progress/types'
import { deepFreeze, GOAL, player, result, SHARE, START } from '../test/factories'
import { balanceFor } from './balance/view'
import { buildHappyView, isToastSuppressed, shouldShowHappyToast } from './happy/view'
import { buildMomentsView } from './moments/view'
import { buildProgressView } from './progress/view'

/** a player whose listed pillars are complete at the given brightness */
const lit = (spec: Partial<Record<(typeof PILLAR_IDS)[number], 'bright' | 'dim' | 'flicker'>>, base: ProgressState = player()): ProgressState => {
  const s = { ...base, pillars: { ...base.pillars } }
  for (const [id, brightness] of Object.entries(spec) as [(typeof PILLAR_IDS)[number], 'bright' | 'dim' | 'flicker'][]) {
    s.pillars[id] = { status: 'complete', brightness, partial: 1, bestQuality: 0.8, attempts: 1, lessonsSeen: [], skillsTouched: [] } satisfies PillarProgress
  }
  return s
}

describe('saved.ts helpers', () => {
  it('earnedAmount is what cleared pillars have added, at their brightness', () => {
    expect(earnedAmount(player())).toBe(0)
    expect(earnedAmount(lit({ plan: 'bright', save: 'dim' }))).toBe(SHARE + SHARE * 0.75)
  })
  it('savedAmountFor still equals start + earned - spent', () => {
    const s = { ...lit({ plan: 'dim' }), lifeMomentSpend: 100 }
    expect(savedAmountFor(s)).toBe(START + earnedAmount(s) - 100)
  })
  it('brightnessPenalty is the share x (1 - multiplier) summed over cleared pillars', () => {
    expect(brightnessPenalty(player())).toBe(0)
    expect(brightnessPenalty(lit({ plan: 'bright' }))).toBe(0)
    expect(brightnessPenalty(lit({ plan: 'dim' }))).toBe(Math.round(SHARE * (1 - PROGRESS.multiplier.dim)))
    expect(brightnessPenalty(lit({ plan: 'flicker' }))).toBe(Math.round(SHARE * (1 - PROGRESS.multiplier.flicker)))
    expect(brightnessPenalty(lit({ plan: 'dim', save: 'flicker', invest: 'bright' }))).toBe(1625 + 3250)
  })
  it('equals what four pillars would add at full brightness minus what they add now', () => {
    const s = lit({ plan: 'flicker', save: 'flicker', invest: 'dim', safe: 'bright' })
    const fullBright = lit({ plan: 'bright', save: 'bright', invest: 'bright', safe: 'bright' })
    expect(brightnessPenalty(s)).toBe(savedAmountFor(fullBright) - savedAmountFor(s))
  })
  it('ignores pillars that are not complete', () => {
    const s = player()
    s.pillars.plan = { status: 'in_progress', brightness: null, partial: 0.9, bestQuality: 1, attempts: 2, lessonsSeen: [], skillsTouched: [] }
    expect(brightnessPenalty(s)).toBe(0)
  })
  it('is zero when there is no goal', () => {
    expect(brightnessPenalty({ ...lit({ plan: 'flicker' }), goalAmount: 0 })).toBe(0)
  })
})

describe('buildProgressView: states', () => {
  it('a new player: every pillar not started, nothing lit, goal at the start amount', () => {
    const v = buildProgressView(player())
    expect(v.pillars.map((p) => p.state)).toEqual(['notStarted', 'notStarted', 'notStarted', 'notStarted'])
    expect(v.counts).toEqual({ total: 4, lit: 0, bright: 0, dim: 0, flicker: 0 })
    expect(v.goal).toEqual({ saved: START, target: GOAL, percent: Math.round((START / GOAL) * 100) })
    expect(v.happyPenalty).toEqual({ active: false, lostAmount: 0, pillarCount: 0 })
    expect(v.summary.key).toBe('progress.summary.none')
  })
  it('every pillar appears once, in pillar order, with its name key', () => {
    const v = buildProgressView(player())
    expect(v.pillars.map((p) => p.id)).toEqual([...PILLAR_IDS])
    expect(v.pillars[0].nameKey).toBe('pillars.plan.name')
  })
  it.each([
    ['bright', 'full'],
    ['dim', 'dim'],
    ['flicker', 'faint'],
  ] as const)('a %s pillar: state, label key and icon (%s)', (brightness, icon) => {
    const p = buildProgressView(lit({ plan: brightness })).pillars[0]
    expect(p).toMatchObject({ state: brightness, stateLabelKey: `state.${brightness}`, icon, status: 'complete', partial: 1, partialPercent: 100 })
  })
  it('an in-progress pillar is "partial" and shows its percent', () => {
    const s = player()
    s.pillars.save = { status: 'in_progress', brightness: null, partial: 0.456, bestQuality: 0.3, attempts: 2, lessonsSeen: [], skillsTouched: [] }
    const p = buildProgressView(s).pillars[1]
    expect(p).toMatchObject({ state: 'partial', icon: 'half', stateLabelKey: 'state.partial', partialPercent: 46, qualityPercent: 30, attempts: 2 })
  })
  it('a never-played pillar is "notStarted" with an empty icon', () => {
    expect(buildProgressView(player()).pillars[2]).toMatchObject({ state: 'notStarted', icon: 'empty', stateLabelKey: 'state.notStarted' })
  })
  it('partial progress never reads as 100% unless the pillar is complete', () => {
    const s = applyGameResult(player(), result('invest', { cleared: false, partial: 1 }))
    expect(buildProgressView(s).pillars[2].partialPercent).toBeLessThan(100)
  })
  it('passes lessons and skills touched through', () => {
    let s = applyGameResult(player(), result('plan', { lessonsSeen: ['a', 'b'], skills: { saving: 0.5, planning: 0.4 } }))
    s = applyGameResult(s, result('plan', { skills: { riskSense: 0.2 }, lessonsSeen: ['b', 'c'] }))
    const p = buildProgressView(s).pillars[0]
    expect(p.lessonsSeen).toEqual(['a', 'b', 'c'])
    expect(p.skillsTouched).toEqual(['planning', 'saving', 'riskSense'])
  })
  it('skills a game reports as 0 still count as touched', () => {
    const s = applyGameResult(player(), result('save', { skills: { scamSense: 0 } }))
    expect(buildProgressView(s).pillars[1].skillsTouched).toEqual(['scamSense'])
  })
})

describe('buildProgressView: action label', () => {
  const action = (s: ProgressState) => buildProgressView(s).pillars[0].actionKey
  it('start, continue, replay, brighten', () => {
    expect(action(player())).toBe('start')
    expect(action(applyGameResult(player(), result('plan', { cleared: false, partial: 0.2 })))).toBe('continue')
    expect(action(lit({ plan: 'bright' }))).toBe('replay')
    expect(action(lit({ plan: 'dim' }))).toBe('brighten')
    expect(action(lit({ plan: 'flicker' }))).toBe('brighten')
  })
})

describe('buildProgressView: counts and summary', () => {
  const sum = (s: ProgressState) => buildProgressView(s).summary
  it('all four bright', () => {
    const v = buildProgressView(lit({ plan: 'bright', save: 'bright', invest: 'bright', safe: 'bright' }))
    expect(v.counts).toEqual({ total: 4, lit: 4, bright: 4, dim: 0, flicker: 0 })
    expect(v.summary.key).toBe('progress.summary.allBright')
  })
  it('some complete, all bright', () => {
    expect(sum(lit({ plan: 'bright', save: 'bright' }))).toEqual({ key: 'progress.summary.lit', params: { lit: 2, total: 4, dim: 0, flicker: 0 } })
  })
  it('with dim, with faint, and with both', () => {
    expect(sum(lit({ plan: 'bright', save: 'dim' })).key).toBe('progress.summary.litDim')
    expect(sum(lit({ plan: 'bright', save: 'flicker' })).key).toBe('progress.summary.litFaint')
    expect(sum(lit({ plan: 'dim', save: 'flicker' }))).toEqual({ key: 'progress.summary.litDimFaint', params: { lit: 2, total: 4, dim: 1, flicker: 1 } })
  })
  it('four complete but one dim is not "all shining"', () => {
    expect(sum(lit({ plan: 'bright', save: 'bright', invest: 'bright', safe: 'dim' })).key).toBe('progress.summary.litDim')
  })
  it('an in-progress pillar is not counted as lit', () => {
    const s = applyGameResult(player(), result('plan', { cleared: false, partial: 0.5 }))
    expect(buildProgressView(s).counts.lit).toBe(0)
  })
})

describe('buildProgressView: goal and the Happy penalty', () => {
  it('goal percent follows the saved amount', () => {
    const v = buildProgressView(lit({ plan: 'bright' }))
    expect(v.goal).toEqual({ saved: START + SHARE, target: GOAL, percent: 35 })
  })
  it('goal percent is 0 with no goal and never above 100', () => {
    expect(buildProgressView(freshProgress(0, 0)).goal.percent).toBe(0)
    expect(buildProgressView(lit({ plan: 'bright', save: 'bright', invest: 'bright', safe: 'bright' })).goal.percent).toBe(100)
  })
  it('no penalty when every cleared pillar is bright', () => {
    expect(buildProgressView(lit({ plan: 'bright', save: 'bright' })).happyPenalty.active).toBe(false)
  })
  it('a dim pillar holds some back; a faint one more; the count is of pillars affected', () => {
    expect(buildProgressView(lit({ plan: 'dim' })).happyPenalty).toEqual({ active: true, lostAmount: 1625, pillarCount: 1 })
    expect(buildProgressView(lit({ plan: 'flicker' })).happyPenalty).toEqual({ active: true, lostAmount: 3250, pillarCount: 1 })
    expect(buildProgressView(lit({ plan: 'dim', save: 'flicker', invest: 'bright' })).happyPenalty).toEqual({ active: true, lostAmount: 4875, pillarCount: 2 })
  })
  it('brightening a pillar by replay removes its share of the penalty', () => {
    let s = applyGameResult(player({ happy: 20 }), result('plan'))
    expect(buildProgressView(s).happyPenalty.active).toBe(true)
    s = applyGameResult({ ...s, happy: 90 }, result('plan'))
    expect(buildProgressView(s).happyPenalty.active).toBe(false)
  })
  it('the penalty is not affected by life-moment spending', () => {
    const s = { ...lit({ plan: 'dim' }), lifeMomentSpend: 500 }
    expect(buildProgressView(s).happyPenalty.lostAmount).toBe(1625)
  })
  it('does not mutate its input', () => {
    expect(() => buildProgressView(deepFreeze(lit({ plan: 'dim' })))).not.toThrow()
  })
})

describe('state: skills touched and sanitising', () => {
  it('sanitize drops unknown and duplicate skills and orders them canonically', () => {
    const s = sanitizeProgress({ pillars: { plan: { status: 'in_progress', brightness: null, partial: 0.2, bestQuality: 0, attempts: 1, lessonsSeen: [], skillsTouched: ['scamSense', 'bogus', 'planning', 'planning'] as never } } as never })
    expect(s.pillars.plan.skillsTouched).toEqual(['planning', 'scamSense'])
  })
  it('a save from before skillsTouched existed loads with an empty list', () => {
    const s = sanitizeProgress({ pillars: { plan: { status: 'complete', brightness: 'bright', partial: 1, bestQuality: 1, attempts: 1, lessonsSeen: [] } } as never })
    expect(s.pillars.plan.skillsTouched).toEqual([])
  })
  it('sessionsSinceBreak is a non-negative whole number, defaulting to 0', () => {
    expect(sanitizeProgress({}).sessionsSinceBreak).toBe(0)
    expect(sanitizeProgress({ sessionsSinceBreak: 4.9 }).sessionsSinceBreak).toBe(4)
    expect(sanitizeProgress({ sessionsSinceBreak: -3 }).sessionsSinceBreak).toBe(0)
    expect(sanitizeProgress({ sessionsSinceBreak: NaN }).sessionsSinceBreak).toBe(0)
    expect(sanitizeProgress({ sessionsSinceBreak: '5' as never }).sessionsSinceBreak).toBe(0)
  })
})

describe('buildHappyView', () => {
  it.each([
    [100, 'glowing'],
    [60, 'glowing'],
    [59.9, 'ok'],
    [35, 'ok'],
    [34.9, 'tired'],
    [10, 'tired'],
  ] as const)('Happy %s is %s', (happy, band) => {
    const v = buildHappyView({ happy, sessionsSinceBreak: 0 })
    expect(v.band).toBe(band)
    expect(v.labelKey).toBe(`happy.band.${band}`)
  })
  it('gives a whole-number value for display', () => {
    expect(buildHappyView({ happy: 74.5, sessionsSinceBreak: 0 }).valueRounded).toBe(75)
    expect(buildHappyView({ happy: 70, sessionsSinceBreak: 0 }).valueRounded).toBe(70)
  })
  it('percent is rounded and clamped to 0..100', () => {
    expect(buildHappyView({ happy: 74.5, sessionsSinceBreak: 0 }).percent).toBe(75)
    expect(buildHappyView({ happy: 250, sessionsSinceBreak: 0 }).percent).toBe(100)
    expect(buildHappyView({ happy: -5, sessionsSinceBreak: 0 }).percent).toBe(0)
  })
  it('needs a break after the configured number of sessions in a row, not before', () => {
    const at = (n: number) => buildHappyView({ happy: 70, sessionsSinceBreak: n }).needsBreak
    expect(at(HAPPY.tiredAfterSessions - 1)).toBe(false)
    expect(at(HAPPY.tiredAfterSessions)).toBe(true)
    expect(at(50)).toBe(true)
    expect(at(0)).toBe(false)
  })
  it('treats a missing counter as 0', () => {
    expect(buildHappyView({ happy: 70 } as never).needsBreak).toBe(false)
  })
})

describe('sessions since a break', () => {
  it('every burnout adds one, even when Happy is already at the floor', () => {
    let s = player({ happy: HAPPY.min })
    for (let i = 0; i < 4; i++) s = applyBurnout(s)
    expect(s.sessionsSinceBreak).toBe(4)
    expect(s.happy).toBe(HAPPY.min)
  })
  it('three sessions in a row without a break trigger the note', () => {
    let s = player()
    for (let i = 0; i < HAPPY.tiredAfterSessions; i++) s = applyBurnout(s)
    expect(buildHappyView(s).needsBreak).toBe(true)
  })
  it('a life moment resets it to zero', () => {
    let s = player({ happy: 50 })
    for (let i = 0; i < 4; i++) s = applyBurnout(s)
    s = applyLifeMoment(s, 'restAtHome')
    expect(s.sessionsSinceBreak).toBe(0)
    expect(buildHappyView(s).needsBreak).toBe(false)
  })
  it('a life moment that cannot be afforded does not count as a break', () => {
    let s = player({ startAmount: 10, happy: 50 })
    for (let i = 0; i < 3; i++) s = applyBurnout(s)
    const after = applyLifeMoment(s, 'festivalTreat')
    expect(after).toBe(s)
    expect(after.sessionsSinceBreak).toBe(3)
  })
  it('an unknown life moment does not reset it', () => {
    let s = player()
    s = applyBurnout(applyBurnout(s))
    expect(applyLifeMoment(s, 'nope').sessionsSinceBreak).toBe(2)
  })
  it('a free moment, even one whose Happy gain has faded to nothing, still counts as a break', () => {
    let s = player({ startAmount: 0, happy: 90 })
    for (let i = 0; i < 6; i++) s = applyLifeMoment(s, 'restAtHome')
    s = applyBurnout(applyBurnout(applyBurnout(s)))
    expect(s.sessionsSinceBreak).toBe(3)
    expect(applyLifeMoment(s, 'restAtHome').sessionsSinceBreak).toBe(0)
  })
})

describe('shouldShowHappyToast', () => {
  const state = (happy: number, seen = false) => ({ happy, happyToastSeen: seen })
  it('is false while Happy is at or above the bright threshold', () => {
    expect(shouldShowHappyToast(state(100))).toBe(false)
    expect(shouldShowHappyToast(state(HAPPY.thresholds.bright))).toBe(false)
  })
  it('is true the first time Happy drops below it', () => {
    expect(shouldShowHappyToast(state(HAPPY.thresholds.bright - 0.1))).toBe(true)
    expect(shouldShowHappyToast(state(12))).toBe(true)
  })
  it('is false once it has been seen, however low Happy is', () => {
    expect(shouldShowHappyToast(state(12, true))).toBe(false)
  })
})

describe('isToastSuppressed', () => {
  it.each(['/play/plan', '/play/safe', '/play', '/story', '/story/x', '/welcome'])('stays out of the way on %s', (p) => expect(isToastSuppressed(p)).toBe(true))
  it.each(['/', '/progress', '/dashboard', '/wire', '/playground', '/storybook', '/welcomed', '/hub'])('may show on %s', (p) => expect(isToastSuppressed(p)).toBe(false))
})

describe('buildMomentsView', () => {
  it('lists every moment with keys, cost and the Happy it would give right now', () => {
    const list = buildMomentsView(player())
    expect(list.map((m) => m.id)).toEqual(LIFE_MOMENTS.map((m) => m.id))
    const chai = list.find((m) => m.id === 'chai')
    expect(chai).toMatchObject({ nameKey: 'moments.chai.name', descriptionKey: 'moments.chai.description', cost: 100, gainNow: 8, faded: false, affordable: true, timesUsed: 0 })
  })
  it('can be limited to a single moment, and an unknown id gives an empty list', () => {
    expect(buildMomentsView(player(), 'chai').map((m) => m.id)).toEqual(['chai'])
    expect(buildMomentsView(player(), 'nope')).toEqual([])
  })
  it('the gain halves with each use and the count goes up', () => {
    let s = player({ happy: 20 })
    s = applyLifeMoment(s, 'chai')
    expect(buildMomentsView(s).find((m) => m.id === 'chai')).toMatchObject({ gainNow: 4, timesUsed: 1, faded: false })
    s = applyLifeMoment(applyLifeMoment(s, 'chai'), 'chai')
    expect(buildMomentsView(s).find((m) => m.id === 'chai')?.gainNow).toBe(1)
  })
  it('the gain fades to nothing and is flagged', () => {
    let s = player({ happy: 20 })
    for (let i = 0; i < 6; i++) s = applyLifeMoment(s, 'chai')
    expect(buildMomentsView(s).find((m) => m.id === 'chai')).toMatchObject({ gainNow: 0, faded: true })
  })
  it('affordability follows what is saved', () => {
    const poor = buildMomentsView(player({ startAmount: 120 }))
    expect(poor.find((m) => m.id === 'chai')?.affordable).toBe(true)
    expect(poor.find((m) => m.id === 'festivalTreat')?.affordable).toBe(false)
    const broke = buildMomentsView(player({ startAmount: 0 }))
    expect(broke.find((m) => m.id === 'chai')?.affordable).toBe(false)
    expect(broke.find((m) => m.id === 'restAtHome')?.affordable).toBe(true)
  })
  it('after spending, what is left decides what can still be afforded', () => {
    const s = applyLifeMoment(player({ startAmount: 200 }), 'chai')
    expect(buildMomentsView(s).find((m) => m.id === 'chai')?.affordable).toBe(true)
    expect(buildMomentsView(applyLifeMoment(s, 'chai')).find((m) => m.id === 'chai')?.affordable).toBe(false)
  })
})

describe('balanceFor', () => {
  /** a player who spent `amount` on themselves across `breaks` life moments */
  const spent = (s: ProgressState, amount: number, breaks = 1): ProgressState => ({ ...s, lifeMomentSpend: amount, lifeMomentsUsed: breaks > 0 ? { chai: breaks } : {} })
  it('none: nothing earned and nothing spent', () => {
    expect(balanceFor(player())).toMatchObject({ earned: 0, spentOnSelf: 0, net: 0, tone: 'none', nextStepKey: 'balance.next.none', whyKey: 'balance.why', selfSharePercent: 0 })
  })
  it('allWork: earned a lot and never took a break', () => {
    const b = balanceFor(lit({ plan: 'bright', save: 'bright' }))
    expect(b).toMatchObject({ earned: 2 * SHARE, spentOnSelf: 0, breaksTaken: 0, tone: 'allWork', nextStepKey: 'balance.next.allWork', net: 2 * SHARE })
  })
  it('balanced: a break after every game, even though each costs very little next to what was earned', () => {
    const b = balanceFor(spent(lit({ plan: 'bright', save: 'bright' }), 200, 2))
    expect(b).toMatchObject({ tone: 'balanced', nextStepKey: 'balance.next.balanced', breaksTaken: 2, net: 2 * SHARE - 200 })
  })
  it('balanced: free breaks count, so resting at home is enough', () => {
    expect(balanceFor(spent(lit({ plan: 'bright' }), 0, 3)).tone).toBe('balanced')
  })
  it('the "all work" boundary is the configured number of breaks', () => {
    const base = lit({ plan: 'bright' })
    expect(balanceFor(spent(base, 0, HAPPY.balance.allWorkBelowBreaks - 1)).tone).toBe('allWork')
    expect(balanceFor(spent(base, 0, HAPPY.balance.allWorkBelowBreaks)).tone).toBe('balanced')
  })
  it('selfHeavy: most went on yourself', () => {
    const b = balanceFor(spent(lit({ plan: 'bright' }), 9000, 4))
    expect(b.tone).toBe('selfHeavy')
    expect(b.nextStepKey).toBe('balance.next.selfHeavy')
  })
  it('selfHeavy: spending before earning anything', () => {
    const b = balanceFor(spent(player(), 300))
    expect(b).toMatchObject({ tone: 'selfHeavy', earned: 0, spentOnSelf: 300, selfSharePercent: 100, net: -300 })
  })
  it('the "self heavy" boundary is the configured share (just below and just above)', () => {
    const base = lit({ plan: 'bright' }) // earned 6500
    const spendFor = (share: number) => Math.round((share * SHARE) / (1 - share))
    expect(balanceFor(spent(base, spendFor(HAPPY.balance.selfHeavyAbove - 0.01), 3)).tone).toBe('balanced')
    expect(balanceFor(spent(base, spendFor(HAPPY.balance.selfHeavyAbove + 0.01), 3)).tone).toBe('selfHeavy')
  })
  it('earned respects lamp brightness', () => {
    expect(balanceFor(lit({ plan: 'dim' })).earned).toBe(Math.round(SHARE * 0.75))
  })
  it('selfSharePercent is the share of everything earned plus spent', () => {
    expect(balanceFor(spent(lit({ plan: 'bright' }), 6500, 2)).selfSharePercent).toBe(50)
  })
  it('does not mutate its input', () => {
    expect(() => balanceFor(deepFreeze(spent(lit({ plan: 'bright' }), 100, 1)))).not.toThrow()
  })
})

describe('a player who never takes a break versus one who does', () => {
  it('never using life moments: Happy falls, the tired note appears, lamps dim', () => {
    let s = player()
    for (const id of PILLAR_IDS) s = applyBurnout(applyGameResult(s, result(id, { joySignals: { treatsSkipped: 6 } })))
    const happy = buildHappyView(s)
    expect(happy.needsBreak).toBe(true)
    expect(happy.value).toBeLessThan(70 - 3 * HAPPY.burnoutDrain)
    const view = buildProgressView(s)
    expect(view.counts.dim + view.counts.flicker).toBeGreaterThan(0)
    expect(view.happyPenalty.active).toBe(true)
    expect(balanceFor(s).tone).toBe('allWork')
  })
  it('taking a short break between games: stays bright, no penalty, no tired note', () => {
    let s = player()
    for (const id of PILLAR_IDS) {
      s = applyBurnout(applyGameResult(s, result(id)))
      s = applyLifeMoment(s, 'restAtHome')
      s = applyLifeMoment(s, 'chai')
    }
    const view = buildProgressView(s)
    expect(view.counts).toMatchObject({ lit: 4, bright: 4 })
    expect(view.happyPenalty.active).toBe(false)
    expect(buildHappyView(s).needsBreak).toBe(false)
    expect(balanceFor(s).tone).toBe('balanced')
  })
})
