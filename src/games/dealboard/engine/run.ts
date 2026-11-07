import type { CompanyId, Decision, LightKey, MarketRun } from './types'
import { WILD_TIP, wildcardFor } from './wildcards'
import { TURNS, YEAR_ENDS } from './board'
import { TUNING } from './companies'
import { EMERGENCY_COST } from './events'
import { redFlags } from './lights'
import { tipReasons, type ReasonOption } from './reasons'
import { collectEarned, collectLessons, houseCard, type LessonRef, type QuarterEvents } from './lessons'
import {
  CASH_DRAG, MIN_BID, reviewFor, TRADE_FEE, decisionQ, investedAt, knownLights, knownQuarter, lightsAt, marketFor,
  netWorthAt, pitchFor, priceAt, sectorShares, type EmergencySale, type RunState,
} from './state'

export * from './state'

export type Action =
  | { type: 'brief' }
  | { type: 'ask'; companyId: CompanyId; light: LightKey }
  | { type: 'bid'; companyId: CompanyId; amount: number; reason: ReasonOption }
  | { type: 'pass'; companyId: CompanyId; reason?: ReasonOption | null }
  | { type: 'buyMore'; companyId: CompanyId; amount: number; reason: ReasonOption }
  | { type: 'sell'; companyId: CompanyId; fraction: number; reason: ReasonOption }
  | { type: 'repay' }
  | { type: 'hold'; companyId: CompanyId }
  | { type: 'payEmergency' }
  | { type: 'continue' }
  | { type: 'tip'; follow: boolean }
  | { type: 'task'; choice: number }
  | { type: 'rewind' }

const why = (r: ReasonOption | null | undefined) => (r ? { reason: r.id, reasonKey: r.key, reasonKind: r.kind, reasonParams: r.params } : {})

const strip = (r: RunState): Omit<RunState, 'checkpoints'> => {
  const { checkpoints: _c, ...rest } = r
  void _c
  return rest
}

export const canBuy = (run: RunState): boolean => run.jailedTurn !== decisionQ(run)

const decision = (run: RunState, type: Decision['type'], companyId: CompanyId, extra: Partial<Decision> = {}): Decision => ({
  id: `${decisionQ(run)}-${run.log.length}`,
  q: decisionQ(run),
  type,
  companyId,
  tabsOpened: [],
  questionsAsked: [],
  ...extra,
})

function buy(run: RunState, m: MarketRun, id: CompanyId, amount: number, reason: ReasonOption): RunState {
  const q = knownQuarter(run)
  const price = priceAt(m, id, q)
  if (price <= 0 || amount < MIN_BID || amount > run.cash || !canBuy(run) || run.phase !== 'desk') return run
  const fee = Math.round(amount * TRADE_FEE)
  const prev = run.holdings[id]
  const holdings = {
    ...run.holdings,
    [id]: { units: (prev?.units ?? 0) + (amount - fee) / price, cost: (prev?.cost ?? 0) + amount, since: prev?.since ?? decisionQ(run) },
  }
  const after = { ...run, holdings, cash: run.cash - amount }
  const shares = Object.values(sectorShares(after, m, q)) as number[]
  const nw = netWorthAt(run, m, q)
  const known = knownLights(run, id)
  return {
    ...after,
    feesPaid: run.feesPaid + fee,
    trades: run.trades + 1,
    pitched: run.pitched.includes(id) ? run.pitched : [...run.pitched, id],
    log: [...run.log, decision(run, 'INVEST', id, {
      amount, ...why(reason), price, flips: Math.min(2, known.length), known,
      share: shares.length ? Math.max(...shares) : 0, positions: Object.keys(holdings).length, cashAfter: after.cash, size: nw > 0 ? amount / nw : 0,
    })],
  }
}

function sell(run: RunState, m: MarketRun, id: CompanyId, fraction: number, reason: ReasonOption): RunState {
  const h = run.holdings[id]
  const q = knownQuarter(run)
  if (!h || fraction <= 0) return run
  const f = Math.min(1, fraction)
  const price = priceAt(m, id, q)
  const unitsSold = h.units * f
  const gross = unitsSold * price
  const fee = Math.round(gross * TRADE_FEE)
  const costPart = h.cost * f
  const gain = costPart > 0 ? (gross - fee) / costPart - 1 : 0
  const holdings = { ...run.holdings }
  if (f >= 0.999) delete holdings[id]
  else holdings[id] = { ...h, units: h.units - unitsSold, cost: h.cost - costPart }
  const forced = run.phase === 'emergency'
  const sale: EmergencySale = { companyId: id, atLoss: gain < 0, inDip: m.banners[decisionQ(run) - 1].marketShock < 0 }
  return {
    ...run,
    cash: run.cash + Math.round(gross - fee),
    feesPaid: run.feesPaid + fee,
    trades: run.trades + 1,
    holdings,
    soldThisTurn: run.soldThisTurn + gross,
    soldRed: run.soldRed || redFlags(lightsAt(m, id, q)) > 0,
    emergencySales: forced ? [...run.emergencySales, sale] : run.emergencySales,
    log: [...run.log, decision(run, 'SELL', id, { amount: Math.round(gross), ...why(reason), price, gain, held: decisionQ(run) - h.since, forced })],
  }
}

