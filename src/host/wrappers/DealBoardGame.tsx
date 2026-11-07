import { useCallback, useRef } from 'react'
import DealBoard from '../../games/dealboard/ui/DealBoard'
import type { Score } from '../../games/dealboard/engine/scoring'
import type { GameProps } from '../types'

/**
 * Shell-side wrapper for Deal Board. The game reports its own Score when the report screen appears. The payload is built field by
 * field so net worth and profit (play money) never leave this file. Leaving before a report counts as a quit.
 */
export default function DealBoardGame({ seed, onComplete, onExit }: GameProps) {
  const sent = useRef(false)
  const done = useCallback((s: Score) => {
    if (sent.current) return
    sent.current = true
    onComplete({
      game: 'dealboard',
      mode: 'lite',
      judgement: s.total,
      skills: { research: s.research, skepticism: s.skepticism, spread: s.spread, calm: s.calm, habits: s.habits },
      counters: { trapsAvoided: s.counters.trapsAvoided, prematureSells: s.counters.prematureSells, fees: s.counters.feesPaid, concentrationPeak: s.counters.concentrationPeak },
    })
  }, [onComplete])
  const exit = useCallback(() => {
    if (!sent.current) { sent.current = true; onComplete({ game: 'dealboard', mode: 'lite', progress: 0 }) } else onExit?.()
  }, [onComplete, onExit])
  return <DealBoard seed={seed} onExit={exit} onComplete={done} />
}
