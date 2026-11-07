import { useState } from 'react'
import { TitleCard } from '../../../components/TitleCard'
import { ECON, card } from '../engine/content'
import { isUnlocked, sanitizeRules } from '../engine/week'
import type { Rules, SavePct, State, WeekScript } from '../engine/types'
import { usePayRun, type GoalId } from '../state/store'
import { StatsBar, MoneyStepper, Pot } from './kit'
import { usePr } from './usePr'

const GOALS: GoalId[] = ['course', 'bike', 'trip']

export function Start({ canResume, onResume }: { canResume: boolean; onResume: () => void }) {
  const { t, money } = usePr()
  const start = usePayRun((s) => s.start)
  const [goal, setGoal] = useState<GoalId>('course')
  return (
    <div className="flex flex-col gap-4">
      <TitleCard eyebrow={t('start.eyebrow')} title={t('title')}>
        <p className="m-0">{t('start.tagline', { goal: money(ECON.goal) })}</p>
      </TitleCard>
      <section className="paper p-3">
        <h2 className="m-0 mb-2 text-[15px] font-extrabold">{t('start.pick')}</h2>
        <div className="flex flex-col gap-2">
          {GOALS.map((g) => (
            <button key={g} type="button" aria-pressed={goal === g} onClick={() => setGoal(g)} className="ink-chip flex min-h-14 items-center justify-between gap-2 px-3" style={{ background: goal === g ? '#E8B04A' : undefined }}>
              <span className="font-sign lang-fit text-[16px]">{t(`start.goals.${g}`)}</span>
              <span className="font-display text-[18px]">{money(ECON.goal)}</span>
            </button>
          ))}
        </div>
        <p className="m-0 mt-2 text-[12px] font-bold opacity-80">{t('start.note')}</p>
      </section>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" className="ink-btn pink" onClick={() => start(goal)}>{canResume ? t('start.again') : t('start.go')} ▶</button>
        {canResume && <button type="button" className="ink-btn cream" onClick={onResume}>{t('start.resume')}</button>}
      </div>
    </div>
  )
}

/** Step 1: this week's question, and Payday (wage in, must-haves out, any instalments and late bills out). */
export function Focus({ state, script }: { state: State; script: WeekScript }) {
  const { t, money } = usePr()
  const focus = usePayRun((s) => s.focus)
  const ev = state.events
  const sum = (kind: string) => ev.filter((e) => e.t === kind).reduce((a, e) => a + ('amount' in e ? e.amount : 0), 0)
  const lines: [string, number, boolean][] = [
    ['wage', sum('wage'), true],
    ['musthave', sum('musthave'), false],
    ['instalment', sum('instalment'), false],
    ['late', sum('late'), false],
  ]
  const takeHome = state.pocket - state.open.pocket
  return (
    <div className="flex flex-col gap-3">
      <div className="paper p-4 text-center">
        <div className="font-sign lang-fit text-[13px] text-pink">{t('week', { n: script.week })} · {t('focus.label')}</div>
        <h1 className="font-display lang-fit m-0 mt-1 text-[22px] leading-tight">{t(script.scripted ? `focus.w${script.week}` : 'focus.bonus')}</h1>
      </div>
      <div className="paper p-3">
        <h2 className="font-sign lang-fit m-0 text-[17px]">💰 {t('payday.title')}</h2>
        <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0 text-[14px] font-bold">
          {lines.filter(([, n]) => n > 0).map(([k, n, plus]) => (
            <li key={k} className="flex justify-between gap-2"><span>{t(`payday.${k}`)}</span><span style={{ color: plus ? '#2B4A1E' : '#7A2A22' }}>{plus ? '▲' : '▼'} {money(n)}</span></li>
          ))}
        </ul>
        <div className="mt-2 flex justify-between border-t-2 border-dashed border-ink pt-2 text-[15px] font-extrabold">
          <span>{t('payday.takehome')}</span><span>{money(takeHome)}</span>
        </div>
      </div>
      <StatsBar state={state} label={t('payday.pocket')} />
      <button type="button" className="ink-btn pink self-center" onClick={() => focus(script.week)}>{t('payday.go')} ▶</button>
    </div>
  )
}

