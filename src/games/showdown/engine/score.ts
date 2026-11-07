import { RULES } from './content'
import type { GoalId, Plan, RunResult } from './types'

export interface Score { goals: number; onTime: number; resilience: number; smart: number; total: number }
export interface Stars { goals: boolean; onTime: boolean; resilient: boolean; cleanBooks: boolean }

const GOAL_POINTS = [16, 14, 10]

/** The total of money that could have been saved with better choices (section 9). */
export const avoidableTotal = (r: RunResult) => Object.values(r.avoidable).reduce((a, b) => a + b, 0)

/**
 * Score out of 100. Goals (40) for the ranked goals met, then money handling (60: on time, resilience, cost smartness)
 * scaled by a delivery factor, so a plan that is clean but delivers nothing cannot win.
 */
export function score(plan: Plan, played: RunResult, futuresSurvived: number): Score {
  const ranks = (plan.ranks ?? ['G1', 'G2', 'G3']) as GoalId[]
  const met = ranks.filter((g) => played.goals.includes(g))
  const goals = ranks.reduce((a, g, i) => a + (played.goals.includes(g) ? GOAL_POINTS[i] : 0), 0)
  const datesShort = new Set(played.shortfalls.map(([p]) => p)).size
  const onTime = Math.max(0, 20 - 7 * datesShort)
  const resilience = 2 * futuresSurvived
  const smart = 20 * Math.max(0, 1 - avoidableTotal(played) / RULES.avoidableScale)
  const factor = 0.4 + 0.2 * Math.min(3, met.length)
  const total = Math.round(goals + (onTime + resilience + smart) * factor)
  return { goals, onTime, resilience, smart: Math.round(smart), total }
}

export function stars(plan: Plan, played: RunResult, futuresSurvived: number): Stars {
  const ranks = (plan.ranks ?? ['G1', 'G2', 'G3']) as GoalId[]
  return {
    goals: ranks.every((g) => played.goals.includes(g)),
    onTime: played.shortfalls.length === 0,
    resilient: futuresSurvived >= RULES.survivedGoal,
    cleanBooks: played.avoidable.unrecorded === 0,
  }
}

export const title = (total: number): 'rookie' | 'careful' | 'steady' | 'master' => (total < 40 ? 'rookie' : total < 70 ? 'careful' : total < 90 ? 'steady' : 'master')
