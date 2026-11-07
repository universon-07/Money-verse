import { memo, useId, type ReactNode } from 'react'
import raw from '../content/island.json'
import { NODES, PALETTE as P, PATHS, WORLD, nodeById, px, smoothD, type NodeId } from './data'
import { useLite } from '../store/game'

const INK = P.ink
const W = 1.5 // thin ink line

/* ------------------------------------------------------------------ isometric helpers (2:1) */

interface BoxProps { x: number; y: number; w: number; d: number; h: number; top: string; left: string; right: string; sw?: number }
/** base-front corner at (x,y); width runs right-up, depth runs left-up */
function Box({ x, y, w, d, h, top, left, right, sw = W }: BoxProps) {
  const B = [x, y], R = [x + w, y - w / 2], L = [x - d, y - d / 2], K = [x + w - d, y - w / 2 - d / 2]
  const up = (p: number[]) => `${p[0]},${p[1] - h}`
  const pt = (p: number[]) => `${p[0]},${p[1]}`
  return (
    <g strokeLinejoin="round" stroke={INK} strokeWidth={sw}>
      <polygon points={`${pt(L)} ${pt(B)} ${up(B)} ${up(L)}`} fill={left} />
      <polygon points={`${pt(B)} ${pt(R)} ${up(R)} ${up(B)}`} fill={right} />
      <polygon points={`${up(L)} ${up(B)} ${up(R)} ${up(K)}`} fill={top} />
    </g>
  )
}

const Awning = ({ x, y, w, a, b, n = 5 }: { x: number; y: number; w: number; a: string; b: string; n?: number }) => {
  // striped awning on the right-front face (runs right-up)
  const sw = w / n
  return (
    <g strokeLinejoin="round" stroke={INK} strokeWidth={1.2}>
      {Array.from({ length: n }, (_, i) => {
        const x0 = x + i * sw, x1 = x0 + sw
        return <polygon key={i} points={`${x0},${y - i * sw / 2} ${x1},${y - (i + 1) * sw / 2} ${x1 + 6},${y - (i + 1) * sw / 2 + 22} ${x0 + 6},${y - i * sw / 2 + 22}`} fill={i % 2 ? b : a} />
      })}
    </g>
  )
}

const Tree = ({ x, y, s = 1, tone = 0 }: { x: number; y: number; s?: number; tone?: number }) => {
  const c = [P.green, P.sage, '#6FA55A'][tone % 3]
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke={INK} strokeWidth={W} strokeLinejoin="round">
      <ellipse cx="0" cy="4" rx="34" ry="11" fill={INK} opacity=".14" stroke="none" />
      <path d="M-5 2 L-3 -34 H5 L7 2Z" fill="#8A6A52" />
      <circle cx="-14" cy="-52" r="26" fill={c} />
      <circle cx="16" cy="-56" r="24" fill={c} />
      <circle cx="0" cy="-72" r="26" fill={c} />
      <path d="M-22 -62 q10 -14 24 -10" fill="none" stroke="#fff" opacity=".28" strokeWidth="5" strokeLinecap="round" />
    </g>
  )
}

const Boulder = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} stroke={INK} strokeWidth={W} strokeLinejoin="round">
    <ellipse cx="0" cy="4" rx="46" ry="12" fill={INK} opacity=".14" stroke="none" />
    <path d="M-44 0 Q-40 -34 -12 -42 Q20 -50 40 -22 Q50 -6 44 2 Z" fill={P.granite} />
    <path d="M-12 -42 Q20 -50 40 -22 Q22 -30 4 -24 Q-10 -30 -12 -42Z" fill={P.granite2} />
    <path d="M-30 -12 q8 4 14 -2" fill="none" stroke={P.green} strokeWidth="4" opacity=".6" strokeLinecap="round" />
  </g>
)

