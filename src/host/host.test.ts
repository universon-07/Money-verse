import { describe, expect, it, vi } from 'vitest'
import { PILLAR_IDS } from '../content/data'
import { freshProgress } from '../progress/state'
import { savedAmountFor } from '../progress/saved'
import { HAPPY } from '../happy/config'
import { GOAL, START, deepFreeze, player, result } from '../test/factories'
import { GAME_FOLDERS, PILLAR_ORDER } from './config'
import { flowReducer, initialFlow, type FlowState, type PlayOutcome } from './flow'
import { PILLAR_GAMES, hasRealGame, isPillarId, wantsPlaceholders } from './registry'
import { buildResultView, nextPillarAfter } from './resultView'
import { seedFor } from './seed'
import { SessionGuard, finishSession, snapshot } from './session'
import { PLACEHOLDERS } from './placeholders'

describe('seedFor', () => {
  it('is stable: the same install and pillar always give the same seed (so a replay faces the same game)', () => {
    const seeds = new Set(Array.from({ length: 100 }, () => seedFor('install-1', 'plan')))
    expect(seeds.size).toBe(1)
  })
  it('differs per pillar, per install and per salt', () => {
    const a = seedFor('install-1', 'plan')
    expect(seedFor('install-1', 'save')).not.toBe(a)
    expect(seedFor('install-2', 'plan')).not.toBe(a)
    expect(seedFor('install-1', 'plan', 1)).not.toBe(a)
  })
  it('salt 0 is the default', () => {
    expect(seedFor('x', 'safe')).toBe(seedFor('x', 'safe', 0))
  })
  it('is readable and has a fixed shape', () => {
    expect(seedFor('install-1', 'invest')).toMatch(/^mm-invest-[0-9a-f]{16}$/)
  })
  it('gives each of the four pillars a different seed for one install', () => {
    expect(new Set(PILLAR_IDS.map((p) => seedFor('same-install', p))).size).toBe(4)
  })
})

describe('finishSession', () => {
  it('applies the result then burnout exactly once', () => {
    const { next } = finishSession(player({ happy: 80 }), result('plan'))
    expect(next.happy).toBe(80 - HAPPY.burnoutDrain)
    expect(next.pillars.plan.status).toBe('complete')
    expect(next.pillars.plan.attempts).toBe(1)
  })
  it('the lamp state reads Happy BEFORE burnout: exactly 60 stays bright even though burnout then drops Happy to 55', () => {
    const out = finishSession(player({ happy: 60 }), result('plan'))
    expect(out.next.pillars.plan.brightness).toBe('bright')
    expect(out.after.happy).toBe(55)
  })
  it('just under the threshold is dim, and the drain does not change that', () => {
    expect(finishSession(player({ happy: 59 }), result('plan')).next.pillars.plan.brightness).toBe('dim')
  })
  it('before and after snapshots describe what changed', () => {
    const out = finishSession(player({ happy: 70 }), result('save'))
    expect(out.before).toEqual({ saved: START, happy: 70, brightness: null, status: 'locked', partial: 0, attempts: 0 })
    expect(out.after).toMatchObject({ happy: 65, brightness: 'bright', status: 'complete', partial: 1, attempts: 1 })
    expect(out.after.saved).toBeGreaterThan(out.before.saved)
  })
  it('quitting (not cleared) is still a session: progress is kept but Happy drains', () => {
    const out = finishSession(player({ happy: 70 }), result('invest', { cleared: false, partial: 0.4 }))
    expect(out.after).toMatchObject({ happy: 65, status: 'in_progress', partial: 0.4, saved: START })
  })
  it('game joy signals move Happy before the lamp is read, then burnout follows', () => {
    const out = finishSession(player({ happy: 62 }), result('plan', { joySignals: { friendship: 0 } }))
    expect(out.next.pillars.plan.brightness).toBe('dim')
    expect(out.after.happy).toBe(62 - 6 - HAPPY.burnoutDrain)
  })
  it('does not mutate its input and is deterministic', () => {
    const s = deepFreeze(player({ happy: 72 }))
    const r = result('safe', { rewards: { diamonds: 30 } })
    let a!: ReturnType<typeof finishSession<typeof s>>
    expect(() => { a = finishSession(s, r) }).not.toThrow()
    expect(JSON.stringify(finishSession(s, r))).toBe(JSON.stringify(a))
  })
  it('a replay after a poor session can brighten the lamp (replays only improve)', () => {
    let s = finishSession(player({ happy: 40 }), result('plan')).next
    expect(s.pillars.plan.brightness).toBe('dim')
    s = { ...s, happy: 90 }
    s = finishSession(s, result('plan')).next
    expect(s.pillars.plan.brightness).toBe('bright')
  })
  it('snapshot matches savedAmountFor', () => {
    const s = player()
    expect(snapshot(s, 'plan').saved).toBe(savedAmountFor(s))
  })
})

