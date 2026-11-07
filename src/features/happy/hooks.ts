import { useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useGame } from '../../store/game'
import { buildHappyView, isToastSuppressed, shouldShowHappyToast } from './view'

/** the Happy Index view-model */
export function useHappyView() {
  const happy = useGame((s) => s.happy)
  const sessionsSinceBreak = useGame((s) => s.sessionsSinceBreak)
  return buildHappyView({ happy, sessionsSinceBreak })
}

/** the one-time low-Happy tip: whether to show it on this page, and how to dismiss it */
export function useHappyToast() {
  const { pathname } = useLocation()
  const show = useGame((s) => shouldShowHappyToast(s))
  const mark = useGame((s) => s.markHappyToastSeen)
  const dismiss = useCallback(() => mark(), [mark])
  return { visible: show && !isToastSuppressed(pathname), dismiss }
}
