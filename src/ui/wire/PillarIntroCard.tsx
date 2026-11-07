import { useTranslation } from 'react-i18next'
import { usePillarIntro } from '../../features/hub/hooks'
import type { PillarId } from '../../content/data'
import { StateGlyph } from './icons'

interface Props {
  pillarId: PillarId
  onStart: () => void
  onClose: () => void
}

/**
 * Pre-game pillar intro card.
 * TODO(final-ui): wireframe
 */
export function PillarIntroCard({ pillarId, onStart, onClose }: Props) {
  const { t } = useTranslation()
  const { teachesKey, estimatedMinutes, state, bestQuality, primaryCtaKey, secondaryCtaKey } = usePillarIntro(pillarId)

  return (
    <div data-testid={`pillar-intro-${pillarId}`} style={{ border: '2px solid var(--color-ink)', borderRadius: 8, padding: 16, background: 'var(--color-jasmine)' }}>
      <h2 style={{ marginTop: 0 }}>{t(`pillars.${pillarId}.name`)}</h2>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <StateGlyph state={state} />
        <span style={{ fontSize: 14, fontWeight: 'bold' }}>{t(`state.${state}`)}</span>
      </div>
      <p style={{ marginBottom: 8 }}><strong>{t('hub.teaches', { defaultValue: 'Teaches:' })}</strong> {t(teachesKey)}</p>
      <p style={{ marginBottom: 16 }}><strong>{t('hub.time', { defaultValue: 'Time:' })}</strong> {estimatedMinutes} {t('hub.minutes', { defaultValue: 'mins' })}</p>
      
      {state === 'bright' && (
        <p style={{ marginBottom: 16 }}><strong>{t('hub.bestQuality', { defaultValue: 'Best Score:' })}</strong> {Math.round(bestQuality * 100)}%</p>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        {secondaryCtaKey && (
          <button type="button" onClick={onClose} data-testid="intro-back" className="ink-btn cream">
            {t(secondaryCtaKey)}
          </button>
        )}
        <button type="button" onClick={onStart} data-testid="intro-start" className="ink-btn pink" style={{ flex: 1 }}>
          {t(primaryCtaKey)}
        </button>
      </div>
    </div>
  )
}
