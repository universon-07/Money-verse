import { ECON, card, type FriendCard, type WantCard } from '../engine/content'
import { goalWeeks } from '../engine/goal'
import { cardOnDay, shortfallOptions, treatPrice, wantPrice } from '../engine/week'
import type { Day, Decision, State, WeekScript } from '../engine/types'
import { usePayRun, type Result } from '../state/store'
import { Portrait } from './portraits'
import { usePr } from './usePr'

type T = ReturnType<typeof usePr>

/** Plain-language lines for what just happened. No advice, no "right answer". */
function resultLines(r: Result, script: WeekScript, p: T): string[] {
  const { t, money } = p
  const d = r.decision
  const lines: string[] = []
  const treatName = (day: Day) => t(`treat.names.${ECON.treats[day - 1].id}`)
  for (const e of r.events) {
    if (e.t === 'treat') lines.push(t('result.treatYes', { treat: treatName(e.day), money: money(e.amount) }))
    else if (e.t === 'blocked') lines.push(t('result.blocked'))
    else if (e.t === 'bill') lines.push(e.amount === e.fromPocket ? t('result.bill', { bill: t(`cards.${e.id}`), money: money(e.amount) }) : t('result.billShort', { bill: t(`cards.${e.id}`), money: money(e.amount), paid: money(e.fromPocket) }))
    else if (e.t === 'lost') {
      if (e.amount > 0) lines.push(t('result.lost', { money: money(e.amount) }))
      else lines.push(t('result.lostNone') + (r.before.jar > 0 ? ' ' + t('result.lostSafe') : ''))
    } else if (e.t === 'want') lines.push(t('result.bought', { money: money(e.amount) }))
    else if (e.t === 'lend') lines.push(t('result.lent', { who: t(`who.${(card(e.id) as FriendCard).who}`), money: money(e.amount) }))
    else if (e.t === 'windfall') lines.push(t('result.windfall', { money: money(e.amount) }))
    else if (e.t === 'breakjar') lines.push(t('result.breakjar', { money: money(e.amount) }))
    else if (e.t === 'quickcash') lines.push(t('result.quickcash', { money: money(e.amount), owed: money(e.owed) }))
    else if (e.t === 'paylate') lines.push(t('result.paylate', { fee: money(e.fee) }))
  }
  // decisions that spend nothing leave no event: say what the student kept
  if (d.k === 'treat' && !d.yes) lines.unshift(t('result.treatSkip', { treat: treatName(d.day), money: money(treatPrice(d.day, r.before.rules.lunch)) }))
  if (d.k === 'want' && d.choice === 'skip') lines.push(t('result.kept', { money: money(wantPrice(r.before, d.id)) }))
  if (d.k === 'want' && d.choice === 'list') lines.push(t('result.listed'))
  if (d.k === 'friend' && d.choice === 'no') lines.push(t('result.refused'))
  if (d.k === 'treat' && !cardOnDay(script, r.before, d.day)) lines.push(t('event.quiet'))
  return lines
}

export function ResultPanel({ result, script }: { result: Result; script: WeekScript }) {
  const p = usePr()
  const dismiss = usePayRun((s) => s.dismissResult)
  const lines = resultLines(result, script, p)
  return (
    <div className="fc-deal flex flex-col gap-3" aria-live="polite">
      <div className="rounded-xl border-[3px] border-ink p-3" style={{ background: '#FFF8E6' }}>
        <div className="flex flex-col gap-1.5">
          {lines.map((l, i) => <p key={i} className={`m-0 leading-snug ${i ? 'text-[14px] font-bold' : 'text-[16px] font-extrabold'}`}>{l}</p>)}
        </div>
      </div>
      <button type="button" className="ink-btn pink self-center" onClick={dismiss}>{p.t('event.next')} ▶</button>
    </div>
  )
}

