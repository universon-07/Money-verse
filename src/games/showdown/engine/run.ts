import { schedule, canExtend } from './contract'
import { RULES, firstOfCat, future, item } from './content'
import { POINTS, type Choices, type GoalId, type LedgerLine, type Plan, type Point, type RunResult, type ShortfallAction, type ShortfallMap } from './types'

export class EngineError extends Error {}

/** Python-style rounding (halves go to the even number), so amounts match the prototype exactly. */
export const pyRound = (x: number): number => {
  const f = Math.floor(x)
  const d = x - f
  if (d < 0.5) return f
  if (d > 0.5) return f + 1
  return f % 2 === 0 ? f : f + 1
}

interface ItemState { sched: Partial<Record<Point, number>>; paid: number; cancelled: boolean }
type Due = [string, number]

const EPS = 1e-6
const DEFAULT_RANKS: GoalId[] = ['G1', 'G2', 'G3']

/**
 * The shortfall autopilot: extend the largest dues first (not on Festival Day, never at Daam Fix);
 * then cancel items that serve no ranked goal, then the lowest-ranked goal, larger first. Hall and permits never cancel.
 */
export function autopilot(due: Due[], need: number, point: Point, ranks: GoalId[], isItem: (k: string) => boolean): ShortfallAction[] {
  const out: ShortfallAction[] = []
  let left = need
  let rest = due.map(([k, a]) => [k, a] as Due)
  const candidates = () => rest.filter(([k, a]) => isItem(k) && a > 0 && item(k).cat !== 'venue')
  for (const [k, a] of [...candidates()].sort((x, y) => y[1] - x[1])) {
    if (left <= EPS) break
    if (canExtend(k) && point !== 'FD') {
      out.push({ item: k, action: 'extend' })
      left -= a
      rest = rest.map(([kk, aa]) => [kk, kk === k ? 0 : aa])
    }
  }
  // items not serving a ranked goal go first, then the lowest rank
  const prio = (k: string) => {
    const g = item(k).goal
    return g && ranks.includes(g) ? 1 + (3 - ranks.indexOf(g)) : 0
  }
  for (const [k, a] of [...candidates()].sort((x, y) => prio(x[0]) - prio(y[0]) || y[1] - x[1])) {
    if (left <= EPS) break
    out.push({ item: k, action: 'cancel' })
    left -= a
    rest = rest.map(([kk, aa]) => [kk, kk === k ? 0 : aa])
  }
  return out
}

export interface RunOptions {
  /** 'auto' always uses the autopilot (the ten futures). 'play' uses the player's own shortfall choices and pauses when one is missing. */
  mode?: 'auto' | 'play'
  shortfall?: ShortfallMap
}

/**
 * One festival, one future. Pure: the same plan, future and choices always give the same ledger.
 * Five money dates: Today (cash on hand), W1, W2, W3 and Festival Day (FD).
 */
