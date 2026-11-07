import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { LangSwitch } from '../../../components/Hud'
import { GOAL, quickRepay } from '../engine/content'
import { paid, paymentError, paymentTotal, startingPayment } from '../engine/economy'
import { cloudStage, dayOf, phaseOf, type Step } from '../engine/flow'
import type { Payment, Run, Source } from '../engine/types'
import { useGame } from '../../../store/game'
import { balance, starCount } from '../engine/balance'
import { moodOf, moodStage } from '../engine/mood'
import { stageOf } from '../engine/pressure'
import { useStage } from '../state/stage'
import { useCafe } from '../state/store'
import { GOAL_ART, playerFace, seatSprite, type Mood } from './Scene'
import { useCt } from './text'

/* ------------------------------------------------------------------ buttons */

export function Btn({ children, onClick, kind = 'main', disabled, label, className = '' }: { children: ReactNode; onClick?: () => void; kind?: 'main' | 'cream' | 'ghost'; disabled?: boolean; label?: string; className?: string }) {
  return (
    <button type="button" aria-label={label} disabled={disabled} onClick={onClick} className={`ink-btn ${kind === 'cream' ? 'cream' : ''} ${kind === 'ghost' ? 'cafe-ghost' : ''} ${className}`}>
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------ Chacha's caption bar */

/** a painted item icon from the sticker sheet */
export function Icon({ id, size = 44, className = '' }: { id: string; size?: number; className?: string }) {
  return <img className={`cafe-icon ${className}`} src={`/art/cafe/icon-${id}.webp`} alt="" width={size} height={size} draggable={false} />
}

const MOOD_POSE: Mood[] = ['worry', 'think', 'neutral', 'talk', 'happy']
const MOOD_FACE = ['shock', 'glance', 'neutral', 'pleased', 'laugh']
/** the mood face, drawn straight onto the page: the painted expressions for the girl, her seated pose's head for the boy */
export function MoodFace({ stage, size = 30 }: { stage: number; size?: number }) {
  const gender = useGame((s) => s.gender)
  const persona = useGame((s) => s.persona)
  if (gender === 'girl') return <img key={stage} className="cafe-moodpng" src={`/art/faces/${MOOD_FACE[stage]}.png`} alt="" style={{ height: size }} draggable={false} />
  return (
    <span className="cafe-moodface" style={{ width: size, height: size }} aria-hidden>
      <img key={stage} src={seatSprite({ gender, persona }, MOOD_POSE[stage])} alt="" draggable={false} />
    </span>
  )
}

export type Who = 'chacha' | 'teja' | 'yusuf' | 'scene' | 'note' | 'vendor' | 'phone' | 'friends' | 'you'
const FACE: Partial<Record<Who, string>> = { chacha: 'face-chacha', teja: 'face-teja', yusuf: 'face-yusuf', vendor: 'face-seller', phone: 'face-hoodie', friends: 'face-hoodie' }
const NAME: Partial<Record<Who, string>> = { chacha: 'Chacha', teja: 'Teja', yusuf: 'Yusuf', phone: '📱', friends: '📱' }

/** the dialogue box: a face, a name, a line. Reads like a chat, sits on the picture. */
export function Caption({ who = 'chacha', text, sub }: { who?: Who; text: string; sub?: string }) {
  const { t } = useCt()
  const gender = useGame((s) => s.gender)
  const persona = useGame((s) => s.persona)
  const face = who === 'you' ? playerFace({ gender, persona }) : FACE[who] ? `/art/cafe/${FACE[who]}.webp` : null
  const name = who === 'you' ? t('hud.you') : NAME[who]
  return (
    <div className={`cafe-say is-${who}`} role="status" aria-live="polite">
      {face && who !== 'scene' && who !== 'note' && <img className="cafe-say-face" src={face} alt="" draggable={false} />}
      <div className="cafe-say-body">
        {name && <span className="cafe-say-name">{name}</span>}
        <p className="cafe-say-text">{text}</p>
        {sub && <span className="mt-1 block text-[12px] opacity-70">{sub}</span>}
      </div>
      <span className="sr-only">{t('hud.tapToContinue')}</span>
    </div>
  )
}

/** a short scripted exchange: one line at a time, tap Next. Calls onDone after the last line. */
export interface Line { who?: Who; text: string }
export function Script({ lines, onDone, doneLabel }: { lines: Line[]; onDone: () => void; doneLabel?: string }) {
  const { t } = useCt()
  const [i, setI] = useState(0)
  const l = lines[Math.min(i, lines.length - 1)]
  const last = i >= lines.length - 1
  return (
    <div className="flex flex-col gap-3">
      <Caption who={l.who} text={l.text} />
      <div className="flex justify-end gap-2">
        {!last && <Btn kind="ghost" onClick={() => onDone()}>{t('hud.skip')}</Btn>}
        <Btn onClick={() => (last ? onDone() : setI(i + 1))} label={t('hud.next')}>{last ? (doneLabel ?? t('hud.next')) : t('hud.next')} ▸</Btn>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ the source rule: where should this money come from? */

export interface SourcePickerProps {
  run: Run
  amount: number
  /** Quick Cash is offered for bills and the rain, never for wants */
  quick?: boolean
  onPay: (p: Payment) => void
  onCancel?: () => void
  /** shown above the picker */
  title?: string
  payLabel?: string
  /** lets the rain screen interrupt a Quick Cash payment for the fine print */
  beforePay?: (p: Payment) => boolean
  /** extra cards, e.g. "₹100 is with Teja. Not available." */
  notes?: ReactNode
}

export function SourcePicker({ run, amount, quick = false, onPay, onCancel, title, payLabel, beforePay, notes }: SourcePickerProps) {
  const { t, money } = useCt()
  const [p, setP] = useState<Payment>(() => startingPayment(run, amount))
  useEffect(() => setP(startingPayment(run, amount)), [amount, run.jars.spend]) // eslint-disable-line react-hooks/exhaustive-deps
  const err = paymentError(run, amount, p, { quick })
  const covered = Math.min(amount, paymentTotal(p))
  const sources: Source[] = quick ? ['spend', 'save', 'emergency', 'quick'] : ['spend', 'save', 'emergency']
  const bump = (s: Source, d: number) => {
    const step = s === 'quick' ? 50 : 10
    const cur = paid(p, s)
    const nextV = Math.max(0, cur + d * step)
    if (s !== 'quick' && nextV > run.jars[s]) return
    if (d > 0 && s !== 'quick' && paymentTotal(p) >= amount) return
    if (d > 0 && s === 'quick' && (paymentTotal(p) >= amount || run.loan.borrowed + nextV > 150)) return
    setP({ ...p, [s]: nextV })
  }
  const consequence = (s: Source) => {
    const v = paid(p, s)
    if (s === 'spend') return t('src.spend')
    if (s === 'save') return t('src.save', { a: run.jars.save, b: run.jars.save - v })
    if (s === 'emergency') return t('src.emergency')
    const q = v || 50
    return t('src.quick', { x: q, y: quickRepay(run.loan.borrowed + q) - run.loan.repay })
  }
  return (
    <div className="flex flex-col gap-2" role="group" aria-label={title ?? t('src.question', { x: amount })}>
      <div className="font-display lang-fit text-[19px] leading-tight">{title ?? t('src.question', { x: amount })}</div>
      {notes}
      {sources.map((s) => {
        const v = paid(p, s)
        const avail = s === 'quick' ? 150 - run.loan.borrowed : run.jars[s]
        return (
          <div key={s} className={`cafe-src ${v ? 'is-on' : ''} ${s === 'save' && v ? 'is-save' : ''}`}>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="font-bold">{t(`jars.${s}`)}</span>
                <span className="text-[12px] opacity-70">{s === 'quick' ? t('hud.fictional').split('.')[0] : t('src.have', { x: avail })}</span>
              </div>
              <div className="text-[12.5px] leading-snug opacity-85">{consequence(s)}</div>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" className="cafe-step" aria-label={`− ${t(`jars.${s}`)}`} onClick={() => bump(s, -1)} disabled={!v}>−</button>
              <span className="w-12 text-center font-bold tabular-nums">{money(v)}</span>
              <button type="button" className="cafe-step" aria-label={`+ ${t(`jars.${s}`)}`} onClick={() => bump(s, 1)} disabled={s !== 'quick' && v >= avail}>+</button>
            </div>
          </div>
        )
      })}
      {!quick && <div className="text-[11.5px] opacity-70">{t('jars.quick')}: {t('src.quickNo')}</div>}
      <div className="cafe-payrow">
      <div className="cafe-meter" aria-hidden><span style={{ width: `${(covered / amount) * 100}%` }} /></div>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span className="text-[13px] font-bold">{t('src.covered', { a: covered, b: amount })}</span>
        <div className="flex gap-2">
          {onCancel && <Btn kind="cream" onClick={onCancel}>{t('hud.cancel')}</Btn>}
          <Btn disabled={!!err} onClick={() => { if (beforePay && !beforePay(p)) return; onPay(p) }}>{payLabel ?? t('src.pay', { x: amount })}</Btn>
        </div>
      </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ HUD: goal card, Month bar, ledger, pause */

/** the pressure and mood gauges: two ramune bottles (five painted stages each, never a number) and a mood bar */
function Gauges({ run }: { run: Run }) {
  const { t, stage } = useCt()
  const [open, setOpen] = useState(false)
  const focus = useStage((s) => s.focus)
  const m = moodOf(run)
  const ms = moodStage(m)
  const bal = balance(run)
  const risk = stageOf(run.fizz.fun) >= 3 || stageOf(run.fizz.friends) >= 3
  const bottle = (kind: 'fun' | 'friends', label: string) => {
    const v = run.fizz[kind]
    const s = stageOf(v)
    return (
      <div className={`cafe-gauge ${focus === 'bottle' ? 'is-hot' : ''} ${s >= 3 ? 'is-alert' : ''}`} key={kind}>
        <img src={`/art/cafe/bottle-${kind}-${s}.webp`} alt="" className={`cafe-gauge-bottle ${s >= 3 ? 'is-fizzing' : ''}`} style={{ transform: `scale(${[1, 1.05, 1.18, 1.4, 1.4][s]})` }} draggable={false} />
        <div className="min-w-0 flex-1">
          <div className="cafe-gauge-label"><span className={`cafe-star ${bal[kind === 'fun' ? 'wants' : 'friends'] ? 'on' : ''}`} aria-hidden>★</span>{label}<span>{s === 3 ? t('gauge.alert') : stage(v)}</span></div>
          <div className="cafe-gauge-bar" role="img" aria-label={`${label}: ${stage(v)}`}>
            {[0, 1, 2, 3, 4].map((i) => <i key={i} className={i <= s && (s > 0 || i === 0) ? `on s${s}` : ''} />)}
          </div>
        </div>
      </div>
    )
  }
  return (
    <>
      <div className="cafe-gauges">
        {bottle('fun', t('gauge.wants'))}
        {bottle('friends', t('gauge.friends'))}
        <div className="cafe-gauge">
          <MoodFace stage={ms} size={32} />
          <div className="min-w-0 flex-1">
            <div className="cafe-gauge-label"><span className={`cafe-star ${bal.mood ? 'on' : ''}`} aria-hidden>★</span>{t('gauge.mood')}<span>{t(`gauge.m${ms}`)}</span></div>
            <div className="cafe-gauge-bar is-mood" role="img" aria-label={`${t('gauge.mood')}: ${t(`gauge.m${ms}`)}`}><b style={{ width: `${Math.max(6, m)}%` }} /></div>
          </div>
        </div>
        <button type="button" className="cafe-gauge-help" aria-label={t('gauge.help')} onClick={() => setOpen(true)}>?</button>
      </div>
      <div className={`cafe-stake ${risk ? 'is-risk' : ''}`} role="status">
        <b aria-hidden>{'★'.repeat(starCount(bal))}<em>{'★'.repeat(3 - starCount(bal))}</em></b>
        <span>{risk ? t('gauge.risk') : t('gauge.stake')}</span>
      </div>
      {open && (
        <div className="cafe-sheet" role="dialog" aria-label={t('gauge.title')} onClick={() => setOpen(false)}>
          <div className="paper w-[min(92vw,440px)] p-4" onClick={(e) => e.stopPropagation()}>
            <div className="font-display text-[22px]">{t('gauge.title')}</div>
            <div className="my-2 flex items-center justify-center gap-2">
              {[0, 1, 2, 3, 4].map((i) => <img key={i} src={`/art/cafe/bottle-fun-${i}.webp`} alt="" className="h-14 w-auto" draggable={false} />)}
            </div>
            <p className="my-1.5 text-[14.5px] leading-snug">{t('gauge.why1')}</p>
            <p className="my-1.5 text-[14.5px] leading-snug">{t('gauge.why2')}</p>
            <p className="my-1.5 text-[14.5px] leading-snug">{t('gauge.why3')}</p>
            <p className="my-1.5 text-[14.5px] leading-snug">{t('gauge.why4')}</p>
            <p className="my-1.5 text-[14.5px] font-bold leading-snug">{t('gauge.why5')}</p>
            <div className="mt-2 flex justify-end"><Btn onClick={() => setOpen(false)}>{t('gauge.close')}</Btn></div>
          </div>
        </div>
      )}
    </>
  )
}

export function Hud({ step, run }: { step: Step; run: Run }) {
  const { t } = useCt()
  const setLedgerOpen = useCafe((s) => s.setLedgerOpen)
  const setPaused = useCafe((s) => s.setPaused)
  const focus = useStage((s) => s.focus)
  const day = dayOf(step)
  const phase = phaseOf(step)
  const pct = Math.min(1, run.jars.save / GOAL)
  const cloudS = cloudStage(step)
  const cloudNear = cloudS >= 3
  const showGauges = ['window', 'bill:data', 'trolley', 'predict2', 'plates', 'worth', 'bignight', 'teja', 'bill:lunch', 'rain', 'pay', 'pay2', 'tally'].includes(step)
  const chip = (k: 'spend' | 'save' | 'emergency', icon: string) => (
    <span className={`cafe-jarchip ${focus === k ? 'is-hot' : focus ? 'is-dim' : ''}`}>
      <img src={`/art/cafe/${icon}.webp`} alt="" className="h-5 w-5 object-contain" draggable={false} /><small>{t(`jars.${k}`)}</small>₹{run.jars[k]}
    </span>
  )
  return (
    <div className="cafe-hud">
      <div className="cafe-hud-row">
        <div className="ink-chip flex min-w-0 items-center gap-2 py-1 pl-2 pr-3" aria-label={`${t('hud.goal')}: ${t(`goals.${run.goal}`)} ${t('hud.of', { a: run.jars.save, b: GOAL })}`}>
          <img src={GOAL_ART[run.goal]} alt="" className="h-7 w-7 object-contain" draggable={false} />
          <div className="min-w-0">
            <div className="truncate text-[11px] font-bold uppercase tracking-wide opacity-70">{t(`goals.${run.goal}`)}</div>
            <div className="text-[13px] font-bold tabular-nums">{t('hud.of', { a: run.jars.save, b: GOAL })}</div>
            <div className="mt-0.5 h-[3px] w-24 overflow-hidden rounded bg-[#E3D6B6]"><div className="h-full bg-[#C97B4A]" style={{ width: `${pct * 100}%`, transition: 'width .5s ease' }} /></div>
          </div>
        </div>
        <div className="cafe-month" aria-label={`${t('hud.day', { d: day })} · ${phase ? t('hud.phase', { n: phase }) : t('hud.loadout')}`}>
          <div className="flex justify-between text-[10.5px] font-bold uppercase tracking-wide">
            <span>{phase ? t(`phases.p${phase}`) : t('hud.loadout')}</span>
            <span>{t('hud.day', { d: day })}</span>
          </div>
          <div className="cafe-month-bar">
            {[3, 9, 14, 23].map((d, i) => <span key={d} className="cafe-month-mark" style={{ left: `${(d / 30) * 100}%` }} title={t(`phases.p${i + 1}`)} />)}
            <span className="cafe-month-fill" style={{ width: `${(day / 30) * 100}%` }} />
          </div>
        </div>
        <button type="button" className="ink-chip grid h-10 w-10 place-items-center" aria-label={t('hud.ledger')} onClick={() => { setLedgerOpen(true); useCafe.getState().apply((r) => ({ ...r, ledgerOpened: r.ledgerOpened + 1 })) }}><img src="/art/cafe/book-closed.webp" alt="" className="h-7 w-7 object-contain" draggable={false} /></button>
        <button type="button" className="ink-chip grid h-10 w-10 place-items-center" aria-label={t('hud.pause')} onClick={() => setPaused(true)}>⏸</button>
      </div>
      {step !== 'payday' && (
        <div className="cafe-jars">
          {chip('spend', 'tumbler')}{chip('save', 'gullak')}{chip('emergency', 'umbrella-closed')}
          <span className={`cafe-jarchip cafe-cloudchip ${cloudNear ? 'is-hot' : ''} ${focus === 'cloud' ? 'is-hot' : ''}`}>
            <img src={`/art/cafe/cloud-${cloudS}.webp`} alt="" className="h-6 w-auto object-contain" draggable={false} /><small>{t('gauge.cloud')}</small>
          </span>
        </div>
      )}
      {showGauges && <Gauges run={run} />}
    </div>
  )
}

/** a title card at the start of each phase: wipe in, hold, wipe out */
export function PhaseCard({ step, month }: { step: Step; month: number }) {
  const { t } = useCt()
  const phase = phaseOf(step)
  const key = `${month}-${phase}-${step === 'payday' ? 'p' : ''}`
  const [shown, setShown] = useState<string | null>(null)
  const isStart = step === 'payday' || step === 'bill:auto' || step === 'bill:data' || step === 'bignight' || (step === 'teja' && !useCafe.getState().run.bigNight) || step === 'rain'
  useEffect(() => {
    if (!isStart) return
    setShown(key)
    const id = window.setTimeout(() => setShown(null), 1500)
    return () => window.clearTimeout(id)
  }, [key, isStart])
  if (!shown) return null
  const title = step === 'payday' ? t('phases.payday') : t('phases.card', { r: phase + 1, n: phase })
  return (
    <div className="cafe-card-overlay" onClick={() => setShown(null)} role="presentation">
      <div className="cafe-titlecard">
        <div className="text-[11px] font-bold uppercase tracking-[.25em] text-[#C8604A]">{title}</div>
        <div className="font-display lang-fit mt-1 text-[30px] leading-none">{step === 'payday' ? t('phases.boss') : t(`phases.p${phase}`)}</div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ the ledger and the pause screen */

export function Ledger() {
  const { t, ledgerText } = useCt()
  const open = useCafe((s) => s.ledgerOpen)
  const run = useCafe((s) => s.run)
  const close = useCafe((s) => s.setLedgerOpen)
  if (!open) return null
  return (
    <div className="cafe-sheet" role="dialog" aria-label={t('hud.ledger')} onClick={() => close(false)}>
      <div className="cafe-ledger" onClick={(e) => e.stopPropagation()}>
        <div className="mb-2 flex items-center justify-between">
          <div className="font-display text-[22px]">{t('hud.ledger')}</div>
          <Btn kind="cream" onClick={() => close(false)}>✕</Btn>
        </div>
        {run.ledger.length === 0 && <p className="opacity-70">{t('hud.ledgerEmpty')}</p>}
        <ol className="m-0 list-none p-0">
          {run.ledger.map((l, i) => (
            <li key={i} className="cafe-ledger-line">
              <span className="text-[11px] font-bold opacity-60">{t('ledger.day', { d: l.day })}</span>
              <span className="flex-1">{ledgerText(l)}</span>
              {l.note && <span className="cafe-hand">{t(`note.${l.note}`)}</span>}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

export function PauseOverlay({ onExit }: { onExit: () => void }) {
  const { t } = useCt()
  const paused = useCafe((s) => s.paused)
  const slow = useCafe((s) => s.slow)
  const setPaused = useCafe((s) => s.setPaused)
  const setSlow = useCafe((s) => s.setSlow)
  const restart = useCafe((s) => s.restart)
  if (!paused) return null
  return (
    <div className="cafe-sheet" role="dialog" aria-label={t('hud.pauseTitle')}>
      <div className="paper w-[min(92vw,360px)] p-4 text-center">
        <div className="font-display text-[24px]">{t('hud.pauseTitle')}</div>
        <div className="my-3 flex justify-center"><LangSwitch /></div>
        <label className="mb-3 flex items-center justify-center gap-2 text-[14px] font-bold">
          <input type="checkbox" checked={slow} onChange={(e) => setSlow(e.target.checked)} /> {t('hud.slow')}
        </label>
        <div className="flex flex-col gap-2">
          <Btn onClick={() => setPaused(false)}>{t('hud.resume')} ▸</Btn>
          <Btn kind="cream" onClick={() => restart()}>↻ {t('tally.playAgain')}</Btn>
          <Btn kind="cream" onClick={onExit}>{t('hud.quit')}</Btn>
        </div>
      </div>
    </div>
  )
}

/** a ticking 0..1 value that freezes while paused (the saucer's steam) */
export function useSteam(running: boolean, seconds = 10, onDone?: () => void) {
  const paused = useCafe((s) => s.paused)
  const [left, setLeft] = useState(1)
  useEffect(() => { if (running) setLeft(1) }, [running])
  useEffect(() => {
    if (!running || paused || left <= 0) return
    const id = window.setInterval(() => setLeft((l) => Math.max(0, l - 0.1 / seconds)), 100)
    return () => window.clearInterval(id)
  }, [running, paused, left, seconds])
  useEffect(() => { if (running && left <= 0) onDone?.() }, [running, left]) // eslint-disable-line react-hooks/exhaustive-deps
  return left
}

export const useStableShuffle = <T,>(xs: T[]) => useMemo(() => xs, [xs.join('|')]) // eslint-disable-line react-hooks/exhaustive-deps
