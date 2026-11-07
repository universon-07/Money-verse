import { useState } from 'react'
import { canPayLater, maxHaggles, schedule, unitPrice } from '../engine/contract'
import { RULES, item } from '../engine/content'
import { DEFAULT_PLATES, answerOf, dealOf, isSigned, offer, signBlock } from '../engine/log'
import { PREDICTIONS } from '../engine/predictions'
import { POINTS, type Point } from '../engine/types'
import { useShowdown, useView } from '../state/store'
import { Ask, CashLinesTable, Say, Sheet } from './kit'
import { useSd } from './useSd'

const VENDOR_COLOR: Record<string, string> = { daamfix: '#2F6F73', chacha: '#3F7A3A', sasta: '#E8B04A', mega: '#D8503A' }

/** One item, one vendor: price, terms, haggle, pay later, fine print, and the total with required extras. */
function ItemSheet({ id, onClose, onSigned }: { id: string; onClose: () => void; onSigned: (msg: string) => void }) {
  const { t, money, when } = useSd()
  const decide = useShowdown((s) => s.decide)
  const { market: m, log } = useView()
  const def = item(id)
  const [qty, setQty] = useState(DEFAULT_PLATES)
  const [ask, setAsk] = useState<string | null>(null)

  // the guesses asked in context: P2 the first time a sound set is opened, P4 for the Combo
  const askId = ['basic', 'reliable'].includes(id) && !answerOf(log, 'P2') ? 'P2' : id === 'combo' && !answerOf(log, 'P4') ? 'P4' : null
  if (askId) {
    return (
      <Sheet label={t('ask.label')} onClose={onClose}>
        <div className="font-sign lang-fit mb-2 text-[13px] text-pink">{t('ask.label')}</div>
        <Ask q={t(`ask.${askId}.q`)} opts={PREDICTIONS[askId].options.map((o) => [o, t(`ask.${askId}.opts.${o}`)])} value={ask} onPick={setAsk} go={t('ask.go')} onLock={() => ask && decide({ k: 'predict', id: askId, answer: ask })} />
      </Sheet>
    )
  }

  const deal = dealOf(m, id)
  const signed = isSigned(m, id)
  const block = signBlock(m, id)
  const { contract, total } = offer(m, id, qty)
  const price = unitPrice(contract)
  const hidden = id === 'basic' && !m.readBasic
  const [sched] = schedule(contract)
  const shown = { ...sched }
  if (hidden) shown.W1 = (shown.W1 ?? 0) - (def.addon ?? 0)
  const canHaggle = !signed && !m.locked && m.actionsLeft > 0 && deal.haggles < maxHaggles(id)
  const nextPrice = def.ladder[Math.min(deal.haggles + 1, def.ladder.length - 1)]
  const cast = id === 'big' ? 'arjunBig' : id === 'combo' ? 'arjunCombo' : id === 'basic' ? 'ayeshaBasic' : 'ayeshaGeneral'
  const who = cast.startsWith('arjun') ? 'arjun' : 'ayesha'

  const sign = () => {
    decide({ k: 'sign', item: id, qty })
    if (hidden) onSigned(t('sheet.toast', { amount: money(def.addon!), total: money(total) }))
    onClose()
  }

  return (
    <Sheet label={t(`items.${id}.name`)} onClose={onClose}>
      <div className="flex flex-col gap-2.5">
        <div>
          <h2 className="font-display lang-fit m-0 text-[22px] leading-tight">{t(`items.${id}.name`)}</h2>
          <p className="m-0 text-[13px] font-bold opacity-80">{t(`items.${id}.desc`)}</p>
        </div>
        <Say who={who}><span className="text-[14px]">{t(`sheet.${cast}`)}</span></Say>

        <div className="flex items-baseline gap-2">
          <span className="text-[12px] font-extrabold">{t('sheet.price')}</span>
          <span className="font-display text-[26px] leading-none">{money(price)}</span>
          {def.unit && <span className="text-[13px] font-bold">{t('sheet.perPlate')}</span>}
          {id === 'combo' && <span className="text-[13px] font-bold line-through opacity-70">{t('sheet.was', { was: money(28000) })}</span>}
        </div>
        {id === 'combo' && <p className="m-0 w-fit rounded-md border-2 border-ink bg-[#F7C9C0] px-2 text-[12px] font-extrabold">{t('sheet.ends')}</p>}

        {def.unit && (
          <div>
            <div className="text-[13px] font-extrabold">{t('sheet.qty')}</div>
            <div className="mt-1 flex items-center justify-center gap-3">
              <button type="button" className="ink-chip font-sign grid h-12 w-12 place-items-center text-[22px] disabled:opacity-40" disabled={signed || qty <= RULES.plateMin} aria-label="−" onClick={() => setQty(qty - RULES.plateStep)}>−</button>
              <span className="font-display min-w-16 text-center text-[24px]">{qty}</span>
              <button type="button" className="ink-chip font-sign grid h-12 w-12 place-items-center text-[22px] disabled:opacity-40" disabled={signed || qty >= RULES.plateMax} aria-label="+" onClick={() => setQty(qty + RULES.plateStep)}>+</button>
            </div>
            <p className="m-0 text-center text-[12px] font-bold opacity-80">{t('sheet.qtyNote')}</p>
          </div>
        )}

        <div>
          <div className="text-[13px] font-extrabold">{t('sheet.terms')}</div>
          <ul className="m-0 mt-0.5 list-none p-0 text-[14px] font-bold">
            {POINTS.filter((p: Point) => (shown[p] ?? 0) > 0).map((p) => <li key={p} className="flex justify-between"><span>{when(p)}</span><span>{money(Math.round(shown[p]!))}</span></li>)}
          </ul>
          {def.addon && !hidden && <p className="m-0 mt-1 text-[13px] font-bold">{t('sheet.extra', { amount: money(def.addon), when: when(def.addonAt!) })}</p>}
          <p className="m-0 mt-1 text-[14px] font-extrabold">{hidden ? t('sheet.unread') : t('sheet.totalIs', { total: money(Math.round(total)) })}</p>
        </div>

        {!signed && (
          <div className="flex flex-col gap-2">
            {def.ladder.length > 1 ? (
              <button type="button" className="ink-btn cream" disabled={!canHaggle} style={{ opacity: canHaggle ? 1 : 0.5 }} onClick={() => decide({ k: 'haggle', item: id })}>
                🤝 {deal.haggles >= maxHaggles(id) ? t('sheet.best') : m.actionsLeft <= 0 ? t('sheet.noActions') : t('sheet.haggleTo', { price: money(nextPrice) })}
              </button>
            ) : <p className="m-0 text-center text-[13px] font-bold opacity-80">{t('sheet.daamfix')}</p>}
            {def.ladder.length > 1 && <p className="m-0 text-[12px] font-bold opacity-80">{t('sheet.haggleHelp')}</p>}
            {canPayLater(id) && (
              <button type="button" className="ink-btn cream" disabled={deal.late || m.actionsLeft <= 0} style={{ opacity: deal.late || m.actionsLeft <= 0 ? 0.6 : 1 }} aria-pressed={deal.late} onClick={() => decide({ k: 'payLater', item: id })}>
                🗓 {deal.late ? t('sheet.payLaterOn') : t('sheet.payLater')}
              </button>
            )}
            {canPayLater(id) && (
              <p className="m-0 text-[12px] font-bold opacity-80">{t('sheet.payLaterHelp')}</p>
            )}
            {id === 'basic' && !m.readBasic && (
              <button type="button" className="ink-btn cream" disabled={m.actionsLeft <= 0} style={{ opacity: m.actionsLeft <= 0 ? 0.6 : 1 }} onClick={() => decide({ k: 'read', item: 'basic' })}>🔍 {t('sheet.read')}</button>
            )}
            {id === 'basic' && !m.readBasic && <p className="m-0 text-[12px] font-bold opacity-80">{t('sheet.readHelp')}</p>}
            {id === 'basic' && m.readBasic && <p className="m-0 text-[13px] font-extrabold">🔍 {t('sheet.fine', { amount: money(def.addon!), when: when(def.addonAt!) })}</p>}
          </div>
        )}

        {block && block !== 'signed' && <p className="m-0 text-center text-[13px] font-extrabold" style={{ color: '#7A2A22' }}>{t(`sheet.blocked.${block}`)}</p>}
        <div className="flex flex-col gap-2">
          {signed ? (
            <button type="button" className="ink-btn cream" onClick={() => { decide({ k: 'drop', item: id }); onClose() }}>{t('sheet.drop')}</button>
          ) : (
            <button type="button" className="ink-btn pink" disabled={!!block} style={{ opacity: block ? 0.5 : 1 }} onClick={sign}>
              {def.unit ? t('sheet.signPlates', { price: money(price) }) : t('sheet.sign', { price: money(price) })}
            </button>
          )}
          <button type="button" className="ink-btn cream" onClick={onClose}>{t('sheet.notNow')}</button>
        </div>
      </div>
    </Sheet>
  )
}