const Lamp = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x} ${y})`} stroke={INK} strokeWidth={W} strokeLinejoin="round">
    <ellipse cx="0" cy="2" rx="12" ry="4" fill={INK} opacity=".16" stroke="none" />
    <path d="M-3 0 L-2 -56 H2 L3 0Z" fill="#6E6A66" />
    <path d="M-9 -58 L-6 -72 H6 L9 -58Z" fill="#D9C58A" />
    <circle cx="0" cy="-64" r="3" fill="#FFF4C8" stroke="none" />
  </g>
)

const Figure = ({ x, y, c }: { x: number; y: number; c: string }) => (
  <g transform={`translate(${x} ${y})`} stroke={INK} strokeWidth={1.2} strokeLinejoin="round">
    <ellipse cx="0" cy="2" rx="9" ry="3" fill={INK} opacity=".18" stroke="none" />
    <path d="M-6 0 L-5 -22 H5 L6 0Z" fill={c} />
    <circle cx="0" cy="-29" r="7" fill="#B9825A" />
  </g>
)

const Marigold = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x} ${y})`} stroke={INK} strokeWidth={1}>
    {[[-12, 0], [0, -6], [12, 0], [-5, 7], [7, 7]].map(([a, b], i) => <circle key={i} cx={a} cy={b} r="7" fill={i % 2 ? P.ochre : '#E8862F'} />)}
  </g>
)

const Wall = ({ pts }: { pts: number[][] }) => (
  <g>
    <path d={smoothD(pts)} fill="none" stroke={INK} strokeWidth="19" strokeLinecap="round" />
    <path d={smoothD(pts)} fill="none" stroke={P.stone} strokeWidth="14" strokeLinecap="round" />
    <path d={smoothD(pts)} fill="none" stroke={P.stoneShade} strokeWidth="3" strokeDasharray="14 10" strokeLinecap="round" opacity=".8" />
  </g>
)

/* ------------------------------------------------------------------ landmarks */

function BangleMarket({ x, y }: { x: number; y: number }) {
  const cols = [P.coral, P.ochre, '#4F9DB5', P.sage, '#C0679A']
  const stall = (dx: number, dy: number, a: string, b: string, k: number) => (
    <g key={k} transform={`translate(${dx} ${dy})`}>
      <Box x={0} y={0} w={74} d={50} h={46} top="#F4E3BC" left="#E3CB98" right="#EED9AA" />
      <Awning x={-2} y={-34} w={80} a={a} b={b} n={5} />
      {cols.map((c, i) => <ellipse key={i} cx={12 + i * 12} cy={-14 - i * 6 + 6} rx="4" ry="7" fill="none" stroke={c} strokeWidth="3.4" />)}
    </g>
  )
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy="12" rx="150" ry="46" fill={INK} opacity=".1" />
      {stall(-96, 14, P.coral, '#F8EBCB', 0)}
      {stall(-10, 38, P.ochre, '#F8EBCB', 1)}
      {stall(58, -16, '#4F9DB5', '#F8EBCB', 2)}
    </g>
  )
}

function Cafe({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="6" cy="14" rx="120" ry="38" fill={INK} opacity=".1" />
      <Box x={0} y={0} w={122} d={92} h={84} top="#E08A5A" left="#F0DAA6" right="#F6E6BC" />
      <path d="M26 -8 V-46 Q26 -62 44 -62 Q62 -62 62 -46 V-8Z" transform="translate(6 -14)" fill="#4A3A34" stroke={INK} strokeWidth={W} />
      <Awning x={0} y={-60} w={124} a={P.green} b="#F8EBCB" n={6} />
      <path d="M70 -62 H100 L98 -48 H72Z" fill="#E9DEC2" stroke={INK} strokeWidth={1.2} />
      <ellipse cx="-30" cy="22" rx="20" ry="8" fill="#F1E8D4" stroke={INK} strokeWidth={W} />
      <ellipse cx="34" cy="34" rx="20" ry="8" fill="#F1E8D4" stroke={INK} strokeWidth={W} />
      <path d="M-30 22 v22 M34 34 v22" stroke={INK} strokeWidth="3" />
      <g transform="translate(96 -30)" stroke={INK} strokeWidth={W} strokeLinejoin="round">
        <path d="M-9 0 Q-11 -16 0 -18 Q11 -16 9 0Z" fill={P.ochre} />
        <path d="M9 -8 q10 -2 12 -12" fill="none" />
        <path className="idle steam" d="M0 -22 q-5 -8 0 -14 q5 -6 0 -12" fill="none" stroke="#fff" strokeWidth="2.4" opacity=".8" strokeLinecap="round" />
      </g>
    </g>
  )
}

