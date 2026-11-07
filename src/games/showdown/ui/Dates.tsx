import { canExtend } from '../engine/contract'
import { RULES, item } from '../engine/content'
import { arrivals } from '../engine/dates'
import { choicesOf } from '../engine/log'
import { POINTS, type Point } from '../engine/types'
import { useShowdown, usePlayed, useView } from '../state/store'
import { Say } from './kit'
import { MomentLesson } from './Moment'
import { MoneyFlow } from './MoneyFlow'
import { useLabel } from './labels'
import { useSd } from './useSd'

/** The Shortfall sheet: bills are more than the cash. Extend (not Daam Fix, not on Festival Day) or Cancel, item by item. */
function Shortfall() {
  const { t, money, when } = useSd()
  const decide = useShowdown((s) => s.decide)
  const { plan } = useView()
  const played = usePlayed()
  const p = played.pending!
  const ranks = plan.ranks ?? []
  const paidSoFar = (id: string) => POINTS.slice(0, POINTS.indexOf(p.point)).reduce((a, pt) => a + (played.ledger[pt]?.pay.find(([k]) => k === id)?.[1] ?? 0), 0)
  return (
    <div className="flex flex-col gap-3">
      <div className="paper p-3" style={{ background: '#F7C9C0' }} role="alert">
        <div className="font-sign lang-fit text-[12px]">{when(p.point)}</div>
        <h1 className="font-display lang-fit m-0 text-[20px] leading-tight">▼ {t('short.title')}</h1>
        <p className="m-0 mt-1 text-[15px] font-extrabold">{t('short.line', { due: money(p.due), cash: money(p.cash), need: money(Math.round(p.need)) })}</p>
        <p className="m-0 mt-1 text-[12px] font-bold">{t('short.pick')}</p>
      </div>
      {p.items.map((it) => {
        const goal = item(it.item).goal
        const rank = goal ? ranks.indexOf(goal) + 1 : 0
        const paid = paidSoFar(it.item)
        return (
          <section key={it.item} className="paper p-3">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-sign lang-fit m-0 text-[16px]">{t(`items.${it.item}.name`)}</h2>
              <span className="text-[13px] font-extrabold">{t('short.dueNow', { money: money(Math.round(it.due)) })}</span>
            </div>
            <div className="mt-2 flex flex-col gap-2">
              <button type="button" className="ink-btn cream" disabled={!it.canExtend} style={{ opacity: it.canExtend ? 1 : 0.55 }} onClick={() => decide({ k: 'shortfall', point: p.point, item: it.item, action: 'extend' })}>
                🗓 {t('short.extend', { fee: money(Math.round(it.due * RULES.extensionFee)) })}
              </button>
              {!it.canExtend && <p className="m-0 text-[12px] font-bold opacity-80">{p.point === 'FD' ? t('short.fd') : !canExtend(it.item) ? t('short.daamfix') : ''}</p>}
              <button type="button" className="ink-btn cream" onClick={() => decide({ k: 'shortfall', point: p.point, item: it.item, action: 'cancel' })}>✕ {t('short.cancel')}</button>
              <p className="m-0 text-[12px] font-bold opacity-80">{paid > 0 ? t('short.lose', { paid: money(paid) }) : t('short.loseNone')}{rank > 0 ? ' ' + t('short.risk', { goal: t(`goals.${goal}.name`), rank }) : ''}</p>
            </div>
          </section>
        )
      })}
      {p.point === 'FD' && (
        <div className="flex flex-col items-center gap-1">
          <button type="button" className="ink-btn" onClick={() => decide({ k: 'shortfall', point: 'FD', action: 'owe' })}>{t('short.owe', { money: money(Math.round(p.need)) })}</button>
          <p className="m-0 text-center text-[12px] font-bold opacity-80">{t('short.owedNote')}</p>
        </div>
      )}
    </div>
  )
}

