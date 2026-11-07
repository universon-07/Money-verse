import { useEffect, useState } from 'react'
import { LangSwitch } from '../../../components/Hud'
import { GOAL, INCOME } from '../engine/content'
import { GOALS, type GoalId, type Run } from '../engine/types'
import { useStage } from '../state/stage'
import { useCafe } from '../state/store'
import { Btn, Caption, Script } from './kit'
import { Letter } from './Letter'
import { GOAL_ART } from './Scene'
import { useCt } from './text'

/** best effort: Android Chrome lets a fullscreen page lock to landscape; everywhere else the rotate screen does the job */
async function lockLandscape() {
  try {
    if (window.matchMedia('(max-width: 700px)').matches) {
      await document.documentElement.requestFullscreen?.()
      await (screen.orientation as unknown as { lock?: (o: string) => Promise<void> }).lock?.('landscape')
    }
  } catch { /* not supported: the rotate screen covers it */ }
}

/** Entry card: names the café, what the player will learn, and the guardrails. */
export function Entry({ onExit }: { onExit: () => void }) {
  const { t } = useCt()
  const next = useCafe((s) => s.next)
  return (
    <div className="flex flex-col gap-3 text-center">
      <div className="text-[11px] font-bold uppercase tracking-[.25em] text-[#C8604A]">{t('entry.pillar')}</div>
      <h1 className="font-display lang-fit m-0 text-[34px] leading-none">{t('entry.title')}</h1>
      <p className="m-0 text-[16px] font-bold">{t('entry.hook')}</p>
      <p className="m-0 text-[14px]">{t('entry.boss')}</p>
      <p className="m-0 text-[13.5px] opacity-85">{t('entry.objective')}</p>
      <div className="flex flex-wrap justify-center gap-2 text-[12px] font-bold">
        <span className="ink-chip px-2.5 py-1">{t('entry.time')}</span>
        <span className="ink-chip px-2.5 py-1">{t('entry.note')}</span>
      </div>
      <div className="flex justify-center"><LangSwitch /></div>
      <p className="m-0 text-[11.5px] opacity-70">{t('entry.privacy')} {t('hud.notFinancialAdvice')}</p>
      <div className="flex justify-center gap-2">
        <Btn kind="cream" onClick={onExit}>◂ {t('hud.quit')}</Btn>
        <Btn onClick={() => { void lockLandscape(); next() }}>{t('entry.start')} ▸</Btn>
      </div>
    </div>
  )
}

/** Round 0: the walk in. Chacha hands over Ammamma's envelope, the scene goes full screen on her letter, then the story goes on. */
export function WalkIn() {
  const { t } = useCt()
  const next = useCafe((s) => s.next)
  const setStage = useStage((s) => s.set)
  const [part, setPart] = useState<'a' | 'letter' | 'b'>('a')
  useEffect(() => { setStage({ letter: 'counter' }); return () => setStage({ letter: null }) }, [setStage])
  if (part === 'letter') {
    return <Letter onDone={() => { setStage({ letter: null }); setPart('b') }} />
  }
  if (part === 'a') {
    return (
      <Script
        lines={[
          { who: 'scene', text: t('r0.l1') },
          { text: t('r0.l2') },
          { text: t('r0.give') },
        ]}
        onDone={() => setPart('letter')}
      />
    )
  }
  return (
    <Script
      lines={[
        { text: t('r0.l4') },
        { text: t('r0.l5') },
        { text: t('r0.l6') },
        { text: t('r0.l7') },
      ]}
      onDone={next}
    />
  )
}


export function GoalPick() {
  const { t } = useCt()
  const apply = useCafe((s) => s.apply)
  const next = useCafe((s) => s.next)
  const [picked, setPicked] = useState<GoalId | null>(null)
  const react = (g: GoalId) => t(`goals.react${g[0].toUpperCase()}${g.slice(1)}`)
  return (
    <div className="flex flex-col gap-3">
      <Caption text={picked ? `${react(picked)} ${t('r0.l8')}` : t('r0.l7')} />
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t('hud.goal')}>
        {GOALS.map((g) => (
          <button key={g} type="button" role="radio" aria-checked={picked === g} className={`cafe-goal ${picked === g ? 'is-on' : ''}`}
            onClick={() => { setPicked(g); apply((r: Run) => ({ ...r, goal: g })) }}>
            <img src={GOAL_ART[g]} alt="" className="h-12 w-auto object-contain" draggable={false} />
            <span className="text-[13px] font-bold leading-tight">{t(`goals.${g}`)}</span>
            <span className="text-[12px] font-bold text-[#C97B4A]">₹{GOAL}</span>
          </button>
        ))}
      </div>
      <div className="flex justify-end"><Btn disabled={!picked} onClick={next}>{t('hud.next')} ▸</Btn></div>
    </div>
  )
}

export function Predict1() {
  const { t } = useCt()
  const apply = useCafe((s) => s.apply)
  const next = useCafe((s) => s.next)
  const [ans, setAns] = useState<'none' | 'one' | 'two' | 'idk' | null>(null)
  const reply = { none: 'rNone', one: 'rOne', two: 'rTwo', idk: 'rIdk' } as const
  return (
    <div className="flex flex-col gap-3">
      <Caption text={ans ? `${t(`r0.${reply[ans]}`)} ${t('r0.after')}` : t('r0.l9')} />
      <div className="font-display lang-fit text-[19px] leading-tight">{t('r0.predict')}</div>
      <div className="grid grid-cols-2 gap-2">
        {(['none', 'one', 'two', 'idk'] as const).map((k) => (
          <button key={k} type="button" className={`cafe-choice ${ans === k ? 'is-on' : ''}`} aria-pressed={ans === k}
            onClick={() => { setAns(k); apply((r) => ({ ...r, predict1: k })) }}>{t(`r0.${k}`)}</button>
        ))}
      </div>
      <p className="m-0 text-[12px] opacity-70">₹{INCOME} · {t('hud.illustrative')}</p>
      <div className="flex justify-end"><Btn disabled={!ans} onClick={next}>{t('hud.next')} ▸</Btn></div>
    </div>
  )
}
