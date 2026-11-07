import type { Decision } from '../engine/log'

/**
 * Ready-made games for checking and demos: the spec's two reference plans, at any stage.
 * Open /play/plan?preset=B&at=festival (A or B; at = market, locked, festival, futures, report).
 */
const seen = (screen: string): Decision => ({ k: 'seen', screen })
const INTRO = (ranks: ('G1' | 'G2' | 'G3' | 'G5')[]): Decision[] => [seen('start'), seen('brief'), { k: 'goals', ranked: ranks }, { k: 'predict', id: 'P1', answer: '12' }]
const hag = (item: string, n: number): Decision[] => Array.from({ length: n }, () => ({ k: 'haggle', item }))

const MARKET: Record<string, Decision[]> = {
  // Plan B: the balanced plan (spec section 12): 98 points, holds in 9 of 10 futures
  B: [...hag('big', 2), { k: 'sign', item: 'big' }, ...hag('lightsC', 1), { k: 'sign', item: 'lightsC' }, ...hag('plates', 3), { k: 'sign', item: 'plates', qty: 450 }, ...hag('kids', 1), { k: 'sign', item: 'kids' }, { k: 'sign', item: 'p1' }],
  // Plan A: everything at Daam Fix, fixed prices: breaks in Week 3, 45 points, holds in 3 of 10
  A: [{ k: 'sign', item: 'reliable' }, { k: 'sign', item: 'lights' }, { k: 'sign', item: 'plates', qty: 450 }, { k: 'sign', item: 'kids' }, { k: 'sign', item: 'p1' }],
}
const RANKS = { B: ['G3', 'G2', 'G1'], A: ['G1', 'G2', 'G3'] } as const
const LOCK = (p3: string): Decision[] => [seen('market'), { k: 'predict', id: 'P3', answer: p3 }, { k: 'lock' }]
const DATES: Record<string, Decision[]> = {
  B: [seen('date:W1'), { k: 'event', id: 'E2', choice: 'hold' }, seen('date:W2'), { k: 'event', id: 'E4', choice: 'refuse' }, seen('date:W3'), seen('date:FD')],
  A: [seen('date:W1'), { k: 'event', id: 'E2', choice: 'hold' }, seen('date:W2'), { k: 'shortfall', point: 'W3', item: 'reliable', action: 'cancel' }, { k: 'event', id: 'E4', choice: 'refuse' }, seen('date:W3'), seen('date:FD')],
}

export const STAGES = ['market', 'locked', 'festival', 'futures', 'report'] as const
export type Stage = (typeof STAGES)[number]

/** The log for a reference plan, up to the screen named by `at`. */
export function presetLog(plan: 'A' | 'B', at: Stage): Decision[] {
  const base = [...INTRO([...RANKS[plan]]), ...MARKET[plan]]
  if (at === 'market') return base
  const locked = [...base, ...LOCK(plan === 'B' ? 'yes' : 'no')]
  if (at === 'locked') return locked
  const festival = [...locked, ...DATES[plan]]
  if (at === 'festival') return festival
  const futures = [...festival, seen('festival')]
  if (at === 'futures') return futures
  // report: the full game, plus the two in-market guesses for Plan B
  const guesses: Decision[] = [{ k: 'predict', id: 'P2', answer: 'reliable' }, { k: 'predict', id: 'P4', answer: 'parts' }]
  const done = [...futures, seen('futures')]
  return plan === 'B' ? [...done, ...guesses] : done
}
