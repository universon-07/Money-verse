import type { GameAdapter, GameResult } from '../types'
import { asRecord, clamp01, hasNum, num, pickNum, shieldPieces, skills, strings, warn } from './util'

/**
 * Case Files: Mohalla Detective (pillar: safe). This module uses the hub contract (spec section 4.4). Outputs:
 *   { status:'locked'|'in_progress'|'complete', shieldPieces:['protect'|'verify'|'pause'...],
 *     diamonds, title, playbookReady }
 * Optional extras the adapter understands if the game provides them:
 *   `stage` ('tutorial'|'case1'|'case2'|'case3'|'mystery'|'master') for partial progress,
 *   `firstTryAccuracy` (0..1) for quality, `lessonsSeen`, `progress` (0..1) when the player quits.
 */

/** order of the journey, used to turn a stage into partial progress */
const STAGES = ['tutorial', 'case1', 'case2', 'case3', 'mystery', 'master'] as const
const SHIELD_TOTAL = 3
/** with no stage reported, shield pieces earned out of (3 + the master board) approximate how far along the player is */
const SHIELD_PROGRESS_STEPS = 4
const PARTIAL_CAP = 0.99

export const adaptCaseFiles: GameAdapter = (payload): GameResult => {
  const p = asRecord('casefiles', payload)
  const status = p.status === 'complete' || p.status === 'in_progress' || p.status === 'locked' ? p.status : undefined
  if (status === undefined) warn('casefiles', 'missing or invalid status; treating the game as not cleared')

  const pieces = shieldPieces(p.shieldPieces)
  const cleared = status === 'complete'

  const stageIndex = typeof p.stage === 'string' ? (STAGES as readonly string[]).indexOf(p.stage) : -1
  let partial: number
  if (cleared) partial = 1
  else if (stageIndex >= 0) partial = Math.min(PARTIAL_CAP, (stageIndex + 1) / STAGES.length)
  else if (hasNum(p.progress)) partial = Math.min(PARTIAL_CAP, clamp01(p.progress))
  else partial = Math.min(PARTIAL_CAP, pieces.length / SHIELD_PROGRESS_STEPS)

  const accuracy = pickNum(p, ['firstTryAccuracy', 'accuracy'])
  const quality = clamp01(accuracy ?? pieces.length / SHIELD_TOTAL)

  const diamonds = Math.max(0, Math.floor(num(p.diamonds, 0)))
  const title = typeof p.title === 'string' && p.title.trim() ? p.title : undefined

  return {
    pillar: 'safe',
    cleared,
    quality,
    partial: clamp01(partial),
    skills: skills({ scamSense: quality }),
    lessonsSeen: strings(p.lessonsSeen),
    joySignals: {},
    rewards: { diamonds, shieldPieces: pieces, ...(title ? { title } : {}) },
    raw: payload,
  }
}
