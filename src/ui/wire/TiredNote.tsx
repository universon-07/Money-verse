import { useTranslation } from 'react-i18next'
import { useHappyView } from '../../features/happy/hooks'

/** A gentle "time for a break" line, shown only after several games in a row without a life moment. TODO(final-ui): wireframe. */
export function TiredNote() {
  const { t } = useTranslation()
  const view = useHappyView()
  if (!view.needsBreak) return null
  return (
    <p data-testid="tired-note" role="note" style={{ margin: 0, padding: 8, border: '2px solid var(--color-ink)', borderRadius: 6, background: 'var(--color-paper-tan)' }}>
      {t('happy.tiredNote', { count: view.sessionsSinceBreak })}
    </p>
  )
}
