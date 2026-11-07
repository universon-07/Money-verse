import type { CompanyId, MarketRun } from './types'

/**
 * Companies that, in quarter q, started losing more customers than they won for the first time:
 * the story is "a new rival entered its market". Read straight from the precomputed series, so the alert is always true to the data.
 */
export function rivalAlerts(m: MarketRun, q: number): CompanyId[] {
  if (q < 2) return []
  return m.picked.filter((id) => {
    const h = m.history[id]
    const now = h[q], prev = h[q - 1]
    if (!now || !prev || now.failed) return false
    const losing = (x: typeof now) => x.lostCust > x.newCust
    return losing(now) && !losing(prev) && !h.slice(1, q).some(losing)
  })
}
