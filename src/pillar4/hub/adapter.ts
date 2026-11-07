import { useEffect } from 'react'
import type { Shield } from '../types.ts'
import { diamondsOf, shieldPiecesOf, titleOf, usePillar4 } from '../store.ts'
import type { TitleId } from '../engine/progress.ts'
import { useHost } from '../host.tsx'

/**
 * What Pillar 4 reports back to whatever map or hub mounts it (see host.tsx for what it needs in).
 * A host can call getPillar4Status() at any time (it reads the persisted state), e.g. to draw a badge on its map.
 */
export interface Pillar4Status {
  status: 'locked' | 'in_progress' | 'complete'
  shieldPieces: Shield[]
  points: number
  title: TitleId
  playbookReady: boolean
}

export function getPillar4Status(): Pillar4Status {
  const s = usePillar4.getState()
  const started = Object.keys(s.progress).length > 0
  return {
    status: s.master.done ? 'complete' : started ? 'in_progress' : 'locked',
    shieldPieces: shieldPiecesOf(s),
    points: diamondsOf(s),
    title: titleOf(s),
    playbookReady: s.master.done,
  }
}

/** tells the host when the pillar is finished (idempotent; safe to fire again on every mount) */
export function useCompletionSync() {
  const { onComplete } = useHost()
  const done = usePillar4((s) => s.master.done)
  useEffect(() => {
    if (done) onComplete()
  }, [done, onComplete])
}
