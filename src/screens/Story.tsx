import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { animate, useMotionValue } from 'framer-motion'
import { FESTIVALS, PERSONAS, PILLARS, inr, type PersonaId } from '../content/data'
import { useGame } from '../store/game'
import { LangSwitch } from '../components/Hud'
import { MinarBar } from '../ui/kit/MinarBar'
import { useManifest } from '../art/ArtSlot'
import { stepped } from '../lib/stepped'
import { Backdrop, Beat, Say } from './story/parts'
import './story/story.css'

const LAST = 8

/** 1. Before sunrise: Ammamma sweeps the steps of the Charminar */
function S1Dawn() {
  const { t } = useTranslation()
  return (
    <Beat
      art={
        <div className="st-dawn">
          <img className="mon" src="/art/monument.webp" alt="" draggable={false} />
          <div className="ground" />
          <img className="amma" src="/art/npc-nani-stand.webp" alt="" draggable={false} />
          {[0, 1, 2].map((n) => <span key={n} className="st-dust" style={{ animationDelay: `${n * 0.8}s`, left: `${16 + n * 7}%` }} />)}
        </div>
      }
      say={<Say line={t('tale.s1.line')} caption={t('tale.s1.cap')} />}
    />
  )
}

/** 2. The gullak: one coin every Friday */
function S2Gullak() {
  const { t } = useTranslation()
  return (
    <Beat
      art={
        <div className="st-gullak">
          <img className="amma" src="/art/npc-nani-stand.webp" alt="" draggable={false} />
          <span className="fri">{t('tale.s2.friday')}</span>
          <img className="coin" src="/art/cafe/coin.webp" alt="" draggable={false} />
          <span className="sparkle" />
          <div className="shelf" />
          <img className="pot" src="/art/cafe/gullak.webp" alt="" draggable={false} />
        </div>
      }
      say={<Say line={t('tale.s2.line')} caption={t('tale.s2.cap')} />}
    />
  )
}

/** 3. Four minars: the four places light up one by one */
function S3Minars() {
  const { t } = useTranslation()
  return (
    <Beat
      art={
        <div className="st-minars">
          {PILLARS.map((p, n) => (
            <div key={p.id} className="st-minar" style={{ ['--n' as string]: n }}>
              <div className="pic">
                <span className="halo" />
                <img className="shop" src={`/art/shop-${p.id}.webp`} alt="" draggable={false} />
                <img className="flag" src="/art/flag-done.webp" alt="" draggable={false} />
              </div>
              <b>{t(`pillars.${p.id}.name`)}</b>
              <em className="topic">{t(`pillars.${p.id}.topic`)}</em>
              <small>{t(`pillars.${p.id}.hook`)}</small>
            </div>
          ))}
        </div>
      }
      say={<Say line={t('tale.s3.line')} caption={t('tale.s3.cap')} />}
    />
  )
}

/** 4. Who is walking out today? The only choice in the story. */
function S4Who() {
  const { t } = useTranslation()
  const lang = useGame((s) => s.language)
  const persona = useGame((s) => s.persona)
  const setPersona = useGame((s) => s.setPersona)
  const gender = useGame((s) => s.gender)
  const setGender = useGame((s) => s.setGender)
  const seen = useGame((s) => s.storySeen) // replaying must not reset progress: the person is fixed once chosen
  const festival = useGame((s) => s.festival)
  const setFestival = useGame((s) => s.setFestival)
  const ids = Object.keys(PERSONAS) as PersonaId[]
  return (
    <div className="st-pick">
      <div className="st-pick-in">
        <Say line={t('tale.s4.line')} caption={t('tale.s4.cap')} />
        <div className="mk-seg self-center" role="radiogroup" aria-label={t('story.b2.look')}>
          {(['girl', 'boy'] as const).map((g) => (
            <button key={g} type="button" role="radio" aria-checked={gender === g} onClick={() => setGender(g)}>{t(`story.b2.${g}`)}</button>
          ))}
        </div>
        <div className="flex flex-col gap-2.5" role="radiogroup" aria-label={t('story.b2.title')}>
          {ids.map((id) => {
            const sel = persona === id
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={sel}
                disabled={seen && !!persona}
                onClick={() => { if (!seen) setPersona(id) }}
                className="paper flex w-full items-center gap-3 p-2.5 text-left"
                style={{ cursor: 'pointer', minHeight: 88, background: sel ? '#FFF6DC' : '#FBF0D2', borderColor: sel ? '#D9573F' : '#3A2A24', borderWidth: sel ? 2.5 : 1.5, transition: 'border-color .2s, background .2s, transform .2s', transform: sel ? 'scale(1.02)' : undefined }}
              >
                <img src={`/art/avatar/${gender}-${id}-face.webp`} alt="" draggable={false} className="h-[64px] w-[64px] shrink-0 rounded-full border-[1.5px] border-ink bg-[#F2DFB0] object-cover object-top" />
                <div className="min-w-0 flex-1">
                  <div className="font-display lang-fit text-[18px] leading-tight">{t(`personas.${id}.name`)}</div>
                  <div className="mt-0.5 text-[13px] leading-snug opacity-85">{t(`personas.${id}.blurb`)}</div>
                  <div className="mt-1 text-[12px] font-bold text-gold">{t('personas.startsWith')} {inr(PERSONAS[id].start, lang)}</div>
                </div>
                <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full border-[1.5px] border-ink text-[13px]" style={{ background: sel ? '#D9573F' : 'transparent', color: '#FBF6EA' }} aria-hidden>{sel ? '✓' : ''}</div>
              </button>
            )
          })}
        </div>
        <div className="paper p-2.5" role="radiogroup" aria-label={t('story.b2.festival')}>
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[.16em] opacity-70">{t('story.b2.festival')}</div>
          <div className="flex flex-wrap gap-1.5">
            {FESTIVALS.map((f) => (
              <button key={f} type="button" role="radio" aria-checked={festival === f} onClick={() => setFestival(f)} className="h-10 rounded-full px-3 text-[14px] font-bold" style={{ background: festival === f ? '#3A2A24' : 'transparent', color: festival === f ? '#FBF0D2' : '#3A2A24', border: '1.5px solid #3A2A24', cursor: 'pointer' }}>{t(`festivals.${f}`)}</button>
            ))}
          </div>
        </div>
        <p className="m-0 text-center text-[11px] font-semibold opacity-70">{t('hud.illustrative')}</p>
      </div>
    </div>
  )
}

