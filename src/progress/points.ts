import type { HappyBand } from '../features/happy/view'

/**
 * The one place that says how Minar's points look and how a play turns into stars, so every game, panel and result
 * screen speaks the same language. Numbers that change money or Happy live in progress/config.ts and happy/config.ts.
 */

/** the Happy points icon: a face that follows the band (never colour alone) */
export const HAPPY_FACE: Record<HappyBand, string> = { glowing: '😄', ok: '🙂', tired: '😴' }
/** shown beside any Happy number, whatever the band */
export const HAPPY_ICON = '😊'

/** stars for one play, the same for every game: 3 = played really well, 2 = good, 1 = cleared, 0 = not cleared yet */
export function starsFor(quality: number, cleared: boolean): 0 | 1 | 2 | 3 {
  const q = Number.isFinite(quality) ? Math.min(1, Math.max(0, quality)) : 0
  if (!cleared) return 0
  if (q >= 0.85) return 3
  if (q >= 0.6) return 2
  return 1
}
