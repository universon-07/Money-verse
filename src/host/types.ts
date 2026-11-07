import type { ComponentType } from 'react'
import type { Avatar, Festival, Lang, PillarId, ShieldPiece, Skill } from '../content/data'

/**
 * The shell's normalised view of one finished play of a pillar game. Every game's adapter turns its own payload
 * (see docs/PROJECT_BRIEF.md section 4) into this shape; the progress and Happy Index code only ever sees this.
 *
 * NOTE: only the type lives here for now. Adapters, the registry and docs/INTEGRATION.md belong to the host
 * prompt (P1/P4). Extend this file, do not replace it.
 */

/** Optional signals a game can report so the Happy Index can react to how the player played. */
export interface JoySignals {
  /** friendship meter at the end, 0..100 (Festival Countdown's "Dost" meter; starts at 60) */
  friendship?: number
  /** wants/treats the player bought (count) */
  treatsBought?: number
  /** wants/treats the player skipped (count) */
  treatsSkipped?: number
  /** times the player lent money to a friend (count) */
  lentToFriends?: number
  /** times the player fell for a scam (count) */
  scammed?: number
  /** times the player made a balanced or restful choice (count) */
  restedOrBalanced?: number
}

/** Optional rewards a game hands back (Case Files: diamonds, shield pieces, detective title). */
export interface GameRewards {
  /** diamonds earned in THIS play (the shell adds them to its wallet) */
  diamonds?: number
  shieldPieces?: ShieldPiece[]
  title?: string
}

export interface GameResult {
  pillar: PillarId
  /** did the player clear the pillar (light the lamp)? */
  cleared: boolean
  /** how well they did, 0..1 (never profit: judgement/score, never money) */
  quality: number
  /** progress toward clearing even when not cleared, 0..1 */
  partial: number
  /** skills practised this play, each 0..1 */
  skills: Partial<Record<Skill, number>>
  lessonsSeen: string[]
  joySignals: JoySignals
  rewards?: GameRewards
  /** the game's original payload, kept for the NGO event log and debugging; never read by game logic */
  raw: unknown
}

/* ------------------------------------------------------------------------------------------------
 * The contract between the shell and the real games (see docs/INTEGRATION.md).
 * ---------------------------------------------------------------------------------------------- */

export type GameLevel = 'beginner' | 'confident'

/** The props every pillar game receives. A game uses what it needs and ignores the rest. */
export interface GameProps {
  /** stable per install and pillar; a replay gets the SAME seed so players improve choices, not luck */
  seed: string
  /** the NGO class code, or null */
  cohortCode: string | null
  lang: Lang
  /** which festival the player picked (Festival Countdown) */
  festival?: Festival
  /** male or female detective/hero (Case Files) */
  avatar?: Avatar
  /** hint pace (Case Files) */
  level?: GameLevel
  classCode?: string | null
  /** random per install, never linked to a person (Case Files) */
  installId?: string
  /** call exactly once when the player finishes (or quits). Pass the game's own payload; the shell adapts it. */
  onComplete: (payload: unknown) => void
  /** the game's own Exit/Done button should call this to leave the game page (the host provides it) */
  onExit?: () => void
}

/** What a game's index file must export: a default React component taking GameProps. */
export interface GameModule {
  default: ComponentType<GameProps>
}

/** turns one game's own payload into the shell's GameResult. Must never throw. */
export type GameAdapter = (payload: unknown) => GameResult

/** One entry of the pillar registry (src/host/registry.ts). */
export interface PillarGame {
  pillar: PillarId
  /** locale key for the pillar's name */
  nameKey: string
  /** shown when no real game exists yet (or in ?dev=1) */
  placeholder: ComponentType<GameProps>
  /** loads the real game if its folder exists, otherwise resolves to the placeholder */
  load: () => Promise<GameModule>
  adapter: GameAdapter
}
