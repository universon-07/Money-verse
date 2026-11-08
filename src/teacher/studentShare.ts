import type { SubmitResult } from './cloud'
import { buildSummary, cleanCode } from './summary'

/**
 * The student side of the link to their teacher: share the game being played right now (one tap from the profile, and on its
 * own after every finished game), look up a class code to show which class it belongs to, and remember what was last sent.
 * The database client is loaded only when something is actually sent, so the game itself stays small.
 */
export const cloudOn = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

/** everything a progress summary is built from (the shell's save, Pocket Panic, Case Files) */
const LIVE_KEYS = ['money-mohalla-v2', 'money-mohalla-cafe-v1', 'p4.v1']
/** per game (it is saved with the slot, like the rest of the game): auto-send on or off, and the last send */
const STATUS_KEY = 'minar-share-status'
export const SHARE_EVENT = 'minar-share'

export interface ShareStatus { auto: boolean; lastAt: number | null; last: SubmitResult | 'need_class' | 'need_roll' | null; className: string | null }

const read = (k: string): string | null => { try { return window.localStorage.getItem(k) } catch { return null } }

export function readShareStatus(): ShareStatus {
  try {
    const o = JSON.parse(read(STATUS_KEY) ?? '{}')
    return { auto: o.auto !== false, lastAt: typeof o.lastAt === 'number' ? o.lastAt : null, last: o.last ?? null, className: typeof o.className === 'string' ? o.className : null }
  } catch {
    return { auto: true, lastAt: null, last: null, className: null }
  }
}

export function writeShareStatus(patch: Partial<ShareStatus>) {
  const next = { ...readShareStatus(), ...patch }
  try { window.localStorage.setItem(STATUS_KEY, JSON.stringify(next)) } catch { /* private mode: nothing remembered */ }
  window.dispatchEvent(new Event(SHARE_EVENT))
}

export function liveData(): Record<string, string> {
  const out: Record<string, string> = {}
  for (const k of LIVE_KEYS) { const v = read(k); if (v) out[k] = v }
  return out
}

/** sends the current game's progress to the class in its saved class code */
export async function shareNow(): Promise<ShareStatus['last']> {
  const s = buildSummary(liveData())
  if (!s.cohort) { writeShareStatus({ last: 'need_class' }); return 'need_class' }
  if (!s.roll) { writeShareStatus({ last: 'need_roll' }); return 'need_roll' }
  if (!cloudOn) return 'off'
  const { submitProgress } = await import('./cloud')
  const r = await submitProgress(s.cohort, s)
  writeShareStatus(r === 'ok' ? { last: r, lastAt: Date.now() } : { last: r })
  return r
}

/** after every finished game: quietly keep the teacher up to date, if the student is in a class and has not turned this off */
export function autoShareAfterGame() {
  if (!cloudOn || !readShareStatus().auto) return
  const s = buildSummary(liveData())
  if (!s.cohort || !s.roll) return
  // let every game's own store finish saving first
  window.setTimeout(() => { void shareNow().catch(() => undefined) }, 800)
}

/** the class name for a code, so a student can see they typed the right one; null when there is no such class, 'offline' when unknown */
export async function lookupClass(code: string): Promise<string | null | 'offline'> {
  const c = cleanCode(code)
  if (!c) return null
  if (!cloudOn) return 'offline'
  try {
    const { classInfo } = await import('./cloud')
    return await classInfo(c)
  } catch {
    return 'offline'
  }
}
