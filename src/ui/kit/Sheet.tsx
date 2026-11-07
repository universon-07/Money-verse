import { useEffect, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import './minar.css'

/**
 * The one panel every "tap to see more" thing in Minar opens into: a bottom sheet on phones, a centred card on wide screens.
 * Backdrop click, the close button and Escape all close it. Focus goes to the panel when it opens.
 */
export function Sheet({ open, onClose, title, art, children, tone = 'paper' }: { open: boolean; onClose: () => void; title: ReactNode; art?: ReactNode; children: ReactNode; tone?: 'paper' | 'gold' | 'sky' | 'rose' }) {
  const { t } = useTranslation()
  const panel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return undefined
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose() } }
    window.addEventListener('keydown', esc)
    panel.current?.focus()
    return () => window.removeEventListener('keydown', esc)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="mk-backdrop" role="presentation" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={panel} className={`mk-sheet mk-tone-${tone}`} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined} tabIndex={-1}>
        <header className="mk-sheet-head">
          {art && <span className="mk-sheet-art" aria-hidden>{art}</span>}
          <h2 className="font-display lang-fit m-0 flex-1 text-[24px] leading-tight">{title}</h2>
          <button type="button" className="mk-x" aria-label={t('kit.sheet.close')} onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden><path d="M3 3 L15 15 M15 3 L3 15" stroke="#3A2A24" strokeWidth="2.4" strokeLinecap="round" /></svg>
          </button>
        </header>
        <div className="mk-sheet-body">{children}</div>
      </div>
    </div>
  )
}

/** a small caps label above a block inside a sheet */
export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="mk-eyebrow">{children}</div>
}