function TreatCard({ day, state }: { day: Day; state: State }) {
  const { t, money } = usePr()
  const decide = usePayRun((s) => s.decide)
  const price = treatPrice(day, state.rules.lunch)
  const afford = state.pocket >= price
  return (
    <div className="flex flex-col gap-2">
      <div className="font-sign lang-fit text-[12px] text-pink">{t('treat.label')}</div>
      <h2 className="font-display lang-fit m-0 text-[22px] leading-tight">{t(`treat.names.${ECON.treats[day - 1].id}`)} · {money(price)}</h2>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="ink-btn" disabled={!afford} style={{ opacity: afford ? 1 : 0.5 }} onClick={() => decide({ k: 'treat', day, yes: true })}>{t('treat.yes', { money: money(price) })}</button>
        <button type="button" className="ink-btn cream" onClick={() => decide({ k: 'treat', day, yes: false })}>{t('treat.skip')}</button>
      </div>
      {!afford && <p className="m-0 text-center text-[12px] font-extrabold" style={{ color: '#7A2A22' }}>{t('event.notEnough')}</p>}
    </div>
  )
}

function WantView({ day, id, state }: { day: Day; id: string; state: State }) {
  const { t, money, weeks } = usePr()
  const decide = usePayRun((s) => s.decide)
  const c = card(id) as WantCard
  const price = wantPrice(state, id)
  const afford = state.pocket >= price
  const returning = state.returning.some((r) => r.id === id)
  const choose = (choice: 'buy' | 'skip' | 'list'): Decision => ({ k: 'want', day, id, choice })
  return (
    <div className="flex flex-col gap-2">
      <div className="font-sign lang-fit text-[12px] text-pink">{returning ? t('event.unlisted') : t('event.label')}</div>
      <p className="m-0 text-[17px] font-extrabold leading-snug">{t(`cards.${id}`)}</p>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-[26px] leading-none">{money(price)}</span>
        <span className="text-[13px] font-bold opacity-80">{t('event.weeks', { n: weeks(goalWeeks(state.history, price)) })}</span>
      </div>
      <div className="mt-1 flex flex-col gap-2">
        <button type="button" className="ink-btn" disabled={!afford} style={{ opacity: afford ? 1 : 0.5 }} onClick={() => decide(choose('buy'))}>{t('event.buy', { money: money(price) })}</button>
        {!afford && <p className="m-0 text-center text-[12px] font-extrabold" style={{ color: '#7A2A22' }}>{t('event.notEnough')}</p>}
        <button type="button" className="ink-btn cream" onClick={() => decide(choose('skip'))}>{t('event.skip')}</button>
        {state.rules.waitlist && c.listable && <button type="button" className="ink-btn teal" onClick={() => decide(choose('list'))}>📝 {t('event.list')}</button>}
      </div>
    </div>
  )
}

function FriendView({ day, id, state }: { day: Day; id: string; state: State }) {
  const { t } = usePr()
  const decide = usePayRun((s) => s.decide)
  const c = card(id) as FriendCard
  const can = (n: number) => state.pocket >= n
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-2">
        <Portrait who={c.who} size={64} />
        <div className="ink-chip flex-1 px-3 py-2"><div className="text-[16px] font-extrabold leading-snug">{t(`cards.${id}`)}</div></div>
      </div>
      <span className="self-start rounded-full border-2 border-ink bg-[#F7C9C0] px-2 py-0.5 text-[12px] font-extrabold">🕑 {t(`chips.${id}`)}</span>
      <div className="flex flex-col gap-2">
        <button type="button" className="ink-btn" disabled={!can(c.ask)} style={{ opacity: can(c.ask) ? 1 : 0.5 }} onClick={() => decide({ k: 'friend', day, id, choice: 'lend200' })}>{t('event.lend200')}</button>
        <button type="button" className="ink-btn teal" disabled={!can(50)} style={{ opacity: can(50) ? 1 : 0.5 }} onClick={() => decide({ k: 'friend', day, id, choice: 'lend50' })}>{t('event.lend50')}</button>
        {!can(50) && <p className="m-0 text-center text-[12px] font-extrabold" style={{ color: '#7A2A22' }}>{t('event.notEnough')}</p>}
        <button type="button" className="ink-btn cream" onClick={() => decide({ k: 'friend', day, id, choice: 'no' })}>✕ {t('event.no')}</button>
      </div>
    </div>
  )
}

