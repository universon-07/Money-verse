import { useTranslation } from 'react-i18next'
import { useCoachTips } from '../../features/hub/coach'

/**
 * Plain list of coach tips that can be dismissed.
 * TODO(final-ui): replace with real coach marks or tooltips.
 */
export function CoachTips() {
  const { t } = useTranslation()
  const { tips, dismiss, dismissAll } = useCoachTips()

  if (tips.length === 0) return null

  return (
    <div data-testid="coach-tips-container" style={{ margin: '16px 0', padding: 16, background: 'var(--color-jasmine)', border: '1px solid var(--color-ink)', borderRadius: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <strong style={{ fontSize: 13 }}>{t('coach.header', { defaultValue: 'Tips' })}</strong>
        <button type="button" onClick={dismissAll} data-testid="coach-dismiss-all" style={{ fontSize: 12, textDecoration: 'underline' }}>
          {t('coach.dismissAll', { defaultValue: 'Dismiss All' })}
        </button>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {tips.map((tip) => (
          <div key={tip.id} data-testid={`coach-tip-${tip.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-jasmine)', padding: 8, borderRadius: 4, border: '1px solid var(--color-ink)' }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: 14 }}>{t(tip.titleKey)}</div>
              <div style={{ fontSize: 13 }}>{t(tip.bodyKey)}</div>
            </div>
            <button type="button" onClick={() => dismiss(tip.id)} data-testid={`coach-dismiss-${tip.id}`} className="ink-btn cream" style={{ padding: '4px 8px', fontSize: 12 }}>
              X
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
