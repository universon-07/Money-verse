import { runPlan } from './run'
import type { Choices, Plan, RunResult } from './types'

export type PredictionId = 'P1' | 'P2' | 'P3' | 'P4'
export const PREDICTIONS: Record<PredictionId, { options: string[]; truth?: string }> = {
  P1: { options: ['same', '5', '12', '25'], truth: '12' }, // the same list costs 11.8% more than last year (₹43,500 vs ₹38,900)
  P2: { options: ['basic', 'reliable', 'unsure'], truth: 'reliable' }, // Basic is ₹8,000+ with its required extras, so it never beats Reliable's ₹8,000
  P3: { options: ['yes', 'no', 'unsure'] }, // truth comes from the player's own plan
  P4: { options: ['combo', 'parts', 'unsure'], truth: 'parts' }, // the same parts cost ₹13,000 against the Combo's ₹14,000 or ₹13,600
}

/** "If the sponsor pays late, can we still pay the Week 3 bills?" The truth is what happens in the played festival. */
export function truthOf(id: PredictionId, plan: Plan, choices: Choices = {}): string {
  if (id === 'P3') return runPlan(plan, 'F2', choices).shortfalls.some(([p]) => p === 'W3') ? 'no' : 'yes'
  return PREDICTIONS[id].truth!
}

/** A guess is right, wrong or "not sure". Being unsure counts as no point and is logged as unsure. */
export function judge(id: PredictionId, answer: string, plan: Plan, choices: Choices = {}): { correct: boolean; unsure: boolean; truth: string } {
  const truth = truthOf(id, plan, choices)
  return { correct: answer === truth, unsure: answer === 'unsure', truth }
}

/** P3's answer from the festival that was actually played (with the player's own shortfall choices). */
export const p3Truth = (played: Pick<RunResult, 'shortfalls'>): 'yes' | 'no' => (played.shortfalls.some(([p]) => p === 'W3') ? 'no' : 'yes')
