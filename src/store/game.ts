import { rollInput } from '../lib/roll'
import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import { PERSONAS, type Avatar, type Festival, type Lang, type PersonaId, type PillarId } from '../content/data'
import { applyBurnout as applyBurnoutPure, clampHappy } from '../happy/apply'
import { applyLifeMoment as applyLifeMomentPure } from '../happy/moments'
import type { PlayOutcome } from '../host/flow'
import { finishSession as finishSessionPure } from '../host/session'
import type { GameResult } from '../host/types'
import { applyGameResult as applyGameResultPure } from '../progress/applyGameResult'
import { savedAmountFor } from '../progress/saved'
import { completedPillarsOf, freshProgress } from '../progress/state'
import { toAvatar, toGender, type Gender, LEGACY_STORE_KEY, STORE_KEY, STORE_VERSION, migratePersisted, normalizePersisted, type PersistedData } from './persisted'
import { newInstallId } from './ids'

/** values computed from the saved data on every change. Never saved; recomputed on load. */
interface Derived {
  /** goal-bar amount, always = savedAmountFor(state) */
  savedAmount: number
  /** pillars that are complete, in pillar order; kept so older screens keep working */
  completedPillars: PillarId[]
}

interface Actions {
  setLanguage: (l: Lang) => void
  setPersona: (p: PersonaId) => void
  /** older shortcut (used by the dummy play screen): counts as a perfect clear at the current Happy */
  completePillar: (p: PillarId) => void
  setStorySeen: (v: boolean) => void
  setCelebrated: (v: boolean) => void
  setLite: (v: boolean) => void
  resetProgress: () => void
  setAvatar: (a: Avatar) => void
  /** island UI name for the same choice (girl = female, boy = male) */
  setGender: (g: Gender) => void
  setFestival: (f: Festival) => void
  setClassCode: (code: string | null) => void
  setRollNo: (roll: string | null) => void
  /** fold a finished game into progress (see src/progress/applyGameResult.ts) */
  applyGameResult: (r: GameResult) => void
  applyLifeMoment: (id: string) => void
  /** call ONCE per game session, after applyGameResult */
  applyBurnout: () => void
  /** the host's single end-of-session step: applyGameResult then applyBurnout once, committed together. Returns before/after for the result screen. */
  finishSession: (r: GameResult) => PlayOutcome
  /** the one-time low-Happy tip has been shown or dismissed */
  markHappyToastSeen: () => void
  markCoachTipSeen: (tipId: string) => void
  dismissAllCoachTips: () => void
  /** dev panel only */
  devResetTips: () => void
  devSetHappy: (n: number) => void
  devForceComplete: (pillar: PillarId, quality: number) => void
}

export type GameState = PersistedData & Derived & Actions

const withDerived = <T extends PersistedData>(s: T): T & Derived => ({ ...s, savedAmount: savedAmountFor(s), completedPillars: completedPillarsOf(s) })

/** the keys of PersistedData: exactly what is saved to the device */
const PERSISTED_KEYS = [
  'language', 'persona', 'storySeen', 'celebrated', 'liteMode', 'happyToastSeen', 'coachTipsSeen',
  'avatar', 'gender', 'festival', 'installId', 'classCode', 'rollNo',
  'startAmount', 'goalAmount', 'happy', 'pillars', 'skills', 'diamonds', 'shieldPieces', 'title', 'lifeMomentsUsed', 'lifeMomentSpend', 'sessionsSinceBreak',
] as const satisfies readonly (keyof PersistedData)[]

const pickPersisted = (s: GameState): PersistedData => Object.fromEntries(PERSISTED_KEYS.map((k) => [k, s[k]])) as unknown as PersistedData

const safe = <R,>(fn: () => R, fallback: R): R => {
  try {
    return fn()
  } catch {
    return fallback
  }
}

/** localStorage, with a one-time read of the v1 key when the v2 key does not exist yet (the v1 key is never written or deleted) */
const storage: StateStorage = {
  getItem: (name) => safe(() => localStorage.getItem(name) ?? localStorage.getItem(LEGACY_STORE_KEY), null),
  setItem: (name, value) => safe(() => localStorage.setItem(name, value), undefined),
  removeItem: (name) => safe(() => localStorage.removeItem(name), undefined),
}

