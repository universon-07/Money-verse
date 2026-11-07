import type { CaseDef, CaseProgress, Clue } from '../types.ts'
import { indexCase, leadQKey, zoneTextKey } from '../engine/case.ts'
import { activeLead, allRequiredFound, connectRemaining, goldRemaining, requiredFound } from '../engine/progress.ts'
import type { T } from './useT.ts'
import { Icon, ReasonIcon } from './icons.tsx'

export const clueExcerpt = (def: CaseDef, clue: Clue, t: T): string => {
  const idx = indexCase(def)
  const first = clue.targets.map((id) => idx.zones.get(id)).find(Boolean)
  const raw = first ? t(zoneTextKey(first.zone)) : t(`${clue.id}.explain`)
  const one = raw.replace(/\s+/g, ' ').trim()
  return one.length > 90 ? one.slice(0, 87) + '…' : one
}

/** required evidence found out of total; hidden-evidence markers appear only once all required items are found */
export function EvidenceCounter({ def, progress, t }: { def: CaseDef; progress: CaseProgress; t: T }) {
  const idx = indexCase(def)
  const all = allRequiredFound(def, progress)
  const n = requiredFound(def, progress)
  return (
    <div className="p4-chip" aria-label={`${t('ui.evidence')} ${n}/${idx.required.length}`}>
      <Icon name="note" size={15} />
      <span><span className="hidden min-[430px]:inline">{t('ui.evidence')} </span>{t('ui.evidence.count', { n, total: idx.required.length })}</span>
      {all && idx.gold.length > 0 && (
        <span className="flex gap-0.5" style={{ color: 'var(--p4-warn)' }} aria-label={t('ui.evidence.gold', { n: goldRemaining(def, progress) })}>
          {idx.gold.map((g) => <Icon key={g.id} name="star" size={13} style={{ fill: progress.pinned.includes(g.id) ? 'currentColor' : 'none' }} />)}
        </span>
      )}
    </div>
  )
}

interface Props {
  def: CaseDef
  progress: CaseProgress
  t: T
  linkMode: boolean
  setLinkMode: (v: boolean) => void
  onClose?: () => void
  /** inline = side panel on wide screens; otherwise a bottom sheet */
  inline?: boolean
}

export function CaseFile({ def, progress, t, linkMode, setLinkMode, onClose, inline }: Props) {
  const idx = indexCase(def)
  const active = activeLead(def, progress)
  const pinned = progress.pinned.map((id) => idx.clues.get(id)!).filter(Boolean)
  const connects = progress.connects.map((id) => idx.clues.get(id)!).filter(Boolean)
  const canLink = idx.connect.length > 0
  const content = (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="p4-eyebrow">{t('ui.casefile')}</div>
          <div className="p4-h2">{t(`${def.id}.title`)}</div>
        </div>
        {onClose && <button type="button" className="p4-btn icon ghost" onClick={onClose} aria-label={t('ui.close')}><Icon name="x" /></button>}
      </div>
      <p className="m-0 text-[14px] leading-snug p4-muted">{t(`${def.id}.brief`)}</p>

      {def.leads.length > 0 && (
        <section>
          <div className="p4-eyebrow mb-1.5">{t('ui.notebook.leads')}</div>
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {def.leads.map((l) => {
              const found = progress.pinned.includes(l.clueId)
              if (!found && active?.id !== l.id) return null
              return (
                <li key={l.id} className="flex items-start gap-2 rounded-lg p-2.5 text-[14px] leading-snug" style={{ background: 'var(--p4-surface2)', opacity: found ? 0.65 : 1 }}>
                  <span style={{ color: found ? 'var(--p4-ok)' : 'var(--p4-warn)' }}><Icon name={found ? 'check' : 'help'} size={18} /></span>
                  <span>{t(leadQKey(l))}</span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <section>
        <div className="p4-eyebrow mb-1.5">{t('ui.notebook.pinned')}</div>
        {pinned.length + connects.length === 0 && <p className="m-0 text-[14px] p4-muted">{t('ui.notebook.empty')}</p>}
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {[...pinned, ...connects].map((c) => (
            <li key={c.id} className="rounded-lg p-2.5 text-[13.5px] leading-snug" style={{ background: 'var(--p4-surface2)', borderLeft: `3px solid ${c.kind === 'gold' ? 'var(--p4-warn)' : 'var(--p4-accent)'}` }}>
              <div className="flex items-center gap-1.5 font-bold" style={{ color: 'var(--p4-accent)' }}>
                {c.reason ? <ReasonIcon reason={c.reason} size={16} /> : <Icon name="link" size={16} />}
                <span>{c.reason ? t(`ui.reason.${c.reason}`) : t('ui.board.card.connect')}</span>
              </div>
              <div className="mt-0.5 font-semibold">{c.kind === 'connect' ? '' : clueExcerpt(def, c, t)}</div>
              <div className="mt-0.5 p4-muted">{t(c.explainKey ?? `${c.id}.explain`)}</div>
            </li>
          ))}
        </ul>
      </section>

      {canLink && (
        <button type="button" className={`p4-btn ${linkMode ? 'is-on' : ''}`} aria-pressed={linkMode} onClick={() => { setLinkMode(!linkMode); if (!linkMode) onClose?.() }}>
          <Icon name="link" size={18} /> {linkMode ? t('ui.link.on') : t('ui.link.off')} {connectRemaining(def, progress) === 0 ? '✓' : ''}
        </button>
      )}
    </div>
  )
  if (inline) return <div className="p4-panel">{content}</div>
  return (
    <div className="p4-sheet" role="dialog" aria-modal="true" aria-label={t('ui.casefile')} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>{content}</div>
    </div>
  )
}
