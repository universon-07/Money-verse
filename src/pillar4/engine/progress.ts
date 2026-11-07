import type { CaseDef, CaseProgress, Lead, Outcome, Reason, Step } from '../types.ts'
import { REASONS } from '../types.ts'
import { indexCase, itemLinkKeys, zoneExplainKey, explainKeyOf } from './case.ts'

// ---- rewards (spec 6.1, 6.2) ------------------------------------------------------------------
export const DIAMOND = {
  required: 5,
  gold: 10,
  connect: 10,
  board: 15,
  fixFirst: 10,
  fixLater: 5,
  closeCase: 20,
  closeTutorial: 10,
  closeMystery: 30,
  noHint: 10,
  master: 50,
} as const

/** nearest multiple of 5 */
export const round5 = (n: number) => Math.round(n / 5) * 5

export function newProgress(replay = false): CaseProgress {
  return {
    phase: 'briefing', pinned: [], missed: [], connects: [], wrongStreak: 0, wrongTotal: 0, leadWrong: {}, hintLevel: {},
    leadCursor: 0, hintUsed: false, helpUsed: false, cluesBeforeHelp: null, placements: {}, dropWrong: {},
    requiredDropWrong: false, boardDone: false, fixAttempts: 0, fixDone: false, closed: false, earned: 0,
    credited: 0, replay, goldPrompted: false,
  }
}

const award = (p: CaseProgress, n: number): CaseProgress =>
  n === 0 ? p : { ...p, earned: p.earned + n, credited: p.credited + (p.replay ? 0 : n) }

/** the most a first perfect run of this case can earn (spec 6.2) */
export function maxDiamonds(def: CaseDef): number {
  const idx = indexCase(def)
  const tut = def.kind === 'tutorial'
  const req = idx.required.length * DIAMOND.required
  const gold = idx.gold.length * DIAMOND.gold
  const conn = idx.connect.length * DIAMOND.connect
  const board = tut ? 0 : DIAMOND.board
  const fix = tut ? 0 : DIAMOND.fixFirst
  const close = tut ? DIAMOND.closeTutorial : def.kind === 'mystery' ? DIAMOND.closeMystery : DIAMOND.closeCase
  const noHint = tut ? 0 : DIAMOND.noHint
  return req + gold + conn + board + fix + close + noHint
}

// ---- leads and hints (spec 5.7) ----------------------------------------------------------------
export const openLeads = (def: CaseDef, p: CaseProgress): Lead[] => def.leads.filter((l) => !p.pinned.includes(l.clueId))

export function activeLead(def: CaseDef, p: CaseProgress): Lead | null {
  const open = openLeads(def, p)
  return open.length ? open[p.leadCursor % open.length] : null
}

export const levelOf = (p: CaseProgress, leadId: string) => p.hintLevel[leadId] ?? 1

/** "Ask me something else": cycle to another open lead */
export const cycleLead = (p: CaseProgress): CaseProgress => ({ ...p, leadCursor: p.leadCursor + 1 })

function escalate(p: CaseProgress, leadId: string, to?: number): CaseProgress {
  const cur = levelOf(p, leadId)
  const next = Math.min(4, to ?? cur + 1)
  if (next <= cur) return p
  return {
    ...p,
    hintLevel: { ...p.hintLevel, [leadId]: next },
    leadWrong: { ...p.leadWrong, [leadId]: 0 },
    hintUsed: p.hintUsed || next >= 2,
  }
}

export interface HintResult { prog: CaseProgress; leadId?: string; level?: number; generic?: boolean }

/** Student taps "Need help". Mystery has one generic nudge and no ladder. */
export function requestHint(def: CaseDef, p: CaseProgress): HintResult {
  if (def.kind === 'mystery') {
    const req = indexCase(def).required.filter((c) => p.pinned.includes(c.id)).length
    return { prog: { ...p, helpUsed: true, cluesBeforeHelp: p.cluesBeforeHelp ?? req }, generic: true }
  }
  const lead = activeLead(def, p)
  if (!lead) return { prog: p }
  const prog = escalate(p, lead.id)
  return { prog, leadId: lead.id, level: levelOf(prog, lead.id) }
}