function WindfallView({ day }: { day: Day }) {
  const { t } = usePr()
  const decide = usePayRun((s) => s.decide)
  return (
    <div className="flex flex-col gap-2">
      <div className="font-sign lang-fit text-[12px] text-pink">{t('event.label')}</div>
      <p className="m-0 text-[17px] font-extrabold leading-snug">🎁 {t('cards.G1')}</p>
      {(['jar', 'split', 'keep'] as const).map((choice) => (
        <button key={choice} type="button" className={`ink-btn ${choice === 'keep' ? 'cream' : choice === 'split' ? 'teal' : ''}`} onClick={() => decide({ k: 'windfall', day, choice })}>{t(`event.${choice}`)}</button>
      ))}
    </div>
  )
}

/** The Shortfall card: three ways to cover a bill, each with its true cost, side by side. None is marked as better. */
function ShortfallView({ day, id, amount, shortfall, state }: { day: Day; id: string; amount: number; shortfall: number; state: State }) {
  const { t, money } = usePr()
  const decide = usePayRun((s) => s.decide)
  const o = shortfallOptions(state, shortfall)
  return (
    <div className="flex flex-col gap-2">
      <div className="font-sign lang-fit text-[12px] text-pink">{t('short.title')}</div>
      <p className="m-0 text-[15px] font-extrabold leading-snug">{t('short.line', { bill: t(`cards.${id}`), amount: money(amount), pocket: money(amount - shortfall), shortfall: money(shortfall) })}</p>
      <p className="m-0 text-[12px] font-bold opacity-80">{t('short.pick')}</p>
      <button type="button" className="ink-chip px-3 py-2 text-left" disabled={!o.jar.enabled} style={{ opacity: o.jar.enabled ? 1 : 0.55 }} onClick={() => decide({ k: 'shortfall', day, id, choice: 'jar' })}>
        <span className="font-sign lang-fit block text-[15px]">🏺 {t('short.jar')}</span>
        <span className="block text-[13px] font-bold">{o.jar.enabled ? t('short.jarDesc', { money: money(o.jar.amount) }) : t('short.jarOff', { money: money(state.jar) })}</span>
      </button>
      <button type="button" className="ink-chip px-3 py-2 text-left" onClick={() => decide({ k: 'shortfall', day, id, choice: 'quickcash' })}>
        <span className="font-sign lang-fit block text-[15px]">⚡ {t('short.qc')}</span>
        <span className="block text-[13px] font-bold">{t('short.qcDesc', { money: money(o.quickcash.amount), owed: money(o.quickcash.owed), extra: money(o.quickcash.extra) })}</span>
      </button>
      <button type="button" className="ink-chip px-3 py-2 text-left" onClick={() => decide({ k: 'shortfall', day, id, choice: 'late' })}>
        <span className="font-sign lang-fit block text-[15px]">⏰ {t('short.late')}</span>
        <span className="block text-[13px] font-bold">{t('short.lateDesc', { fee: money(o.late.fee) })}</span>
      </button>
    </div>
  )
}

/** One day: the treat first, then the main event. What each choice does is shown after, never labelled right or wrong before. */
export function DayCard({ state }: { state: State }) {
  const ph = state.phase
  if (ph.at === 'treat') return <TreatCard day={ph.day} state={state} />
  if (ph.at === 'shortfall') return <ShortfallView day={ph.day} id={ph.id} amount={ph.amount} shortfall={ph.shortfall} state={state} />
  if (ph.at === 'card') {
    const c = card(ph.id)
    if (c.kind === 'want') return <WantView day={ph.day} id={ph.id} state={state} />
    if (c.kind === 'friend') return <FriendView day={ph.day} id={ph.id} state={state} />
    return <WindfallView day={ph.day} />
  }
  return null
}

