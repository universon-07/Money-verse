import { useState } from 'react'
import { schedule } from '../engine/contract'
import { PREDICTIONS } from '../engine/predictions'
import { POINTS, type Point } from '../engine/types'
import { useShowdown, useView } from '../state/store'
import { Ask, CashLinesTable } from './kit'
import { useSd } from './useSd'
import { RULES } from '../engine/content'

/** S7: both cash lines, the cushion, the bills by date, the P3 guess, and "Lock plan". After locking, the plan is frozen. */
export function PlanCheck() {
  const { t, money, when } = useSd()
  const decide = useShowdown((s) => s.decide)
  const unsee = useShowdown((s) => s.unsee)
  const { market: m, lines } = useView()
  const [v, setV] = useState<string | null>(null)

  const bills: Record<Point, [string, number][]> = { W1: [['permits', RULES.permits]], W2: [], W3: [], FD: [] }
  for (const c of m.signed) {
    const [sched] = schedule(c)
    for (const p of POINTS) if ((sched[p] ?? 0) > 0) bills[p].push([c.id, Math.round(sched[p]!)])
  }
  const nameOf = (id: string) => (id === 'permits' ? t('check.permits') : t(`items.${id}.name`))

  return (
    <div className="flex flex-col gap-3">
      <div className="paper p-3"><h1 className="font-display lang-fit m-0 text-[22px]">{t('check.title')}</h1></div>
      <section className="paper p-3"><CashLinesTable lines={lines} /></section>
      <section className="paper p-3">
        <h2 className="font-sign lang-fit m-0 text-[15px]">{t('check.due')}</h2>
        <div className="mt-1 flex flex-col gap-2">
          {POINTS.map((p) => (
            <div key={p}>
              <div className="flex justify-between text-[14px] font-extrabold"><span>{when(p)}</span><span>{money(lines.due[p])}</span></div>
              <ul className="m-0 list-none p-0 text-[12px] font-bold opacity-80">
                {bills[p].length ? bills[p].map(([id, a]) => <li key={id} className="flex justify-between"><span>{nameOf(id)}</span><span>{money(a)}</span></li>) : <li>{t('check.none')}</li>}
              </ul>
            </div>
          ))}
        </div>
      </section>
      <section className="paper p-3">
        <div className="font-sign lang-fit mb-1 text-[13px] text-pink">{t('ask.label')}</div>
        <Ask q={t('ask.P3.q')} opts={PREDICTIONS.P3.options.map((o) => [o, t(`ask.P3.opts.${o}`)])} value={v} onPick={setV} />
      </section>
      <div className="flex flex-col items-center gap-1">
        <button type="button" className="ink-btn pink" disabled={!v} style={{ opacity: v ? 1 : 0.5 }} onClick={() => { decide({ k: 'predict', id: 'P3', answer: v! }); decide({ k: 'lock' }) }}>🔒 {t('check.lock')}</button>
        <p className="m-0 text-center text-[12px] font-bold opacity-80">{v ? t('check.lockNote') : t('check.needAnswer')}</p>
        <button type="button" className="ink-btn cream mt-1" onClick={() => unsee('market')}>◀ {t('check.back')}</button>
      </div>
    </div>
  )
}
