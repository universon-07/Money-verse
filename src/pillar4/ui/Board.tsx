import { useState } from 'react'
import type { CaseDef, CaseProgress, Step } from '../types.ts'
import { indexCase } from '../engine/case.ts'
import { boardCards, shuffle, type DropResult } from '../engine/progress.ts'
import type { T } from './useT.ts'
import { AppIcon, Icon, ReasonIcon } from './icons.tsx'
import { clueExcerpt } from './Notebook.tsx'
import { sfx } from './feedback.ts'

const STEPS: Step[] = [1, 2, 3, 4, 5]

/** an evidence card: source app, the tactic it was tagged with, and the evidence itself */
export function ClueCard({ def, clueId, t, small = false }: { def: CaseDef; clueId: string; t: T; small?: boolean }) {
  const idx = indexCase(def)
  const clue = idx.clues.get(clueId)!
  const app = clue.targets.map((id) => idx.zones.get(id)).find(Boolean)?.item.app
  const linkItem = clue.kind === 'connect' ? def.items.find((i) => i.zones.some((z) => z.linkKey === clue.linkKey)) : null
  return (
    <div className="flex items-center gap-2.5">
      <AppIcon app={app ?? linkItem?.app ?? 'messages'} size={small ? 26 : 32} />
      <span className="min-w-0 flex-1">
        {clue.reason && <span className="block text-[11.5px] font-bold uppercase tracking-wide" style={{ color: 'var(--p4-danger)' }}>{t(`ui.reason.${clue.reason}`)}</span>}
        <span className={`block font-semibold leading-tight ${small ? 'text-[13px]' : 'text-[14px]'}`}>
          {clue.kind === 'connect' ? t('ui.board.card.connect') : clueExcerpt(def, clue, t)}
        </span>
      </span>
      {clue.reason ? <span style={{ color: 'var(--p4-muted)' }}><ReasonIcon reason={clue.reason} size={18} /></span> : <Icon name="link" size={18} />}
    </div>
  )
}

interface Props {
  def: CaseDef
  progress: CaseProgress
  t: T
  onDrop: (cardId: string, step: Step) => DropResult
  onSay: (key: string, mood: 'neutral' | 'pleased' | 'thinking') => void
  onNext: () => void
}

/**
 * Rebuild the attack: each piece of required evidence shows five stage buttons; one tap places it.
 * Hidden items and links were already placed for you. A wrong tap explains nothing punitive: after two misses on
 * one card the stage definitions open, after four the right stage is highlighted.
 */
export function Board({ def, progress, t, onDrop, onSay, onNext }: Props) {
  const idx = indexCase(def)
  const tutorial = def.kind === 'tutorial'
  const usedSteps = new Set(idx.required.map((c) => c.step))
  const [order] = useState(() => shuffle(boardCards(def, progress)))
  const [legend, setLegend] = useState(def.support === 'full' || def.support === 'guided')
  const [shake, setShake] = useState<string | null>(null)
  const unplaced = order.filter((id) => progress.placements[id] === undefined)

  const place = (cardId: string, step: Step) => {
    const r = onDrop(cardId, step)
    if (r.correct) { sfx.snap(); onSay('analyst.boardRight', 'pleased') }
    else {
      sfx.soft()
      onSay('analyst.boardWrong', 'thinking')
      setShake(cardId)
      window.setTimeout(() => setShake(null), 400)
      if (r.showDefs) setLegend(true)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 p-3">
      <div>
        <div className="p4-eyebrow">{t('ui.board.eyebrow')}</div>
        <h2 className="p4-h1">{t('ui.board.title')}</h2>
        <p className="m-0 mt-1 text-[14.5px] p4-muted">{t('ui.board.help')}</p>
      </div>

      <details className="p4-panel !p-3" open={legend} onToggle={(e) => setLegend((e.currentTarget as HTMLDetailsElement).open)}>
        <summary className="cursor-pointer text-[14px] font-bold">{t('ui.board.defs')}</summary>
        <ol className="m-0 mt-2 flex list-none flex-col gap-1.5 p-0 text-[13.5px] leading-snug">
          {STEPS.filter((s) => !tutorial || usedSteps.has(s)).map((s) => (
            <li key={s}><b>{s}. {t(`ui.step.${s}.name`)}</b> <span className="p4-muted">{t(`ui.step.${s}.def`)}</span></li>
          ))}
        </ol>
      </details>

      {unplaced.map((id) => {
        const clue = idx.clues.get(id)!
        const misses = progress.dropWrong[id] ?? 0
        return (
          <div key={id} data-card={id} className={`p4-panel !p-3 ${shake === id ? 'p4-shake' : ''}`}>
            <ClueCard def={def} clueId={id} t={t} />
            <div className="mt-2.5 grid grid-cols-5 gap-1.5" role="group" aria-label={t('ui.board.place')}>
              {STEPS.map((s) => {
                const unused = tutorial && !usedSteps.has(s)
                const hint = misses >= 4 && clue.step === s
                return (
                  <button key={s} type="button" data-place={s} disabled={unused} onClick={() => place(id, s)} aria-label={t(`ui.step.${s}.name`)}
                    className={`p4-btn !min-h-[48px] flex-col !gap-0 !px-0.5 !py-1 ${hint ? 'p4-glow' : ''}`}>
                    <span className="text-[15px] font-extrabold leading-none">{s}</span>
                    <span className="mt-0.5 block max-w-full truncate text-[10.5px] font-semibold leading-tight opacity-80">{t(`ui.step.${s}.name`)}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      <section className="p4-panel !p-3" aria-label={t('ui.board.title')}>
        <div className="p4-eyebrow mb-2">{t('ui.board.chain')}</div>
        <div className="flex flex-col gap-2">
          {STEPS.filter((s) => !tutorial || usedSteps.has(s)).map((s) => {
            const placed = Object.entries(progress.placements).filter(([, st]) => st === s).map(([id]) => id)
            return (
              <div key={s} data-step={s} className="flex flex-col gap-1">
                <div className="text-[13px] font-bold">{s}. {t(`ui.step.${s}.name`)}</div>
                {placed.length === 0 && <div className="text-[12.5px] p4-muted">—</div>}
                {placed.map((id) => <div key={id} className="clue-card p4-pop" style={{ cursor: 'default' }}><ClueCard def={def} clueId={id} t={t} small /></div>)}
              </div>
            )
          })}
        </div>
      </section>

      {progress.boardDone && (
        <div className="p4-panel flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[16px] font-bold" style={{ color: 'var(--p4-ok)' }}><Icon name="check" /> {t('ui.board.done')}</div>
          <button type="button" className="p4-btn primary" onClick={onNext}>{t('ui.board.next')}</button>
        </div>
      )}
    </div>
  )
}
