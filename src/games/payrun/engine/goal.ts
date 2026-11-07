import { ECON } from './content'
import type { WeekSummary } from './types'

/** The student's usual weekly saving: the jar's average gain over the last three weeks (₹250 before there is history, never below ₹50). */
export function pace(history: WeekSummary[]): number {
  const recent = history.slice(-3)
  if (!recent.length) return ECON.defaultPace
  return Math.max(ECON.minPace, Math.round(recent.reduce((a, w) => a + w.jarGain, 0) / recent.length))
}

/** A price in goal-weeks: price divided by the usual weekly saving, to the nearest half week (at least a half). */
export const goalWeeks = (history: WeekSummary[], price: number): number => Math.max(0.5, Math.round((price / pace(history)) * 2) / 2)

/** "At your pace, about N more weeks": the gap to the goal at the usual weekly saving. */
export const weeksToGoal = (history: WeekSummary[], jar: number): number => Math.max(0, Math.ceil((ECON.goal - jar) / pace(history)))
