import { useLite } from '../../../store/game'

export interface Layers { hall: boolean; lights: boolean; sound: boolean; stage: boolean; food: boolean; kids: boolean; banner: boolean; safety: boolean; crowd: number }

const SHIRTS = ['#E5457A', '#5BB5D6', '#E8B04A', '#3F7A3A', '#F28C28', '#7A2A22', '#2F6F73']

/** The festival ground, built from layers. A layer shows only if it was bought and is still live, so the picture is the first result. */
export function FestivalScene({ layers: L }: { layers: Layers }) {
  const lite = useLite()
  const heads = Math.min(60, Math.round(L.crowd / 8))
  return (
    <svg viewBox="0 0 360 230" className="block w-full" role="img" aria-hidden style={{ background: '#F7D9A8' }}>
      <rect width="360" height="120" fill="#9FD4E8" />
      <circle cx="320" cy="34" r="16" fill="#FFD25A" />
      <rect y="120" width="360" height="110" fill="#C98552" stroke="#2B1A17" strokeWidth="3" />
      {/* the hall: always there */}
      {L.hall && (
        <g>
          <rect x="24" y="62" width="130" height="62" fill="#F0D9A8" stroke="#2B1A17" strokeWidth="3" />
          <path d="M16 64 L89 28 L162 64Z" fill="#D9632E" stroke="#2B1A17" strokeWidth="3" strokeLinejoin="round" />
          <rect x="76" y="86" width="26" height="38" fill="#7A2A22" stroke="#2B1A17" strokeWidth="2.4" />
          <rect x="36" y="78" width="24" height="22" fill="#FFF3D6" stroke="#2B1A17" strokeWidth="2.4" />
          <rect x="118" y="78" width="24" height="22" fill="#FFF3D6" stroke="#2B1A17" strokeWidth="2.4" />
        </g>
      )}
      {/* posters on the hall wall */}
      {L.banner && (
        <g>
          <path d="M20 18 Q90 40 160 18" fill="none" stroke="#2B1A17" strokeWidth="2" />
          {Array.from({ length: 7 }, (_, i) => <path key={i} d={`M${28 + i * 19} ${26 + Math.sin((i / 6) * Math.PI) * 9} l12 0 l-6 13z`} fill={SHIRTS[i % SHIRTS.length]} stroke="#2B1A17" strokeWidth="1.6" strokeLinejoin="round" />)}
        </g>
      )}
      {/* lights */}
      {L.lights && (
        <g>
          <path d="M0 8 Q180 40 360 8" fill="none" stroke="#2B1A17" strokeWidth="2" />
          {Array.from({ length: 12 }, (_, i) => {
            const x = 14 + i * 30
            const y = 8 + Math.sin((x / 360) * Math.PI) * 18 + 6
            return <g key={i}><circle cx={x} cy={y} r="8" fill="#FFD25A" opacity=".45" className={lite ? undefined : 'anim-twinkle'} /><ellipse cx={x} cy={y} rx="3.6" ry="5" fill="#FFD25A" stroke="#2B1A17" strokeWidth="1.5" /></g>
          })}
        </g>
      )}
      {/* the stage: a platform for the sound, or a bigger stage that was bought */}
      {(L.sound || L.stage) && <g transform="translate(206 84)">
        <rect x="0" y="22" width={L.stage ? 140 : 90} height="22" fill="#7A2A22" stroke="#2B1A17" strokeWidth="3" />
        {L.stage && <rect x="8" y="6" width="124" height="16" fill="#E8B04A" stroke="#2B1A17" strokeWidth="2.4" />}
        {L.sound && [10, L.stage ? 118 : 68].map((x) => <g key={x}><rect x={x} y="-6" width="16" height="28" rx="3" fill="#2B1A17" /><circle cx={x + 8} cy="6" r="4.4" fill="#9C8F80" /><circle cx={x + 8} cy="15" r="2.4" fill="#9C8F80" /></g>)}
      </g>}
      {/* food stall */}
      {L.food && (
        <g transform="translate(22 128)">
          <rect x="0" y="14" width="64" height="30" fill="#F0D9A8" stroke="#2B1A17" strokeWidth="2.6" />
          <path d="M-4 16 H68 L62 0 H2Z" fill="#E5457A" stroke="#2B1A17" strokeWidth="2.6" strokeLinejoin="round" />
          {[10, 26, 42].map((x) => <ellipse key={x} cx={x + 6} cy="28" rx="9" ry="3.6" fill="#FFF3D6" stroke="#2B1A17" strokeWidth="1.6" />)}
        </g>
      )}
      {/* kids' corner */}
      {L.kids && (
        <g transform="translate(104 126)">
          <path d="M4 40 L22 4 L40 40" fill="none" stroke="#2B1A17" strokeWidth="3" strokeLinejoin="round" />
          <path d="M22 4 L56 40" stroke="#5BB5D6" strokeWidth="6" strokeLinecap="round" />
          <circle cx="30" cy="12" r="4" fill="#F28C28" stroke="#2B1A17" strokeWidth="1.6" />
        </g>
      )}
      {/* safety pack */}
      {L.safety && (
        <g transform="translate(176 130)">
          <rect x="0" y="0" width="22" height="22" rx="3" fill="#FFF3D6" stroke="#2B1A17" strokeWidth="2.4" />
          <path d="M11 5 V17 M5 11 H17" stroke="#D8503A" strokeWidth="4" strokeLinecap="round" />
        </g>
      )}
      {/* the crowd: one head for about every 8 visitors */}
      {Array.from({ length: heads }, (_, i) => {
        const row = Math.floor(i / 15)
        const x = 18 + (i % 15) * 22 + (row % 2) * 10
        const y = 170 + row * 14
        return <g key={i}><ellipse cx={x} cy={y + 9} rx="6.5" ry="7" fill={SHIRTS[i % SHIRTS.length]} stroke="#2B1A17" strokeWidth="1.4" /><circle cx={x} cy={y} r="5.2" fill="#C98552" stroke="#2B1A17" strokeWidth="1.4" /></g>
      })}
    </svg>
  )
}
