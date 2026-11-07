import { RULES, future } from './content'
import type { Choices, Point, RunResult } from './types'

export interface InLine { key: 'donation' | 'sponsor' | 'event' | 'sunny'; amount: number; crowd?: number }

/**
 * What arrives on a date, line by line (the date screen's "money in"). Sums to the ledger's arrivals for that date.
 * The sponsor may come in Week 2, Week 3 or on Festival Day; the donation is a maybe in Week 2.
 */
export function arrivals(point: Point, futureId: string, played: Pick<RunResult, 'crowd' | 'ledger'>, _choices: Choices = {}): InLine[] {
  const f = future(futureId)
  const out: InLine[] = []
  if (point === 'W2' && f.donation > 0) out.push({ key: 'donation', amount: f.donation })
  if (f.sponsorAt === point) out.push({ key: 'sponsor', amount: f.sponsor })
  if (point === 'FD' && played.crowd != null) out.push({ key: 'event', amount: RULES.eventBase + RULES.eventPerVisitor * played.crowd, crowd: played.crowd })
  if (point === 'FD' && played.ledger.W3?.pay.some(([k]) => k === 'sunny cash')) out.push({ key: 'sunny', amount: RULES.sunnyReturn })
  return out
}
