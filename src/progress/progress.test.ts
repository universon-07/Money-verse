import { describe, expect, it } from 'vitest'
import { PILLAR_IDS } from '../content/data'
import { GOAL, SHARE, START, deepFreeze, player, result } from '../test/factories'
import { applyGameResult } from './applyGameResult'
import { PROGRESS } from './config'
import { migrateLegacyState } from './migrate'
import { pillarContribution, savedAmountFor } from './saved'
import { completedPillarsOf, freshProgress, sanitizeProgress } from './state'

describe('freshProgress', () => {
  it('starts every pillar not-started with nothing earned', () => {
    const s = freshProgress(START, GOAL)
    for (const id of PILLAR_IDS) {
      expect(s.pillars[id]).toEqual({ status: 'locked', brightness: null, partial: 0, bestQuality: 0, attempts: 0, lessonsSeen: [], skillsTouched: [] })
    }
    expect(s.happy).toBe(70)
    expect(s.diamonds).toBe(0)
    expect(s.shieldPieces).toEqual([])
    expect(s.title).toBeNull()
    expect(savedAmountFor(s)).toBe(START)
  })
})

describe('savedAmountFor', () => {
  const lit = (brightness: 'bright' | 'dim' | 'flicker', ids = ['plan']) => {
    const s = player()
    for (const id of ids) s.pillars[id as 'plan'] = { status: 'complete', brightness, partial: 1, bestQuality: 1, attempts: 1, lessonsSeen: [], skillsTouched: [] }
    return s
  }
  it('is the start amount when nothing is cleared', () => {
    expect(savedAmountFor(player())).toBe(START)
  })
  it('one bright pillar adds 25% of (goal - start)', () => {
    expect(SHARE).toBe((GOAL - START) * PROGRESS.pillarShare)
    expect(savedAmountFor(lit('bright'))).toBe(START + SHARE)
  })
  it('dim and flicker count for less', () => {
    expect(savedAmountFor(lit('dim'))).toBe(START + SHARE * 0.75)
    expect(savedAmountFor(lit('flicker'))).toBe(START + SHARE * 0.5)
  })
  it('four bright pillars reach exactly the goal', () => {
    expect(savedAmountFor(lit('bright', [...PILLAR_IDS]))).toBe(GOAL)
  })
  it('four flickering pillars stay short of the goal', () => {
    expect(savedAmountFor(lit('flicker', [...PILLAR_IDS]))).toBe(START + (GOAL - START) * 0.5)
  })
  it('a pillar that is merely in progress adds nothing, whatever its partial', () => {
    const s = player()
    s.pillars.plan = { status: 'in_progress', brightness: null, partial: 0.9, bestQuality: 1, attempts: 3, lessonsSeen: [], skillsTouched: [] }
    expect(savedAmountFor(s)).toBe(START)
    expect(pillarContribution(s, 'plan')).toBe(0)
  })
  it('subtracts life-moment spending', () => {
    expect(savedAmountFor(player({ lifeMomentSpend: 250 }))).toBe(START - 250)
  })
  it('never goes below the floor', () => {
    expect(savedAmountFor(player({ lifeMomentSpend: 999999 }))).toBe(PROGRESS.savedFloor)
  })
  it('never exceeds the goal', () => {
    const s = lit('bright', [...PILLAR_IDS])
    expect(savedAmountFor({ ...s, lifeMomentSpend: -5000 })).toBe(GOAL)
  })
  it('is 0 with no persona (no start, no goal)', () => {
    expect(savedAmountFor(freshProgress(0, 0))).toBe(0)
  })
  it('is deterministic and rounds to whole rupees', () => {
    const s = lit('dim')
    s.goalAmount = 12345
    s.startAmount = 1001
    const a = savedAmountFor(s)
    expect(savedAmountFor(s)).toBe(a)
    expect(Number.isInteger(a)).toBe(true)
  })
})

