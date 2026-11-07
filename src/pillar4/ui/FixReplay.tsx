import { useState } from 'react'
import type { CaseDef, CaseProgress } from '../types.ts'
import { firstTryRate, gradeOf, shuffle, type FixResult } from '../engine/progress.ts'
import type { T } from './useT.ts'
import { Icon, ShieldMark } from './icons.tsx'
import { Speaker } from './Speaker.tsx'
import { ClueCard } from './Board.tsx'
import { sfx } from './feedback.ts'

export function HelpCard({ t }: { t: T }) {
  return (
    <div className="p4-panel">
      <div className="p4-eyebrow mb-1">{t('ui.help.eyebrow')}</div>
      <h3 className="p4-h2 mb-2">{t('ui.help.title')}</h3>
      <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[15px] leading-snug">
        {[1, 2, 3, 4].map((n) => <li key={n} className="flex gap-2"><span style={{ color: 'var(--p4-accent)' }}><Icon name="check" size={18} /></span><span>{t(`ui.help.${n}`)}</span></li>)}
      </ul>
    </div>
  )
}

// ---- Decision ------------------------------------------------------------------------------------------
interface FixProps {
  def: CaseDef
  progress: CaseProgress
  t: T
  onAnswer: (key: string) => FixResult
  onSay: (key: string, mood: 'neutral' | 'pleased' | 'thinking' | 'reassuring') => void
  onNext: () => void
}

export function FixQuestion({ def, progress, t, onAnswer, onSay, onNext }: FixProps) {
  const [order] = useState(() => shuffle(def.fix.options.map((o) => o.key)))
  const [why, setWhy] = useState<Record<string, string>>({})
  const done = progress.fixDone
  const shield = def.fix.shield
  const answer = (key: string) => {
    if (done) return
    const r = onAnswer(key)
    if (r.correct) { sfx.success(); onSay('analyst.fixCorrect', 'pleased') }
    else { sfx.soft(); setWhy((w) => ({ ...w, [key]: r.whyKey })); onSay('analyst.fixWrong', 'reassuring') }
  }
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
      <div>
        <div className="p4-eyebrow">{t('ui.fix.eyebrow')}</div>
        <h2 className="p4-h1">{t('ui.fix.title')}</h2>
      </div>
      <div className="flex items-start gap-2">
        <p className="m-0 flex-1 text-[17px] font-semibold leading-snug">{t(def.fix.qKey)}</p>
        <Speaker text={t(def.fix.qKey)} />
      </div>
      <div className="flex flex-col gap-2.5" role="list">
        {order.map((key) => {
          const opt = def.fix.options.find((o) => o.key === key)!
          const wrong = !!why[key]
          const right = done && opt.correct
          return (
            <div key={key} role="listitem">
              <button type="button" disabled={done && !right} onClick={() => answer(key)} data-fix={opt.correct ? 'correct' : 'wrong'}
                className={`p4-option ${right ? 'is-right' : wrong ? 'is-wrong' : ''}`} style={{ opacity: done && !right ? 0.5 : 1 }}>
                <span className="text-[15.5px] font-semibold">{t(key)}</span>
              </button>
              {(wrong || right) && <p className="m-0 mt-1.5 px-1 text-[14px] leading-snug" style={{ color: right ? 'var(--p4-ok)' : 'var(--p4-danger)' }}>{t(opt.whyKey || why[key])}</p>}
            </div>
          )
        })}
      </div>
      {done && (
        <div className="p4-panel p4-pop flex flex-col items-center gap-2 text-center">
          {shield && (
            <>
              <ShieldMark pieces={[shield]} size={72} />
              <div className="p4-h2">{t('ui.shield.earned', { name: t(`ui.shield.${shield}`) })}</div>
              <p className="m-0 max-w-md text-[14.5px] leading-snug p4-muted">{t(`ui.shield.${shield}.rule`)}</p>
            </>
          )}
          <button type="button" className="p4-btn primary" onClick={onNext}>{t('ui.fix.watch')}</button>
        </div>
      )}
    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-[14.5px]" style={{ borderBottom: '1px solid rgba(58,42,36,.2)' }}><span className="p4-muted">{k}</span><span className="font-bold">{v}</span></div>
  )
}

