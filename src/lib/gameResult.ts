/** Raw game payload, consumed by the shell's per-game adapters. */
export interface GameResult {
  game: string
  cohortCode: string
  seed: string
  score: Record<string, number>
  evidence: Record<string, number | boolean>
  lessonsSeen: string[]
  minaretLit: boolean
  stars?: Record<string, boolean>
  joy?: Record<string, number>
  meta?: Record<string, string>
}

/** Keep the latest result locally; unavailable/full storage must not block completion. */
export function saveResult(result: GameResult): void {
  try { localStorage.setItem(`mm-result-${result.game}`, JSON.stringify(result)) } catch { /* storage is optional */ }
}
