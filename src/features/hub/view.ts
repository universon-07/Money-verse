import type { PillarId } from '../../content/data'
import { buildProgressView } from '../progress/view'
import type { ProgressState } from '../../progress/types'
import { HUB_CONFIG } from './config'
import type { Brightness } from '../../progress/config'

export interface HubPillarView {
  id: PillarId
  nameKey: string
  taglineKey: string
  teachesKey: string
  estimatedMinutes: number
  /** State from progress view (e.g. bright, dim, flicker, partial, notStarted) */
  state: Brightness | 'partial' | 'notStarted'
  bestQuality: number
  attempts: number
  ctaKey: string
  canReplay: boolean
}

export interface HubView {
  pillars: HubPillarView[]
}

export function buildHubView(state: ProgressState): HubView {
  const pView = buildProgressView(state)
  const pillars: HubPillarView[] = HUB_CONFIG.order.map((id) => {
    const config = HUB_CONFIG.pillars[id]
    const pState = state.pillars[id]
    const pViewPillar = pView.pillars.find(p => p.id === id)!
    
    let ctaKey = 'hub.cta.start'
    let canReplay = false
    if (pState.status === 'in_progress') {
      ctaKey = 'hub.cta.continue'
    } else if (pState.status === 'complete') {
      canReplay = true
      ctaKey = pState.brightness === 'bright' ? 'hub.cta.replay' : 'hub.cta.brighten'
    }

    return {
      id,
      nameKey: `pillars.${id}.name`,
      taglineKey: config.taglineKey,
      teachesKey: config.teachesKey,
      estimatedMinutes: config.estimatedMinutes,
      state: pViewPillar.state,
      bestQuality: pState.bestQuality,
      attempts: pState.attempts,
      ctaKey,
      canReplay
    }
  })

  return { pillars }
}
