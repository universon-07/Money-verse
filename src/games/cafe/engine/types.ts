/** Pocket Panic (Pillar 2: Save & Manage). Types shared by the pure engine, the store and the screens. */

export type Source = 'spend' | 'save' | 'emergency' | 'quick'
export const SOURCES: Source[] = ['spend', 'save', 'emergency', 'quick']
/** how much of each source pays for something */
export type Payment = Partial<Record<Source, number>>

export type GoalId = 'earphones' | 'trip' | 'controller'
export const GOALS: GoalId[] = ['earphones', 'trip', 'controller']

export type BottleId = 'fun' | 'friends'
export const BOTTLES: BottleId[] = ['fun', 'friends']
/** 0 calm, 1 simmering, 2 bubbling, 3 fizzing, 4 pop. The player only ever sees the stage, never the number. */
export type Stage = 0 | 1 | 2 | 3 | 4

export interface Jars {
  spend: number
  save: number
  emergency: number
}

export type BillId = 'auto' | 'data' | 'lunch'
export const BILLS: BillId[] = ['auto', 'data', 'lunch']

export type ItemKind = 'ignorable' | 'fizz' | 'sensible'
export interface WindowItemDef {
  id: string
  price: number
  kind: ItemKind
  bottle?: BottleId
  pull?: number
  category: 'fun' | 'shopping' | 'food' | 'phone' | 'social'
  /** sells out while it cools (the match ticket): waiting is a check, not a rule */
  soldOut?: boolean
}
export interface TrolleyItemDef {
  id: string
  price: number
  bottle?: BottleId
  pull?: number
}
export interface BillDef {
  id: BillId
  day: number
  amount: number
}
export interface SurpriseDef {
  id: number
  bill: number
  /** bill if the player bought the phone cover (only the cracked phone) */
  coverBill?: number
  /** needs a classroom check before it is used in Month 1 */
  testFirst?: boolean
}

export type WindowAction = 'get' | 'cool' | 'pass'
export type CoolResult = 'still' | 'dropped' | 'soldout'
export interface WindowRec {
  itemId: string
  action: WindowAction
  /** what finally happened to the item */
  bought: boolean
  coolResult?: CoolResult
  fromSave: number
}
export interface TrolleyRec {
  itemId: string
  action: 'ok' | 'skip'
  fromSave: number
}

export type TejaChoice = 'lend100' | 'lend50' | 'gift30' | 'no'
export type BigNightChoice = 'go' | 'half' | 'stay'

export interface LedgerLine {
  day: number
  /** a key under `ledger.*` in the cafe strings */
  key: string
  vars?: Record<string, string | number>
  /** a key under `note.*`: Chacha's handwriting in the margin */
  note?: string
}

export interface Run {
  month: number
  seed: string
  goal: GoalId
  predict1?: 'none' | 'one' | 'two' | 'idk'
  predict2?: 0 | 1 | 2 | 3
  predict3?: 150 | 175 | 200 | 250
  jars: Jars
  /** the split chosen at payday (kept for the Tally and evidence) */
  payday?: Jars
  /** internal only. The player never sees these numbers. */
  fizz: Record<BottleId, number>
  /** fizz items declined, newest first: the Big Night is read back from this */
  refused: string[]
  /** fizz values brought in from last month (a Big Night that was stayed in on) */
  carried: Record<BottleId, boolean>
  bigNight: { cost: 60 | 100; bottles: BottleId[]; choice?: BigNightChoice; paid: Payment } | null
  bills: Partial<Record<BillId, { amount: number; paid: Payment }>>
  window: WindowRec[]
  trolley: TrolleyRec[]
  worth: Record<string, 'glad' | 'meh'>
  lent: number
  gift: number
  tejaChoice?: TejaChoice
  spendBeforeTeja?: number
  hasCover: boolean
  surprise: { id: number; bill: number }
  /** the cloud sometimes drops a second, smaller surprise */
  extra: { id: number; bill: number } | null
  rainPaid2: Payment
  rainPaid: Payment
  /** total borrowed on Quick Cash and what it costs to repay */
  loan: { borrowed: number; repay: number }
  ledger: LedgerLine[]
  ledgerOpened: number
  fineOpened: boolean
  borrowedWithoutReading: boolean
  /** times money was taken from Save to pay for a WANT (bills do not count) */
  saveForWants: number
  saveGoalMoves: number
  tableSpoke: boolean
  /** order of the window waves and the trolley for this month (Month 2 reshuffles) */
  waves: string[][]
  trolleyOrder: string[]
  tejaReason: 'match' | 'kit'
}

export type Ending = 'reached' | 'reachedCost' | 'almost' | 'notyet'
export type Archetype = 'fastmover' | 'openhand' | 'windowwaiter' | 'shelffirst' | 'doorwatcher' | 'quietholder' | 'evenkeeper'

export interface Tally {
  ending: Ending
  /** Save jar at the end, after Quick Cash was collected */
  saved: number
  goalGap: number
  billsTotal: number
  billsBySource: Record<'spend' | 'save' | 'emergency' | 'quick', number>
  wantsBig: number
  wantsSmall: number
  wants: number
  little: number
  littleGuess?: 0 | 1 | 2 | 3
  cushionUsed: number
  cushionKept: number
  lentOut: number
  borrowCost: number
  extra: number
  owed: number
  glad: number
  meh: number
  mehTotal: number
  archetype: Archetype
  /** which of the nine behaviours were observed this run */
  evidence: Record<Concept, boolean>
  cards: CardPick[]
  chit: string
  marginNotes: { lineIndex: number; note: string }[]
  callbacks: { key: string; vars: Record<string, string | number> }[]
  settled: { repaidQuick: number; from: Record<'spend' | 'emergency' | 'save', number> }
}

export interface CardPick {
  id: string
  variant: string
  vars: Record<string, string | number>
}

export type Concept =
  | 'payFirst'
  | 'track'
  | 'small'
  | 'emergency'
  | 'plan'
  | 'wait'
  | 'goals'
  | 'borrow'
  | 'lend'
export const CONCEPTS: Concept[] = ['payFirst', 'track', 'small', 'emergency', 'plan', 'wait', 'goals', 'borrow', 'lend']

/** what is kept when a month is finished, for "Then and Now" and the dashboard */
export interface MonthSummary {
  month: number
  seed: string
  experiment?: string
  saved: number
  emergencyAtPayday: number
  little: number
  coolCount: number
  coolDropped: number
  borrowed: number
  lent: number
  billsFromSave: number
  bigNight?: BigNightChoice
  fizzStageAtBigNight?: Stage
  ending: Ending
  archetype: Archetype
  evidence: Record<Concept, boolean>
  carry: Record<BottleId, boolean>
  surpriseId: number
}

export type Experiment = 'door' | 'shelf' | 'cool' | 'little' | 'teja' | 'fine' | 'yes' | 'surprise'
export const EXPERIMENTS: Experiment[] = ['door', 'shelf', 'cool', 'little', 'teja', 'fine', 'yes', 'surprise']
