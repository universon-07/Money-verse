import { item } from './content'
import { schedule, unitPrice } from './contract'
import type { ConceptId, Facts } from './concepts'
import { marketOf, planOf, choicesOf, type Decision } from './log'
import { futuresRun, firstBreak } from './survival'

export type LessonId = 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L7'
export const LESSON_OF: Record<ConceptId, LessonId> = { C1: 'L1', C2: 'L2', C3: 'L3', C4: 'L4', C5: 'L5', C7: 'L7' }

/** One variant of a card's first line, with the player's own numbers. The UI formats money, item, goal and date variables. */
export interface LessonLine { id: LessonId; key: string; vars: Record<string, number | string> }
export const MONEY_VARS = ['due', 'cash', 'quote', 'total', 'was', 'parts']

const OK = (id: LessonId): LessonLine => ({ id, key: `${id}.ok`, vars: {} })

/**
 * Line 1 of a lesson card: what happened, from the ledger. Nothing here says what the player should have done.
 * Each card has an "ok" variant for players whose play already showed the idea (the report can still show it).
 */
export function lessonFor(concept: ConceptId, log: Decision[], facts: Facts): LessonLine {
  const id = LESSON_OF[concept]
  const plan = planOf(log)
  const { played } = facts
  switch (concept) {
    case 'C1': {
      const s = played.shortfallDetail.find((x) => x.point !== 'FD')
      return s ? { id, key: 'L1.what', vars: { when: s.point, due: s.due, cash: s.cash } } : OK(id)
    }
    case 'C2': {
      const hit = played.cancelled.map(([c]) => ({ c, g: item(c).goal })).find((x) => x.g)
      return hit ? { id, key: 'L2.what', vars: { item: hit.c, goal: hit.g! } } : OK(id)
    }
    case 'C3': {
      const plates = plan.contracts.find((c) => item(c.id).cat === 'food')
      const crowd = played.crowd ?? 0
      if (!plates) return { id, key: 'L3.none', vars: { crowd } }
      if (plates.qty > crowd) return { id, key: 'L3.extra', vars: { crowd, plates: plates.qty, n: plates.qty - crowd } }
      return { id, key: 'L3.what', vars: { crowd, plates: plates.qty, n: crowd - plates.qty } }
    }
    case 'C4': {
      const [, total] = schedule({ id: 'basic', haggles: 0, qty: 1, late: false })
      return { id, key: marketOf(log).signed.some((c) => c.id === 'basic') ? 'L4.what' : 'L4.skip', vars: { quote: unitPrice({ id: 'basic', haggles: 0, qty: 1, late: false }), total } }
    }
    case 'C5': {
      const runs = futuresRun(plan, choicesOf(log))
      const k = runs.filter((r) => r.result.survived).length
      const fb = firstBreak(runs)
      return k === 10 || !fb ? { id, key: 'L5.all', vars: {} } : { id, key: 'L5.what', vars: { k, when: fb.point, bill: fb.bill } }
    }
    case 'C7':
      return { id, key: 'L7.what', vars: { was: 28000, parts: 13000 } }
  }
}
