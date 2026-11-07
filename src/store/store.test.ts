import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { memoryStorage, result, SHARE, START } from '../test/factories'
import { LEGACY_STORE_KEY, STORE_KEY, normalizePersisted } from './persisted'

type Mem = ReturnType<typeof memoryStorage>

/** a fresh copy of the store module on top of the given fake localStorage */
async function load(mem: Mem) {
  vi.resetModules()
  vi.stubGlobal('localStorage', mem)
  const mod = await import('./game')
  await Promise.resolve() // let the post-hydration write (queueMicrotask) run
  return mod.useGame
}

/** what the old game saved under 'money-mohalla-v1' (zustand persist, no version option => version 0) */
const legacyPayload = (state: Record<string, unknown>) => JSON.stringify({ state, version: 0 })
const oldSave = {
  language: 'te',
  persona: 'college',
  startAmount: 4000,
  goalAmount: 30000,
  savedAmount: 4000 + 6500 * 2,
  completedPillars: ['plan', 'invest'],
  storySeen: true,
  celebrated: false,
  liteMode: true,
  skills: { planning: 0, prioritising: 0, saving: 0, riskSense: 0, patience: 0, scamSense: 0 },
}

let mem: Mem
beforeEach(() => {
  mem = memoryStorage()
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('normalizePersisted', () => {
  it('turns nothing into a complete, valid default state', () => {
    const p = normalizePersisted(undefined, () => 'id-1')
    expect(p).toMatchObject({ language: 'en', persona: null, storySeen: false, celebrated: false, liteMode: null, avatar: 'female', festival: 'diwali', installId: 'id-1', classCode: null, happy: 70, diamonds: 0 })
    expect(Object.keys(p.pillars)).toEqual(['plan', 'save', 'invest', 'safe'])
  })
  it('replaces invalid values with defaults', () => {
    const p = normalizePersisted({ language: 'fr', avatar: 'robot', festival: 'halloween', persona: 'wizard', classCode: 42, liteMode: 'yes' }, () => 'x')
    expect(p).toMatchObject({ language: 'en', avatar: 'female', festival: 'diwali', persona: null, classCode: null, liteMode: null })
  })
  it('keeps an existing install id and does not call the id factory', () => {
    const make = vi.fn(() => 'new')
    expect(normalizePersisted({ installId: 'keep-me' }, make).installId).toBe('keep-me')
    expect(make).not.toHaveBeenCalled()
  })
  it('recognises and upgrades the old v1 shape', () => {
    const p = normalizePersisted(oldSave, () => 'id')
    expect(p.language).toBe('te')
    expect(p.pillars.plan.brightness).toBe('bright')
    expect(p.pillars.invest.status).toBe('complete')
  })
})

describe('store: first run', () => {
  it('starts empty with sensible defaults', async () => {
    const s = (await load(mem)).getState()
    expect(s).toMatchObject({ persona: null, savedAmount: 0, completedPillars: [], happy: 70, avatar: 'female', festival: 'diwali', classCode: null, diamonds: 0 })
    expect(s.installId).toMatch(/^[0-9a-f-]{36}$/)
  })
  it('writes the install id to the device once, under the new key, and keeps it on reload', async () => {
    const first = (await load(mem)).getState().installId
    const saved = JSON.parse(mem.getItem(STORE_KEY) as string)
    expect(saved.version).toBe(2)
    expect(saved.state.installId).toBe(first)
    const second = (await load(mem)).getState().installId
    expect(second).toBe(first)
  })
})

describe('store: migration from the old v1 save', () => {
  it('keeps the player progress, settings and goal bar', async () => {
    mem.setItem(LEGACY_STORE_KEY, legacyPayload(oldSave))
    const s = (await load(mem)).getState()
    expect(s.language).toBe('te')
    expect(s.persona).toBe('college')
    expect(s.storySeen).toBe(true)
    expect(s.liteMode).toBe(true)
    expect(s.completedPillars).toEqual(['plan', 'invest'])
    expect(s.savedAmount).toBe(oldSave.savedAmount)
    expect(s.pillars.plan).toMatchObject({ status: 'complete', brightness: 'bright' })
    expect(s.happy).toBe(70)
    expect(s.installId).toMatch(/^[0-9a-f-]{36}$/)
  })
  it('writes the upgraded state under the new key and leaves the old key untouched', async () => {
    const raw = legacyPayload(oldSave)
    mem.setItem(LEGACY_STORE_KEY, raw)
    await load(mem)
    expect(mem.getItem(LEGACY_STORE_KEY)).toBe(raw)
    const saved = JSON.parse(mem.getItem(STORE_KEY) as string)
    expect(saved.version).toBe(2)
    expect(saved.state.pillars.plan.status).toBe('complete')
    expect(saved.state.completedPillars).toBeUndefined()
    expect(saved.state.savedAmount).toBeUndefined()
  })
  it('a v2 save wins over a leftover v1 save', async () => {
    mem.setItem(LEGACY_STORE_KEY, legacyPayload(oldSave))
    const store = await load(mem)
    store.getState().setLanguage('hi')
    const again = (await load(mem)).getState()
    expect(again.language).toBe('hi')
  })
  it('a v1 save with no completed pillars migrates cleanly', async () => {
    mem.setItem(LEGACY_STORE_KEY, legacyPayload({ ...oldSave, completedPillars: [], savedAmount: 4000 }))
    const s = (await load(mem)).getState()
    expect(s.completedPillars).toEqual([])
    expect(s.savedAmount).toBe(4000)
  })
})

describe('store: damaged saves never crash the app', () => {
  it('survives text that is not JSON', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mem.setItem(STORE_KEY, 'not json {{{')
    const s = (await load(mem)).getState()
    expect(s.happy).toBe(70)
    expect(s.completedPillars).toEqual([])
  })
  it('survives JSON of the wrong shape', async () => {
    mem.setItem(STORE_KEY, JSON.stringify({ state: { happy: 'lots', pillars: 5, skills: null, diamonds: -4, language: 99 }, version: 2 }))
    const s = (await load(mem)).getState()
    expect(s.happy).toBe(70)
    expect(s.diamonds).toBe(0)
    expect(s.language).toBe('en')
    expect(Object.keys(s.pillars)).toHaveLength(4)
  })
  it('survives a localStorage that throws', async () => {
    const bad = { ...memoryStorage(), getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') } }
    const store = await load(bad as Mem)
    expect(() => store.getState().setLanguage('hi')).not.toThrow()
    expect(store.getState().language).toBe('hi')
  })
})

describe('store: derived fields', () => {
  it('savedAmount and completedPillars follow every change', async () => {
    const store = await load(mem)
    store.getState().setPersona('college')
    expect(store.getState().savedAmount).toBe(START)
    store.getState().devForceComplete('invest', 1)
    expect(store.getState().completedPillars).toEqual(['invest'])
    expect(store.getState().savedAmount).toBe(START + SHARE)
    store.getState().devForceComplete('plan', 1)
    expect(store.getState().completedPillars).toEqual(['plan', 'invest'])
  })
  it('are not saved to the device, and are rebuilt on load', async () => {
    const store = await load(mem)
    store.getState().setPersona('college')
    store.getState().devForceComplete('plan', 1)
    const saved = JSON.parse(mem.getItem(STORE_KEY) as string).state
    expect(saved.savedAmount).toBeUndefined()
    expect(saved.completedPillars).toBeUndefined()
    const reloaded = (await load(mem)).getState()
    expect(reloaded.savedAmount).toBe(START + SHARE)
    expect(reloaded.completedPillars).toEqual(['plan'])
  })
  it('the saved data contains exactly the persisted keys, no functions', async () => {
    const store = await load(mem)
    store.getState().setPersona('school')
    const keys = Object.keys(JSON.parse(mem.getItem(STORE_KEY) as string).state).sort()
    expect(keys).toEqual(
      ['avatar', 'celebrated', 'classCode', 'coachTipsSeen', 'diamonds', 'festival', 'gender', 'goalAmount', 'happy', 'happyToastSeen', 'installId', 'language', 'lifeMomentSpend', 'lifeMomentsUsed', 'liteMode', 'persona', 'pillars', 'rollNo', 'sessionsSinceBreak', 'shieldPieces', 'skills', 'startAmount', 'storySeen', 'title'],
    )
  })
})

describe('store: existing actions keep their old behaviour', () => {
  it('setPersona sets start/goal, resets progress and un-celebrates', async () => {
    const store = await load(mem)
    store.getState().setPersona('college')
    store.getState().completePillar('plan')
    store.getState().setCelebrated(true)
    store.getState().setPersona('earner')
    expect(store.getState()).toMatchObject({ persona: 'earner', startAmount: 6000, goalAmount: 45000, savedAmount: 6000, completedPillars: [], celebrated: false, happy: 70 })
  })
  it('completePillar adds a quarter of the gap and ignores a second call', async () => {
    const store = await load(mem)
    store.getState().setPersona('college')
    store.getState().completePillar('plan')
    expect(store.getState().savedAmount).toBe(START + SHARE)
    store.getState().completePillar('plan')
    expect(store.getState().savedAmount).toBe(START + SHARE)
    expect(store.getState().pillars.plan.attempts).toBe(1)
  })
  it('four completions reach exactly the goal', async () => {
    const store = await load(mem)
    store.getState().setPersona('college')
    for (const id of ['plan', 'save', 'invest', 'safe'] as const) store.getState().completePillar(id)
    expect(store.getState().savedAmount).toBe(30000)
    expect(store.getState().completedPillars).toHaveLength(4)
  })
  it('resetProgress clears progress and Happy but keeps the persona and settings', async () => {
    const store = await load(mem)
    store.getState().setPersona('college')
    store.getState().setLanguage('te')
    store.getState().devForceComplete('plan', 1)
    store.getState().devSetHappy(20)
    store.getState().resetProgress()
    expect(store.getState()).toMatchObject({ persona: 'college', language: 'te', startAmount: 4000, goalAmount: 30000, savedAmount: 4000, completedPillars: [], happy: 70 })
  })
  it('setStorySeen, setCelebrated and setLite still work', async () => {
    const store = await load(mem)
    store.getState().setStorySeen(true)
    store.getState().setCelebrated(true)
    store.getState().setLite(false)
    expect(store.getState()).toMatchObject({ storySeen: true, celebrated: true, liteMode: false })
  })
})

describe('store: new actions', () => {
  it('applyGameResult dims the lamp at low Happy and counts less toward the goal', async () => {
    const store = await load(mem)
    store.getState().setPersona('college')
    store.getState().devSetHappy(50)
    store.getState().applyGameResult(result('save'))
    expect(store.getState().pillars.save.brightness).toBe('dim')
    expect(store.getState().savedAmount).toBe(START + SHARE * 0.75)
  })
  it('applyBurnout drains Happy once per call', async () => {
    const store = await load(mem)
    store.getState().applyBurnout()
    expect(store.getState().happy).toBe(65)
  })
  it('applyLifeMoment spends from the goal bar and raises Happy; an unaffordable one does nothing', async () => {
    const store = await load(mem)
    store.getState().setPersona('school') // start 1500
    store.getState().devSetHappy(40)
    store.getState().applyLifeMoment('chai')
    expect(store.getState()).toMatchObject({ happy: 48, savedAmount: 1400 })
    store.getState().devForceComplete('plan', 1) // happy now 48 -> dim lamp, still fine
    const before = store.getState().savedAmount
    store.getState().setPersona('school')
    store.getState().applyLifeMoment('festivalTreat')
    expect(store.getState().savedAmount).toBe(1350)
    expect(before).toBeGreaterThan(1400)
  })
  it('setAvatar, setFestival and setClassCode persist; an empty class code clears it', async () => {
    const store = await load(mem)
    store.getState().setAvatar('male')
    store.getState().setFestival('eid')
    store.getState().setClassCode('  CLASS-7  ')
    let reloaded = (await load(mem)).getState()
    expect(reloaded).toMatchObject({ avatar: 'male', festival: 'eid', classCode: 'CLASS-7' })
    reloaded.setClassCode('   ')
    reloaded = (await load(mem)).getState()
    expect(reloaded.classCode).toBeNull()
  })
  it('devSetHappy clamps and ignores junk', async () => {
    const store = await load(mem)
    store.getState().devSetHappy(500)
    expect(store.getState().happy).toBe(100)
    store.getState().devSetHappy(-9)
    expect(store.getState().happy).toBe(10)
    store.getState().devSetHappy(NaN)
    expect(store.getState().happy).toBe(10)
  })
  it('progress survives a reload', async () => {
    const store = await load(mem)
    store.getState().setPersona('college')
    store.getState().devSetHappy(30)
    store.getState().applyGameResult(result('invest', { quality: 0.7, lessonsSeen: ['risk'] }))
    const reloaded = (await load(mem)).getState()
    expect(reloaded.pillars.invest).toMatchObject({ status: 'complete', brightness: 'flicker', bestQuality: 0.7, lessonsSeen: ['risk'] })
    expect(reloaded.happy).toBe(30)
    expect(reloaded.savedAmount).toBe(START + SHARE * 0.5)
  })
})
