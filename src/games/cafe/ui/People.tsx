import { useEffect, useState } from 'react'
import { bigNightPrice, chooseBigNight, chooseTeja, openBigNight, tejaAvailable } from '../engine/economy'
import type { BigNightChoice, TejaChoice } from '../engine/types'
import { useCafe } from '../state/store'
import { Btn, Caption, Icon, Script, SourcePicker } from './kit'
import { useCt } from './text'


/**
 * Big Night: the player's own refusals coming back. The things they passed on appear as ghosts and Chacha
 * reads them back by name. Go, join for half, or stay in (free, and the bottle carries into next month).
 */
export function BigNight() {
  const { t, item } = useCt()
  const run = useCafe((s) => s.run)
  const apply = useCafe((s) => s.apply)
  const next = useCafe((s) => s.next)
  const [choice, setChoice] = useState<BigNightChoice | null>(null)
  const [done, setDone] = useState(false)
  useEffect(() => { if (!useCafe.getState().run.bigNight) apply(openBigNight) }, [apply])
  const bn = run.bigNight
  if (!bn) return null
  const refused = run.refused.slice(0, 3)
  const names = refused.slice(0, 2).map(item)
  const friendsFirst = bn.bottles[0] === 'friends'
  const cost = bn.cost
  if (done && choice) {
    return (
      <div className="flex flex-col gap-3">
        <Caption text={t(`bn.r${choice === 'go' ? 'Go' : choice === 'half' ? 'Half' : 'Stay'}`)} />
        <div className="flex justify-end"><Btn onClick={next}>{t('hud.next')} ▸</Btn></div>
      </div>
    )
  }
  if (choice && choice !== 'stay') {
    return (
      <SourcePicker run={run} amount={bigNightPrice(run, choice)} onPay={(p) => { apply((r) => chooseBigNight(r, choice, p)); setDone(true) }} onCancel={() => setChoice(null)} />
    )
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="cafe-ghosts" aria-label={names.join(', ')}>
        {refused.map((r) => <span key={r} className="cafe-ghost-icon" title={item(r)}><Icon id={r} size={34} /></span>)}
        <span className="cafe-marble" aria-hidden />
      </div>
      <img className="cafe-selfie" src="/art/cafe/bignight.webp" alt="" draggable={false} />
      {run.carried.fun || run.carried.friends ? <Caption text={t('bn.carried')} /> : null}
      <Caption text={names.length >= 2 ? t('bn.refused2', { a: names[0], b: names[1] }) : t('bn.refused1', { a: names[0] ?? '' })} />
      <Caption who="friends" text={t(friendsFirst ? 'bn.inviteFriends' : 'bn.inviteFun', { x: cost })} />
      <p className="m-0 text-[13px] opacity-80">{t('bn.chacha')} {t('bn.hint')}</p>
      <div className="flex flex-col gap-1.5">
        {(['go', 'half', 'stay'] as BigNightChoice[]).map((c) => (
          <button key={c} type="button" className="cafe-choice text-left" onClick={() => { setChoice(c); if (c === 'stay') { apply((r) => chooseBigNight(r, 'stay')); setDone(true) } }}>
            <span className="block font-bold">{t(`bn.${c}`, { x: c === 'half' ? cost / 2 : cost })}</span>
            <span className="block text-[12px] opacity-75">{t(`bn.${c}Sub`)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/** Teja asks for ₹100. Lending only ever comes out of Spend. */
export function Teja() {
  const { t } = useCt()
  const run = useCafe((s) => s.run)
  const apply = useCafe((s) => s.apply)
  const next = useCafe((s) => s.next)
  const [heard, setHeard] = useState(false)
  const [picked, setPicked] = useState<TejaChoice | null>(null)
  const avail = tejaAvailable(run)
  if (!heard) {
    return (
      <Script
        lines={[
          { who: 'teja', text: t(run.tejaReason === 'kit' ? 'teja.l1kit' : 'teja.l1') },
          { who: 'teja', text: t('teja.l2') },
          { text: t('teja.aside') },
          { text: t('teja.rule') },
        ]}
        onDone={() => setHeard(true)}
      />
    )
  }
  if (picked) {
    return (
      <Script
        lines={[
          { who: 'scene', text: `“${t(`teja.you_${picked}`)}”` },
          { who: 'teja', text: t(`teja.t_${picked}`) },
          { text: t(`teja.c_${picked}`) },
          { text: t('teja.thunder') },
        ]}
        onDone={next}
      />
    )
  }
  return (
    <div className="flex flex-col gap-2">
      <Caption text={avail.length === 1 ? t('teja.honest') : t('teja.hint')} />
      {(['lend100', 'lend50', 'gift30', 'no'] as TejaChoice[]).map((c) => {
        const ok = avail.includes(c)
        return (
          <button key={c} type="button" disabled={!ok} className="cafe-choice text-left" onClick={() => { apply((r) => chooseTeja(r, c)); setPicked(c) }}>
            <span className="block font-bold">{t(`teja.${c}`)}</span>
            <span className="block text-[12px] opacity-75">{ok ? t(`teja.sub_${c}`) : t('teja.notEnough')}</span>
          </button>
        )
      })}
    </div>
  )
}
