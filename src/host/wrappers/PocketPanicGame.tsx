import { useCallback, useRef } from 'react'
import PocketPanic from '../../games/cafe/PocketPanic'
import type { GameResult } from '../../lib/gameResult'
import type { GameProps } from '../types'

/**
 * Shell-side wrapper for Pocket Panic (the Save & Manage game; it replaced Pay Run). The game saves its own month on the device and resumes
 * it, so no seed is passed. It reports its GameResult once when the Tally appears; leaving before that counts as a quit.
 */
export default function PocketPanicGame({ classCode, onComplete, onExit }: GameProps) {
  const sent = useRef(false)
  const done = useCallback((r: GameResult) => {
    if (sent.current) return
    sent.current = true
    onComplete(r)
  }, [onComplete])
  const exit = useCallback(() => {
    if (sent.current) return onExit?.()
    sent.current = true
    onComplete({ game: 'cafe', progress: 0 })
  }, [onComplete, onExit])
  return <PocketPanic cohortCode={classCode ?? ''} onComplete={done} onExit={exit} />
}
