import { useEffect } from 'react'
import { useLite } from '../store/game'

/** one static paper-fibre texture (an SVG turbulence, rendered once) */
const PAPER =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .35  0 0 0 0 .27  0 0 0 0 .2  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")"

/**
 * Paper texture + very subtle grain (~5%). No scratches, no jitter, a whisper of vignette.
 * Lite mode keeps only the static paper texture.
 */
export function FilmOverlay() {
  const lite = useLite()
  useEffect(() => {
    document.documentElement.dataset.lite = String(lite)
  }, [lite])
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[90]">
      <div className="absolute inset-0" style={{ backgroundImage: PAPER, opacity: 0.2, mixBlendMode: 'multiply' }} />
      {!lite && <div className="grain absolute inset-0" style={{ backgroundImage: PAPER, backgroundSize: '140px 140px', opacity: 0.05, mixBlendMode: 'multiply' }} />}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 45%, transparent 70%, rgba(58,42,36,.08) 100%)' }} />
    </div>
  )
}
