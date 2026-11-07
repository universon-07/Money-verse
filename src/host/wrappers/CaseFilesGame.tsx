import { useCallback, useRef } from 'react'
import Pillar4 from '../../pillar4/Pillar4'
import { getPillar4Status } from '../../pillar4/hub/adapter'
import { useGame } from '../../store/game'
import type { GameProps } from '../types'

/**
 * Shell-side wrapper for Case Files (Pillar 4, lives in src/pillar4, not src/games). It is self-contained and keeps its own saved
 * progress, so this wrapper only supplies language and portrait and reports once, when the player leaves. The report is
 * getPillar4Status(), which the casefiles adapter already understands. Finishing the Master Board does NOT end the session
 * on the spot, so the player can still read the Playbook.
 */
export default function CaseFilesGame({ lang, onComplete, onExit }: GameProps) {
  const setLanguage = useGame((s) => s.setLanguage)
  const persona = useGame((s) => s.persona)
  const gender = useGame((s) => s.gender)
  const sent = useRef(false)
  const exit = useCallback(() => {
    if (sent.current) return onExit?.()
    sent.current = true
    onComplete(getPillar4Status())
  }, [onComplete, onExit])
  return (
    <Pillar4
      language={lang}
      setLanguage={setLanguage}
      avatarSrc={persona ? `/art/avatar/${gender}-${persona}-face.webp` : undefined}
      onExit={exit}
      onComplete={() => undefined}
    />
  )
}
