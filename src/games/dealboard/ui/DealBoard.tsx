import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TitleCard } from './TitleCard'
import { useGame, useLite } from '../../../store/game'
import { RING_SIZE, TURNS, quarterTile } from '../engine/board'
import { invested, marketFor, netWorth, pitchFor, type RunState } from '../engine/run'
import { computeScore, liveScore, type Score } from '../engine/scoring'
import { reasonOptions, type ReasonOption } from '../engine/reasons'
import { knownQuarter, priceAt } from '../engine/state'
import type { CompanyId, MarketRun } from '../engine/types'
import { useDealBoard } from '../state/store'
import { Board } from './Board'
import { Meet } from './Companies'
import { Dossier } from './Dossier'
import { JudgementDialog } from './Judgement'
import { Sheet, Stat, useInr } from './Panels'
import { PassDialog } from './Reasons'
import { Report } from './Report'
import { TradeDialog, type TradeMode } from './TradeDialog'
import { TurnPanel } from './Turn'
import './dealboard.css'

const NOOP = () => {}
const STEP_MS = 170

export interface DealBoardProps {
  /** fixed seed (a class can share one); otherwise each new game picks its own */
  seed?: string
  onExit: () => void
  /** called once when a run ends, with the judgement score and skill breakdown */
  onComplete?: (score: Score) => void
}

/** Deal Board: learn to invest by deciding, one company a quarter, with feedback on every decision. */
export default function DealBoard({ seed, onExit, onComplete }: DealBoardProps) {
  // the game always opens on the start screen: any earlier run is dropped before the first render
  useState(() => useDealBoard.getState().quit())
  const run = useDealBoard((s) => s.run)
  const start = useDealBoard((s) => s.start)
  const { t } = useTranslation('dealboard')
  return (
    <div className="db-root absolute inset-0 overflow-y-auto">
      {run ? <Game run={run} onExit={onExit} onComplete={onComplete} /> : <Intro onStart={() => start(seed)} onExit={onExit} />}
      <footer className="db-guardrail sticky bottom-0 z-20 px-3 py-2 text-center" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
        {t('guardrail')}
      </footer>
    </div>
  )
}

/** `compact` drops the label on phones so the money strip gets the room. */
function BackButton({ onExit, compact }: { onExit: () => void; compact?: boolean }) {
  const { t } = useTranslation('dealboard')
  return (
    <button type="button" className="ink-chip font-sign lang-fit h-11 min-w-11 shrink-0 self-start px-3 text-[13px]" onClick={onExit} aria-label={t('back')}>
      ◀<span className={compact ? 'hidden sm:inline' : ''}> {t('back')}</span>
    </button>
  )
}

