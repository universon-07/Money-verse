import { useEffect, useState, type CSSProperties } from 'react'
import { C } from './palette'

/**
 * Rubber-hose character rig (original designs).
 * Limbs are noodle-tubes: a thick ink stroke under a thinner colour stroke. Gloved hands,
 * big pie-eyes, flat cel colour, stepped idle bounce. Swap for real art via <ArtSlot/>.
 */
export type Mood = 'happy' | 'worried' | 'surprised' | 'sly' | 'cycle'
export interface ToonLook {
  skin: string
  hair: string
  hairStyle: 'bun' | 'bald' | 'topi' | 'hood' | 'curly' | 'none'
  top: string
  bottom: string
  glasses?: 'round' | 'shades' | 'none'
  moustache?: boolean
  bindi?: boolean
  scarf?: string
  trim?: string
}

export const LOOKS: Record<string, ToonLook> = {
  bangle: { skin: '#B8693A', hair: '#2B1A17', hairStyle: 'bun', top: '#E5457A', bottom: '#2F6F73', bindi: true, scarf: '#F28C28', trim: '#D9A520' },
  chai: { skin: '#C77D47', hair: '#2B1A17', hairStyle: 'curly', top: '#5BB5D6', bottom: '#7A2A22', trim: '#FFF3D6' },
  pearl: { skin: '#A8602F', hair: '#EDE6D6', hairStyle: 'topi', top: '#FFF3D6', bottom: '#1E2A44', glasses: 'round', moustache: true, trim: '#D9A520' },
  upi: { skin: '#B5683B', hair: '#2B1A17', hairStyle: 'hood', top: '#3F7A3A', bottom: '#1E2A44', glasses: 'shades', trim: '#E8B04A' },
  nani: { skin: '#B8693A', hair: '#E8E2D6', hairStyle: 'bun', top: '#E5457A', bottom: '#FFF3D6', glasses: 'round', bindi: true, scarf: '#FFF3D6', trim: '#D9A520' },
}

const INK = C.ink

function Hose({ d, color, w = 7, ink = 3.2 }: { d: string; color: string; w?: number; ink?: number }) {
  return (
    <>
      <path d={d} fill="none" stroke={INK} strokeWidth={w + ink * 2} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
    </>
  )
}
const Glove = ({ x, y, r = 7 }: { x: number; y: number; r?: number }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill={C.glove} stroke={INK} strokeWidth={3} />
    <path d={`M${x - r * 0.4} ${y - r * 0.2} q${r * 0.3} ${r * 0.6} ${r * 0.8} 0`} stroke={INK} strokeWidth={1.4} fill="none" strokeLinecap="round" />
  </g>
)

interface Props {
  look: ToonLook
  mood?: Mood
  /** eyes wide + brows up: used by the hover/tap reaction */
  excited?: boolean
  wave?: boolean
  armsUp?: boolean
  /** shift pupils side to side (suspicious) */
  shifty?: boolean
  x?: number
  y?: number
  width?: number
  height?: number
  className?: string
  style?: CSSStyle
  flip?: boolean
}
type CSSStyle = CSSProperties