/** Opens the next quarter's desk, remembering how it began so the player can replay it. */
function advance(r: RunState, m: MarketRun): RunState {
  if (r.turn >= TURNS) return { ...r, phase: 'done' }
  const turn = r.turn + 1
  const next: RunState = { ...r, turn, phase: 'desk', lesson: null, asked: {}, soldThisTurn: 0, soldRed: false, emergencySales: [] }
  // a surprise bill or a windfall lands as the quarter opens; a tip waits for the player's answer
  const wild = wildcardFor(r.seed, turn, m.picked, m.emergencyTurn)
  if (wild && wild.kind === 'bill') {
    const delta = -Math.min(next.cash, wild.amount)
    next.cash += delta
    next.wild = { ...(r.wild ?? {}), [turn]: { state: 'applied', delta } }
  }
  next.turnStartInvested = investedAt(next, m, turn - 1)
  next.checkpoints = { ...r.checkpoints, [turn]: strip(next) }
  return next
}

/** Quarter ends: loan interest, idle-cash drag, trackers, then lessons or straight on to the next desk. */
function closeQuarter(run: RunState, m: MarketRun, emergency: QuarterEvents['emergency']): RunState {
  const t = run.turn
  const r: RunState = { ...run, flagged: [...run.flagged], queue: [...run.queue], shown: { ...run.shown }, seen: [...run.seen] }

  if (r.loan > 0) {
    const interest = Math.round(r.loan * TUNING.loanRate)
    if (r.cash >= interest) r.cash -= interest
    else {
      r.loan += interest - r.cash
      r.cash = 0
    }
    r.loanInterest += interest
  }
  if (t === TURNS && r.loan > 0) {
    const pay = Math.min(r.cash, r.loan)
    r.cash -= pay
    r.loan -= pay
  }
  const drag = Math.round(r.cash * CASH_DRAG)
  r.cash -= drag
  r.cashDragLost += drag
  r.lastDrag = drag

  const nw = netWorthAt(r, m, t)
  r.cashStreak = nw > 0 && r.cash >= 0.6 * nw ? r.cashStreak + 1 : 0
  r.cashStreakMax = Math.max(r.cashStreakMax, r.cashStreak)
  const shares = Object.values(sectorShares(r, m, t)) as number[]
  r.spread = [...r.spread, { top: shares.length ? Math.max(...shares) : 0, holdings: Object.keys(r.holdings).length }]
  r.series = [...r.series, { q: t, cash: r.cash, invested: investedAt(r, m, t), loan: r.loan }]

  // panic sell: 70% or more of invested money in one market-wide fall quarter, nothing sold had a red check
  const jail = m.banners[t - 1].marketShock < 0 && r.turnStartInvested > 0 && r.soldThisTurn >= 0.7 * r.turnStartInvested && !r.soldRed
  if (jail) {
    r.jails += 1
    r.jailedTurn = t + 1
  }

  const fresh = [...collectLessons(r, m, { jail, emergency }), ...collectEarned(r, m)]
  for (const ref of fresh) {
    if ((r.shown[ref.id] ?? 0) >= 2 || r.queue.some((q) => q.id === ref.id)) continue
    r.queue.push(ref)
  }
  const next = r.queue.shift() ?? null
  r.after = YEAR_ENDS.includes(t) ? 'yearEnd' : 'desk'
  if (r.after === 'yearEnd' && !r.seen.includes(11)) r.seen.push(11)
  if (next) {
    r.lesson = next
    r.shown[next.id] = (r.shown[next.id] ?? 0) + 1
    if (!r.seen.includes(next.id)) r.seen.push(next.id)
    if (next.id >= 100) r.positives = [...r.positives, Math.ceil(t / 4)]
    r.phase = 'lesson'
    return r
  }
  if (r.after === 'yearEnd') return { ...r, phase: 'yearEnd' }
  return advance(r, m)
}

/** The player is done with this quarter's decision: handle a family emergency first, else close the quarter. */
function finish(run: RunState, m: MarketRun): RunState {
  if (run.turn === m.emergencyTurn && !run.emergencyDone) return { ...run, phase: 'emergency' }
  return closeQuarter(run, m, null)
}