/** a perfect clear, used by completePillar and the dev panel */
const clearResult = (pillar: PillarId, quality: number): GameResult => ({
  pillar,
  cleared: true,
  quality,
  partial: 1,
  skills: {},
  lessonsSeen: [],
  joySignals: {},
  raw: { source: 'shortcut' },
})

export const useGame = create<GameState>()(
  persist(
    (set, get) => {
      /** every write goes through here so the derived fields can never be stale */
      const commit = (next: PersistedData) => set(withDerived({ ...get(), ...next }))
      const patch = (p: Partial<PersistedData>) => commit({ ...pickPersisted(get()), ...p })
      const progressNow = () => pickPersisted(get())

      const base = normalizePersisted({}, newInstallId)
      return {
        ...withDerived(base),
        setLanguage: (language) => patch({ language }),
        setPersona: (persona) => {
          const p = PERSONAS[persona]
          patch({ persona, celebrated: false, ...freshProgress(p.start, p.goal) })
        },
        completePillar: (id) => {
          if (get().pillars[id].status === 'complete') return
          commit(applyGameResultPure(progressNow(), clearResult(id, 1)))
        },
        setStorySeen: (storySeen) => patch({ storySeen }),
        setCelebrated: (celebrated) => patch({ celebrated }),
        setLite: (liteMode) => patch({ liteMode }),
        resetProgress: () => patch({ celebrated: false, ...freshProgress(get().startAmount, get().goalAmount) }),
        setAvatar: (avatar) => patch({ avatar, gender: toGender(avatar) }),
        setGender: (gender) => patch({ gender, avatar: toAvatar(gender) }),
        setFestival: (festival) => patch({ festival }),
        setClassCode: (code) => patch({ classCode: code && code.trim() ? code.trim() : null }),
        setRollNo: (roll) => patch({ rollNo: rollInput(roll ?? '') || null }),
        applyGameResult: (result) => commit(applyGameResultPure(progressNow(), result)),
        applyLifeMoment: (id) => commit(applyLifeMomentPure(progressNow(), id)),
        applyBurnout: () => commit(applyBurnoutPure(progressNow())),
        finishSession: (result) => {
          const out = finishSessionPure(progressNow(), result)
          commit(out.next)
          return { result, before: out.before, after: out.after }
        },
        markHappyToastSeen: () => patch({ happyToastSeen: true }),
        markCoachTipSeen: (id) => patch({ coachTipsSeen: { ...get().coachTipsSeen, [id]: true } }),
        dismissAllCoachTips: () => patch({ coachTipsSeen: { goal: true, happy: true, progress: true, hub: true } }),
        devResetTips: () => patch({ happyToastSeen: false, coachTipsSeen: {} }),
        devSetHappy: (n) => patch({ happy: clampHappy(Number.isFinite(n) ? n : get().happy) }),
        devForceComplete: (pillar, quality) => commit(applyGameResultPure(progressNow(), clearResult(pillar, quality))),
      }
    },
    {
      name: STORE_KEY,
      version: STORE_VERSION,
      storage: createJSONStorage(() => storage),
      partialize: (s) => pickPersisted(s) as unknown as GameState,
      migrate: (persisted, version) => migratePersisted(persisted, version) as unknown as GameState,
      // runs on load, with `undefined` when nothing is saved yet; always yields complete, valid state
      merge: (persisted, current) => withDerived({ ...current, ...normalizePersisted(persisted, () => current.installId) }),
      // make sure a brand-new install's id is written to the device once, so it is created only once
      onRehydrateStorage: () => () => queueMicrotask(() => useGame.setState({})),
    },
  ),
)

export const autoLite = (): boolean => {
  try {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const cores = navigator.hardwareConcurrency ?? 8
    return reduced || cores <= 4
  } catch {
    return false
  }
}

export const useLite = (): boolean => {
  const l = useGame((s) => s.liteMode)
  return l ?? autoLite()
}
