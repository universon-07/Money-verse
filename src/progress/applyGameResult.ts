import { SHIELD_PIECES, SKILLS, type Skill } from '../content/data'
import { applyHappyDelta } from '../happy/apply'
import { brightnessFor, isBrighter } from '../happy/brightness'
import { joyFromSignals } from '../happy/signals'
import type { GameResult } from '../host/types'
import { PROGRESS } from './config'
import { clamp01 } from './state'
import type { PillarProgress, ProgressState } from './types'

const unique = (a: string[], b: string[]) => [...new Set([...a, ...b])]

/** skills this play reported (any numeric value), added to those already touched, in canonical order */
const touched = (prev: Skill[], reported: GameResult['skills'] | undefined): Skill[] =>
  SKILLS.filter((k) => prev.includes(k) || typeof reported?.[k] === 'number')

/**
 * Fold one finished play into the progress state. Pure: returns a new state, never mutates.
 *
 * Rules:
 * - the game's joy signals move Happy FIRST, and the lamp brightness is read from that Happy value
 *   (burnout is separate: the host applies it once per session, after this);
 * - a clear lights the pillar; its brightness is the one at the best clear, and a replay can only improve it;
 * - a play that is not cleared never un-lights a lit pillar, and partial progress never reaches 1 unless cleared;
 * - quality and skills keep their best value; lessons are collected without duplicates; attempts always count.
 */
export function applyGameResult<T extends ProgressState>(state: T, result: GameResult): T {
  const prev = state.pillars[result.pillar]
  if (!prev) return state

  const happyState = applyHappyDelta(state, joyFromSignals(result.joySignals))
  const cleared = result.cleared === true
  const quality = clamp01(result.quality)
  const wasComplete = prev.status === 'complete' && prev.brightness !== null

  let next: PillarProgress
  if (cleared) {
    const now = brightnessFor(happyState.happy)
    next = {
      status: 'complete',
      brightness: isBrighter(now, prev.brightness) ? now : (prev.brightness ?? now),
      partial: 1,
      bestQuality: Math.max(prev.bestQuality, quality),
      attempts: prev.attempts + 1,
      lessonsSeen: unique(prev.lessonsSeen, result.lessonsSeen ?? []),
      skillsTouched: touched(prev.skillsTouched, result.skills),
    }
  } else {
    next = {
      status: wasComplete ? 'complete' : 'in_progress',
      brightness: wasComplete ? prev.brightness : null,
      partial: wasComplete ? 1 : Math.min(PROGRESS.partialCap, Math.max(prev.partial, clamp01(result.partial))),
      bestQuality: Math.max(prev.bestQuality, quality),
      attempts: prev.attempts + 1,
      lessonsSeen: unique(prev.lessonsSeen, result.lessonsSeen ?? []),
      skillsTouched: touched(prev.skillsTouched, result.skills),
    }
  }

  const skills = { ...state.skills }
  for (const k of SKILLS) {
    const v = result.skills?.[k]
    if (typeof v === 'number') skills[k] = Math.max(skills[k], clamp01(v))
  }

  const rewards = result.rewards
  const newPieces = rewards?.shieldPieces ?? []

  return {
    ...happyState,
    pillars: { ...state.pillars, [result.pillar]: next },
    skills,
    diamonds: state.diamonds + (Math.max(0, Math.floor(rewards?.diamonds ?? 0)) || 0),
    shieldPieces: SHIELD_PIECES.filter((p) => state.shieldPieces.includes(p) || newPieces.includes(p)),
    title: rewards?.title ?? state.title,
  }
}
