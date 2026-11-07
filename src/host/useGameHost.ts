import { autoShareAfterGame } from '../ngo/studentShare'
import { restartGame } from './restart'
import { lazy, useCallback, useEffect, useMemo, useReducer, useRef, type ComponentType } from 'react'
import { HOST_DEFAULTS } from './config'
import { initialFlow, flowReducer } from './flow'
import { buildResultView, nextPillarAfter } from './resultView'
import { PILLAR_GAMES, isPillarId } from './registry'
import { seedFor } from './seed'
import { SessionGuard } from './session'
import type { GameProps, PillarGame } from './types'
import type { PillarId } from '../content/data'
import { useGame } from '../store/game'
import { newInstallId } from '../store/ids'

/**
 * The headless brain of the game host screen: which phase we are in, which seed and props the game gets, and what happens
 * when the game calls onComplete. The screen component only renders what this returns.
 */
export function useGameHost(rawPillar: string | undefined) {
  const pillarId: PillarId | null = isPillarId(rawPillar) ? rawPillar : null
  const entry: PillarGame | null = pillarId ? PILLAR_GAMES[pillarId] : null

  const [flow, dispatch] = useReducer(flowReducer, initialFlow)
  const flowRef = useRef(flow)
  useEffect(() => {
    flowRef.current = flow
  }, [flow])
  const guard = useRef(new SessionGuard())

  // a different pillar means a fresh flow
  useEffect(() => {
    dispatch({ type: 'reset' })
  }, [pillarId])

  const language = useGame((s) => s.language)
  const festival = useGame((s) => s.festival)
  const avatar = useGame((s) => s.avatar)
  const classCode = useGame((s) => s.classCode)
  const installId = useGame((s) => s.installId)

  const seed = pillarId ? seedFor(installId, pillarId, flow.salt) : ''

  // lazy component for this pillar; recreated only when the pillar changes (entry.load decides placeholder vs real game)
  const Game: ComponentType<GameProps> | null = useMemo(() => (entry ? lazy(entry.load) : null), [entry])

  // a pillar already cleared always opens as a fresh run (not frozen on last time's report); an unfinished one resumes where it was left
  const start = useCallback(() => {
    const fresh = pillarId && useGame.getState().pillars[pillarId]?.status === 'complete' ? restartGame(pillarId) : Promise.resolve()
    void fresh.then(() => dispatch({ type: 'start', sessionId: newInstallId() }))
  }, [pillarId])
  // "play again" wipes the game's saved run first, so it really starts over instead of resuming at the end
  const replay = useCallback(() => {
    void (pillarId ? restartGame(pillarId) : Promise.resolve()).then(() => dispatch({ type: 'replay', sessionId: newInstallId() }))
  }, [pillarId])
  const newSeed = useCallback(() => dispatch({ type: 'newSeed' }), [])

  const onComplete = useCallback(
    (payload: unknown) => {
      const current = flowRef.current
      if (!entry || current.phase !== 'playing' || !current.sessionId) return
      const sessionId = current.sessionId
      guard.current.once(sessionId, () => {
        try {
          const result = entry.adapter(payload)
          const outcome = useGame.getState().finishSession(result)
          dispatch({ type: 'complete', sessionId, outcome })
          autoShareAfterGame() // keeps the teacher's dashboard up to date, if the student is in a class
        } catch (e) {
          dispatch({ type: 'fail', sessionId, message: e instanceof Error ? e.message : String(e) })
        }
      })
    },
    [entry],
  )

  const props: GameProps | null = pillarId
    ? { seed, cohortCode: classCode, lang: language, festival, avatar, level: HOST_DEFAULTS.level, classCode, installId, onComplete }
    : null

  const resultView = flow.outcome ? buildResultView(flow.outcome) : null
  const nextPillar = pillarId && flow.phase === 'result' ? nextPillarAfter(useGame.getState(), pillarId) : null

  return { pillarId, entry, phase: flow.phase, error: flow.error, seed, salt: flow.salt, Game, props, resultView, nextPillar, start, replay, newSeed }
}