export function Toon({ look, mood = 'happy', excited = false, wave = false, armsUp = false, shifty = false, x, y, width = 100, height = 150, className, style, flip }: Props) {
  const [cycle, setCycle] = useState<'worried' | 'happy'>('worried')
  useEffect(() => {
    if (mood !== 'cycle') return
    const id = window.setInterval(() => setCycle((c) => (c === 'worried' ? 'happy' : 'worried')), 2400)
    return () => window.clearInterval(id)
  }, [mood])
  const m: Exclude<Mood, 'cycle'> = excited ? 'surprised' : mood === 'cycle' ? cycle : mood
  const eyeRy = m === 'surprised' ? 12.5 : 10.5
  const pr = m === 'surprised' ? 3 : 4.3
  const mo = look.moustache ? 3 : 0
  const shades = look.glasses === 'shades'

  const brows = {
    happy: ['M32 28 Q40 22 48 27', 'M52 27 Q60 22 68 28'],
    worried: ['M32 30 L48 22', 'M52 22 L68 30'],
    surprised: ['M33 22 Q40 15 48 20', 'M52 20 Q60 15 67 22'],
    sly: ['M32 27 Q40 31 48 29', 'M52 22 Q60 17 68 24'],
  }[m]

  return (
    <svg
      x={x}
      y={y}
      width={width}
      height={height}
      viewBox="0 0 100 150"
      className={className}
      style={{ overflow: 'visible', transform: flip ? 'scaleX(-1)' : undefined, transformBox: 'fill-box', transformOrigin: '50% 100%', ...style }}
    >
      <ellipse cx="50" cy="146" rx="26" ry="4.5" fill={INK} opacity=".25" />
      {/* legs */}
      <Hose d="M43 100 Q41 120 36 137" color={look.bottom} w={9} />
      <Hose d="M57 100 Q59 120 64 137" color={look.bottom} w={9} />
      <ellipse cx="31" cy="141" rx="10" ry="5.5" fill={INK} />
      <ellipse cx="69" cy="141" rx="10" ry="5.5" fill={INK} />
      {/* back arm (left) */}
      <Hose d={armsUp ? 'M31 68 Q12 60 15 38' : 'M31 68 Q15 82 22 101'} color={look.skin} w={6.5} />
      <Glove x={armsUp ? 15 : 22} y={armsUp ? 37 : 103} />
      {/* torso */}
      <path d="M29 62 Q26 86 35 104 Q50 111 65 104 Q74 86 71 62 Q50 53 29 62Z" fill={look.top} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      {look.trim && <path d="M35 100 Q50 106 65 100" fill="none" stroke={look.trim} strokeWidth={4} strokeLinecap="round" />}
      {look.scarf && <path d="M30 62 Q36 82 56 94 Q40 100 36 78 Q32 70 30 62Z" fill={look.scarf} stroke={INK} strokeWidth={3} strokeLinejoin="round" />}
      {/* front arm (right) */}
      <g className={wave ? 'anim-sway' : undefined} style={{ transformOrigin: '69px 68px', transformBox: 'view-box' }}>
        <Hose d={wave ? 'M69 68 Q90 60 88 38' : armsUp ? 'M69 68 Q88 60 85 38' : 'M69 68 Q85 82 78 101'} color={look.skin} w={6.5} />
        <Glove x={wave ? 88 : armsUp ? 85 : 78} y={wave ? 36 : armsUp ? 37 : 103} />
      </g>
      {/* head */}
      <g className="anim-bob-sm">
        {look.hairStyle === 'bun' && <circle cx="50" cy="10" r="11" fill={look.hair} stroke={INK} strokeWidth={3.2} />}
        {look.hairStyle === 'curly' && [28, 38, 50, 62, 72].map((cx, i) => <circle key={cx} cx={cx} cy={i % 2 ? 11 : 15} r="9" fill={look.hair} stroke={INK} strokeWidth={3} />)}
        <ellipse cx="25.5" cy="40" rx="4.5" ry="6" fill={look.skin} stroke={INK} strokeWidth={3} />
        <ellipse cx="74.5" cy="40" rx="4.5" ry="6" fill={look.skin} stroke={INK} strokeWidth={3} />
        <ellipse cx="50" cy="38" rx="25" ry="24" fill={look.skin} stroke={INK} strokeWidth={3.6} />
        {/* hair front */}
        {look.hairStyle === 'bun' && <path d="M26 36 Q23 13 50 13 Q77 13 74 36 Q66 23 50 23 Q34 23 26 36Z" fill={look.hair} stroke={INK} strokeWidth={3} strokeLinejoin="round" />}
        {look.hairStyle === 'curly' && <path d="M27 33 Q30 17 50 17 Q70 17 73 33 Q62 24 50 24 Q38 24 27 33Z" fill={look.hair} stroke={INK} strokeWidth={3} strokeLinejoin="round" />}
        {look.hairStyle === 'topi' && (
          <g>
            <path d="M26 27 L29 9 Q50 3 71 9 L74 27 Q50 20 26 27Z" fill={C.jasmine} stroke={INK} strokeWidth={3.2} strokeLinejoin="round" />
            <path d="M28 21 Q50 15 72 21" fill="none" stroke={look.trim ?? C.gold} strokeWidth={3.4} />
            <path d="M31 14 l3 4 M42 11 l2 4 M56 11 l-1 4 M68 14 l-3 4" stroke={look.trim ?? C.gold} strokeWidth={1.8} />
          </g>
        )}
        {look.hairStyle === 'hood' && (
          <path d="M20 44 Q16 3 50 3 Q84 3 80 44 Q76 22 62 20 Q50 14 38 20 Q24 22 20 44Z" fill={look.top} stroke={INK} strokeWidth={3.4} strokeLinejoin="round" />
        )}
        {/* brows */}
        {!shades && brows.map((d, i) => <path key={i} d={d} fill="none" stroke={INK} strokeWidth={3.4} strokeLinecap="round" />)}
        {/* eyes */}
        {shades ? (
          <g>
            <path d="M28 33 H72 V40 Q72 50 62 50 Q52 50 51 40 H49 Q48 50 38 50 Q28 50 28 40Z" fill={INK} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
            <path d="M33 36 l6 0 M57 36 l6 0" stroke={C.jasmine} strokeWidth={2} strokeLinecap="round" opacity=".7" />
            <path d="M32 28 L48 32 M52 32 L68 28" stroke={INK} strokeWidth={3.4} strokeLinecap="round" />
          </g>
        ) : (
          [41, 59].map((cx) => (
            <g key={cx}>
              <ellipse cx={cx} cy="38" rx="8.6" ry={eyeRy} fill={C.jasmine} stroke={INK} strokeWidth={2.6} />
              <g className={shifty ? 'toon-shifty' : undefined}>
                <circle cx={cx + (m === 'worried' ? 1 : 0)} cy={m === 'worried' ? 42 : 39} r={pr} fill={INK} />
                <circle cx={cx - 1.4} cy="37" r="1.5" fill={C.jasmine} />
              </g>
            </g>
          ))
        )}
        {look.glasses === 'round' && (
          <g fill="rgba(255,243,214,.22)" stroke={INK} strokeWidth={2.8}>
            <circle cx="41" cy="38" r="11.5" />
            <circle cx="59" cy="38" r="11.5" />
            <path d="M52 37 Q50 35 48 37" fill="none" />
          </g>
        )}
        {/* nose */}
        <ellipse cx="50" cy="46" rx="4.6" ry="3.8" fill={look.skin} stroke={INK} strokeWidth={2.4} />
        {look.bindi && <circle cx="50" cy="22" r="2.4" fill={C.coral} stroke={INK} strokeWidth={0.8} />}
        <circle cx="35" cy={51 + mo} r="4.2" fill={C.pink} opacity=".35" />
        <circle cx="65" cy={51 + mo} r="4.2" fill={C.pink} opacity=".35" />
        {/* mouth */}
        <g transform={`translate(0 ${mo})`}>
          {m === 'happy' && (
            <>
              <path d="M40 54 Q50 68 60 54 Q50 58 40 54Z" fill={C.maroon} stroke={INK} strokeWidth={2.8} strokeLinejoin="round" />
              <path d="M45 61 Q50 64 55 61" fill="none" stroke={C.coral} strokeWidth={2} />
            </>
          )}
          {m === 'worried' && <path d="M42 60 Q50 52 58 60" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />}
          {m === 'surprised' && <ellipse cx="50" cy="59" rx="5" ry="7" fill={C.maroon} stroke={INK} strokeWidth={2.8} />}
          {m === 'sly' && (
            <>
              <path d="M39 57 Q52 64 62 52" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
              <path d="M54 60 l1 4 l3 -4" fill={C.jasmine} stroke={INK} strokeWidth={1.4} />
            </>
          )}
        </g>
        {look.moustache && (
          <path d="M36 52 Q43 45 50 51 Q57 45 64 52 Q57 57 50 54 Q43 57 36 52Z" fill={look.hair} stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
        )}
      </g>
    </svg>
  )
}
