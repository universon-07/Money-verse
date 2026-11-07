import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { COMPANY, SECTOR_COLOUR } from '../engine/companies'
import { EMERGENCY_COST } from '../engine/events'
import { explainQuarter } from '../engine/explain'
import { LIGHT_KEYS, founderAnswer } from '../engine/lights'
import { reviewDecisions } from '../engine/review'
import { canBuy, knownLights, lightsAt, reviewFor, type Action, type RunState } from '../engine/run'
import { holdingValueAt, knownQuarter, pitchFor } from '../engine/state'
import type { CompanyId, LightKey, MarketRun } from '../engine/types'
import { Mark } from './Companies'
import { InfoHeader } from './InfoTip'
import { LessonCard } from './LessonCard'
import { LightChip, MiniChart, lightFacts } from './Lights'
import { AlertStrip, MarketLine, Sheet, useInr } from './Panels'
import { FounderFace, FounderProfile } from './Founder'
import { IconBank, IconCash, IconEye, IconPeople } from './icons'
import { rivalAlerts } from '../engine/rivals'
import { WILD_TIP, taskFor, wildcardFor } from '../engine/wildcards'
import { ReviewCard } from './Review'
import { ASK_STATS, StatRow } from './Stats'
import type { TradeMode } from './TradeDialog'

type Dispatch = (a: Action) => void
export interface TurnHandlers {
  onOpen: (id: CompanyId) => void
  onTrade: (mode: TradeMode, id: CompanyId) => void
  /** opens the "why pass?" question; the pass itself is dispatched once a reason is picked */
  onPass: (id: CompanyId) => void
}

/** A question you have not asked yet: the check's name and the question, as one tap target. */
const ASK_ICON: Record<LightKey, () => React.ReactElement> = { cash: () => <IconCash />, customers: () => <IconPeople />, debt: () => <IconBank />, ceo: () => <IconEye /> }

/** One check on the company: an icon, what it looks at, and the plain question it answers. */
function AskTile({ k, onAsk, disabled }: { k: LightKey; onAsk: () => void; disabled: boolean }) {
  const { t } = useTranslation('dealboard')
  return (
    <button type="button" disabled={disabled} onClick={onAsk} className="flex min-h-16 items-center gap-2.5 rounded-lg border-2 border-ink px-2.5 py-1.5 text-left leading-tight" style={{ background: '#FFF3D6', opacity: disabled ? 0.5 : 1 }}>
      <span className="shrink-0" aria-hidden>{ASK_ICON[k]()}</span>
      <span className="min-w-0">
        <span className="block text-[13px] font-extrabold">{t(`lights.${k}.name`)}</span>
        <span className="block text-[12px] font-semibold opacity-75">{t(`pitch3.${k}`)}</span>
      </span>
    </button>
  )
}

