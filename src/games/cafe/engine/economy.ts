import { draw, rngFor } from '../../../lib/rng'
import {
  BIG_NIGHT_CARRY_COST, BIG_NIGHT_COST, BILL_DEFS, COIN, FIZZ_START, GOAL, INCOME, QUICK_MAX, SURPRISES, TROLLEY_ITEMS, WAVES,
  billDef, EXTRA_CHANCE, EXTRAS, quickRepay, surpriseDef, trolleyItem, windowItem,
} from './content'
import { decline, popped, release } from './pressure'
import type {
  BigNightChoice, BillId, BottleId, GoalId, Jars, LedgerLine, Payment, Run, Source, TejaChoice,
} from './types'

/**
 * All money logic, as pure functions: (run, choice) -> new run. Screens never change money themselves.
 * Same seed + same choices = same month.
 */

export const jarsTotal = (j: Jars) => j.spend + j.save + j.emergency
export const paid = (p: Payment, s: Source) => p[s] ?? 0
export const paymentTotal = (p: Payment) => paid(p, 'spend') + paid(p, 'save') + paid(p, 'emergency') + paid(p, 'quick')

const shuffle = <T,>(xs: T[], seed: string): T[] => {
  const r = rngFor(seed)
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export interface NewRunOpts {
  seed: string
  goal: GoalId
  month?: number
  /** bottles that were stayed-in on last month: they start full */
  carry?: Partial<Record<BottleId, boolean>>
  /** last month's surprise, never repeated */
  lastSurprise?: number
}

export function newRun({ seed, goal, month = 1, carry = {}, lastSurprise }: NewRunOpts): Run {
  // Month 1 is always the cracked phone; later months draw a different surprise (never one that needs a classroom check)
  const bank = SURPRISES.filter((s) => !s.testFirst && s.id !== lastSurprise)
  const surprise = month === 1 ? surpriseDef(1) : bank[Math.floor(draw(seed, 'surprise') * bank.length)]
  const fizz = {
    fun: carry.fun ? 100 : FIZZ_START.fun,
    friends: carry.friends ? 100 : FIZZ_START.friends,
  }
  return {
    month,
    seed,
    goal,
    jars: { spend: 0, save: 0, emergency: 0 },
    fizz,
    refused: [],
    carried: { fun: !!carry.fun, friends: !!carry.friends },
    bigNight: null,
    bills: {},
    window: [],
    trolley: [],
    worth: {},
    lent: 0,
    gift: 0,
    hasCover: false,
    surprise: { id: surprise.id, bill: surprise.bill },
    extra: draw(seed, 'extra') < EXTRA_CHANCE ? (({ id, bill }) => ({ id, bill }))(EXTRAS[Math.floor(draw(seed, 'extraWhich') * EXTRAS.length)]) : null,
    rainPaid: {},
    rainPaid2: {},
    loan: { borrowed: 0, repay: 0 },
    ledger: [],
    ledgerOpened: 0,
    fineOpened: false,
    borrowedWithoutReading: false,
    saveForWants: 0,
    saveGoalMoves: 0,
    tableSpoke: false,
    waves: month === 1 ? WAVES.map((w) => [...w]) : shuffle(WAVES.map((w) => [...w]), `${seed}:waves`),
    trolleyOrder: month === 1 ? TROLLEY_ITEMS.map((t) => t.id) : shuffle(TROLLEY_ITEMS.map((t) => t.id), `${seed}:trolley`),
    tejaReason: month === 1 ? 'match' : 'kit',
  }
}

/** the bills for this month: Month 2 moves one amount by ₹10 (the Auto fare) */
export function billAmount(run: Run, id: BillId): number {
  const base = billDef(id).amount
  return run.month > 1 && id === 'auto' ? base + 10 : base
}
export const billsInOrder = (): BillId[] => BILL_DEFS.map((b) => b.id)

const line = (run: Run, l: LedgerLine): Run => ({ ...run, ledger: [...run.ledger, l] })

/* ------------------------------------------------------------------ payday */

export function paydayError(j: Jars): string | null {
  const vals = [j.spend, j.save, j.emergency]
  if (vals.some((v) => v < 0 || v % COIN !== 0)) return 'coins'
  if (jarsTotal(j) !== INCOME) return 'notAll'
  return null
}

export function confirmPayday(run: Run, j: Jars): Run {
  const err = paydayError(j)
  if (err) throw new Error(`payday: ${err}`)
  let r: Run = { ...run, jars: { ...j }, payday: { ...j } }
  r = line(r, { day: 1, key: 'income', vars: { x: INCOME }, note: 'counted' })
  r = line(r, { day: 1, key: 'split', vars: { s: j.save, e: j.emergency, p: j.spend }, note: j.save >= 100 ? 'paidFirst' : j.save === 0 ? 'shelfEmpty' : undefined })
  return r
}

/* ------------------------------------------------------------------ the source rule */

export interface PayOpts {
  /** Quick Cash is offered for bills and the rain, never for wants */
  quick?: boolean
}

/** null if `p` covers exactly `amount` from what the player actually has */
export function paymentError(run: Run, amount: number, p: Payment, opts: PayOpts = {}): string | null {
  for (const s of ['spend', 'save', 'emergency'] as const) {
    const v = paid(p, s)
    if (v < 0 || v % COIN !== 0) return 'coins'
    if (v > run.jars[s]) return 'notEnough'
  }
  const q = paid(p, 'quick')
  if (q) {
    if (!opts.quick) return 'noQuick'
    if (q % 50 !== 0) return 'quickSteps'
    if (run.loan.borrowed + q > QUICK_MAX) return 'quickMax'
  }
  const own = paid(p, 'spend') + paid(p, 'save') + paid(p, 'emergency')
  const gap = amount - own
  if (gap < 0) return 'tooMuch'
  if (q === 0) return gap === 0 ? null : 'short'
  // a Quick Cash step may be larger than the gap; it must be the smallest step that covers it
  if (q < gap || q - gap >= 50) return 'short'
  return null
}

export type PayReason = 'bill' | 'want' | 'little' | 'bignight' | 'rain'

/** take a payment from the jars. Quick Cash beyond the gap lands in the tumbler. */
export function applyPayment(run: Run, amount: number, p: Payment, reason: PayReason): Run {
  const own = paid(p, 'spend') + paid(p, 'save') + paid(p, 'emergency')
  const q = paid(p, 'quick')
  const excess = q ? q - (amount - own) : 0
  const jars: Jars = {
    spend: run.jars.spend - paid(p, 'spend') + excess,
    save: run.jars.save - paid(p, 'save'),
    emergency: run.jars.emergency - paid(p, 'emergency'),
  }
  const borrowed = run.loan.borrowed + q
  const fromSave = paid(p, 'save') > 0
  return {
    ...run,
    jars,
    loan: { borrowed, repay: quickRepay(borrowed) },
    saveGoalMoves: run.saveGoalMoves + (fromSave ? 1 : 0),
    saveForWants: run.saveForWants + (fromSave && (reason === 'want' || reason === 'little' || reason === 'bignight') ? 1 : 0),
  }
}

/** a sensible default for the source picker: the tumbler first, nothing else (the player chooses the rest) */
export function startingPayment(run: Run, amount: number): Payment {
  const s = Math.min(run.jars.spend, amount)
  return s > 0 ? { spend: s } : {}
}

/* ------------------------------------------------------------------ bills (needs: they cannot be passed) */

export function payBill(run: Run, id: BillId, p: Payment): Run {
  const amount = billAmount(run, id)
  const err = paymentError(run, amount, p, { quick: true })
  if (err) throw new Error(`bill ${id}: ${err}`)
  let r = applyPayment(run, amount, p, 'bill')
  r = { ...r, bills: { ...r.bills, [id]: { amount, paid: { ...p } } } }
  const day = billDef(id).day
  return line(r, { day, key: `bill.${id}`, vars: { x: amount, from: sourceList(p) }, note: paid(p, 'save') > 0 ? 'billFromSave' : undefined })
}

/* ------------------------------------------------------------------ the window (phase 1) */

export function buyWindow(run: Run, id: string, p: Payment, via: 'get' | 'cool'): Run {
  const it = windowItem(id)
  const err = paymentError(run, it.price, p)
  if (err) throw new Error(`window ${id}: ${err}`)
  let r = applyPayment(run, it.price, p, 'want')
  if (it.kind === 'fizz') r = release(r, it.bottle, it.pull)
  r = {
    ...r,
    hasCover: r.hasCover || id === 'cover',
    window: [...r.window, { itemId: id, action: via, bought: true, coolResult: via === 'cool' ? 'still' : undefined, fromSave: paid(p, 'save') }],
  }
  const note = via === 'cool' ? 'waitedStill' : it.price >= 100 ? 'onTheSpot' : undefined
  return line(r, { day: 3, key: 'bought', vars: { item: id, x: it.price }, note })
}

/** passed, cooled and dropped, or sold out while cooling */
export function declineWindow(run: Run, id: string, how: 'pass' | 'dropped' | 'soldout'): Run {
  const it = windowItem(id)
  let r = it.kind === 'fizz' ? decline(run, it.bottle, it.pull, id) : run
  r = {
    ...r,
    window: [...r.window, { itemId: id, action: how === 'pass' ? 'pass' : 'cool', bought: false, coolResult: how === 'pass' ? undefined : how, fromSave: 0 }],
  }
  return how === 'dropped' ? line(r, { day: 3, key: 'dropped', vars: { item: id, x: it.price }, note: 'waitedLost' }) : r
}

/* ------------------------------------------------------------------ the trolley (phase 2) */

export function trolleyOk(run: Run, id: string, p: Payment): Run {
  const it = trolleyItem(id)
  const err = paymentError(run, it.price, p)
  if (err) throw new Error(`trolley ${id}: ${err}`)
  let r = applyPayment(run, it.price, p, 'little')
  r = release(r, it.bottle, it.pull)
  return { ...r, trolley: [...r.trolley, { itemId: id, action: 'ok', fromSave: paid(p, 'save') }] }
}

export function trolleySkip(run: Run, id: string): Run {
  const it = trolleyItem(id)
  const r = decline(run, it.bottle, it.pull, id)
  return { ...r, trolley: [...r.trolley, { itemId: id, action: 'skip', fromSave: 0 }] }
}

export const littleTotal = (run: Run) => run.trolley.filter((t) => t.action === 'ok').reduce((a, t) => a + trolleyItem(t.itemId).price, 0)
export const guessBand = (x: number): 0 | 1 | 2 | 3 => (x <= 45 ? 0 : x <= 100 ? 1 : x <= 150 ? 2 : 3)

/* ------------------------------------------------------------------ Big Night (phase 3, only if a bottle popped) */

export function bigNightDue(run: Run): BottleId[] {
  return run.bigNight ? [] : popped(run)
}

export function openBigNight(run: Run): Run {
  const bottles = popped(run)
  if (!bottles.length) return run
  const carried = bottles.some((b) => run.carried[b])
  return { ...run, bigNight: { cost: carried ? BIG_NIGHT_CARRY_COST : BIG_NIGHT_COST, bottles, paid: {} } }
}

export const bigNightPrice = (run: Run, c: BigNightChoice) => (!run.bigNight || c === 'stay' ? 0 : c === 'half' ? run.bigNight.cost / 2 : run.bigNight.cost)

export function chooseBigNight(run: Run, c: BigNightChoice, p: Payment = {}): Run {
  if (!run.bigNight) throw new Error('no big night')
  const price = bigNightPrice(run, c)
  let r = run
  if (price) {
    const err = paymentError(run, price, p)
    if (err) throw new Error(`bignight: ${err}`)
    r = applyPayment(run, price, p, 'bignight')
  }
  const fizz = { ...r.fizz }
  for (const b of run.bigNight.bottles) fizz[b] = c === 'go' ? 0 : c === 'half' ? 50 : Math.max(100, fizz[b])
  r = { ...r, fizz, bigNight: { ...run.bigNight, choice: c, paid: { ...p } } }
  return line(r, { day: 14, key: `bignight.${c}`, vars: { x: price }, note: c === 'stay' ? 'stayedIn' : c === 'go' ? 'went' : 'half' })
}

/* ------------------------------------------------------------------ Teja (phase 3) */

export const TEJA_AMOUNT: Record<TejaChoice, number> = { lend100: 100, lend50: 50, gift30: 30, no: 0 }

export function tejaAvailable(run: Run): TejaChoice[] {
  const s = run.jars.spend
  return (['lend100', 'lend50', 'gift30', 'no'] as TejaChoice[]).filter((c) => TEJA_AMOUNT[c] <= s)
}

/** lending only ever comes out of Spend */
export function chooseTeja(run: Run, c: TejaChoice): Run {
  if (!tejaAvailable(run).includes(c)) throw new Error(`teja: ${c} not affordable`)
  const x = TEJA_AMOUNT[c]
  const r: Run = {
    ...run,
    spendBeforeTeja: run.jars.spend,
    tejaChoice: c,
    jars: { ...run.jars, spend: run.jars.spend - x },
    lent: c === 'lend100' || c === 'lend50' ? x : 0,
    gift: c === 'gift30' ? x : 0,
  }
  return line(r, { day: 16, key: `teja.${c}`, vars: { x }, note: c === 'gift30' ? 'gladly' : c === 'no' ? 'nextChai' : 'friday' })
}

/* ------------------------------------------------------------------ the rain (phase 4) */

export const rainBill = (run: Run): number => (run.surprise.id === 1 && run.hasCover ? surpriseDef(1).coverBill! : run.surprise.bill)

export function payRain(run: Run, p: Payment): Run {
  const bill = rainBill(run)
  const err = paymentError(run, bill, p, { quick: true })
  if (err) throw new Error(`rain: ${err}`)
  let r = applyPayment(run, bill, p, 'rain')
  if (paid(p, 'quick') && !run.fineOpened) r = { ...r, borrowedWithoutReading: true }
  r = { ...r, rainPaid: { ...p } }
  const e = paid(p, 'emergency')
  return line(r, { day: 23, key: `rain.${run.surprise.id}`, vars: { x: bill, from: sourceList(p) }, note: e >= 100 ? 'dry' : e === 0 ? 'wet' : undefined })
}

export const extraBill = (run: Run): number => run.extra?.bill ?? 0

/** the second, smaller surprise (only when the cloud dropped twice) */
export function payExtra(run: Run, p: Payment): Run {
  if (!run.extra) throw new Error('no second surprise this month')
  const bill = run.extra.bill
  const err = paymentError(run, bill, p, { quick: true })
  if (err) throw new Error(`extra: ${err}`)
  let r = applyPayment(run, bill, p, 'rain')
  if (paid(p, 'quick') && !run.fineOpened) r = { ...r, borrowedWithoutReading: true }
  r = { ...r, rainPaid2: { ...p } }
  return line(r, { day: 26, key: `rain.${run.extra.id}`, vars: { x: bill, from: sourceList(p) } })
}

/* ------------------------------------------------------------------ small records */

export const tagWorth = (run: Run, key: string, tag: 'glad' | 'meh'): Run => ({ ...run, worth: { ...run.worth, [key]: tag } })
export const openLedger = (run: Run): Run => ({ ...run, ledgerOpened: run.ledgerOpened + 1 })
export const openFinePrint = (run: Run): Run => ({ ...run, fineOpened: true })
export const goalProgress = (run: Run) => Math.min(1, run.jars.save / GOAL)

/** every purchase the player could tag in "Worth it?": window buys and trolley OKs (bills were not choices) */
export function boughtThings(run: Run): { key: string; itemId: string; price: number; trolley: boolean }[] {
  const out: { key: string; itemId: string; price: number; trolley: boolean }[] = []
  run.window.forEach((w, i) => { if (w.bought) out.push({ key: `w${i}`, itemId: w.itemId, price: windowItem(w.itemId).price, trolley: false }) })
  run.trolley.forEach((t, i) => { if (t.action === 'ok') out.push({ key: `t${i}`, itemId: t.itemId, price: trolleyItem(t.itemId).price, trolley: true }) })
  return out
}

/** "umbrella stand ₹100, tumbler ₹50": stored as keys and amounts so it translates */
export function sourceList(p: Payment): string {
  return (['emergency', 'spend', 'save', 'quick'] as Source[]).filter((s) => paid(p, s) > 0).map((s) => `${s}:${paid(p, s)}`).join(',')
}