describe('SessionGuard', () => {
  it('runs a session once and ignores a second onComplete for the same id', () => {
    const g = new SessionGuard()
    const fn = vi.fn(() => 'done')
    expect(g.once('s1', fn)).toBe('done')
    expect(g.once('s1', fn)).toBeUndefined()
    expect(g.once('s1', fn)).toBeUndefined()
    expect(fn).toHaveBeenCalledTimes(1)
    expect(g.has('s1')).toBe(true)
  })
  it('different sessions both run', () => {
    const g = new SessionGuard()
    const fn = vi.fn()
    g.once('a', fn)
    g.once('b', fn)
    expect(fn).toHaveBeenCalledTimes(2)
  })
  it('burnout is applied once even if a game calls onComplete twice', () => {
    const g = new SessionGuard()
    let state = player({ happy: 90 })
    const complete = () => g.once('s', () => { state = finishSession(state, result('plan')).next })
    complete()
    complete()
    expect(state.happy).toBe(90 - HAPPY.burnoutDrain)
    expect(state.pillars.plan.attempts).toBe(1)
  })
})

describe('flowReducer', () => {
  const outcome = (): PlayOutcome => ({ result: result('plan'), ...(() => { const o = finishSession(player(), result('plan')); return { before: o.before, after: o.after } })() })
  const playing = (id = 's1'): FlowState => flowReducer(initialFlow, { type: 'start', sessionId: id })

  it('starts in the entry phase', () => {
    expect(initialFlow.phase).toBe('entry')
  })
  it('start moves to playing with the session id', () => {
    expect(playing('s1')).toMatchObject({ phase: 'playing', sessionId: 's1' })
  })
  it('completing the current session moves to the result and keeps the outcome', () => {
    const o = outcome()
    const s = flowReducer(playing('s1'), { type: 'complete', sessionId: 's1', outcome: o })
    expect(s.phase).toBe('result')
    expect(s.outcome).toBe(o)
  })
  it('a completion for another session is ignored', () => {
    const s = playing('s1')
    expect(flowReducer(s, { type: 'complete', sessionId: 'other', outcome: outcome() })).toBe(s)
  })
  it('a completion while not playing is ignored', () => {
    expect(flowReducer(initialFlow, { type: 'complete', sessionId: 's1', outcome: outcome() })).toBe(initialFlow)
  })
  it('a second completion after the result is ignored', () => {
    const done = flowReducer(playing('s1'), { type: 'complete', sessionId: 's1', outcome: outcome() })
    expect(flowReducer(done, { type: 'complete', sessionId: 's1', outcome: outcome() })).toBe(done)
  })
  it('start while already playing changes nothing', () => {
    const s = playing('s1')
    expect(flowReducer(s, { type: 'start', sessionId: 's2' })).toBe(s)
  })
  it('replay goes back to playing with a new session and clears the old outcome, keeping the salt (same seed)', () => {
    const done = flowReducer(playing('s1'), { type: 'complete', sessionId: 's1', outcome: outcome() })
    const again = flowReducer(done, { type: 'replay', sessionId: 's2' })
    expect(again).toMatchObject({ phase: 'playing', sessionId: 's2', outcome: null, salt: 0 })
  })
  it('fail moves to the error phase only for the current session', () => {
    expect(flowReducer(playing('s1'), { type: 'fail', sessionId: 's1', message: 'boom' })).toMatchObject({ phase: 'error', error: 'boom' })
    const s = playing('s1')
    expect(flowReducer(s, { type: 'fail', sessionId: 'x', message: 'boom' })).toBe(s)
  })
  it('newSeed bumps the salt, and reset returns to entry but keeps it', () => {
    let s = flowReducer(initialFlow, { type: 'newSeed' })
    expect(s.salt).toBe(1)
    s = flowReducer(flowReducer(s, { type: 'start', sessionId: 'a' }), { type: 'reset' })
    expect(s).toMatchObject({ phase: 'entry', sessionId: null, salt: 1 })
  })
})

