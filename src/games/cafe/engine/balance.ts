import { moodOf, moodStage } from './mood'
import { stageOf } from './pressure'
import type { BottleId, Run } from './types'

export type StarId = 'wants' | 'friends' | 'mood'
export const STARS: StarId[] = ['wants', 'friends', 'mood']

const BOTTLE_OF: Record<'wants' | 'friends', BottleId> = { wants: 'fun', friends: 'friends' }

/**
 * Balance: the month's three stars. A bottle earns its star by staying calm (never popped, never above "bubbling"),
 * and the mood earns its star by ending good. Three stars and the goal make a Perfect Month.
 * A reading of the player's own choices; it never changes the money.
 */
export function balance(run: Run): Record<StarId, boolean> {
  const calm = (k: 'wants' | 'friends') => {
    const b = BOTTLE_OF[k]
    return !run.bigNight?.bottles.includes(b) && stageOf(run.fizz[b]) <= 2
  }
  return { wants: calm('wants'), friends: calm('friends'), mood: moodStage(moodOf(run)) >= 3 }
}

export const starCount = (b: Record<StarId, boolean>): number => STARS.filter((s) => b[s]).length

export const isPerfect = (run: Run, reached: boolean): boolean => reached && starCount(balance(run)) === 3
