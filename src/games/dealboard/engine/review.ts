import type { CompanyId, Decision, LightKey, MarketRun } from './types'
import { COMPANY } from './companies'
import { LIGHT_KEYS, founderAnswer, redFlags } from './lights'
import { reasonCarry } from './reasons'
import { knownQuarter, lightsAt, type RunState } from './state'

export type SkillKey = 'research' | 'skepticism' | 'spread' | 'calm' | 'habits'
export type Verdict = 'good' | 'ok' | 'risky'

/** One thing worth knowing about a decision. `key` is a content key under review.*; params fill its placeholders. */
export interface Pointer {
  kind: 'good' | 'bad' | 'note'
  key: string
  skill: SkillKey
  params: Record<string, string | number>
}

export interface ReviewEntry {
  id: string
  q: number
  type: 'INVEST' | 'SELL' | 'REJECT' | 'HOLD'
  companyId: CompanyId
  amount: number
  /** the reason the player picked: its content key, kind and numbers */
  reason: { key: string; kind: string; params: Record<string, string | number> } | null
  verdict: Verdict
  pointers: Pointer[]
}

/** Names the checks as a list the UI turns into words (check names are translated by the UI from these keys). */
const checkList = (keys: LightKey[]): string => keys.join(',')

/**
 * Grades one decision using only what was knowable when it was made, plus what has happened since.
 * Nothing from quarters the player has not played yet is ever used.
 */
