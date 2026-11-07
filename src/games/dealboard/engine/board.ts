export const TURNS = 8
export const YEAR_ENDS = [4, 8]

/**
 * The ring has 12 slots: the four companies of this game sit on the corners and the eight quarters
 * fill the stretches between them (two per side). The token moves one quarter at a time; the company that is
 * pitching this quarter glows on its corner.
 */
export type Slot = { kind: 'lot'; index: number } | { kind: 'quarter'; q: number }

export const RING: Slot[] = Array.from({ length: 12 }, (_, i) =>
  i % 3 === 0 ? { kind: 'lot', index: i / 3 } : { kind: 'quarter', q: i - Math.floor(i / 3) },
)

export const RING_SIZE = RING.length

/** Ring slot of a company's corner (index = position in the run's picked order). */
export const lotTile = (index: number): number => index * 3

/** Ring slot of a quarter (1 to 8). Before the first quarter the token waits on the first company's corner. */
export const quarterTile = (q: number): number => {
  if (q < 1) return 0
  const n = Math.min(TURNS, q)
  return n + Math.floor((n - 1) / 2)
}
