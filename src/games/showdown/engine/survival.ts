import { FUTURES } from './content'
import { runPlan } from './run'
import type { Choices, Plan, RunResult } from './types'

/** Replays the plan in all ten futures with autopilot defaults. "Survived" = no shortfall on any date. */
export function futuresRun(plan: Plan, choices: Choices = {}): { id: string; result: RunResult }[] {
  return FUTURES.map((f) => ({ id: f.id, result: runPlan(plan, f.id, choices) }))
}
export const survival = (plan: Plan, choices: Choices = {}): number => futuresRun(plan, choices).filter((x) => x.result.survived).length

/** Across the futures that broke, the earliest date and the biggest bill due then (for the debrief: "it first broke on Week 3: the hall"). */
export function firstBreak(runs: { id: string; result: RunResult }[]): RunResult['firstBreak'] {
  const order = ['W1', 'W2', 'W3', 'FD']
  const breaks = runs.map((r) => r.result.firstBreak).filter((b): b is NonNullable<RunResult['firstBreak']> => !!b)
  return breaks.sort((a, b) => order.indexOf(a.point) - order.indexOf(b.point))[0] ?? null
}
