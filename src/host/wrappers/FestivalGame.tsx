import { useCallback, useRef } from 'react'
import ShowdownGame from '../../games/showdown/ShowdownGame'
import { saveResult, type GameResult } from '../../lib/gameResult'
import type { GameProps } from '../types'

/**
 * Shell-side wrapper for Festival Showdown (the Plan & Budget game). The game keeps its own run on the device and resumes it, so no seed
 * is passed. It reports its GameResult once when the report appears (and stores it for the NGO view); leaving earlier counts as a quit.
 * src/host/adapters/festival.ts reads the payload.
 */
export default function FestivalGame({ classCode, onComplete, onExit }: GameProps) {
  const sent = useRef(false)
  const done = useCallback((r: GameResult) => {
    if (sent.current) return
    sent.current = true
    saveResult(r)
    onComplete(r)
  }, [onComplete])
  const exit = useCallback(() => {
    if (sent.current) return onExit?.()
    sent.current = true
    onComplete({ game: 'festival', progress: 0 })
  }, [onComplete, onExit])
  return <ShowdownGame cohortCode={classCode ?? ''} onComplete={done} onExit={exit} embedded />
}
