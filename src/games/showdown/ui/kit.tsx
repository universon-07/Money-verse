import { useEffect, useState, type ReactNode } from 'react'
import type { CashLines } from '../engine/lines'
import { POINTS } from '../engine/types'
import { MONEY_VARS, type LessonLine } from '../engine/lessons'
import type { Point } from '../engine/types'
import { CAST, type CastId } from './cast'
import { useLabel } from './labels'
import { useSd } from './useSd'

export function GuardrailFooter() {
  const { t } = useSd()
  return <p className="m-0 px-3 py-2 text-center text-[12px] font-extrabold" style={{ color: '#7A2A22' }} role="note">ⓘ {t('guardrail')}</p>
}

export function Portrait({ who, size = 64 }: { who: CastId; size?: number }) {
  return <img src={`${import.meta.env.BASE_URL}art/${CAST[who]}.webp`} alt="" aria-hidden width={size} height={size * 1.6} className="shrink-0 object-contain" style={{ height: size * 1.6, clipPath: who === 'shobha' ? 'inset(0 9% 0 0)' : undefined }} />
}

/** A cast member says one or two short lines (never which option to pick). */
export function Say({ who, children }: { who: CastId; children: ReactNode }) {
  const { t } = useSd()
  return (
    <div className="flex items-end gap-2">
      <Portrait who={who} />
      <div className="ink-chip relative mb-3 flex-1 !rounded-2xl px-3.5 py-2.5">
        <span aria-hidden className="absolute -left-[9px] bottom-5 h-4 w-4 rotate-45 border-b-[3px] border-l-[3px] border-ink" style={{ background: '#FFF8E6' }} />
        <div className="font-sign lang-fit text-[12px] text-pink">{t(`cast.${who}`)}</div>
        <div className="text-[15px] font-extrabold leading-snug">{children}</div>
      </div>
    </div>
  )
}

/** Bottom sheet over the screen. */
export function Sheet({ children, label, onClose }: { children: ReactNode; label: string; onClose: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={label}>
      <div className="absolute inset-0" style={{ background: 'rgba(43,26,23,.55)' }} onClick={onClose} />
      <div className="paper relative mx-2 mb-2 max-h-[90%] w-full max-w-md overflow-y-auto p-4">{children}</div>
    </div>
  )
}

/** A multiple-choice question: tap one, then lock it in. Nothing is marked right or wrong here. */
export function Ask({ q, opts, value, onPick, onLock, go, note }: { q: string; opts: [string, string][]; value: string | null; onPick: (id: string) => void; onLock?: () => void; go?: string; note?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="m-0 text-[16px] font-extrabold leading-snug">{q}</p>
      <div className="flex flex-col gap-2" role="radiogroup" aria-label={q}>
        {opts.map(([id, label]) => (
          <button key={id} type="button" role="radio" aria-checked={value === id} onClick={() => onPick(id)} className="ink-chip min-h-12 px-3 text-left text-[15px] font-bold" style={{ background: value === id ? '#E8B04A' : undefined }}>
            {value === id ? '● ' : '○ '}{label}
          </button>
        ))}
      </div>
      {note && <p className="m-0 text-[12px] font-bold opacity-80">{note}</p>}
      {onLock && <button type="button" className="ink-btn pink self-center" disabled={!value} style={{ opacity: value ? 1 : 0.5 }} onClick={onLock}>{go}</button>}
    </div>
  )
}

/**
 * The two cash lines, as a table so every number has text (a negative is "Short", never just a colour).
 * The certain line is what the cushion is measured on.
 */
