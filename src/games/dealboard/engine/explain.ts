import type { CompanyId, MarketRun } from './types'
import { COMPANY } from './companies'

export interface Reason {
  /** content key under why.* */
  key: string
  params: Record<string, string | number>
}

/**
 * Plain-language reasons behind a company's quarter, from the numbers the engine actually used:
 * the market, the sector, the company's own events and results, and whether the price moved on excitement alone.
 * Most important first, at most three.
 */
export function explainQuarter(m: MarketRun, id: CompanyId, q: number): { move: number; reasons: Reason[] } {
  const h = m.history[id]
  const now = h[q]
  const prev = h[q - 1]
  const co = COMPANY[id]
  const move = prev.price > 0 ? now.price / prev.price - 1 : 0
  const banner = m.banners[q - 1]
  const out: Reason[] = []
  const add = (key: string, params: Reason['params'] = {}) => out.push({ key, params })

  if (now.failed && !prev.failed) add('event.failed')
  for (const e of now.events) {
    if (e === 'downRound' || e === 'restated' || e === 'layoffNews') add(`event.${e}`)
    if (e === 'raised') add('event.raised')
  }
  if (banner.marketShock <= -0.05) add('market.fell', { x: Math.round(Math.abs(banner.marketShock) * 100) })
  else if (banner.marketShock >= 0.05) add('market.rose', { x: Math.round(banner.marketShock * 100) })
  const sectorShock = banner.sector === co.sector ? banner.sectorShock ?? 0 : 0
  if (sectorShock !== 0) add(sectorShock > 0 ? 'sector.up' : 'sector.down', { sector: co.sector })
  if (!now.failed && move > 0.04 && now.profit < prev.profit) add('excitement')
  if (now.ceoTrade === 'SELL' && !now.failed) add('ceoSold')
  if (!now.failed && now.runwayMonths !== null && now.runwayMonths < 6) add('runwayShort', { n: Math.round(now.runwayMonths) })
  if (!now.failed && Math.abs(now.profit - prev.profit) >= 0.1 * Math.max(1, Math.abs(prev.profit))) {
    const a = prev.profit.toFixed(1)
    const b = now.profit.toFixed(1)
    if (now.profit < 0 && now.profit < prev.profit) add('lossGrew', { a: (-prev.profit).toFixed(1), b: (-now.profit).toFixed(1) })
    else if (prev.profit < 0 && now.profit > prev.profit) add('lossShrank', { a: (-prev.profit).toFixed(1), b: (-now.profit).toFixed(1) })
    else add(now.profit > prev.profit ? 'profitUp' : 'profitDown', { a, b })
  }
  if (!now.failed && now.newCust < now.lostCust) add('customersLeaving', { a: now.newCust.toLocaleString('en-IN'), b: now.lostCust.toLocaleString('en-IN') })
  if (!out.length) add('steady')
  return { move, reasons: out.slice(0, 3) }
}