const NEEDS = [
  { id: 'kids', emoji: '🎠', goal: 'G1', items: ['kids'] },
  { id: 'plates', emoji: '🍽', goal: 'G2', items: ['plates'] },
  { id: 'sound', emoji: '🔊', goal: 'G3', items: ['mini', 'big', 'basic', 'reliable'] },
  { id: 'lights', emoji: '💡', goal: 'G3', items: ['lights', 'lightsC'] },
  { id: 'safety', emoji: '🛟', goal: 'G5', items: ['safety', 'p1', 'p2'] },
  { id: 'combo', emoji: '🎁', goal: 'G3', items: ['combo'] },
] as const
const PAY_COLOR: Record<string, string> = { W1: '#E8B04A', W2: '#5BB5D6', W3: '#F28C28', FD: '#3F7A3A' }

/** When the money leaves your pocket: one bar, one coloured piece per date. */
function PayStrip({ amounts }: { amounts: Partial<Record<Point, number>> }) {
  const { money, when } = useSd()
  const parts = POINTS.filter((p: Point) => (amounts[p] ?? 0) > 0)
  const sum = parts.reduce((a, p) => a + amounts[p]!, 0) || 1
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full border-2 border-ink" aria-hidden>
        {parts.map((p) => <div key={p} style={{ width: `${(amounts[p]! / sum) * 100}%`, background: PAY_COLOR[p] }} />)}
      </div>
      <ul className="m-0 mt-1 flex list-none flex-wrap gap-x-3 p-0 text-[12px] font-bold">
        {parts.map((p) => <li key={p}><span aria-hidden style={{ color: PAY_COLOR[p] }}>●</span> {when(p)} {money(Math.round(amounts[p]!))}</li>)}
      </ul>
    </div>
  )
}