/** Pure turn reducer. Illegal actions for the current phase return the state unchanged. */
export function act(run: RunState, a: Action): RunState {
  const m = marketFor(run.seed)
  switch (a.type) {
    case 'brief': {
      if (run.briefed) return run
      const start = { ...run, briefed: true }
      return { ...start, checkpoints: { ...run.checkpoints, [run.turn]: strip(start) } }
    }

    case 'ask': {
      if (run.phase !== 'desk' || pitchFor(run, m) !== a.companyId) return run
      const asked = run.asked[a.companyId] ?? []
      if (asked.length >= 2 || asked.includes(a.light)) return run
      const seen = run.unlocked[a.companyId] ?? []
      return {
        ...run,
        asked: { ...run.asked, [a.companyId]: [...asked, a.light] },
        unlocked: { ...run.unlocked, [a.companyId]: seen.includes(a.light) ? seen : [...seen, a.light] },
      }
    }

    case 'bid': {
      if (run.phase !== 'desk' || pitchFor(run, m) !== a.companyId) return run
      const next = buy(run, m, a.companyId, a.amount, a.reason)
      return next === run ? run : finish(next, m)
    }

    case 'pass': {
      if (run.phase !== 'desk' || pitchFor(run, m) !== a.companyId) return run
      const known = knownLights(run, a.companyId)
      return finish({
        ...run,
        pitched: run.pitched.includes(a.companyId) ? run.pitched : [...run.pitched, a.companyId],
        log: [...run.log, decision(run, 'REJECT', a.companyId, { price: priceAt(m, a.companyId, knownQuarter(run)), flips: Math.min(2, known.length), known, ...why(a.reason) })],
      }, m)
    }

    case 'hold': {
      // the quarterly check-in when you own everything: keep holding is a decision too, and it is graded
      if (run.phase !== 'desk' || reviewFor(run, m) !== a.companyId) return run
      return finish({ ...run, log: [...run.log, decision(run, 'HOLD', a.companyId, { price: priceAt(m, a.companyId, knownQuarter(run)), known: ['cash', 'customers', 'debt', 'ceo'] })] }, m)
    }

    case 'repay':
      if (run.phase !== 'desk' || run.loan <= 0 || run.cash < run.loan) return run
      return { ...run, cash: run.cash - run.loan, loan: 0 }

    case 'buyMore':
      if (!run.holdings[a.companyId]) return run
      return buy(run, m, a.companyId, a.amount, a.reason)

    case 'sell':
      if (run.phase !== 'desk' && run.phase !== 'emergency') return run
      return sell(run, m, a.companyId, a.fraction, a.reason)

    case 'payEmergency': {
      if (run.phase !== 'emergency') return run
      const pay = Math.min(run.cash, EMERGENCY_COST)
      const short = EMERGENCY_COST - pay
      const forced = run.emergencySales.find((s) => s.atLoss || s.inDip)
      const paid: RunState = {
        ...run,
        cash: run.cash - pay,
        loan: run.loan + short,
        emergencyDone: true,
        emergencyForcedSale: run.emergencyForcedSale || !!forced,
      }
      let ev: QuarterEvents['emergency'] = null
      if (forced) {
        const last = run.log.filter((d) => d.type === 'SELL' && d.companyId === forced.companyId).at(-1)
        ev = { companyId: forced.companyId, lossPct: forced.atLoss && last?.gain !== undefined ? Math.round(-last.gain * 100) : null }
      }
      return closeQuarter(paid, m, ev)
    }

    case 'continue': {
      if (run.phase === 'lesson') return run.after === 'yearEnd' ? { ...run, lesson: null, phase: 'yearEnd' } : advance({ ...run, lesson: null }, m)
      if (run.phase !== 'yearEnd') return run
      return advance(run, m)
    }

    case 'task': {
      const w = wildcardFor(run.seed, run.turn, m.picked, m.emergencyTurn)
      if (run.phase !== 'desk' || !w || w.kind !== 'gift' || run.wild?.[run.turn]) return run
      const right = a.choice === 0
      return { ...run, cash: run.cash + (right ? w.amount : 0), wild: { ...(run.wild ?? {}), [run.turn]: { state: right ? 'earned' : 'missed', delta: right ? w.amount : 0 } } }
    }

    case 'tip': {
      const w = wildcardFor(run.seed, run.turn, m.picked, m.emergencyTurn)
      if (run.phase !== 'desk' || !w || w.kind !== 'tip' || !w.companyId || run.wild?.[run.turn]) return run
      const id = w.companyId
      const reasons = tipReasons()
      if (a.follow) {
        const bought = buy(run, m, id, WILD_TIP, reasons.follow)
        if (bought === run) return run
        return { ...bought, wild: { ...(run.wild ?? {}), [run.turn]: { state: 'followed', delta: -WILD_TIP } } }
      }
      const known = knownLights(run, id)
      return {
        ...run,
        wild: { ...(run.wild ?? {}), [run.turn]: { state: 'ignored', delta: 0 } },
        log: [...run.log, decision(run, 'REJECT', id, { price: priceAt(m, id, knownQuarter(run)), flips: Math.min(2, known.length), known, ...why(reasons.ignore) })],
      }
    }

    case 'rewind': {
      const year = Math.ceil(run.turn / 4)
      const snap = run.checkpoints[run.turn]
      if (run.phase !== 'lesson' || !snap || run.rewinds.includes(year)) return run
      const restored = { ...snap, checkpoints: Object.fromEntries(Object.entries(run.checkpoints).filter(([k]) => Number(k) <= run.turn)) } as RunState
      return { ...restored, shown: run.shown, seen: run.seen, wild: run.wild, positives: run.positives, flagged: run.flagged, rewinds: [...run.rewinds, year] }
    }
  }
}

/** Year-end review: shows the houses (compounding) card. */
export function yearEndCard(run: RunState, m: MarketRun): LessonRef {
  return houseCard(run, m)
}
