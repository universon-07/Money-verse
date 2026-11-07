import { SKILLS, type PillarId, type Skill } from '../../content/data'
import type { ProgressState } from '../../progress/types'
import { balanceFor, type BalanceView } from '../balance/view'
import { buildProgressView, type PillarVisualState } from '../progress/view'

export interface SummaryView {
  /** all four pillars complete */
  complete: boolean
  goal: { saved: number; target: number; percent: number }
  pillars: { id: PillarId; nameKey: string; state: PillarVisualState; stateLabelKey: string }[]
  /** skills the player has practised (score above zero), in canonical order */
  skills: { id: Skill; labelKey: string; level: number }[]
  lessonsSeen: string[]
  balance: BalanceView
  /** pillars cleared but not bright: the ones worth replaying */
  toBrighten: PillarId[]
  /** locale key for the closing line */
  closingKey: 'summary.closing.allBright' | 'summary.closing.someDim' | 'summary.closing.keepGoing'
}

export function buildSummaryView(state: ProgressState): SummaryView {
  const pv = buildProgressView(state)
  const toBrighten = pv.pillars.filter((p) => p.state === 'dim' || p.state === 'flicker').map((p) => p.id)
  const complete = pv.counts.lit >= pv.counts.total
  const lessons = new Set<string>()
  pv.pillars.forEach((p) => p.lessonsSeen.forEach((l) => lessons.add(l)))
  return {
    complete,
    goal: pv.goal,
    pillars: pv.pillars.map((p) => ({ id: p.id, nameKey: p.nameKey, state: p.state, stateLabelKey: p.stateLabelKey })),
    skills: SKILLS.filter((s) => (state.skills[s] ?? 0) > 0).map((s) => ({ id: s, labelKey: `skills.${s}`, level: state.skills[s] })),
    lessonsSeen: [...lessons],
    balance: balanceFor(state),
    toBrighten,
    closingKey: !complete ? 'summary.closing.keepGoing' : toBrighten.length ? 'summary.closing.someDim' : 'summary.closing.allBright',
  }
}
