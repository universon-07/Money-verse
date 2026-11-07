import { useCallback, useEffect, useRef } from 'react'
import PayRun from '../../games/payrun/PayRun'
import { ECON } from '../../games/payrun/engine/content'
import { usePayRun, useSeason } from '../../games/payrun/state/store'
import type { GameProps } from '../types'

/**
 * Shell-side wrapper for Pay Run. The game reports no payload: it only calls onGoalReached() when the jar reaches the goal, and has
 * no seed or language prop. This wrapper builds the payload from the game's own store (read only) and reports once:
 * on the goal, or when the player leaves through the game's own exit button before it (a quit).
 */
export default function PayRunGame({ classCode, onComplete, onExit }: GameProps) {
  const { state } = useSeason()
  const goalChosen = usePayRun((s) => s.goal)
  const sent = useRef(false)
  const latest = useRef({ jar: state.jar, week: state.week, goalChosen })
  useEffect(() => { latest.current = { jar: state.jar, week: state.week, goalChosen } }, [state.jar, state.week, goalChosen])

  const report = useCallback((goalReached: boolean) => {
    if (sent.current) return
    sent.current = true
    const { jar, week } = latest.current
    onComplete({ game: 'payrun', goalReached, jar, goal: ECON.goal, shifts: week })
  }, [onComplete])

  const handleExit = useCallback(() => (sent.current ? onExit?.() : report(false)), [onExit, report])
  return <PayRun cohortCode={classCode ?? undefined} onGoalReached={() => report(true)} onExit={handleExit} />
}
