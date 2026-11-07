import { useEffect, useState } from 'react'
import { RULES, future, item } from '../engine/content'
import { arrivals } from '../engine/dates'
import { choicesOf } from '../engine/log'
import { futuresRun, firstBreak } from '../engine/survival'
import { POINTS, type GoalId } from '../engine/types'
import { useShowdown, usePlayed, useView } from '../state/store'
import { Say } from './kit'
import { MomentLesson } from './Moment'
import { useLabel } from './labels'
import { FestivalScene, type Layers } from './Scene'
import { useSd } from './useSd'

/** S9: the festival ground built from what was bought and kept, then the goals, then the public notice. */
export function Festival() {
  const { t, money, when } = useSd()
  const label = useLabel()
  const decide = useShowdown((s) => s.decide)
  const { plan } = useView()
  const played = usePlayed()
  const cancelled = new Set(played.cancelled.map(([id]) => id))
  const live = (id: string) => plan.contracts.some((c) => c.id === id) && !cancelled.has(id)
  const liveCat = (...cats: string[]) => plan.contracts.some((c) => cats.includes(item(c.id).cat) && !cancelled.has(c.id))
  const plates = plan.contracts.find((c) => item(c.id).cat === 'food' && !cancelled.has(c.id))?.qty
  const crowd = played.crowd ?? 0
  const layers: Layers = {
    hall: true,
    lights: played.lightsOk,
    sound: played.cap > 0,
    stage: !!played.ledger.W2?.pay.some(([k]) => k === 'stage'),
    food: !!plates,
    kids: live('kids'),
    banner: liveCat('promo'),
    safety: liveCat('safety', 'combo'),
    crowd,
  }
  const caption = (ok: boolean, text: string) => <li key={text} className="flex gap-1.5"><span aria-hidden>{ok ? '✓' : '✕'}</span><span>{text}</span></li>

  const goalWhy = (g: GoalId) => {
    const has = (id: string) => plan.contracts.some((c) => c.id === id)
    if (g === 'G1') return has('kids') ? t('festival.why.G1cancelled') : t('festival.why.G1none')
    if (g === 'G2') return plan.contracts.some((c) => item(c.id).cat === 'food') ? t('festival.why.G2cancelled') : t('festival.why.G2none')
    if (g === 'G3') return !played.lightsOk ? t('festival.why.G3light') : !played.cap ? t('festival.why.G3sound') : t('festival.why.G3cap', { cap: played.cap, crowd })
    return !liveCat('safety', 'combo') ? t('festival.why.G5safety') : t('festival.why.G5crowd', { crowd })
  }

  // the public notice: every payment and every arrival, as the colony reads it
  const f = future('F2')
  const received = POINTS.flatMap((p) => arrivals(p, f.id, played).map((l) => ({ p, ...l })))
  const paid = POINTS.flatMap((p) => (played.ledger[p]?.pay ?? []).map(([k, a]) => ({ p, k, a })))
  const totalIn = RULES.startCash + received.reduce((a, l) => a + l.amount, 0)
  const totalOut = paid.reduce((a, l) => a + l.a, 0)
  const owed = played.unpaid.reduce((a, [, x]) => a + x, 0)

  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-display lang-fit m-0 text-center text-[26px]" style={{ textShadow: '2px 3px 0 #FFF3D6' }}>{t('festival.title')}</h1>
      <figure className="paper m-0 flex flex-col gap-2 p-2.5">
        <div className="overflow-hidden rounded-lg border-[3px] border-ink"><FestivalScene layers={layers} /></div>
        <ul className="m-0 flex list-none flex-col gap-0.5 p-0 text-[13px] font-bold">
          {caption(true, t('festival.layers.hall'))}
          {caption(layers.lights, t(layers.lights ? 'festival.layers.lightsOn' : 'festival.layers.lightsOff'))}
          {caption(layers.sound, layers.sound ? t('festival.layers.soundOn', { cap: played.cap }) : t('festival.layers.soundOff'))}
          {layers.stage && caption(true, t('festival.layers.stage'))}
          {caption(layers.food, layers.food ? t('festival.layers.foodOn', { plates }) : t('festival.layers.foodOff'))}
          {caption(layers.kids, t(layers.kids ? 'festival.layers.kidsOn' : 'festival.layers.kidsOff'))}
          {caption(layers.banner, t(layers.banner ? 'festival.layers.bannerOn' : 'festival.layers.bannerOff'))}
          {caption(layers.safety, t(layers.safety ? 'festival.layers.safetyOn' : 'festival.layers.safetyOff'))}
          {caption(true, t('festival.layers.crowd', { crowd }))}
        </ul>
      </figure>

      <section className="paper p-3">
        <h2 className="font-sign lang-fit m-0 text-[15px]">{t('festival.goalsTitle')}</h2>
        <ol className="m-0 mt-1 flex list-none flex-col gap-1.5 p-0">
          {(plan.ranks ?? []).map((g, i) => {
            const met = played.goals.includes(g)
            return (
              <li key={g} className="flex items-start gap-2">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-[3px] border-ink bg-pink text-[12px] font-extrabold text-jasmine">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-extrabold leading-tight">{met ? '✓' : '✕'} {t(`goals.${g}.name`)} · {t(met ? 'festival.met' : 'festival.missed')}</div>
                  {!met && <div className="text-[12px] font-bold opacity-80">{goalWhy(g)}</div>}
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      <Say who="shobha"><span className="text-[14px]">{t('festival.notice.shobha')}</span></Say>
      <section className="paper p-3" style={{ background: '#FFF8E6' }}>
        <h2 className="font-display lang-fit m-0 text-[20px]">{t('festival.notice.title')}</h2>
        <p className="m-0 text-[12px] font-bold opacity-80">{t('festival.notice.sub')}</p>

        <h3 className="font-sign lang-fit mb-0 mt-2 text-[13px]">▲ {t('festival.notice.received')}</h3>
        <ul className="m-0 mt-0.5 list-none p-0 text-[13px] font-bold">
          <li className="flex justify-between gap-2"><span>{t('festival.notice.start')}</span><span>{money(RULES.startCash)}</span></li>
          {received.map((l, i) => <li key={i} className="flex justify-between gap-2"><span>{when(l.p)} · {t(`date.ins.${l.key}`, { crowd: l.crowd })}</span><span>{money(l.amount)}</span></li>)}
        </ul>

        <h3 className="font-sign lang-fit mb-0 mt-2 text-[13px]">▼ {t('festival.notice.paid')}</h3>
        <ul className="m-0 mt-0.5 list-none p-0 text-[13px] font-bold">
          {paid.map((l, i) => <li key={i} className="flex justify-between gap-2"><span>{when(l.p)} · {label(l.k, plates)}</span><span>{money(l.a)}</span></li>)}
        </ul>

        {played.avoidable.unrecorded > 0 && (
          <p className="m-0 mt-2 rounded-md border-[3px] border-ink px-2 py-1 text-[13px] font-extrabold" style={{ background: '#F7C9C0' }}>
            ⚠ {t('festival.notice.unrecorded')}: {t('festival.notice.unrecordedLine', { given: money(RULES.sunnyAdvance), back: money(RULES.sunnyReturn), lost: money(RULES.sunnyUnrecorded) })}
          </p>
        )}
        {played.events.length > 0 && (
          <ul className="m-0 mt-2 list-none p-0 text-[12px] font-bold">
            {played.events.map(([kind, id, p], i) => (
              <li key={i}>• {kind === 'extension' ? t('festival.notice.extended', { item: label(id) }) : t('festival.notice.cancelled', { when: when(p), item: label(id), paid: money(played.avoidable.lostPaid) })}</li>
            ))}
          </ul>
        )}
        {owed > 0 && <p className="m-0 mt-2 text-[13px] font-extrabold" style={{ color: '#7A2A22' }}>▼ {t('festival.notice.owed', { money: money(owed) })}</p>}
        <div className="mt-2 flex justify-between border-t-2 border-dashed border-ink pt-2 text-[16px] font-extrabold"><span>{t('festival.notice.left')}</span><span>{money(played.end)}</span></div>
        <span className="sr-only">{money(totalIn)} {money(totalOut)}</span>
      </section>

      <button type="button" className="ink-btn pink self-center" onClick={() => decide({ k: 'seen', screen: 'festival' })}>{t('festival.go')} ▶</button>
    </div>
  )
}

/** S10: the same plan replayed in ten possible festivals, with the simple shortfall rules deciding each time. */
type DiyaState = 'unlit' | 'lit' | 'dim' | 'out'

/** One clay diya. Lit = money held and goals met; dim = money held, goals missed; out = money ran out (smoke). */
function Diya({ state, label, selected, onClick }: { state: DiyaState; label: string; selected: boolean; onClick: () => void }) {
  const flame = state === 'lit' ? '#F28C28' : state === 'dim' ? '#E8B04A' : null
  return (
    <button type="button" onClick={onClick} aria-label={label} aria-pressed={selected} className="grid min-h-16 place-items-center rounded-xl border-[3px] border-ink p-1" style={{ background: selected ? '#FFE08A' : '#FFF8E6', boxShadow: selected ? '2px 3px 0 #2B1A17' : undefined }}>
      <svg viewBox="0 0 60 64" width="52" height="56" aria-hidden>
        {state === 'lit' && <circle cx="30" cy="26" r="22" fill="#FFD36B" opacity=".45" />}
        {flame && (
          <g className="flame">
            <path d={state === 'lit' ? 'M30 6 C38 16 40 24 30 34 C20 24 22 16 30 6 Z' : 'M30 18 C35 24 36 29 30 34 C24 29 25 24 30 18 Z'} fill={flame} stroke="#2B1A17" strokeWidth="2" />
            {state === 'lit' && <path d="M30 18 C34 23 34 28 30 32 C26 28 26 23 30 18 Z" fill="#FFF1C4" />}
          </g>
        )}
        {state === 'out' && <path d="M30 34 C24 28 36 24 28 16 M33 30 C40 24 30 18 36 10" fill="none" stroke="#7A7A7A" strokeWidth="3" strokeLinecap="round" opacity=".7" />}
        <path d="M6 38 C6 54 20 60 30 60 C40 60 54 54 54 38 Z" fill={state === 'out' ? '#8A7B6B' : '#C8693A'} stroke="#2B1A17" strokeWidth="3" strokeLinejoin="round" />
        <ellipse cx="30" cy="38" rx="24" ry="5" fill={state === 'out' ? '#6B5E52' : '#8E4521'} stroke="#2B1A17" strokeWidth="3" />
        {state === 'unlit' && <path d="M30 34 L30 30" stroke="#2B1A17" strokeWidth="3" strokeLinecap="round" />}
      </svg>
    </button>
  )
}

/** S10: ten possible festivals as ten diyas. Light them one by one; tap any to read its story. */
export function Futures() {
  const { t, money, when } = useSd()
  const label = useLabel()
  const decide = useShowdown((s) => s.decide)
  const { plan, log } = useView()
  const runs = futuresRun(plan, choicesOf(log))
  const ranks = plan.ranks ?? []
  const metAll = (r: (typeof runs)[number]['result']) => ranks.every((g) => r.goals.includes(g))
  const stateOf = (r: (typeof runs)[number]['result']): DiyaState => (!r.survived ? 'out' : metAll(r) ? 'lit' : 'dim')
  const k = runs.filter((r) => r.result.survived).length
  const g = runs.filter((r) => r.result.survived && metAll(r.result)).length
  const fb = firstBreak(runs)
  const [shown, setShown] = useState(0)
  const [pick, setPick] = useState<string>('F2')
  const done = shown >= runs.length
  useEffect(() => {
    if (shown === 0 || shown >= runs.length) return
    const id = window.setTimeout(() => setShown(shown + 1), 320)
    return () => window.clearTimeout(id)
  }, [shown, runs.length])
  const sel = runs.find((r) => r.id === pick)!
  const sf = future(pick)
  const crowdWord = sf.crowd >= 1.1 ? 'big' : sf.crowd <= 0.9 ? 'small' : 'normal'
  const weak = runs.find((r) => !r.result.survived) ?? runs.find((r) => !metAll(r.result))
  return (
    <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:items-start">
      <div className="paper p-3 md:col-span-2">
        <h1 className="font-display lang-fit m-0 text-[22px] leading-tight">{t('futures.title')}</h1>
        <p className="m-0 mt-1 text-[13px] font-bold leading-snug">{t('futures.sub')}</p>
      </div>

      <section className="paper p-3">
        <ul className="m-0 grid list-none grid-cols-5 gap-1.5 p-0">
          {runs.map(({ id, result }, i) => (
            <li key={id} className="text-center">
              <Diya state={i < shown ? stateOf(result) : 'unlit'} label={`${id}${id === 'F2' ? ' · ' + t('futures.played') : ''}`} selected={pick === id} onClick={() => setPick(id)} />
              <div className="text-[11px] font-extrabold">{id === 'F2' ? '★ ' : ''}{id}</div>
            </li>
          ))}
        </ul>
        {shown === 0 && <button type="button" className="ink-btn pink mx-auto mt-3 block" onClick={() => setShown(1)}>🪔 {t('futures.light')}</button>}
        {shown > 0 && <p className="m-0 mt-2 text-center text-[12px] font-extrabold" role="status">{done ? t('futures.lit', { k, g }) : t('futures.lighting')}</p>}
        <p className="m-0 mt-1 flex flex-wrap justify-center gap-x-3 text-[11px] font-bold opacity-90">
          <span><span style={{ color: '#F28C28' }}>●</span> {t('futures.keyLit')}</span>
          <span><span style={{ color: '#E8B04A' }}>●</span> {t('futures.keyDim')}</span>
          <span><span style={{ color: '#7A7A7A' }}>●</span> {t('futures.keyOut')}</span>
        </p>
      </section>

      <section className="paper p-3" aria-live="polite">
        <h2 className="font-sign lang-fit m-0 text-[15px]">{pick}{pick === 'F2' ? ` · ${t('futures.played')}` : ''}</h2>
        <ul className="m-0 mt-1 flex list-none flex-wrap gap-1.5 p-0 text-[12px] font-extrabold">
          <li className="rounded-md border-2 border-ink px-1.5" style={{ background: '#FFE08A' }}>💰 {t('futures.sponsorChip', { sponsor: money(sf.sponsor), at: t(`futures.at.${sf.sponsorAt}`) })}</li>
          <li className="rounded-md border-2 border-ink px-1.5" style={{ background: '#D6ECF5' }}>👥 {t(`futures.crowd.${crowdWord}`)}</li>
          <li className="rounded-md border-2 border-ink px-1.5" style={{ background: '#F7C9C0' }}>🔧 {t('futures.repair', { n: sf.elec })}</li>
          <li className="rounded-md border-2 border-ink px-1.5" style={{ background: '#CDE8C4' }}>🎁 {sf.donation ? t('futures.donation') : t('futures.noDonationChip')}</li>
        </ul>
        {done || pick === 'F2' ? (
          <>
            <p className="m-0 mt-2 text-[14px] font-extrabold">{sel.result.survived ? '✓ ' + t('futures.money') : '✕ ' + t('futures.moneyShort', { when: when(sel.result.shortfalls[0]?.[0] ?? 'FD') })}</p>
            {ranks.length > 0 && (
              <ul className="m-0 mt-1 flex list-none flex-wrap gap-1 p-0 text-[12px] font-extrabold">
                {ranks.map((gid) => <li key={gid} className="rounded-md border-2 border-ink px-1.5" style={{ background: sel.result.goals.includes(gid) ? '#CDE8C4' : '#F7C9C0' }}>{sel.result.goals.includes(gid) ? '✓' : '✕'} {t(`goals.${gid}.name`)}</li>)}
              </ul>
            )}
          </>
        ) : <p className="m-0 mt-2 text-[12px] font-bold opacity-80">{t('futures.lightFirst')}</p>}
      </section>

      {done && (
        <section className="paper anim-squash p-3 text-center md:col-span-2" style={{ background: g >= 7 ? '#FFE08A' : undefined }}>
          <p className="font-display m-0 text-[20px] leading-tight">{t('futures.count', { k })}</p>
          <p className="font-display m-0 mt-1 text-[18px] leading-tight">{t('futures.goalsCount', { g })}</p>
          {g < k && <p className="m-0 mt-1 text-[13px] font-extrabold">{t('futures.goalsWarn')}</p>}
          <p className="m-0 mt-1 text-[14px] font-extrabold">{fb ? t('futures.first', { when: when(fb.point), bill: label(fb.bill) }) : t('futures.none')}</p>
          {weak && <button type="button" className="ink-btn cream mt-2" onClick={() => setPick(weak.id)}>{t('futures.weak', { id: weak.id })}</button>}
          <p className="m-0 mt-2 text-[12px] font-bold opacity-80">{t('futures.autopilot')}</p>
        </section>
      )}
      {done && <div className="md:col-span-2"><MomentLesson futures /></div>}
      <button type="button" className="ink-btn pink self-center md:col-span-2 md:justify-self-center" disabled={!done} style={{ opacity: done ? 1 : 0.5 }} onClick={() => decide({ k: 'seen', screen: 'futures' })}>{t('futures.go')} ▶</button>
    </div>
  )
}