/** The company pitching this quarter: its headline claim, up to two questions that turn into results, then invest or pass. */
function Pitch({ run, m, id, dispatch, onPass, onTrade }: { run: RunState; m: MarketRun; id: CompanyId; dispatch: Dispatch } & Pick<TurnHandlers, 'onPass' | 'onTrade'>) {
  const { t } = useTranslation('dealboard')
  const money = useInr()
  const q = knownQuarter(run)
  const hist = m.history[id]
  const lights = lightsAt(m, id, q)
  const asked = run.asked[id] ?? []
  const known = knownLights(run, id)
  const left = 2 - asked.length
  const [profile, setProfile] = useState(false)
  const answered = known.filter((k) => founderAnswer(lights, id, k) !== 'X')
  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border-[3px] border-ink bg-jasmine" style={{ boxShadow: '3px 4px 0 #2B1A17' }}>
        <div className="flex items-center gap-2 border-b-[3px] border-ink px-3 py-2" style={{ background: SECTOR_COLOUR[COMPANY[id].sector] }}>
          <Mark id={id} size={30} />
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[10px] font-extrabold uppercase tracking-[.12em] text-jasmine/85">{t('pitch3.new')}</span>
            <span className="font-sign lang-fit block truncate text-[19px] text-jasmine" style={{ textShadow: '1.5px 1.5px 0 #2B1A17' }}>{t(`companies.${id}.name`)}</span>
          </span>
          <span className="shrink-0 rounded-full border-2 border-ink bg-mustard px-2 py-0.5 text-[12px] font-extrabold">{t('perShare', { price: money(hist[q].price) })}</span>
        </div>
        <div className="space-y-2 px-3 py-2.5">
          <p className="m-0 text-[15px] font-bold leading-snug"><span className="mr-2 inline-block rounded-full border-2 border-ink px-2 py-0 align-middle text-[10px] font-extrabold uppercase leading-5 tracking-wider" style={{ background: SECTOR_COLOUR[COMPANY[id].sector], color: '#FFF3D6', textShadow: '1px 1px 0 #2B1A17' }}>{t(`sectors.${COMPANY[id].sector}`)}</span>{t(`what.${id}`)}</p>
          <p className="m-0 text-[14px] leading-snug"><span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8a5a2b]">{t('pitch3.pitch')}</span><br />{t(`claims.${id}`)}</p>
          <button type="button" onClick={() => setProfile(true)} className="mt-3 flex min-h-14 w-full items-center gap-2.5 rounded-lg border-2 border-ink bg-white/70 px-2 py-1.5 text-left">
            <span className="shrink-0 overflow-hidden rounded-lg border-2 border-ink"><FounderFace id={id} size={40} /></span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block text-[11px] font-extrabold uppercase tracking-wider opacity-60">{t('pitch3.founder')}</span>
              <span className="block truncate text-[14px] font-extrabold">{t(`founders.${id}.name`)}</span>
              <span className="block text-[12px] leading-tight opacity-70">{t(`founders.${id}.role`)}</span>
            </span>
            <span className="shrink-0 text-[12px] font-extrabold underline decoration-2 underline-offset-4">{t('pitch3.story')} ›</span>
          </button>
        </div>
      </div>
      {profile && <FounderProfile id={id} onClose={() => setProfile(false)} />}

      <div>
        <InfoHeader title={<span className="inline-flex flex-wrap items-center gap-2">{t('pitch3.ask')}<span className="rounded-full border-[2.5px] border-ink px-2.5 py-0.5 text-[15px] font-extrabold leading-tight" style={{ background: left > 0 ? '#E8B04A' : '#E9D3A6', boxShadow: '2px 2px 0 #2B1A17' }}>{left}/2</span><span className="font-body text-[12px] font-extrabold normal-case tracking-normal opacity-75" style={{ fontFamily: 'var(--font-body)' }}>{t('pitch3.checksLeft')}</span></span>}>{t('pitch3.tip')}</InfoHeader>
        <div className="mt-1.5 grid grid-cols-2 gap-1.5" role="group" aria-label={t('lights.title')}>
          {LIGHT_KEYS.map((k) => (known.includes(k) ? <LightChip key={k} k={k} state={founderAnswer(lights, id, k)} /> : <AskTile key={k} k={k} disabled={left <= 0} onAsk={() => dispatch({ type: 'ask', companyId: id, light: k })} />))}
        </div>
      </div>

      {known.length > 0 && (
        <div className="space-y-1.5">
          {known.map((k) => {
            const dodged = founderAnswer(lights, id, k) === 'X'
            const f = dodged ? null : lightFacts(hist, q, k, t)
            return (
              <div key={k} className="flex items-center gap-3 rounded-lg border-2 border-ink bg-white/70 px-2.5 py-2">
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider opacity-60">{t(`lights.${k}.name`)}</div>
                  <div className="text-[14px] font-semibold leading-snug">{dodged ? `${t(`lights.${k}.deflect`)} ${t('pitch2.dodged')}` : f!.detail}</div>
                </div>
                {f && <div className="w-24 shrink-0"><MiniChart values={f.series} mode={f.mode} height={40} /></div>}
              </div>
            )
          })}
          {answered.length > 0 && (
            <details className="group rounded-lg border-2 border-ink bg-white/50">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-2.5 text-[13px] font-extrabold [&::-webkit-details-marker]:hidden"><span>{t('pitch.more')}</span><span className="transition-transform group-open:rotate-180" aria-hidden>▾</span></summary>
              <div className="grid grid-cols-1 gap-1.5 px-2.5 pb-2.5 min-[460px]:grid-cols-2">
                {answered.flatMap((k) => ASK_STATS[k]).map((s) => <StatRow key={s} id={s} hist={hist} q={q} money={money} />)}
              </div>
            </details>
          )}
        </div>
      )}

      <div className="db-actions flex items-stretch justify-center gap-2">
        <button type="button" className="ink-btn cream" onClick={() => onPass(id)}>{t('pitch.pass')}</button>
        <button type="button" className="ink-btn pink" disabled={!canBuy(run)} style={{ opacity: canBuy(run) ? 1 : 0.5 }} onClick={() => onTrade('invest', id)}>{t('pitch.bid')} ▸</button>
      </div>
      {!canBuy(run) && <p className="m-0 text-right text-[13px] font-bold text-[#C8442F]">{t('trade.jailed')}</p>}
    </div>
  )
}

