import { useState } from 'react'
import { TitleCard } from '../../../components/TitleCard'
import { PREDICTIONS } from '../engine/predictions'
import { POINTS, type GoalId } from '../engine/types'
import { useShowdown } from '../state/store'
import { Ask, Say } from './kit'
import { useSd } from './useSd'

export function Start() {
  const { t } = useSd()
  const log = useShowdown((s) => s.log)
  const decide = useShowdown((s) => s.decide)
  const restart = useShowdown((s) => s.restart)
  return (
    <div className="flex flex-col gap-4">
      <TitleCard eyebrow={t('start.eyebrow')} title={t('title')}>
        <p className="m-0">{t('start.tagline')}</p>
      </TitleCard>
      <section className="paper p-3">
        <ol className="m-0 flex list-none flex-col gap-1 p-0 text-[14px] font-bold leading-snug">
          {[1, 2, 3].map((n) => <li key={n}><span className="font-extrabold">{n}.</span> {t(`start.how.${n}`)}</li>)}
        </ol>
      </section>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" className="ink-btn pink" onClick={() => decide({ k: 'seen', screen: 'start' })}>{log.length ? t('start.resume') : t('start.go')} ▶</button>
        {log.length > 0 && <button type="button" className="ink-btn cream" onClick={() => { if (window.confirm(t('start.again'))) restart() }}>{t('start.again')}</button>}
      </div>
    </div>
  )
}

const LANES: [string, number, string][] = [
  ['confirmed', 20000, '#3F7A3A'],
  ['sponsor', 15000, '#E8B04A'],
  ['donation', 5000, '#F28C28'],
  ['event', 10000, '#5BB5D6'],
]

/** S2: the committee, ₹50,000 on paper, four money lanes and five dates. */
export function Brief() {
  const { t, money, when } = useSd()
  const decide = useShowdown((s) => s.decide)
  const [open, setOpen] = useState(false)
  return (
    <div className="flex flex-col gap-3">
      <Say who="shobha"><p className="m-0">{t('brief.l1')}</p><p className="m-0">{t('brief.l2')}</p></Say>
      <section className="paper p-3">
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {LANES.map(([id, amount, color]) => (
            <li key={id} className="flex items-center gap-2 rounded-lg border-[3px] border-ink px-2.5 py-1.5" style={{ background: '#FFF8E6', borderLeft: `10px solid ${color}` }}>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-extrabold leading-tight">{t(`brief.lanes.${id}.name`)}</div>
                <div className="text-[12px] font-bold opacity-80">{t(`brief.lanes.${id}.note`)}</div>
              </div>
              <div className="font-display text-[20px]">{id === 'event' ? '~' : ''}{money(amount)}</div>
            </li>
          ))}
        </ul>
        <div className="mt-3 text-[12px] font-extrabold">{t('brief.dates')}</div>
        <ol className="m-0 mt-1 flex list-none items-center gap-1 p-0">
          {(['TODAY', ...POINTS] as const).map((p, i) => (
            <li key={p} className="flex flex-1 flex-col items-center text-center">
              <span className="grid h-7 w-7 place-items-center rounded-full border-[3px] border-ink bg-mustard text-[12px] font-extrabold">{i + 1}</span>
              <span className="mt-0.5 text-[11px] font-extrabold leading-tight">{t(`dates.${p}`)}</span>
            </li>
          ))}
        </ol>
        <span className="sr-only">{POINTS.map(when).join(', ')}</span>
      </section>
      <button type="button" className="ink-chip min-h-12 !rounded-2xl px-3 text-left text-[14px] font-extrabold" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span aria-hidden className="mr-2 inline-grid h-7 w-7 place-items-center rounded-full border-[3px] border-ink bg-mustard font-display text-[16px] align-middle">?</span>{t('brief.what')}
      </button>
      {open && <p className="paper anim-unfurl m-0 p-3 text-[14px] font-bold leading-snug">{t('brief.whatText')}</p>}
      <button type="button" className="ink-btn pink self-center" onClick={() => decide({ k: 'seen', screen: 'brief' })}>{t('brief.go')} ▶</button>
    </div>
  )
}

const GOALS: GoalId[] = ['G1', 'G2', 'G3', 'G5']

