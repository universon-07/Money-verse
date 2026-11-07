import type { ProgressState } from '../progress/types'
import { clamp } from '../progress/state'
import { HAPPY } from './config'

export const clampHappy = (h: number) => clamp(h, HAPPY.min, HAPPY.max)

/** move Happy by `delta`, clamped to the allowed range. A non-finite delta changes nothing. */
export function applyHappyDelta<T extends ProgressState>(state: T, delta: number): T {
  if (!Number.isFinite(delta)) return state
  const happy = clampHappy(state.happy + delta)
  return happy === state.happy ? state : { ...state, happy }
}

/**
 * the end-of-session drain. The host calls this ONCE per game session (never per shift or per day).
 * It also counts the session toward "time for a break"; a life moment resets that count.
 */
export function applyBurnout<T extends ProgressState>(state: T): T {
  const drained = applyHappyDelta(state, -HAPPY.burnoutDrain)
  return { ...drained, sessionsSinceBreak: (state.sessionsSinceBreak ?? 0) + 1 }
}
