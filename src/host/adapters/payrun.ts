import type { GameAdapter, GameResult } from '../types'
import { asRecord, clamp, clamp01, num, pickNum, pickRecord, skill, skills, strings, warn } from './util'

/**
 * Pay Run (pillar: save). The spec says onComplete receives "the five habit-score parts, the number of shifts,
 * whether the goal was reached, and the lessons seen". Assumed shape (aliases accepted, see PARTS below):
 *   { game:'payrun', cohortCode, seed, shifts, goalReached,
 *     parts:{ saving, buffer, spending, planning, lending },   // raw points: 25 / 20 / 25 / 15 / 15
 *     jar?, goal?,                                              // optional: for partial progress
 *     counters?:{ purchasesBought, purchasesSkipped, friendsLent },
 *     lessonsSeen: string[] }
 * Optional extra: `progress` (0..1) when the player quits.
 */

/** habit-score parts: the spec's maximum and the payload keys we accept for each */
const PARTS = {
  saving: { max: 25, keys: ['saving', 'savingHabit'] },
  buffer: { max: 20, keys: ['buffer'] },
  spending: { max: 25, keys: ['spending', 'spendingControl'] },
  planning: { max: 15, keys: ['planning'] },
  lending: { max: 15, keys: ['lending'] },
} as const
type PartName = keyof typeof PARTS

const HABIT_CLEAR = 70
const GOAL_JAR = 5000
const MAX_SHIFTS = 12
const PARTIAL_CAP = 0.99
/** with no counters, a Spending-control part below this means at least one purchase was bought (each costs 7 points) */
const SPENDING_NO_PURCHASE_MIN = 18

export const adaptPayRun: GameAdapter = (payload): GameResult => {
  const p = asRecord('payrun', payload)
  const partsRec = pickRecord(p, 'parts', 'habitScore', 'habit', 'scoreParts')
  const counters = pickRecord(p, 'counters')

  const part = {} as Partial<Record<PartName, number>>
  for (const name of Object.keys(PARTS) as PartName[]) {
    const v = pickNum(partsRec, [...PARTS[name].keys])
    if (v !== undefined) part[name] = clamp(v, 0, PARTS[name].max)
  }
  const goalReached = p.goalReached === true
  const jarEarly = pickNum(p, ['jar', 'jarTotal'])
  const goalEarly = pickNum(p, ['goal', 'goalAmount']) ?? GOAL_JAR
  const reportedTotal = pickNum(p, ['habitTotal', 'habitScore', 'total'])
  const haveParts = Object.keys(part).length > 0
  const summed = (Object.keys(part) as PartName[]).reduce((s, k) => s + (part[k] ?? 0), 0)
  // the REAL game reports no habit parts (src/host/wrappers/PayRunGame.tsx sends only jar, goal, shifts, goalReached):
  // then the quality is how full the jar is, and a reached goal is a full jar
  const jarOnly = !haveParts && reportedTotal === undefined && jarEarly !== undefined
  const total = clamp(haveParts ? summed : (reportedTotal ?? (jarOnly ? (p.goalReached === true ? 1 : clamp01(jarEarly / goalEarly)) * 100 : 0)), 0, 100)
  const finished = haveParts || reportedTotal !== undefined || p.goalReached !== undefined || jarOnly
  if (!finished) warn('payrun', 'no habit-score parts or goalReached in the payload; treating this as a quit')

  const cleared = finished && (goalReached || (!jarOnly && total >= HABIT_CLEAR))
  const shifts = Math.max(0, Math.floor(num(p.shifts, 0)))
  const jar = pickNum(p, ['jar', 'jarTotal'])
  const goal = pickNum(p, ['goal', 'goalAmount']) ?? GOAL_JAR
  let partial: number
  if (cleared) partial = 1
  else if (finished) partial = Math.min(PARTIAL_CAP, jar !== undefined ? clamp01(jar / goal) : clamp01(shifts / MAX_SHIFTS))
  else partial = Math.min(PARTIAL_CAP, clamp01(num(p.progress, shifts ? shifts / MAX_SHIFTS : 0)))

  // joy signals: from counters when the game reports them, otherwise inferred from the Spending-control part
  const spending = part.spending
  let treatsBought = pickNum(counters, ['purchasesBought', 'treatsBought'])
  let treatsSkipped = pickNum(counters, ['purchasesSkipped', 'treatsSkipped'])
  if (treatsBought === undefined && treatsSkipped === undefined && finished && spending !== undefined) {
    // all work, no joy: no purchase was ever bought across many shifts
    const noPurchase = spending >= SPENDING_NO_PURCHASE_MIN
    treatsBought = noPurchase ? 0 : 1
    treatsSkipped = noPurchase ? shifts : 0
  }
  const lent = pickNum(counters, ['friendsLent', 'lentToFriends'])

  return {
    pillar: 'save',
    cleared,
    quality: clamp01(total / 100),
    partial: clamp01(partial),
    skills: skills({
      saving: Math.max(skill(part.saving, PARTS.saving.max) ?? 0, skill(part.buffer, PARTS.buffer.max) ?? 0) || undefined,
      prioritising: skill(part.spending, PARTS.spending.max),
      planning: skill(part.planning, PARTS.planning.max),
      riskSense: skill(part.lending, PARTS.lending.max),
    }),
    lessonsSeen: strings(p.lessonsSeen),
    joySignals: {
      ...(treatsBought !== undefined ? { treatsBought: Math.max(0, treatsBought) } : {}),
      ...(treatsSkipped !== undefined ? { treatsSkipped: Math.max(0, treatsSkipped) } : {}),
      ...(lent !== undefined ? { lentToFriends: Math.max(0, lent) } : {}),
    },
    raw: payload,
  }
}
