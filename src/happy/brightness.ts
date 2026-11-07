import { BRIGHTNESS_RANK, type Brightness } from '../progress/config'
import { HAPPY } from './config'

/** the lamp state a pillar earns if it is cleared while Happy is `happy` */
export function brightnessFor(happy: number): Brightness {
  if (happy >= HAPPY.thresholds.bright) return 'bright'
  if (happy >= HAPPY.thresholds.dim) return 'dim'
  return 'flicker'
}

/** true when `a` is strictly better than `b` (null counts as worse than anything) */
export const isBrighter = (a: Brightness | null, b: Brightness | null): boolean =>
  a !== null && (b === null || BRIGHTNESS_RANK[a] > BRIGHTNESS_RANK[b])
