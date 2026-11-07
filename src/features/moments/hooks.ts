import { useMemo } from 'react'
import { useGame } from '../../store/game'
import { buildMomentsView } from './view'

/** the life moments list and the action to choose one (spends from the goal meter, raises Happy) */
export function useMoments(onlyId?: string) {
  const state = useGame()
  const choose = useGame((s) => s.applyLifeMoment)
  const moments = useMemo(() => buildMomentsView(state, onlyId), [state, onlyId])
  return { moments, choose }
}
