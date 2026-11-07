import './i18n'
import { LangSwitch } from '../../components/Hud'
import { Bunting, Rooftops } from '../../components/Scenery'
import type { GameResult } from '../../lib/gameResult'
import { useEffect } from 'react'
import { presetLog, STAGES, type Stage } from './state/presets'
import { useShowdown, useView } from './state/store'
import { DateScreen } from './ui/Dates'
import { Festival, Futures } from './ui/Festival'
import { Brief, Goals, PredictP1, Start } from './ui/Intro'
import { GuardrailFooter } from './ui/kit'
import { Market } from './ui/Market'
import { PlanCheck } from './ui/PlanCheck'
import { Report } from './ui/Report'
import { useSd } from './ui/useSd'

export interface ShowdownProps {
  cohortCode?: string
  /** called once with the result when the report is first shown (the hub saves it and lights the minaret) */
  onComplete?: (r: GameResult) => void
  onExit: () => void
  /** inside the shell, which already has an Exit bar: hide this game's own back button */
  embedded?: boolean
}

/** Festival Showdown (Pillar 1: Plan & Budget). Screens only append decisions; the engine decides what happens. */
export default function ShowdownGame({ cohortCode = 'local', onComplete, onExit, embedded = false }: ShowdownProps) {
  const { t } = useSd()
  const { step } = useView()
  const load = useShowdown((s) => s.load)

  // /play/plan?showdown&preset=A|B&at=market|locked|festival|futures|report jumps to a reference game (for checking and demos)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const plan = q.get('preset')
    const at = (q.get('at') ?? 'market') as Stage
    if ((plan === 'A' || plan === 'B') && STAGES.includes(at)) load(presetLog(plan, at))
  }, [load])

  let body
  switch (step.screen) {
    case 'start': body = <Start />; break
    case 'brief': body = <Brief />; break
    case 'goals': body = <Goals />; break
    case 'p1': body = <PredictP1 />; break
    case 'market': body = <Market />; break
    case 'plancheck': body = <PlanCheck />; break
    case 'date': body = <DateScreen key={step.point} point={step.point!} />; break
    case 'festival': body = <Festival />; break
    case 'futures': body = <Futures />; break
    case 'report': body = <Report cohortCode={cohortCode} onComplete={onComplete} onExit={onExit} />; break
  }

  const wide = step.screen === 'market' || step.screen === 'futures'
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(#9FD4E8, #FFF0C8 60%, #F7C98A)' }}>
      {/* the skyline sits at the bottom of this game's own box, tiled so a laptop gets a street and a phone gets one block */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 flex h-24 justify-center overflow-hidden md:h-28">
        {Array.from({ length: 9 }, (_, i) => <Rooftops key={i} className="h-full w-[216px] shrink-0 md:w-[252px]" aspect="xMidYMax meet" />)}
      </div>
      <div className="absolute inset-0 overflow-y-auto">
        <div className={`relative mx-auto flex min-h-full w-full max-w-md flex-col ${wide ? 'md:max-w-3xl' : 'md:max-w-xl'}`}>
          <header className="sticky top-0 z-40" style={{ background: '#FFF3D6', borderBottom: '3px solid #2B1A17' }}>
            <div className="flex items-center gap-1.5 px-2 pb-1" style={{ paddingTop: 'max(6px, env(safe-area-inset-top))' }}>
              {!embedded && <button type="button" className="ink-chip grid h-12 w-12 shrink-0 place-items-center text-[18px]" aria-label={t('exit')} title={t('exit')} onClick={onExit}>◀</button>}
              <span className="font-sign lang-fit min-w-0 flex-1 text-[15px]">{t('title')}</span>
              <LangSwitch />
            </div>
            <Bunting />
          </header>
          <main className="flex-1 px-3 pb-28 pt-2">{body}</main>
          {!embedded && (
            <footer className="sticky bottom-0 z-30 mt-auto" style={{ background: 'rgba(255,243,214,.94)', borderTop: '3px solid #2B1A17', paddingBottom: 'env(safe-area-inset-bottom)' }}>
              <GuardrailFooter />
            </footer>
          )}
        </div>
      </div>
    </div>
  )
}
