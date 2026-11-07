import { PILLAR_IDS, SKILLS, type PillarId, type Skill } from '../content/data'
import { cleanRoll } from '../lib/roll'

/**
 * The anonymous progress summary a student can share with a facilitator. It is built from a save slot's snapshot (the game is only
 * read, never changed) and holds no name, no alias and nothing the student typed except the class code and their school roll number.
 */
export const CONCEPTS = ['payFirst', 'track', 'small', 'emergency', 'plan', 'wait', 'goals', 'borrow', 'lend'] as const
export type Concept = (typeof CONCEPTS)[number]
export type PlaceState = 'n' | 'p' | 'c' // not started, in progress, cleared
export type Glow = 'b' | 'd' | 'f' | null // bright, dim, flickering

export interface StudentSummary {
  v: 1
  /** short anonymous id derived from the install id */
  id: string
  /** the class code the student typed, or null */
  cohort: string | null
  /** the student's school roll number as 4 digits, or null. Only the teacher's own device can turn it into a name. */
  roll: string | null
  at: number
  lang: 'en' | 'hi' | 'te'
  persona: 'school' | 'college' | 'earner' | null
  lite: boolean
  places: Record<PillarId, { s: PlaceState; q: number; a: number; b: Glow }>
  skills: Record<Skill, number>
  happy: number
  /** life moments taken */
  breaks: number
  /** Pocket Panic: which good money habits showed in the latest month, or null if not played */
  habits: Record<Concept, boolean> | null
  /** Case Files: cases closed, wrong reports, cases where hints were used; or null if not played */
  p4: { closed: number; wrong: number; hints: number } | null
}

const PREFIX = 'MM1.'
const GAME_KEY = 'money-mohalla-v2'

const rec = (v: unknown): Record<string, unknown> => (typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {})
const n01 = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? Math.round(Math.min(1, Math.max(0, v)) * 100) / 100 : 0)
const cnt = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(9999, Math.floor(v))) : 0)

/** a class code as typed by a student, made to match the teacher's: case, spaces and a missing dash do not matter ('hyd k7q2m' is HYD-K7Q2M) */
export const cleanCode = (v: unknown): string | null => {
  const s = typeof v === 'string' ? v.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 14) : ''
  const hyd = /^HYD-?([A-Z0-9]{4,5})$/.exec(s)
  return hyd ? `HYD-${hyd[1]}` : s || null
}

const hash = (s: string): string => {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return (h >>> 0).toString(36).padStart(7, '0').slice(0, 7)
}

const parseJSON = (raw: string | undefined): Record<string, unknown> => {
  try {
    return rec(JSON.parse(raw ?? '{}'))
  } catch {
    return {}
  }
}

/** reads a slot snapshot (what the game keeps in localStorage) into a summary; never throws */
export function buildSummary(data: Record<string, string>, now = Date.now(), codeOverride?: string | null, rollOverride?: string | null): StudentSummary {
  const st = rec(parseJSON(data[GAME_KEY]).state)
  const pillars = rec(st.pillars)
  const places = {} as StudentSummary['places']
  for (const id of PILLAR_IDS) {
    const p = rec(pillars[id])
    places[id] = {
      s: p.status === 'complete' ? 'c' : p.status === 'in_progress' ? 'p' : 'n',
      q: n01(p.bestQuality),
      a: cnt(p.attempts),
      b: p.brightness === 'bright' ? 'b' : p.brightness === 'dim' ? 'd' : p.brightness === 'flicker' ? 'f' : null,
    }
  }
  const sk = rec(st.skills)
  const skills = {} as StudentSummary['skills']
  for (const k of SKILLS) skills[k] = n01(sk[k])
  const used = rec(st.lifeMomentsUsed)
  const breaks = Object.values(used).reduce<number>((a, v) => a + cnt(v), 0)

  const cafeHist = parseJSON(data['money-mohalla-cafe-v1']).state
  const hist = Array.isArray(rec(cafeHist).history) ? (rec(cafeHist).history as unknown[]) : []
  const last = hist.length ? rec(rec(hist[hist.length - 1]).evidence) : null
  const habits = last ? (Object.fromEntries(CONCEPTS.map((c) => [c, last[c] === true])) as Record<Concept, boolean>) : null

  const p4s = rec(parseJSON(data['p4.v1']).state)
  const prog = Object.values(rec(p4s.progress)).map(rec)
  const p4 = prog.length
    ? { closed: Array.isArray(p4s.completed) ? p4s.completed.length : 0, wrong: prog.reduce((a, p) => a + cnt(p.wrongTotal), 0), hints: prog.filter((p) => p.hintUsed === true || p.helpUsed === true).length }
    : null

  return {
    v: 1,
    id: hash(typeof st.installId === 'string' && st.installId ? st.installId : JSON.stringify(Object.keys(data))),
    cohort: cleanCode(codeOverride !== undefined ? codeOverride : st.classCode),
    roll: cleanRoll(rollOverride !== undefined ? rollOverride : st.rollNo),
    at: now,
    lang: st.language === 'hi' || st.language === 'te' ? st.language : 'en',
    persona: st.persona === 'school' || st.persona === 'college' || st.persona === 'earner' ? st.persona : null,
    lite: st.liteMode === true,
    places,
    skills,
    happy: Math.round(typeof st.happy === 'number' && Number.isFinite(st.happy) ? Math.min(100, Math.max(0, st.happy)) : 50),
    breaks,
    habits,
    p4,
  }
}