describe('applyGameResult: clearing and brightness', () => {
  it('a clear at healthy Happy lights the pillar bright', () => {
    const s = applyGameResult(player({ happy: 70 }), result('plan', { quality: 0.9 }))
    expect(s.pillars.plan).toMatchObject({ status: 'complete', brightness: 'bright', partial: 1, bestQuality: 0.9, attempts: 1 })
    expect(savedAmountFor(s)).toBe(START + SHARE)
  })
  it('a clear at low Happy dims the lamp and counts for less', () => {
    const s = applyGameResult(player({ happy: 50 }), result('plan'))
    expect(s.pillars.plan.brightness).toBe('dim')
    expect(savedAmountFor(s)).toBe(START + SHARE * 0.75)
  })
  it('a clear at very low Happy makes the lamp flicker', () => {
    const s = applyGameResult(player({ happy: 20 }), result('plan'))
    expect(s.pillars.plan.brightness).toBe('flicker')
    expect(savedAmountFor(s)).toBe(START + SHARE * 0.5)
  })
  it('exactly on the thresholds', () => {
    expect(applyGameResult(player({ happy: 60 }), result('plan')).pillars.plan.brightness).toBe('bright')
    expect(applyGameResult(player({ happy: 35 }), result('plan')).pillars.plan.brightness).toBe('dim')
  })
  it('the lamp reads Happy AFTER the game joy signals are applied', () => {
    // 62 would be bright, but a bad friendship (0 -> -6) drops it to 56 first, so the lamp is dim
    const s = applyGameResult(player({ happy: 62 }), result('plan', { joySignals: { friendship: 0 } }))
    expect(s.happy).toBe(56)
    expect(s.pillars.plan.brightness).toBe('dim')
  })
  it('joy signals can also lift the lamp from dim to bright', () => {
    const s = applyGameResult(player({ happy: 58 }), result('plan', { joySignals: { restedOrBalanced: 1 } }))
    expect(s.happy).toBe(62)
    expect(s.pillars.plan.brightness).toBe('bright')
  })
  it('lighting one pillar leaves the others untouched', () => {
    const s = applyGameResult(player(), result('invest'))
    expect(s.pillars.plan.status).toBe('locked')
    expect(s.pillars.save.status).toBe('locked')
    expect(s.pillars.safe.status).toBe('locked')
    expect(completedPillarsOf(s)).toEqual(['invest'])
  })
})

describe('applyGameResult: replays only improve', () => {
  it('a better-lit replay upgrades the lamp and the goal bar', () => {
    const first = applyGameResult(player({ happy: 20 }), result('plan'))
    expect(first.pillars.plan.brightness).toBe('flicker')
    const replay = applyGameResult({ ...first, happy: 80 }, result('plan'))
    expect(replay.pillars.plan.brightness).toBe('bright')
    expect(savedAmountFor(replay)).toBeGreaterThan(savedAmountFor(first))
    expect(replay.pillars.plan.attempts).toBe(2)
  })
  it('a worse-lit replay never downgrades the lamp', () => {
    const first = applyGameResult(player({ happy: 80 }), result('plan'))
    const replay = applyGameResult({ ...first, happy: 15 }, result('plan'))
    expect(replay.pillars.plan.brightness).toBe('bright')
    expect(savedAmountFor(replay)).toBe(savedAmountFor(first))
  })
  it('dim then dim stays dim; dim then bright becomes bright', () => {
    const dim = applyGameResult(player({ happy: 50 }), result('plan'))
    expect(applyGameResult({ ...dim, happy: 50 }, result('plan')).pillars.plan.brightness).toBe('dim')
    expect(applyGameResult({ ...dim, happy: 90 }, result('plan')).pillars.plan.brightness).toBe('bright')
  })
  it('a failed replay never un-lights a cleared pillar', () => {
    const lit = applyGameResult(player(), result('plan'))
    const failed = applyGameResult(lit, result('plan', { cleared: false, quality: 0.1, partial: 0.2 }))
    expect(failed.pillars.plan).toMatchObject({ status: 'complete', brightness: 'bright', partial: 1 })
    expect(savedAmountFor(failed)).toBe(savedAmountFor(lit))
  })
  it('best quality is the maximum over all plays', () => {
    let s = applyGameResult(player(), result('plan', { quality: 0.9 }))
    s = applyGameResult(s, result('plan', { quality: 0.4 }))
    expect(s.pillars.plan.bestQuality).toBe(0.9)
  })
})

describe('applyGameResult: not cleared', () => {
  it('marks the pillar in progress and keeps partial progress', () => {
    const s = applyGameResult(player(), result('save', { cleared: false, partial: 0.4, quality: 0.3 }))
    expect(s.pillars.save).toMatchObject({ status: 'in_progress', brightness: null, partial: 0.4, bestQuality: 0.3, attempts: 1 })
    expect(savedAmountFor(s)).toBe(START)
  })
  it('partial progress never reaches 1 unless the pillar is cleared', () => {
    const s = applyGameResult(player(), result('save', { cleared: false, partial: 1 }))
    expect(s.pillars.save.partial).toBe(PROGRESS.partialCap)
    expect(s.pillars.save.partial).toBeLessThan(1)
    expect(s.pillars.save.status).toBe('in_progress')
  })
  it('partial progress only moves forward', () => {
    let s = applyGameResult(player(), result('save', { cleared: false, partial: 0.6 }))
    s = applyGameResult(s, result('save', { cleared: false, partial: 0.2 }))
    expect(s.pillars.save.partial).toBe(0.6)
    s = applyGameResult(s, result('save', { cleared: false, partial: 0.8 }))
    expect(s.pillars.save.partial).toBe(0.8)
  })
  it('a clear sets partial to exactly 1', () => {
    const s = applyGameResult(player(), result('save', { cleared: true, partial: 0.3 }))
    expect(s.pillars.save.partial).toBe(1)
  })
})

