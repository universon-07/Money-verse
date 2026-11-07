import { useEffect, useState } from 'react'
import { windowItem } from '../engine/content'
import { buyWindow, declineWindow } from '../engine/economy'
import { stageOf } from '../engine/pressure'
import type { Payment, Run } from '../engine/types'
import { useStage } from '../state/stage'
import { useCafe } from '../state/store'
import { Btn, Caption, Icon, SourcePicker, useSteam } from './kit'
import { useCt } from './text'

type Status = 'offer' | 'cooling' | 'ask' | 'pay' | 'done'

/** one offer on the window. It waits for the player: no hidden timer, only the saucer counts (and Pause freezes it). */
function Offer({ id, slot, onResolved }: { id: string; slot: 0 | 1; onResolved: (line: string) => void }) {
  const { t, money } = useCt()
  const run = useCafe((s) => s.run)
  const apply = useCafe((s) => s.apply)
  const slow = useCafe((s) => s.slow)
  const setSaucer = useStage((s) => s.setSaucer)
  const it = windowItem(id)
  const [status, setStatus] = useState<Status>('offer')
  const [via, setVia] = useState<'get' | 'cool'>('get')
  const steam = useSteam(status === 'cooling', 10, () => {
    setSaucer(slot, null)
    // the match ticket really sells out while it cools: waiting is a check, not a rule
    if (it.soldOut) { apply((r) => declineWindow(r, id, 'soldout')); setStatus('done'); onResolved(t(`items.${id}.soldOut`)) } else setStatus('ask')
  })
  useEffect(() => { if (status === 'cooling') setSaucer(slot, steam) }, [steam, status, slot, setSaucer])

  const buy = (v: 'get' | 'cool') => {
    setVia(v)
    if (run.jars.spend >= it.price) {
      apply((r) => buyWindow(r, id, { spend: it.price }, v))
      setStatus('done')
      onResolved(v === 'get' ? t(`items.${id}.get`) : t(`items.${id}.coolYes`))
    } else setStatus('pay') // the tumbler is short: where should it come from?
  }
  const decline = (how: 'pass' | 'dropped') => {
    apply((r) => declineWindow(r, id, how))
    setStatus('done')
    onResolved(how === 'pass' ? (t(`items.${id}.pass`, { defaultValue: '' }) || t('window.gone')) : t(`items.${id}.coolNo`))
  }

  if (status === 'done') return null
  if (status === 'pay') {
    return (
      <div className="cafe-offer">
        <Caption text={t('window.short')} />
        <SourcePicker run={run} amount={it.price} onPay={(p: Payment) => { apply((r) => buyWindow(r, id, p, via)); setStatus('done'); onResolved(t(`items.${id}.get`)) }}
          onCancel={() => { apply((r) => declineWindow(r, id, 'pass')); setStatus('done'); onResolved(t('window.leave')) }} />
      </div>
    )
  }
  return (
    <div className="cafe-offer" aria-label={`${t(`items.${id}.name`)} ${money(it.price)}`}>
      <div className="flex items-start justify-between gap-2">
        <Icon id={id} size={56} />
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-bold">{t(`items.${id}.name`)}</div>
          <div className="text-[12px] opacity-75">“{t(`items.${id}.pitch`)}”</div>
        </div>
        <div className="text-right">
          <div className="font-display text-[22px] leading-none">{money(it.price)}</div>
          <div className={`cafe-kind is-${it.kind}`}>{t(`window.kind_${it.kind}`)}</div>
        </div>
      </div>
      {status === 'offer' && (
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          <Btn onClick={() => buy('get')}>{t('window.get', { x: it.price })}</Btn>
          <Btn kind="cream" onClick={() => setStatus('cooling')}>☕ {t('window.cool')}</Btn>
          <Btn kind="ghost" onClick={() => decline('pass')}>{t('window.pass')}</Btn>
        </div>
      )}
      {status === 'cooling' && (
        <div className="mt-2">
          <div className="text-[13px] font-bold">{t('window.steam')}</div>
          <div className="cafe-meter is-steam" aria-hidden><span style={{ width: `${steam * 100}%`, transition: slow ? 'width .3s' : undefined }} /></div>
        </div>
      )}
      {status === 'ask' && (
        <div className="mt-2">
          <div className="text-[14px] font-bold">{t('window.still')}</div>
          <div className="mt-1 grid grid-cols-2 gap-1.5">
            <Btn onClick={() => buy('cool')}>{t('window.yes')}</Btn>
            <Btn kind="cream" onClick={() => decline('dropped')}>{t('window.no')}</Btn>
          </div>
        </div>
      )}
    </div>
  )
}

