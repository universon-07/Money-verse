import { item, RULES } from './content'
import type { Contract, Point } from './types'
import { POINTS } from './types'

/** Price after the haggles so far. A ladder never goes below its last step. */
export const unitPrice = (c: Contract): number => {
  const d = item(c.id)
  return d.ladder[Math.min(c.haggles, d.ladder.length - 1)]
}
export const maxHaggles = (id: string) => item(id).ladder.length - 1

/** Pay-later (Chacha items only) moves everything to Festival Day for a higher price. */
export const canPayLater = (id: string) => !!item(id).late

/** The headline quote: what a vendor shows before any required extras. */
export const quote = (c: Contract): number => unitPrice(c) * (item(c.id).unit ? c.qty : 1)

/** Required extras that are not in the quote (the add-on of the Basic set, the technician of the Big set). */
export const extras = (id: string): number => item(id).addon ?? 0

/**
 * When each payment falls, and the total including required extras.
 * Required extras are always billed (reading the fine print only shows them earlier).
 */
export function schedule(c: Contract): [Partial<Record<Point, number>>, number] {
  const d = item(c.id)
  let base = quote(c)
  let terms = d.terms
  if (c.late && d.late) {
    base = base * (1 + d.latePct!)
    terms = d.late
  }
  const sched: Partial<Record<Point, number>> = {}
  for (const p of POINTS) {
    const f = terms[p]
    if (f != null) sched[p] = (sched[p] ?? 0) + base * f
  }
  const extra = extras(c.id)
  if (extra) sched[d.addonAt!] = (sched[d.addonAt!] ?? 0) + extra
  return [sched, base + extra]
}

/** Vendors who will move a payment to Festival Day for a fee. Daam Fix never extends. */
export const canExtend = (id: string) => RULES.extendVendors.includes(item(id).vendor)
