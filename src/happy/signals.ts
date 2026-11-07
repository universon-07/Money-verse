import type { JoySignals } from '../host/types'
import { clamp } from '../progress/state'
import { HAPPY } from './config'

const count = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) ? Math.max(0, n) : 0)
const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * How one finished game nudges Happy, from the optional signals it reports. Returns a delta (can be negative).
 * Missing signals count as zero, so a game that reports nothing never changes Happy.
 */
export function joyFromSignals(signals: JoySignals | undefined): number {
  if (!signals) return 0
  const k = HAPPY.signals
  let d = 0
  if (typeof signals.friendship === 'number' && Number.isFinite(signals.friendship)) {
    d += (clamp(signals.friendship, 0, k.friendshipMax) - k.friendshipNeutral) * k.friendshipPerPoint
  }
  const bought = count(signals.treatsBought)
  d += Math.min(k.treatBoughtCap, bought * k.treatBoughtEach)
  // skipping treats once or twice is fine; skipping many while buying none is "all work, no joy"
  const skipped = count(signals.treatsSkipped)
  if (bought === 0 && skipped > k.treatSkipFree) d += Math.max(k.treatSkipCap, (skipped - k.treatSkipFree) * k.treatSkipEach)
  d += Math.min(k.lentCap, count(signals.lentToFriends) * k.lentEach)
  d += Math.max(k.scammedCap, count(signals.scammed) * k.scammedEach)
  d += Math.min(k.balancedCap, count(signals.restedOrBalanced) * k.balancedEach)
  return round2(clamp(d, -k.perResultCap, k.perResultCap))
}
