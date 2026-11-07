import { useEffect, useMemo, useState } from 'react'
import { GOAL } from '../engine/content'
import { flips, settle } from '../engine/tally'
import { EXPERIMENTS, type Experiment, type MonthSummary, type Tally as TallyT } from '../engine/types'
import { balance, isPerfect, starCount, STARS } from '../engine/balance'
import { moodOf, moodStage } from '../engine/mood'
import { useCafe } from '../state/store'
import { Btn, Caption, MoodFace } from './kit'
import { useCt } from './text'

type Page = 'settle' | 'headline' | 'report' | 'reading' | 'notes' | 'cards' | 'chit' | 'close'
const PAGES: Page[] = ['settle', 'headline', 'report', 'reading', 'notes', 'cards', 'chit', 'close']

export function useTally(): TallyT {
  const run = useCafe((s) => s.run)
  const history = useCafe((s) => s.history)
  const recorded = useCafe((s) => s.recorded)
  const prev = recorded ? history[history.length - 2] : history[history.length - 1]
  return useMemo(() => settle(run, prev), [run, prev])
}

/** Round 6: where the learning lands. Every line comes from the player's own numbers; nothing judges. */
export function TallyRound({ onFinish, onExit }: { onFinish: (t: TallyT) => void; onExit: () => void }) {
  const { t, band, ledgerText } = useCt()
  const run = useCafe((s) => s.run)
  const recordMonth = useCafe((s) => s.recordMonth)
  const restart = useCafe((s) => s.restart)
  const setLedgerOpen = useCafe((s) => s.setLedgerOpen)
  const tally = useTally()
  const [page, setPage] = useState<Page>('settle')
  const [kept, setKept] = useState(false)
  useEffect(() => { recordMonth(); onFinish(tally) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const go = () => setPage(PAGES[Math.min(PAGES.length - 1, PAGES.indexOf(page) + 1)])
  const reached = tally.ending === 'reached' || tally.ending === 'reachedCost'
  const spentOnWants = tally.wants + tally.little
  const NextBtn = () => <div className="flex justify-end gap-2"><Btn kind="ghost" onClick={() => setPage('close')}>{t('hud.skip')}</Btn><Btn onClick={go}>{t('hud.next')} ▸</Btn></div>

  if (page === 'settle') {
    const line = tally.owed > 0 ? t('tally.settleOwed', { o: tally.owed }) : run.loan.borrowed ? t('tally.settleQuick', { r: run.loan.repay, e: tally.extra }) : t('tally.settleNone')
    return <div className="flex flex-col gap-3"><Caption text={`${line} ${t('tally.clock')}`} /><NextBtn /></div>
  }
  if (page === 'headline') {
    const head = tally.ending === 'reached' ? t('tally.reached') : tally.ending === 'reachedCost' ? t('tally.reachedCost', { e: tally.extra }) : tally.ending === 'almost' ? t('tally.almost', { x: tally.goalGap }) : t('tally.notyet')
    const second = reached ? (spentOnWants > 0 ? t('tally.secReachedSpent', { w: spentOnWants }) : t('tally.secReachedNone')) : spentOnWants > 0 ? t('tally.secShortSpent', { x: tally.goalGap }) : t('tally.secShortNone')
    return (
      <div className="flex flex-col gap-3">
        <div className={`cafe-stamp ${reached ? '' : 'is-notyet'} ${isPerfect(run, reached) ? 'is-perfect' : ''}`}>{isPerfect(run, reached) ? t('tally.perfect') : reached ? t('phases.survived') : t('phases.notyet')}</div>
        {isPerfect(run, reached) && <Caption text={t('tally.perfectLine')} />}
        {reached && <div className="cafe-petals" aria-hidden>{Array.from({ length: 7 }, (_, i) => <span key={i} style={{ left: `${10 + i * 12}%`, animationDelay: `${i * 0.35}s` }} />)}</div>}
        <Caption text={head} />
        <Caption text={second} />
        <NextBtn />
      </div>
    )
  }
  if (page === 'report') {
    const rows: [string, string, string][] = [
      [t('tally.saved'), `₹${tally.saved} / ₹${GOAL}`, ''],
      [t('tally.bills'), `₹${tally.billsTotal}`, t('tally.billsSplit', { from: (['spend', 'save', 'emergency', 'quick'] as const).filter((s) => tally.billsBySource[s]).map((s) => `${t(`jars.${s}`)} ₹${tally.billsBySource[s]}`).join(', ') })],
      [t('tally.wants'), `₹${tally.wants}`, t('tally.wantsSplit', { b: tally.wantsBig, s: tally.wantsSmall })],
      [t('tally.little'), `₹${tally.little}`, run.predict2 !== undefined ? t('tally.littleGuess', { range: band(run.predict2) }) : ''],
      [t('tally.cushion'), `₹${tally.cushionUsed + tally.cushionKept}`, t('tally.cushionSplit', { u: tally.cushionUsed, k: tally.cushionKept })],
      [t('tally.cost'), `₹${tally.extra + tally.lentOut}`, t('tally.costSplit', { e: tally.extra, l: tally.lentOut })],
      [t('tally.balance'), '★'.repeat(starCount(balance(run))) + '☆'.repeat(3 - starCount(balance(run))), starCount(balance(run)) === 3 ? t('tally.bAll') : t('tally.bFail', { list: STARS.filter((k) => !balance(run)[k]).map((k) => t(`gauge.${k}`)).join(', ') })],
      [t('tally.mood'), '', t(`tally.mm${moodStage(moodOf(run))}`)],
    ]
    return (
      <div className="flex flex-col gap-2">
        <div className="font-display text-[22px]">{t('tally.report')}</div>
        <div className="cafe-ledger-page">
          {rows.map(([k, v, sub]) => (
            <div key={k} className="cafe-report-row">
              <span className="font-bold">{k}</span>
              <span className="text-right">{k === t('tally.mood') ? <MoodFace stage={moodStage(moodOf(run))} size={40} /> : <span className="font-extrabold tabular-nums">{v}</span>}{sub && <span className="block text-[11.5px] opacity-70">{sub}</span>}</span>
            </div>
          ))}
          <div className="mt-1 text-[12px] opacity-80">{t('tally.gladMeh', { g: tally.glad, m: tally.mehTotal })}</div>
        </div>
        <NextBtn />
      </div>
    )
  }
  if (page === 'reading') {
    return (
      <div className="flex flex-col gap-3">
        <div className="text-[12px] font-bold uppercase tracking-wide opacity-70">{t('tally.kind')}</div>
        <div className="cafe-titlecard is-inline"><div className="font-display lang-fit text-[26px] leading-tight">{t(`arch.${tally.archetype}.name`)}</div></div>
        <Caption text={t(`arch.${tally.archetype}.line`)} />
        <NextBtn />
      </div>
    )
  }
  if (page === 'notes') {
    return (
      <div className="flex flex-col gap-2">
        <div className="font-display text-[20px]">{t('tally.notes')}</div>
        <div className="cafe-ledger-page">
          {tally.marginNotes.map((m) => (
            <div key={m.lineIndex} className="cafe-ledger-line"><span className="flex-1">{ledgerText(run.ledger[m.lineIndex])}</span><span className="cafe-hand">{t(`note.${m.note}`)}</span></div>
          ))}
        </div>
        {tally.callbacks.map((c) => <Caption key={c.key} text={t(`cb.${c.key}`, c.vars)} />)}
        <NextBtn />
      </div>
    )
  }
  if (page === 'cards') {
    return (
      <div className="flex flex-col gap-2">
        <div className="font-display text-[20px]">{t('tally.cardsTitle')}</div>
        <div className="flex max-h-[44vh] flex-col gap-2 overflow-y-auto pr-1">
          {tally.cards.slice(0, 3).map((c) => (
            <div key={c.id} className="cafe-card">
              <div className="text-[11px] font-bold uppercase tracking-[.18em] text-[#C8604A]">{t(`cards.${c.id}.name`)}</div>
              <p className="m-0 mt-1"><b>{t('tally.happened')}:</b> {t(`cards.${c.id}.${c.variant}.a`, c.vars)}</p>
              <p className="m-0 mt-1"><b>{t('tally.why')}:</b> {t(`cards.${c.id}.${c.variant}.b`, c.vars)}</p>
              <p className="m-0 mt-1"><b>{t('tally.try')}:</b> {t(`cards.${c.id}.${c.variant}.c`, c.vars)}</p>
            </div>
          ))}
        </div>
        <NextBtn />
      </div>
    )
  }
  if (page === 'chit') {
    return (
      <div className="flex flex-col gap-3">
        <div className={`cafe-chit ${kept ? 'is-kept' : ''}`}>
          <div className="text-[11px] font-bold uppercase opacity-70">{t('tally.chitTitle')}</div>
          <div className="cafe-hand text-[17px]">{t(`chit.${tally.chit}`)}</div>
        </div>
        <p className="m-0 text-[12.5px] opacity-75">{t('tally.nobody')}</p>
        <div className="flex justify-end gap-2">
          <Btn kind="cream" onClick={() => setKept(true)} disabled={kept}>{t('tally.keep')}</Btn>
          <Btn onClick={go}>{t('hud.next')} ▸</Btn>
        </div>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-3">
      <Caption text={t('tally.close')} />
      {run.lent > 0 && <p className="m-0 text-[12.5px] opacity-80">{run.month === 2 ? t('replay.tejaEpilogue2', { x: run.lent }) : t('replay.tejaEpilogue1')}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <Btn kind="cream" onClick={() => setLedgerOpen(true)}><img src="/art/cafe/book-closed.webp" alt="" className="mr-1 inline h-5 w-5 align-middle" draggable={false} />{t('tally.seeWhere')}</Btn>
        <Btn kind="cream" onClick={onExit}>{t('tally.done')}</Btn>
        <Btn onClick={() => restart()}>↻ {t('tally.playAgain')}</Btn>
      </div>
    </div>
  )
}

/** after Month 2: last month beside this month. No green, no red, never better or worse. */
export function ThenNow() {
  const { t } = useCt()
  const history = useCafe((s) => s.history)
  const next = useCafe((s) => s.next)
  const [a, b] = history.slice(-2) as [MonthSummary, MonthSummary]
  useEffect(() => { if (!a || !b) next() }, [a, b, next])
  if (!a || !b) return null
  const arrow = (x: number, y: number) => (y > x ? '↑' : y < x ? '↓' : '→')
  const rows: [string, string, string, string][] = [
    [t('replay.rSaved'), `₹${a.saved}`, `₹${b.saved}`, arrow(a.saved, b.saved)],
    [t('replay.rEmergency'), `₹${a.emergencyAtPayday}`, `₹${b.emergencyAtPayday}`, arrow(a.emergencyAtPayday, b.emergencyAtPayday)],
    [t('replay.rLittle'), `₹${a.little}`, `₹${b.little}`, arrow(a.little, b.little)],
    [t('replay.rCooled'), t('replay.rCooledVal', { d: a.coolDropped, m: a.coolCount }), t('replay.rCooledVal', { d: b.coolDropped, m: b.coolCount }), arrow(a.coolDropped, b.coolDropped)],
    [t('replay.rBorrowed'), `₹${a.borrowed}`, `₹${b.borrowed}`, arrow(a.borrowed, b.borrowed)],
    [t('replay.rLent'), `₹${a.lent}`, `₹${b.lent}`, arrow(a.lent, b.lent)],
    [t('replay.rBillsSave'), `₹${a.billsFromSave}`, `₹${b.billsFromSave}`, arrow(a.billsFromSave, b.billsFromSave)],
    [t('replay.rFizz'), t(`fizz.s${a.fizzStageAtBigNight ?? 0}`), t(`fizz.s${b.fizzStageAtBigNight ?? 0}`), ''],
  ]
  const e = b.experiment as Experiment | undefined
  const eLine: Record<Experiment, string> = {
    door: t('replay.eDoor'), shelf: t('replay.eShelf', { x: b.saved }), cool: t('replay.eCool', { d: b.coolDropped }),
    little: t('replay.eLittle', { x: b.little, y: a.little }), teja: t('replay.eTeja', { x: b.lent }), fine: t('replay.eFine'),
    yes: t('replay.eYes'), surprise: t('replay.eSurprise'),
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="font-display text-[22px]">{t('replay.thenNow')}</div>
      <div className="cafe-ledger-page">
        <div className="cafe-report-row text-[11px] font-bold uppercase opacity-70"><span /><span className="grid grid-cols-[1fr_1fr_14px] gap-2 text-right"><span>{t('replay.last')}</span><span>{t('replay.this')}</span><span /></span></div>
        {rows.map(([k, x, y, ar]) => (
          <div key={k} className="cafe-report-row">
            <span className="font-bold">{k}</span>
            <span className="grid grid-cols-[1fr_1fr_14px] gap-2 text-right tabular-nums"><span>{x}</span><span className="font-extrabold">{y}</span><span>{ar}</span></span>
          </div>
        ))}
      </div>
      {e && <Caption text={eLine[e]} />}
      <p className="m-0 text-[12.5px] opacity-80">{t('replay.flipped', { n: flips(a, b).length })}</p>
      <div className="flex justify-end"><Btn onClick={next}>{t('hud.next')} ▸</Btn></div>
    </div>
  )
}

/** pick one thing to do differently. It is the player's own hypothesis. */
export function OneChange({ onExit }: { onExit: () => void }) {
  const { t } = useCt()
  const restart = useCafe((s) => s.restart)
  const [chosen, setChosen] = useState<Experiment | null>(null)
  return (
    <div className="flex flex-col gap-2">
      <Caption text={chosen ? t('replay.react') : t('replay.ask')} />
      <div className="grid grid-cols-2 gap-1.5">
        {EXPERIMENTS.map((e) => (
          <button key={e} type="button" aria-pressed={chosen === e} className={`cafe-choice text-[13.5px] ${chosen === e ? 'is-on' : ''}`} onClick={() => setChosen(e)}>{t(`replay.${e}`)}</button>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <Btn kind="cream" onClick={onExit}>{t('tally.done')}</Btn>
        <Btn disabled={!chosen} onClick={() => chosen && restart()}>{t('replay.again')} ▸</Btn>
      </div>
    </div>
  )
}
