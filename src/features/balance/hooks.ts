import { useMemo } from 'react'
import { useGame } from '../../store/game'
import { balanceFor } from './view'

export function useBalance() {
  const state = useGame()
  return useMemo(() => balanceFor(state), [state])
}