/** Inactivity: lifts a lead from L1 to L2 only (timing is decided by the UI: 120 s, 60 s for Beginner). */
export function idleHint(def: CaseDef, p: CaseProgress): HintResult {
  const lead = activeLead(def, p)
  if (!lead || levelOf(p, lead.id) >= 2) return { prog: p }
  const prog = escalate(p, lead.id, 2)
  return { prog, leadId: lead.id, level: 2 }
}

// ---- report resolution (spec 5.4) --------------------------------------------------------------
export interface ReportResult { prog: CaseProgress; outcome: Outcome; autoHint?: { leadId: string; level: number } }

export function reportZone(def: CaseDef, p: CaseProgress, zoneId: string, pick: Reason | 'fine'): ReportResult {
  const idx = indexCase(def)
  const ref = idx.zones.get(zoneId)
  if (!ref) return { prog: p, outcome: { kind: 'ordinary' } }
  const clue = idx.zoneClue.get(zoneId)

  if (clue) {
    if (p.pinned.includes(clue.id)) return { prog: p, outcome: { kind: 'duplicate', clueId: clue.id } }
    const ok = pick !== 'fine' && (pick === clue.reason || (clue.alsoAccepted ?? []).includes(pick))
    if (ok) {
      const next = award(
        { ...p, pinned: [...p.pinned, clue.id], wrongStreak: 0 },
        clue.kind === 'gold' ? DIAMOND.gold : DIAMOND.required,
      )
      return { prog: next, outcome: { kind: 'correct', clueId: clue.id, explainKey: explainKeyOf(clue) } }
    }
    // wrong reason, or "This looks fine" on a clue: no penalty, counts toward hints
    let next: CaseProgress = { ...p, wrongTotal: p.wrongTotal + 1, wrongStreak: p.wrongStreak + 1, missed: p.missed.includes(clue.id) ? p.missed : [...p.missed, clue.id] }
    let autoHint: ReportResult['autoHint']
    const lead = activeLead(def, next)
    if (lead) {
      next = { ...next, leadWrong: { ...next.leadWrong, [lead.id]: (next.leadWrong[lead.id] ?? 0) + 1 } }
      const before = levelOf(next, lead.id)
      if (def.support === 'full' && before < 2) next = escalate(next, lead.id, 2) // Tutorial: L2 on first wrong report
      else if ((next.leadWrong[lead.id] ?? 0) >= 2) next = escalate(next, lead.id)
      if (next.wrongStreak >= 3) {
        next = escalate({ ...next, wrongStreak: 0 }, lead.id, Math.max(2, levelOf(next, lead.id)))
      }
      const after = levelOf(next, lead.id)
      if (after > before) autoHint = { leadId: lead.id, level: after }
    } else if (next.wrongStreak >= 3) {
      next = { ...next, wrongStreak: 0 }
    }
    return { prog: next, outcome: { kind: 'wrong', clueId: clue.id }, autoHint }
  }

  const role = ref.zone.role ?? 'ordinary'
  if (role === 'herring') {
    return { prog: p, outcome: { kind: pick === 'fine' ? 'herring_fine' : 'herring_any', explainKey: zoneExplainKey(ref.zone) } }
  }
  if (role === 'context') return { prog: p, outcome: { kind: 'context', explainKey: zoneExplainKey(ref.zone) } }
  return { prog: p, outcome: { kind: 'ordinary' } }
}

/** which reasons the picker shows: the correct one plus two authored distractors (spec 5.6) */
export function reasonOptions(def: CaseDef, zoneId: string, rand: () => number = Math.random): (Reason | 'fine')[] {
  const clue = indexCase(def).zoneClue.get(zoneId)
  let three: Reason[]
  if (clue && clue.reason) three = [clue.reason, ...(clue.distractors ?? []).slice(0, 2)]
  else three = shuffle(REASONS, rand).slice(0, 3)
  return [...shuffle(three, rand), 'fine']
}

