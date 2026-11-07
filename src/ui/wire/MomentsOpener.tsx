import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MomentsSheet } from './MomentsSheet'

/** A button that opens and closes the life-moments sheet in place. TODO(final-ui): wireframe. */
export function MomentsOpener({ focusId }: { focusId?: string }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div>
        <button type="button" className="ink-btn" data-testid="moments-open" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {t('moments.open')}
        </button>
      </div>
      {open && <MomentsSheet focusId={focusId} onClose={() => setOpen(false)} />}
    </div>
  )
}
