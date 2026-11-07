import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { inr, type Lang, type PillarId } from '../../content/data'
import type { ResultView } from '../../host/resultView'
import { useCountTo } from '../kit/hooks'
import { HappyIcon, MoneyIcon, Stars } from '../kit/Icons'
import { starsFor } from '../../progress/points'
import { useGame } from '../../store/game'
import { irisClose } from '../iris'
import '../kit/minar.css'
import './result.css'
import { BalanceCard } from './BalanceCard'
import { TiredNote } from './TiredNote'

/** counts from `before` to `after` once the screen is up, after a short beat so the eye is on it */
function Tween({ before, after, delay = 700, render }: { before: number; after: number; delay?: number; render: (n: number) => string }) {
  const [go, setGo] = useState(false)
  useEffect(() => { const id = window.setTimeout(() => setGo(true), delay); return () => window.clearTimeout(id) }, [delay])
  const v = useCountTo(go ? after : before, 1100)
  return <>{render(v)}</>
}

/** true a moment after mount, so bars and rings animate from empty */
function useShown(delay = 250) {
  const [on, setOn] = useState(false)
  useEffect(() => { const id = window.setTimeout(() => setOn(true), delay); return () => window.clearTimeout(id) }, [delay])
  return on
}

const sign = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '')
const clamp01 = (n: number) => Math.max(0, Math.min(1, n))
const levelColor = (p: number) => (p >= 70 ? '#3F8F57' : p >= 40 ? '#E0A23A' : '#D9573F')

/** the play's score as a ring that fills, with the stars underneath */
function ScoreRing({ percent, stars }: { percent: number; stars: number }) {
  const on = useShown(350)
  const R = 46
  const C = 2 * Math.PI * R
  return (
    <div className="rs-ring" data-testid="result-ring">
      <svg viewBox="0 0 120 120" width="132" height="132" role="img" aria-label={`${percent}%`}>
        <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(58,42,36,.12)" strokeWidth="12" />
        <circle cx="60" cy="60" r={R} fill="none" stroke={levelColor(percent)} strokeWidth="12" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={on ? C * (1 - percent / 100) : C} transform="rotate(-90 60 60)" style={{ transition: 'stroke-dashoffset 1.3s cubic-bezier(.2,.8,.2,1)' }} />
      </svg>
      <div className="rs-ring-in">
        <b data-testid="result-quality">{percent}%</b>
        <Stars n={stars} size={16} />
      </div>
    </div>
  )
}

/** a before → after bar: a faint mark where it was, a filled bar to where it is now */
function Shift({ before, after, max, color }: { before: number; after: number; max: number; color: string }) {
  const on = useShown(900)
  const b = clamp01(before / Math.max(1, max))
  const a = clamp01(after / Math.max(1, max))
  return (
    <div className="rs-shift" aria-hidden>
      <i style={{ width: `${(on ? a : b) * 100}%`, background: color }} />
      <em style={{ left: `${b * 100}%` }} />
    </div>
  )
}

/**
 * What one play did, as a visual summary: the lamp lights, the score fills, money and happiness move from where they were to where
 * they are, the skills practised fill as bars, and the next game is one big button (the iris closes onto it). Every number arrives
 * pre-computed in `view` (src/host/resultView.ts).
 */
