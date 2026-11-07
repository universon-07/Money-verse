import { useState } from 'react'
import { Icon } from './icons.tsx'
import { Speaker } from './Speaker.tsx'
import { useT } from './useT.ts'

export type Mood = 'neutral' | 'pleased' | 'thinking' | 'reassuring'
const TONE: Record<Mood, string> = { neutral: 'var(--p4-accent)', pleased: 'var(--p4-ok)', thinking: 'var(--p4-warn)', reassuring: 'var(--p4-info)' }

/** The case analyst (mentor). A monogram, not a cartoon: the tone is professional and Socratic. */
export function AnalystMark({ mood = 'neutral', size = 40 }: { mood?: Mood; size?: number }) {
  return (
    <span className="grid shrink-0 place-items-center rounded-full font-extrabold" style={{ width: size, height: size, background: 'var(--p4-surface2)', border: `2px solid ${TONE[mood]}`, color: TONE[mood], fontSize: size * 0.4 }} aria-hidden>
      CA
    </span>
  )
}

interface DockProps {
  text: string
  extra?: string | null
  mood: Mood
  onHelp?: () => void
  helpLabel?: string
  onElse?: () => void
  offer?: { onYes: () => void; onNo: () => void } | null
  onBreak: () => void
  onReread?: () => void
  children?: React.ReactNode
}

/** The analyst panel: always visible, gives the current question, hints on request, never the answer. */
export function AnalystDock({ text, extra, mood, onHelp, helpLabel, onElse, offer, onBreak, onReread, children }: DockProps) {
  const t = useT()
  const [open, setOpen] = useState(false)
  return (
    <div className="p4-panel is-raised flex items-start gap-2 !p-2 min-[640px]:gap-2.5 min-[640px]:!p-2.5" role="region" aria-live="polite" aria-label={t('ui.analyst')}>
      <span className="hidden min-[640px]:block"><AnalystMark mood={mood} /></span>
      <span className="min-[640px]:hidden"><AnalystMark mood={mood} size={30} /></span>
      <div className="min-w-0 flex-1">
        <div className="p4-eyebrow mb-0.5 hidden min-[640px]:block">{t('ui.analyst')}</div>
        <div className="flex items-start gap-2">
          <p className={`m-0 min-w-0 flex-1 cursor-pointer text-[13.5px] leading-snug min-[640px]:text-[14.5px] ${open ? '' : 'line-clamp-2 min-[640px]:line-clamp-3 min-[900px]:line-clamp-none'}`} onClick={() => { setOpen((o) => !o); onReread?.() }}>{text}</p>
          <Speaker text={[text, extra].filter(Boolean).join(' ')} />
        </div>
        {extra && <p className="m-0 mt-1.5 text-[14px] leading-snug" style={{ color: 'var(--p4-warn)' }}>{extra}</p>}
        <div className="mt-1.5 flex flex-nowrap items-center gap-1.5 overflow-x-auto min-[640px]:mt-2 min-[900px]:flex-wrap">
          {offer && (
            <>
              <button type="button" className="p4-btn primary shrink-0 whitespace-nowrap !min-h-[40px] !px-3 !text-[13.5px]" onClick={offer.onYes}>{t('ui.idleOffer.yes')}</button>
              <button type="button" className="p4-btn shrink-0 whitespace-nowrap !min-h-[40px] !px-3 !text-[13.5px]" onClick={offer.onNo}>{t('ui.idleOffer.no')}</button>
            </>
          )}
          {onHelp && <button type="button" className="p4-btn shrink-0 whitespace-nowrap !min-h-[40px] !px-3 !text-[13.5px]" onClick={onHelp}><Icon name="help" size={16} /> {helpLabel ?? t('ui.needHelp')}</button>}
          {onElse && <button type="button" className="p4-btn shrink-0 whitespace-nowrap !min-h-[40px] !px-3 !text-[13.5px]" onClick={onElse} aria-label={t('ui.askElse')}><Icon name="rotate" size={16} /><span className="hidden min-[640px]:inline">{t('ui.askElse')}</span></button>}
          <button type="button" className="p4-btn ghost shrink-0 whitespace-nowrap !min-h-[40px] !px-3 !text-[13.5px]" onClick={onBreak} aria-label={t('ui.break')}><Icon name="pause" size={16} /><span className="hidden min-[900px]:inline">{t('ui.break')}</span></button>
          {children}
        </div>
      </div>
    </div>
  )
}
