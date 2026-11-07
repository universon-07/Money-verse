import type { HappyBand } from '../../features/happy/view'
import type { StateIcon } from '../../features/progress/view'

/**
 * Plain shape icons for the wireframes. A state is NEVER shown by colour alone: it always has one of these shapes AND a
 * text label. TODO(final-ui): placeholder shapes; the final design brings its own icons.
 */
const INK = 'var(--color-ink)'

const BY_STATE: Record<string, StateIcon> = { notStarted: 'empty', partial: 'half', bright: 'full', dim: 'dim', flicker: 'faint' }

/** pass `icon`, or a pillar `state` (notStarted / partial / bright / dim / flicker) and the icon is chosen for you */
export function StateGlyph({ icon, state, size = 24 }: { icon?: StateIcon; state?: string; size?: number }) {
  icon = icon ?? BY_STATE[state ?? 'notStarted'] ?? 'empty'
  const common = { width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': true, focusable: false } as const
  switch (icon) {
    case 'empty':
      return <svg {...common}><circle cx="12" cy="12" r="9" fill="none" stroke={INK} strokeWidth="2" /></svg>
    case 'half':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" fill="none" stroke={INK} strokeWidth="2" />
          <path d="M12 3 A9 9 0 0 1 12 21 Z" fill="var(--joy-bright)" stroke={INK} strokeWidth="2" />
        </svg>
      )
    case 'full':
      return <svg {...common}><circle cx="12" cy="12" r="9" fill="var(--joy-bright)" stroke={INK} strokeWidth="2" /></svg>
    case 'dim':
      return <svg {...common}><circle cx="12" cy="12" r="9" fill="var(--joy-dim)" stroke={INK} strokeWidth="2" /><circle cx="12" cy="12" r="3" fill={INK} /></svg>
    case 'faint':
      return <svg {...common}><circle cx="12" cy="12" r="9" fill="none" stroke={INK} strokeWidth="2" strokeDasharray="3 3" /></svg>
  }
}

/** a simple face for the Happy Index: smile, flat mouth, or tired closed eyes */
export function FaceGlyph({ band, size = 28 }: { band: HappyBand; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden focusable={false}>
      <circle cx="14" cy="14" r="12" fill={band === 'glowing' ? 'var(--joy-bright)' : band === 'ok' ? 'var(--joy-dim)' : 'var(--joy-flicker)'} stroke={INK} strokeWidth="2" />
      {band === 'tired' ? (
        <>
          <path d="M8 11 H12 M16 11 H20" stroke={INK} strokeWidth="2" strokeLinecap="round" />
          <path d="M9 20 Q14 16 19 20" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="10" cy="11" r="1.6" fill={INK} />
          <circle cx="18" cy="11" r="1.6" fill={INK} />
          {band === 'glowing' ? <path d="M8.5 16 Q14 22 19.5 16" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" /> : <path d="M9 18 H19" stroke={INK} strokeWidth="2" strokeLinecap="round" />}
        </>
      )}
    </svg>
  )
}
