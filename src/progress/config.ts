/**
 * Tunable numbers for progress and the goal bar. Everything that decides "how much does a lit lamp count" lives here,
 * so it can be calibrated (see docs/PROGRESS_MODEL.md) without touching any logic.
 */
export type Brightness = 'bright' | 'dim' | 'flicker'

export const PROGRESS = {
  /** each pillar contributes this share of (goal - start) when cleared at full brightness: 4 pillars x 25% = the goal */
  pillarShare: 0.25,
  /** how much of its share a cleared pillar counts, by lamp brightness */
  multiplier: { bright: 1, dim: 0.75, flicker: 0.5 } as Record<Brightness, number>,
  /** progress shown on a minaret that is not cleared can never reach 1 (a full minaret means lit) */
  partialCap: 0.99,
  /** the saved amount can never drop below this (spending on yourself cannot create debt) */
  savedFloor: 0,
} as const

/** "worse to better" order, used so a replay can only improve a pillar */
export const BRIGHTNESS_RANK: Record<Brightness, number> = { flicker: 0, dim: 1, bright: 2 }