/** One need, several offers side by side: price, when you pay, what the seller promises. */
function NeedSheet({ need, onPick, onClose }: { need: (typeof NEEDS)[number]; onPick: (id: string) => void; onClose: () => void }) {
  const { t, money } = useSd()
  const { market: m } = useView()
  return (
    <Sheet label={t(`market.needs.${need.id}.name`)} onClose={onClose}>
      <h2 className="font-display lang-fit m-0 text-[22px]">{need.emoji} {t(`market.needs.${need.id}.name`)}</h2>
      <p className="m-0 text-[13px] font-bold opacity-80">{t(`market.needs.${need.id}.why`)}</p>
      <ul className="m-0 mt-3 flex list-none flex-col gap-2.5 p-0">
        {need.items.map((id) => {
          const def = item(id)
          const signed = isSigned(m, id)
          const { contract, total } = offer(m, id)
          const hidden = id === 'basic' && !m.readBasic
          const [sched] = schedule(contract)
          const shown = { ...sched }
          if (hidden) shown.W1 = (shown.W1 ?? 0) - (def.addon ?? 0)
          return (
            <li key={id}>
              <button type="button" className="ink-chip flex w-full flex-col gap-1.5 !rounded-2xl px-3 py-2 text-left" style={{ background: signed ? '#CDE8C4' : undefined }} onClick={() => onPick(id)}>
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-[15px] font-extrabold leading-tight">{signed ? '✓ ' : ''}{t(`items.${id}.name`)}</span>
                  <span className="font-display shrink-0 text-[19px]">{money(unitPrice(contract))}{def.unit ? t('market.each') : ''}</span>
                </span>
                <span className="text-[12px] font-bold opacity-80">{t(`items.${id}.desc`)}</span>
                <span className="w-fit rounded-md border-2 border-ink px-1.5 text-[11px] font-extrabold" style={{ background: VENDOR_COLOR[def.vendor] + '33' }}>{t(`market.vendors.${def.vendor}.name`)} · {t(`market.vendors.${def.vendor}.tag`)}</span>
                {!def.unit && <PayStrip amounts={shown} />}
                <span className="text-[13px] font-extrabold">{hidden ? t('market.totalHidden') : def.unit ? t('market.perPlateNote') : t('market.totalIs', { total: money(Math.round(total)) })}</span>
              </button>
            </li>
          )
        })}
      </ul>
      <button type="button" className="ink-btn cream mt-3 w-full" onClick={onClose}>{t('back')}</button>
    </Sheet>
  )
}

