import { PILLAR_IDS, type PillarId } from '../content/data'
import { isDevMode } from '../lib/dev'
import { ADAPTERS } from './adapters'
import { GAME_ENTRIES, GAME_FOLDERS } from './config'
import { PLACEHOLDERS } from './placeholders'
import type { GameModule, PillarGame } from './types'

/** every real game that exists right now: '/src/games/<folder>/index.tsx' -> lazy importer. Empty until teammates add folders. */
const REAL_GAMES = import.meta.glob<GameModule>('/src/games/*/index.{ts,tsx}')
/** games that export their own component instead of an index.tsx: only their presence is checked here */
const ENTRY_FILES = import.meta.glob('/src/games/**/*.tsx')
/** the wrappers that adapt those games to GameProps (loaded only when the game file exists) */
const WRAPPERS: Partial<Record<PillarId, () => Promise<GameModule>>> = {
  plan: () => import('./wrappers/FestivalGame'),
  save: () => import('./wrappers/PocketPanicGame'),
  invest: () => import('./wrappers/DealBoardGame'),
  safe: () => import('./wrappers/CaseFilesGame'),
}

const REAL_KEY = 'mm-real'

/** the loader for a pillar's real game, or undefined when its folder does not exist yet */
function realLoader(pillar: PillarId): (() => Promise<GameModule>) | undefined {
  const folder = GAME_FOLDERS[pillar]
  const hit = Object.keys(REAL_GAMES).find((k) => k.startsWith(`/src/games/${folder}/index.`))
  if (hit) return REAL_GAMES[hit]
  const entry = GAME_ENTRIES[pillar]
  const wrapper = WRAPPERS[pillar]
  return entry && wrapper && (`/src/games/${folder}/${entry.file}.tsx` in ENTRY_FILES || entry.file === 'Pillar4') ? wrapper : undefined
}

export const hasRealGame = (pillar: PillarId): boolean => realLoader(pillar) !== undefined

/**
 * ?dev=1 forces the placeholders so every flow can be tested with controlled results. Add ?real=1 (remembered for the tab,
 * ?real=0 clears it) to use the real games while dev tools are on.
 */
export function wantsPlaceholders(): boolean {
  if (!isDevMode()) return false
  try {
    const q = new URLSearchParams(window.location.search).get('real')
    if (q === '1') sessionStorage.setItem(REAL_KEY, '1')
    else if (q === '0') sessionStorage.removeItem(REAL_KEY)
    return sessionStorage.getItem(REAL_KEY) !== '1'
  } catch {
    return true
  }
}

function makeEntry(pillar: PillarId): PillarGame {
  const placeholder = PLACEHOLDERS[pillar]
  return {
    pillar,
    nameKey: `pillars.${pillar}.name`,
    placeholder,
    adapter: ADAPTERS[pillar],
    load: () => {
      const loader = wantsPlaceholders() ? undefined : realLoader(pillar)
      return loader ? loader() : Promise.resolve({ default: placeholder })
    },
  }
}

export const PILLAR_GAMES: Record<PillarId, PillarGame> = Object.fromEntries(PILLAR_IDS.map((id) => [id, makeEntry(id)])) as Record<PillarId, PillarGame>

export const isPillarId = (v: unknown): v is PillarId => typeof v === 'string' && (PILLAR_IDS as string[]).includes(v)
