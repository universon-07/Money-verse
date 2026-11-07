import type { GameAdapter, GameResult } from '../types'
import { asRecord, clamp, clamp01, hasNum, num, pickNum, pickRecord, skill, skills, strings, warn } from './util'

/**
 * Festival Countdown (pillar: plan). Spec payload:
 *   { game:'festival', cohortCode, seed, festival,
 *     stars:{ ghar, gift, dost, plan },                       // booleans
 *     score:{ needs, plan, shopping, goal, balance, total },  // 25 / 25 / 20 / 15 / 15 / 100
 *     evidence:{ needsBoughtDay1, raidsTotal, walkedHome, comparedFirst, bargainsWon, fakeSaleBuys,
 *                lowQualityBuys, bufferCoveredS2, swaps, ringTossPlays },
 *     lessonsSeen: string[] }
 * Optional extras the adapter understands if a game adds them: `progress` (0..1, reported when the player quits),
 * `evidence.friendship` (0..100).
 *
 * A payload with neither stars nor a score total is treated as a quit.
 *
 * Festival Showdown (the current game, src/games/showdown) sends a third shape: score { goals 0-40, onTime 0-20, resilience 0-20, smart 0-20, total },
 * stars { goals, onTime, resilient, cleanBooks }, evidence { C1..C7 }, minaretLit.
 */

/** the spec's scoring maxima per part */
const MAX = { needs: 25, plan: 25, shopping: 20, goal: 15, balance: 15 } as const
/**
 * The REAL game (src/games/festival) scores with different parts than the spec: { needs 0-40, gift 0-20, friends 0-20, plan 0-30, total },
 * and also sends `minaretLit` (its own clear rule: 3 or more stars or a total of 70+). Both shapes are understood.
 */
const REAL_MAX = { needs: 40, plan: 30, gift: 20 } as const
const REAL_FRIENDS_GOOD = 20
const REAL_FRIENDS_MIDDLING = 10
const SHOWDOWN_MAX = { goals: 40, onTime: 20, resilience: 20, smart: 20 } as const
const STAR_KEYS = ['ghar', 'gift', 'dost', 'plan'] as const
/** spec: 3 or more stars OR a planner score of 70 or more lights the pillar */
const CLEAR_STARS = 3
const CLEAR_TOTAL = 70
/** the friendship meter is not in the payload, only its effect: Balance is 15 at 60+, 8 at 40-59, 0 below 40 */
const FRIENDSHIP_FROM_BALANCE: ReadonlyArray<{ min: number; friendship: number }> = [
  { min: 15, friendship: 75 },
  { min: 8, friendship: 50 },
  { min: 0, friendship: 25 },
]
const FRIENDSHIP_DOST = 75
const FRIENDSHIP_NO_DOST = 40
const PARTIAL_CAP = 0.99

export const adaptFestival: GameAdapter = (payload): GameResult => {
  const p = asRecord('festival', payload)
  const stars = pickRecord(p, 'stars')
  const score = pickRecord(p, 'score')
  const evidence = pickRecord(p, 'evidence')

  const hasStars = Object.keys(stars).length > 0
  const hasTotal = hasNum(score.total)
  const finished = hasStars || hasTotal
  if (!finished) warn('festival', 'no stars or score in the payload; treating this as a quit')

  const showdown = hasNum(score.resilience)
  const starCount = showdown ? Object.values(stars).filter((v) => v === true).length : STAR_KEYS.filter((k) => stars[k] === true).length
  const total = clamp(num(score.total, 0), 0, 100)
  const realShape = hasNum(score.gift) || hasNum(score.friends)
  const cleared = finished && (typeof p.minaretLit === 'boolean' ? p.minaretLit : starCount >= CLEAR_STARS || total >= CLEAR_TOTAL)
  const quality = finished ? (hasTotal ? total / 100 : starCount / STAR_KEYS.length) : 0
  const partial = cleared ? 1 : finished ? Math.min(PARTIAL_CAP, quality) : Math.min(PARTIAL_CAP, clamp01(num(p.progress, 0)))

  let friendship: number | undefined = pickNum(evidence, ['friendship'])
  if (friendship === undefined && finished && !showdown && realShape) {
    const f = num(score.friends, 0)
    friendship = f >= REAL_FRIENDS_GOOD ? FRIENDSHIP_DOST : f >= REAL_FRIENDS_MIDDLING ? 50 : 25
  }
  if (friendship === undefined && finished && !showdown) {
    const bal = hasNum(score.balance) ? score.balance : undefined
    friendship = bal !== undefined ? FRIENDSHIP_FROM_BALANCE.find((r) => bal >= r.min)?.friendship : stars.dost === true ? FRIENDSHIP_DOST : FRIENDSHIP_NO_DOST
  }

  return {
    pillar: 'plan',
    cleared,
    quality: clamp01(quality),
    partial: clamp01(partial),
    skills: skills(
      showdown
        ? { prioritising: skill(score.goals, SHOWDOWN_MAX.goals), planning: skill(score.onTime, SHOWDOWN_MAX.onTime), riskSense: skill(score.resilience, SHOWDOWN_MAX.resilience), scamSense: skill(score.smart, SHOWDOWN_MAX.smart) }
        : realShape
        ? { prioritising: skill(score.needs, REAL_MAX.needs), planning: skill(score.plan, REAL_MAX.plan), saving: skill(score.gift, REAL_MAX.gift) }
        : { prioritising: skill(score.needs, MAX.needs), planning: skill(score.plan, MAX.plan), patience: skill(score.shopping, MAX.shopping), saving: skill(score.goal, MAX.goal) },
    ),
    lessonsSeen: strings(p.lessonsSeen),
    joySignals: {
      ...(friendship !== undefined ? { friendship } : {}),
      treatsBought: Math.max(0, num(evidence.ringTossPlays, evidence.ringToss === true ? 1 : 0)),
      ...(evidence.lentToSunny === true ? { lentToFriends: 1 } : {}),
      // Festival Showdown has no swaps; surviving the surprises with a buffer is its way of looking after your future self
      restedOrBalanced: showdown ? (stars.resilient === true ? 1 : 0) : Math.max(0, num(evidence.swaps, 0)),
    },
    raw: payload,
  }
}
