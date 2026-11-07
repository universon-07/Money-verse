import type { SessionOutcome } from './session'
import type { ProgressState } from '../progress/types'
import type { GameResult } from './types'

/** what the host remembers about one finished play */
export interface PlayOutcome extends Pick<SessionOutcome<ProgressState>, 'before' | 'after'> {
  result: GameResult
}

export type Phase = 'entry' | 'playing' | 'result' | 'error'

export interface FlowState {
  phase: Phase
  /** id of the play in progress (changes on every start and replay) */
  sessionId: string | null
  /** developer "new seed" counter; 0 in normal play so a replay reuses the same seed */
  salt: number
  outcome: PlayOutcome | null
  /** set when a finished payload could not be processed */
  error: string | null
}

export type FlowAction =
  | { type: 'start'; sessionId: string }
  | { type: 'complete'; sessionId: string; outcome: PlayOutcome }
  | { type: 'fail'; sessionId: string; message: string }
  | { type: 'replay'; sessionId: string }
  | { type: 'newSeed' }
  | { type: 'reset' }

export const initialFlow: FlowState = { phase: 'entry', sessionId: null, salt: 0, outcome: null, error: null }

/**
 * The host screen as a tiny state machine: entry -> playing -> result (replay goes back to playing).
 * A completion for a session that is not the current one, or when nothing is playing, is ignored.
 */
export function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case 'start':
    case 'replay':
      return state.phase === 'playing' ? state : { ...state, phase: 'playing', sessionId: action.sessionId, outcome: null, error: null }
    case 'complete':
      return state.phase === 'playing' && state.sessionId === action.sessionId ? { ...state, phase: 'result', outcome: action.outcome } : state
    case 'fail':
      return state.phase === 'playing' && state.sessionId === action.sessionId ? { ...state, phase: 'error', error: action.message } : state
    case 'newSeed':
      return { ...state, salt: state.salt + 1 }
    case 'reset':
      return { ...initialFlow, salt: state.salt }
    default:
      return state
  }
}
