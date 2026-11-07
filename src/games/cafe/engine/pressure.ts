import { RELEASE } from './content'
import type { BottleId, Run, Stage } from './types'

/**
 * The fizz: a record of the player's own refusals, never a stat to manage.
 * No drift, no clock: a bottle only rises because the player declined something it cares about.
 */
export const POP = 100

export function stageOf(v: number): Stage {
  if (v >= POP) return 4
  if (v >= 75) return 3
  if (v >= 50) return 2
  if (v >= 25) return 1
  return 0
}

/** player declined a fizz item: its pull goes into the bottle, and the item is remembered for the Big Night */
export function decline(run: Run, bottle: BottleId | undefined, pull: number | undefined, itemId: string): Run {
  if (!bottle || !pull) return run
  return {
    ...run,
    fizz: { ...run.fizz, [bottle]: run.fizz[bottle] + pull },
    refused: [itemId, ...run.refused.filter((r) => r !== itemId)],
  }
}

/** player said yes to a fizz item: the pressure settles by 1.5 times its pull, never below 0 */
export function release(run: Run, bottle: BottleId | undefined, pull: number | undefined): Run {
  if (!bottle || !pull) return run
  return { ...run, fizz: { ...run.fizz, [bottle]: Math.max(0, run.fizz[bottle] - Math.round(pull * RELEASE)) } }
}

/** bottles that have popped; FRIENDS first, as the doc specifies */
export function popped(run: Run): BottleId[] {
  return (['friends', 'fun'] as BottleId[]).filter((b) => run.fizz[b] >= POP)
}
