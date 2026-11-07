import type { CompanyId, LightKey, MarketRun } from './types'
import { LIGHT_KEYS, founderAnswer, interestCover } from './lights'
import { hashSeed } from './rng'
import { knownLights, knownQuarter, lightsAt, type RunState } from './state'

/**
 * What kind of reason the player picked:
 * evidence  a true fact from a health check they actually looked at
 * caution   sensible doubt (a story that sounds too good, a founder who dodged)
 * headline  what the company shows off: its pitch, growth, a rising price
 * feeling   hype, fear, a tip
 * neutral   curiosity, keeping cash, locking in a profit, needing the money
 */
export type ReasonKind = 'evidence' | 'caution' | 'headline' | 'feeling' | 'neutral'
export type ReasonCtx = 'invest' | 'buyMore' | 'pass' | 'sell'

export interface ReasonOption {
  /** stable id, e.g. "ev.cashLong" */
  id: string
  /** content key under pick.* (same as id) */
  key: string
  kind: ReasonKind
  /** numbers that fill the sentence (the UI adds the company's name, founder, sector and claim) */
  params: Record<string, string | number>
}

interface Fact { key: string; pos: boolean; params: Record<string, string | number> }

const opt = (key: string, kind: ReasonKind, params: ReasonOption['params'] = {}): ReasonOption => ({ id: key, key, kind, params })

/** True facts about the company from the health checks the player can see. Negative ones are warnings. */
function facts(m: MarketRun, id: CompanyId, q: number, visible: LightKey[]): Fact[] {
  const h = m.history[id]
  const s = h[q]
  const out: Fact[] = []
  if (visible.includes('cash')) {
    if (s.profit >= 0) out.push({ key: 'ev.cashProfit', pos: true, params: {} })
    else {
      const n = Math.round(s.runwayMonths ?? 0)
      out.push(n >= 12 ? { key: 'ev.cashLong', pos: true, params: { n } } : { key: 'ev.cashShort', pos: false, params: { n } })
      out.push({ key: 'ev.noProfit', pos: false, params: {} })
    }
    if (s.valuationYears !== null && s.profit > 0) {
      if (s.valuationYears <= 8) out.push({ key: 'ev.priceCheap', pos: true, params: { n: Math.round(s.valuationYears) } })
      else if (s.valuationYears >= 30) out.push({ key: 'ev.priceDear', pos: false, params: { n: Math.round(s.valuationYears) } })
    }
  }
  if (visible.includes('customers')) {
    const net = s.newCust - s.lostCust
    const paying = s.users > 0 ? s.customers / s.users : 1
    if (paying < 0.1) out.push({ key: 'ev.custInflated', pos: false, params: { pct: Math.round(paying * 100) } })
    else if (net < 0) out.push({ key: 'ev.custLeave', pos: false, params: {} })
    else if (s.retention >= 0.75 && net > 0) out.push({ key: 'ev.custStay', pos: true, params: { pct: Math.round(s.retention * 100) } })
  }
  if (visible.includes('debt')) {
    if (s.debt <= 0.01) out.push({ key: 'ev.debtNone', pos: true, params: {} })
    else {
      const cover = interestCover(s)
      if (cover >= 3) out.push({ key: 'ev.debtCover', pos: true, params: { x: cover.toFixed(1) } })
      else if (cover < 1.5) out.push({ key: 'ev.debtHeavy', pos: false, params: {} })
    }
  }
  if (visible.includes('ceo')) {
    const sells = h.slice(Math.max(1, q - 2), q + 1).filter((x) => x.ceoTrade === 'SELL').length
    if (sells === 0) out.push({ key: 'ev.ceoHolding', pos: true, params: {} })
    else if (sells >= 2) out.push({ key: 'ev.ceoSelling', pos: false, params: {} })
  }
  return out
}

const hashOf = (...parts: (string | number)[]) => hashSeed(parts.join('|'))

