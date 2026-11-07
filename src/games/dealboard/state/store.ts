import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { act, newRun, type Action, type RunState } from '../engine/run'
import { newSeed } from '../engine/rng'

interface DealBoardStore {
  run: RunState | null
  start: (seed?: string) => void
  dispatch: (a: Action) => void
  quit: () => void
}

/** A saved run is only kept if it has every field the current game needs (older builds saved fewer). */
export const usableRun = (run: unknown): run is RunState => {
  if (!run || typeof run !== 'object') return false
  const fresh = newRun('x')
  const r = run as Record<string, unknown>
  return Object.keys(fresh).every((k) => k in r) && typeof r.seed === 'string'
}

/** Only the seed and the player's own state are stored; the market is recomputed from the seed. */
export const useDealBoard = create<DealBoardStore>()(
  persist(
    (set, get) => ({
      run: null,
      start: (seed) => set({ run: newRun(seed ?? newSeed()) }),
      dispatch: (a) => {
        const run = get().run
        if (run) set({ run: act(run, a) })
      },
      quit: () => set({ run: null }),
    }),
    {
      name: 'deal-board-v1',
      version: 4,
      // runs saved by earlier builds are dropped rather than crashing the page
      migrate: () => ({ run: null }),
      merge: (saved, current) => {
        const run = (saved as { run?: unknown } | undefined)?.run
        // the game starts fresh every time the app loads; a saved run is only kept if a caller opts in later
        void run
        return { ...current, run: null }
      },
    },
  ),
)