function PearlShop({ x, y, glow }: { x: number; y: number; glow: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="4" cy="14" rx="110" ry="34" fill={INK} opacity=".1" />
      <Box x={0} y={0} w={112} d={90} h={98} top="#D9B98A" left="#F3E2B8" right="#F8EBCB" />
      <path d="M26 -2 V-52 Q26 -72 44 -72 Q62 -72 62 -52 V-2Z" transform="translate(8 -2)" fill="#4A3A34" stroke={INK} strokeWidth={W} />
      <rect x="76" y="-76" width="20" height="26" rx="4" fill={glow ? '#FFEFB5' : '#F2E6B8'} stroke={INK} strokeWidth={W} transform="skewY(-26.5)" />
      {glow && <circle cx="86" cy="-86" r="26" fill="#FFF0B0" opacity=".28" />}
      <g transform="translate(-36 -112)" stroke={INK} strokeWidth={W} strokeLinecap="round">
        <path d="M0 0 v16 M-14 8 H14" fill="none" stroke="#B08A2E" strokeWidth="3" />
        <path d="M-14 8 l-5 12 h10z M14 8 l-5 12 h10z" fill="#E1C766" />
        <circle cx="0" cy="-3" r="3.4" fill="#fff" />
      </g>
    </g>
  )
}

export function Kiosk({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="2" cy="12" rx="90" ry="28" fill={INK} opacity=".1" />
      <Box x={0} y={0} w={84} d={62} h={70} top="#6FB5AE" left="#B9E0D6" right="#CDEBE0" />
      <rect x="10" y="-52" width="52" height="34" rx="3" fill="#3C4A52" stroke={INK} strokeWidth={W} transform="skewY(-26.5)" />
      <g transform="translate(36 -42)">
        <rect x="-8" y="-14" width="16" height="26" rx="3" fill="#F8EBCB" stroke={INK} strokeWidth={1.2} transform="skewY(-26.5)" />
      </g>
      <path d="M-4 -78 H64 L58 -68 H2Z" fill={P.terracotta} stroke={INK} strokeWidth={W} strokeLinejoin="round" />
      <g transform="translate(94 -30)">
        <circle r="14" fill={P.coral} stroke={INK} strokeWidth={W} />
        <text y="6" textAnchor="middle" fontSize="19" fontWeight="800" fill="#FFF3D6" fontFamily="Noto Sans, sans-serif">!</text>
      </g>
    </g>
  )
}

function CharminarPlaza({ x, y }: { x: number; y: number }) {
  const mina = (cx: number, base: number, h: number, w: number) => (
    <g key={cx} stroke={INK} strokeWidth={W} strokeLinejoin="round">
      <path d={`M${cx - w} ${base} L${cx - w * 0.7} ${base - h} H${cx + w * 0.7} L${cx + w} ${base}Z`} fill="#EFE3C6" />
      <path d={`M${cx - w} ${base} L${cx - w * 0.7} ${base - h} H${cx - 2} V${base}Z`} fill="#D9CCAA" opacity=".7" />
      {[0.3, 0.55, 0.8].map((k) => <rect key={k} x={cx - w * 1.05} y={base - h * k} width={w * 2.1} height="6" rx="3" fill="#EFE3C6" />)}
      <rect x={cx - w * 1.1} y={base - h - 12} width={w * 2.2} height="14" rx="3" fill="#E4D5B2" />
      <path d={`M${cx - w * 0.9} ${base - h - 12} Q${cx} ${base - h - 40} ${cx + w * 0.9} ${base - h - 12}Z`} fill="#F8EBCB" />
      <circle cx={cx} cy={base - h - 40} r="4" fill={P.gold} />
    </g>
  )
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* round paved plaza with a few steps */}
      <ellipse cx="0" cy="62" rx="330" ry="150" fill={INK} opacity=".14" />
      <ellipse cx="0" cy="46" rx="318" ry="146" fill={P.stoneShade} stroke={INK} strokeWidth={W} />
      <ellipse cx="0" cy="36" rx="318" ry="146" fill={P.stone} stroke={INK} strokeWidth={W} />
      <ellipse cx="0" cy="36" rx="236" ry="108" fill="none" stroke={P.stoneShade} strokeWidth="3" strokeDasharray="18 12" />
      <ellipse cx="0" cy="36" rx="150" ry="68" fill="none" stroke={P.stoneShade} strokeWidth="3" />
      <path d="M-70 134 H70 M-86 144 H86" stroke={INK} strokeWidth={W} opacity=".4" />
      {/* the monument, small but unmistakable */}
      <g>
        <path d="M-120 20 H120 V-30 H-120Z" fill="#EFE3C6" stroke={INK} strokeWidth={W} />
        <path d="M-120 20 H-40 V-30 H-120Z" fill="#D9CCAA" opacity=".6" />
        {[-98, -64, -30, 30, 64, 98].map((c) => <path key={c} d={`M${c - 9} 20 V-4 Q${c} -18 ${c + 9} -4 V20Z`} fill="#6D5A50" stroke={INK} strokeWidth="1.2" />)}
        <path d="M-34 20 V-24 Q0 -58 34 -24 V20Z" fill="#4C3F3A" stroke={INK} strokeWidth={W} />
        <path d="M-120 -30 H120" stroke={INK} strokeWidth={W} />
        {[-100, -80, -60, -40, -20, 0, 20, 40, 60, 80, 100].map((c) => <path key={c} d={`M${c - 8} -30 L${c} -42 L${c + 8} -30Z`} fill="#EFE3C6" stroke={INK} strokeWidth="1" />)}
        {mina(-122, 26, 150, 12)}
        {mina(122, 26, 150, 12)}
        <path d="M-26 -42 Q0 -86 26 -42Z" fill="#F8EBCB" stroke={INK} strokeWidth={W} />
        <circle cx="0" cy="-86" r="4" fill={P.gold} />
      </g>
    </g>
  )
}

