import { canPayLater, maxHaggles, schedule } from './contract'
import { RULES, item } from './content'
import type { Choices, Contract, GoalId, Plan, Point, ShortfallAction, ShortfallMap } from './types'

/** Everything a player decides. The whole game state is rebuilt by replaying this list. */
export type Decision =
  | { k: 'seen'; screen: string }
  | { k: 'goals'; ranked: GoalId[] }
  | { k: 'predict'; id: 'P1' | 'P2' | 'P3' | 'P4'; answer: string }
  | { k: 'read'; item: 'basic' }
  | { k: 'haggle'; item: string }
  | { k: 'payLater'; item: string }
  | { k: 'sign'; item: string; qty?: number }
  | { k: 'drop'; item: string }
  | { k: 'plateQty'; qty: number }
  | { k: 'lock' }
  | { k: 'event'; id: 'E2' | 'E4'; choice: string }
  | { k: 'shortfall'; point: Point; item?: string; action: ShortfallAction['action'] }

export interface Deal { haggles: number; late: boolean }
export interface Market {
  actionsLeft: number
  deals: Record<string, Deal>
  readBasic: boolean
  signed: Contract[]
  locked: boolean
}

export const DEFAULT_PLATES = 450
const HALL: Contract = { id: 'hall', haggles: 0, qty: 1, late: false }
const clampPlates = (q: number) => Math.min(RULES.plateMax, Math.max(RULES.plateMin, Math.round(q / RULES.plateStep) * RULES.plateStep))

export const isSigned = (m: Pick<Market, 'signed'>, id: string) => m.signed.some((c) => c.id === id)
export const dealOf = (m: Pick<Market, 'deals'>, id: string): Deal => m.deals[id] ?? { haggles: 0, late: false }

/** Why an item can't be signed right now (null = it can). The Combo already contains sound, lights and a safety pack. */
export function signBlock(m: Pick<Market, 'signed' | 'locked'>, id: string): 'locked' | 'signed' | 'sameKind' | 'combo' | null {
  if (m.locked) return 'locked'
  if (isSigned(m, id)) return 'signed'
  const cat = item(id).cat
  const cats = m.signed.map((c) => item(c.id).cat)
  if (cats.includes(cat)) return 'sameKind'
  if (cat === 'combo' && cats.some((c) => ['sound', 'lights', 'safety'].includes(c))) return 'combo'
  if (['sound', 'lights', 'safety'].includes(cat) && cats.includes('combo')) return 'combo'
  return null
}

const spent = (m: Market) => RULES.actions - m.actionsLeft

/** Rebuilds the market from the log. A decision that isn't allowed (no actions left, already signed, locked) is ignored. */
export function marketOf(log: Decision[]): Market {
  const m: Market = { actionsLeft: RULES.actions, deals: {}, readBasic: false, signed: [{ ...HALL }], locked: false }
  const deal = (id: string) => (m.deals[id] ??= { haggles: 0, late: false })
  for (const d of log) {
    if (m.locked && d.k !== 'lock') continue
    switch (d.k) {
      case 'read':
        if (!m.readBasic && m.actionsLeft > 0) { m.readBasic = true; m.actionsLeft-- }
        break
      case 'haggle':
        if (!isSigned(m, d.item) && m.actionsLeft > 0 && dealOf(m, d.item).haggles < maxHaggles(d.item)) { deal(d.item).haggles++; m.actionsLeft-- }
        break
      case 'payLater':
        if (!isSigned(m, d.item) && canPayLater(d.item) && !dealOf(m, d.item).late && m.actionsLeft > 0) { deal(d.item).late = true; m.actionsLeft-- }
        break
      case 'sign':
        if (!signBlock(m, d.item)) {
          const dl = dealOf(m, d.item)
          m.signed.push({ id: d.item, haggles: dl.haggles, late: dl.late, qty: item(d.item).unit ? clampPlates(d.qty ?? DEFAULT_PLATES) : 1 })
        }
        break
      case 'drop':
        if (d.item !== 'hall') m.signed = m.signed.filter((c) => c.id !== d.item)
        break
      case 'plateQty':
        m.signed = m.signed.map((c) => (c.id === 'plates' ? { ...c, qty: clampPlates(d.qty) } : c))
        break
      case 'lock':
        m.locked = true
        break
    }
  }
  return m
}

export const actionsSpent = (log: Decision[]) => spent(marketOf(log))

/** The plan the player has built so far: signed items and the three ranked goals. */
export function planOf(log: Decision[]): Plan {
  const g = [...log].reverse().find((d): d is Extract<Decision, { k: 'goals' }> => d.k === 'goals')
  return { contracts: marketOf(log).signed, ranks: g?.ranked }
}

/** The player's choices at the two events (stage, Sunny). Defaults are "hold" and "refuse". */
export function choicesOf(log: Decision[]): Choices {
  const out: Choices = {}
  for (const d of log) {
    if (d.k === 'event' && d.id === 'E2') out.e2 = d.choice as Choices['e2']
    if (d.k === 'event' && d.id === 'E4') out.e4 = d.choice as Choices['e4']
  }
  return out
}

/** The player's own Extend / Cancel / leave-it-unpaid choices, by date. */
export function shortfallOf(log: Decision[]): ShortfallMap {
  const out: ShortfallMap = {}
  for (const d of log) if (d.k === 'shortfall') (out[d.point] ??= []).push({ item: d.item, action: d.action })
  return out
}

export const answerOf = (log: Decision[], id: 'P1' | 'P2' | 'P3' | 'P4') => [...log].reverse().find((d) => d.k === 'predict' && d.id === id) as Extract<Decision, { k: 'predict' }> | undefined

/** What a negotiation shows before signing: the contract as it would be signed now, and its total with required extras. */
export function offer(m: Market, id: string, qty = DEFAULT_PLATES) {
  const dl = dealOf(m, id)
  const c: Contract = { id, haggles: dl.haggles, late: dl.late, qty: item(id).unit ? clampPlates(qty) : 1 }
  const [, total] = schedule(c)
  return { contract: c, total }
}
