import type { GameResult } from '../host/types'
import type { ProgressState } from '../progress/types'
import { freshProgress } from '../progress/state'
import type { PillarId } from '../content/data'

/** test helpers: a typical player (college persona numbers) and a game result with sensible defaults */
export const START = 4000
export const GOAL = 30000
/** what one fully bright pillar adds: 25% of (30000 - 4000) */
export const SHARE = 6500

export const player = (over: Partial<ProgressState> = {}): ProgressState => ({ ...freshProgress(START, GOAL), ...over })

export const result = (pillar: PillarId, over: Partial<GameResult> = {}): GameResult => ({
  pillar,
  cleared: true,
  quality: 0.8,
  partial: 1,
  skills: {},
  lessonsSeen: [],
  joySignals: {},
  raw: null,
  ...over,
})

/** recursively freeze, so any accidental mutation by the code under test throws */
export function deepFreeze<T>(o: T): T {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o)
    for (const v of Object.values(o as Record<string, unknown>)) deepFreeze(v)
  }
  return o
}

/** an in-memory stand-in for localStorage / sessionStorage */
export function memoryStorage(seed: Record<string, string> = {}) {
  const m = new Map(Object.entries(seed))
  return {
    getItem: (k: string) => (m.has(k) ? (m.get(k) as string) : null),
    setItem: (k: string, v: string) => void m.set(k, String(v)),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
    key: (i: number) => [...m.keys()][i] ?? null,
    get length() {
      return m.size
    },
    dump: () => Object.fromEntries(m),
  }
}