/** S5: a shopping list of five needs, each tied to a goal. Pick an offer for each, then check the plan. */
export function Market() {
  const { t, money } = useSd()
  const decide = useShowdown((s) => s.decide)
  const { market: m, plan, lines } = useView()
  const [needId, setNeedId] = useState<string | null>(null)
  const [itemId, setItemId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const need = NEEDS.find((n) => n.id === needId) ?? null
  const spent = m.signed.reduce((a, c) => a + schedule(c)[1], 0)
  const combo = isSigned(m, 'combo')
  const covered = NEEDS.filter((n) => n.id !== 'combo' && (n.items.some((i) => isSigned(m, i)) || (combo && ['sound', 'lights', 'safety'].includes(n.id)))).length
  return (
    <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:items-start">
      <div className="paper p-3 md:col-span-2">
        <div className="flex items-center justify-between gap-2">
          <h1 className="font-display lang-fit m-0 text-[22px]">{t('market.title')}</h1>
          <span className="rounded-md border-2 border-ink bg-mustard px-2 py-0.5 text-[13px] font-extrabold" role="status">{t('market.actions', { n: m.actionsLeft, max: RULES.actions })}</span>
        </div>
        <ol className="m-0 mt-2 flex list-none flex-col gap-1 p-0 text-[13px] font-bold leading-snug">
          {[1, 2, 3].map((n) => <li key={n}><span className="font-extrabold">{n}.</span> {t(`market.how.${n}`)}</li>)}
        </ol>
        <p className="m-0 mt-1 text-[12px] font-bold opacity-80">{t('market.actionsNote')}</p>
      </div>

      {toast && <p className="ink-chip anim-squash m-0 px-3 py-2 text-[14px] font-extrabold md:col-span-2" style={{ background: '#FFE08A' }} role="status" onClick={() => setToast(null)}>{toast}</p>}

      <section className="paper p-3">
        <h2 className="font-sign lang-fit m-0 text-[15px]">{t('market.list')}</h2>
        <p className="m-0 text-[12px] font-bold opacity-80">🏛 {t('market.hall')} · {money(10000)}</p>
        <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
          {NEEDS.map((n) => {
            const rank = plan.ranks ? plan.ranks.indexOf(n.goal as never) : -1
            const mine = m.signed.filter((c) => (n.items as readonly string[]).includes(c.id))
            return (
              <li key={n.id}>
                <button type="button" onClick={() => setNeedId(n.id)} className="ink-chip flex min-h-16 w-full items-center gap-2 !rounded-2xl px-3 py-2 text-left" style={{ background: mine.length ? '#CDE8C4' : undefined }}>
                  <span aria-hidden className="text-[26px]">{n.emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-extrabold leading-tight">{mine.length ? '✓ ' : ''}{t(`market.needs.${n.id}.name`)}</span>
                    <span className="block text-[12px] font-bold opacity-80">
                      {mine.length ? mine.map((c) => t(`items.${c.id}.name`) + (c.id === 'plates' ? ` × ${c.qty}` : '')).join(', ') : t(`market.needs.${n.id}.why`)}
                    </span>
                    {rank >= 0 && <span className="mt-0.5 inline-block rounded-md border-2 border-ink bg-mustard px-1.5 text-[11px] font-extrabold">{t('market.goalRank', { n: rank + 1 })}</span>}
                  </span>
                  <span className="shrink-0 text-right text-[13px] font-extrabold">
                    {mine.length ? money(Math.round(mine.reduce((a, c) => a + schedule(c)[1], 0))) : t('market.choose') + ' ▶'}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        <div className="mt-3 flex items-baseline justify-between border-t-[3px] border-dashed border-ink/40 pt-2">
          <span className="text-[13px] font-extrabold">{t('market.sofar', { n: covered, of: NEEDS.length - 1 })}</span>
          <span className="font-display text-[20px]">{money(Math.round(spent))}</span>
        </div>
        <ul className="m-0 mt-1 list-none p-0">
          {m.signed.filter((c) => c.id !== 'hall').map((c) => (
            <li key={c.id} className="flex items-center justify-between text-[13px] font-bold">
              <span>{t(`items.${c.id}.name`)}</span>
              <button type="button" className="ink-chip grid h-12 w-12 place-items-center" aria-label={t('sheet.drop')} onClick={() => decide({ k: 'drop', item: c.id })}>✕</button>
            </li>
          ))}
        </ul>
      </section>

      <section className="paper p-3">
        <CashLinesTable lines={lines} />
      </section>

      <button type="button" className="ink-btn pink self-center md:col-span-2 md:justify-self-center" onClick={() => decide({ k: 'seen', screen: 'market' })}>{t('market.check')} ▶</button>

      {need && !itemId && <NeedSheet need={need} onPick={setItemId} onClose={() => setNeedId(null)} />}
      {itemId && <ItemSheet id={itemId} onClose={() => setItemId(null)} onSigned={setToast} />}
    </div>
  )
}