export function shuffle<T>(xs: readonly T[], rand: () => number = Math.random): T[] {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ---- progress helpers --------------------------------------------------------------------------
export const requiredFound = (def: CaseDef, p: CaseProgress) =>
  indexCase(def).required.filter((c) => p.pinned.includes(c.id)).length
export const allRequiredFound = (def: CaseDef, p: CaseProgress) => requiredFound(def, p) === indexCase(def).required.length
export const goldRemaining = (def: CaseDef, p: CaseProgress) =>
  indexCase(def).gold.filter((c) => !p.pinned.includes(c.id)).length
export const connectRemaining = (def: CaseDef, p: CaseProgress) =>
  indexCase(def).connect.filter((c) => !p.connects.includes(c.id)).length

export const startCase = (p: CaseProgress): CaseProgress => (p.phase === 'briefing' ? { ...p, phase: 'investigating' } : p)

// ---- Link mode (spec 5.8) ----------------------------------------------------------------------
export interface LinkResult { prog: CaseProgress; result: 'ok' | 'fail' | 'already'; clueId?: string }

export function tryLink(def: CaseDef, p: CaseProgress, itemA: string, itemB: string): LinkResult {
  const idx = indexCase(def)
  const a = idx.items.get(itemA)
  const b = idx.items.get(itemB)
  if (!a || !b || a.id === b.id) return { prog: p, result: 'fail' }
  const shared = itemLinkKeys(a).filter((k) => itemLinkKeys(b).includes(k))
  const clue = idx.connect.find((c) => c.linkKey && shared.includes(c.linkKey))
  if (!clue) return { prog: p, result: 'fail' }
  if (p.connects.includes(clue.id)) return { prog: p, result: 'already', clueId: clue.id }
  return { prog: award({ ...p, connects: [...p.connects, clue.id] }, DIAMOND.connect), result: 'ok', clueId: clue.id }
}

// ---- Board (spec 5.9) --------------------------------------------------------------------------
/** cards the student has to place: the required clues (hidden items and links are placed automatically) */
export function boardCards(def: CaseDef, _p: CaseProgress): string[] {
  return indexCase(def).required.map((c) => c.id)
}

export interface DropResult { prog: CaseProgress; correct: boolean; wrongCount: number; showDefs: boolean; pulse: boolean }

export function dropCard(def: CaseDef, p: CaseProgress, cardId: string, step: Step): DropResult {
  const idx = indexCase(def)
  const clue = idx.clues.get(cardId)
  if (!clue || p.placements[cardId] === clue.step) return { prog: p, correct: true, wrongCount: 0, showDefs: false, pulse: false }
  if (clue.step === step) {
    let next: CaseProgress = { ...p, placements: { ...p.placements, [cardId]: step } }
    if (!next.boardDone && idx.required.every((c) => next.placements[c.id] === c.step)) {
      next = { ...next, boardDone: true }
      if (def.kind !== 'tutorial' && !next.requiredDropWrong) next = award(next, DIAMOND.board)
    }
    return { prog: next, correct: true, wrongCount: p.dropWrong[cardId] ?? 0, showDefs: false, pulse: false }
  }
  const n = (p.dropWrong[cardId] ?? 0) + 1
  const next: CaseProgress = {
    ...p,
    dropWrong: { ...p.dropWrong, [cardId]: n },
    requiredDropWrong: p.requiredDropWrong || clue.kind === 'required',
  }
  return { prog: next, correct: false, wrongCount: n, showDefs: n >= 2, pulse: n >= 4 }
}

export const goToFix = (p: CaseProgress): CaseProgress => ({ ...p, phase: 'fix' })
export const goToReplay = (p: CaseProgress): CaseProgress => ({ ...p, phase: 'replay' })
/**
 * Opens the Board. Hidden (gold) items and Connect links are placed in their correct stage automatically, so the
 * student only reconstructs the required evidence; the bonuses were already rewarded when they were found.
 */
export function openBoard(def: CaseDef, p: CaseProgress): CaseProgress {
  const placements = { ...p.placements }
  for (const c of def.clues) {
    const found = c.kind === 'connect' ? p.connects.includes(c.id) : c.kind === 'gold' && p.pinned.includes(c.id)
    if (found) placements[c.id] = c.step
  }
  return { ...p, placements, phase: 'board' }
}

// ---- Fix (spec 5.10) ---------------------------------------------------------------------------
export interface FixResult { prog: CaseProgress; correct: boolean; whyKey: string }

export function answerFix(def: CaseDef, p: CaseProgress, optionKey: string): FixResult {
  const opt = def.fix.options.find((o) => o.key === optionKey)
  if (!opt || p.fixDone) return { prog: p, correct: !!opt?.correct, whyKey: opt?.whyKey ?? '' }
  const attempts = p.fixAttempts + 1
  let next: CaseProgress = { ...p, fixAttempts: attempts }
  if (opt.correct) {
    next = { ...next, fixDone: true }
    if (def.kind !== 'tutorial') next = award(next, attempts === 1 ? DIAMOND.fixFirst : DIAMOND.fixLater)
  }
  return { prog: next, correct: opt.correct, whyKey: opt.whyKey }
}

// ---- close (spec 5.11) -------------------------------------------------------------------------
export function closeCase(def: CaseDef, p: CaseProgress): CaseProgress {
  if (p.closed) return p
  const close = def.kind === 'tutorial' ? DIAMOND.closeTutorial : def.kind === 'mystery' ? DIAMOND.closeMystery : DIAMOND.closeCase
  let next = award(p, close)
  const clean = def.kind === 'mystery' ? !p.helpUsed : !p.hintUsed
  if (def.kind !== 'tutorial' && clean) next = award(next, DIAMOND.noHint)
  next = { ...next, closed: true, phase: 'closed' }
  // replays pay 25% of what the run would have earned, rounded to the nearest 5 (spec 5.12)
  if (next.replay) next = { ...next, credited: round5(next.earned * 0.25) }
  return next
}

/** Mystery transfer score: required clues found before any help, 0..5 */
export const transferScore = (def: CaseDef, p: CaseProgress): number => p.cluesBeforeHelp ?? requiredFound(def, p)

// ---- titles, shield ----------------------------------------------------------------------------
export type TitleId = 'trainee' | 'junior' | 'detective' | 'senior' | 'chief'

export function titleFor(closed: string[], masterDone: boolean): TitleId {
  if (masterDone) return 'chief'
  if (closed.includes('C3')) return 'senior'
  if (closed.includes('C2')) return 'detective'
  if (closed.includes('C1')) return 'junior'
  return 'trainee'
}

export const TITLE_ORDER: TitleId[] = ['trainee', 'junior', 'detective', 'senior', 'chief']

/** pinned required clues that never drew a wrong report (spec 6.7) */
export const firstTryClues = (def: CaseDef, p: CaseProgress): string[] =>
  indexCase(def).required.filter((c) => p.pinned.includes(c.id) && !p.missed.includes(c.id)).map((c) => c.id)

export type Grade = 'S' | 'A' | 'B' | 'C'

/** evidence grade for a closed case: counts wrong reports, wrong board drops and wrong decisions; hints cap it at A */
export function gradeOf(def: CaseDef, p: CaseProgress): Grade {
  const drops = Object.values(p.dropWrong).reduce((a, b) => a + b, 0)
  const misses = p.wrongTotal + drops + Math.max(0, p.fixAttempts - 1)
  const hinted = def.kind === 'mystery' ? p.helpUsed : p.hintUsed
  if (misses === 0 && !hinted) return 'S'
  if (misses <= 2) return 'A'
  return misses <= 5 ? 'B' : 'C'
}

/** share of required clues identified on the first report (0..1) */
export function firstTryRate(def: CaseDef, p: CaseProgress): number {
  const req = indexCase(def).required
  return req.length ? firstTryClues(def, p).length / req.length : 1
}
