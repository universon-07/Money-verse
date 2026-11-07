import type { CaseDef, Step } from '../types.ts'
import { REASONS } from '../types.ts'
import { explainKeyOf, indexCase, leadNudgeKey, leadQKey, zoneExplainKey, zoneTextKey } from './case.ts'

export interface Issue { level: 'error' | 'warn'; caseId: string; msg: string }
export type Strings = Record<string, string>

/** every string key a case needs (used for the validator and for the Telugu template) */
export function requiredKeys(def: CaseDef): string[] {
  const idx = indexCase(def)
  const keys = new Set<string>([`${def.id}.title`, `${def.id}.brief`, `${def.id}.closing`, `${def.id}.debrief.mechanism`, `${def.id}.debrief.c1`, `${def.id}.debrief.c2`, `${def.id}.debrief.c3`, def.fix.qKey])
  if (def.kind !== 'mystery') keys.add(`${def.id}.tag`)
  for (const item of def.items) for (const z of item.zones) keys.add(zoneTextKey(z))
  for (const c of def.clues) keys.add(explainKeyOf(c))
  for (const { zone } of idx.zones.values()) {
    if ((zone.role === 'herring' || zone.role === 'context') && !idx.zoneClue.has(zone.id)) keys.add(zoneExplainKey(zone))
    if (zone.zoomKey) keys.add(zone.zoomKey)
  }
  for (const l of def.leads) { keys.add(leadQKey(l)); keys.add(leadNudgeKey(l)) }
  for (const o of def.fix.options) { keys.add(o.key); keys.add(o.whyKey) }
  for (const r of def.replay) keys.add(r.captionKey)
  return [...keys]
}

export function validateCase(def: CaseDef, en: Strings, te: Strings, opts: { strictTe?: boolean } = {}): Issue[] {
  const out: Issue[] = []
  const err = (msg: string) => out.push({ level: 'error', caseId: def.id, msg })
  const warn = (msg: string) => out.push({ level: 'warn', caseId: def.id, msg })
  const idx = indexCase(def)

  // unique ids
  const seen = new Set<string>()
  for (const item of def.items) {
    if (seen.has(item.id)) err(`duplicate item id ${item.id}`)
    seen.add(item.id)
    if (!def.apps.includes(item.app)) err(`item ${item.id} uses app ${item.app} which is not unlocked for this case`)
  }
  const zoneIds = new Set<string>()
  for (const item of def.items) for (const z of item.zones) {
    if (zoneIds.has(z.id)) err(`duplicate zone id ${z.id}`)
    zoneIds.add(z.id)
  }

  // item and distractor counts (spec 11.12 / 10.4)
  const herrings = new Set(def.items.filter((i) => i.zones.some((z) => z.role === 'herring')).map((i) => i.id)).size
  const contexts = new Set(def.items.filter((i) => i.zones.some((z) => z.role === 'context')).map((i) => i.id)).size
  const minItems = def.kind === 'mystery' ? 15 : def.kind === 'tutorial' ? 10 : 30
  const minHerr = def.kind === 'mystery' ? 2 : def.kind === 'tutorial' ? 3 : 5
  const minCtx = def.kind === 'tutorial' ? 0 : 2
  if (def.items.length < minItems) err(`only ${def.items.length} items (need at least ${minItems})`)
  if (herrings < minHerr) err(`only ${herrings} red herrings (need at least ${minHerr})`)
  if (contexts < minCtx) err(`only ${contexts} context items (need at least ${minCtx})`)

  // clue counts per kind
  const expectReq = def.kind === 'tutorial' ? 3 : def.kind === 'mystery' ? 5 : 6
  if (idx.required.length !== expectReq) err(`${idx.required.length} required clues (expected ${expectReq})`)
  if (def.kind === 'case' && idx.connect.length !== 1) warn(`expected 1 Connect clue, found ${idx.connect.length}`)
  if (def.kind === 'case' && (idx.gold.length < 2 || idx.gold.length > 3)) warn(`expected 2 or 3 gold clues, found ${idx.gold.length}`)
  if (def.kind !== 'mystery' && def.leads.length !== idx.required.length) err('leads must match required clues one to one')
  if (def.kind === 'mystery' && def.leads.length) err('mystery has no leads')

  // clues
  const targetOwner = new Map<string, string>()
  for (const c of def.clues) {
    if (c.kind !== 'connect') {
      if (!c.targets.length) err(`clue ${c.id} has no target`)
      if (!c.reason || !REASONS.includes(c.reason)) err(`clue ${c.id} has no valid reason`)
      if ((c.distractors ?? []).length !== 2) err(`clue ${c.id} needs exactly two distractors`)
      for (const d of c.distractors ?? []) {
        if (d === c.reason || (c.alsoAccepted ?? []).includes(d)) err(`clue ${c.id}: distractor ${d} equals a correct reason`)
      }
      for (const t of c.targets) {
        if (!idx.zones.has(t)) err(`clue ${c.id}: target ${t} does not exist`)
        const owner = targetOwner.get(t)
        if (owner && owner !== c.id) err(`zone ${t} is a target of both ${owner} and ${c.id}`)
        targetOwner.set(t, c.id)
      }
    } else {
      const holders = def.items.filter((i) => i.zones.some((z) => z.linkKey === c.linkKey))
      if (!c.linkKey || holders.length < 2) err(`connect clue ${c.id} needs a linkKey shared by two items`)
    }
    if (![1, 2, 3, 4, 5].includes(c.step)) err(`clue ${c.id} has an invalid step`)
  }
  if (def.kind !== 'tutorial') {
    for (const s of [1, 2, 3, 4, 5] as Step[]) {
      if (!def.clues.some((c) => c.step === s && c.kind !== 'connect')) warn(`no clue on step ${s}`)
    }
  }

  // leads
  for (const l of def.leads) {
    if (!idx.clues.has(l.clueId)) err(`lead ${l.id} points at unknown clue ${l.clueId}`)
    if (!idx.zones.has(l.pulseTarget)) err(`lead ${l.id}: pulse target ${l.pulseTarget} does not exist`)
    if (!def.apps.includes(l.glowApp)) err(`lead ${l.id}: app ${l.glowApp} is not in this case`)
    const target = idx.clues.get(l.clueId)
    if (target && !target.targets.includes(l.pulseTarget)) err(`lead ${l.id}: pulse target is not a target of ${l.clueId}`)
    const q = en[leadQKey(l)]
    if (q && q.split(/\s+/).length > 40) warn(`lead ${l.id} question is over 40 words`)
  }

  // Fix
  if (def.fix.options.filter((o) => o.correct).length !== 1) err('Fix must have exactly one correct option')
  if (def.fix.options.length !== 3) err('Fix must have three options')

  // replay
  const beats = def.kind === 'tutorial' ? 3 : 5
  if (def.replay.length !== beats) err(`replay needs ${beats} beats`)

  // strings
  for (const k of requiredKeys(def)) {
    if (!(k in en) || !en[k]) err(`missing English string ${k}`)
    else if (!(k in te) || !te[k]) (opts.strictTe ? err : warn)(`missing Telugu string ${k}`)
  }
  for (const c of def.clues) {
    const ex = en[explainKeyOf(c)]
    if (ex && ex.split(/\s+/).length > 45) warn(`explanation ${c.id} is over 45 words`)
  }
  return out
}
