import { SHIELD_PIECES, SKILLS, type ShieldPiece, type Skill } from '../../content/data'

/** small, defensive helpers shared by every adapter. Adapters must never throw on bad input. */

export const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** a finite number, or the fallback (numeric strings are NOT accepted: a wrong type is a wrong type) */
export const num = (v: unknown, fallback = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)

export const hasNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
export const clamp01 = (n: number) => clamp(n, 0, 1)

/** first record found under any of these keys */
export function pickRecord(from: Record<string, unknown>, ...keys: string[]): Record<string, unknown> {
  for (const k of keys) if (isRecord(from[k])) return from[k] as Record<string, unknown>
  return {}
}

/** first finite number found under any of these keys */
export function pickNum(from: Record<string, unknown>, keys: string[]): number | undefined {
  for (const k of keys) if (hasNum(from[k])) return from[k] as number
  return undefined
}

export const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])

export const shieldPieces = (v: unknown): ShieldPiece[] => {
  const list = strings(v)
  return SHIELD_PIECES.filter((p) => list.includes(p))
}

/** a skill value 0..1 from a raw score and its maximum; undefined when the raw score is missing */
export function skill(raw: unknown, max: number): number | undefined {
  return hasNum(raw) && max > 0 ? clamp01(raw / max) : undefined
}

/** drop skills that are undefined, and any key that is not a known skill */
export function skills(values: Partial<Record<Skill, number | undefined>>): Partial<Record<Skill, number>> {
  const out: Partial<Record<Skill, number>> = {}
  for (const k of SKILLS) {
    const v = values[k]
    if (hasNum(v)) out[k] = clamp01(v)
  }
  return out
}

/** say once what was wrong, never throw */
export function warn(adapter: string, message: string): void {
  console.warn(`[adapter:${adapter}] ${message}`)
}

/** read the payload as a record, warning when it is not one */
export function asRecord(adapter: string, payload: unknown): Record<string, unknown> {
  if (isRecord(payload)) return payload
  warn(adapter, 'payload is not an object; treating it as an empty payload')
  return {}
}
