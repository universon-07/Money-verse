import { PILLAR_IDS, SKILLS, type PillarId, type Skill } from '../content/data'
import { MISTAKES, SKILL_PLACE } from './lessons'
import type { StudentSummary } from './summary'

/** groups smaller than this are never broken out (nobody can be picked out of a small slice) */
export const K_MIN = 5

export type Band = 'bright' | 'dim' | 'flicker'
export const bandOf = (happy: number): Band => (happy >= 60 ? 'bright' : happy >= 35 ? 'dim' : 'flicker')

export interface Split { key: string; n: number; hidden: boolean }
export interface FunnelRow { id: PillarId; started: number; cleared: number; bright: number; avgQuality: number | null }
export interface SkillRow { id: Skill; avg: number | null; low: number; mid: number; high: number; of: number }
export interface MistakeStat { id: string; pillar: PillarId; text: string; hit: number; of: number; share: number; reliable: boolean }
export interface QuietRow { id: string; started: number; missing: PillarId[]; at: number }

export interface CohortView {
  n: number
  active: number
  finishedAll: number
  lastSeen: number | null
  funnel: FunnelRow[]
  skills: SkillRow[]
  languages: Split[]
  personas: Split[]
  liteShare: number
  happy: { avg: number | null; bright: number; dim: number; flicker: number; breaksShare: number; noBreakWorking: number }
  replay: { tried: number; brightened: number }
  mistakes: MistakeStat[]
  quiet: QuietRow[]
  weakestSkill: Skill | null
}

const share = (a: number, b: number) => (b > 0 ? a / b : 0)
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)
const startedCount = (s: StudentSummary) => PILLAR_IDS.filter((p) => s.places[p].s !== 'n' || s.places[p].a > 0).length

function split(list: StudentSummary[], key: (s: StudentSummary) => string | null, keys: string[]): Split[] {
  return keys.map((k) => {
    const n = list.filter((s) => key(s) === k).length
    return { key: k, n: n < K_MIN ? 0 : n, hidden: n > 0 && n < K_MIN }
  })
}

export function aggregate(list: StudentSummary[]): CohortView {
  const n = list.length
  const funnel: FunnelRow[] = PILLAR_IDS.map((id) => {
    const started = list.filter((s) => s.places[id].s !== 'n' || s.places[id].a > 0)
    const cleared = list.filter((s) => s.places[id].s === 'c')
    return {
      id,
      started: started.length,
      cleared: cleared.length,
      bright: cleared.filter((s) => s.places[id].b === 'b').length,
      avgQuality: avg(cleared.map((s) => s.places[id].q)),
    }
  })

  const skills: SkillRow[] = SKILLS.map((id) => {
    const vals = list.filter((s) => s.places[SKILL_PLACE[id]].a > 0).map((s) => s.skills[id])
    return { id, avg: avg(vals), low: vals.filter((v) => v < 0.4).length, mid: vals.filter((v) => v >= 0.4 && v < 0.7).length, high: vals.filter((v) => v >= 0.7).length, of: vals.length }
  })
  const rated = skills.filter((s) => s.avg !== null && s.of >= Math.min(K_MIN, n))
  const weakestSkill = rated.length ? rated.reduce((a, b) => ((b.avg as number) < (a.avg as number) ? b : a)).id : null

  const bands = list.map((s) => bandOf(s.happy))
  const working = list.filter((s) => PILLAR_IDS.filter((p) => s.places[p].s === 'c').length >= 2)
  const tried = list.filter((s) => PILLAR_IDS.some((p) => s.places[p].a > 1))
  const brightened = tried.filter((s) => PILLAR_IDS.some((p) => s.places[p].a > 1 && s.places[p].b === 'b'))

  const mistakes: MistakeStat[] = MISTAKES.map((m) => {
    const of = list.filter(m.applicable)
    const hit = of.filter(m.hit).length
    return { id: m.id, pillar: m.pillar, text: m.text, hit, of: of.length, share: share(hit, of.length), reliable: of.length >= K_MIN }
  })
    .filter((m) => m.of > 0 && m.hit > 0)
    .sort((a, b) => Number(b.reliable) - Number(a.reliable) || b.share - a.share || b.hit - a.hit)

  const quiet: QuietRow[] = list
    .map((s) => ({ id: s.id, started: startedCount(s), missing: PILLAR_IDS.filter((p) => s.places[p].s !== 'c'), at: s.at }))
    .filter((q) => q.missing.length > 0)
    .sort((a, b) => a.started - b.started || a.at - b.at)

  return {
    n,
    active: list.filter((s) => startedCount(s) > 0).length,
    finishedAll: list.filter((s) => PILLAR_IDS.every((p) => s.places[p].s === 'c')).length,
    lastSeen: list.length ? Math.max(...list.map((s) => s.at)) : null,
    funnel,
    skills,
    languages: split(list, (s) => s.lang, ['en', 'hi', 'te']),
    personas: split(list, (s) => s.persona, ['school', 'college', 'earner']),
    liteShare: share(list.filter((s) => s.lite).length, n),
    happy: {
      avg: avg(list.map((s) => s.happy)),
      bright: bands.filter((b) => b === 'bright').length,
      dim: bands.filter((b) => b === 'dim').length,
      flicker: bands.filter((b) => b === 'flicker').length,
      breaksShare: share(list.filter((s) => s.breaks > 0).length, n),
      noBreakWorking: working.filter((s) => s.breaks === 0).length,
    },
    replay: { tried: tried.length, brightened: brightened.length },
    mistakes,
    quiet,
    weakestSkill,
  }
}

/** one line per student, anonymous, for a spreadsheet */
export function toCsv(list: StudentSummary[]): string {
  const head = ['id', 'class_code', 'language', 'persona', 'lite', 'happy', 'breaks', ...PILLAR_IDS.flatMap((p) => [`${p}_state`, `${p}_quality`, `${p}_attempts`, `${p}_glow`]), ...SKILLS]
  const rows = list.map((s) => [
    s.id, s.cohort ?? '', s.lang, s.persona ?? '', s.lite ? 1 : 0, s.happy, s.breaks,
    ...PILLAR_IDS.flatMap((p) => [s.places[p].s, s.places[p].q, s.places[p].a, s.places[p].b ?? '']),
    ...SKILLS.map((k) => s.skills[k]),
  ])
  return [head, ...rows].map((r) => r.join(',')).join('\n')
}
