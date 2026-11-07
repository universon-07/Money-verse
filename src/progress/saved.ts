import type { PillarId } from '../content/data'
import { PROGRESS } from './config'
import type { ProgressState } from './types'

/**
 * What one pillar adds to the goal amount: its share of (goal - start) x the multiplier for the brightness it was lit at
 * (at the time of its best clear). Partial progress and failed plays add nothing.
 */
export function pillarContribution(s: Pick<ProgressState, 'startAmount' | 'goalAmount' | 'pillars'>, id: PillarId): number {
  const p = s.pillars[id]
  if (!p || p.status !== 'complete' || !p.brightness) return 0
  const span = Math.max(0, s.goalAmount - s.startAmount)
  return span * PROGRESS.pillarShare * PROGRESS.multiplier[p.brightness]
}

/** everything the cleared pillars have added to the goal so far (before life-moment spending), at the brightness each was lit */
export function earnedAmount(s: Pick<ProgressState, 'startAmount' | 'goalAmount' | 'pillars'>): number {
  return (Object.keys(s.pillars) as PillarId[]).reduce((sum, id) => sum + pillarContribution(s, id), 0)
}

/**
 * How much the cleared pillars hold back because they are not at full brightness: the sum over cleared pillars of
 * (goal - start) x share x (1 - multiplier). It is what the Happy Index cost, before life-moment spending is considered.
 */
export function brightnessPenalty(s: Pick<ProgressState, 'startAmount' | 'goalAmount' | 'pillars'>): number {
  const span = Math.max(0, s.goalAmount - s.startAmount)
  const lost = (Object.keys(s.pillars) as PillarId[]).reduce((sum, id) => {
    const p = s.pillars[id]
    return p && p.status === 'complete' && p.brightness ? sum + span * PROGRESS.pillarShare * (1 - PROGRESS.multiplier[p.brightness]) : sum
  }, 0)
  return Math.round(lost)
}

/**
 * The goal-bar amount. DERIVED from the state, never stored as the source of truth:
 * start + every pillar's contribution - what was spent on life moments, kept between the floor and the goal.
 * Same state in, same number out.
 */
export function savedAmountFor(s: Pick<ProgressState, 'startAmount' | 'goalAmount' | 'pillars' | 'lifeMomentSpend'>): number {
  const earned = earnedAmount(s)
  const total = s.startAmount + earned - (s.lifeMomentSpend || 0)
  const ceiling = Math.max(s.goalAmount, PROGRESS.savedFloor)
  return Math.round(Math.min(ceiling, Math.max(PROGRESS.savedFloor, total)))
}

/** the most any one pillar can add: its share of the gap, at a bright lamp */
export const pillarMax = (s: Pick<ProgressState, 'startAmount' | 'goalAmount'>): number => Math.max(0, s.goalAmount - s.startAmount) * PROGRESS.pillarShare