describe('applyGameResult: data hygiene', () => {
  it('clamps and sanitises quality and partial', () => {
    const hi = applyGameResult(player(), result('plan', { quality: 5, cleared: false, partial: 5 }))
    expect(hi.pillars.plan.bestQuality).toBe(1)
    expect(hi.pillars.plan.partial).toBe(PROGRESS.partialCap)
    const lo = applyGameResult(player(), result('plan', { quality: -3, cleared: false, partial: -1 }))
    expect(lo.pillars.plan.bestQuality).toBe(0)
    expect(lo.pillars.plan.partial).toBe(0)
    const nan = applyGameResult(player(), result('plan', { quality: NaN, partial: NaN, cleared: false }))
    expect(nan.pillars.plan.bestQuality).toBe(0)
    expect(nan.pillars.plan.partial).toBe(0)
  })
  it('only a literal true counts as cleared', () => {
    const s = applyGameResult(player(), result('plan', { cleared: 'yes' as unknown as boolean }))
    expect(s.pillars.plan.status).toBe('in_progress')
  })
  it('collects lessons without duplicates, in first-seen order', () => {
    let s = applyGameResult(player(), result('plan', { lessonsSeen: ['a', 'b'] }))
    s = applyGameResult(s, result('plan', { lessonsSeen: ['b', 'c'] }))
    expect(s.pillars.plan.lessonsSeen).toEqual(['a', 'b', 'c'])
  })
  it('keeps the best value of each skill and clamps it', () => {
    let s = applyGameResult(player(), result('plan', { skills: { planning: 0.6, saving: 2, scamSense: -1 } }))
    expect(s.skills).toMatchObject({ planning: 0.6, saving: 1, scamSense: 0, riskSense: 0 })
    s = applyGameResult(s, result('plan', { skills: { planning: 0.3, riskSense: 0.5 } }))
    expect(s.skills).toMatchObject({ planning: 0.6, riskSense: 0.5 })
  })
  it('ignores unknown skill names', () => {
    const s = applyGameResult(player(), result('plan', { skills: { bogus: 1 } as never }))
    expect(Object.keys(s.skills).sort()).toEqual(['patience', 'planning', 'prioritising', 'riskSense', 'saving', 'scamSense'])
  })
  it('counts every attempt', () => {
    let s = player()
    for (let i = 0; i < 3; i++) s = applyGameResult(s, result('plan', { cleared: i === 2, partial: 0.1 }))
    expect(s.pillars.plan.attempts).toBe(3)
  })
  it('returns the same object for an unknown pillar', () => {
    const s = player()
    expect(applyGameResult(s, result('bogus' as never))).toBe(s)
  })
  it('does not mutate its input and is deterministic', () => {
    const s = deepFreeze(player({ happy: 55 }))
    const r = result('invest', { skills: { riskSense: 0.7 }, lessonsSeen: ['x'], joySignals: { treatsBought: 1 } })
    let a!: ReturnType<typeof player>
    expect(() => { a = applyGameResult(s, r) }).not.toThrow()
    expect(JSON.stringify(applyGameResult(s, r))).toBe(JSON.stringify(a))
  })
})

describe('applyGameResult: rewards', () => {
  it('adds diamonds earned in this play', () => {
    let s = applyGameResult(player(), result('safe', { rewards: { diamonds: 125 } }))
    s = applyGameResult(s, result('safe', { rewards: { diamonds: 31.9 } }))
    expect(s.diamonds).toBe(156)
  })
  it('ignores negative or invalid diamonds', () => {
    expect(applyGameResult(player(), result('safe', { rewards: { diamonds: -50 } })).diamonds).toBe(0)
    expect(applyGameResult(player(), result('safe', { rewards: { diamonds: NaN } })).diamonds).toBe(0)
  })
  it('unions shield pieces in canonical order', () => {
    let s = applyGameResult(player(), result('safe', { rewards: { shieldPieces: ['pause'] } }))
    s = applyGameResult(s, result('safe', { rewards: { shieldPieces: ['protect', 'pause'] } }))
    expect(s.shieldPieces).toEqual(['protect', 'pause'])
  })
  it('sets the title and keeps it when a later play has none', () => {
    let s = applyGameResult(player(), result('safe', { rewards: { title: 'Junior Detective' } }))
    expect(s.title).toBe('Junior Detective')
    s = applyGameResult(s, result('safe', {}))
    expect(s.title).toBe('Junior Detective')
  })
})

