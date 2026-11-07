import { marketOf, type Decision } from './log'
import type { Point } from './types'

export type Screen = 'start' | 'brief' | 'goals' | 'p1' | 'market' | 'plancheck' | 'date' | 'festival' | 'futures' | 'report'
export interface Step { screen: Screen; point?: Point }

const seen = (log: Decision[], s: string) => log.some((d) => d.k === 'seen' && d.screen === s)
const has = (log: Decision[], f: (d: Decision) => boolean) => log.some(f)

/**
 * Which screen comes next, from the log alone (so a reload resumes at the exact screen).
 * Order follows the spec: start, brief, goals, P1, market, plan check (lock), four dates, Festival Day scene,
 * ten futures, report.
 */
export function nextStep(log: Decision[]): Step {
  if (!seen(log, 'start')) return { screen: 'start' }
  if (!seen(log, 'brief')) return { screen: 'brief' }
  if (!has(log, (d) => d.k === 'goals')) return { screen: 'goals' }
  if (!has(log, (d) => d.k === 'predict' && d.id === 'P1')) return { screen: 'p1' }
  if (!marketOf(log).locked) return { screen: seen(log, 'market') ? 'plancheck' : 'market' }
  const dates: [Point, boolean][] = [
    ['W1', true],
    ['W2', has(log, (d) => d.k === 'event' && d.id === 'E2')],
    ['W3', has(log, (d) => d.k === 'event' && d.id === 'E4')],
    ['FD', true],
  ]
  for (const [point, decided] of dates) if (!seen(log, `date:${point}`) || !decided) return { screen: 'date', point }
  if (!seen(log, 'festival')) return { screen: 'festival' }
  if (!seen(log, 'futures')) return { screen: 'futures' }
  return { screen: 'report' }
}
