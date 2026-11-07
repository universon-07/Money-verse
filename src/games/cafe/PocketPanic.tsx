import './i18n'
import './ui/cafe.css'
import { useCallback, useEffect } from 'react'
import type { GameResult } from '../../lib/gameResult'
import { useGame, useLite } from '../../store/game'
import { balance, starCount } from './engine/balance'
import { billOf, isBusy } from './engine/flow'
import type { Tally } from './engine/types'
import { useStage } from './state/stage'
import { useCafe } from './state/store'
import { Bill } from './ui/Bill'
import { Hud, Ledger, PauseOverlay, PhaseCard } from './ui/kit'
import { Entry, GoalPick, Predict1, WalkIn } from './ui/Opening'
import { Meet } from './ui/Meet'
import { Payday } from './ui/Payday'
import { BigNight, Teja } from './ui/People'
import { Pay, RainRound } from './ui/Rain'
import { Scene } from './ui/Scene'
import { OneChange, TallyRound, ThenNow } from './ui/Tally'
import { Plates, Predict2, TrolleyRound, Worth } from './ui/Trolley'
import { WindowRound } from './ui/Window'
import { useCt } from './ui/text'

export interface PocketPanicProps {
  /** omit to resume the game saved on this device; a new seed starts a fresh one */
  seed?: string
  cohortCode: string
  onComplete: (r: GameResult) => void
  onExit: () => void
}

/**
 * Pocket Panic (Pillar 2: Save & Manage). A boss fight where the boss is the month.
 * Screens only call engine functions; all money logic lives in ./engine. See README.md.
 */
export default function PocketPanic({ seed, cohortCode, onComplete, onExit }: PocketPanicProps) {
  const step = useCafe((s) => s.step)
  const run = useCafe((s) => s.run)
  const restart = useCafe((s) => s.restart)
  const stage = useStage()
  const { t } = useCt()
  const lite = useLite()
  const slow = useCafe((s) => s.slow)
  const gender = useGame((s) => s.gender)
  const persona = useGame((s) => s.persona)

  useEffect(() => {
    const st = useCafe.getState()
    if (seed && seed !== st.run.seed) restart(seed)
  }, [seed, restart])
  // a fresh screen shows a fresh stage
  useEffect(() => { if (step !== 'plates' && step !== 'worth' && step !== 'rain' && step !== 'pay') useStage.getState().set({ plates: 0 }) }, [step])

  const finish = useCallback((t: Tally) => {
    onComplete({
      game: 'cafe',
      cohortCode,
      seed: run.seed,
      score: { balance: starCount(balance(run)), saved: t.saved, behaviours: Object.values(t.evidence).filter(Boolean).length, total: Object.values(t.evidence).filter(Boolean).length },
      evidence: { ...t.evidence, little: t.little, cushionUsed: t.cushionUsed, borrowCost: t.borrowCost, lent: t.lentOut, billsFromSave: t.billsBySource.save },
      joy: {
        treatsBought: run.window.filter((w) => w.bought).length + run.trolley.filter((x) => x.action === 'ok' && run.worth[x.itemId] !== 'meh').length,
        treatsSkipped: run.refused.length,
        lent: run.lent > 0 || run.gift > 0 ? 1 : 0,
        stars: starCount(balance(run)),
      },
      lessonsSeen: t.cards.slice(0, 3).map((c) => c.id),
      minaretLit: t.ending === 'reached' || t.ending === 'reachedCost',
      meta: { ending: t.ending, reading: t.archetype, month: String(run.month), bigNight: run.bigNight?.choice ?? 'none' },
    })
  }, [cohortCode, onComplete, run.seed, run.month, run.bigNight?.choice])

  const bill = billOf(step)
  const panel = (() => {
    switch (step) {
      case 'entry': return <Entry onExit={onExit} />
      case 'walkin': return <WalkIn />
      case 'goal': return <GoalPick />
      case 'predict1': return <Predict1 />
      case 'meet': return <Meet />
      case 'payday': return <Payday key={`pay-${run.month}`} />
      case 'bignight0':
      case 'bignight': return <BigNight key={`bn-${run.month}`} />
      case 'window': return <WindowRound key={`win-${run.month}`} />
      case 'trolley': return <TrolleyRound key={`tr-${run.month}`} />
      case 'predict2': return <Predict2 />
      case 'plates': return <Plates />
      case 'worth': return <Worth />
      case 'teja': return <Teja key={`teja-${run.month}`} />
      case 'rain': return <RainRound key={`rain-${run.month}`} />
      case 'pay': return <Pay />
      case 'pay2': return <Pay key={`pay2-${run.month}`} second />
      case 'tally': return <TallyRound key={`tally-${run.month}`} onFinish={finish} onExit={onExit} />
      case 'thennow': return <ThenNow />
      case 'onechange': return <OneChange onExit={onExit} />
      default: return bill ? <Bill key={`${bill}-${run.month}`} id={bill} /> : null
    }
  })()

  return (
    <div className="cafe" data-slow={slow ? 'true' : undefined}>
      {step !== 'entry' && <Hud step={step} run={run} />}
      <div className="cafe-main" data-busy={isBusy(step) && step !== 'entry' ? '1' : undefined}>
        <div className="cafe-stage" aria-hidden={step === 'entry'}>
          <Scene step={step} run={run} player={{ gender, persona }} saucers={stage.saucers} vendor={stage.vendor} beat={stage.beat} focus={stage.focus} platesCount={stage.plates} pulse={stage.pulse} demo={stage.demo} letter={stage.letter} cloudStage={stage.cloud} reached={run.jars.save >= 250} lite={lite} />
        </div>
        <div className="cafe-dock">
          <div className="cafe-dock-inner">
            {panel}
            {step !== 'entry' && <Foot />}
          </div>
        </div>
      </div>
      <div className="cafe-rotate" role="alert">
        <svg viewBox="0 0 80 80" className="cafe-rotate-icon" aria-hidden><rect x="26" y="8" width="28" height="56" rx="5" fill="#FBF0D2" stroke="#3A2A24" strokeWidth="3" /><circle cx="40" cy="57" r="2.5" fill="#3A2A24" /></svg>
        <div className="font-display text-[22px]">{t('hud.rotate')}</div>
        <div className="text-[14px] opacity-80">{t('hud.rotateSub')}</div>
      </div>
      <PhaseCard step={step} month={run.month} />
      <Ledger />
      <PauseOverlay onExit={onExit} />
    </div>
  )
}

function Foot() {
  const { t } = useCt()
  return <p className="cafe-foot">ⓘ {t('hud.illustrative')} {t('entry.note')}</p>
}