export function ResultScreen({ view, lang, nextPillar, onContinue, onReplay, onBack }: { view: ResultView; lang: Lang; nextPillar: PillarId | null; onContinue: () => void; onReplay: () => void; onBack: () => void }) {
  const { t } = useTranslation()
  const goal = useGame((s) => s.goalAmount)
  const lamp = view.state.status === 'complete' && view.state.brightness ? view.state.brightness : null
  const stateKey = lamp ?? (view.state.partialPercent > 0 ? 'partial' : 'notStarted')
  const stars = starsFor(view.qualityPercent / 100, view.cleared)
  const bars = useShown(600)
  const nextRef = useRef<HTMLButtonElement>(null)
  const lampRef = useRef<HTMLDivElement>(null)

  return (
    <section data-testid="result-screen" className="rs-wrap">
      <div className={`rs-hero ${view.cleared ? 'win' : ''}`}>
        {view.cleared && Array.from({ length: 12 }, (_, i) => <span key={i} className="rs-confetti" style={{ left: `${4 + i * 8}%`, animationDelay: `${i * 0.14}s`, background: ['#E8862F', '#D9573F', '#4E9050', '#5BB5D6', '#E8B04A'][i % 5] }} />)}
        <div ref={lampRef} className={`rs-lamp ${lamp ?? 'off'}`}>
          <span className="rs-glow" />
          <img src={`/art/shop-${view.pillar}.webp`} alt="" draggable={false} />
          {view.cleared && <img className="rs-flag" src="/art/flag-done.webp" alt="" draggable={false} />}
        </div>
        <div className="rs-head">
          <h2 data-testid="result-title" className="font-display lang-fit m-0 text-[28px] leading-tight">{view.cleared ? t('result.cleared') : t('result.notCleared')}</h2>
          <div className="mt-1 text-[14px] font-bold opacity-80">{t(`pillars.${view.pillar}.name`)} · {t(`pillars.${view.pillar}.game`)}</div>
          <div data-testid="result-state" className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="mk-chip">{t(`state.${stateKey}`)}{view.state.status !== 'complete' && view.state.partialPercent > 0 ? ` · ${t('result.partial', { percent: view.state.partialPercent })}` : ''}</span>
            {view.improved && <span className="mk-chip" style={{ background: '#CFE8B8' }}>▲ {t('result.improved')}</span>}
          </div>
        </div>
        <ScoreRing percent={view.qualityPercent} stars={stars} />
      </div>

      <div className="rs-deltas">
        <div className="rs-delta gold" data-testid="result-goal">
          <MoneyIcon size={38} />
          <div className="min-w-0 flex-1">
            <div className="rs-k">{t('kit.bar.money')}</div>
            <div className="rs-v"><span data-testid="result-saved-after"><Tween before={view.saved.before} after={view.saved.after} render={(n) => inr(n, lang)} /></span></div>
            <Shift before={view.saved.before} after={view.saved.after} max={goal || Math.max(view.saved.after, 1)} color="linear-gradient(90deg,#E8B04A,#E8862F)" />
            <div className={`rs-d ${view.saved.delta < 0 ? 'neg' : view.saved.delta > 0 ? 'pos' : ''}`}>{view.saved.delta === 0 ? t('result.noChange') : `${sign(view.saved.delta)}${inr(Math.abs(view.saved.delta), lang)}`}</div>
          </div>
        </div>
        <div className="rs-delta rose" data-testid="result-happy">
          <HappyIcon band={view.happy.after >= 60 ? 'glowing' : view.happy.after >= 35 ? 'ok' : 'tired'} size={36} />
          <div className="min-w-0 flex-1">
            <div className="rs-k">{t('kit.bar.happy')}</div>
            <div className="rs-v"><span data-testid="result-happy-after"><Tween before={view.happy.before} after={view.happy.after} delay={1100} render={(n) => String(n)} /></span></div>
            <Shift before={view.happy.before} after={view.happy.after} max={100} color="linear-gradient(90deg,#F29BAA,#D9573F)" />
            <div className={`rs-d ${view.happy.delta < 0 ? 'neg' : view.happy.delta > 0 ? 'pos' : ''}`}>{view.happy.delta === 0 ? t('result.noChange') : `${sign(view.happy.delta)}${Math.round(Math.abs(view.happy.delta))}`}</div>
          </div>
        </div>
      </div>
      <p className="rs-why">{view.happy.delta < 0 ? t('result.whyTired') : lamp === 'bright' ? t('result.whyBright') : lamp ? t('result.whyDim') : t('result.whyKeep')}</p>

      {view.skills.length > 0 && (
        <div data-testid="result-skills" className="rs-panel">
          <div className="mk-eyebrow">{t('result.skills')}</div>
          <ul className="rs-skills">
            {view.skills.map((s, i) => (
              <li key={s.skill}>
                <span className="rs-skill-name">{t(`skills.${s.skill}`)}</span>
                <span className="rs-bar"><i style={{ width: bars ? `${s.percent}%` : '0%', background: levelColor(s.percent), transitionDelay: `${i * 120}ms` }} /></span>
                <b className="rs-pct">{s.percent}%</b>
              </li>
            ))}
          </ul>
        </div>
      )}

      {view.lessons.length > 0 && (
        <div data-testid="result-lessons" className="rs-panel">
          <div className="mk-eyebrow">{t('result.lessons')}</div>
          <ul className="rs-lessons">{view.lessons.map((l, i) => <li key={l} style={{ animationDelay: `${0.9 + i * 0.12}s` }}><span aria-hidden>✓</span>{t(`lessons.${l}`, { defaultValue: l.replace(/-/g, ' ') })}</li>)}</ul>
        </div>
      )}

      {view.cleared && <BalanceCard />}
      <TiredNote />

      <button ref={nextRef} type="button" className="rs-next" data-testid="result-continue" onClick={() => (nextPillar ? irisClose(nextRef.current?.querySelector('img') ?? nextRef.current, onContinue) : onContinue())}>
        {nextPillar && <img src={`/art/shop-${nextPillar}.webp`} alt="" draggable={false} />}
        <span className="min-w-0 flex-1 text-left">
          {nextPillar && <span className="block text-[12px] font-extrabold uppercase tracking-[.14em] opacity-80">{t(`pillars.${nextPillar}.game`)}</span>}
          <span className="block">{nextPillar ? t('result.next', { name: t(`pillars.${nextPillar}.name`) }) : t('result.continue')}</span>
        </span>
        <span aria-hidden className="text-[22px]">▸</span>
      </button>
      <div className="rs-actions">
        <button type="button" className="ink-btn" data-testid="result-replay" onClick={() => irisClose(lampRef.current, onReplay)}>{t('result.replay')}</button>
        <button type="button" className="ink-btn cream" data-testid="result-back" onClick={onBack}>{t('result.back')}</button>
        <Link to="/progress" className="ink-btn cream" style={{ display: 'inline-flex', alignItems: 'center' }} data-testid="result-progress-link">{t('result.progressLink')}</Link>
      </div>
      <p className="mk-sub m-0 text-center">{t('host.banner')}</p>
    </section>
  )
}
