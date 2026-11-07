import { useMemo } from 'react'
import { useGame } from '../../store/game'
import { buildProgressView } from './view'

/** the progress view-model, kept up to date as the store changes */
export function useProgressView() {
  const state = useGame()
  return useMemo(() => buildProgressView(state), [state])
}
