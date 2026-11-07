import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { irisClose } from '../../ui/iris'
import { useGame } from '../../store/game'
import { buildHubView } from './view'
import type { PillarId } from '../../content/data'

export function useHub() {
  const state = useGame()
  const view = useMemo(() => buildHubView(state), [state])
  const navigate = useNavigate()

  const enterPillar = (id: PillarId) => {
    irisClose(document.querySelector(`[data-place="${id}"]`) ?? null, () => navigate(`/play/${id}`))
  }

  const openMoments = () => {
    // We assume the MomentsSheet can be opened via a local state in the UI
    // or by triggering an event/hash change. The wireframe says "openMoments()", 
    // we'll leave it returning a boolean/setter or let the UI handle the actual modal state.
    // For now we just return a no-op that the UI can replace or use.
    // The requirement says: "a 'Look after yourself' button that opens the MomentsSheet from Prompt A".
    // We can handle opening by returning a state hook tuple or similar.
    // Actually, `useHub` doesn't need to hold the open state, the UI can.
  }

  return {
    ...view,
    enterPillar,
    openMoments
  }
}

export function usePillarIntro(id: PillarId) {
  const state = useGame()
  const view = useMemo(() => buildHubView(state), [state])
  const pillar = view.pillars.find(p => p.id === id)!
  
  return {
    teachesKey: pillar.teachesKey,
    estimatedMinutes: pillar.estimatedMinutes,
    state: pillar.state,
    bestQuality: pillar.bestQuality,
    primaryCtaKey: pillar.ctaKey,
    secondaryCtaKey: pillar.canReplay ? 'hub.cta.back' : undefined
  }
}