function Dock({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke={INK} strokeWidth={W} strokeLinejoin="round">
      <polygon points="0,0 120,-60 150,-45 30,15" fill="#B58B5E" />
      <polygon points="0,0 30,15 30,28 0,13" fill="#8E6A46" />
      <polygon points="30,15 150,-45 150,-32 30,28" fill="#9C7650" />
      {[20, 50, 80, 110].map((t) => <path key={t} d={`M${t} ${-t / 2 + 8} l14 7`} stroke="#8E6A46" strokeWidth="2" fill="none" />)}
      <g transform="translate(138 -42)"><rect x="-4" y="-18" width="8" height="18" rx="3" fill="#6B5848" /></g>
      <g className="idle bob" transform="translate(120 -2)">
        <path d="M-34 0 Q0 22 38 -2 L30 -10 H-26Z" fill="#D8683A" />
        <path d="M-26 -10 H30" stroke="#F8EBCB" strokeWidth="4" />
      </g>
    </g>
  )
}

export function Gate({ x, y, open }: { x: number; y: number; open: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy="12" rx="120" ry="34" fill={INK} opacity=".12" />
      <Box x={-52} y={0} w={34} d={34} h={110} top="#C9BFA4" left="#D9CFB3" right="#E6DCBF" />
      <Box x={52} y={0} w={34} d={34} h={110} top="#C9BFA4" left="#D9CFB3" right="#E6DCBF" />
      <path d="M-86 -92 Q0 -170 86 -92 V-72 Q0 -150 -86 -72Z" fill="#E6DCBF" stroke={INK} strokeWidth={W} strokeLinejoin="round" />
      <path d="M-52 0 V-70 Q0 -126 52 -70 V0Z" fill={open ? '#FFEFB5' : '#4A403C'} stroke={INK} strokeWidth={W} opacity={open ? 0.95 : 0.7} />
      {open && <path d="M-52 0 V-70 Q0 -126 52 -70 V0Z" fill="#FFE9A0" opacity=".5" />}
      <path d="M0 -150 V-200" stroke={INK} strokeWidth="3" />
      <path className="idle sway" d="M0 -200 H40 L30 -186 L40 -172 H0Z" fill={open ? P.gold : '#E9E1CC'} stroke={INK} strokeWidth={W} strokeLinejoin="round" />
    </g>
  )
}

/* ------------------------------------------------------------------ the island */

interface Props { done: NodeId[]; allDone: boolean; className?: string }

