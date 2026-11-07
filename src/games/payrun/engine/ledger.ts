import { effect } from './week'
import type { Event } from './types'

/** Where this week's money came from and went. Totals are the raw sums of the engine's events. */
export interface LedgerTotals {
  moneyIn: number
  moneyOut: number
  toJar: number
  fromJar: number
  closingPocket: number
  closingJar: number
}

/**
 * Builds the week's totals and checks the ledger identity: opening pocket + money in = money out + jar deposits + closing pocket.
 * (Money out here includes bills paid from the jar and Quick Cash in as money in, so nothing is lost or invented.)
 */
export function buildLedger(events: Event[], opening: { pocket: number; jar: number }): LedgerTotals {
  let pocket = opening.pocket
  let jar = opening.jar
  let moneyIn = 0
  let moneyOut = 0
  let toJar = 0
  let fromJar = 0
  for (const e of events) {
    const d = effect(e)
    pocket += d.pocket
    jar += d.jar
    if (e.t === 'save') toJar += e.amount
    else if (e.t === 'breakjar') {
      fromJar += e.amount
      moneyIn += e.amount - e.shortfall
    } else if (d.pocket > 0) moneyIn += d.pocket
    else if (d.pocket < 0) moneyOut += -d.pocket
  }
  if (opening.pocket + moneyIn !== moneyOut + toJar + pocket) throw new Error('ledger does not balance')
  return { moneyIn, moneyOut, toJar, fromJar, closingPocket: pocket, closingJar: jar }
}

export interface LedgerRow { key: string; amount: number }
export interface WeekLedger {
  in: LedgerRow[]
  out: LedgerRow[]
  aside: LedgerRow[]
  left: number
  /** Where did it go? the week's outflows in six groups (saved is not part of the question) */
  where: { key: 'musthave' | 'bills' | 'wants' | 'treats' | 'lostlent'; amount: number }[]
}

/**
 * The Week Review ledger of section 8. A row appears only when it has a value.
 * Identity (asserted): carried in + all money in = all money out + set aside + pocket now.
 */
export function weekLedger(events: Event[], openPocket: number): WeekLedger {
  const sum = (f: (e: Event) => number) => events.reduce((a, e) => a + f(e), 0)
  const rows = (xs: LedgerRow[]) => xs.filter((r) => r.amount > 0)
  // a bill paid late counts as a bill only for what the pocket covered; the rest shows up later as "late bills and fees"
  const lateUnpaid = sum((e) => (e.t === 'paylate' ? e.shortfall : 0))
  const bills = sum((e) => (e.t === 'bill' ? e.amount : 0)) - lateUnpaid
  const aside = (via: 'share' | 'extra' | 'windfall' | 'sweep') => sum((e) => (e.t === 'save' && e.via === via ? e.amount : 0))
  const inRows = rows([
    { key: 'carried', amount: openPocket },
    { key: 'wage', amount: sum((e) => (e.t === 'wage' ? e.amount : 0)) },
    { key: 'windfall', amount: sum((e) => (e.t === 'windfall' ? e.amount : 0)) },
    { key: 'repaid', amount: sum((e) => (e.t === 'repaid' ? e.amount : 0)) },
    { key: 'quickcash', amount: sum((e) => (e.t === 'quickcash' ? e.amount : 0)) },
    { key: 'fromjar', amount: sum((e) => (e.t === 'breakjar' ? e.amount : 0)) },
  ])
  const outRows = rows([
    { key: 'musthave', amount: sum((e) => (e.t === 'musthave' ? e.amount : 0)) },
    { key: 'instalment', amount: sum((e) => (e.t === 'instalment' ? e.amount : 0)) },
    { key: 'bills', amount: bills },
    { key: 'late', amount: sum((e) => (e.t === 'late' ? e.amount : 0)) },
    { key: 'treats', amount: sum((e) => (e.t === 'treat' ? e.amount : 0)) },
    { key: 'wants', amount: sum((e) => (e.t === 'want' ? e.amount : 0)) },
    { key: 'lent', amount: sum((e) => (e.t === 'lend' ? e.amount : 0)) },
    { key: 'lost', amount: sum((e) => (e.t === 'lost' ? e.amount : 0)) },
  ])
  const asideRows = rows([
    { key: 'share', amount: aside('share') },
    { key: 'moved', amount: aside('extra') + aside('windfall') + aside('sweep') },
  ])
  const left = events.reduce((p, e) => p + effect(e).pocket, openPocket)
  const total = (xs: LedgerRow[]) => xs.reduce((a, r) => a + r.amount, 0)
  if (total(inRows) !== total(outRows) + total(asideRows) + left) throw new Error('ledger does not balance')
  const amt = (k: string) => outRows.find((r) => r.key === k)?.amount ?? 0
  return {
    in: inRows, out: outRows, aside: asideRows, left,
    where: [
      { key: 'musthave', amount: amt('musthave') },
      { key: 'bills', amount: amt('bills') + amt('late') + amt('instalment') },
      { key: 'wants', amount: amt('wants') },
      { key: 'treats', amount: amt('treats') },
      { key: 'lostlent', amount: amt('lost') + amt('lent') },
    ],
  }
}
