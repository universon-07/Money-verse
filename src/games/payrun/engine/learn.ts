import learning from '../content/learning.json'
import { ECON, card, type FriendCard, type WantCard } from './content'
import { goalWeeks, pace } from './goal'
import type { SeasonDecision } from './replay'
import type { Event, State, WeekScript } from './types'

/** Learning decisions: they change no money, so the money engine ignores them. */
export type LessonLine = { key: string; vars: Record<string, number | string>; money: string[]; goalWeeks: string[]; items: string[] }
export type LearnDecision =
  | { k: 'predict'; answer: string }
  | { k: 'biggest'; group: string }
  | { k: 'nameit'; concept: number }
  | { k: 'apply'; concept: number; answer: 'A' | 'B' | 'C' }
  | { k: 'notebook'; concept: number; sentence: 0 | 1 | 2; line: LessonLine }

export const LEARN_KINDS = ['predict', 'biggest', 'nameit', 'apply', 'notebook'] as const
export const isLearning = (d: SeasonDecision): d is LearnDecision => (LEARN_KINDS as readonly string[]).includes(d.k)

const CONCEPTS = learning.concepts as Record<string, number[]>
const PRED = learning.predictions as Record<string, { options: string[]; bounds?: number[]; nominal?: boolean }>
const APPLY = learning.apply as Record<string, 'A' | 'B' | 'C'>

/** The concepts a week teaches (week 6 carries two). Bonus weeks have no scripted teaching. */
export const weekConcepts = (week: number): number[] => CONCEPTS[String(week)] ?? []
export const conceptWeek = (concept: number): number => Number(Object.entries(CONCEPTS).find(([, cs]) => cs.includes(concept))![0])
export const predictionOptions = (week: number): string[] | null => PRED[String(week)]?.options ?? null
export const applyAnswer = (concept: number) => APPLY[String(concept)]

// ---------- predictions ----------

/** What the week context needs: the script, and the state after Week Review (events, history and balances). */
export interface WeekCtx { script: WeekScript; state: State }

const bucket = (value: number, [lo, hi]: number[]) => (value < lo ? 'low' : value > hi ? 'high' : 'mid')
const surprises = (events: Event[]) => events.filter((e): e is Extract<Event, { t: 'bill' }> => e.t === 'bill' && card(e.id).kind === 'surprise')
const treatSum = (events: Event[]) => events.reduce((a, e) => (e.t === 'treat' ? a + e.amount : a), 0)

/** The true answer to the week's prediction, from the week's own events. */
export function predictionTruth(week: number, { script, state }: WeekCtx): string | null {
  const p = PRED[String(week)]
  if (!p) return null
  const ev = state.events
  switch (week) {
    case 1: return bucket(state.pocket + state.jar, p.bounds!)
    case 2: return bucket(treatSum(ev), p.bounds!)
    case 3: return bucket(state.history.at(-1)!.jarGain, p.bounds!)
    case 4:
      if (ev.some((e) => e.t === 'breakjar')) return 'jar'
      return ev.some((e) => e.t === 'quickcash' || e.t === 'paylate') ? 'borrow' : 'pocket'
    case 5: { const n = surprises(ev).length; return n === 0 ? 'none' : n === 1 ? 'one' : 'many' }
    case 6: {
      const total = Object.values(script.days).reduce((a, id) => (id && id !== '@listed' && card(id).kind === 'want' ? a + (card(id) as WantCard).price : a), 0)
      const weeks = Math.round(total / pace(state.history))
      return weeks <= 1 ? '1' : weeks === 2 ? '2' : '3'
    }
    case 7: return '50'
    case 8: {
      const repays = Object.values(script.days).filter((id) => id && id !== '@listed' && card(id).kind === 'friend' && (card(id) as FriendCard).scriptedRepay).length
      return repays >= 2 ? 'both' : repays === 1 ? 'one' : 'neither'
    }
  }
  return null
}

/** 1 for the right answer, 0.5 for the next bucket along (ordered questions only), else 0. A wrong guess costs nothing. */
export function predictionScore(week: number, answer: string, truth: string): number {
  const p = PRED[String(week)]
  if (answer === truth) return 1
  if (p.nominal) return 0
  return Math.abs(p.options.indexOf(answer) - p.options.indexOf(truth)) === 1 ? 0.5 : 0
}