describe('buildResultView and nextPillarAfter', () => {
  const run = (happy: number, over = {}) => {
    const r = result('plan', { quality: 0.8, skills: { planning: 0.9, saving: 0.5 }, lessonsSeen: ['x'], ...over })
    const o = finishSession(player({ happy }), r)
    return buildResultView({ result: r, before: o.before, after: o.after })
  }
  it('shows cleared state, quality and skills as percentages', () => {
    const v = run(70)
    expect(v).toMatchObject({ pillar: 'plan', cleared: true, qualityPercent: 80, lessons: ['x'] })
    expect(v.skills).toEqual([{ skill: 'planning', percent: 90 }, { skill: 'saving', percent: 50 }])
    expect(v.state).toMatchObject({ status: 'complete', brightness: 'bright' })
  })
  it('the goal meter and Happy deltas come from the snapshots', () => {
    const v = run(70)
    expect(v.saved.before).toBe(START)
    expect(v.saved.after).toBe(v.saved.before + v.saved.delta)
    expect(v.saved.delta).toBeGreaterThan(0)
    expect(v.happy).toEqual({ before: 70, after: 65, delta: -5 })
  })
  it('a first clear counts as improved; a not-cleared first play with progress too; zero progress does not', () => {
    expect(run(70).improved).toBe(true)
    expect(run(70, { cleared: false, partial: 0.5 }).improved).toBe(true)
    expect(run(70, { cleared: false, partial: 0, quality: 0 }).improved).toBe(false)
  })
  it('a replay that is not brighter is not "improved"', () => {
    const first = finishSession(player({ happy: 90 }), result('plan'))
    const again = result('plan')
    const o = finishSession({ ...first.next, happy: 20 }, again)
    expect(buildResultView({ result: again, before: o.before, after: o.after }).improved).toBe(false)
  })
  it('skills the game did not report are left out', () => {
    expect(run(70, { skills: {} }).skills).toEqual([])
  })
  it('nextPillarAfter goes in pillar order and skips completed pillars', () => {
    const s = player()
    expect(nextPillarAfter(s, 'plan')).toBe('save')
    s.pillars.save.status = 'complete'
    expect(nextPillarAfter(s, 'plan')).toBe('invest')
  })
  it('nextPillarAfter wraps around to an unfinished earlier pillar and returns null when everything is done', () => {
    const s = player()
    expect(nextPillarAfter(s, 'safe')).toBe('plan')
    for (const id of PILLAR_IDS) s.pillars[id].status = 'complete'
    expect(nextPillarAfter(s, 'plan')).toBeNull()
  })
  it('nextPillarAfter ignores the current pillar even if only it is unfinished', () => {
    const s = player()
    for (const id of PILLAR_IDS) if (id !== 'invest') s.pillars[id].status = 'complete'
    expect(nextPillarAfter(s, 'invest')).toBeNull()
  })
})

describe('registry', () => {
  it('has one complete entry per pillar', () => {
    for (const id of PILLAR_IDS) {
      const e = PILLAR_GAMES[id]
      expect(e.pillar).toBe(id)
      expect(e.nameKey).toBe(`pillars.${id}.name`)
      expect(typeof e.adapter).toBe('function')
      expect(e.placeholder).toBe(PLACEHOLDERS[id])
    }
  })
  it('uses the real game where one exists (Festival Countdown, Pocket Panic, Case Files) and the placeholder where not yet', async () => {
    expect(hasRealGame('plan')).toBe(true)
    expect(hasRealGame('save')).toBe(true)
    expect(hasRealGame('safe')).toBe(true)
    expect(hasRealGame('invest')).toBe(true)
  })
  it('each pillar maps to its own folder name', () => {
    expect(new Set(Object.values(GAME_FOLDERS)).size).toBe(4)
    expect(GAME_FOLDERS).toEqual({ plan: 'showdown', save: 'cafe', invest: 'dealboard', safe: 'casefiles' })
  })
  it('PILLAR_ORDER lists every pillar once', () => {
    expect([...PILLAR_ORDER].sort()).toEqual([...PILLAR_IDS].sort())
  })
  it('isPillarId accepts only real ids', () => {
    expect(isPillarId('plan')).toBe(true)
    expect(isPillarId('nope')).toBe(false)
    expect(isPillarId(undefined)).toBe(false)
  })
  it('placeholders are not forced when dev tools are off', () => {
    expect(wantsPlaceholders()).toBe(false)
  })
})

describe('placeholder payloads through the full session path', () => {
  it('all four pillars can be cleared in turn and reach exactly the goal at full brightness', () => {
    let s = freshProgress(START, GOAL)
    for (const id of PILLAR_IDS) {
      const r = PILLAR_GAMES[id].adapter(JSON.parse(JSON.stringify({ stars: { ghar: true, gift: true, dost: true, plan: true }, score: { total: 100 }, parts: { saving: 25, buffer: 20, spending: 25, planning: 15, lending: 15 }, judgement: 90, status: 'complete', shieldPieces: ['protect', 'verify', 'pause'] })))
      s = { ...finishSession(s, r).next, happy: 90 }
    }
    expect(savedAmountFor(s)).toBe(GOAL)
  })
})

describe('restartGame: Play again really starts over', () => {
  it('wipes Pocket Panic back to its first screen and empty jars', async () => {
    const { useCafe } = await import('../games/cafe/state/store')
    const { restartGame } = await import('./restart')
    useCafe.getState().goTo('tally')
    useCafe.getState().apply((r) => ({ ...r, jars: { spend: 10, save: 20, emergency: 30 } }))
    await restartGame('save')
    expect(useCafe.getState().step).toBe('entry')
    expect(useCafe.getState().run.jars).toEqual({ spend: 0, save: 0, emergency: 0 })
  })
})
