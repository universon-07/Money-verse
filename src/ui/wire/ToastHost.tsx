import { useTranslation } from 'react-i18next'
import { useHappyToast } from '../../features/happy/hooks'

/**
 * Shows the one-time "your Happy Index is getting low" tip. Mounted once in App. It stays out of the way of games and of
 * onboarding, and stays until dismissed. TODO(final-ui): wireframe.
 */
export function ToastHost() {
  const { t } = useTranslation()
  const toast = useHappyToast()
  if (!toast.visible) return null
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="toast-happy"
      className="z-[var(--z-overlay)]"
      style={{ position: 'fixed', left: 8, right: 8, bottom: 'max(8px, env(safe-area-inset-bottom))', margin: '0 auto', maxWidth: 480, padding: 12, border: '3px solid var(--color-ink)', borderRadius: 8, background: 'var(--color-jasmine)', color: 'var(--color-ink)', display: 'grid', gap: 6 }}
    >
      <strong>{t('happy.toast.title')}</strong>
      <span>{t('happy.toast.body')}</span>
      <div>
        <button type="button" className="ink-btn" data-testid="toast-happy-dismiss" onClick={toast.dismiss}>{t('happy.toast.dismiss')}</button>
      </div>
    </div>
  )
}
