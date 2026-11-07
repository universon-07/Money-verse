import { useEffect, useState } from 'react'
import { trolleyItem } from '../engine/content'
import { boughtThings, guessBand, littleTotal, tagWorth, trolleyOk, trolleySkip } from '../engine/economy'
import type { Payment } from '../engine/types'
import { useStage } from '../state/stage'
import { useCafe } from '../state/store'
import { Btn, Caption, Icon, SourcePicker } from './kit'
import { useCt } from './text'


/** Round 3, Phase 2: tiny things line up at the pay line. Each waits for OK or Skip; nothing times out. */
export function TrolleyRound() {
  const { t, money } = useCt()
  const run = useCafe((s) => s.run)
  const apply = useCafe((s) => s.apply)
  const next = useCafe((s) => s.next)
  const [i, setI] = useState(0)
  const [paying, setPaying] = useState(false)
  const [line, setLine] = useState(t('trolley.l1'))
  const [streak, setStreak] = useState<{ kind: 'ok' | 'skip'; n: number }>({ kind: 'ok', n: 0 })
  const order = run.trolleyOrder
  const id = order[i]
  const done = i >= order.length

  const advance = (kind: 'ok' | 'skip') => {
    const n = streak.kind === kind ? streak.n + 1 : 1
    setStreak({ kind, n })
    // six-item build: comment after 3 OKs or 2 Skips in a row
    if (kind === 'ok' && n === 3) setLine(t('trolley.streakOk'))
    else if (kind === 'skip' && n === 2) setLine(t('trolley.streakSkip'))
    else setLine(i + 1 < order.length ? t(`items.${order[i + 1]}.line`) : t('trolley.end'))
    setPaying(false)
    setI(i + 1)
  }
  const ok = () => {
    const it = trolleyItem(id)
    if (run.jars.spend >= it.price) { apply((r) => trolleyOk(r, id, { spend: it.price })); advance('ok') } else setPaying(true)
  }

  if (done) {
    return (
      <div className="flex flex-col gap-3">
        <Caption text={t('trolley.end')} />
        <div className="flex justify-end"><Btn onClick={next}>{t('hud.next')} ▸</Btn></div>
      </div>
    )
  }
  const it = trolleyItem(id)
  return (
    <div className="flex flex-col gap-2">
      <Caption who={i === 0 ? 'chacha' : 'yusuf'} text={i === 0 ? `${line} ${t('trolley.noSaucer')}` : line} />
      <div className="cafe-lane" aria-label={t('trolley.next')}>
        {order.slice(i, i + 3).map((q, k) => (
          <div key={q + k} className={`cafe-tray ${k === 0 ? 'is-front' : ''}`} aria-hidden={k > 0}>
            <Icon id={q} size={k === 0 ? 56 : 40} />
            <span className="text-[12px] font-bold leading-tight">{t(`items.${q}.name`)}</span>
            <span className="text-[13px] font-extrabold">{money(trolleyItem(q).price)}</span>
          </div>
        ))}
      </div>
      {paying ? (
        <SourcePicker run={run} amount={it.price} onPay={(p: Payment) => { apply((r) => trolleyOk(r, id, p)); advance('ok') }} onCancel={() => { apply((r) => trolleySkip(r, id)); advance('skip') }} />
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Btn onClick={ok}>{t('trolley.ok', { x: it.price })}</Btn>
          <Btn kind="cream" onClick={() => { apply((r) => trolleySkip(r, id)); advance('skip') }}>{t('trolley.skip')}</Btn>
        </div>
      )}
    </div>
  )
}

/** Predict 2: without the ledger, guess what the little things cost */
export function Predict2() {
  const { t } = useCt()
  const apply = useCafe((s) => s.apply)
  const next = useCafe((s) => s.next)
  return (
    <div className="flex flex-col gap-3">
      <Caption text={t('trolley.predict')} />
      <div className="grid grid-cols-2 gap-2">
        {([0, 1, 2, 3] as const).map((b) => (
          <button key={b} type="button" className="cafe-choice" onClick={() => { apply((r) => ({ ...r, predict2: b })); next() }}>{t(`trolley.b${b}`)}</button>
        ))}
      </div>
    </div>
  )
}

/** the plates fly in and stack, then the bill slip unrolls to the real total */
export function Plates() {
  const { t, band } = useCt()
  const run = useCafe((s) => s.run)
  const next = useCafe((s) => s.next)
  const setStage = useStage((s) => s.set)
  const x = littleTotal(run)
  const n = run.trolley.filter((q) => q.action === 'ok').length
  const [shown, setShown] = useState(false)
  useEffect(() => {
    setStage({ plates: n })
    const id = window.setTimeout(() => setShown(true), 300 + n * 140)
    return () => window.clearTimeout(id)
  }, [n, setStage])
  const g = run.predict2 ?? 0
  const actual = guessBand(x)
  const key = n === 0 ? 'nothing' : actual > g ? 'above' : actual === g ? 'inside' : 'below'
  return (
    <div className="flex flex-col gap-3">
      {shown ? <Caption text={t(`trolley.${key}`, { range: band(g), x })} /> : <Caption who="scene" text="…" />}
      {shown && (
        <div className="cafe-bill is-slip">
          <div className="font-display text-[30px] leading-none">₹{x}</div>
          <span className="cafe-bill-stamp is-wide">{t('trolley.stamp')}</span>
        </div>
      )}
      <div className="flex justify-end"><Btn disabled={!shown} onClick={next}>{t('hud.next')} ▸</Btn></div>
    </div>
  )
}

/** Worth it? Only the player decides what was worth it. Bills are not tagged: they were not choices. */
export function Worth() {
  const { t, item } = useCt()
  const run = useCafe((s) => s.run)
  const apply = useCafe((s) => s.apply)
  const next = useCafe((s) => s.next)
  const things = boughtThings(run)
  const all = things.every((x) => run.worth[x.key])
  const glad = things.filter((x) => run.worth[x.key] === 'glad')
  const meh = things.filter((x) => run.worth[x.key] === 'meh')
  const sum = (xs: typeof things) => xs.reduce((a, x) => a + x.price, 0)
  if (!things.length) {
    return (
      <div className="flex flex-col gap-3">
        <Caption text={t('trolley.worthNone')} />
        <div className="flex justify-end"><Btn onClick={next}>{t('hud.next')} ▸</Btn></div>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      <Caption text={all ? `${t('trolley.worthSum', { g: glad.length, x: sum(glad), m: meh.length, y: sum(meh) })} ${meh.length ? t('trolley.worthMeh', { y: sum(meh) }) : t('trolley.worthAllGlad')}` : `${t('trolley.worth1')} ${t('trolley.worthPrompt')}`} />
      <div className="flex max-h-[38vh] flex-col gap-1.5 overflow-y-auto pr-1">
        {things.map((x) => (
          <div key={x.key} className="cafe-src">
            <span className="flex-1 font-bold">{item(x.itemId)} · ₹{x.price}</span>
            <div className="flex gap-1">
              {(['glad', 'meh'] as const).map((tag) => (
                <button key={tag} type="button" aria-pressed={run.worth[x.key] === tag} className={`cafe-tag ${run.worth[x.key] === tag ? 'is-on' : ''}`} onClick={() => apply((r) => tagWorth(r, x.key, tag))}>
                  {t(`trolley.${tag}`)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end"><Btn disabled={!all} onClick={next}>{t('hud.next')} ▸</Btn></div>
    </div>
  )
}
