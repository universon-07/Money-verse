import { rngFor } from '../../../lib/rng'
import { ECON, SCRIPT, card, cardsOfKind } from './content'
import { DAYS, type Day, type WeekScript } from './types'

const shuffle = <T,>(xs: T[], r: () => number): T[] => {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
const pick = <T,>(xs: T[], r: () => number): T => xs[Math.floor(r() * xs.length)]

const isBill = (id: string | null) => !!id && id !== '@listed' && ['surprise', 'planned'].includes(card(id).kind)

function withPlanned(seed: string, week: number, wage: number, ids: (string | null)[], scripted: boolean): WeekScript {
  const days = {} as Record<Day, string | null>
  DAYS.forEach((d, i) => (days[d] = ids[i] ?? null))
  const planned = DAYS.filter((d) => days[d] && days[d] !== '@listed' && card(days[d]!).kind === 'planned').map((d) => ({ day: d, id: days[d]! }))
  return { seed, week, wage, days, planned, scripted }
}

/** Weeks 1-8 from script.json (the same teaching events fall on the same days for everyone). */
function scriptedWeek(seed: string, week: number, wage: number): WeekScript {
  return withPlanned(seed, week, wage, SCRIPT.weeks[String(week)], true)
}

/**
 * A bonus week (9-14), drawn from the seed: 1-2 surprise bills (25%: one is a big one), 0-1 planned cost, 1-2 wants,
 * 0-1 friend ask, 0-1 lost cash, a windfall 20% of the time. At most 5 cards, one per day, no bill on Day 1.
 */
function bonusWeek(seed: string, week: number): WeekScript {
  const r = rngFor(`${seed}:bonus:${week}`)
  const small = cardsOfKind('surprise').filter((c) => !c.big).map((c) => c.id)
  const big = cardsOfKind('surprise').filter((c) => c.big).map((c) => c.id)
  const surprises = shuffle(small, r).slice(0, r() < 0.5 ? 1 : 2)
  if (r() < 0.25) surprises[0] = pick(big, r)
  const planned = r() < 0.5 ? [pick(cardsOfKind('planned').map((c) => c.id), r)] : []
  const wants = shuffle(cardsOfKind('want').map((c) => c.id), r).slice(0, r() < 0.5 ? 1 : 2)
  const friend = r() < 0.5 ? [pick(cardsOfKind('friend').map((c) => c.id), r)] : []
  const lost = r() < 0.5 ? ['L1'] : []
  const windfall = r() < 0.2 ? ['G1'] : []
  // highest priority first; anything past five is dropped
  const chosen = [...surprises, ...wants, ...planned, ...friend, ...lost, ...windfall, '@listed'].slice(0, 5)
  const bills = chosen.filter((id) => isBill(id))
  const others = chosen.filter((id) => !isBill(id))
  const order = shuffle(DAYS, r)
  const billDays: Day[] = order.filter((d) => d !== 1).slice(0, bills.length)
  const restDays: Day[] = order.filter((d) => !billDays.includes(d)).slice(0, others.length)
  const days = Object.fromEntries(DAYS.map((d) => [d, null])) as Record<Day, string | null>
  bills.forEach((id, i) => (days[billDays[i]] = id))
  others.forEach((id, i) => (days[restDays[i]] = id))
  return withPlanned(seed, week, ECON.wage, DAYS.map((d) => days[d]), false)
}

/**
 * The 14 week scripts. `varied` jobs pay 900 in week 1, then weeks 2-8 are a seeded shuffle of the varied wages (average 900).
 * The seed affects only varied pay and bonus weeks; weeks 1-8 are otherwise identical for everyone.
 */
export function makeScript(seed: string, varied = false): WeekScript[] {
  const wages = varied ? shuffle(ECON.variedWages, rngFor(`${seed}:wages`)) : []
  const out: WeekScript[] = []
  for (let w = 1; w <= ECON.seasonWeeks; w++) out.push(scriptedWeek(seed, w, varied && w > 1 ? wages[w - 2] : ECON.wage))
  for (let w = ECON.seasonWeeks + 1; w <= ECON.lastBonusWeek; w++) out.push(bonusWeek(seed, w))
  return out
}
