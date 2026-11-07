import type { Run } from './types'

/**
 * Mood: how this month feels, from what the player did. Display only: it never feeds the
 * money, the fizz, the Tally or the evidence, and it is not a score to maximise.
 * Treats you chose, time with friends and kindness lift it; saying no to wants all month wears it down.
 */
export function moodOf(run: Run): number {
  let m = 50
  m += 8 * run.window.filter((w) => w.bought).length
  for (const t of run.trolley) if (t.action === 'ok') m += run.worth[t.itemId] === 'meh' ? -2 : 4
  if (run.bigNight?.choice === 'go') m += 25
  else if (run.bigNight?.choice === 'half') m += 12
  else if (run.bigNight?.choice === 'stay') m -= 8
  if (run.tejaChoice === 'lend100' || run.tejaChoice === 'lend50') m += 10
  else if (run.tejaChoice === 'gift30') m += 12
  else if (run.tejaChoice === 'no') m += 2
  m -= 4 * run.refused.length
  return Math.max(0, Math.min(100, m))
}

/** 0 low .. 4 high, for the five faces under the bar */
export const moodStage = (m: number): 0 | 1 | 2 | 3 | 4 => (m >= 80 ? 4 : m >= 60 ? 3 : m >= 40 ? 2 : m >= 20 ? 1 : 0)
