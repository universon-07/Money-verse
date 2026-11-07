import { Suspense, useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { isDevMode } from '../../lib/dev'
import { useGameHost } from '../../host/useGameHost'
import { GameErrorBoundary } from './GameErrorBoundary'
import { ResultScreen } from './ResultScreen'
import { irisOpen } from '../iris'
import { useGame } from '../../store/game'
import { WIDE_GAMES } from '../../host/config'

/**
 * The page a pillar game runs inside: entry panel, the game itself, then the result. It holds no business logic
 * (src/host/useGameHost.ts does); it fills the space it is given and sets no fixed pixel size, because games need to
 * work from 360px wide. On a wide screen the column matches the story's portrait shape: min(width, height x 0.62).
 * TODO(final-ui): wireframe, replaced by the real design; keep the data-testid names (docs/UI_CONTRACT.md).
 */
export function GameHostScreen() {
  const { pillar } = useParams()
  const { t } = useTranslation()
  const nav = useNavigate()
  const lang = useGame((s) => s.language)
  const host = useGameHost(pillar)
  // arriving through the iris (from the island card or the result screen): open it out of the spot it closed on
  useEffect(() => { irisOpen() }, [pillar])
  const [confirming, setConfirming] = useState(false)
  const dev = isDevMode()

  useEffect(() => { if (host.phase === 'entry' && host.pillarId) host.start() }, [host.phase, host.pillarId]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!host.pillarId || !host.entry || !host.props) return <Navigate to="/" replace />
  const { pillarId, entry, phase, Game, props, resultView } = host

  const leave = () => nav('/')
  const wide = phase === 'playing' && WIDE_GAMES.includes(pillarId)
  const onExit = () => (phase === 'playing' ? setConfirming(true) : leave())

  return (
    <div data-testid="game-host" className="absolute inset-0 flex flex-col bg-jasmine text-ink">
      <header className="flex shrink-0 items-center gap-2 border-b-[3px] border-ink bg-paper-tan px-2 py-1" style={{ paddingTop: 'max(4px, env(safe-area-inset-top))' }}>
        <button type="button" className="ink-btn" style={{ minHeight: wide ? 40 : 48 }} data-testid="game-exit" onClick={onExit}>
          ← {t('host.exit')}
        </button>
        <strong style={{ flex: 1, minWidth: 0 }}>{t(entry.nameKey)}</strong>
        {dev && (
          <button type="button" className="ink-btn cream" style={{ minHeight: 48 }} data-testid="game-new-seed" onClick={host.newSeed}>
            {t('host.newSeed')}
          </button>
        )}
      </header>

      {/* the area below the bar: it scrolls for entry/result, and gives a playing game a real, sized, positioned box to fill */}
      <div className="min-h-0 flex-1 overflow-y-auto">
      <div style={{ width: '100%', maxWidth: wide ? '100%' : 'min(100%, calc(100dvh * 0.62))', margin: '0 auto', position: 'relative', height: phase === 'playing' ? '100%' : undefined }}>
        {confirming && (
          <div role="alertdialog" aria-label={t('host.exit')} data-testid="game-exit-confirm" style={{ padding: 12, display: 'grid', gap: 8 }}>
            <p style={{ margin: 0 }}>{t('host.exitConfirm')}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="ink-btn pink" data-testid="game-exit-yes" onClick={leave}>{t('host.exitYes')}</button>
              <button type="button" className="ink-btn" data-testid="game-exit-no" onClick={() => setConfirming(false)}>{t('host.exitNo')}</button>
            </div>
          </div>
        )}

        {/* no intro page: the game opens straight away (each game has its own start screen) */}
        {phase === 'playing' && Game && (
          <GameErrorBoundary
            key={`${pillarId}:${host.salt}`}
            fallback={() => (
              <section role="alert" data-testid="game-error" style={{ padding: 16, display: 'grid', gap: 12 }}>
                <h2 style={{ margin: 0 }}>{t('host.errorTitle')}</h2>
                <p style={{ margin: 0 }}>{t('host.errorBody')}</p>
                <div><button type="button" className="ink-btn" data-testid="game-error-back" onClick={leave}>{t('host.errorBack')}</button></div>
              </section>
            )}
          >
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div data-testid="game-mount" style={{ position: 'relative', flex: 1, minHeight: 0 }}>
                <Suspense fallback={<p data-testid="game-loading" style={{ padding: 16, margin: 0 }}>{t('host.loading')}</p>}>
                  <Game {...props} onExit={leave} />
                </Suspense>
              </div>
              <p data-testid="game-banner" style={{ margin: 0, padding: '4px 12px', fontSize: 12 }}>{t('host.banner')}</p>
            </div>
          </GameErrorBoundary>
        )}

        {phase === 'error' && (
          <section role="alert" data-testid="game-error" style={{ padding: 16, display: 'grid', gap: 12 }}>
            <h2 style={{ margin: 0 }}>{t('host.errorTitle')}</h2>
            <p style={{ margin: 0 }}>{t('host.errorBody')}</p>
            <div><button type="button" className="ink-btn" data-testid="game-error-back" onClick={leave}>{t('host.errorBack')}</button></div>
          </section>
        )}

        {phase === 'result' && resultView && (
          <ResultScreen
            view={resultView}
            lang={lang}
            nextPillar={host.nextPillar}
            onContinue={() => (host.nextPillar ? nav(`/play/${host.nextPillar}`) : leave())}
            onReplay={() => { host.replay(); requestAnimationFrame(irisOpen) }}
            onBack={leave}
          />
        )}
      </div>
      </div>
    </div>
  )
}

export default GameHostScreen
