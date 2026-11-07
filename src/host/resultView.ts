import { PILLAR_IDS, SKILLS, type PillarId, type Skill } from '../content/data'
import type { Brightness } from '../progress/config'
import type { PillarStatus, ProgressState } from '../progress/types'
import { PILLAR_ORDER } from './config'
import type { PlayOutcome } from './flow'

/** everything the Result screen shows, computed here so the component holds no maths */
export interface ResultView {
  pillar: PillarId
  cleared: boolean
  /** the pillar's state after this play */
  state: { status: PillarStatus; brightness: Brightness | null; partialPercent: number }
  /** the state changed because of this play (newly cleared, or a better state on a replay) */
  improved: boolean
  qualityPercent: number
  skills: { skill: Skill; percent: number }[]
  lessons: string[]
  saved: { before: number; after: number; delta: number }
  happy: { before: number; after: number; delta: number }
}

const pct = (n: number) => Math.round(n * 100)
const delta = (before: number, after: number) => Math.round((after - before) * 100) / 100

const RANK: Record<string, number> = { notStarted: 0, partial: 1, flicker: 2, dim: 3, bright: 4 }
const rankOf = (status: PillarStatus, brightness: Brightness | null, partial: number) =>
  status === 'complete' && brightness ? RANK[brightness] : partial > 0 ? RANK.partial : RANK.notStarted

export function buildResultView(outcome: PlayOutcome): ResultView {
  const { result, before, after } = outcome
  const skillList = SKILLS.filter((s) => typeof result.skills[s] === 'number').map((s) => ({ skill: s, percent: pct(result.skills[s] as number) }))
  return {
    pillar: result.pillar,
    cleared: result.cleared,
    state: { status: after.status, brightness: after.brightness, partialPercent: pct(after.partial) },
    improved: rankOf(after.status, after.brightness, after.partial) > rankOf(before.status, before.brightness, before.partial),
    qualityPercent: pct(result.quality),
    skills: skillList,
    lessons: result.lessonsSeen,
    saved: { before: before.saved, after: after.saved, delta: after.saved - before.saved },
    happy: { before: before.happy, after: after.happy, delta: delta(before.happy, after.happy) },
  }
}

/** the next pillar the player has not completed yet, after `current`, in PILLAR_ORDER; null when all four are done */
export function nextPillarAfter(state: Pick<ProgressState, 'pillars'>, current: PillarId): PillarId | null {
  const order = PILLAR_ORDER.filter((id) => PILLAR_IDS.includes(id))
  const start = order.indexOf(current)
  for (let i = 1; i <= order.length; i++) {
    const id = order[(start + i) % order.length]
    if (id !== current && state.pillars[id].status !== 'complete') return id
  }
  return null
}
