import { useEffect, useState } from 'react'
import { ECON, card, type FriendCard } from '../engine/content'
import { weeksToGoal } from '../engine/goal'
import { weekLedger } from '../engine/ledger'
import type { State, WeekScript } from '../engine/types'
import { usePayRun } from '../state/store'
import { MoneyStepper, Pot } from './kit'
import { usePr } from './usePr'

const GROUP_COLOR: Record<string, string> = { musthave: '#2F6F73', bills: '#D8503A', wants: '#E5457A', treats: '#F28C28', lostlent: '#8C7B6E' }

/** Step 5: every rupee, where it went, how the friends answered, and what to do with the leftover cash. */
export function Review({ state, script }: { state: State; script: WeekScript }) {
  const { t, money } = usePr()
  const decide = usePayRun((s) => s.decide)
  const [sweep, setSweep] = useState(0)
  const ledger = weekLedger(state.events, state.open.pocket)
  const spendTotal = ledger.where.reduce((a, g) => a + g.amount, 0)
  const lent = state.events.filter((e) => e.t === 'lend')
  const repaid = state.events.filter((e) => e.t === 'repaid')
  const maxSweep = Math.floor(state.pocket / ECON.moveStep) * ECON.moveStep

  const group = (key: 'in' | 'out' | 'aside') => (
    <section className="paper p-3" key={key}>
      <h3 className="font-sign lang-fit m-0 text-[14px]">{t(`review.${key}`)}</h3>
      <ul className="m-0 mt-1 flex list-none flex-col gap-0.5 p-0 text-[14px] font-bold">
        {ledger[key].map((r) => <li key={r.key} className="flex justify-between gap-2"><span>{t(`review.rows.${r.key}`)}</span><span>{money(r.amount)}</span></li>)}
      </ul>
    </section>
  )
  return (
    <div className="flex flex-col gap-3">
      <div className="paper p-3 text-center">
        <h1 className="font-display lang-fit m-0 text-[22px]">{t('review.title', { n: script.week })}</h1>
        <p className="m-0 text-[13px] font-bold opacity-80">{t('review.ledger')}</p>
      </div>
      {group('in')}
      {group('out')}
      {ledger.aside.length > 0 && group('aside')}
      <div className="paper flex justify-between p-3 text-[15px] font-extrabold" style={{ background: '#FFE08A' }}>
        <span>{t('review.left')}</span><span>{money(ledger.left)}</span>
      </div>

      <section className="paper p-3">
        <h3 className="font-sign lang-fit m-0 text-[14px]">{t('review.where')}</h3>
        <p className="m-0 text-[12px] font-bold opacity-80">{t('review.whereNote')}</p>
        <div className="mt-2 flex h-5 overflow-hidden rounded-full border-2 border-ink" role="img" aria-label={t('review.where')}>
          {ledger.where.filter((g) => g.amount > 0).map((g) => <div key={g.key} style={{ width: `${(g.amount / spendTotal) * 100}%`, background: GROUP_COLOR[g.key] }} />)}
        </div>
        <ul className="m-0 mt-2 grid list-none grid-cols-1 gap-1 p-0 text-[13px] font-bold min-[400px]:grid-cols-2">
          {ledger.where.filter((g) => g.amount > 0).map((g) => (
            <li key={g.key} className="flex items-center justify-between gap-2"><span className="flex items-center gap-1.5"><span aria-hidden className="inline-block h-3 w-3 rounded-sm border-2 border-ink" style={{ background: GROUP_COLOR[g.key] }} />{t(`review.groups.${g.key}`)}</span><span>{money(g.amount)}</span></li>
          ))}
        </ul>
      </section>

      {lent.length > 0 && (
        <section className="paper p-3">
          <h3 className="font-sign lang-fit m-0 text-[14px]">{t('review.friends')}</h3>
          <ul className="m-0 mt-1 flex list-none flex-col gap-1 p-0 text-[14px] font-bold">
            {lent.map((l, i) => {
              const who = t(`who.${(card(l.id) as FriendCard).who}`)
              const back = repaid.some((r) => r.id === l.id)
              return <li key={i}>{back ? '✓' : '•'} {back ? t('review.repaid', { who, money: money(l.amount) }) : t('review.notRepaid', { who, money: money(l.amount) })}</li>
            })}
          </ul>
        </section>
      )}

      <section className="paper p-3">
        <div className="flex items-center gap-2"><Pot amount={state.jar + sweep} full={ECON.goal} size={34} /><span className="font-sign lang-fit text-[15px]">{t('review.sweep')}</span></div>
        <p className="m-0 mt-1 text-[12px] font-bold opacity-80">{t('review.sweepNote', { money: money(state.pocket) })}</p>
        <div className="mt-2"><MoneyStepper value={sweep} max={maxSweep} onChange={setSweep} label={t('review.sweep')} /></div>
      </section>
      <button type="button" className="ink-btn pink self-center" onClick={() => decide({ k: 'sweep', amount: sweep })}>{t('review.finish')} ▶</button>
    </div>
  )
}

/** Where the week left the jar, and what is next. */
export function WeekDone({ state, script, onGoal, onExit }: { state: State; script: WeekScript; onGoal: () => void; onExit: () => void }) {
  const { t, money } = usePr()
  const nextWeek = usePayRun((s) => s.nextWeek)
  const last = state.history.at(-1)
  const reached = state.jar >= ECON.goal
  const gain = last?.jarGain ?? 0
  useEffect(() => { if (reached) onGoal() }, [reached, onGoal])
  const seasonEnd = script.week === ECON.seasonWeeks
  const lastWeek = script.week >= ECON.lastBonusWeek
  const stop = lastWeek || (seasonEnd && reached)
  return (
    <div className="flex flex-col gap-3">
      <div className="paper p-4 text-center">
        <h1 className="font-display lang-fit m-0 text-[24px]">{t('done.title', { n: script.week })}</h1>
        <p className="m-0 mt-1 text-[16px] font-extrabold">{gain > 0 ? t('done.grew', { money: money(gain) }) : gain < 0 ? t('done.shrank', { money: money(-gain) }) : t('done.same')}</p>
        <div className="mt-2 flex items-center justify-center gap-3">
          <Pot amount={state.jar} full={ECON.goal} size={56} />
          <div className="text-left"><div className="font-display text-[18px] leading-tight">{t('done.jar', { jar: money(state.jar), goal: money(ECON.goal) })}</div></div>
        </div>
        {reached ? <p className="font-sign lang-fit m-0 mt-2 text-[16px]">🎉 {t('done.reached', { jar: money(state.jar) })}</p> : <p className="m-0 mt-2 text-[14px] font-bold">{t('done.pace', { n: weeksToGoal(state.history, state.jar) })}</p>}
        {seasonEnd && <p className="m-0 mt-2 text-[13px] font-bold opacity-80">{t('done.endSeason')}</p>}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {!stop && <button type="button" className="ink-btn pink" onClick={nextWeek}>{seasonEnd ? t('done.more') : t('done.next')} ▶</button>}
        {(seasonEnd || stop) && <button type="button" className="ink-btn cream" onClick={onExit}>{t('done.end')}</button>}
      </div>
    </div>
  )
}