// ---------- lessons ----------

const line = (key: string, vars: Record<string, number | string> = {}, money: string[] = [], gw: string[] = [], items: string[] = []): LessonLine => ({ key, vars, money, goalWeeks: gw, items })

/**
 * The "what happened" line for a concept: one variant of the spec's section 9, chosen from the student's own week
 * and filled with their own numbers. Nothing here says what they should have done.
 */
export function lessonFor(concept: number, ctx: WeekCtx, prediction?: { answer: string; truth: string }): LessonLine {
  const { script, state } = ctx
  const ev = state.events
  const hist = state.history
  const last = hist.at(-1)!
  const sum = (kind: Event['t'], via?: string) => ev.reduce((a, e) => (e.t === kind && (!via || ('via' in e && e.via === via)) && 'amount' in e ? a + e.amount : a), 0)

  switch (concept) {
    case 1: {
      const actual = state.pocket + state.jar
      return line(prediction && prediction.answer === prediction.truth ? 'L1.close' : 'L1.far', { guess: prediction?.answer ?? 'mid', actual }, ['actual'])
    }
    case 2: {
      const treats = ev.filter((e): e is Extract<Event, { t: 'treat' }> => e.t === 'treat')
      const x = treats.reduce((a, e) => a + e.amount, 0)
      return line('L2.any', { n: treats.length, x, y: x * 4 }, ['x', 'y'])
    }
    case 3: {
      const share = sum('save', 'share')
      if (state.rules.savePct > 0) return line('L3.share', { s: share, g: last.jarGain }, ['s', 'g'])
      return line('L3.none', { m: sum('save', 'extra') + sum('save', 'sweep') + sum('save', 'windfall'), x: Math.round((script.wage * 20) / 100) }, ['m', 'x'])
    }
    case 4: {
      const bill = ev.find((e): e is Extract<Event, { t: 'bill' }> => e.t === 'bill' && card(e.id).kind === 'surprise' && e.amount >= 250)
      const amount = bill?.amount ?? 250
      const bj = ev.find((e): e is Extract<Event, { t: 'breakjar' }> => e.t === 'breakjar')
      const qc = ev.find((e): e is Extract<Event, { t: 'quickcash' }> => e.t === 'quickcash')
      const late = ev.some((e) => e.t === 'paylate')
      const p = bill?.fromPocket ?? 0
      if (bj) return line('L4.jar', { bill: amount, x: bj.shortfall }, ['bill', 'x'])
      if (qc) return line('L4.borrowed', { bill: amount, p, q: qc.amount }, ['bill', 'p', 'q'])
      if (late) return line('L4.late', { bill: amount, p }, ['bill', 'p'])
      const lost = ev.find((e): e is Extract<Event, { t: 'lost' }> => e.t === 'lost')
      return line('L4.pocket', { bill: amount, lost: lost?.amount ?? 0 }, ['bill', 'lost'])
    }
    case 5: {
      const bills = surprises(ev)
      const x = bills.reduce((a, e) => a + e.amount, 0)
      const a = Math.round(hist.reduce((t, w) => t + w.surprises, 0) / hist.length)
      return line('L5.any', { n: bills.length, x, a }, ['x', 'a'])
    }
    case 6: {
      const offers = Object.values(script.days).filter((id) => id && id !== '@listed' && card(id).kind === 'want').length
      return line('L6.any', { n: offers, b: ev.filter((e) => e.t === 'want').length })
    }
    case 7: {
      const bought = ev.find((e): e is Extract<Event, { t: 'want' }> => e.t === 'want')
      if (bought) return line('L7.bought', { item: bought.id, p: bought.amount, k: goalWeeks(hist, bought.amount) }, ['p'], ['k'], ['item'])
      const t = Object.values(script.days).reduce((a, id) => (id && id !== '@listed' && card(id).kind === 'want' ? a + (card(id) as WantCard).price : a), 0)
      return line('L7.passed', { t, k: goalWeeks(hist, t) }, ['t'], ['k'])
    }
    case 8: {
      const qc = ev.find((e): e is Extract<Event, { t: 'quickcash' }> => e.t === 'quickcash')
      if (qc) return line('L8.quickcash', { a: qc.amount, r: qc.owed, e: qc.owed - qc.amount, pct: Math.round(((qc.owed - qc.amount) / qc.amount) * 100) }, ['a', 'r', 'e'])
      const bj = ev.find((e) => e.t === 'breakjar')
      if (bj && bj.t === 'breakjar') {
        const qcAmount = Math.max(ECON.quickCash.min, Math.ceil(bj.shortfall / ECON.quickCash.step) * ECON.quickCash.step)
        return line('L8.jar', { e: qcAmount * (ECON.quickCash.repayMultiplier - 1) }, ['e'])
      }
      if (ev.some((e) => e.t === 'paylate')) return line('L8.late', { fee: ECON.lateFee }, ['fee'])
      return line('L8.pocket', { e: 100 }, ['e'])
    }
    case 9: {
      const lends = ev.filter((e): e is Extract<Event, { t: 'lend' }> => e.t === 'lend')
      const back = (id: string) => ev.some((e) => e.t === 'repaid' && e.id === id)
      const big = lends.filter((l) => l.amount >= 200)
      const lostBig = big.find((l) => !back(l.id))
      if (lostBig) return line('L9.notRepaid', {}, [])
      if (big.length) return line('L9.repaid', { x: big[0].amount }, ['x'])
      if (lends.length) return line(back(lends[0].id) ? 'L9.smallBack' : 'L9.smallNot', {}, [])
      const asked = Object.values(script.days).find((id) => id && id !== '@listed' && card(id).kind === 'friend')
      return line('L9.no', { x: asked ? (card(asked) as FriendCard).ask : 200 }, ['x'])
    }
  }
  return line('L1.far')
}

