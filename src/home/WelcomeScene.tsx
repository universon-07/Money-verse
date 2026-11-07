import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import './welcome.css'

/** where the four places sit on the island, as % of the island picture (from content/island.json) */
const PLACES = [
  { id: 'plan', x: 27, y: 38, npc: 'npc-bangle-stand', flip: false },
  { id: 'save', x: 76, y: 35, npc: 'npc-chai-stand', flip: true },
  { id: 'invest', x: 24, y: 61, npc: 'npc-pearl-stand', flip: false },
  { id: 'safe', x: 65, y: 75, npc: 'npc-kiosk-stand', flip: true },
] as const

const PETALS = Array.from({ length: 9 }, (_, i) => ({ left: 4 + i * 11, delay: -i * 1.7, dur: 11 + (i % 4) * 2, size: 12 + (i % 3) * 4 }))

/**
 * The welcome picture: a bright dawn over a floating island. The four places light up one after the other (the whole game in
 * one loop), clouds and birds drift, bunting sways, petals fall, and Ammamma waves from the dock. Pure decoration.
 */
export function WelcomeScene() {
  const { t } = useTranslation()
  const lines = ['hello1', 'hello2', 'hello3'] as const
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setI((n) => (n + 1) % lines.length), 4200)
    return () => window.clearInterval(id)
  }, [lines.length])
  return (
    <div className="wl-scene" aria-hidden>
      <div className="wl-sky" />
      <div className="wl-sun" />
      <div className="wl-rays" />
      {[0, 1, 2, 3, 4].map((n) => <div key={n} className={`wl-cloud c${n}`}><i /><i /><i /></div>)}
      <svg className="wl-bird b0" viewBox="0 0 40 20"><path d="M2 14 Q10 2 20 12 Q30 2 38 14" fill="none" stroke="#5A4036" strokeWidth="2.4" strokeLinecap="round" /></svg>
      <svg className="wl-bird b1" viewBox="0 0 40 20"><path d="M2 14 Q10 2 20 12 Q30 2 38 14" fill="none" stroke="#5A4036" strokeWidth="2.4" strokeLinecap="round" /></svg>
      <svg className="wl-bird b2" viewBox="0 0 40 20"><path d="M2 14 Q10 2 20 12 Q30 2 38 14" fill="none" stroke="#5A4036" strokeWidth="2.4" strokeLinecap="round" /></svg>

      <div className="wl-island">
        <img className="wl-island-img" src="/art/island-bg.webp" alt="" draggable={false} />
        <div className="wl-shadow" />
        <img className="wl-monument" src="/art/monument.webp" alt="" draggable={false} />
        <span className="wl-glow" />
        {PLACES.map((p, n) => (
          <div key={p.id} className="wl-place" style={{ left: `${p.x}%`, top: `${p.y}%`, ['--n' as string]: n }}>
            <img className="wl-npc" src={`/art/${p.npc}.webp`} alt="" draggable={false} style={{ transform: p.flip ? 'scaleX(-1)' : undefined }} />
            <span className="wl-flag">
              <img className="off" src="/art/flag-open.webp" alt="" draggable={false} />
              <img className="on" src="/art/flag-done.webp" alt="" draggable={false} />
              <span className="wl-spark" />
            </span>
          </div>
        ))}
        <div className="wl-ammamma">
          <div className="wl-bubble" key={i}>{t(`welcome.${lines[i]}`)}</div>
          <img src="/art/npc-nani-wave.webp" alt="" draggable={false} />
        </div>
      </div>

      <img className="wl-bunting b-a" src="/art/garland-bunting-0.webp" alt="" draggable={false} />
      {PETALS.map((p, n) => <span key={n} className="wl-petal" style={{ left: `${p.left}%`, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, width: p.size, height: p.size * 0.65 }} />)}
    </div>
  )
}