/** 5. Her cloth bundle: what the family could save */
function S5Bundle() {
  const { t } = useTranslation()
  const lang = useGame((s) => s.language)
  const start = useGame((s) => s.startAmount)
  const man = useManifest()
  const n = useMotionValue(0)
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const c = animate(n, start, { duration: 1.2, delay: 0.9, ease: stepped(12), onUpdate: (v) => setShown(Math.round(v)) })
    return () => c.stop()
  }, [start, n])
  return (
    <Beat
      art={
        <div className="st-bundle">
          {man['story-flowers'] && <img className="vig" src="/art/story-flowers.webp" alt="" draggable={false} />}
          {man['npc-nani-wave'] && <img className="amma" src="/art/npc-nani-wave.webp" alt="" draggable={false} />}
          <span className="sum">
            <img src="/art/cafe/coin.webp" alt="" width={26} height={26} draggable={false} />
            +{inr(shown, lang)}
          </span>
        </div>
      }
      say={<Say line={t('tale.s5.line')} caption={t('tale.s5.cap')} />}
    />
  )
}

/** 6. The goal: the fee letter */
function S6Goal() {
  const { t } = useTranslation()
  const lang = useGame((s) => s.language)
  const persona = useGame((s) => s.persona) ?? 'college'
  const goal = useGame((s) => s.goalAmount)
  const m = useManifest().receipt
  const n = useMotionValue(0)
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const c = animate(n, goal, { duration: 1.2, delay: 0.6, ease: stepped(12), onUpdate: (v) => setShown(v) })
    return () => c.stop()
  }, [goal, n])
  return (
    <Beat
      art={
        <div className="relative w-[min(100%,440px)]" style={{ animation: 'st-rise 1s ease both' }}>
          {m ? (
            <div className="relative">
              <img src="/art/receipt.webp" alt="" draggable={false} className="block w-full" style={{ filter: 'drop-shadow(0 8px 14px rgba(58,42,36,.25))' }} />
              <div className="absolute inset-0" style={{ transform: 'rotate(4deg)' }}>
                <div className="font-display lang-fit absolute text-[clamp(14px,4.4vw,22px)] text-coral" style={{ left: '45%', top: '14%', transform: 'translate(-50%,-50%)' }}>{t('story.b4.receipt')}</div>
                <div className="absolute text-center font-bold" style={{ left: '41%', top: '29%', transform: 'translate(-50%,-50%)', fontSize: 'clamp(11px,3.4vw,15px)' }}>{t(`personas.${persona}.goalFor`)}</div>
                <div className="font-display lang-fit absolute whitespace-nowrap" style={{ left: '41%', top: '46%', transform: 'translate(-50%,-50%)', fontSize: 'clamp(30px,10vw,48px)', lineHeight: 1 }}>{inr(shown, lang)}</div>
                <div className="absolute whitespace-nowrap font-bold" style={{ left: '41%', top: '60%', transform: 'translate(-50%,-50%)', fontSize: 'clamp(12px,3.6vw,16px)' }}>{t('story.b4.deadline')}</div>
              </div>
            </div>
          ) : (
            <div className="paper p-5 text-center">
              <div className="text-[11px] font-bold uppercase tracking-[.2em] text-coral">{t('story.b4.receipt')}</div>
              <div className="font-display lang-fit mt-1 text-[44px] leading-none">{inr(shown, lang)}</div>
              <div className="mt-2 text-[15px] font-bold">{t('story.b4.deadline')}</div>
            </div>
          )}
        </div>
      }
      say={<Say line={t('tale.s6.line')} caption={t('tale.s6.cap')} />}
    />
  )
}

