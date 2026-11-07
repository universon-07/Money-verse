import { useState } from 'react'
import type { Outcome, Reason } from '../types.ts'
import type { T } from './useT.ts'
import { ReasonIcon } from './icons.tsx'
import { Speaker } from './Speaker.tsx'

export type Pick = Reason | 'fine'

const LINE: Record<Outcome['kind'], string> = {
  correct: 'analyst.correct', wrong: 'analyst.wrongReason', herring_fine: 'analyst.fineCorrect', herring_any: 'analyst.herringAny',
  context: 'analyst.context', ordinary: 'analyst.ordinary', duplicate: 'analyst.duplicate',
}

/** the analyst line for an outcome */
export const outcomeLine = (o: Outcome, pick: Pick): string =>
  o.kind === 'wrong' && pick === 'fine' ? 'analyst.fineWrong' : LINE[o.kind]

interface Props {
  t: T
  quote: string
  /** reason options are fixed once when the sheet opens, so they do not reshuffle on re-render */
  makeOptions: () => Pick[]
  resolve: (pick: Pick) => { outcome: Outcome; pick: Pick }
  onClose: () => void
}

export function ReportSheet({ t, quote, makeOptions, resolve, onClose }: Props) {
  const [step, setStep] = useState<'reason' | 'result'>('reason')
  const [options] = useState(makeOptions)
  const [res, setRes] = useState<{ outcome: Outcome; pick: Pick } | null>(null)
  const choose = (pick: Pick) => { setRes(resolve(pick)); setStep('result') }
  const o = res?.outcome
  const explain = o?.explainKey ? t(o.explainKey) : null
  return (
    <div className="p4-sheet" role="dialog" aria-modal="true" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>
        <div className="p4-eyebrow mb-1">{t('ui.report.evidence')}</div>
        <blockquote className="m-0 mb-3 rounded-lg p-3 text-[14.5px] leading-snug" style={{ background: 'var(--p4-surface2)', borderLeft: '3px solid var(--p4-accent)', whiteSpace: 'pre-line' }}>
          {quote.length > 180 ? quote.slice(0, 177) + '…' : quote}
        </blockquote>

        {step === 'reason' && (
          <>
            <div className="p4-h2 mb-2">{t('ui.report.why')}</div>
            <div className="flex flex-col gap-2" role="list">
              {options.map((r) => (
                <button key={r} type="button" role="listitem" className="p4-option" onClick={() => choose(r)} data-reason={r}>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full" style={{ background: 'var(--p4-surface)', color: 'var(--p4-accent)' }}><ReasonIcon reason={r} /></span>
                  <span className="min-w-0">
                    <span className="block text-[15.5px] font-bold">{t(`ui.reason.${r}`)}</span>
                    <span className="block text-[13px] leading-snug p4-muted">{t(`ui.reason.${r}.def`)}</span>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 'result' && o && res && (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2">
              <div className="p4-h2 min-w-0 flex-1" style={{ color: o.kind === 'correct' ? 'var(--p4-ok)' : undefined }}>{t(outcomeLine(o, res.pick))}</div>
              {explain && <Speaker text={explain} />}
            </div>
            {o.kind === 'correct' && res.pick !== 'fine' && (
              <div className="p4-chip is-ok p4-pop w-fit"><ReasonIcon reason={res.pick} size={16} /> {t('ui.report.logged')}: {t(`ui.reason.${res.pick}`)}</div>
            )}
            {explain && <p className="m-0 text-[15px] leading-relaxed">{explain}</p>}
            {o.kind === 'correct' && res.pick !== 'fine' && (
              <details className="rounded-lg p-3 text-[13.5px] leading-snug" style={{ background: 'var(--p4-surface2)' }}>
                <summary className="cursor-pointer font-bold">{t('ui.report.principle')}</summary>
                <p className="m-0 mt-1.5">{t(`ui.reason.${res.pick}.why`)}</p>
              </details>
            )}
            <button type="button" className="p4-btn primary self-start" onClick={onClose} autoFocus>{t('ui.ok')}</button>
          </div>
        )}
      </div>
    </div>
  )
}
