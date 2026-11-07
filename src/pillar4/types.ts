// Data model for Pillar 4 (spec Section 11.3), plus the normalised shapes the engine works with.

export type Reason = 'too_good' | 'rushing' | 'pretend' | 'secret' | 'grab' | 'threat'
export type Step = 1 | 2 | 3 | 4 | 5
export type AppId = 'messages' | 'phone' | 'chatup' | 'instaglam' | 'paynow' | 'settings'
/** clue-ness is derived from Clue.targets; a zone itself is only ordinary, herring or context */
export type Role = 'ordinary' | 'herring' | 'context'
export type ItemKind =
  | 'sms' | 'call' | 'caption' | 'chat' | 'profile' | 'videocall' | 'highlight'
  | 'feed' | 'saved' | 'dm' | 'page' | 'summary' | 'history' | 'request' | 'payees' | 'perm'
export type Support = 'full' | 'guided' | 'half' | 'independent' | 'none'
export type CaseKind = 'tutorial' | 'case' | 'mystery'
export type Shield = 'protect' | 'verify' | 'pause'

export const REASONS: Reason[] = ['too_good', 'rushing', 'pretend', 'secret', 'grab', 'threat']

export interface Zone {
  /** unique inside the case. For single-zone items it equals the item id. */
  id: string
  /** string key; defaults to the zone id */
  textKey?: string
  role?: Role
  /** key for herring / context feedback; defaults to `${id}.explain` */
  explainKey?: string
  linkKey?: string
  /** alternate text shown in zoom mode */
  zoomKey?: string
  /** "head" zones render in the bubble header (sender name, handle) */
  part?: 'head' | 'body'
}

/** An item as written in JSON: either `zones`, or single-zone shorthand fields. */
export interface RawItem {
  id: string
  app: AppId
  kind: ItemKind
  thread?: string
  time?: string
  dir?: 'in' | 'out'
  zones?: Zone[]
  role?: Role
  explainKey?: string
  linkKey?: string
}

export interface PhoneItem {
  id: string
  app: AppId
  kind: ItemKind
  thread?: string
  time?: string
  dir: 'in' | 'out'
  zones: Zone[]
}

export interface Clue {
  id: string
  kind: 'required' | 'gold' | 'connect'
  reason?: Reason
  alsoAccepted?: Reason[]
  distractors?: Reason[]
  step: Step
  explainKey?: string
  /** zone ids that resolve this clue (any of them) */
  targets: string[]
  /** connect clues: the shared key */
  linkKey?: string
}

export interface Lead {
  id: string
  clueId: string
  q?: string
  nudge?: string
  glowApp: AppId
  /** zone id that pulses at L4 */
  pulseTarget: string
}

export interface FixOption { key: string; correct: boolean; whyKey: string }
export interface Fix { qKey: string; options: FixOption[]; shield?: Shield }

export interface RawCase {
  id: string
  kind: CaseKind
  variant?: string
  support: Support
  victim: { name: string; age: number }
  apps: AppId[]
  items: RawItem[]
  clues: Clue[]
  leads: Lead[]
  fix: Fix
  replay: { step: Step; captionKey: string }[]
}

export interface CaseDef extends Omit<RawCase, 'items'> {
  items: PhoneItem[]
}

/** Tap outcome for one report (spec 5.4) */
export type OutcomeKind =
  | 'correct' | 'wrong' | 'herring_fine' | 'herring_any' | 'context' | 'ordinary' | 'duplicate'

export interface Outcome {
  kind: OutcomeKind
  clueId?: string
  /** explanation string key to show (clue, herring or context) */
  explainKey?: string
}

export type Phase = 'briefing' | 'investigating' | 'board' | 'fix' | 'replay' | 'closed'

export interface CaseProgress {
  phase: Phase
  pinned: string[]
  /** clue ids that got at least one wrong report (used for the Playbook's first-try clues) */
  missed: string[]
  connects: string[]
  wrongStreak: number
  wrongTotal: number
  leadWrong: Record<string, number>
  hintLevel: Record<string, number>
  leadCursor: number
  hintUsed: boolean
  helpUsed: boolean
  cluesBeforeHelp: number | null
  placements: Record<string, Step>
  dropWrong: Record<string, number>
  requiredDropWrong: boolean
  boardDone: boolean
  fixAttempts: number
  fixDone: boolean
  closed: boolean
  /** diamonds earned in this run at full value */
  earned: number
  /** diamonds actually credited to the wallet from this run */
  credited: number
  /** true when this run replays an already-closed case (25% rewards) */
  replay: boolean
  goldPrompted: boolean
}

export type Avatar = 'male' | 'female'
export type Level = 'beginner' | 'confident'
