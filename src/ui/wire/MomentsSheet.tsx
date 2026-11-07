import { useTranslation } from 'react-i18next'
import { inr } from '../../content/data'
import { useMoments } from '../../features/moments/hooks'
import { useGame } from '../../store/game'

/**
 * The life moments list: things to spend a little of the goal meter on to look after yourself.
 * The price is shown BEFORE choosing. `focusId` shows just one moment (so another screen can offer it directly).
 * TODO(final-ui): wireframe. All numbers come from the moments view-model.
 */
export function MomentsSheet({ focusId, onClose }: { focusId?: string; onClose?: () => void }) {
  const { t } = useTranslation()
  const lang = useGame((s) => s.language)
  const { moments, choose } = useMoments(focusId)
  return (
    <section data-testid="moments-sheet" aria-label={t('moments.title')} style={{ display: 'grid', gap: 8, padding: 12, border: '3px solid var(--color-ink)', borderRadius: 8, background: 'var(--color-jasmine)' }}>
      <h2 style={{ margin: 0 }}>{t('moments.title')}</h2>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
        {moments.map((m) => (
          <li key={m.id} data-testid={`moment-${m.id}`} style={{ display: 'grid', gap: 4, padding: 8, border: '2px solid var(--color-ink)', borderRadius: 6 }}>
            <strong>{t(m.nameKey)}</strong>
            <span>{t(m.descriptionKey)}</span>
            <span data-testid={`moment-cost-${m.id}`}>{m.cost > 0 ? t('moments.cost', { amount: inr(m.cost, lang) }) : t('moments.free')}</span>
            <span data-testid={`moment-gain-${m.id}`}>{m.faded ? t('moments.gainFaded') : t('moments.gain', { gain: m.gainNow })}</span>
            {m.timesUsed > 0 && <span style={{ fontSize: 13 }}>{t('moments.used', { count: m.timesUsed })}</span>}
            {!m.affordable && <span data-testid={`moment-unaffordable-${m.id}`}>{t('moments.cannotAfford')}</span>}
            <div>
              <button type="button" className="ink-btn" data-testid={`moment-choose-${m.id}`} disabled={!m.affordable} onClick={() => choose(m.id)} style={{ opacity: m.affordable ? 1 : 0.5 }}>
                {t('moments.choose')}
              </button>
            </div>
          </li>
        ))}
      </ul>
      {onClose && (
        <div>
          <button type="button" className="ink-btn cream" data-testid="moments-close" onClick={onClose}>{t('moments.close')}</button>
        </div>
      )}
    </section>
  )
}
