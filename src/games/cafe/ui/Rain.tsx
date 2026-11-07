import { useEffect, useState } from 'react'
import { GOAL, QUICK_TABLE } from '../engine/content'
import { extraBill, littleTotal, openFinePrint, paid, payExtra, payRain, rainBill } from '../engine/economy'
import { stageOf } from '../engine/pressure'
import type { Payment, Run, SceneFocus } from './rainTypes'
import { useStage } from '../state/stage'
import { useCafe } from '../state/store'
import { Btn, Caption, Icon, SourcePicker } from './kit'
import { useCt } from './text'

/**
 * Round 5, Phase 4, the finale: the calm, the freeze, the crack, and the table speaks.
 * Every beat is presentation only and Pause freezes it.
 */
const RAIN_ICON: Record<number, string> = { 1: 'phone', 2: 'tyre', 3: 'lab', 4: 'gift', 5: 'pills', 6: 'auto', 7: 'gift', 8: 'pills' }

export function RainRound() {
  const { t, stage } = useCt()
  const run = useCafe((s) => s.run)
  const paused = useCafe((s) => s.paused)
  const goNext = useCafe((s) => s.next)
  const setStage = useStage((s) => s.set)
  const [beat, setBeat] = useState<'calm' | 'freeze' | 'crack' | 'reveal' | 'table'>('calm')
  const [ti, setTi] = useState(0)
  const bill = rainBill(run)
  const id = run.surprise.id

  // the table reads out the player's own month, one object at a time
  const table: { focus: SceneFocus; text: string }[] = [
    { focus: 'emergency', text: run.jars.emergency ? t('rain.tEmergency', { x: run.jars.emergency }) : t('rain.tEmergencyZero') },
    { focus: 'spend', text: t('rain.tSpend', { x: run.jars.spend }) },
    { focus: 'save', text: t('rain.tSave', { x: run.jars.save }) },
    ...(littleTotal(run) ? [{ focus: 'plates' as SceneFocus, text: t('rain.tPlates', { x: littleTotal(run) }) }] : []),
    ...(run.lent ? [{ focus: 'teja' as SceneFocus, text: t('rain.tTeja', { x: run.lent }) }] : []),
    ...(stageOf(run.fizz.fun) >= 2 || run.bigNight?.choice === 'stay' ? [{ focus: 'bottle' as SceneFocus, text: t('rain.tBottle', { stage: stage(run.fizz.fun) }) }] : []),
  ]

  useEffect(() => {
    setStage({ beat: beat === 'reveal' ? 'crack' : beat, focus: beat === 'calm' ? 'cloud' : beat === 'table' ? table[ti]?.focus ?? null : null, plates: run.trolley.filter((x) => x.action === 'ok').length })
  }, [beat, ti]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => setStage({ beat: null, focus: null }), [setStage])

  // timed beats (the calm, the freeze, the crack), frozen while paused
  useEffect(() => {
    if (paused) return
    const dur = { calm: 2600, freeze: 1500, crack: 1400 } as const
    if (!(beat in dur)) return
    const id = window.setTimeout(() => setBeat(beat === 'calm' ? 'freeze' : beat === 'freeze' ? 'crack' : 'reveal'), dur[beat as keyof typeof dur])
    return () => window.clearTimeout(id)
  }, [beat, paused])

  if (beat === 'calm' || beat === 'freeze' || beat === 'crack') {
    return (
      <div className="flex flex-col gap-3">
        <Caption who="scene" text={t(`rain.${beat}`)} sub={beat === 'calm' ? `${t('rain.watch')} ${t('rain.watchS')}` : undefined} />
        <div className="flex justify-end"><Btn kind="ghost" onClick={() => setBeat('reveal')}>{t('hud.skip')}</Btn></div>
      </div>
    )
  }
  if (beat === 'reveal') {
    return (
      <div className="flex flex-col gap-3">
        <Caption text={`${t(`rain.first${id}`)} ${t('rain.letter')}`} />
        <div className="cafe-bill is-rain">
          <span className="cafe-bill-stamp">{t('bill.stamp')}</span>
          <Icon id={RAIN_ICON[id]} size={64} className="mx-auto" />
          <div className="text-[15px] font-bold">{t(`rain.bill${id}`)}</div>
          <div className="font-display text-[30px] leading-none">₹{bill}</div>
          {id === 1 && run.hasCover && <div className="text-[12px] font-bold">{t('rain.cover')}</div>}
        </div>
        <div className="flex justify-end"><Btn onClick={() => { setBeat('table'); useCafe.getState().apply((r) => ({ ...r, tableSpoke: true })) }}>{t('rain.tableIntro')} ▸</Btn></div>
      </div>
    )
  }
  const last = ti >= table.length - 1
  return (
    <div className="flex flex-col gap-3">
      <Caption text={table[ti].text} />
      <div className="flex justify-end gap-2">
        <Btn kind="ghost" onClick={goNext}>{t('hud.skip')}</Btn>
        <Btn onClick={() => (last ? goNext() : setTi(ti + 1))}>{last ? t('rain.payLine').split('.')[0] : t('hud.next')} ▸</Btn>
      </div>
    </div>
  )
}