export const IslandArt = memo(function IslandArt({ done, allDone, className }: Props) {
  const id = useId().replace(/:/g, '')
  const lite = useLite()
  const sil = smoothD(raw.silhouette, true)
  const A = (nid: NodeId) => { const n = nodeById(nid); return px([n.art.x, n.art.y]) }
  const T = (p: number[]) => px(p)

  const props: { k: string; depth: number; el: ReactNode }[] = []
  const add = (k: string, p: number[], el: ReactNode) => props.push({ k, depth: p[0] + p[1], el })
  raw.trees.forEach((t, i) => { const [x, y] = T(t); add(`t${i}`, t, <Tree key={`t${i}`} x={x} y={y} s={0.95 + (i % 3) * 0.12} tone={i} />) })
  raw.boulders.forEach((t, i) => { const [x, y] = T(t); add(`b${i}`, t, <Boulder key={`b${i}`} x={x} y={y} s={0.8 + (i % 3) * 0.2} />) })
  raw.lamps.forEach((t, i) => { const [x, y] = T(t); add(`l${i}`, t, <Lamp key={`l${i}`} x={x} y={y} />) })
  raw.marigolds.forEach((t, i) => { const [x, y] = T(t); add(`m${i}`, t, <Marigold key={`m${i}`} x={x} y={y} />) })
  raw.figures.forEach((t, i) => { const [x, y] = T(t); add(`f${i}`, t, <Figure key={`f${i}`} x={x} y={y} c={[P.coral, '#4F9DB5', P.ochre, P.sage][i % 4]} />) })
  const mk = (nid: NodeId, el: (x: number, y: number) => ReactNode, k = 1.5) => { const n = nodeById(nid); const [x, y] = A(nid); add(nid, [n.art.x, n.art.y], <g key={`s-${nid}`} transform={`translate(${x} ${y}) scale(${k}) translate(${-x} ${-y})`}>{el(x, y)}</g>) }
  mk('plan', (x, y) => <BangleMarket key="plan" x={x} y={y} />)
  mk('save', (x, y) => <Cafe key="save" x={x} y={y} />)
  mk('invest', (x, y) => <PearlShop key="invest" x={x} y={y} glow={done.includes('invest') || true} />)
  mk('safe', (x, y) => <Kiosk key="safe" x={x} y={y} />)
  mk('plaza', (x, y) => <CharminarPlaza key="plaza" x={x} y={y} />, 1.25)
  props.sort((a, b) => a.depth - b.depth)

  const [gx, gy] = A('gate')
  const pathDs = PATHS.map((p) => ({ id: p.id, d: smoothD(p.pts), gate: p.to === 'gate' }))

  return (
    <svg viewBox={`0 0 ${WORLD.w} ${WORLD.h}`} width={WORLD.w} height={WORLD.h} className={className} style={{ display: 'block', overflow: 'visible' }} aria-hidden>
      <defs>
        {!lite && (
          <filter id={`${id}-w`} x="-2%" y="-2%" width="104%" height="104%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="7" />
            <feDisplacementMap in="SourceGraphic" scale="9" />
          </filter>
        )}
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#B9CF78" /><stop offset="1" stopColor={P.sage} />
        </linearGradient>
        <clipPath id={`${id}-land`}><path d={sil} /></clipPath>
        <radialGradient id={`${id}-sun`} cx="0.22" cy="0.12" r="0.85">
          <stop offset="0" stopColor="#FFE9A8" stopOpacity=".55" /><stop offset=".5" stopColor="#FFD27A" stopOpacity=".12" /><stop offset="1" stopColor="#D9683A" stopOpacity=".1" />
        </radialGradient>
      </defs>

      {/* water */}
      <rect x="-1200" y="-1000" width="4800" height="4000" fill={P.water} />
      <rect x="-1200" y="1300" width="4800" height="1700" fill={P.water2} opacity=".35" />
      {[[8, 20, 220], [86, 12, 200], [70, 96, 260], [14, 94, 200], [93, 78, 180], [4, 36, 160]].map(([x, y, w], i) => (
        <path key={i} className="idle twinkle" style={{ animationDelay: `${i * 0.4}s` }} d={`M${px([x, y])[0]} ${px([x, y])[1]} q${w / 4} -14 ${w / 2} 0 t${w / 2} 0`} fill="none" stroke="#fff" strokeWidth="3" opacity=".6" strokeLinecap="round" />
      ))}
      {/* two tiny islets */}
      {[[93, 90, 1], [3, 12, 0.8]].map(([x, y, s], i) => (
        <g key={i} transform={`translate(${px([x, y])[0]} ${px([x, y])[1]}) scale(${s})`} stroke={INK} strokeWidth={W}>
          <ellipse cx="0" cy="30" rx="80" ry="22" fill={P.rock2} />
          <ellipse cx="0" cy="14" rx="80" ry="22" fill={P.sage} />
          <circle cx="-10" cy="-8" r="20" fill={P.green} />
        </g>
      ))}

      <g filter={lite ? undefined : `url(#${id}-w)`}>
        {/* soft shadow of the island on the water */}
        <path d={sil} transform="translate(26 150)" fill="#3F8AA3" opacity=".22" />
        <path d={sil} transform="translate(14 112)" fill="#3F8AA3" opacity=".2" />
        {/* cliff: layered rock with moss */}
        {[[0, 96, P.rock2], [0, 66, P.rock], [0, 38, '#C29A7E']].map(([x, y, c], i) => (
          <path key={i} d={sil} transform={`translate(${x} ${y})`} fill={c as string} stroke={INK} strokeWidth={W} strokeLinejoin="round" />
        ))}
        <g clipPath={`url(#${id}-land)`} />
        {Array.from({ length: 26 }, (_, i) => {
          const t = i / 26
          const a = t * Math.PI * 2
          const cx = 1200 + Math.cos(a) * 1000, cy = 1010 + Math.sin(a) * 800 + 90
          return cy > 1000 ? <ellipse key={i} cx={cx} cy={cy} rx="26" ry="9" fill={P.green} opacity=".55" /> : null
        })}
        {/* the land */}
        <path d={sil} fill={`url(#${id}-g)`} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        <path d={sil} fill={`url(#${id}-sun)`} />
        <path d={sil} transform="translate(0 -6)" fill="none" stroke="#fff" strokeOpacity=".25" strokeWidth="6" strokeLinejoin="round" />

        {/* raised granite ledge for the college gate + short stair */}
        <g stroke={INK} strokeWidth={W} strokeLinejoin="round">
          <path d={`M${gx - 340} ${gy + 70} L${gx - 270} ${gy - 70} Q${gx} ${gy - 130} ${gx + 270} ${gy - 70} L${gx + 340} ${gy + 70} Q${gx} ${gy + 130} ${gx - 340} ${gy + 70}Z`} fill={P.granite2} />
          <path d={`M${gx - 340} ${gy + 70} Q${gx} ${gy + 130} ${gx + 340} ${gy + 70} V${gy + 120} Q${gx} ${gy + 190} ${gx - 340} ${gy + 120}Z`} fill={P.granite} />
          <path d={`M${gx - 250} ${gy + 52} L${gx - 200} ${gy - 36} Q${gx} ${gy - 80} ${gx + 200} ${gy - 36} L${gx + 250} ${gy + 52} Q${gx} ${gy + 100} ${gx - 250} ${gy + 52}Z`} fill={P.stone} />
        </g>

        {/* paths: ink edge, cream stone, soft centre line */}
        {pathDs.map((p) => (
          <g key={p.id}>
            <path d={p.d} fill="none" stroke={INK} strokeWidth="64" strokeLinecap="round" strokeLinejoin="round" opacity=".85" />
            <path d={p.d} fill="none" stroke={P.stone} strokeWidth="58" strokeLinecap="round" strokeLinejoin="round" />
            <path d={p.d} fill="none" stroke={P.stoneShade} strokeWidth="3" strokeDasharray="2 22" strokeLinecap="round" opacity=".9" />
            {p.gate && allDone && <path className="idle twinkle" d={p.d} fill="none" stroke="#FFE59A" strokeWidth="70" strokeLinecap="round" opacity=".45" />}
          </g>
        ))}
        {/* stair from plaza to ledge */}
        <g stroke={INK} strokeWidth="1.2">
          {[0, 1, 2, 3].map((i) => <path key={i} d={`M${gx - 52 + i * 4} ${gy + 96 + i * 16} H${gx + 52 - i * 4}`} />)}
        </g>

        {/* low stone walls */}
        <Wall pts={[[30, 86], [36, 88], [44, 89]]} />
        <Wall pts={[[58, 88], [66, 86], [72, 83]]} />
        <Wall pts={[[88, 40], [90, 34]]} />
        {/* pond */}
        <g transform={`translate(${px([86, 58])[0]} ${px([86, 58])[1]})`} stroke={INK} strokeWidth={W}>
          <ellipse cx="0" cy="6" rx="92" ry="40" fill={P.stoneShade} />
          <ellipse cx="0" cy="0" rx="86" ry="36" fill="#7FC4D2" />
          <path className="idle twinkle" d="M-40 -2 q12 -8 24 0 M10 8 q12 -8 24 0" fill="none" stroke="#fff" strokeWidth="2.4" opacity=".7" strokeLinecap="round" />
        </g>

        <Dock x={A('dock')[0] - 70} y={A('dock')[1] + 20} />
        <Gate x={gx} y={gy + 10} open={allDone} />
        {props.map((p) => p.el)}
      </g>
    </svg>
  )
})

export { NODES }
