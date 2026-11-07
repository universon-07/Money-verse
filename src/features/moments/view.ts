import { LIFE_MOMENTS, canAffordLifeMoment, lifeMomentGain } from '../../happy/moments'
import type { ProgressState } from '../../progress/types'

/** View-model for the life-moments list: what each one costs and gives right now. Pure. */

export interface MomentView {
  id: string
  nameKey: string
  descriptionKey: string
  /** rupees taken from the goal meter (0 = free) */
  cost: number
  /** Happy it would give if chosen right now (it fades with repeats) */
  gainNow: number
  /** the gain has faded to nothing */
  faded: boolean
  affordable: boolean
  timesUsed: number
}

/** every life moment, or just one when `onlyId` is given (so another screen can offer a single moment) */
export function buildMomentsView(state: ProgressState, onlyId?: string): MomentView[] {
  return LIFE_MOMENTS.filter((m) => !onlyId || m.id === onlyId).map((m) => {
    const gainNow = lifeMomentGain(state, m.id)
    return {
      id: m.id,
      nameKey: `moments.${m.id}.name`,
      descriptionKey: `moments.${m.id}.description`,
      cost: m.cost,
      gainNow,
      faded: gainNow <= 0,
      affordable: canAffordLifeMoment(state, m.id),
      timesUsed: state.lifeMomentsUsed[m.id] ?? 0,
    }
  })
}