/** the pay panel: four sources around the bill, Quick Cash with its fine print */
export function Pay({ second = false }: { second?: boolean }) {
  const { t } = useCt()
  const run = useCafe((s) => s.run)
  const apply = useCafe((s) => s.apply)
  const next = useCafe((s) => s.next)
  const [qc, setQc] = useState<'closed' | 'ask' | 'flip'>('closed')
  const [guess, setGuess] = useState<number | null>(run.predict3 ?? null)
  const [pending, setPending] = useState<Payment | null>(null)
  const [outcome, setOutcome] = useState<string | null>(null)
  const bill = second ? extraBill(run) : rainBill(run)
  const sid = second ? run.extra?.id ?? 6 : run.surprise.id
  const [seen, setSeen] = useState(!second)

  const finish = (p: Payment) => {
    const before = run
    apply((r) => (second ? payExtra(r, p) : payRain(r, p)))
    setOutcome(outcomeLine(before, p, bill, t))
  }

  if (!seen) {
    return (
      <div className="flex flex-col gap-3">
        <Caption text={`${t('rain.again')} ${t(`rain.first${sid}`)}`} />
        <div className="cafe-bill is-rain">
          <span className="cafe-bill-stamp">{t('bill.stamp')}</span>
          <Icon id={RAIN_ICON[sid]} size={64} className="mx-auto" />
          <div className="text-[15px] font-bold">{t(`rain.bill${sid}`)}</div>
          <div className="font-display text-[30px] leading-none">₹{bill}</div>
        </div>
        <div className="flex justify-end"><Btn onClick={() => setSeen(true)}>{t('hud.next')} ▸</Btn></div>
      </div>
    )
  }
  if (outcome) {
    return (
      <div className="flex flex-col gap-3">
        <Caption text={outcome} />
        <div className="flex justify-end"><Btn onClick={next}>{t('hud.next')} ▸</Btn></div>
      </div>
    )
  }
  if (qc !== 'closed') {
    return (
      <div className="cafe-phone">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase opacity-90"><img src="/art/cafe/bolt.webp" alt="" width="34" height="34" draggable={false} />{t('jars.quick')} · {t('hud.fictional')}</div>
        <p className="m-0 font-bold">{t('rain.qcPitch', { x: bill })}</p>
        <Caption text={`${t('rain.qcEyebrow')} ${qc === 'ask' ? t('rain.qcAsk') : ''}`} />
        {qc === 'ask' && (
          <div className="grid grid-cols-4 gap-1.5">
            {[150, 175, 200, 250].map((g) => (
              <button key={g} type="button" className={`cafe-choice ${guess === g ? 'is-on' : ''}`} onClick={() => { setGuess(g); apply((r) => ({ ...r, predict3: g as Run['predict3'] })) }}>₹{g}</button>
            ))}
          </div>
        )}
        {qc === 'ask' && <Btn disabled={guess === null} onClick={() => { apply(openFinePrint); setQc('flip') }}>↻ {t('rain.fine')}</Btn>}
        {qc === 'flip' && (
          <div className="cafe-fine">
            <div className="font-bold">{t('rain.flipTitle')}</div>
            {Object.entries(QUICK_TABLE).map(([b, r]) => <div key={b}>{t('rain.flipRow', { b, r, e: r - Number(b) })}</div>)}
            <div className="mt-1 text-[12px]">{t('rain.flipNote1')} {t('rain.flipNote2')}</div>
            {guess !== null && <Caption text={guess < 200 ? t('rain.gLow', { g: guess, r: 200, d: 200 - guess }) : guess === 200 ? t('rain.gEq') : t('rain.gHigh', { g: guess, r: 200 })} />}
          </div>
        )}
        <div className="flex justify-end gap-2">
          {pending && qc === 'flip' && <Btn onClick={() => { finish(pending); setPending(null) }}>{t('rain.borrow', { x: paid(pending, 'quick') })}</Btn>}
          <Btn kind="cream" onClick={() => setQc('closed')}>◂ {t('hud.back')}</Btn>
        </div>
      </div>
    )
  }
  if (pending) {
    return (
      <div className="flex flex-col gap-3">
        <Caption text={t('rain.noFlip')} />
        <div className="flex justify-end gap-2">
          <Btn kind="cream" onClick={() => { finish(pending); setPending(null) }}>{t('rain.borrowAnyway')}</Btn>
          <Btn onClick={() => setQc('ask')}>↻ {t('rain.fine')}</Btn>
        </div>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      <Caption text={t('rain.payLine')} />
      <SourcePicker
        run={run}
        amount={bill}
        quick
        title={`${t(`rain.bill${sid}`)} · ₹${bill}`}
        notes={
          <>
            {run.lent > 0 && <div className="cafe-note-card">{t('rain.tejaCard', { x: run.lent })}</div>}
            <button type="button" className="cafe-note-card text-left" onClick={() => setQc(run.fineOpened ? 'flip' : 'ask')}><img src="/art/cafe/bolt.webp" alt="" className="mr-1 inline h-5 w-5 align-middle" draggable={false} />{t('jars.quick')}: {t('rain.qcPitch', { x: bill })}</button>
          </>
        }
        beforePay={(p) => {
          if (paid(p, 'quick') && !run.fineOpened) { setPending(p); return false }
          return true
        }}
        onPay={finish}
      />
      <p className="m-0 text-[11px] opacity-70">{t('hud.fictional')} {t('hud.illustrative')}</p>
    </div>
  )
}

function outcomeLine(run: Run, p: Payment, bill: number, t: (k: string, v?: Record<string, unknown>) => string): string {
  const e = paid(p, 'emergency'), s = paid(p, 'save'), q = paid(p, 'quick')
  if (q) {
    const borrowed = run.loan.borrowed + q
    const repay = QUICK_TABLE[borrowed] ?? Math.ceil((borrowed * 1.34) / 5) * 5
    return t('rain.oQuick', { r: repay, e: repay - borrowed })
  }
  if (e >= bill) return run.jars.emergency > bill ? t('rain.oMore') : t('rain.oEmergency')
  if (s > 0) return t('rain.oSave')
  if (s === 0) return t('rain.oBetween')
  return t('rain.oSave', { goal: GOAL })
}