function reviewOne(d: Decision, m: MarketRun, nowQ: number, emergencyDone: boolean, emergencyTurn: number): ReviewEntry {
  const s = d.q - 1
  const id = d.companyId
  const all = lightsAt(m, id, s)
  const known = d.known ?? []
  const p: Pointer[] = []
  const add = (kind: Pointer['kind'], key: string, skill: SkillKey, params: Pointer['params'] = {}) => p.push({ kind, key, skill, params })
  const weak = (keys: LightKey[]) => keys.filter((k) => all[k] === 'R' || founderAnswer(all, id, k) === 'X')
  const hist = m.history[id]
  const rk = d.reasonKind
  const rc = reasonCarry(d)

  if (d.type === 'INVEST') {
    if (known.length >= 2) add('good', 'askedTwo', 'research')
    else if (known.length === 1) add('note', 'askedOne', 'research')
    else add('bad', 'askedNone', 'research')

    const seenWeak = weak(known)
    const unseen = LIGHT_KEYS.filter((k) => !known.includes(k))
    const missed = weak(unseen)
    if (seenWeak.length) add('bad', 'boughtDespiteWeak', 'skepticism', { checks: checkList(seenWeak) })
    else if (known.length) add('good', 'readChecks', 'skepticism')
    if (missed.length) add('bad', 'missedWeak', 'research', { checks: checkList(missed) })

    const anyWeak = LIGHT_KEYS.some((k) => all[k] === 'R')
    if (rk === 'evidence') add('good', 'reasonData', 'research', rc)
    else if (rk === 'headline') add(anyWeak ? 'bad' : 'note', anyWeak ? 'reasonHeadline' : 'reasonHeadlineOk', 'skepticism', rc)
    else if (rk === 'feeling') add('bad', 'reasonFeeling', 'skepticism', rc)
    else if (rk === 'neutral') add('note', 'reasonCurious', 'research', rc)

    const many = (d.positions ?? 1) >= 2
    if (many && (d.share ?? 0) > 0.5) add('bad', 'concentrated', 'spread', { pct: Math.round((d.share ?? 0) * 100), sector: COMPANY[id].sector })
    else if (many && (d.share ?? 1) <= 0.4) add('good', 'diversified', 'spread')
    if ((d.size ?? 0) > 0.4) add('bad', 'bigBet', 'spread', { pct: Math.round((d.size ?? 0) * 100) })
    if ((d.cashAfter ?? 1e9) < 25000 && (!emergencyDone || d.q < emergencyTurn)) add('bad', 'noCushion', 'habits', { r_cash: Math.round(d.cashAfter ?? 0) })
    if (nowQ >= d.q && d.price) {
      const change = hist[nowQ].price / d.price - 1
      add('note', change >= 0 ? 'outcomeBuyUp' : 'outcomeBuyDown', 'calm', { pct: Math.abs(Math.round(change * 100)) })
    }
  } else if (d.type === 'SELL') {
    const reds = redFlags(all)
    const dip = m.banners[d.q - 1].marketShock < 0
    if (d.forced) {
      if ((d.gain ?? 0) < 0 || dip) add('bad', 'forcedSale', 'habits')
      else add('note', 'forcedSaleOk', 'habits')
    } else if (reds >= 1) add('good', 'soldOnWarnings', 'skepticism', { n: reds })
    else if (rk === 'feeling' && dip) add('bad', 'panicSold', 'calm')
    else if (COMPANY[id].sound && (d.held ?? 99) <= 2 && (d.gain ?? 1) < 0.1) add('bad', 'soldTooSoon', 'calm')
    else if (rk === 'evidence') add('good', 'sellData', 'research', rc)
    else if (rk === 'feeling') add('bad', 'sellFeeling', 'calm', rc)
    else if (d.reasonKey === 'ne.lockProfit') add('note', 'sellLockProfit', 'calm', rc)
    else add('note', 'sellNoSignal', 'calm')
    add('note', 'fee', 'habits', { r_fee: Math.round((d.amount ?? 0) * 0.01) })
    if (nowQ >= d.q && d.price) {
      const change = hist[nowQ].price / d.price - 1
      add('note', change < 0 ? 'outcomeSellFell' : 'outcomeSellRose', 'calm', { pct: Math.abs(Math.round(change * 100)) })
    }
  } else if (d.type === 'HOLD') {
    const reds = redFlags(all)
    if (reds >= 2) add('bad', 'heldWeak', 'skepticism', { n: reds })
    else if (reds === 0) add('good', 'heldStrong', 'calm')
    else add('note', 'heldMixed', 'skepticism', { n: reds })
  } else {
    const reds = redFlags(all) + (id === 'payEasy' || id === 'quickRide' ? 1 : 0)
    if (reds >= 2) add('good', 'passedWeak', 'skepticism', { n: reds })
    else if (reds === 0) add('note', 'passedStrong', 'habits')
    else add('note', 'passedMixed', 'skepticism')
    if ((d.flips ?? 0) === 0) add('note', 'passNoAsk', 'research')
    else add('good', 'passAsked', 'research')
    if (rk === 'evidence') add('good', 'passReasonData', 'skepticism', rc)
    else if (rk === 'caution') add(reds >= 2 ? 'good' : 'note', reds >= 2 ? 'passReasonCaution' : 'passReasonCautionOk', 'skepticism', rc)
    else if (rk === 'feeling') add(reds >= 2 ? 'note' : 'bad', reds >= 2 ? 'passReasonFeelingOk' : 'passReasonFeeling', 'skepticism', rc)
  }

  const bads = p.filter((x) => x.kind === 'bad').length
  const verdict: Verdict = d.type === 'REJECT' ? 'ok' : bads === 0 ? 'good' : bads === 1 ? 'ok' : 'risky'
  const finalVerdict: Verdict = d.type === 'REJECT' && p.some((x) => x.key === 'passedWeak') ? 'good' : verdict
  return {
    id: d.id,
    q: d.q,
    type: d.type as ReviewEntry['type'],
    companyId: id,
    amount: d.amount ?? 0,
    reason: d.reasonKey ? { key: d.reasonKey, kind: d.reasonKind ?? 'neutral', params: d.reasonParams ?? {} } : null,
    verdict: finalVerdict,
    pointers: p,
  }
}

/** Every decision so far, newest last, each with a verdict and pointers on what went right and wrong. */
export function reviewDecisions(run: RunState, m: MarketRun): ReviewEntry[] {
  const nowQ = Math.max(0, knownQuarter(run))
  return run.log
    .filter((d) => d.type === 'INVEST' || d.type === 'SELL' || d.type === 'REJECT' || d.type === 'HOLD')
    .map((d) => reviewOne(d, m, nowQ, run.emergencyDone, m.emergencyTurn))
}