// ---------- what the student has done, per week ----------

export interface WeekLearn {
  predict?: string
  /** each tap on the biggest-outflow question this week, in order */
  biggest: string[]
  concepts: Record<number, { nameit: boolean; apply: string[]; notebook?: { sentence: number; line: LessonLine } }>
}

/** Reads the learning decisions out of the saved list. A week begins at each "nextweek" marker. */
export function learnState(decisions: SeasonDecision[]): Record<number, WeekLearn> {
  const out: Record<number, WeekLearn> = {}
  let week = 1
  const wk = () => (out[week] ??= { biggest: [], concepts: {} })
  const cs = (c: number) => (wk().concepts[c] ??= { nameit: false, apply: [] })
  for (const d of decisions) {
    if (d.k === 'nextweek') week++
    else if (d.k === 'predict') wk().predict = d.answer
    else if (d.k === 'biggest') wk().biggest.push(d.group)
    else if (d.k === 'nameit') cs(d.concept).nameit = true
    else if (d.k === 'apply') cs(d.concept).apply.push(d.answer)
    else if (d.k === 'notebook') cs(d.concept).notebook = { sentence: d.sentence, line: d.line }
  }
  return out
}

/** Apply: first wrong answer gets a hint and one retry; a second wrong answer shows the right answer. */
export type ApplyStatus = 'open' | 'retry' | 'right' | 'revealed'
export function applyStatus(concept: number, answers: string[]): ApplyStatus {
  const ok = applyAnswer(concept)
  if (answers.includes(ok)) return 'right'
  return answers.length === 0 ? 'open' : answers.length === 1 ? 'retry' : 'revealed'
}

export type LearnStep = { step: 'nameit' | 'apply' | 'notebook'; concept: number }
/** The next unfinished learning step after the Week Review (null when the week's learning is complete). */
export function nextLearnStep(week: number, wl: WeekLearn | undefined): LearnStep | null {
  for (const c of weekConcepts(week)) {
    const s = wl?.concepts[c]
    if (!s?.nameit) return { step: 'nameit', concept: c }
    const st = applyStatus(c, s.apply)
    if (st === 'open' || st === 'retry') return { step: 'apply', concept: c }
    if (!s.notebook) return { step: 'notebook', concept: c }
  }
  return null
}

/** "Where did it go?": the biggest of the spending groups ('saved' is never an option). */
export function biggestGroup(where: { key: string; amount: number }[]): string {
  return where.reduce((best, g) => (g.amount > best.amount ? g : best), where[0]).key
}
