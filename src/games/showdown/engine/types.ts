export type Point = 'W1' | 'W2' | 'W3' | 'FD'
export const POINTS: Point[] = ['W1', 'W2', 'W3', 'FD']
export type GoalId = 'G1' | 'G2' | 'G3' | 'G5'
export type VendorId = 'daamfix' | 'chacha' | 'sasta' | 'mega'
export type Cat = 'venue' | 'sound' | 'lights' | 'food' | 'kids' | 'safety' | 'promo' | 'combo'

export interface ItemDef {
  id: string
  vendor: VendorId | 'aunty'
  cat: Cat
  /** price after 0, 1, 2, 3 haggles (per plate for `unit` items) */
  ladder: number[]
  terms: Partial<Record<Point, number>>
  /** terms when "pay later" is on, and the extra price for it (Chacha items only) */
  late?: Partial<Record<Point, number>>
  latePct?: number
  unit?: boolean
  cap?: number
  addon?: number
  addonAt?: Point
  good?: boolean
  safety?: boolean
  crowd?: number
  e1?: number
  goal?: GoalId
}

export interface FutureDef { id: string; sponsorAt: Point; sponsor: number; elec: number; crowd: number; donation: number }

/** One signed item: how many haggles it took, how many plates, and whether it is paid on Festival Day. */
export interface Contract { id: string; haggles: number; qty: number; late: boolean }
export interface Plan { contracts: Contract[]; ranks?: GoalId[] }

export type StageChoice = 'hold' | 'stage'
export type SunnyChoice = 'refuse' | 'cash' | 'bill'
export interface Choices { e2?: StageChoice; e4?: SunnyChoice }

export type ShortfallAction = { item?: string; action: 'extend' | 'cancel' | 'owe' }
export type ShortfallMap = Partial<Record<Point, ShortfallAction[]>>

export interface LedgerLine { arr: number; pay: [string, number][]; cash: number }
export interface Pending { point: Point; need: number; due: number; cash: number; items: { item: string; due: number; canExtend: boolean; canCancel: boolean }[] }

export interface RunResult {
  ledger: Partial<Record<Point, LedgerLine>>
  end: number
  crowd: number | null
  goals: GoalId[]
  /** each date that had bills due above cash, with the gap (before any extension or cancel) */
  shortfalls: [Point, number][]
  cancelled: [string, Point][]
  events: ['extension' | 'cancel', string, Point][]
  unpaid: [Point, number][]
  extensionFees: number
  /** exact amounts the score needs (the rounded fields above are what a screen shows) */
  avoidable: { extensionFees: number; rushPlates: number; lostPaid: number; unpaidFee: number; unrecorded: number }
  /** how many people the signed sound reaches (with Sunny's speakers if he was paid against a bill), and whether good lights are live */
  cap: number
  lightsOk: boolean
  /** the first date that was short, how much, and the biggest bill due that day */
  firstBreak: { point: Point; gap: number; bill: string } | null
  /** what was due and what was in hand on each short date (lesson L1 quotes it) */
  shortfallDetail: { point: Point; due: number; cash: number }[]
  survived: boolean
  pending?: Pending
}
