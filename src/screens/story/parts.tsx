import { useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import '../../home/welcome.css'
import './story.css'

/** dawn sky with a sun and slow clouds: the same sky as the welcome page, so the story feels like the same place */
export function Backdrop({ tone = 'dawn' }: { tone?: 'dawn' | 'day' }) {
  return (
    <div className={`st-backdrop ${tone}`} aria-hidden>
      <div className="wl-sky" />
      <div className="wl-sun" style={{ top: '16%' }} />
      <div className="wl-rays" style={{ top: '16%' }} />
      {[0, 2, 3].map((n) => <div key={n} className={`wl-cloud c${n}`}><i /><i /><i /></div>)}
    </div>
  )
}

/** a line of text whose words arrive one after another */
export function Words({ text, start = 0.25, step = 0.055 }: { text: string; start?: number; step?: number }) {
  const words = useMemo(() => text.split(' '), [text])
  return (
    <span aria-label={text}>
      {words.map((w, i) => (
        <span key={i}>
          <span aria-hidden className="st-word" style={{ animationDelay: `${start + i * step}s` }}>{w}</span>{i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </span>
  )
}

/** the storyteller's card: Ammamma's face, her name, her words. The caption is the narrator under it. */
export function Say({ line, caption, who = 'ammamma', children }: { line: string; caption?: string; who?: 'ammamma'; children?: ReactNode }) {
  const { t } = useTranslation()
  return (
    <div className="st-say" role="status">
      <div className="st-say-head">
        <img className="st-say-face" src={`/art/story/face-${who}-stand.webp`} alt="" draggable={false} />
        <span className="st-say-name">{t(`tale.${who}`)}</span>
      </div>
      <p className="st-say-line"><Words text={line} /></p>
      {caption && <p className="st-say-cap">{caption}</p>}
      {children}
    </div>
  )
}

/** one story scene: art on one side, the storyteller on the other (stacked on a phone) */
export function Beat({ art, say }: { art: ReactNode; say: ReactNode }) {
  return (
    <div className="st-beat">
      <div className="st-art">{art}</div>
      <div className="st-text">{say}</div>
    </div>
  )
}
