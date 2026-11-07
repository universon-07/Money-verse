/**
 * Tunable numbers for the Happy Index (0 to 100). Calibrate here only; no other file may hold a Happy number.
 */
export const HAPPY = {
  start: 70,
  min: 10,
  max: 100,
  /** a lamp lit while Happy is at or above `bright` glows fully; at or above `dim` (but below bright) it is dim; below `dim` it flickers */
  thresholds: { bright: 60, dim: 35 },
  /** Happy lost after every game session (called once per session by the host, never per shift or per day) */
  burnoutDrain: 5,
  /** after this many game sessions in a row with no life moment, the player is shown a gentle "time for a break" note */
  tiredAfterSessions: 3,
  /**
   * how the balance card judges the mix of finishing pillars and looking after yourself:
   * "all work" = fewer than this many life moments taken (a free moment counts, because rest costs nothing);
   * "self heavy" = more than this share of everything earned plus spent went on yourself.
   */
  balance: { allWorkBelowBreaks: 1, selfHeavyAbove: 0.5 },
  /** repeating the same life moment pays less each time: gain = round(base x repeatDecay ^ timesUsedBefore) */
  moments: { repeatDecay: 0.5 },
  /** how game results nudge Happy (see joyFromSignals) */
  signals: {
    /** friendship is 0..friendshipMax; this is the "neutral" value (the Festival game starts at 60) and the divisor per point */
    friendshipMax: 100,
    friendshipNeutral: 60,
    friendshipPerPoint: 0.1,
    /** treats bought: +each, up to a cap */
    treatBoughtEach: 2,
    treatBoughtCap: 6,
    /** skipping treats is fine, but skipping them REPEATEDLY while buying none ("all work, no joy") hurts */
    treatSkipFree: 2,
    treatSkipEach: -1.5,
    treatSkipCap: -6,
    /** being kind to friends */
    lentEach: 1,
    lentCap: 2,
    /** each scam fallen for */
    scammedEach: -5,
    scammedCap: -10,
    /** balanced or restful choices */
    balancedEach: 4,
    balancedCap: 8,
    /** one game result can move Happy by at most this much either way */
    perResultCap: 12,
  },
} as const
