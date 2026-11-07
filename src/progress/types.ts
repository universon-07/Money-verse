import type { PillarId, ShieldPiece, Skill } from '../content/data'
import type { Brightness } from './config'

/**
 * 'locked' here only means "not started yet". Every pillar is always playable (all four doorways stay open),
 * so never use this status to block the player.
 */
export type PillarStatus = 'locked' | 'in_progress' | 'complete'

export interface PillarProgress {
  status: PillarStatus
  /** lamp state at the time of the pillar's BEST clear; null until cleared */
  brightness: Brightness | null
  /** 0..1 progress toward clearing. Never 1 unless the pillar is complete */
  partial: number
  /** best quality seen over all plays, 0..1 */
  bestQuality: number
  attempts: number
  lessonsSeen: string[]
  /** skills this pillar's plays have reported, in canonical skill order */
  skillsTouched: Skill[]
}

/** The pure, serialisable progress data. Every function in src/progress and src/happy works on (a superset of) this. */
export interface ProgressState {
  startAmount: number
  goalAmount: number
  /** Happy Index, clamped to HAPPY.min..HAPPY.max */
  happy: number
  pillars: Record<PillarId, PillarProgress>
  /** best value seen per skill, 0..1 */
  skills: Record<Skill, number>
  diamonds: number
  shieldPieces: ShieldPiece[]
  title: string | null
  /** how many times each life moment has been used (drives diminishing returns) */
  lifeMomentsUsed: Record<string, number>
  /** total spent on life moments; subtracted from the saved amount */
  lifeMomentSpend: number
  /** game sessions finished since the last life moment (drives the "time for a break" note) */
  sessionsSinceBreak: number
}