/** S3: pick three goals and rank them. Rank decides which goal is protected when money runs short. */
export function Goals() {
  const { t } = useSd()
  const decide = useShowdown((s) => s.decide)
  const [picked, setPicked] = useState<GoalId[]>([])
  const move = (i: number, d: number) => setPicked((p) => { const a = [...p]; const j = i + d; if (j < 0 || j >= a.length) return p; [a[i], a[j]] = [a[j], a[i]]; return a })
  return (
    <div className="flex flex-col gap-3">
      <div className="paper p-3">
        <h1 className="font-display lang-fit m-0 text-[22px] leading-tight">{t('goals.title')}</h1>
        <p className="m-0 mt-1 text-[14px] font-bold leading-snug">{t('goals.sub')}</p>
      </div>
      <ol className="m-0 flex list-none flex-col gap-2 p-0">
        {picked.map((g, i) => (
          <li key={g} className="paper flex items-center gap-2 p-2.5" style={{ background: '#FFE08A' }}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-[3px] border-ink bg-pink text-[14px] font-extrabold text-jasmine" aria-label={t('goals.rank', { n: i + 1 })}>{i + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="font-sign lang-fit text-[16px] leading-tight">{t(`goals.${g}.name`)}</div>
              <div className="text-[12px] font-bold opacity-80">{t(`goals.${g}.need`)}</div>
            </div>
            <div className="flex gap-1">
              <button type="button" className="ink-chip grid h-12 w-10 place-items-center disabled:opacity-40" disabled={i === 0} aria-label={t('goals.up')} onClick={() => move(i, -1)}>▲</button>
              <button type="button" className="ink-chip grid h-12 w-10 place-items-center disabled:opacity-40" disabled={i === picked.length - 1} aria-label={t('goals.down')} onClick={() => move(i, 1)}>▼</button>
              <button type="button" className="ink-chip grid h-12 w-10 place-items-center" aria-label={t('goals.remove')} onClick={() => setPicked(picked.filter((x) => x !== g))}>✕</button>
            </div>
          </li>
        ))}
        {GOALS.filter((g) => !picked.includes(g)).map((g) => (
          <li key={g}>
            <button type="button" disabled={picked.length >= 3} onClick={() => setPicked([...picked, g])} className="paper flex min-h-14 w-full items-center gap-2 p-2.5 text-left disabled:opacity-50">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-[3px] border-dashed border-ink text-[18px]" aria-hidden>+</span>
              <span className="min-w-0 flex-1">
                <span className="font-sign lang-fit block text-[16px] leading-tight">{t(`goals.${g}.name`)}</span>
                <span className="block text-[12px] font-bold opacity-80">{t(`goals.${g}.need`)}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
      {picked.length < 3 && <p className="m-0 text-center text-[13px] font-extrabold">{t('goals.pick', { n: 3 - picked.length })}</p>}
      <button type="button" className="ink-btn pink self-center" disabled={picked.length !== 3} style={{ opacity: picked.length === 3 ? 1 : 0.5 }} onClick={() => decide({ k: 'goals', ranked: picked })}>{t('goals.go')} ▶</button>
    </div>
  )
}

/** S4: Prediction P1, revealed at the debrief. */
const LAST_YEAR: [string, number][] = [['hall', 11000], ['sound', 8000], ['lights', 5500], ['plates', 7400], ['kids', 3000], ['posters', 4000]]

export function PredictP1() {
  const { t, money } = useSd()
  const decide = useShowdown((s) => s.decide)
  const [v, setV] = useState<string | null>(null)
  return (
    <div className="flex flex-col gap-3">
      <div className="font-sign lang-fit text-center text-[13px] text-pink">{t('p1.label')}</div>
      <section className="paper p-3" aria-label={t('p1.intro')}>
        <div className="text-[12px] font-extrabold opacity-80">{t('p1.intro')}</div>
        <ul className="m-0 mt-1 list-none p-0">
          {LAST_YEAR.map(([id, amt]) => (
            <li key={id} className="flex justify-between border-b-2 border-dashed border-ink/30 py-1 text-[14px] font-bold"><span>{t(`p1.rows.${id}`)}</span><span>{money(amt)}</span></li>
          ))}
        </ul>
        <div className="mt-1 flex justify-between font-display text-[18px]"><span>{t('p1.total')}</span><span>{money(38900)}</span></div>
      </section>
      <div className="paper p-3">
        <Ask q={t('p1.q')} opts={PREDICTIONS.P1.options.map((o) => [o, t(`p1.opts.${o}`)])} value={v} onPick={setV} go={t('p1.go')} note={t('p1.note')} onLock={() => v && decide({ k: 'predict', id: 'P1', answer: v })} />
      </div>
    </div>
  )
}
