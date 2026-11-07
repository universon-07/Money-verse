export type Day = 1 | 2 | 3 | 4 | 5 | 6
export const DAYS: Day[] = [1, 2, 3, 4, 5, 6]
export type RuleId = 'save' | 'lunch' | 'waitlist'
export type SavePct = 0 | 10 | 20 | 30
export type Rules = { savePct: SavePct; lunch: boolean; waitlist: boolean }
export const NO_RULES: Rules = { savePct: 0, lunch: false, waitlist: false }

export type CardKind = 'want' | 'surprise' | 'planned' | 'friend' | 'lost' | 'windfall'

/** One week of the season. `days` holds a card id per day, null for a quiet day, or '@listed' (a Wait List item returns). */
export interface WeekScript {
  seed: string
  week: number
  wage: number
  days: Record<Day, string | null>
  planned: { day: Day; id: string }[]
  scripted: boolean
}

/** Everything a student can decide. The state is rebuilt by replaying these through the engine. */
export type Decision =
  | { k: 'stillwant'; id: string; yes: boolean }
  | { k: 'rules'; rules: Rules; extra: number; testing: RuleId | null }
  | { k: 'treat'; day: Day; yes: boolean }
  | { k: 'want'; day: Day; id: string; choice: 'buy' | 'skip' | 'list' }
  | { k: 'friend'; day: Day; id: string; choice: 'lend200' | 'lend50' | 'no' }
  | { k: 'windfall'; day: Day; choice: 'jar' | 'split' | 'keep' }
  | { k: 'shortfall'; day: Day; id: string; choice: 'jar' | 'quickcash' | 'late' }
  | { k: 'sweep'; amount: number }

export type Loan = { id: string; amount: number; instalment: number; left: number }

export type WeekSummary = {
  week: number
  openPocket: number
  openJar: number
  closePocket: number
  closeJar: number
  /** the jar's gain this week (what the prediction asks about) */
  jarGain: number
  /** surprise bills this week, in rupees (the Plan-for-surprises lesson averages them) */
  surprises: number
}

/** What the engine says is happening now, so a screen knows what to ask. */
export type Phase =
  | { at: 'plan' }
  | { at: 'treat'; day: Day }
  | { at: 'card'; day: Day; id: string }
  | { at: 'shortfall'; day: Day; id: string; amount: number; shortfall: number }
  | { at: 'review' }
  | { at: 'done' }

export type State = {
  week: number
  pocket: number
  jar: number
  loans: Loan[]
  /** unpaid bills and fees carried to the next Payday */
  lateDue: number
  /** wants put on the Wait List: asked "Still want it?" at the next Plan */
  list: { id: string; returnPrice: number; fromWeek: number }[]
  /** wants that came back after "Still want it? Yes" and will show as a Want card */
  returning: { id: string; price: number }[]
  rules: Rules
  lent: { id: string; amount: number; week: number }[]
  phase: Phase
  /** this week's opening balances and events: the ledger is built from these */
  open: { pocket: number; jar: number }
  events: Event[]
  history: WeekSummary[]
}

/** What the engine emits. Every change to the pocket or the jar is one of these. */
export type Event =
  | { t: 'wage'; amount: number }
  | { t: 'musthave'; amount: number }
  | { t: 'instalment'; amount: number }
  | { t: 'late'; amount: number; fee: number; carried: number }
  | { t: 'save'; amount: number; via: 'share' | 'extra' | 'windfall' | 'sweep' }
  | { t: 'treat'; day: Day; amount: number }
  | { t: 'want'; day: Day; id: string; amount: number }
  | { t: 'bill'; day: Day; id: string; amount: number; fromPocket: number }
  | { t: 'lost'; day: Day; amount: number }
  | { t: 'lend'; day: Day; id: string; amount: number }
  | { t: 'repaid'; id: string; amount: number }
  | { t: 'windfall'; amount: number }
  | { t: 'quickcash'; shortfall: number; amount: number; owed: number }
  | { t: 'breakjar'; shortfall: number; amount: number }
  | { t: 'paylate'; shortfall: number; fee: number }
  | { t: 'saved'; id: string; amount: number }
  | { t: 'blocked'; day: Day; id: string }
