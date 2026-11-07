import { PILLAR_IDS, SHIELD_PIECES, SKILLS, type PillarId, type Skill } from '../content/data'
import { HAPPY } from '../happy/config'
import { PROGRESS } from './config'
import type { PillarProgress, ProgressState } from './types'

export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
export const clamp01 = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) ? clamp(n, 0, 1) : 0)
const num = (n: unknown, fallback: number) => (typeof n === 'number' && Number.isFinite(n) ? n : fallback)

export const freshPillar = (): PillarProgress => ({ status: 'locked', brightness: null, partial: 0, bestQuality: 0, attempts: 0, lessonsSeen: [], skillsTouched: [] })

export const zeroSkills = (): Record<Skill, number> => Object.fromEntries(SKILLS.map((s) => [s, 0])) as Record<Skill, number>

/** a brand-new player's progress for a given start/goal */
export function freshProgress(startAmount = 0, goalAmount = 0): ProgressState {
  return {
    startAmount,
    goalAmount,
    happy: HAPPY.start,
    pillars: Object.fromEntries(PILLAR_IDS.map((id) => [id, freshPillar()])) as Record<PillarId, PillarProgress>,
    skills: zeroSkills(),
    diamonds: 0,
    shieldPieces: [],
    title: null,
    lifeMomentsUsed: {},
    lifeMomentSpend: 0,
    sessionsSinceBreak: 0,
  }
}

/** pillars that are complete, in the canonical pillar order (this replaces the old stored list) */
export const completedPillarsOf = (s: Pick<ProgressState, 'pillars'>): PillarId[] => PILLAR_IDS.filter((id) => s.pillars?.[id]?.status === 'complete')

/**
 * Repair untrusted/old data into a valid ProgressState: fills missing pillars and skills, clamps numbers,
 * and removes invalid values. Used when loading saved state, so a bad or partial save never crashes the app.
 */
export function sanitizeProgress(raw: Partial<ProgressState>): ProgressState {
  const base = freshProgress(num(raw.startAmount, 0), num(raw.goalAmount, 0))
  const pillars = { ...base.pillars }
  for (const id of PILLAR_IDS) {
    const p = raw.pillars?.[id]
    if (!p) continue
    const status = p.status === 'complete' || p.status === 'in_progress' ? p.status : 'locked'
    const brightness = p.brightness === 'bright' || p.brightness === 'dim' || p.brightness === 'flicker' ? p.brightness : null
    const complete = status === 'complete' && brightness !== null
    pillars[id] = {
      status: complete ? 'complete' : status === 'complete' ? 'in_progress' : status,
      brightness: complete ? brightness : null,
      partial: complete ? 1 : Math.min(PROGRESS.partialCap, clamp01(p.partial)),
      bestQuality: clamp01(p.bestQuality),
      attempts: Math.max(0, Math.floor(num(p.attempts, 0))),
      lessonsSeen: Array.isArray(p.lessonsSeen) ? p.lessonsSeen.filter((x) => typeof x === 'string') : [],
      skillsTouched: SKILLS.filter((k) => Array.isArray(p.skillsTouched) && p.skillsTouched.includes(k)),
    }
  }
  const skills = zeroSkills()
  for (const k of SKILLS) skills[k] = clamp01(raw.skills?.[k])
  const used: Record<string, number> = {}
  for (const [k, v] of Object.entries(raw.lifeMomentsUsed ?? {})) if (typeof v === 'number' && v > 0) used[k] = Math.floor(v)
  return {
    startAmount: base.startAmount,
    goalAmount: base.goalAmount,
    happy: clamp(num(raw.happy, HAPPY.start), HAPPY.min, HAPPY.max),
    pillars,
    skills,
    diamonds: Math.max(0, Math.floor(num(raw.diamonds, 0))),
    shieldPieces: SHIELD_PIECES.filter((p) => Array.isArray(raw.shieldPieces) && raw.shieldPieces.includes(p)),
    title: typeof raw.title === 'string' ? raw.title : null,
    lifeMomentsUsed: used,
    lifeMomentSpend: Math.max(0, num(raw.lifeMomentSpend, 0)),
    sessionsSinceBreak: Math.max(0, Math.floor(num(raw.sessionsSinceBreak, 0))),
  }
}
