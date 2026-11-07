import { PILLAR_IDS, type PillarId, type Skill } from '../../content/data'
import { brightnessPenalty, savedAmountFor } from '../../progress/saved'
import type { PillarStatus, ProgressState } from '../../progress/types'

/**
 * View-model for "how am I doing overall". Pure: every number and label key a progress screen needs, computed from the
 * state, so any UI can draw it however it likes. No maths lives in the component.
 */

/** what a pillar looks like right now; the UI decides how to draw each */
export type PillarVisualState = 'notStarted' | 'partial' | 'bright' | 'dim' | 'flicker'
/** a neutral icon name per state (the UI maps it to a shape; a state always gets an icon AND a text label) */
export type StateIcon = 'empty' | 'half' | 'full' | 'dim' | 'faint'

export interface PillarView {
  id: PillarId
  nameKey: string
  status: PillarStatus
  state: PillarVisualState
  /** locale key for the state's text label (state.*) */
  stateLabelKey: string
  icon: StateIcon
  /** 0..1; exactly 1 only when the pillar is complete */
  partial: number
  partialPercent: number
  bestQuality: number
  qualityPercent: number
  attempts: number
  lessonsSeen: string[]
  skillsTouched: Skill[]
  /** the action's label key: start, continue, replay (full) or brighten (dim or faint) */
  actionKey: 'start' | 'continue' | 'replay' | 'brighten'
}

export interface ProgressView {
  goal: { saved: number; target: number; percent: number }
  pillars: PillarView[]
  counts: { total: number; lit: number; bright: number; dim: number; flicker: number }
  /** locale key plus params for a one-line summary such as "2 of 4 complete, 1 dim" */
  summary: { key: string; params: { lit: number; total: number; dim: number; flicker: number } }
  /** what the Happy Index is holding back: cleared pillars not at full brightness */
  happyPenalty: { active: boolean; lostAmount: number; pillarCount: number }
}

const ICON: Record<PillarVisualState, StateIcon> = { notStarted: 'empty', partial: 'half', bright: 'full', dim: 'dim', flicker: 'faint' }
const pct = (n: number) => Math.round(n * 100)

export function pillarVisualState(p: ProgressState['pillars'][PillarId]): PillarVisualState {
  if (p.status === 'complete' && p.brightness) return p.brightness
  return p.status === 'in_progress' ? 'partial' : 'notStarted'
}

function summaryFor(counts: ProgressView['counts']): ProgressView['summary'] {
  const { total, lit, bright, dim, flicker } = counts
  const params = { lit, total, dim, flicker }
  if (lit === 0) return { key: 'progress.summary.none', params }
  if (lit === total && bright === total) return { key: 'progress.summary.allBright', params }
  if (dim > 0 && flicker > 0) return { key: 'progress.summary.litDimFaint', params }
  if (dim > 0) return { key: 'progress.summary.litDim', params }
  if (flicker > 0) return { key: 'progress.summary.litFaint', params }
  return { key: 'progress.summary.lit', params }
}

export function buildProgressView(state: ProgressState): ProgressView {
  const pillars: PillarView[] = PILLAR_IDS.map((id) => {
    const p = state.pillars[id]
    const visual = pillarVisualState(p)
    const actionKey = visual === 'bright' ? 'replay' : visual === 'dim' || visual === 'flicker' ? 'brighten' : p.attempts > 0 ? 'continue' : 'start'
    return {
      id,
      nameKey: `pillars.${id}.name`,
      status: p.status,
      state: visual,
      stateLabelKey: `state.${visual}`,
      icon: ICON[visual],
      partial: p.partial,
      partialPercent: pct(p.partial),
      bestQuality: p.bestQuality,
      qualityPercent: pct(p.bestQuality),
      attempts: p.attempts,
      lessonsSeen: p.lessonsSeen,
      skillsTouched: p.skillsTouched,
      actionKey,
    }
  })
  const counts = {
    total: pillars.length,
    lit: pillars.filter((p) => p.status === 'complete').length,
    bright: pillars.filter((p) => p.state === 'bright').length,
    dim: pillars.filter((p) => p.state === 'dim').length,
    flicker: pillars.filter((p) => p.state === 'flicker').length,
  }
  const saved = savedAmountFor(state)
  const lostAmount = brightnessPenalty(state)
  return {
    goal: { saved, target: state.goalAmount, percent: state.goalAmount > 0 ? Math.min(100, Math.max(0, pct(saved / state.goalAmount))) : 0 },
    pillars,
    counts,
    summary: summaryFor(counts),
    happyPenalty: { active: lostAmount > 0, lostAmount, pillarCount: counts.dim + counts.flicker },
  }
}
