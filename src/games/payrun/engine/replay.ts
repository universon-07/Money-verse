import { isLearning, type LearnDecision } from './learn'
import { applyDecision, initialState, startWeek } from './week'
import type { Decision, State, WeekScript } from './types'

/** A season is the decisions plus a marker for "start the next week" (Payday is not a decision, but it is a moment). */
export type SeasonDecision = Decision | LearnDecision | { k: 'nextweek' }

/**
 * Rebuilds the state by replaying the saved decisions through the engine, so a saved game can never drift from the rules.
 * Returns the state, and the script of the week being played.
 */
export function replaySeason(script: WeekScript[], decisions: SeasonDecision[]): { state: State; script: WeekScript } {
  let w = 0
  let state = startWeek(initialState(), script[0]).state
  for (const d of decisions) {
    if (isLearning(d)) continue // learning answers change no money
    if (d.k === 'nextweek') {
      if (w + 1 < script.length && state.phase.at === 'done') {
        w++
        state = startWeek(state, script[w]).state
      }
    } else state = applyDecision(state, script[w], d).state
  }
  return { state, script: script[w] }
}
