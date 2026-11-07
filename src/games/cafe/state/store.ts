import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { newRun } from '../engine/economy'
import { nextStep, type Step } from '../engine/flow'
import { nextMonth, settle, summarize } from '../engine/tally'
import type { Experiment, MonthSummary, Run } from '../engine/types'

/**
 * Holds the current month, the screen, and finished months. Screens call engine functions through `apply`;
 * money is never changed here directly. Saved on the device (try/catch inside zustand's storage).
 */
export interface CafeState {
  step: Step
  run: Run
  history: MonthSummary[]
  experiment?: Experiment
  paused: boolean
  slow: boolean
  ledgerOpen: boolean
  demo: boolean
  /** set once the Tally of this month has been recorded in history */
  recorded: boolean
  apply: (fn: (r: Run) => Run) => void
  next: () => void
  goTo: (s: Step) => void
  restart: (seed?: string) => void
  recordMonth: () => void
  newMonth: (e: Experiment) => void
  setPaused: (v: boolean) => void
  setSlow: (v: boolean) => void
  setLedgerOpen: (v: boolean) => void
}

export const newSeed = () => Math.random().toString(36).slice(2, 8).toUpperCase()

const fresh = (seed = newSeed()) => ({
  step: 'entry' as Step,
  run: newRun({ seed, goal: 'earphones' }),
  history: [] as MonthSummary[],
  experiment: undefined,
  recorded: false,
})

export const useCafe = create<CafeState>()(
  persist(
    (set, get) => ({
      ...fresh(),
      paused: false,
      slow: false,
      ledgerOpen: false,
      demo: false,
      apply: (fn) => set({ run: fn(get().run) }),
      next: () => {
        const { step, run, history, recorded } = get()
        set({ step: nextStep(step, run, history.length + (step === 'tally' && !recorded ? 1 : 0)) })
      },
      goTo: (step) => set({ step }),
      restart: (seed) => set({ ...fresh(seed), paused: false, ledgerOpen: false, demo: seed === 'DEMO' }),
      recordMonth: () => {
        const { run, history, recorded, experiment } = get()
        if (recorded) return
        const t = settle(run, history[history.length - 1])
        set({ history: [...history, summarize(run, t, experiment)], recorded: true })
      },
      newMonth: (e) => {
        const { run, history } = get()
        const last = history[history.length - 1]
        set({ run: nextMonth(run, last, `${run.seed}-M${run.month + 1}`), experiment: e, step: 'payday', recorded: false })
      },
      setPaused: (paused) => set({ paused }),
      setSlow: (slow) => set({ slow }),
      setLedgerOpen: (ledgerOpen) => set({ ledgerOpen }),
    }),
    {
      name: 'money-mohalla-cafe-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ step: s.step, run: s.run, history: s.history, experiment: s.experiment, slow: s.slow, recorded: s.recorded }),
    },
  ),
)

// dev only: lets the screenshot scripts drive the live store
if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __cafe: typeof useCafe }).__cafe = useCafe