/** When you own all four: review one of your companies and decide to keep holding, buy more or sell. */
function CheckIn({ run, m, id, dispatch, onTrade }: { run: RunState; m: MarketRun; id: CompanyId; dispatch: Dispatch } & Pick<TurnHandlers, 'onTrade'>) {
  const { t } = useTranslation('dealboard')
  const money = useInr()
  const q = knownQuarter(run)
  const hist = m.history[id]
  const lights = lightsAt(m, id, q)
  const h = run.holdings[id]!
  const value = holdingValueAt(run, m, id, q)
  const gain = value - h.cost
  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border-[3px] border-ink bg-jasmine" style={{ boxShadow: '3px 4px 0 #2B1A17' }}>
        <div className="flex items-center gap-2 border-b-[3px] border-ink px-3 py-2" style={{ background: SECTOR_COLOUR[COMPANY[id].sector] }}>
          <Mark id={id} size={28} />
          <span className="font-sign lang-fit min-w-0 flex-1 truncate text-[18px] text-jasmine" style={{ textShadow: '1.5px 1.5px 0 #2B1A17' }}>{t(`companies.${id}.name`)}</span>
          <span className="shrink-0 rounded-full border-2 border-ink bg-jasmine px-2 py-0.5 text-[12px] font-extrabold" style={{ color: gain >= 0 ? '#2f6f4a' : '#C8442F' }}>{gain >= 0 ? '▲ ' : '▼ '}{money(Math.abs(gain))}</span>
        </div>
        <div className="space-y-2 px-3 py-2.5">
          <div className="text-[13px] opacity-80">{t('dossier.own', { v: money(value) })} · {t('perShare', { price: money(hist[q].price) })}</div>
          <div className="grid grid-cols-2 gap-1.5" role="group" aria-label={t('lights.title')}>
            {LIGHT_KEYS.map((k) => <LightChip key={k} k={k} state={lights[k]} />)}
          </div>
          <details className="group rounded-lg border-2 border-ink bg-white/50">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-2.5 text-[13px] font-extrabold [&::-webkit-details-marker]:hidden"><span>{t('pitch.more')}</span><span className="transition-transform group-open:rotate-180" aria-hidden>▾</span></summary>
            <div className="grid grid-cols-1 gap-1.5 px-2.5 pb-2.5 min-[460px]:grid-cols-2">
              {(['runway', 'retention', 'profit', 'debt'] as const).map((s) => <StatRow key={s} id={s} hist={hist} q={q} money={money} />)}
            </div>
          </details>
        </div>
      </div>
      <div className="db-actions flex items-stretch justify-center gap-2">
        <button type="button" className="ink-btn cream" onClick={() => onTrade('sell', id)}>{t('portfolio.sell')}</button>
        <button type="button" className="ink-btn cream" disabled={!canBuy(run)} style={{ opacity: canBuy(run) ? 1 : 0.5 }} onClick={() => onTrade('buyMore', id)}>{t('portfolio.buyMore')}</button>
        <button type="button" className="ink-btn pink" onClick={() => dispatch({ type: 'hold', companyId: id })}>{t('desk.hold')} ▸</button>
      </div>
    </div>
  )
}