/** The money path: how much money is left in the fund after each date's bills, as bars, with what "spare money" means. */
export function CashLinesTable({ lines }: { lines: CashLines }) {
  const { t, money, when } = useSd()
  const top = Math.max(1, ...POINTS.flatMap((p) => [lines.optimistic[p], lines.cautious[p]]))
  const lowest = (['W1', 'W2', 'W3'] as const).reduce((a, p) => (lines.cautious[p] < lines.cautious[a] ? p : a), 'W1' as Point)
  const short = lines.cushion < 0
  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-sign lang-fit m-0 text-[15px]">{t('lines.title')}</h2>
      <p className="m-0 text-[13px] font-bold leading-snug">{t('lines.intro')}</p>
      <ul className="m-0 flex list-none flex-col gap-2 p-0" aria-label={t('lines.title')}>
        {POINTS.map((p) => {
          const sure = lines.cautious[p]
          const all = lines.optimistic[p]
          return (
            <li key={p}>
              <div className="flex items-baseline justify-between text-[13px] font-extrabold">
                <span>{when(p)} <span className="font-bold opacity-80">· {t('lines.bills', { money: money(lines.due[p]) })}</span></span>
                <span style={{ color: sure < 0 ? '#7A2A22' : undefined }}>{sure < 0 ? `▼ ${t('lines.shortBy', { money: money(-sure) })}` : t('lines.sure', { money: money(sure) })}</span>
              </div>
              <div className="relative h-5 overflow-hidden rounded-md border-2 border-ink" style={{ background: '#FFF8E6' }} aria-hidden>
                <div className="absolute inset-y-0 left-0" style={{ width: `${(Math.max(all, 0) / top) * 100}%`, background: 'repeating-linear-gradient(45deg,#F3D58A,#F3D58A 5px,#FFF1C4 5px,#FFF1C4 10px)' }} />
                <div className="absolute inset-y-0 left-0" style={{ width: `${(Math.max(sure, 0) / top) * 100}%`, background: '#3F7A3A' }} />
                {sure < 0 && <div className="absolute inset-0 grid place-items-center text-[11px] font-extrabold" style={{ background: '#F7C9C0', color: '#7A2A22' }}>{t('lines.short')}</div>}
              </div>
              {all > sure && <div className="text-right text-[11px] font-bold opacity-80">{t('lines.promised', { money: money(all) })}</div>}
            </li>
          )
        })}
      </ul>
      <p className="m-0 flex flex-wrap gap-x-3 text-[11px] font-bold">
        <span><span aria-hidden style={{ color: '#3F7A3A' }}>■</span> {t('lines.keySure')}</span>
        <span><span aria-hidden style={{ color: '#E8B04A' }}>▨</span> {t('lines.keyPromised')}</span>
      </p>
      <div className="rounded-xl border-[3px] border-ink px-3 py-2" style={{ background: short ? '#F7C9C0' : '#E6F2DF' }}>
        <div className="text-[15px] font-extrabold">{short ? '▼ ' + t('lines.verdictShort', { when: when(lowest), money: money(-lines.cushion) }) : t('lines.verdictOk', { money: money(lines.cushion) })}</div>
        <div className="mt-0.5 text-[12px] font-bold leading-snug">{short ? t('lines.explainShort') : t('lines.explainOk', { when: when(lowest) })}</div>
      </div>
      <p className="m-0 text-[11px] font-bold opacity-80">{t('lines.note')}</p>
    </div>
  )
}

/** A lesson card: what happened, the idea, the rule, and a Learn more with five short parts. The real-life idea is named only after it was felt. */
export function LessonCard({ line, tilt = 0 }: { line: LessonLine; tilt?: number }) {
  const { t, money, when } = useSd()
  const label = useLabel()
  const [more, setMore] = useState(false)
  const vars: Record<string, string | number> = {}
  for (const [k, v] of Object.entries(line.vars)) {
    vars[k] = MONEY_VARS.includes(k) ? money(Number(v)) : k === 'item' || k === 'bill' ? label(String(v)) : k === 'goal' ? t(`goals.${v}.name`) : k === 'when' ? when(v as Point) : v
  }
  const id = line.id
  return (
    <div className="paper p-3 text-left" style={{ transform: `rotate(${tilt}deg)` }}>
      <div className="font-sign lang-fit text-[12px] tracking-[.15em] text-pink">{t('lesson.rule')} · {t(`concepts.${id === 'L1' ? 'C1' : id === 'L2' ? 'C2' : id === 'L3' ? 'C3' : id === 'L4' ? 'C4' : id === 'L5' ? 'C5' : 'C7'}`)}</div>
      <p className="m-0 mt-1 text-[15px] font-extrabold leading-snug">{t(`lesson.${line.key}`, vars)}</p>
      <p className="m-0 mt-1 text-[14px] leading-snug">{t(`lesson.${id}.idea`)}</p>
      <p className="font-sign lang-fit m-0 mt-2 text-[17px]">“{t(`lesson.${id}.rule`)}”</p>
      <button type="button" className="mt-1 min-h-12 text-[13px] font-extrabold underline" aria-expanded={more} onClick={() => setMore(!more)}>{more ? t('lesson.less') : t('lesson.learnMore')}</button>
      {more && (
        <dl className="m-0 flex flex-col gap-1.5 text-[13px] leading-snug">
          {(['what', 'idea', 'example', 'real', 'ask'] as const).map((part) => (
            <div key={part}><dt className="font-extrabold">{t(`lesson.parts.${part}`)}</dt><dd className="m-0">{t(`lesson.${id}.more.${part}`)}</dd></div>
          ))}
        </dl>
      )}
    </div>
  )
}
