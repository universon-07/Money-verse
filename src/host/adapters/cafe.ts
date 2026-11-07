import type { GameAdapter, GameResult } from '../types'
import { asRecord, clamp, clamp01, hasNum, num, pickRecord, skills, strings, warn } from './util'

/**
 * Pocket Panic (pillar: save). The game reports its own GameResult:
 *   { game:'cafe', cohortCode, seed, score:{ balance (stars 0-3), saved, behaviours, total },
 *     evidence:{ payFirst, track, small, emergency, plan, wait, goals, borrow, lend (booleans), little, cushionUsed, ... },
 *     lessonsSeen, minaretLit, meta:{ ending, ... } }
 * `score.total` is how many of the nine behaviours were seen (0-9). Optional extra: `progress` (0..1) when the player quits.
 * Play money amounts (saved, borrowCost, ...) are never read: the game grades habits, not rupees.
 */
const BEHAVIOURS = 9
const PARTIAL_CAP = 0.99
const fraction = (e: Record<string, unknown>, keys: string[]) => keys.filter((k) => e[k] === true).length / keys.length

export const adaptCafe: GameAdapter = (payload): GameResult => {
  const p = asRecord('cafe', payload)
  const score = pickRecord(p, 'score')
  const evidence = pickRecord(p, 'evidence')

  const total = score.total
  const finished = hasNum(total)
  if (!finished) warn('cafe', 'no score total in the payload; treating this as a quit')
  const quality = finished ? clamp(total / BEHAVIOURS, 0, 1) : 0
  const cleared = finished && (typeof p.minaretLit === 'boolean' ? p.minaretLit : quality >= 0.5)
  const partial = cleared ? 1 : finished ? Math.min(PARTIAL_CAP, quality) : Math.min(PARTIAL_CAP, clamp01(num(p.progress, 0)))

  // what the player did with joy: treats enjoyed, treats refused, kindness to a friend, and how balanced the month was (the stars)
  const j = pickRecord(p, 'joy')
  const stars = clamp(num(j.stars, 0), 0, 3)
  const joy = {
    treatsBought: Math.max(0, num(j.treatsBought, 0)),
    treatsSkipped: Math.max(0, num(j.treatsSkipped, 0)),
    lentToFriends: Math.max(0, num(j.lent, 0)),
    restedOrBalanced: stars >= 3 ? 2 : stars === 2 ? 1 : 0,
  }

  return {
    pillar: 'save',
    cleared,
    quality: clamp01(quality),
    partial: clamp01(partial),
    skills: finished
      ? skills({
          saving: fraction(evidence, ['payFirst', 'small', 'emergency']),
          planning: fraction(evidence, ['track', 'plan', 'goals']),
          patience: fraction(evidence, ['wait', 'borrow', 'lend']),
        })
      : {},
    lessonsSeen: strings(p.lessonsSeen),
    joySignals: finished ? joy : {},
    raw: payload,
  }
}