/** S8: one money date. Money in, money out, balance, the event, and the player's choices. */
export function DateScreen({ point }: { point: Point }) {
  const { t, money, when } = useSd()
  const label = useLabel()
  const decide = useShowdown((s) => s.decide)
  const { log, plan } = useView()
  const played = usePlayed()
  const choices = choicesOf(log)
  if (played.pending && played.pending.point === point) return <Shortfall />

  const line = played.ledger[point]!
  const ins = arrivals(point, 'F2', played)
  const n = POINTS.indexOf(point) + 2 // Today is the first of the five money dates
  const plates = plan.contracts.find((c) => c.id === 'plates')?.qty ?? 0
  const outLabel = (k: string) => label(k, plates)
  const owed = played.unpaid.filter(([pt]) => pt === point).reduce((a, [, x]) => a + x, 0)
  const rush = point === 'FD' ? line.pay.find(([k]) => k === 'rush plates') : undefined

  const decided = point === 'W2' ? !!choices.e2 : point === 'W3' ? !!choices.e4 : true
  const cashBeforeChoice = line.cash + (point === 'W2' && choices.e2 === 'stage' ? RULES.stageCost : 0) + (point === 'W3' && choices.e4 && choices.e4 !== 'refuse' ? RULES.sunnyAdvance : 0)
  const next = () => decide({ k: 'seen', screen: `date:${point}` })

  const choice = (title: string, body: string, opts: { id: string; label: string; ok: boolean }[], chosen: string | undefined, onPick: (id: string) => void, note?: string, doneText?: string) => (
    <section className="paper p-3" style={{ background: '#FFF8E6' }}>
      <h2 className="font-sign lang-fit m-0 text-[16px]">{title}</h2>
      <p className="m-0 mt-1 text-[14px] font-bold leading-snug">{body}</p>
      {chosen ? <p className="m-0 mt-2 text-[14px] font-extrabold">✓ {doneText}</p> : (
        <div className="mt-2 flex flex-col gap-2">
          {opts.map((o) => <button key={o.id} type="button" className="ink-btn cream" disabled={!o.ok} style={{ opacity: o.ok ? 1 : 0.5 }} onClick={() => onPick(o.id)}>{o.label}</button>)}
          {opts.some((o) => !o.ok) && <p className="m-0 text-[12px] font-extrabold" style={{ color: '#7A2A22' }}>{t('date.e2.noCash')}</p>}
          {note && <p className="m-0 text-[12px] font-bold opacity-80">{note}</p>}
        </div>
      )}
    </section>
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="paper p-3">
        <div className="font-sign lang-fit text-[12px] text-pink">{t('date.n', { n })}</div>
        <h1 className="font-display lang-fit m-0 text-[24px] leading-tight">{when(point)}</h1>
      </div>

      {point === 'W2' && <Say who="rao"><span className="text-[14px]">{ins.length ? t('date.cast.rao') : t('date.cards.W2none')}</span></Say>}
      {point === 'FD' && <Say who="shobha"><span className="text-[14px]">{t('date.cast.shobha')}</span></Say>}
      {point === 'W1' && <Say who="ayesha"><span className="text-[14px]">{t('date.cast.ayesha')}</span></Say>}

      <MoneyFlow
        ins={ins.map((l) => ({ label: t(`date.ins.${l.key}`, { crowd: l.crowd }), amount: l.amount }))}
        outs={line.pay.map(([k, a]) => ({ label: outLabel(k), amount: a }))}
        end={line.cash}
      />

      <p className="m-0 text-[14px] font-extrabold">
        {point === 'W1' && t('date.cards.W1')}
        {point === 'W2' && (ins.length ? t('date.cards.W2') + ' ' : '') + t('date.cards.W2bill')}
        {point === 'W3' && t('date.cards.W3')}
        {point === 'FD' && (ins.some((l) => l.key === 'sponsor') ? t('date.cards.FDsponsor') + ' ' : '') + t('date.cards.FDcrowd', { crowd: played.crowd })}
      </p>
      {rush && <p className="m-0 text-[14px] font-extrabold" style={{ color: '#7A2A22' }}>▼ {t('date.cards.FDrush', { plates, n: Math.round(rush[1] / RULES.rushPlate), cost: money(rush[1]) })}</p>}
      {owed > 0 && <p className="m-0 text-[14px] font-extrabold" style={{ color: '#7A2A22' }}>▼ {t('date.cards.FDowed', { money: money(owed) })}</p>}

      {point === 'W2' && choice(t('date.e2.title'), t('date.e2.body'), [
        { id: 'hold', label: t('date.e2.hold'), ok: true },
        { id: 'stage', label: t('date.e2.stage'), ok: cashBeforeChoice >= RULES.stageCost },
      ], choices.e2, (id) => decide({ k: 'event', id: 'E2', choice: id }), t('date.e2.note'), choices.e2 === 'stage' ? t('date.e2.doneStage') : t('date.e2.doneHold'))}

      {point === 'W3' && (
        <>
          <Say who="sunny"><span className="text-[14px]">{t('date.cast.sunny')}</span></Say>
          {choice(t('date.e4.title'), t('date.e4.body'), [
            { id: 'refuse', label: t('date.e4.refuse'), ok: true },
            { id: 'cash', label: t('date.e4.cash'), ok: cashBeforeChoice >= RULES.sunnyAdvance },
            { id: 'bill', label: t('date.e4.bill'), ok: cashBeforeChoice >= RULES.sunnyAdvance },
          ], choices.e4, (id) => decide({ k: 'event', id: 'E4', choice: id }), undefined, choices.e4 === 'cash' ? t('date.e4.doneCash') : choices.e4 === 'bill' ? t('date.e4.doneBill') : t('date.e4.doneRefuse'))}
        </>
      )}

      <MomentLesson point={point} />

      <div className="flex flex-col items-center gap-1">
        <button type="button" className="ink-btn pink" disabled={!decided} style={{ opacity: decided ? 1 : 0.5 }} onClick={next}>{point === 'FD' ? t('date.toFestival') : t('date.next')} ▶</button>
        {!decided && <p className="m-0 text-[12px] font-bold opacity-80">{t('date.needChoice')}</p>}
      </div>
    </div>
  )
}
