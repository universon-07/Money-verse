import type { Festival } from '../../content/data'

/**
 * Sample payloads in each game's REAL spec shape (see docs/INTEGRATION.md). Used by the placeholder games, so the
 * adapters are exercised for real, and reused by the adapter tests. "great" and "ok" clear the pillar, "poor" does not,
 * "quit" is a player leaving early.
 */
export type RunKind = 'great' | 'ok' | 'poor' | 'quit'
export const RUN_KINDS: RunKind[] = ['great', 'ok', 'poor', 'quit']

export interface PayloadBase {
  seed: string
  cohortCode: string | null
  festival?: Festival
}

export function festivalPayload(kind: RunKind, base: PayloadBase): Record<string, unknown> {
  const head = { game: 'festival', cohortCode: base.cohortCode, seed: base.seed, festival: base.festival ?? 'diwali' }
  if (kind === 'quit') return { ...head, progress: 0.34, lessonsSeen: [] }
  const table = {
    great: { stars: { ghar: true, gift: true, dost: true, plan: true }, score: { needs: 25, plan: 25, shopping: 20, goal: 15, balance: 15, total: 100 }, swaps: 3, ringTossPlays: 0, walkedHome: false, lessons: ['needs-before-wants', 'leave-a-buffer', 'saying-no-kindly'] },
    ok: { stars: { ghar: true, gift: true, dost: true, plan: false }, score: { needs: 25, plan: 15, shopping: 12, goal: 15, balance: 8, total: 75 }, swaps: 1, ringTossPlays: 1, walkedHome: false, lessons: ['compare-before-you-buy'] },
    poor: { stars: { ghar: false, gift: false, dost: false, plan: false }, score: { needs: 12, plan: 5, shopping: 6, goal: 0, balance: 0, total: 35 }, swaps: 0, ringTossPlays: 3, walkedHome: true, lessons: ['the-odds-favour-the-stall'] },
  }[kind]
  return {
    ...head,
    stars: table.stars,
    score: table.score,
    evidence: { needsBoughtDay1: kind === 'great' ? 4 : 2, raidsTotal: kind === 'poor' ? 320 : 0, walkedHome: table.walkedHome, comparedFirst: kind === 'great' ? 0.8 : 0.2, bargainsWon: 2, fakeSaleBuys: kind === 'poor' ? 1 : 0, lowQualityBuys: kind === 'poor' ? 1 : 0, bufferCoveredS2: kind !== 'poor', swaps: table.swaps, ringTossPlays: table.ringTossPlays },
    lessonsSeen: table.lessons,
  }
}

export function payRunPayload(kind: RunKind, base: PayloadBase): Record<string, unknown> {
  const head = { game: 'payrun', cohortCode: base.cohortCode, seed: base.seed }
  if (kind === 'quit') return { ...head, shifts: 3, progress: 0.25, lessonsSeen: [] }
  const table = {
    great: { parts: { saving: 25, buffer: 18, spending: 22, planning: 15, lending: 15 }, shifts: 9, goalReached: true, jar: 5000, counters: { purchasesBought: 1, purchasesSkipped: 6, friendsLent: 1 }, lessons: ['pay-yourself-first', 'emergency-fund'] },
    ok: { parts: { saving: 18, buffer: 14, spending: 15, planning: 10, lending: 15 }, shifts: 12, goalReached: false, jar: 3800, counters: { purchasesBought: 3, purchasesSkipped: 4, friendsLent: 0 }, lessons: ['small-spends-add-up'] },
    poor: { parts: { saving: 5, buffer: 8, spending: 12, planning: 5, lending: 5 }, shifts: 12, goalReached: false, jar: 900, counters: { purchasesBought: 6, purchasesSkipped: 0, friendsLent: 3 }, lessons: ['cost-of-borrowing'] },
  }[kind]
  return { ...head, parts: table.parts, shifts: table.shifts, goalReached: table.goalReached, jar: table.jar, counters: table.counters, lessonsSeen: table.lessons }
}

export function dealBoardPayload(kind: RunKind, base: PayloadBase): Record<string, unknown> {
  const head = { game: 'dealboard', mode: 'lite', cohortCode: base.cohortCode, seed: base.seed }
  if (kind === 'quit') return { ...head, quartersPlayed: 5, progress: 0.42, lessonsSeen: [] }
  const table = {
    great: { judgement: 82, skills: { research: 18, skepticism: 17, spread: 16, calm: 15, habits: 16 }, quartersPlayed: 12, lessons: ['cash-is-not-revenue', 'spread-your-bets'] },
    ok: { judgement: 63, skills: { research: 12, skepticism: 14, spread: 12, calm: 13, habits: 12 }, quartersPlayed: 12, lessons: ['vanity-metrics'] },
    poor: { judgement: 41, skills: { research: 6, skepticism: 8, spread: 9, calm: 10, habits: 8 }, quartersPlayed: 12, lessons: ['rumours-are-not-news'] },
  }[kind]
  return { ...head, judgement: table.judgement, skills: table.skills, counters: { tabsOpened: 9, trapsAvoided: kind === 'great' ? 3 : 1, prematureSells: kind === 'poor' ? 4 : 0, fees: 1200, concentrationPeak: 0.3 }, quartersPlayed: table.quartersPlayed, lessonsSeen: table.lessons, netWorth: 123456, profit: 23456 }
}

export function caseFilesPayload(kind: RunKind, _base: PayloadBase): Record<string, unknown> {
  if (kind === 'quit') return { status: 'in_progress', stage: 'tutorial', shieldPieces: [], diamonds: 25, title: 'Trainee Detective', playbookReady: false }
  const table = {
    great: { status: 'complete', stage: 'master', shieldPieces: ['protect', 'verify', 'pause'], diamonds: 505, title: 'Chief Inspector', playbookReady: true, firstTryAccuracy: 0.9 },
    ok: { status: 'complete', stage: 'master', shieldPieces: ['protect', 'verify', 'pause'], diamonds: 320, title: 'Chief Inspector', playbookReady: true, firstTryAccuracy: 0.6 },
    poor: { status: 'in_progress', stage: 'case1', shieldPieces: ['protect'], diamonds: 60, title: 'Junior Detective', playbookReady: false, firstTryAccuracy: 0.3 },
  }[kind]
  return table
}