/** a pasted or loaded value into a clean summary, or null when it is not one (every field is range-checked) */
export function parseSummary(v: unknown): StudentSummary | null {
  const o = rec(v)
  if (o.v !== 1 || typeof o.id !== 'string' || !/^[a-z0-9]{3,12}$/.test(o.id)) return null
  const places = {} as StudentSummary['places']
  for (const id of PILLAR_IDS) {
    const p = rec(rec(o.places)[id])
    places[id] = { s: p.s === 'c' || p.s === 'p' ? p.s : 'n', q: n01(p.q), a: cnt(p.a), b: p.b === 'b' || p.b === 'd' || p.b === 'f' ? p.b : null }
  }
  const skills = {} as StudentSummary['skills']
  for (const k of SKILLS) skills[k] = n01(rec(o.skills)[k])
  const h = o.habits === null || o.habits === undefined ? null : rec(o.habits)
  const p4 = o.p4 === null || o.p4 === undefined ? null : rec(o.p4)
  return {
    v: 1,
    id: o.id,
    cohort: cleanCode(o.cohort),
    roll: cleanRoll(o.roll),
    at: typeof o.at === 'number' && Number.isFinite(o.at) ? o.at : 0,
    lang: o.lang === 'hi' || o.lang === 'te' ? o.lang : 'en',
    persona: o.persona === 'school' || o.persona === 'college' || o.persona === 'earner' ? o.persona : null,
    lite: o.lite === true,
    places,
    skills,
    happy: Math.round(typeof o.happy === 'number' && Number.isFinite(o.happy) ? Math.min(100, Math.max(0, o.happy)) : 50),
    breaks: cnt(o.breaks),
    habits: h ? (Object.fromEntries(CONCEPTS.map((c) => [c, h[c] === true])) as Record<Concept, boolean>) : null,
    p4: p4 ? { closed: cnt(p4.closed), wrong: cnt(p4.wrong), hints: cnt(p4.hints) } : null,
  }
}

const b64 = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const unb64 = (s: string) => atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4))

/** the text a student sends (WhatsApp, file, anything): "MM1." followed by the summary */
export const encodeSummary = (s: StudentSummary): string => PREFIX + b64(JSON.stringify(s))

export function decodeSummary(code: string): StudentSummary | null {
  try {
    const t = code.trim()
    if (!t.startsWith(PREFIX)) return null
    return parseSummary(JSON.parse(unb64(t.slice(PREFIX.length))))
  } catch {
    return null
  }
}

/** every progress code found in a block of text (a pasted chat, a file), so a whole class can be added at once */
export const findCodes = (text: string): string[] => text.match(/MM1\.[A-Za-z0-9_-]+/g) ?? []
