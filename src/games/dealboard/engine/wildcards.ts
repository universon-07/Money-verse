import { COMPANY } from './companies'
import { TURNS } from './board'
import { hashSeed, int, mulberry32, shuffle, streamFor } from './rng'
import type { CompanyId } from './types'

export const TASK_COUNT = 8

/** The money question behind a windfall: which question, and in what order its three answers are shown (answer 0 is the right one). */
export function taskFor(seed: string, turn: number): { n: number; order: number[] } {
  return { n: (hashSeed(seed) + turn) % TASK_COUNT, order: shuffle(mulberry32(hashSeed(`${seed}:task:${turn}`)), [0, 1, 2]) }
}

/** What a followed tip puts in. */
export const WILD_TIP = 5000

export type WildKind = 'bill' | 'gift' | 'tip'
export interface Wild {
  kind: WildKind
  /** rupees for a bill or a gift; WILD_TIP for a tip */
  amount: number
  /** the company a tip is about */
  companyId?: CompanyId
  /** which of the three wordings */
  variant: number
}

/**
 * Four wildcards per run, in four different quarters between 2 and 8 (never the emergency quarter):
 * a surprise bill, a windfall, and two hot tips about weak companies. Fixed by the seed, so a run is reproducible.
 */
export function wildcardFor(seed: string, turn: number, picked: CompanyId[], emergencyTurn: number): Wild | null {
  const rng = streamFor(seed, 'wildcards')
  const turns = shuffle(rng, Array.from({ length: TURNS - 1 }, (_, i) => i + 2).filter((t) => t !== emergencyTurn)).slice(0, 4).sort((a, b) => a - b)
  const i = turns.indexOf(turn)
  if (i < 0) return null
  const kinds = shuffle(rng, ['bill', 'gift', 'tip', 'tip'] as WildKind[])
  const kind = kinds[i]
  const variant = hashSeed(`${seed}:wild:${turn}`) % 3
  if (kind === 'tip') {
    const weak = picked.filter((id) => !COMPANY[id].sound)
    const pool = weak.length ? weak : picked
    const tipRng = mulberry32(hashSeed(`${seed}:tip:${turn}`))
    return { kind, amount: WILD_TIP, companyId: pool[int(tipRng, 0, pool.length - 1)], variant }
  }
  const r = mulberry32(hashSeed(`${seed}:amount:${turn}`))
  return { kind, amount: kind === 'bill' ? 500 * int(r, 4, 8) : 500 * int(r, 3, 6), variant }
}