/** Last quarter: feedback on your last decision, then each company you own with the reasons behind its move. */
function LastQuarter({ run, m, onOpen }: { run: RunState; m: MarketRun; onOpen: (id: CompanyId) => void }) {
  const { t } = useTranslation('dealboard')
  const money = useInr()
  const q = run.turn - 1
  const entries = reviewDecisions(run, m).filter((e) => e.q === q)
  const ids = Object.keys(run.holdings) as CompanyId[]
  return (
    <section className="space-y-2">
      <MarketLine banner={m.banners[q - 1]} />
      {rivalAlerts(m, q).map((rid) => <AlertStrip key={rid}>{t('alert.rival', { name: t(`companies.${rid}.name`) })}</AlertStrip>)}
      {entries.map((e) => <ReviewCard key={e.id} entry={e} defaultOpen={false} />)}
      {ids.map((id) => {
        const { move, reasons } = explainQuarter(m, id, q)
        const h = run.holdings[id]!
        const delta = h.units * (m.history[id][q].price - m.history[id][q - 1].price)
        return (
          <details key={id} className="group rounded-lg border-2 border-ink bg-white/60" open={false}>
            <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-2.5 py-1.5 [&::-webkit-details-marker]:hidden">
              <Mark id={id} size={24} />
              <span className="min-w-0 flex-1 truncate text-[14px] font-extrabold">{t(`companies.${id}.name`)}</span>
              <span className="text-[13px] font-extrabold" style={{ color: move >= 0 ? '#2f6f4a' : '#C8442F' }}>{move >= 0 ? '▲' : '▼'} {Math.abs(move * 100).toFixed(1)}%</span>
              <span className="text-[12px] font-extrabold transition-transform group-open:rotate-180" aria-hidden>▾</span>
            </summary>
            <div className="border-t-2 border-dashed border-ink/30 px-2.5 py-2">
              <div className="text-[12px] opacity-75">{t('desk.held', { delta: `${delta >= 0 ? '+' : '−'}${money(Math.abs(delta))}` })}</div>
              <ul className="m-0 mt-1 list-disc space-y-0.5 pl-5 text-[13px] leading-snug">
                {reasons.map((r) => <li key={r.key}>{t(`why.${r.key}`, { ...r.params, sector: r.params.sector ? t(`sectors.${r.params.sector}`) : undefined })}</li>)}
              </ul>
              <button type="button" className="mt-1 min-h-10 text-[13px] font-extrabold underline decoration-2 underline-offset-4" onClick={() => onOpen(id)}>{t('hover.click')}</button>
            </div>
          </details>
        )
      })}
      {run.lastDrag > 0 && <p className="m-0 text-[12px] opacity-65">{t('dragNote', { x: money(run.lastDrag) })}</p>}
    </section>
  )
}

