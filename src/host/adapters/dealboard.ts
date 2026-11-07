import type { GameAdapter, GameResult } from '../types'
import { asRecord, clamp, clamp01, num, pickNum, pickRecord, skill, skills, strings, warn } from './util'

/**
 * Deal Board, lite mode (pillar: invest). The spec says onComplete receives "the skill scores and counters".
 * Assumed shape (aliases accepted):
 *   { game:'dealboard', cohortCode, seed, mode:'lite',
 *     judgement,                                                 // 0..100, the headline score
 *     skills:{ research, skepticism, spread, calm, habits },     // each 0..20
 *     counters?:{ tabsOpened, trapsAvoided, prematureSells, fees, concentrationPeak },
 *     quartersPlayed?, lessonsSeen }
 * Optional extra: `progress` (0..1) when the player quits.
 *
 * GUARDRAIL: net worth, profit and any play-money amount are deliberately NEVER read here. The game grades judgement,
 * not profit, and play money must never reach the Happy Index or the goal meter.
 */

const SKILL_MAX = 20
const JUDGEMENT_MAX = 100
const CLEAR_JUDGEMENT = 60
const QUARTERS = 12
const PARTIAL_CAP = 0.99

export const adaptDealBoard: GameAdapter = (payload): GameResult => {
  const p = asRecord('dealboard', payload)
  const sk = pickRecord(p, 'skills', 'skillScores')

  const research = pickNum(sk, ['research'])
  const skepticism = pickNum(sk, ['skepticism'])
  const spread = pickNum(sk, ['spread'])
  const calm = pickNum(sk, ['calm', 'calmAndPatience'])
  const habits = pickNum(sk, ['habits', 'moneyHabits'])
  const parts = [research, skepticism, spread, calm, habits]
  const haveSkills = parts.some((v) => v !== undefined)

  const reported = pickNum(p, ['judgement', 'judgementScore', 'score'])
  const summed = parts.reduce<number>((s, v) => s + clamp(v ?? 0, 0, SKILL_MAX), 0)
  const judgement = clamp(reported ?? (haveSkills ? summed : 0), 0, JUDGEMENT_MAX)
  const finished = reported !== undefined || haveSkills
  if (!finished) warn('dealboard', 'no judgement score or skills in the payload; treating this as a quit')

  const cleared = finished && judgement >= CLEAR_JUDGEMENT
  const quarters = pickNum(p, ['quartersPlayed', 'turnsPlayed', 'quarters', 'turns'])
  let partial: number
  if (cleared) partial = 1
  else if (finished) partial = Math.min(PARTIAL_CAP, quarters !== undefined ? clamp01(quarters / QUARTERS) : clamp01(judgement / JUDGEMENT_MAX))
  else partial = Math.min(PARTIAL_CAP, clamp01(num(p.progress, quarters !== undefined ? quarters / QUARTERS : 0)))

  return {
    pillar: 'invest',
    cleared,
    quality: clamp01(judgement / JUDGEMENT_MAX),
    partial: clamp01(partial),
    skills: skills({
      planning: skill(research, SKILL_MAX),
      scamSense: skill(skepticism, SKILL_MAX),
      riskSense: skill(spread, SKILL_MAX),
      patience: skill(calm, SKILL_MAX),
      saving: skill(habits, SKILL_MAX),
    }),
    lessonsSeen: strings(p.lessonsSeen),
    // how you invested, never how much you made: a calm hand and a spread-out portfolio are the balanced habits
    joySignals: finished ? { restedOrBalanced: (calm !== undefined && calm >= SKILL_MAX * 0.6 ? 1 : 0) + (spread !== undefined && spread >= SKILL_MAX * 0.6 ? 1 : 0) } : {},
    raw: payload,
  }
}
