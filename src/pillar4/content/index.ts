import type { CaseDef, RawCase } from '../types.ts'
import { normalizeCase } from '../engine/case.ts'

// Cases are data files: dropping a new JSON into ./cases and its strings into ./strings/en is all it takes.
const rawCases = import.meta.glob<RawCase>('./cases/*.json', { eager: true, import: 'default' })
export const CASES: Record<string, CaseDef> = {}
for (const raw of Object.values(rawCases)) CASES[raw.id] = normalizeCase(raw)

/** the guided journey, in order */
export const JOURNEY = ['TUT', 'C1', 'C2', 'C3'] as const
export const MYSTERY_IDS = Object.values(CASES).filter((c) => c.kind === 'mystery').map((c) => c.id).sort()

const load = (mods: Record<string, Record<string, string>>) => {
  const out: Record<string, string> = {}
  for (const m of Object.values(mods)) for (const [k, v] of Object.entries(m)) if (v) out[k] = v // "" = not translated yet
  return out
}
export const EN = load(import.meta.glob<Record<string, string>>('./strings/en/*.json', { eager: true, import: 'default' }))
export const TE = load(import.meta.glob<Record<string, string>>('./strings/te/*.json', { eager: true, import: 'default' }))
