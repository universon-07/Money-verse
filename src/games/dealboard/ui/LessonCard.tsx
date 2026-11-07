import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LITE_APPENDIX, type LessonRef } from '../engine/lessons'
import type { CompanyId } from '../engine/types'
import type { RunState } from '../engine/state'
import { useInr } from './Panels'
import { useReasonFromParams } from './Reasons'

/** Fills a lesson's placeholders: r_ keys are rupees, the company, sector and the player's own reason are translated. */
export function useFill() {
  const { t } = useTranslation('dealboard')
  const money = useInr()
  const reasonFrom = useReasonFromParams()
  return (params: LessonRef['params']) => {
    const p: Record<string, string | number> = { ...params }
    if (params.companyId) p.company = t(`companies.${params.companyId}.name`)
    if (params.sector) p.sector = t(`sectors.${params.sector}`)
    if (params.companyId && params.reasonKey) p.reason = reasonFrom(params, params.companyId as CompanyId) ?? ''
    for (const [k, v] of Object.entries(params)) if (k.startsWith('r_')) p[k] = money(Number(v))
    return p
  }
}

function Appendix({ n }: { n: number }) {
  const { t } = useTranslation('dealboard')
  const base = `appendix.${n}`
  const checks = t(`${base}.checks`, { returnObjects: true }) as string[]
  return (
    <div className="mt-2 rounded-lg border-2 border-ink bg-white/60 p-3 text-[14px] leading-snug">
      <div className="font-sign lang-fit text-[15px]">{t(`${base}.title`)}</div>
      <p className="m-0 mt-1.5">{t(`${base}.idea`)}</p>
      <div className="db-eyebrow mt-2.5 text-[#8a5a2b]">{t('lesson.worked')}</div>
      <p className="m-0 mt-0.5">{t(`${base}.example`)}</p>
      <div className="db-eyebrow mt-2.5 text-[#8a5a2b]">{t('lesson.checks')}</div>
      <ul className="m-0 mt-0.5 list-disc pl-5">{checks.map((c, i) => <li key={i}>{c}</li>)}</ul>
    </div>
  )
}

/**
 * One lesson: what happened in your own run and the rule of thumb up front; the idea, the real-life term and the
 * full explanation sit behind one toggle so the card stays short.
 */
export function LessonCard({ run, onContinue, onReplay }: { run: RunState; onContinue: () => void; onReplay: () => void }) {
  const { t } = useTranslation('dealboard')
  const fill = useFill()
  const [more, setMore] = useState(false)
  const [deep, setDeep] = useState(false)
  const ref = run.lesson!
  const earned = ref.id >= 100
  const base = earned ? `earned.${ref.id}` : `lite.${ref.id}`
  const did = t(!earned && ref.variant === 'b' ? `${base}.didB` : `${base}.did`, fill(ref.params))
  const usedReplay = run.rewinds.includes(Math.ceil(run.turn / 4))
  const title = earned ? t('earned.title') : t(`${base}.title`)
  const tone = earned ? '#3F7A3A' : '#C9506F'
  return (
    <section className="paper db-sheet db-in relative overflow-hidden p-4" aria-live="polite">
      <div className="absolute inset-x-0 top-0 h-2 border-b-2 border-ink" style={{ background: tone }} />
      <div className="mt-1 flex items-center gap-2">
        <span className="font-sign grid h-8 w-8 shrink-0 place-items-center rounded-full border-[2.5px] border-ink text-[15px] text-jasmine" style={{ background: tone }} aria-hidden>{earned ? '★' : '✎'}</span>
        <div className="min-w-0">
          <div className="db-eyebrow lang-fit text-[#8a5a2b]">{t('lesson.eyebrow')}</div>
          <h2 className="font-sign lang-fit m-0 text-[19px] leading-tight">{title}</h2>
        </div>
      </div>

      <p className="m-0 mt-3 text-[15px] font-semibold leading-snug">{did}</p>
      <div className="mt-3 rounded-lg border-2 border-dashed border-ink bg-[#F6E6BE] px-3 py-2">
        <div className="db-eyebrow text-[#8a5a2b]">{t('lesson.rule')}</div>
        <p className="m-0 text-[15px] font-extrabold leading-snug">{t(`${base}.rule`)}</p>
      </div>

      <button type="button" className="mt-2 flex min-h-11 w-full items-center justify-between text-left text-[13px] font-extrabold" aria-expanded={more} onClick={() => setMore(!more)}>
        <span>{t('lesson.theIdea')}</span><span aria-hidden>{more ? '▴' : '▾'}</span>
      </button>
      {more && (
        <div className="space-y-2 text-[14px] leading-snug">
          <p className="m-0">{t(`${base}.idea`)}</p>
          {!earned && <p className="m-0"><span className="rounded border-2 border-ink bg-mustard px-1.5 py-0.5 text-[12px] font-extrabold uppercase tracking-wide">{t(`${base}.term`)}</span></p>}
          {!earned && (
            <>
              <button type="button" className="min-h-11 text-[13px] font-extrabold underline decoration-2 underline-offset-4" aria-expanded={deep} onClick={() => setDeep(!deep)}>{deep ? t('lesson.hide') : t('lesson.learnMore')}</button>
              {deep && LITE_APPENDIX[ref.id].map((n) => <Appendix key={n} n={n} />)}
            </>
          )}
          <p className="m-0 text-[12px] italic opacity-65">{t('lesson.calm')}</p>
        </div>
      )}

      <div className="db-actions mt-3 flex items-stretch justify-center gap-2">
        {!earned && (
          <button type="button" className="ink-btn cream" disabled={usedReplay} style={{ opacity: usedReplay ? 0.5 : 1 }} title={usedReplay ? t('lesson.replayUsed') : t('lesson.replayHint')} onClick={onReplay}>
            ⟲ {t('lesson.replay')}
          </button>
        )}
        <button type="button" className="ink-btn pink" onClick={onContinue}>{t('lesson.continue')} ▸</button>
      </div>
    </section>
  )
}
