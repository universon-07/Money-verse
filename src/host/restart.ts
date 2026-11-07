import type { PillarId } from '../content/data'

/**
 * Each game keeps its own run on the device and resumes it, which is right when you leave and come back but wrong for
 * "play again". This wipes one game's saved run so the next mount starts a fresh one. Loaded on demand so the game code stays lazy.
 */
export async function restartGame(pillar: PillarId): Promise<void> {
  try {
    if (pillar === 'plan') (await import('../games/showdown/state/store')).useShowdown.getState().restart()
    else if (pillar === 'save') (await import('../games/cafe/state/store')).useCafe.getState().restart()
    else if (pillar === 'invest') (await import('../games/dealboard/state/store')).useDealBoard.getState().quit()
    else (await import('../pillar4/store')).usePillar4.getState().resetEverything()
  } catch { /* a game that cannot reset still starts; it just resumes */ }
}

export async function restartAllGames(): Promise<void> {
  await Promise.all((['plan', 'save', 'invest', 'safe'] as PillarId[]).map(restartGame))
}
