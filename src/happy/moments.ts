import type { ProgressState } from '../progress/types'
import { savedAmountFor } from '../progress/saved'
import { applyHappyDelta } from './apply'
import { HAPPY } from './config'
import moments from './moments.json'

/**
 * Life moments: things a player can spend a little goal money on to look after themselves.
 * Data only (names and descriptions come from the locale files). `cost` is in rupees taken from the saved amount,
 * `joy` is the Happy gained the FIRST time.
 */
export interface LifeMoment { id: string; cost: number; joy: number }
export const LIFE_MOMENTS: LifeMoment[] = moments

export const lifeMomentById = (id: string): LifeMoment | undefined => LIFE_MOMENTS.find((m) => m.id === id)

/** Happy a life moment would give right now: base x repeatDecay ^ (times used before), rounded. It fades to 0. */
export function lifeMomentGain(state: Pick<ProgressState, 'lifeMomentsUsed'>, id: string): number {
  const m = lifeMomentById(id)
  if (!m) return 0
  const used = state.lifeMomentsUsed?.[id] ?? 0
  return Math.round(m.joy * HAPPY.moments.repeatDecay ** used)
}

/** can the player pay for it? (the saved amount can never go below zero) */
export function canAffordLifeMoment(state: ProgressState, id: string): boolean {
  const m = lifeMomentById(id)
  return !!m && savedAmountFor(state) >= m.cost
}

/** Spend the cost and gain the (diminishing) Happy. Unknown ids and unaffordable moments return the state unchanged. */
export function applyLifeMoment<T extends ProgressState>(state: T, id: string): T {
  const m = lifeMomentById(id)
  if (!m || !canAffordLifeMoment(state, id)) return state
  const gain = lifeMomentGain(state, id)
  const next = applyHappyDelta(state, gain)
  return {
    ...next,
    lifeMomentSpend: state.lifeMomentSpend + m.cost,
    sessionsSinceBreak: 0,
    lifeMomentsUsed: { ...state.lifeMomentsUsed, [id]: (state.lifeMomentsUsed[id] ?? 0) + 1 },
  }
}
