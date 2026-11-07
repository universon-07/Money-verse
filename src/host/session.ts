import type { PillarId } from '../content/data'
import { applyBurnout } from '../happy/apply'
import { applyGameResult } from '../progress/applyGameResult'
import type { Brightness } from '../progress/config'
import { savedAmountFor } from '../progress/saved'
import type { PillarStatus, ProgressState } from '../progress/types'
import type { GameResult } from './types'

/** what the player can see about one pillar, before or after a play */
export interface Snapshot {
  saved: number
  happy: number
  brightness: Brightness | null
  status: PillarStatus
  partial: number
  attempts: number
}

export function snapshot(state: ProgressState, pillar: PillarId): Snapshot {
  const p = state.pillars[pillar]
  return { saved: savedAmountFor(state), happy: state.happy, brightness: p.brightness, status: p.status, partial: p.partial, attempts: p.attempts }
}

export interface SessionOutcome<T extends ProgressState> {
  next: T
  before: Snapshot
  after: Snapshot
}

/**
 * End of one game session, as one pure step: fold the result in (the lamp state reads Happy as it is NOW, plus the game's
 * own joy signals), THEN apply the end-of-session burnout, exactly once. Quitting (cleared=false) still counts as a session.
 * The `after` snapshot therefore includes the burnout, while the pillar's brightness was decided before it.
 */
export function finishSession<T extends ProgressState>(state: T, result: GameResult): SessionOutcome<T> {
  const before = snapshot(state, result.pillar)
  const next = applyBurnout(applyGameResult(state, result))
  return { next, before, after: snapshot(next, result.pillar) }
}

/**
 * Makes sure one session is processed once, however many times a game calls onComplete.
 * Keep one guard per mounted host; it forgets nothing for the life of the page.
 */
export class SessionGuard {
  private done = new Set<string>()

  /** runs `fn` the first time it sees this session id and returns its value; later calls return undefined */
  once<R>(sessionId: string, fn: () => R): R | undefined {
    if (this.done.has(sessionId)) return undefined
    this.done.add(sessionId)
    return fn()
  }

  has(sessionId: string): boolean {
    return this.done.has(sessionId)
  }
}
