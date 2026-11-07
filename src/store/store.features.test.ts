import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildHappyView, shouldShowHappyToast } from '../features/happy/view'
import { buildProgressView } from '../features/progress/view'
import { HAPPY } from '../happy/config'
import { memoryStorage, result } from '../test/factories'
import { STORE_KEY, normalizePersisted } from './persisted'

type Mem = ReturnType<typeof memoryStorage>

/** a fresh copy of the store module on top of the given fake localStorage */
async function load(mem: Mem) {
  vi.resetModules()
  vi.stubGlobal('localStorage', mem)
  const mod = await import('./game')
  await Promise.resolve()
  return mod.useGame
}

let mem: Mem
beforeEach(() => {
  mem = memoryStorage()
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('the one-time Happy tip flag', () => {
  it('starts unseen, and is invalid-proof when loading', () => {
    expect(normalizePersisted({}).happyToastSeen).toBe(false)
    expect(normalizePersisted({ happyToastSeen: 'yes' }).happyToastSeen).toBe(false)
    expect(normalizePersisted({ happyToastSeen: true }).happyToastSeen).toBe(true)
  })
  it('shows once, then never again, and survives a reload', async () => {
    const store = await load(mem)
    store.getState().devSetHappy(30)
    expect(shouldShowHappyToast(store.getState())).toBe(true)
    store.getState().markHappyToastSeen()
    expect(shouldShowHappyToast(store.getState())).toBe(false)
    const reloaded = await load(mem)
    expect(reloaded.getState().happyToastSeen).toBe(true)
    expect(shouldShowHappyToast(reloaded.getState())).toBe(false)
  })
  it('the dev "reset tips" button brings it back', async () => {
    const store = await load(mem)
    store.getState().devSetHappy(30)
    store.getState().markHappyToastSeen()
    store.getState().devResetTips()
    expect(shouldShowHappyToast(store.getState())).toBe(true)
  })
  it('a full progress reset does not bring the tip back (it is a one-time tip, not progress)', async () => {
    const store = await load(mem)
    store.getState().markHappyToastSeen()
    store.getState().resetProgress()
    expect(store.getState().happyToastSeen).toBe(true)
  })
})

describe('sessions since a break, through the store', () => {
  it('each finished game session adds one and the tired note appears at the configured number', async () => {
    const store = await load(mem)
    store.getState().setPersona('college')
    for (let i = 0; i < HAPPY.tiredAfterSessions; i++) {
      expect(buildHappyView(store.getState()).needsBreak).toBe(false)
      store.getState().finishSession(result('plan', { quality: 0.9 }))
    }
    expect(store.getState().sessionsSinceBreak).toBe(HAPPY.tiredAfterSessions)
    expect(buildHappyView(store.getState()).needsBreak).toBe(true)
  })
  it('a life moment clears the note', async () => {
    const store = await load(mem)
    store.getState().setPersona('college')
    for (let i = 0; i < 4; i++) store.getState().finishSession(result('save'))
    expect(buildHappyView(store.getState()).needsBreak).toBe(true)
    store.getState().applyLifeMoment('restAtHome')
    expect(store.getState().sessionsSinceBreak).toBe(0)
    expect(buildHappyView(store.getState()).needsBreak).toBe(false)
  })
  it('the counter survives a reload', async () => {
    const store = await load(mem)
    store.getState().applyBurnout()
    store.getState().applyBurnout()
    expect((await load(mem)).getState().sessionsSinceBreak).toBe(2)
  })
  it('a full progress reset zeroes it', async () => {
    const store = await load(mem)
    store.getState().applyBurnout()
    store.getState().resetProgress()
    expect(store.getState().sessionsSinceBreak).toBe(0)
  })
  it('an old save without the counter loads with 0', async () => {
    mem.setItem(STORE_KEY, JSON.stringify({ state: { happy: 55, persona: 'college', startAmount: 4000, goalAmount: 30000 }, version: 2 }))
    expect((await load(mem)).getState().sessionsSinceBreak).toBe(0)
  })
})

describe('the progress view reads the live store', () => {
  it('skills touched and the penalty follow what was played', async () => {
    const store = await load(mem)
    store.getState().setPersona('college')
    store.getState().devSetHappy(20)
    store.getState().applyGameResult(result('invest', { skills: { riskSense: 0.7, scamSense: 0.4 } }))
    const v = buildProgressView(store.getState())
    expect(v.pillars[2]).toMatchObject({ id: 'invest', state: 'flicker', skillsTouched: ['riskSense', 'scamSense'] })
    expect(v.happyPenalty).toMatchObject({ active: true, lostAmount: 3250 })
  })
  it('skills touched survive a reload', async () => {
    const store = await load(mem)
    store.getState().setPersona('college')
    store.getState().applyGameResult(result('plan', { skills: { planning: 0.5 } }))
    const reloaded = await load(mem)
    expect(reloaded.getState().pillars.plan.skillsTouched).toEqual(['planning'])
  })
})