/** A wildcard: a surprise bill or windfall that has just landed, or a hot tip you can follow or ignore. */
function Wildcard({ run, m, dispatch }: { run: RunState; m: MarketRun; dispatch: Dispatch }) {
  const { t } = useTranslation('dealboard')
  const money = useInr()
  const w = wildcardFor(run.seed, run.turn, m.picked, m.emergencyTurn)
  if (!w) return null
  const done = run.wild?.[run.turn]
  if (w.kind === 'bill') {
    return <AlertStrip tag={t('wild.tag')} tone="bad">{t(`wild.bill${w.variant}`, { amount: money(Math.abs(done?.delta ?? w.amount)) })}</AlertStrip>
  }
  if (w.kind === 'gift') {
    const { n, order } = taskFor(run.seed, run.turn)
    const answered = done !== undefined
    return (
      <AlertStrip tag={t('wild.tag')} tone="good">
        <span className="block font-extrabold">{t(`wild.gift${w.variant}`, { amount: money(w.amount) })}</span>
        <span className="mt-1.5 block">{t(`task.q.${n}.q`)}</span>
        <span className="mt-2 grid gap-1.5">
          {order.map((o) => {
            const right = o === 0
            const pickedOne = done?.state === 'earned' ? right : false
            return (
              <button key={o} type="button" disabled={answered} onClick={() => dispatch({ type: 'task', choice: o })} className="min-h-11 rounded-lg border-2 border-ink px-2.5 py-1.5 text-left text-[14px] font-bold leading-snug" style={{ background: !answered ? '#FFF3D6' : right ? '#CFE6B8' : '#FFF3D6', opacity: answered && !right && !pickedOne ? 0.6 : 1 }}>
                {t(`task.q.${n}.a${o}`)}
              </button>
            )
          })}
        </span>
        {answered && (
          <span className="mt-2 block text-[13px] leading-snug">
            <span className="font-extrabold" style={{ color: done.state === 'earned' ? '#2f6f4a' : '#C8442F' }}>{done.state === 'earned' ? t('task.right', { amount: money(w.amount) }) : t('task.wrong')}</span> {t(`task.q.${n}.why`)}
          </span>
        )}
      </AlertStrip>
    )
  }
  const name = t(`companies.${w.companyId}.name`)
  const tooPoor = run.cash < WILD_TIP || !canBuy(run)
  return (
    <AlertStrip tag={t('wild.tag')} tone="bad">
      <span className="block">{t(`wild.tip${w.variant}`, { name })}</span>
      {!done ? (
        <span className="mt-2 flex flex-wrap items-center gap-2">
          <button type="button" className="ink-btn cream" style={{ minHeight: 40, fontSize: 14 }} disabled={tooPoor} onClick={() => dispatch({ type: 'tip', follow: true })}>{t('wild.follow', { amount: money(WILD_TIP) })}</button>
          <button type="button" className="ink-btn pink" style={{ minHeight: 40, fontSize: 14 }} onClick={() => dispatch({ type: 'tip', follow: false })}>{t('wild.ignore')}</button>
          {tooPoor && <span className="text-[12px] opacity-75">{t('wild.tooPoor')}</span>}
        </span>
      ) : (
        <span className="mt-1 block text-[13px] font-extrabold">{done.state === 'followed' ? t('wild.followed', { amount: money(WILD_TIP), name }) : t('wild.ignored')}</span>
      )}
    </AlertStrip>
  )
}

/** Each quarter has two calm screens: how the last quarter went (plus a bonus question), then this quarter's pitch. */
function Desk({ run, m, dispatch, onOpen, onTrade, onPass }: { run: RunState; m: MarketRun; dispatch: Dispatch } & TurnHandlers) {
  const { t } = useTranslation('dealboard')
  const money = useInr()
  const [stage, setStage] = useState<'results' | 'pitch'>(run.turn > 1 ? 'results' : 'pitch')
  const id = pitchFor(run, m)
  const reviewId = reviewFor(run, m)
  if (stage === 'results') {
    return (
      <Sheet title={t('desk.resultsTitle', { n: run.turn - 1 })} tone="#E8B04A" actions={<button type="button" className="ink-btn pink" onClick={() => { setStage('pitch') }}>{t('desk.next')} ▸</button>}>
        <div className="space-y-3">
          <LastQuarter run={run} m={m} onOpen={onOpen} />
          <Wildcard run={run} m={m} dispatch={dispatch} />
        </div>
      </Sheet>
    )
  }
  return (
    <Sheet eyebrow={t('desk.eyebrow')} title={t('desk.title', { n: run.turn })} tone="#E8B04A">
      <div className="space-y-4">
        {run.loan > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] font-bold text-[#C8442F]">
            <span>{t('emergency.owed', { x: money(run.loan) })}</span>
            <button type="button" className="ink-btn cream" style={{ minHeight: 40 }} disabled={run.cash < run.loan} onClick={() => dispatch({ type: 'repay' })}>{t('emergency.repay', { x: money(run.loan) })}</button>
          </div>
        )}
        <section className="space-y-2">
          <InfoHeader title={id ? t('desk.opportunity') : t('desk.checkin')}>{id ? t('desk.first') : t('desk.checkinBody')}</InfoHeader>
          {id ? <Pitch run={run} m={m} id={id} dispatch={dispatch} onPass={onPass} onTrade={onTrade} /> : reviewId ? <CheckIn run={run} m={m} id={reviewId} dispatch={dispatch} onTrade={onTrade} /> : null}
          {Object.keys(run.holdings).length === 0 && <p className="m-0 text-[12px] opacity-70">{t('desk.idle')}</p>}
        </section>
      </div>
    </Sheet>
  )
}