export function runPlan(plan: Plan, futureId: string, choices: Choices = {}, opts: RunOptions = {}): RunResult {
  const f = future(futureId)
  const cs = plan.contracts
  const ranks = plan.ranks ?? DEFAULT_RANKS
  const mode = opts.mode ?? 'auto'
  let cash = RULES.startCash

  const items: Record<string, ItemState> = {}
  for (const c of cs) items[c.id] = { sched: schedule(c)[0], paid: 0, cancelled: false }

  const shortfalls: [Point, number][] = []
  const cancelled: [string, Point][] = []
  const unpaid: [Point, number][] = []
  const events: RunResult['events'] = []
  let extensionFees = 0
  let rushCost = 0
  let stage = false
  let extraCap = 0
  let sunnyLoss = 0
  const promo = firstOfCat(cs, 'promo')
  const crowdBase = promo ? (item(promo.id).crowd ?? RULES.noPromoCrowd) : RULES.noPromoCrowd
  let crowd: number | null = null
  let firstBreak: RunResult['firstBreak'] = null
  const shortfallDetail: RunResult['shortfallDetail'] = []
  const ledger: RunResult['ledger'] = {}
  const arrivals: Record<Point, number> = { W1: 0, W2: 0, W3: 0, FD: 0 }
  arrivals.W2 += f.donation
  arrivals[f.sponsorAt] += f.sponsor
  const isItem = (k: string) => k in items

  const result = (pending?: RunResult['pending']): RunResult => {
    const sound = cs.find((c) => ['sound', 'combo'].includes(item(c.id).cat) && !items[c.id].cancelled)
    const cap = sound ? (item(sound.id).cap ?? 0) + extraCap : 0
    const lightsOk = cs.some((c) => ['lights', 'combo'].includes(item(c.id).cat) && item(c.id).good && !items[c.id].cancelled)
    const live = new Set(cs.filter((c) => !items[c.id].cancelled).map((c) => c.id))
    const goals: GoalId[] = []
    if (live.has('kids')) goals.push('G1')
    const food = cs.find((c) => item(c.id).cat === 'food' && live.has(c.id))
    if (food && crowd != null && (food.qty >= crowd || rushCost > 0)) goals.push('G2')
    if (lightsOk && crowd != null && cap >= crowd) goals.push('G3')
    if ((live.has('safety') || live.has('combo')) && crowd != null && crowd >= 420) goals.push('G5')
    const lostPaid = cs.reduce((a, c) => a + (items[c.id].cancelled ? items[c.id].paid : 0), 0)
    const unpaidTotal = unpaid.reduce((a, [, x]) => a + x, 0)
    return {
      ledger, end: pyRound(cash), crowd, goals: goals.sort(), cap, lightsOk, firstBreak, shortfallDetail, shortfalls, cancelled, events, unpaid,
      extensionFees: pyRound(extensionFees),
      avoidable: { extensionFees, rushPlates: rushCost, lostPaid, unpaidFee: unpaidTotal * RULES.unpaidFee, unrecorded: sunnyLoss },
      survived: shortfalls.length === 0 && unpaid.length === 0,
      pending,
    }
  }

  for (const p of POINTS) {
    cash += arrivals[p]
    const line: LedgerLine = { arr: arrivals[p], pay: [], cash: 0 }
    if (p === 'W1') {
      cash -= RULES.permits
      line.pay.push(['permits', RULES.permits])
    }
    let due: Due[] = Object.entries(items).filter(([, v]) => !v.cancelled && (v.sched[p] ?? 0) > 0).map(([k, v]) => [k, v.sched[p]!])
    if (p === 'W2') {
      const venue = firstOfCat(cs, 'venue')!
      due.push(['electrical', item(venue.id).e1! * f.elec])
    }
    if (p === 'FD') {
      crowd = Math.trunc(crowdBase * (stage ? RULES.stageCrowdMult : 1.0) * f.crowd)
      const income = RULES.eventBase + RULES.eventPerVisitor * crowd
      cash += income
      line.arr += income
      // rush plates are priced from the ordered plates, even if that order was later cancelled (as in the prototype)
      const food = firstOfCat(cs, 'food')
      if (food) {
        const have = food.qty
        if (crowd > have) {
          rushCost = (crowd - have) * RULES.rushPlate
          due.push(['rush plates', rushCost])
        }
      }
    }

    let totalDue = due.reduce((a, [, x]) => a + x, 0)
    if (totalDue > cash + EPS) {
      shortfalls.push([p, pyRound(totalDue - cash)])
      shortfallDetail.push({ point: p, due: pyRound(totalDue), cash: pyRound(cash) })
      firstBreak ??= { point: p, gap: pyRound(totalDue - cash), bill: [...due].sort((a, b) => b[1] - a[1])[0][0] }
      let need = totalDue - cash
      const actions = mode === 'auto' ? autopilot(due, need, p, ranks, isItem) : (opts.shortfall?.[p] ?? [])
      let owed = false
      for (const a of actions) {
        if (need <= EPS) break
        if (a.action === 'owe') { owed = true; break }
        const k = a.item!
        const amount = due.find(([kk]) => kk === k)?.[1] ?? 0
        if (!isItem(k) || amount <= 0 || item(k).cat === 'venue') throw new EngineError(`${k} cannot be ${a.action}led at ${p}`)
        if (a.action === 'extend') {
          if (!canExtend(k) || p === 'FD') throw new EngineError(`${k} cannot be extended at ${p}`)
          const fee = amount * RULES.extensionFee
          items[k].sched.FD = (items[k].sched.FD ?? 0) + amount + fee
          extensionFees += fee
          events.push(['extension', k, p])
        } else {
          items[k].cancelled = true
          cancelled.push([k, p])
          events.push(['cancel', k, p])
        }
        need -= amount
        due = due.map(([kk, aa]) => [kk, kk === k ? 0 : aa])
      }
      if (mode === 'play' && need > EPS && !owed) {
        // pause for the player only if there is something they could still extend or cancel
        const options = due.filter(([k, x]) => isItem(k) && x > 0 && item(k).cat !== 'venue').map(([k, x]) => ({ item: k, due: x, canExtend: canExtend(k) && p !== 'FD', canCancel: true }))
        if (options.length) return result({ point: p, need, due: due.reduce((a, [, x]) => a + x, 0), cash, items: options })
      }
      totalDue = due.reduce((a, [, x]) => a + x, 0)
      if (totalDue > cash + EPS) unpaid.push([p, pyRound(totalDue - cash)])
    }
    for (const [k, a] of due) if (a > 0) line.pay.push([k, pyRound(a)])
    cash -= p === 'FD' ? Math.min(totalDue, cash) : totalDue
    for (const [k, a] of due) if (isItem(k) && !items[k].cancelled) items[k].paid += a

    if (p === 'W2' && choices.e2 === 'stage' && cash >= RULES.stageCost) {
      cash -= RULES.stageCost
      stage = true
      line.pay.push(['stage', RULES.stageCost])
    }
    if (p === 'W3') {
      if (choices.e4 === 'cash' && cash >= RULES.sunnyAdvance) {
        cash -= RULES.sunnyAdvance
        line.pay.push(['sunny cash', RULES.sunnyAdvance])
        sunnyLoss = RULES.sunnyUnrecorded
      }
      if (choices.e4 === 'bill' && cash >= RULES.sunnyAdvance) {
        cash -= RULES.sunnyAdvance
        line.pay.push(['speakers (bill)', RULES.sunnyAdvance])
        extraCap = RULES.sunnyBillCapacity
      }
    }
    if (p === 'FD' && sunnyLoss) {
      cash += RULES.sunnyReturn
      line.arr += RULES.sunnyReturn
    }
    line.cash = pyRound(cash)
    ledger[p] = line
  }
  return result()
}
