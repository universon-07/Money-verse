import type { PillarId } from '../content/data'
import type { GameLevel } from './types'

/**
 * Which folder under src/games/ holds each pillar's real game. Dropping a game into
 * src/games/<folder>/index.tsx (default export) replaces that pillar's placeholder with no other change.
 */
export const GAME_FOLDERS: Record<PillarId, string> = {
  plan: 'showdown',
  save: 'cafe',
  invest: 'dealboard',
  safe: 'casefiles',
}

/**
 * Games that do not have an index.tsx but export their own component (Festival Showdown, Pocket Panic). The shell loads them through a
 * wrapper that maps GameProps onto the game's real props. `file` is the game's entry file; the wrapper is used only if it exists.
 */
export const GAME_ENTRIES: Partial<Record<PillarId, { file: string }>> = {
  plan: { file: 'ShowdownGame' },
  save: { file: 'PocketPanic' },
  invest: { file: 'ui/DealBoard' },
  safe: { file: 'Pillar4' },
}

/** games designed for a wide (landscape) screen: while playing they get the full width instead of the portrait column */
export const WIDE_GAMES: PillarId[] = ['plan', 'save', 'invest']

/** the order pillars are offered after a game ends ("Continue" goes to the next unfinished one) */
export const PILLAR_ORDER: PillarId[] = ['plan', 'save', 'invest', 'safe']

/** values passed to games until onboarding lets the player choose them */
export const HOST_DEFAULTS: { level: GameLevel } = { level: 'beginner' }
