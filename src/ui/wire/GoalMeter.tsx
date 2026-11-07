import { useTranslation } from 'react-i18next'
import { inr } from '../../content/data'
import { useProgressView } from '../../features/progress/hooks'
import { useGame } from '../../store/game'

/** The goal meter: how much of the target is saved. TODO(final-ui): wireframe. All numbers come from the progress view-model. */
export function GoalMeter() {
  const { t } = useTranslation()
  const lang = useGame((s) => s.language)
  const { goal } = useProgressView()
  return (
    <div data-testid="goal-meter">
      <div style={{ fontWeight: 700 }}>{t('progress.goalLabel')}</div>
      <div data-testid="goal-meter-value">{t('progress.goalValue', { saved: inr(goal.saved, lang), target: inr(goal.target, lang) })}</div>
      <div
        role="progressbar"
        aria-label={t('progress.goalLabel')}
        aria-valuemin={0}
        aria-valuemax={goal.target}
        aria-valuenow={goal.saved}
        style={{ height: 14, border: '2px solid var(--color-ink)', borderRadius: 7, background: 'var(--color-track)', overflow: 'hidden', marginTop: 4 }}
      >
        <div style={{ width: `${goal.percent}%`, height: '100%', background: 'var(--color-pink)' }} />
      </div>
    </div>
  )
}