describe('completedPillarsOf', () => {
  it('lists complete pillars in pillar order, whatever order they were cleared in', () => {
    let s = player()
    for (const id of ['safe', 'plan', 'invest'] as const) s = applyGameResult(s, result(id))
    expect(completedPillarsOf(s)).toEqual(['plan', 'invest', 'safe'])
  })
})

describe('sanitizeProgress', () => {
  it('fills a completely empty object with a valid fresh state', () => {
    const s = sanitizeProgress({})
    expect(Object.keys(s.pillars)).toEqual([...PILLAR_IDS])
    expect(s.happy).toBe(70)
  })
  it('clamps Happy and replaces junk numbers', () => {
    expect(sanitizeProgress({ happy: 500 }).happy).toBe(100)
    expect(sanitizeProgress({ happy: -3 }).happy).toBe(10)
    expect(sanitizeProgress({ happy: NaN }).happy).toBe(70)
    expect(sanitizeProgress({ happy: 'lots' as never }).happy).toBe(70)
  })
  it('a "complete" pillar with no brightness cannot stay complete', () => {
    const s = sanitizeProgress({ pillars: { plan: { status: 'complete', brightness: null, partial: 1, bestQuality: 1, attempts: 1, lessonsSeen: [], skillsTouched: [] } } as never })
    expect(s.pillars.plan.status).toBe('in_progress')
    expect(s.pillars.plan.partial).toBeLessThan(1)
  })
  it('an unfinished pillar cannot claim partial 1', () => {
    const s = sanitizeProgress({ pillars: { plan: { status: 'in_progress', brightness: null, partial: 1, bestQuality: 0, attempts: 2, lessonsSeen: [], skillsTouched: [] } } as never })
    expect(s.pillars.plan.partial).toBe(PROGRESS.partialCap)
  })
  it('drops invalid shield pieces and lessons', () => {
    const s = sanitizeProgress({ shieldPieces: ['protect', 'bogus'] as never, pillars: { plan: { status: 'in_progress', brightness: null, partial: 0, bestQuality: 0, attempts: 0, lessonsSeen: ['ok', 7] } } as never })
    expect(s.shieldPieces).toEqual(['protect'])
    expect(s.pillars.plan.lessonsSeen).toEqual(['ok'])
  })
  it('keeps valid complete pillars', () => {
    const s = applyGameResult(player(), result('plan'))
    expect(sanitizeProgress(s)).toEqual(s)
  })
})

describe('migrateLegacyState', () => {
  it('keeps completed pillars lit bright so the goal bar shows what it showed before', () => {
    const step = (30000 - 4000) / 4
    const oldSaved = 4000 + step * 2
    const s = migrateLegacyState({ persona: 'college', startAmount: 4000, goalAmount: 30000, savedAmount: oldSaved, completedPillars: ['plan', 'invest'] })
    expect(s.pillars.plan).toMatchObject({ status: 'complete', brightness: 'bright', partial: 1 })
    expect(s.pillars.invest.status).toBe('complete')
    expect(s.pillars.save.status).toBe('locked')
    expect(savedAmountFor(s)).toBe(oldSaved)
    expect(s.happy).toBe(70)
  })
  it('drops pillar ids that do not exist', () => {
    const s = migrateLegacyState({ startAmount: 100, goalAmount: 400, completedPillars: ['plan', 'cash', 7 as never] })
    expect(completedPillarsOf(s)).toEqual(['plan'])
  })
  it('takes start and goal from the persona when missing', () => {
    const s = migrateLegacyState({ persona: 'school' })
    expect([s.startAmount, s.goalAmount]).toEqual([1500, 12000])
  })
  it('copes with nothing at all', () => {
    expect(() => migrateLegacyState(null)).not.toThrow()
    expect(migrateLegacyState(undefined).startAmount).toBe(0)
  })
  it('carries over skills', () => {
    expect(migrateLegacyState({ skills: { planning: 0.5 } }).skills.planning).toBe(0.5)
  })
  it('migrating twice gives the same result (idempotent on its own output)', () => {
    const once = migrateLegacyState({ persona: 'earner', completedPillars: ['safe'] })
    expect(sanitizeProgress(once)).toEqual(once)
  })
})