/** Step 2: the plan. Rules appear only in the week their concept is taught. */
export function Plan({ state, script }: { state: State; script: WeekScript }) {
  const { t, money } = usePr()
  const decide = usePayRun((s) => s.decide)
  const [rules, setRules] = useState<Rules>(() => sanitizeRules({ ...state.rules }, script.week))
  const [extra, setExtra] = useState(0)
  const w = script.week
  const share = Math.min(Math.round((script.wage * rules.savePct) / 100), state.pocket)
  const maxExtra = Math.floor((state.pocket - share) / ECON.moveStep) * ECON.moveStep
  const unlocked = (['lunch', 'save', 'waitlist'] as const).filter((r) => isUnlocked(r, w))
  const asking = state.list[0]

  const toggle = (k: 'lunch' | 'waitlist') => setRules((r) => ({ ...r, [k]: !r[k] }))
  return (
    <div className="flex flex-col gap-3">
      <div className="paper p-3">
        <h1 className="font-display lang-fit m-0 text-[22px]">{t('plan.title')}</h1>
        <div className="font-sign lang-fit mt-2 text-[14px]">{t('plan.coming')}</div>
        {script.planned.length ? (
          <ul className="m-0 mt-1 flex list-none flex-col gap-1 p-0 text-[14px] font-bold">
            {script.planned.map((p) => (
              <li key={p.id} className="flex justify-between gap-2"><span>{t('day', { n: p.day, name: t(`days.${p.day - 1}`) })}: {t(`cards.${p.id}`)}</span><span>{money((card(p.id) as { amount: number }).amount)}</span></li>
            ))}
          </ul>
        ) : <p className="m-0 mt-1 text-[14px]">{t('plan.none')}</p>}
      </div>

      {asking && (
        <div className="paper p-3" style={{ background: '#FFE08A' }}>
          <div className="font-sign lang-fit text-[15px]">{t('plan.stillwant')}</div>
          <p className="m-0 mt-1 text-[14px] font-extrabold">{t(`cards.${asking.id}`)}</p>
          <p className="m-0 text-[12px] font-bold opacity-80">{t('plan.stillwantNote')} · {money(asking.returnPrice)}</p>
          <div className="mt-2 flex gap-2">
            <button type="button" className="ink-btn flex-1" onClick={() => decide({ k: 'stillwant', id: asking.id, yes: true })}>{t('plan.yes')}</button>
            <button type="button" className="ink-btn cream flex-1" onClick={() => decide({ k: 'stillwant', id: asking.id, yes: false })}>{t('plan.no')}</button>
          </div>
        </div>
      )}

      {unlocked.length > 0 && (
        <div className="paper p-3">
          <div className="font-sign lang-fit text-[15px]">{t('plan.rules')}</div>
          <div className="mt-2 flex flex-col gap-2">
            {unlocked.includes('lunch') && (
              <button type="button" aria-pressed={rules.lunch} onClick={() => toggle('lunch')} className="ink-chip flex min-h-14 items-center justify-between gap-2 px-3 py-2 text-left" style={{ background: rules.lunch ? '#E8B04A' : undefined }}>
                <span><span className="font-sign lang-fit block text-[15px]">🥪 {t('plan.lunch.name')}</span><span className="block text-[12px] font-bold opacity-80">{t('plan.lunch.desc')}</span></span>
                <span className="font-sign text-[13px]">{rules.lunch ? t('plan.on') : t('plan.off')}</span>
              </button>
            )}
            {unlocked.includes('save') && (
              <div className="ink-chip px-3 py-2">
                <span className="font-sign lang-fit block text-[15px]">🏺 {t('plan.save.name')}</span>
                <span className="block text-[12px] font-bold opacity-80">{t('plan.save.desc')}</span>
                <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                  {[0, 10, 20, 30].map((pct) => (
                    <button key={pct} type="button" aria-pressed={rules.savePct === pct} onClick={() => setRules((r) => ({ ...r, savePct: pct as SavePct }))} className="ink-chip min-h-12 text-[13px] font-extrabold" style={{ background: rules.savePct === pct ? '#E8B04A' : undefined }}>
                      {pct}%<span className="block text-[11px] font-bold opacity-80">{money(Math.round((script.wage * pct) / 100))}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {unlocked.includes('waitlist') && (
              <button type="button" aria-pressed={rules.waitlist} onClick={() => toggle('waitlist')} className="ink-chip flex min-h-14 items-center justify-between gap-2 px-3 py-2 text-left" style={{ background: rules.waitlist ? '#E8B04A' : undefined }}>
                <span><span className="font-sign lang-fit block text-[15px]">📝 {t('plan.waitlist.name')}</span><span className="block text-[12px] font-bold opacity-80">{t('plan.waitlist.desc')}</span></span>
                <span className="font-sign text-[13px]">{rules.waitlist ? t('plan.on') : t('plan.off')}</span>
              </button>
            )}
          </div>
        </div>
      )}
      {unlocked.length < 3 && <p className="m-0 text-center text-[12px] font-bold opacity-80">{t('plan.locked')}</p>}

      <div className="paper p-3">
        <div className="flex items-center gap-2">
          <Pot amount={state.jar + share + extra} full={ECON.goal} size={34} />
          <div className="font-sign lang-fit text-[15px]">{t('plan.more')}</div>
        </div>
        <div className="mt-2"><MoneyStepper value={extra} max={Math.max(0, maxExtra)} onChange={setExtra} label={t('plan.more')} /></div>
        <p className="m-0 mt-1 text-center text-[12px] font-bold opacity-80">{t('plan.moveNote')}</p>
        <p className="m-0 mt-1 text-center text-[13px] font-extrabold">{t('plan.left', { money: money(state.pocket - share - extra) })}</p>
      </div>

      <button type="button" className="ink-btn pink self-center" disabled={!!asking} style={{ opacity: asking ? 0.5 : 1 }} onClick={() => decide({ k: 'rules', rules, extra, testing: null })}>
        ☀ {t('plan.start')}
      </button>
    </div>
  )
}

