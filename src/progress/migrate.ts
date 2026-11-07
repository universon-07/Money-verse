import { PERSONAS, PILLAR_IDS, SKILLS, type PersonaId, type PillarId, type Skill } from '../content/data'
import { freshProgress, sanitizeProgress } from './state'
import type { PillarProgress, ProgressState } from './types'

/** the shape saved under 'money-mohalla-v1' before the progress model existed */
export interface LegacyState {
  language?: string
  persona?: PersonaId | null
  startAmount?: number
  goalAmount?: number
  savedAmount?: number
  completedPillars?: string[]
  storySeen?: boolean
  celebrated?: boolean
  liteMode?: boolean | null
  skills?: Partial<Record<Skill, number>>
}

/**
 * Turn an old saved state into the new progress data. Players keep their progress: every pillar they had completed is
 * lit at full brightness, so the goal bar shows the same amount as before. Pure.
 */
export function migrateLegacyState(old: LegacyState | null | undefined): ProgressState {
  const o = old ?? {}
  const persona = o.persona && PERSONAS[o.persona] ? o.persona : null
  const start = typeof o.startAmount === 'number' ? o.startAmount : persona ? PERSONAS[persona].start : 0
  const goal = typeof o.goalAmount === 'number' ? o.goalAmount : persona ? PERSONAS[persona].goal : 0
  const base = freshProgress(start, goal)
  const done = (Array.isArray(o.completedPillars) ? o.completedPillars : []).filter((id): id is PillarId => (PILLAR_IDS as string[]).includes(id))
  const pillars = { ...base.pillars }
  for (const id of done) {
    const lit: PillarProgress = { status: 'complete', brightness: 'bright', partial: 1, bestQuality: 1, attempts: 1, lessonsSeen: [], skillsTouched: [] }
    pillars[id] = lit
  }
  const skills = { ...base.skills }
  for (const k of SKILLS) if (typeof o.skills?.[k] === 'number') skills[k] = o.skills[k] as number
  return sanitizeProgress({ ...base, pillars, skills })
}