// ---- Debrief: one page. Result first, then how it worked, the chain, the controls, evidence on request ------
interface DebriefProps { def: CaseDef; progress: CaseProgress; t: T; onFinish: () => void; total: number }

export function Debrief({ def, progress, t, onFinish, total }: DebriefProps) {
  const grade = gradeOf(def, progress)
  const rate = Math.round(firstTryRate(def, progress) * 100)
  const hinted = def.kind === 'mystery' ? progress.helpUsed : progress.hintUsed
  const reviewed = def.clues.filter((c) => c.kind !== 'connect' && progress.pinned.includes(c.id))
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="p4-eyebrow">{t('ui.report.eyebrow')}</div>
          <h2 className="p4-h1">{t(`${def.id}.title`)}</h2>
        </div>
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-lg text-[28px] font-black" style={{ background: 'var(--p4-accent)', color: 'var(--p4-accent-ink)', border: '1.5px solid var(--p4-ink)' }} aria-label={`${t('ui.report.grade')} ${grade}`}>{grade}</span>
      </div>

      <section className="p4-panel !p-3">
        <Row k={t('ui.report.firstTry')} v={`${rate}%`} />
        <Row k={t('ui.report.hints')} v={hinted ? t('ui.report.yes') : t('ui.report.none')} />
        {def.kind !== 'tutorial' && <Row k={t('ui.report.decision')} v={progress.fixAttempts <= 1 ? t('ui.report.firstTryOk') : t('ui.report.attempts', { n: progress.fixAttempts })} />}
        <Row k={t('ui.report.points')} v={`+${total}`} />
      </section>

      <section className="p4-panel">
        <div className="p4-eyebrow mb-1">{t('ui.debrief.mechanism')}</div>
        <p className="m-0 text-[15px] leading-relaxed">{t(`${def.id}.debrief.mechanism`)}</p>
      </section>

      <section className="p4-panel">
        <div className="p4-eyebrow mb-2">{t('ui.replay.title')}</div>
        <ol className="m-0 flex list-none flex-col gap-2 p-0">
          {def.replay.map((b, i) => (
            <li key={i} className="flex gap-2.5 text-[14.5px] leading-snug">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[12px] font-extrabold" style={{ background: 'var(--p4-accent)', color: 'var(--p4-accent-ink)' }}>{b.step}</span>
              <span>{t(b.captionKey)}</span>
              <Speaker text={t(b.captionKey)} className="ml-auto" />
            </li>
          ))}
        </ol>
      </section>

      <section className="p4-panel">
        <div className="p4-eyebrow mb-2">{t('ui.debrief.controls')}</div>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {[1, 2, 3].map((n) => (
            <li key={n} className="flex gap-2 text-[14.5px] leading-snug"><span style={{ color: 'var(--p4-ok)' }}><Icon name="shield" size={18} /></span><span>{t(`${def.id}.debrief.c${n}`)}</span></li>
          ))}
        </ul>
      </section>

      <details className="p4-panel !p-3">
        <summary className="cursor-pointer text-[14px] font-bold">{t('ui.debrief.evidence')}</summary>
        <ul className="m-0 mt-2 flex list-none flex-col gap-3 p-0">
          {reviewed.map((c) => (
            <li key={c.id} className="text-[13.5px] leading-snug">
              <div className="mb-1"><ClueCard def={def} clueId={c.id} t={t} small /></div>
              <div className="p4-muted">{t(c.explainKey ?? `${c.id}.explain`)}</div>
            </li>
          ))}
        </ul>
      </details>

      <details className="p4-panel !p-3">
        <summary className="cursor-pointer text-[14px] font-bold">{t('ui.help.title')}</summary>
        <ul className="m-0 mt-2 flex list-none flex-col gap-1.5 p-0 text-[14px] leading-snug">
          {[1, 2, 3, 4].map((n) => <li key={n}>• {t(`ui.help.${n}`)}</li>)}
        </ul>
      </details>

      <p className="m-0 text-[14px] italic p4-muted">{t(`${def.id}.closing`)}</p>
      <button type="button" className="p4-btn primary w-full" onClick={onFinish}>{t('ui.replay.finish')}</button>
    </div>
  )
}