/** a pattern comment, once per round, after the fact and never as a judgement */
function dynLine(run: Run): string | null {
  const w = run.window
  const bought = w.filter((x) => x.bought).length
  const cooled = w.filter((x) => x.action === 'cool').length
  const dropped = w.filter((x) => x.action === 'cool' && !x.bought).length
  if (bought === 0) return 'window.dynNone'
  if (dropped >= 2) return 'window.dynDrop'
  if (cooled >= 1) return 'window.dynCool'
  if (bought >= 4) return 'window.dynBusy'
  if (bought >= 2 && cooled === 0) return 'window.dynRow'
  return null
}

/** Round 2, Phase 1: offers come in patterns, one at a time, then a pair you cannot both afford. */
export function WindowRound() {
  const { t, stage } = useCt()
  const run = useCafe((s) => s.run)
  const next = useCafe((s) => s.next)
  const stageSet = useStage((s) => s.set)
  const [wave, setWave] = useState(0)
  const [lines, setLines] = useState<string[]>([])
  const [resolved, setResolved] = useState(0)
  const items = run.waves[wave] ?? []
  const waveDone = resolved >= items.length
  const finished = wave >= run.waves.length

  useEffect(() => {
    stageSet({ vendor: finished ? undefined : items[Math.min(resolved, items.length - 1)] })
    return () => stageSet({ vendor: undefined, saucers: [null, null] })
  }, [wave, resolved, finished]) // eslint-disable-line react-hooks/exhaustive-deps

  if (finished) {
    const w = run.window
    const m = w.filter((x) => x.action === 'cool').length
    const d = w.filter((x) => x.action === 'cool' && !x.bought).length
    const dyn = dynLine(run)
    const fizzing = stageOf(run.fizz.fun) >= 3 && stageOf(run.fizz.fun) < 4
    return (
      <div className="flex flex-col gap-3">
        {dyn && <Caption text={t(dyn)} />}
        <div className="cafe-ledger-page">
          <p className="m-0">{t('window.summary', { n: w.length, g: w.filter((x) => x.bought).length, m, x: run.jars.spend })}</p>
          {m > 0 && <p className="m-0 font-bold">{t('window.summaryDrop', { d, m })}</p>}
          <p className="m-0 mt-1 text-[13px] opacity-80">{t('window.bottles', { fun: stage(run.fizz.fun), friends: stage(run.fizz.friends) })}</p>
        </div>
        {fizzing && <Caption text={t('window.fizzing')} />}
        <div className="flex justify-end"><Btn onClick={next}>{t('hud.next')} ▸</Btn></div>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      {wave === 0 && resolved === 0 && <Caption text={t('gauge.intro')} sub={t('window.hint')} />}
      {lines.length > 0 && <Caption text={lines[lines.length - 1]} />}
      {items.map((id, i) => (
        <Offer key={`${wave}-${id}`} id={id} slot={i as 0 | 1} onResolved={(l) => { setLines((x) => [...x, l]); setResolved((r) => r + 1) }} />
      ))}
      {waveDone && (
        <div className="flex justify-end">
          <Btn onClick={() => { setWave(wave + 1); setResolved(0) }}>{t('hud.next')} ▸</Btn>
        </div>
      )}
    </div>
  )
}
