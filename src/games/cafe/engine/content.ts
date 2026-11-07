import raw from '../content/items.json'
import type { BillDef, BillId, BottleId, SurpriseDef, TrolleyItemDef, WindowItemDef } from './types'

/** Typed view of content/items.json. An NGO edits the JSON, never this file. */
export const INCOME: number = raw.income
export const GOAL: number = raw.goal
export const COIN: number = raw.coin
export const FIZZ_START = raw.fizzStart as Record<BottleId, number>
export const RELEASE: number = raw.releaseFactor
export const BIG_NIGHT_COST = raw.bigNightCost as 60
export const BIG_NIGHT_CARRY_COST = raw.bigNightCarryCost as 100
export const QUICK_TABLE: Record<number, number> = Object.fromEntries(Object.entries(raw.quickCash).map(([k, v]) => [Number(k), v]))
export const QUICK_MAX = Math.max(...Object.keys(QUICK_TABLE).map(Number))

export const WINDOW_ITEMS = raw.window as WindowItemDef[]
export const WAVES: string[][] = raw.waves
export const TROLLEY_ITEMS = raw.trolley as TrolleyItemDef[]
export const BILL_DEFS = raw.bills as BillDef[]
export const SURPRISES = raw.surprises as SurpriseDef[]
/** small second surprises: the cloud sometimes drops twice */
export const EXTRAS = raw.extras as SurpriseDef[]
export const EXTRA_CHANCE: number = raw.extraChance

export const windowItem = (id: string): WindowItemDef => {
  const it = WINDOW_ITEMS.find((w) => w.id === id)
  if (!it) throw new Error(`unknown window item ${id}`)
  return it
}
export const trolleyItem = (id: string): TrolleyItemDef => {
  const it = TROLLEY_ITEMS.find((w) => w.id === id)
  if (!it) throw new Error(`unknown trolley item ${id}`)
  return it
}
export const billDef = (id: BillId): BillDef => BILL_DEFS.find((b) => b.id === id)!
export const surpriseDef = (id: number): SurpriseDef => SURPRISES.find((s) => s.id === id)!

/** Quick Cash: what you pay back for borrowing `b` (in ₹50 steps). */
export function quickRepay(b: number): number {
  if (b <= 0) return 0
  if (QUICK_TABLE[b] !== undefined) return QUICK_TABLE[b]
  return Math.ceil((b * 1.34) / 5) * 5
}
