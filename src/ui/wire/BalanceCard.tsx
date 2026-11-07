import { useTranslation } from 'react-i18next'
import { inr } from '../../content/data'
import { useBalance } from '../../features/balance/hooks'
import { useGame } from '../../store/game'

/**
 * "You and your future": what went toward the goal versus on yourself, one sentence on why both matter, and one thing to
 * try next. Educates, never advises. TODO(final-ui): wireframe. All numbers and keys come from the balance view-model.
 */
export function BalanceCard() {
  const { t } = useTranslation()
  const lang = useGame((s) => s.language)
  const b = useBalance()
  return (
    <section data-testid="balance-card" data-tone={b.tone} style={{ display: 'grid', gap: 6, padding: 12, border: '2px solid var(--color-ink)', borderRadius: 8, background: 'var(--color-paper-tan)' }}>
      <h3 style={{ margin: 0 }}>{t('balance.title')}</h3>
      <div data-testid="balance-earned">{t('balance.earned')}: <strong>{inr(b.earned, lang)}</strong></div>
      <div data-testid="balance-spent">{t('balance.spent')}: <strong>{inr(b.spentOnSelf, lang)}</strong></div>
      <p style={{ margin: 0 }}>{t(b.whyKey)}</p>
      <p data-testid="balance-next" style={{ margin: 0, fontWeight: 700 }}>{t(b.nextStepKey)}</p>
      <p style={{ margin: 0, fontSize: 13 }}>{t('host.banner')}</p>
    </section>
  )
}