/** Same seed, quarter and company always give the same wording and order; a different quarter gives a fresh set. */
function shuffled<T>(xs: T[], seed: number): T[] {
  const a = [...xs]
  let s = seed || 1
  for (let i = a.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    const j = s % (i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Reasons the player can pick for this decision, built from this company's real numbers (only from checks they have
 * looked at, so nothing hidden leaks), its pitch, and a rotating choice of wording. Three to five options.
 */
export function reasonOptions(ctx: ReasonCtx, run: RunState, m: MarketRun, id: CompanyId): ReasonOption[] {
  if (ctx === 'sell' && run.phase === 'emergency') return [opt('ne.forced', 'neutral')]
  const q = Math.max(0, knownQuarter(run))
  const h = m.history[id]
  const s = h[q]
  const prev = h[Math.max(0, q - 1)]
  const lights = lightsAt(m, id, q)
  const visible: LightKey[] = ctx === 'invest' || ctx === 'pass' ? knownLights(run, id) : LIGHT_KEYS
  const answered = visible.filter((k) => founderAnswer(lights, id, k) !== 'X')
  const dodged = visible.some((k) => founderAnswer(lights, id, k) === 'X')
  const f = facts(m, id, q, answered)
  const v = (slot: string, n: number) => hashOf(run.seed, run.turn, id, ctx, slot) % n
  const positive = ctx === 'invest' || ctx === 'buyMore'
  const growth = prev.revenue > 0 ? s.revenue / prev.revenue - 1 : 0
  const move = prev.price > 0 ? s.price / prev.price - 1 : 0
  const opts: ReasonOption[] = []

  f.filter((x) => (positive ? x.pos : !x.pos)).slice(0, 2).forEach((x) => opts.push(opt(x.key, 'evidence', x.params)))

  if (positive) {
    const heads: ReasonOption[] = [opt(`hl.claim${v('claim', 3)}`, 'headline')]
    if (growth >= 0.1) heads.push(opt('hl.growth', 'headline', { pct: Math.round(growth * 100) }))
    if (move >= 0.08) heads.push(opt('hl.momentum', 'headline', { pct: Math.round(move * 100) }))
    opts.push(heads[v('head', heads.length)])
    opts.push(opt(`fe.hype${v('hype', 3)}`, 'feeling'))
    opts.push(opt('ne.curious', 'neutral'))
  } else if (ctx === 'pass') {
    opts.push(opt('ca.tooGood', 'caution'))
    if (dodged) opts.push(opt('ca.dodged', 'caution'))
    opts.push(opt(`fe.risky${v('risky', 3)}`, 'feeling'))
    opts.push(opt(`ne.keepCash${v('cash', 2)}`, 'neutral'))
  } else {
    opts.push(move <= -0.03 ? opt(`fe.scared${v('scared', 2)}`, 'feeling', { pct: Math.round(-move * 100) }) : opt('fe.worry', 'feeling'))
    const hold = run.holdings[id]
    const value = hold ? hold.units * s.price : 0
    if (hold && value > hold.cost * 1.03) opts.push(opt('ne.lockProfit', 'neutral', { pct: Math.round((value / hold.cost - 1) * 100) }))
    opts.push(opt('ne.needCash', 'neutral'))
  }
  return shuffled(opts, hashOf(run.seed, run.turn, id, ctx))
}

/** How a kind counts in the analytics: evidence and caution are "reasoned". */
/** The two ways to answer a hot tip: follow it on a feeling, or ignore it with a note of caution. */
export const tipReasons = (): { follow: ReasonOption; ignore: ReasonOption } => ({ follow: opt('fe.hype2', 'feeling'), ignore: opt('ca.tooGood', 'caution') })

export const kindBucket = (k: ReasonKind | undefined): 'reasoned' | 'headline' | 'feeling' | 'neutral' =>
  k === 'evidence' || k === 'caution' ? 'reasoned' : k === 'headline' ? 'headline' : k === 'feeling' ? 'feeling' : 'neutral'

/** Flat params carrying a decision's reason into pointers and lesson cards (the UI turns them back into a sentence). */
export function reasonCarry(d: { reasonKey?: string; reasonParams?: Record<string, string | number> }): Record<string, string | number> {
  if (!d.reasonKey) return {}
  const out: Record<string, string | number> = { reasonKey: d.reasonKey }
  for (const [k, v] of Object.entries(d.reasonParams ?? {})) out['rp_' + k] = v
  return out
}
