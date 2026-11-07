import { useMemo } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import type { Decision } from '../engine/log'
import { choicesOf, marketOf, planOf, shortfallOf } from '../engine/log'
import { nextStep, type Step } from '../engine/next'
import { cashLines, type CashLines } from '../engine/lines'
import { runPlan } from '../engine/run'
import type { Market } from '../engine/log'
import type { Plan, RunResult } from '../engine/types'

interface ShowdownStore {
  /** a made-up code that saves the game on this phone; no name, no personal data */
  code: string
  log: Decision[]
  /** this game's result has been sent to the hub */
  reported: boolean
  markReported: () => void
  decide: (d: Decision) => void
  /** replaces the whole log (preset games for checking and demos) */
  load: (log: Decision[]) => void
  /** takes back the last "seen" marker for a screen (the Back arrow within a decision) */
  unsee: (screen: string) => void
  restart: () => void
}

const safeStorage: StateStorage = {
  getItem: (k) => { try { return localStorage.getItem(k) } catch { return null } },
  setItem: (k, v) => { try { localStorage.setItem(k, v) } catch { /* play on without saving */ } },
  removeItem: (k) => { try { localStorage.removeItem(k) } catch { /* ignore */ } },
}
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const newCode = () => Array.from({ length: 4 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('')

export const useShowdown = create<ShowdownStore>()(
  persist(
    (set) => ({
      code: newCode(),
      log: [],
      reported: false,
      markReported: () => set({ reported: true }),
      decide: (d) => set((s) => ({ log: [...s.log, d] })),
      load: (log) => set({ log, reported: false }),
      unsee: (screen) => set((s) => {
        const i = s.log.map((d) => d.k === 'seen' && d.screen === screen).lastIndexOf(true)
        return i < 0 ? s : { log: s.log.filter((_, j) => j !== i) }
      }),
      restart: () => set({ code: newCode(), log: [], reported: false }),
    }),
    {
      name: 'showdown-v1',
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ code: s.code, log: s.log, reported: s.reported }),
    },
  ),
)

/** Everything the screens read, rebuilt from the log. */
export interface View { log: Decision[]; step: Step; market: Market; plan: Plan; lines: CashLines }
export function useView(): View {
  const log = useShowdown((s) => s.log)
  return useMemo(() => {
    const market = marketOf(log)
    return { log, step: nextStep(log), market, plan: planOf(log), lines: cashLines(market.signed) }
  }, [log])
}

/** The played festival (future F2), using the player's own event and shortfall choices. */
export function usePlayed(): RunResult {
  const log = useShowdown((s) => s.log)
  return useMemo(() => runPlan(planOf(log), 'F2', choicesOf(log), { mode: 'play', shortfall: shortfallOf(log) }), [log])
}
