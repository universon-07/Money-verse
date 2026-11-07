import { useMemo } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import { makeScript } from '../engine/script'
import { applyDecision } from '../engine/week'
import { isLearning, type LearnDecision } from '../engine/learn'
import { learnState, type WeekLearn } from '../engine/learn'
import { replaySeason, type SeasonDecision } from '../engine/replay'
import type { Decision, Event, State, WeekScript } from '../engine/types'

export type GoalId = 'course' | 'bike' | 'trip'

/** What just happened, shown on a result panel before the next card. */
export interface Result { decision: Decision; events: Event[]; before: State }

interface PayRunStore {
  seed: string
  goal: GoalId | null
  decisions: SeasonDecision[]
  /** the week whose "this week's question" screen has been read */
  focused: number
  /** not persisted */
  result: Result | null

  start: (goal: GoalId, seed?: string) => void
  focus: (week: number) => void
  decide: (d: Decision) => void
  learn: (d: LearnDecision) => void
  dismissResult: () => void
  nextWeek: () => void
  restart: () => void
}

const safeStorage: StateStorage = {
  getItem: (k) => { try { return localStorage.getItem(k) } catch { return null } },
  setItem: (k, v) => { try { localStorage.setItem(k, v) } catch { /* play on without saving */ } },
  removeItem: (k) => { try { localStorage.removeItem(k) } catch { /* ignore */ } },
}
const newSeed = () => Math.random().toString(36).slice(2, 8).toUpperCase()

const derive = (seed: string, decisions: SeasonDecision[]) => replaySeason(makeScript(seed), decisions)

export const usePayRun = create<PayRunStore>()(
  persist(
    (set, get) => ({
      seed: newSeed(),
      goal: null,
      decisions: [],
      focused: 0,
      result: null,

      start: (goal, seed) => set({ goal, seed: seed ?? newSeed(), decisions: [], focused: 0, result: null }),
      focus: (week) => set({ focused: week }),
      decide: (d) => {
        const { seed, decisions } = get()
        const { state, script } = derive(seed, decisions)
        const out = applyDecision(state, script, d)
        set({ decisions: [...decisions, d], result: { decision: d, events: out.events, before: state } })
      },
      learn: (d) => set((s) => ({ decisions: [...s.decisions, d] })),
      dismissResult: () => set({ result: null }),
      nextWeek: () => set((s) => ({ decisions: [...s.decisions, { k: 'nextweek' }], result: null })),
      restart: () => set({ goal: null, decisions: [], focused: 0, result: null, seed: newSeed() }),
    }),
    {
      name: 'payrun-v1',
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ seed: s.seed, goal: s.goal, decisions: s.decisions, focused: s.focused }),
      // a saved season that no longer replays (content changed) starts fresh instead of crashing
      merge: (saved, cur) => {
        const p = saved as Partial<PayRunStore>
        try {
          if (p?.decisions) derive(p.seed ?? cur.seed, p.decisions)
          return { ...cur, ...p }
        } catch {
          return cur
        }
      },
    },
  ),
)

/** The engine's state and the script of the week being played, rebuilt from the saved decisions. */
export function useSeason(): { state: State; script: WeekScript } {
  const seed = usePayRun((s) => s.seed)
  const decisions = usePayRun((s) => s.decisions)
  return useMemo(() => derive(seed, decisions), [seed, decisions])
}

/** What the student has predicted, answered and noted, week by week. */
export function useLearning(): Record<number, WeekLearn> {
  const decisions = usePayRun((s) => s.decisions)
  return useMemo(() => learnState(decisions), [decisions])
}
export { isLearning }
