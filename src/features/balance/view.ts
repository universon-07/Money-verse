import { HAPPY } from '../../happy/config'
import { earnedAmount, savedAmountFor } from '../../progress/saved'
import type { ProgressState } from '../../progress/types'

/**
 * View-model for "you and your future": how much went toward the goal versus on yourself. It teaches that BOTH matter and
 * never recommends anything. Pure.
 */

export type BalanceTone = 'none' | 'allWork' | 'balanced' | 'selfHeavy'

export interface BalanceView {
  /** life moments taken so far (free ones count) */
  breaksTaken: number
  /** everything the finished pillars have added to the goal meter */
  earned: number
  /** everything spent on looking after yourself (life moments) */
  spentOnSelf: number
  /** where the goal meter stands compared with where it started (can be negative if spending came first) */
  net: number
  /** share of (earned + spent) that went on yourself, 0..100 */
  selfSharePercent: number
  tone: BalanceTone
  /** one plain sentence on why both matter (locale key) */
  whyKey: string
  /** one thing to try next (locale key) */
  nextStepKey: string
}

export function balanceFor(state: Pick<ProgressState, 'startAmount' | 'goalAmount' | 'pillars' | 'lifeMomentSpend' | 'lifeMomentsUsed'>): BalanceView {
  const earned = Math.round(earnedAmount(state))
  const spentOnSelf = Math.round(state.lifeMomentSpend || 0)
  const total = earned + spentOnSelf
  const share = total > 0 ? spentOnSelf / total : 0
  const breaksTaken = Object.values(state.lifeMomentsUsed ?? {}).reduce((sum, n) => sum + n, 0)
  let tone: BalanceTone
  if (total === 0) tone = 'none'
  else if (share > HAPPY.balance.selfHeavyAbove) tone = 'selfHeavy'
  else if (breaksTaken < HAPPY.balance.allWorkBelowBreaks) tone = 'allWork'
  else tone = 'balanced'
  return {
    breaksTaken,
    earned,
    spentOnSelf,
    net: savedAmountFor(state) - state.startAmount,
    selfSharePercent: Math.round(share * 100),
    tone,
    whyKey: 'balance.why',
    nextStepKey: `balance.next.${tone}`,
  }
}
