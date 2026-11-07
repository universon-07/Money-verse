import { useTranslation } from 'react-i18next'
import { useHappyView } from '../../features/happy/hooks'
import { FaceGlyph } from './icons'

/** The Happy Index: a face icon, a bar and a text label (never colour alone). TODO(final-ui): wireframe. */
export function HappyMeter() {
  const { t } = useTranslation()
  const view = useHappyView()
  return (
    <div data-testid="happy-meter" data-band={view.band} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <FaceGlyph band={view.band} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700 }}>
          {t('happy.title')}: <span data-testid="happy-label">{t(view.labelKey)}</span>
        </div>
        <div
          role="progressbar"
          aria-label={t('happy.title')}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={view.percent}
          style={{ height: 10, border: '2px solid var(--color-ink)', borderRadius: 5, background: 'var(--color-track)', overflow: 'hidden' }}
        >
          <div style={{ width: `${view.percent}%`, height: '100%', background: 'var(--color-ink)' }} />
        </div>
      </div>
      <span data-testid="happy-value" style={{ fontVariantNumeric: 'tabular-nums' }}>{view.valueRounded}</span>
    </div>
  )
}
