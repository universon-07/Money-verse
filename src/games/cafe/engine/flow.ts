import { popped } from './pressure'
import type { BillId, Run } from './types'

/**
 * The order of screens: a loadout, then four boss phases with a bill slotted in at each, then the Tally.
 * Steps that do not apply this month are skipped. Pure, so the order is testable.
 */
export type Step =
  | 'entry' | 'walkin' | 'goal' | 'predict1' | 'meet' | 'payday' | 'bignight0'
  | 'bill:auto' | 'window' | 'bill:data' | 'trolley' | 'predict2' | 'plates' | 'worth'
  | 'bignight' | 'teja' | 'bill:lunch' | 'rain' | 'pay' | 'pay2' | 'tally' | 'thennow' | 'onechange'

export const ORDER: Step[] = [
  'entry', 'walkin', 'goal', 'predict1', 'meet', 'payday', 'bignight0',
  'bill:auto', 'window', 'bill:data', 'trolley', 'predict2', 'plates', 'worth',
  'bignight', 'teja', 'bill:lunch', 'rain', 'pay', 'pay2', 'tally', 'thennow', 'onechange',
]

export function applies(s: Step, run: Run, monthsDone: number): boolean {
  switch (s) {
    case 'walkin':
    case 'goal':
    case 'predict1':
    case 'meet':
      return run.month === 1
    // a Big Night carried over from last month arrives on Day 1
    case 'bignight0':
      return run.month > 1 && !run.bigNight && popped(run).length > 0
    case 'bignight':
      return !run.bigNight && popped(run).length > 0
    case 'pay2':
      return !!run.extra
    case 'thennow':
      return monthsDone >= 2
    default:
      return true
  }
}

export function nextStep(cur: Step, run: Run, monthsDone: number): Step {
  const i = ORDER.indexOf(cur)
  for (let j = i + 1; j < ORDER.length; j++) if (applies(ORDER[j], run, monthsDone)) return ORDER[j]
  return 'onechange'
}

export const billOf = (s: Step): BillId | null => (s.startsWith('bill:') ? (s.slice(5) as BillId) : null)

/** which boss phase a step belongs to (0 = the loadout or before) */
export function phaseOf(s: Step): 0 | 1 | 2 | 3 | 4 {
  if (s === 'bill:auto' || s === 'window') return 1
  if (s === 'bill:data' || s === 'trolley' || s === 'predict2' || s === 'plates' || s === 'worth') return 2
  if (s === 'bignight' || s === 'teja' || s === 'bill:lunch') return 3
  if (s === 'rain' || s === 'pay' || s === 'pay2') return 4
  return 0
}

/** the day on the Month bar for a step */
export function dayOf(s: Step): number {
  const map: Partial<Record<Step, number>> = {
    payday: 1, bignight0: 1, 'bill:auto': 3, window: 3, 'bill:data': 9, trolley: 9, predict2: 11, plates: 11, worth: 11,
    bignight: 14, teja: 16, 'bill:lunch': 20, rain: 23, pay: 23, pay2: 26, tally: 30, thennow: 30, onechange: 30,
  }
  return map[s] ?? 1
}

/** the cloud creeps closer every phase and never moves back: 0 far ... 4 overhead */
export function cloudStage(s: Step): 0 | 1 | 2 | 3 | 4 {
  const p = phaseOf(s)
  if (s === 'tally' || s === 'thennow' || s === 'onechange') return 4
  return p as 0 | 1 | 2 | 3 | 4
}

/** screens that are mostly a conversation keep the picture big; screens full of choices glide to side by side */
const QUIET: Step[] = ['entry', 'walkin', 'goal', 'predict1', 'predict2', 'plates', 'rain']
export const isBusy = (s: Step): boolean => !QUIET.includes(s)
