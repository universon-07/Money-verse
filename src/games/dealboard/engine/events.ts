import type { Banner, CompanyId, SectorId } from './types'
import { COMPANY } from './companies'
import { TURNS } from './board'
import { int, streamFor } from './rng'

/** Banner for each quarter: the broad market cycle, one seeded sector rally in Q2-Q4, otherwise quiet. */
export function buildBanners(seed: string, picked: CompanyId[]): { banners: Banner[]; fallQ: number } {
  const rng = streamFor(seed, 'market')
  const fallQ = 6 + int(rng, -1, 1)
  const cycle = [-0.12, -0.03, 0.06, 0.06]
  const cycleKeys = ['slowdown', 'shaky', 'optimism', 'optimism']
  const rallyQ = int(rng, 2, 4)
  const sectors = [...new Set(picked.map((id) => COMPANY[id].sector))] as SectorId[]
  const rallySector = sectors[int(rng, 0, sectors.length - 1)]
  const banners: Banner[] = []
  for (let q = 1; q <= TURNS; q++) {
    const k = q - fallQ
    if (k >= 0 && k < cycle.length) banners.push({ key: cycleKeys[k], marketShock: cycle[k] })
    else if (q === rallyQ) banners.push({ key: 'sectorRally', marketShock: 0, sector: rallySector, sectorShock: 0.08 })
    else banners.push({ key: 'quiet', marketShock: 0 })
  }
  return { banners, fallQ }
}

/** The family emergency lands in a seeded quarter between 5 and 7. */
export const emergencyTurn = (seed: string): number => int(streamFor(seed, 'emergency'), 5, 7)

export const EMERGENCY_COST = 25000
