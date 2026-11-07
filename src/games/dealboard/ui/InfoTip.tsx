import { useId, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * A heading with a small ⓘ button. The explanation that would otherwise repeat on every screen sits behind it
 * and opens right below the heading, so the main screen stays short.
 */
export function InfoHeader({ title, children, className = 'db-eyebrow text-[#8a5a2b]' }: { title: ReactNode; children: ReactNode; className?: string }) {
  const { t } = useTranslation('dealboard')
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div className={`min-w-0 ${className}`}>{title}</div>
        <button type="button" className="db-info-btn" aria-expanded={open} aria-controls={id} aria-label={t('info.label')} onClick={() => setOpen(!open)}>
          <span aria-hidden>{open ? '×' : 'i'}</span>
        </button>
      </div>
      {open && <div id={id} className="db-info-panel">{children}</div>}
    </div>
  )
}
