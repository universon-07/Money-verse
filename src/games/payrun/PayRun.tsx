import './i18n'
import '../../components/gameMotion.css'
import { useCallback } from 'react'
import { LangSwitch } from '../../components/Hud'
import { Bunting, Rooftops } from '../../components/Scenery'
import { usePayRun, useSeason } from './state/store'
import { DayCard, ResultPanel } from './ui/Day'
import { GuardrailFooter, StatsBar } from './ui/kit'
import { usePr } from './ui/usePr'
import { Review, WeekDone } from './ui/Review'
import { Focus, Plan, Start } from './ui/Week'

export interface PayRunProps {
  cohortCode?: string
  /** called once when the jar first reaches the goal (the shell lights the minaret) */
  onGoalReached: () => void
  onExit: () => void
}

/** Pay Run (Pillar 2: Save & Manage). Screens only send decisions; the engine decides what happens. */
export default function PayRun({ onGoalReached, onExit }: PayRunProps) {
  const { t } = usePr()
  const goal = usePayRun((s) => s.goal)
  const focused = usePayRun((s) => s.focused)
  const result = usePayRun((s) => s.result)
  const { state, script } = useSeason()
  const ph = state.phase
  const restart = usePayRun((s) => s.restart)
  const goalCb = useCallback(() => onGoalReached(), [onGoalReached])

  const inDay = ph.at === 'treat' || ph.at === 'card' || ph.at === 'shortfall'
  // plan decisions (rules, still-want, sweep) show their own screens, not a result card
  const showResult = !!result && ['treat', 'want', 'friend', 'windfall', 'shortfall'].includes(result.decision.k)
  // while a result is showing, the header still belongs to the day it came from
  const day = showResult && 'day' in result!.decision ? result!.decision.day : ph.at === 'treat' || ph.at === 'card' || ph.at === 'shortfall' ? ph.day : null
  const stats = showResult ? { state, delta: { pocket: state.pocket - result!.before.pocket, jar: state.jar - result!.before.jar } } : { state, delta: undefined }

  let body
  if (!goal) body = <Start canResume={false} onResume={() => {}} />
  else if (showResult) body = <div className="paper p-3"><ResultPanel result={result!} script={script} /></div>
  else if (ph.at === 'plan' && focused < script.week) body = <Focus state={state} script={script} />
  else if (ph.at === 'plan') body = <Plan key={script.week} state={state} script={script} />
  else if (ph.at === 'review') body = <Review state={state} script={script} />
  else if (ph.at === 'done') body = <WeekDone state={state} script={script} onGoal={goalCb} onExit={onExit} />
  else body = <div className="paper fc-deal p-3"><DayCard state={state} /></div>

  return (
    <div className="absolute inset-0 overflow-y-auto" style={{ background: 'linear-gradient(#9FD4E8, #FFF0C8 60%, #F7C98A)' }}>
      <Rooftops />
      <div className="relative mx-auto flex min-h-full max-w-md flex-col">
        <header className="sticky top-0 z-40" style={{ background: '#FFF3D6', borderBottom: '3px solid #2B1A17' }}>
          <div className="flex items-center gap-1.5 px-2 pb-1" style={{ paddingTop: 'max(6px, env(safe-area-inset-top))' }}>
            <button type="button" className="ink-chip grid h-12 w-12 shrink-0 place-items-center text-[18px]" aria-label={t('exit')} title={t('exit')} onClick={onExit}>◀</button>
            <span className="font-sign lang-fit min-w-0 flex-1 text-[15px]">{t('title')}{goal ? ` · ${t('week', { n: script.week })}` : ''}</span>
            {goal && <button type="button" className="ink-chip grid h-12 w-12 shrink-0 place-items-center text-[18px]" aria-label={t('start.again')} title={t('start.again')} onClick={() => { if (window.confirm(t('start.confirm'))) restart() }}>↺</button>}
            <LangSwitch />
          </div>
          <Bunting />
        </header>
        <main className="flex flex-1 flex-col gap-2.5 px-3 pb-4 pt-2">
          {goal && (inDay || showResult) && (
            <StatsBar state={stats.state} delta={stats.delta} label={day ? t('day', { n: day, name: t(`days.${day - 1}`) }) : t('review.title', { n: script.week })} />
          )}
          {body}
        </main>
        <footer className="sticky bottom-0 z-30 mt-auto" style={{ background: 'rgba(255,243,214,.94)', borderTop: '3px solid #2B1A17', paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <GuardrailFooter />
        </footer>
      </div>
    </div>
  )
}