/** Family emergency: sell what you must, then pay. */
function Emergency({ run, m, dispatch, onTrade }: { run: RunState; m: MarketRun; dispatch: Dispatch } & Pick<TurnHandlers, 'onTrade'>) {
  const { t } = useTranslation('dealboard')
  const money = useInr()
  const q = knownQuarter(run)
  const short = Math.max(0, EMERGENCY_COST - run.cash)
  const ids = Object.keys(run.holdings) as CompanyId[]
  return (
    <Sheet eyebrow={t('emergency.eyebrow')} title={t('emergency.title')} tone="#C8442F" actions={<button type="button" className="ink-btn pink" disabled={short > 0 && ids.length > 0} style={{ opacity: short > 0 && ids.length > 0 ? 0.5 : 1 }} onClick={() => dispatch({ type: 'payEmergency' })}>{short > 0 ? t('emergency.payShort') : t('emergency.pay')}</button>}>
      <div className="mb-2"><AlertStrip tag={t('alert.wild')}>{t('emergency.body')}</AlertStrip></div>
      <p className="m-0 mt-1 font-bold">{t('emergency.have', { cash: money(run.cash) })} · {short > 0 ? t('emergency.short', { x: money(short) }) : t('emergency.ready')}</p>
      {short > 0 && ids.length === 0 && <p className="m-0 text-[13px] opacity-75">{t('emergency.payShortNote')}</p>}
      <ul className="m-0 mt-2 list-none space-y-1.5 p-0">
        {ids.map((id) => {
          const h = run.holdings[id]!
          const v = holdingValueAt(run, m, id, q)
          const g = v - h.cost
          return (
            <li key={id} className="flex items-center gap-2 rounded-lg border-2 border-ink bg-white/60 px-2.5 py-1.5 text-[13px]">
              <Mark id={id} size={24} />
              <span className="min-w-0 flex-1 truncate font-extrabold">{t(`companies.${id}.name`)}</span>
              <span>{money(v)}</span>
              <span className="font-extrabold" style={{ color: g >= 0 ? '#2f6f4a' : '#C8442F' }}>{g >= 0 ? '▲' : '▼'}{money(Math.abs(g))}</span>
              <button type="button" className="ink-btn" style={{ minHeight: 40, padding: '0 12px' }} onClick={() => onTrade('sell', id)}>{t('portfolio.sell')}</button>
            </li>
          )
        })}
      </ul>
    </Sheet>
  )
}

/** The decision area: the desk, the emergency, or a lesson. */
export function TurnPanel({ run, m, dispatch, onRewind, onOpen, onTrade, onPass }: { run: RunState; m: MarketRun; dispatch: Dispatch; onRewind: () => void } & TurnHandlers) {
  if (run.phase === 'desk') return <Desk key={run.turn} run={run} m={m} dispatch={dispatch} onOpen={onOpen} onTrade={onTrade} onPass={onPass} />
  if (run.phase === 'emergency') return <Emergency run={run} m={m} dispatch={dispatch} onTrade={onTrade} />
  if (run.phase === 'lesson' && run.lesson) return <LessonCard run={run} onContinue={() => dispatch({ type: 'continue' })} onReplay={onRewind} />
  return null
}