/** Language choice at the start. The game ships in English and Telugu; any other hub language shows English. */
function LangPick() {
  const lang = useGame((s) => s.language)
  const setLanguage = useGame((s) => s.setLanguage)
  const current = lang === 'te' || lang === 'hi' ? lang : 'en'
  return (
    <div className="ink-chip flex items-center gap-1 p-1" role="group" aria-label="Language / भाषा / భాష">
      {([['en', 'English'], ['hi', 'हिन्दी'], ['te', 'తెలుగు']] as const).map(([code, label]) => (
        <button
          key={code}
          type="button"
          aria-pressed={current === code}
          onClick={() => setLanguage(code)}
          className="h-11 min-w-16 rounded-lg px-2.5 text-[15px] font-extrabold"
          style={{ background: current === code ? '#E5457A' : 'transparent', color: current === code ? '#FFF3D6' : '#2B1A17', border: current === code ? '2.5px solid #2B1A17' : '2.5px solid transparent', fontFamily: code !== 'en' ? 'var(--font-body)' : undefined }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function Intro({ onStart, onExit }: { onStart: () => void; onExit: () => void }) {
  const { t } = useTranslation('dealboard')
  const steps = t('intro', { returnObjects: true }) as string[]
  return (
    <div className="db-roomy mx-auto my-auto flex w-full max-w-[560px] flex-col gap-4 px-4 pb-6 pt-3">
      <div className="flex items-start justify-between gap-2">
        <BackButton onExit={onExit} />
        <LangPick />
      </div>
      <TitleCard eyebrow={t('eyebrow')} title={t('title')}>
        <p className="m-0">{t('tagline')}</p>
      </TitleCard>
      <ol className="paper m-0 flex list-none flex-col gap-3 p-4">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-3 text-[15px] leading-snug">
            <span className="font-sign grid h-8 w-8 shrink-0 place-items-center rounded-full border-[2.5px] border-ink bg-mustard text-[14px]">{i + 1}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
      <button type="button" className="ink-btn pink self-center px-8 text-[18px]" onClick={onStart}>{t('start')}</button>
    </div>
  )
}

/** Walks the token one slot at a time along the ring to the current quarter. */
function useTokenWalk(target: number, lite: boolean) {
  const [shown, setShown] = useState(target)
  const dist = (target - shown + RING_SIZE) % RING_SIZE
  useEffect(() => {
    if (lite || dist === 0) return
    // a long jump (a replay sending the token back) snaps; moving on a quarter is at most a few slots
    const snap = dist > 4
    const id = window.setTimeout(() => setShown(snap ? target : (shown + 1) % RING_SIZE), snap ? 0 : STEP_MS)
    return () => window.clearTimeout(id)
  }, [shown, target, lite, dist])
  return lite || dist > 4 ? target : shown
}

function Header({ run, m, onExit }: { run: RunState; m: MarketRun; onExit: () => void }) {
  const { t } = useTranslation('dealboard')
  const money = useInr()
  return (
    <header className="flex items-center gap-2 lg:col-span-2">
      <BackButton onExit={onExit} compact />
      <div className="ink-chip grid min-w-0 flex-1 grid-cols-3 gap-2 px-2.5 py-1.5 sm:px-3">
        <Stat label={t('cash')} value={money(run.cash)} />
        <Stat label={t('invested')} value={money(invested(run, m))} />
        <Stat label={t('netWorth')} value={money(netWorth(run, m))} strong />
      </div>
    </header>
  )
}

function YearEnd({ run, m }: { run: RunState; m: MarketRun }) {
  const { t } = useTranslation('dealboard')
  const money = useInr()
  const dispatch = useDealBoard((s) => s.dispatch)
  const year = run.turn / 4
  const last = run.turn >= TURNS
  const ids = Object.keys(run.holdings) as CompanyId[]
  const cost = ids.reduce((s, id) => s + run.holdings[id]!.cost, 0)
  const value = invested(run, m)
  const grew = cost > 0 && value > cost
  return (
    <Sheet eyebrow="★ ★ ★" title={t('yearEnd.title', { n: year })} actions={<button type="button" className="ink-btn pink" onClick={() => dispatch({ type: 'continue' })}>{last ? t('yearEnd.finish') : t('yearEnd.continue', { n: year + 1 })} ▸</button>}>
      <p className="m-0 font-semibold">{t('yearEnd.body', { nw: money(netWorth(run, m)), cash: money(run.cash), inv: money(value) })}</p>
      <details className="group mt-3 rounded-lg border-2 border-ink bg-[#F6E6BE]" open>
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-3 text-[13px] font-extrabold [&::-webkit-details-marker]:hidden"><span>{t('yearEnd2.compounding')}</span><span className="transition-transform group-open:rotate-180" aria-hidden>▾</span></summary>
        <div className="px-3 pb-2.5 text-[14px] leading-snug">
          <p className="m-0 font-semibold">{grew ? t('lite.11.did', { r_a: money(cost), r_b: money(value) }) : t('lite.11.didB')}</p>
          <p className="m-0 mt-1 font-extrabold">{t('lite.11.rule')}</p>
        </div>
      </details>
    </Sheet>
  )
}

function Game({ run, onExit, onComplete }: { run: RunState; onExit: () => void; onComplete?: (s: Score) => void }) {
  const { t } = useTranslation('dealboard')
  const dispatch = useDealBoard((s) => s.dispatch)
  const quit = useDealBoard((s) => s.quit)
  const lite = useLite()
  const m = marketFor(run.seed)
  const shown = useTokenWalk(quarterTile(run.turn), lite)
  const [study, setStudy] = useState<CompanyId | null>(null)
  const [trade, setTrade] = useState<{ mode: TradeMode; id: CompanyId } | null>(null)
  const [passFor, setPassFor] = useState<CompanyId | null>(null)
  const [judge, setJudge] = useState(false)

  if (!run.briefed) return <Meet m={m} onStart={() => dispatch({ type: 'brief' })} />

  const score = computeScore(run, m)
  const live = liveScore(score)
  const final = run.phase === 'done' ? score : null
  const q = knownQuarter(run)
  const played = run.phase === 'desk' || run.phase === 'emergency' ? run.turn - 1 : run.turn
  const pitching = run.phase === 'desk' ? pitchFor(run, m) : null

  const confirmTrade = ({ amount, fraction, reason }: { amount: number; fraction: number; reason: ReasonOption }) => {
    if (!trade) return
    if (trade.mode === 'invest') dispatch({ type: 'bid', companyId: trade.id, amount, reason })
    else if (trade.mode === 'buyMore') dispatch({ type: 'buyMore', companyId: trade.id, amount, reason })
    else dispatch({ type: 'sell', companyId: trade.id, fraction, reason })
    setTrade(null)
    if (trade.mode === 'sell' && fraction >= 1) setStudy(null)
  }

  // the final judgement takes the whole screen: no board, just the report
  if (run.phase === 'done' && final) {
    return <Report run={run} score={final} onComplete={onComplete ?? NOOP} onAgain={() => quit()} onExit={onExit} />
  }

  return (
    // phones: header, board, sheet stacked; wide screens: board beside the sheet
    <div className="db-layout mx-auto flex max-w-[560px] flex-col gap-3 px-3 pb-6 pt-3 sm:px-4 lg:grid lg:max-w-[1060px] lg:grid-cols-[minmax(0,1fr)_400px] lg:items-center lg:gap-5">
      <Header run={run} m={m} onExit={onExit} />
      <div className="db-boardwrap flex flex-col gap-2">
        <Board run={run} m={m} tokenAt={shown} pitching={pitching} onOpen={setStudy}>
          <div className="db-eyebrow text-[#E8B04A]">{t('quarter', { n: Math.min(TURNS, run.turn) })}</div>
          <div className="db-wordmark">{t('title')}</div>
          <div className="db-rule" />
          <div className="flex flex-wrap justify-center gap-1" aria-hidden>
            {Array.from({ length: TURNS }, (_, i) => <span key={i} className={`db-pip ${i < played ? 'on' : ''}`} />)}
          </div>
          <button type="button" className="db-judge" onClick={() => setJudge(true)} aria-label={t('judgement.title')}>
            <span aria-hidden>⚖</span>
            <span className="font-sign lang-fit text-[12px]">{t('desk.judgementBtn')}</span>
            <span className="font-sign text-[15px]">{live.value ?? '—'}</span>
          </button>
        </Board>
        <p className="m-0 text-center text-[12px] text-jasmine/80">{t('boardHint')}</p>
      </div>
      <div className="db-panel lg:sticky lg:top-3 lg:max-h-[calc(100dvh-110px)] lg:overflow-y-auto lg:pr-1">
        {run.phase === 'yearEnd' ? (
          <YearEnd run={run} m={m} />
        ) : (
          <TurnPanel run={run} m={m} dispatch={dispatch} onRewind={() => dispatch({ type: 'rewind' })} onOpen={setStudy} onTrade={(mode, id) => setTrade({ mode, id })} onPass={setPassFor} />
        )}
      </div>
      {passFor && !trade && <PassDialog companyId={passFor} options={reasonOptions('pass', run, m, passFor)} onCancel={() => setPassFor(null)} onPick={(reason) => { dispatch({ type: 'pass', companyId: passFor, reason }); setPassFor(null) }} />}
      {judge && !trade && <JudgementDialog run={run} m={m} onClose={() => setJudge(false)} />}
      {study && !trade && !judge && <Dossier run={run} m={m} id={study} onClose={() => setStudy(null)} onTrade={(mode) => setTrade({ mode, id: study })} />}
      {trade && (
        <TradeDialog mode={trade.mode} companyId={trade.id} options={reasonOptions(trade.mode, run, m, trade.id)} price={priceAt(m, trade.id, q)} cash={run.cash} holding={run.holdings[trade.id]} blocked={trade.mode !== 'sell' && run.jailedTurn === run.turn} onCancel={() => setTrade(null)} onConfirm={confirmTrade} />
      )}
    </div>
  )
}