/** 7. Look after yourself: happy lamps shine bright */
function S7Happy() {
  const { t } = useTranslation()
  return (
    <Beat
      art={
        <div className="st-lamps">
          {(['bright', 'dim', 'flicker'] as const).map((b, n) => (
            <div key={b} className={`st-lamp ${b}`} style={{ ['--n' as string]: n }}>
              <div className="flagbox"><img src="/art/flag-done.webp" alt="" draggable={false} /></div>
              <b>{t(`tale.s7.${b}`)}</b>
              <small>{t(`tale.s7.${b}Hint`)}</small>
            </div>
          ))}
        </div>
      }
      say={<Say line={t('tale.s7.line')} caption={t('tale.s7.cap')} />}
    />
  )
}

/** 8. The gate to Chapter 2: closed while you play, golden when all four lamps are lit */
function S8Gate() {
  const { t } = useTranslation()
  return (
    <Beat
      art={
        <div className="st-gate">
          <div className="st-gate-lamps" aria-hidden>
            {PILLARS.map((p, n) => <img key={p.id} src="/art/flag-done.webp" alt="" draggable={false} style={{ ['--n' as string]: n }} />)}
          </div>
          <div className="st-gate-box">
            <img className="closed" src="/art/gate-closed.webp" alt="" draggable={false} />
            <img className="open" src="/art/gate-open.webp" alt="" draggable={false} />
            <span className="glow" />
          </div>
          <div className="st-gate-tag">{t('tale.s8.gate')}</div>
        </div>
      }
      say={<Say line={t('tale.s8.line')} caption={t('tale.s8.cap')} />}
    />
  )
}

export default function Story() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const persona = useGame((s) => s.persona)
  const setPersona = useGame((s) => s.setPersona)
  const setSeen = useGame((s) => s.setStorySeen)
  const [step, setStep] = useState(1)

  const finish = useCallback(() => {
    if (!useGame.getState().persona) setPersona('college')
    setSeen(true)
    nav('/')
  }, [nav, setPersona, setSeen])

  const canNext = step === 4 ? !!persona : true
  const next = useCallback(() => { if (!canNext) return; if (step >= LAST) finish(); else setStep((s) => s + 1) }, [canNext, step, finish])
  const back = useCallback(() => setStep((s) => Math.max(1, s - 1)), [])

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const onBtn = document.activeElement instanceof HTMLButtonElement
      if (e.key === 'ArrowRight' || (e.key === ' ' && !onBtn)) { e.preventDefault(); next() }
      else if (e.key === 'ArrowLeft') back()
      else if (e.key === 'Escape') finish()
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [next, back, finish])

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: '#92C9D3' }}>
      <Backdrop tone={step >= 5 ? 'day' : 'dawn'} />
      <div key={step} className="fade-in absolute inset-0">
        {step === 1 && <S1Dawn />}
        {step === 2 && <S2Gullak />}
        {step === 3 && <S3Minars />}
        {step === 4 && <S4Who />}
        {step === 5 && <S5Bundle />}
        {step === 6 && <S6Goal />}
        {step === 7 && <S7Happy />}
        {step === 8 && <S8Gate />}
      </div>

      {step >= 5 ? (
        <MinarBar replay={false} hideProfile />
      ) : (
        <div className="st-top"><LangSwitch /></div>
      )}

      <div className="st-nav">
        <button type="button" className="ink-btn cream" onClick={back} disabled={step <= 1} aria-label={t('buttons.back')}>◂</button>
        <div className="st-dots" role="img" aria-label={t('story.stepOf', { n: step, total: LAST })}>
          {Array.from({ length: LAST }, (_, i) => <i key={i} className={`${i + 1 <= step ? 'on' : ''} ${i + 1 === step ? 'cur' : ''}`} />)}
        </div>
        <button type="button" className="ink-btn" style={{ minWidth: 96 }} onClick={next} disabled={!canNext}>{step === LAST ? t('buttons.go') : t('buttons.next')} ▸</button>
        <button type="button" className="st-skip" onClick={finish}>{t('tale.skip')}</button>
      </div>
    </div>
  )
}
