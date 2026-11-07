import type { HappyBand } from '../../features/happy/view'
import { HAPPY_FACE } from '../../progress/points'

/** the Happy points icon: an emoji face that follows how happy you are */
export function HappyIcon({ band, size = 22, className = '' }: { band: HappyBand; size?: number; className?: string }) {
  return <span className={`mk-emoji ${className}`} style={{ fontSize: size, lineHeight: 1 }} aria-hidden>{HAPPY_FACE[band]}</span>
}

/** the money points icon: the painted coin */
export function MoneyIcon({ size = 22, className = '' }: { size?: number; className?: string }) {
  return <img className={className} src="/art/cafe/coin.webp" alt="" width={size} height={size} draggable={false} style={{ flex: 'none' }} />
}

/** one to three stars, filled or empty */
export function Stars({ n, size = 20 }: { n: number; size?: number }) {
  return (
    <span className="mk-stars" role="img" aria-label={`${n} / 3`}>
      {[1, 2, 3].map((i) => <span key={i} className={i <= n ? 'on' : ''} style={{ fontSize: size, animationDelay: `${0.7 + i * 0.25}s` }}>★</span>)}
    </span>
  )
}
