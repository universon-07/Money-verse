import { RULES } from './content'
import { schedule } from './contract'
import { pyRound } from './run'
import { POINTS, type Contract, type Point } from './types'

export type CashLine = Record<Point, number>
export interface CashLines {
  /** If every promise arrives: the sponsor and donation land in Week 2, and the expected event money on Festival Day */
  optimistic: CashLine
  /** Only what is certain: today's ₹20,000, nothing promised */
  cautious: CashLine
  /** The lowest the certain line goes over Weeks 1 to 3, in rupees (negative means a gap) */
  cushion: number
  due: CashLine
}

/** The expected event money shown on the lines (₹6,000 plus about 500 visitors at ₹8 is the "about ₹10,000" the spec describes). */
export const EXPECTED_EVENT_MONEY = 10000

/** What the two cash lines show: contracts and permits only. Surprise bills are NOT included, on purpose. */
export function cashLines(contracts: Contract[]): CashLines {
  const due: CashLine = { W1: RULES.permits, W2: 0, W3: 0, FD: 0 }
  for (const c of contracts) {
    const [sched] = schedule(c)
    for (const p of POINTS) due[p] += sched[p] ?? 0
  }
  const line = (arr: CashLine): CashLine => {
    let cash = RULES.startCash
    const out = {} as CashLine
    for (const p of POINTS) {
      cash += arr[p]
      cash -= due[p]
      out[p] = pyRound(cash)
    }
    return out
  }
  const optimistic = line({ W1: 0, W2: 15000 + 5000, W3: 0, FD: EXPECTED_EVENT_MONEY })
  const cautious = line({ W1: 0, W2: 0, W3: 0, FD: EXPECTED_EVENT_MONEY })
  return { optimistic, cautious, cushion: Math.min(cautious.W1, cautious.W2, cautious.W3), due }
}
