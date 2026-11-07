import { PILLAR_IDS, SKILLS, type PillarId, type Skill } from '../content/data'
import { K_MIN, type CohortView } from './analytics'
import { LESSONS, MISTAKES, SKILL_NAME, SKILL_PLACE } from './lessons'
import type { StudentSummary } from './summary'

/**
 * What a facilitator acts on: how well each student understands the ideas, who needs help and why, where the class should
 * focus next, and how understanding moves week by week. Everything here is computed from the anonymous summaries.
 */

const DAY = 86400000
const WEEK = 7 * DAY

/** a student's understanding: the average of the skills they have had a chance to show (null before they play) */
export function understanding(s: StudentSummary): number | null {
  const vals = SKILLS.filter((k) => s.places[SKILL_PLACE[k]].a > 0).map((k) => s.skills[k])
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
}

export const clearedCount = (s: StudentSummary) => PILLAR_IDS.filter((p) => s.places[p].s === 'c').length
export const startedCount = (s: StudentSummary) => PILLAR_IDS.filter((p) => s.places[p].s !== 'n' || s.places[p].a > 0).length

export type Level = 'building' | 'getting' | 'strong'
export const levelOf = (v: number): Level => (v < 0.4 ? 'building' : v < 0.7 ? 'getting' : 'strong')
export const LEVEL_NAME: Record<Level, string> = { building: 'Still building', getting: 'Getting there', strong: 'Strong' }

export interface StudentInsight {
  s: StudentSummary
  understanding: number | null
  cleared: number
  started: number
  /** reasons this student needs attention, most important first; empty when they are fine */
  flags: string[]
  strengths: Skill[]
  toWork: Skill[]
  /** the specific slips this student made (plain words) */
  slips: string[]
  next: string
}

export function studentInsight(s: StudentSummary, lastClassActivity = Date.now()): StudentInsight {
  const u = understanding(s)
  const cleared = clearedCount(s)
  const started = startedCount(s)
  const played = SKILLS.filter((k) => s.places[SKILL_PLACE[k]].a > 0).sort((a, b) => s.skills[b] - s.skills[a])
  const strengths = played.filter((k) => s.skills[k] >= 0.6).slice(0, 2)
  const toWork = [...played].reverse().filter((k) => s.skills[k] < 0.6).slice(0, 2)
  const slips = MISTAKES.filter((m) => m.applicable(s) && m.hit(s)).map((m) => m.text)

  const flags: string[] = []
  if (started === 0) flags.push('Has not started yet')
  else if (u !== null && u < 0.4) flags.push('Low understanding so far')
  if (lastClassActivity - s.at > 10 * DAY) flags.push(`Quiet for ${Math.round((lastClassActivity - s.at) / DAY)} days`)
  if (started > 0 && cleared === 0 && PILLAR_IDS.some((p) => s.places[p].a >= 2)) flags.push('Stuck: tried more than once without clearing')
  if (s.happy < 35) flags.push('Low Happy in the game: suggest a break')

  const nextPlace = PILLAR_IDS.find((p) => s.places[p].s !== 'c')
  const weakest = toWork[0]
  const next =
    started === 0 ? 'Help them open the game and start at the Festival (Plan & Budget).'
    : weakest ? `Replay ${placeLabel(SKILL_PLACE[weakest])} to work on ${SKILL_NAME[weakest].toLowerCase()}; the class activity "${LESSONS[weakest].title}" fits.`
    : nextPlace ? `Move on to ${placeLabel(nextPlace)}.`
    : 'All four places cleared. Ask them to help a classmate, or replay a place to make its flag bright.'

  return { s, understanding: u, cleared, started, flags, strengths, toWork, slips, next }
}

const PLACE_SHORT: Record<PillarId, string> = { plan: 'the Festival (Plan & Budget)', save: 'Pocket Panic (Save & Manage)', invest: 'Deal Board (Investing)', safe: 'Case Files (Stay Safe)' }
const placeLabel = (p: PillarId) => PLACE_SHORT[p]

export interface Focus {
  skill: Skill
  avg: number
  building: number
  of: number
  /** the most common slip tied to this skill's place, if any */
  slip: string | null
  why: string
}

/** where to teach next: skills ranked by how many students are still building them, then by the class average */
export function focusAreas(v: CohortView, max = 3): Focus[] {
  return v.skills
    .filter((s) => s.avg !== null && s.of >= Math.min(K_MIN, Math.max(1, v.n)))
    .map((s) => {
      // the slip that belongs to this skill; for Saving, the most common missed habit from Pocket Panic
      const slip = v.mistakes.find((m) => m.reliable && (m.id === `skill:${s.id}` || (s.id === 'saving' && m.id.startsWith('habit:')))) ?? null
      const avg = s.avg as number
      return {
        skill: s.id,
        avg,
        building: s.low,
        of: s.of,
        slip: slip ? `${slip.text} (${Math.round(slip.share * 100)}% of those who played)` : null,
        why: `${s.low} of ${s.of} students are still building this; class average ${Math.round(avg * 100)}%.`,
        score: (1 - avg) * 0.6 + (s.of ? s.low / s.of : 0) * 0.4,
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map(({ score: _score, ...f }) => f)
}

export interface TrendPoint { at: number; label: string; understanding: number | null; cleared: number; students: number }

/** week-by-week class picture: for each week, every student's latest summary up to then */
export function weeklyTrend(history: StudentSummary[], weeks = 8, now = Date.now()): TrendPoint[] {
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)
  const pts: TrendPoint[] = []
  for (let k = weeks - 1; k >= 0; k--) {
    const cut = end.getTime() - k * WEEK
    const latest = new Map<string, StudentSummary>()
    for (const s of history) if (s.at <= cut && (!latest.get(s.id) || latest.get(s.id)!.at <= s.at)) latest.set(s.id, s)
    const list = [...latest.values()]
    const us = list.map(understanding).filter((x): x is number => x !== null)
    pts.push({
      at: cut,
      label: new Date(cut).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
      understanding: us.length ? us.reduce((a, b) => a + b, 0) / us.length : null,
      cleared: list.length ? list.reduce((a, s) => a + clearedCount(s), 0) / list.length : 0,
      students: list.length,
    })
  }
  // drop the empty weeks before the class started
  const first = pts.findIndex((p) => p.students > 0)
  return first < 0 ? [] : pts.slice(first)
}

/** one student's understanding over time, from their own snapshots */
export const studentTrend = (history: StudentSummary[], id: string) =>
  history.filter((s) => s.id === id).sort((a, b) => a.at - b.at).map((s) => ({ at: s.at, u: understanding(s) })).filter((p): p is { at: number; u: number } => p.u !== null)

/** change in class understanding over the last two points, in percentage points (null when there is no earlier point) */
export const trendDelta = (t: TrendPoint[]): number | null => {
  const pts = t.filter((p) => p.understanding !== null)
  if (pts.length < 2) return null
  return Math.round(((pts[pts.length - 1].understanding as number) - (pts[pts.length - 2].understanding as number)) * 100)
}
