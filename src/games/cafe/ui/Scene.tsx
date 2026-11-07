import { cloudStage, type Step } from '../engine/flow'
import { stageOf } from '../engine/pressure'
import type { Run } from '../engine/types'

const INK = '#3A2A24'
const ART = '/art'
const C = `${ART}/cafe`

export const CAST = { chacha: `${C}/chacha-idle.webp`, yusuf: `${C}/yusuf-wave.webp` } as const
/** who stands at the window for each offer */
export const VENDOR: Record<string, string> = {
  gamepack: `${C}/vendor-gamepack.webp`,
  jacket: `${C}/vendor-jacket.webp`,
  match: `${C}/vendor-match.webp`,
  cover: `${C}/vendor-cover.webp`,
}
export const GOAL_ART: Record<string, string> = { earphones: `${C}/goal-earphones.webp`, trip: `${C}/goal-trip.webp`, controller: `${C}/goal-controller.webp` }

export interface Player { gender: 'girl' | 'boy'; persona: string | null }
export const playerFace = (p: Player) => `${ART}/avatar/${p.gender}-${p.persona ?? 'school'}-face.webp`

export const CLOUD_NAME = ['far', 'near', 'closer', 'close', 'overhead']
export type Mood = 'neutral' | 'think' | 'talk' | 'worry' | 'relax' | 'phone' | 'happy' | 'read'
/** seated poses per mood. Indexes are columns on the painted seated sheets. */
const SEAT: Record<'girl' | 'boy', Record<Mood, number>> = {
  girl: { neutral: 3, think: 0, talk: 1, worry: 4, relax: 5, phone: 8, happy: 9, read: 6 },
  boy: { neutral: 3, think: 0, talk: 2, worry: 4, relax: 8, phone: 5, happy: 1, read: 0 },
}
export const seatSprite = (p: Player, mood: Mood) => `${C}/seat/${p.gender}-${p.persona ?? 'school'}-${SEAT[p.gender][mood]}.webp`

export interface SceneProps {
  step: Step
  run: Run
  player: Player
  /** 0..1 steam left in each saucer, or null when empty */
  saucers?: [number | null, number | null]
  vendor?: string
  beat?: 'calm' | 'freeze' | 'crack' | 'table' | null
  focus?: 'emergency' | 'spend' | 'save' | 'plates' | 'teja' | 'bottle' | 'cloud' | null
  platesCount?: number
  /** bumps whenever a coin lands in a jar, so the scene can clink */
  pulse?: { jar: 'spend' | 'save' | 'emergency'; n: number } | null
  /** Ammamma's envelope: on the counter, sliding over, or on the table */
  letter?: 'counter' | null
  /** override the cloud stage (the intro) */
  cloudStage?: number | null
  /** the intro plays fizz values on the table bottles */
  demo?: { fun: number; friends: number } | null
  reached?: boolean
  lite?: boolean
}

export function moodFor(step: Step, beat: SceneProps['beat'], reached: boolean): Mood {
  if (beat === 'freeze' || beat === 'crack') return 'worry'
  switch (step) {
    case 'entry': case 'walkin': return 'relax'
    case 'goal': case 'predict1': case 'predict2': case 'worth': case 'bignight': case 'bignight0': return 'think'
    case 'window': case 'teja': return 'talk'
    case 'trolley': return 'phone'
    case 'rain': return beat === 'table' ? 'think' : 'neutral'
    case 'pay': return 'worry'
    case 'tally': case 'thennow': case 'onechange': return reached ? 'happy' : 'think'
    default: return 'neutral'
  }
}

/** every bottle-*.webp shares one canvas (w / h), cut by tools/cut_bottles.py: the glass stands bottom-centre, the popped stage's splash fits inside */
const BOTTLE_ASPECT = 218 / 220

/**
 * A ramune bottle on the table. It grows and leans toward the edge as it fills (five painted stages, never a number),
 * glows and bobs a warning when it is nearly full, and at the top it tips off the table onto the floor.
 */
export function Bottle({ x, y, v, kind, h = 46, lite }: { x: number; y: number; v: number; kind: 'fun' | 'friends'; h?: number; lite?: boolean }) {
  const s = stageOf(v)
  const w = h * BOTTLE_ASPECT
  const k = [1, 1.12, 1.3, 1.5, 1.5][s]
  const tilt = [0, 2, 6, 14, 0][s]
  const nudge = [0, 0, 2, 8, 0][s]
  const alert = s >= 3 && s < 4
  const src = `${C}/bottle-${kind}-${s}.webp`
  if (s === 4) {
    return (
      <g transform={`translate(${x} ${y})`}>
        <g className="cafe-tipover">
          <image href={src} x={-w / 2} y={-h} width={w} height={h} />
        </g>
        {!lite && <circle className="cafe-marble-roll" cx={26} cy={70} r={3.4} fill="#BFE3F0" stroke={INK} strokeWidth="1" />}
      </g>
    )
  }
  return (
    <g transform={`translate(${x + nudge} ${y})`}>
      {s >= 2 && !lite && <ellipse className={`cafe-alertring ${alert ? 'is-hot' : ''}`} cx={0} cy={-h * 0.55} rx={h * 0.76} ry={h * 0.62} fill="none" stroke={alert ? '#D8503A' : '#F0B04A'} strokeWidth="2" />}
      <g style={{ transformBox: 'fill-box', transformOrigin: '50% 100%', transform: `rotate(${tilt}deg) scale(${k})`, transition: 'transform .7s cubic-bezier(.3,1.4,.5,1)' }}>
        <g className={alert ? 'cafe-shiver' : s === 2 ? 'cafe-sway' : undefined}>
          <image href={src} x={-w / 2} y={-h} width={w} height={h} />
        </g>
      </g>
      {alert && (
        <g className="cafe-bang" transform={`translate(0 ${-h * k - 6})`}>
          <circle r="7" fill="#D8503A" stroke={INK} strokeWidth="1.3" />
          <text y="3.6" textAnchor="middle" fontSize="10" fontWeight="900" fill="#fff">!</text>
        </g>
      )}
    </g>
  )
}

/** the five painted storm clouds: the same cloud, closer and darker every part of the month */
const CLOUD_ASPECT = [239 / 371, 310 / 424, 307 / 440, 362 / 440, 410 / 440]
const CLOUD_H = [30, 40, 50, 62, 78]
function Cloud({ stage, big }: { stage: number; big?: boolean }) {
  const h = big ? 104 : CLOUD_H[stage]
  const w = h * CLOUD_ASPECT[stage]
  const x = big ? 20 : 74 - w / 2
  const y = big ? 8 : 38 + (4 - stage) * 2
  return <image href={`${C}/cloud-${stage}.webp`} x={x} y={y} width={w} height={h} preserveAspectRatio="xMidYMid meet" className="cafe-drift" />
}

/** Ammamma's envelope: cream, a red seal, notes peeking out */
function Envelope({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="cafe-bob cafe-pop">
        <rect x="-4" y="-16" width="30" height="16" rx="1.5" fill="#7DB36B" stroke={INK} strokeWidth="1.2" transform="rotate(-8 10 -8)" />
        <rect x="2" y="-18" width="30" height="16" rx="1.5" fill="#8CC07A" stroke={INK} strokeWidth="1.2" transform="rotate(4 15 -10)" />
        <rect x="-8" y="-12" width="52" height="30" rx="2.5" fill="#FBF0D2" stroke={INK} strokeWidth="1.8" />
        <path d="M-8 -12 L18 8 L44 -12" fill="#F3E2B6" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
        <circle cx="18" cy="6" r="5" fill="#C8604A" stroke={INK} strokeWidth="1.3" />
        <text x="18" y="9" textAnchor="middle" fontSize="7" fontWeight="900" fill="#FFF7E6">₹</text>
      </g>
    </g>
  )
}

export function Scene({ step, run, player, saucers = [null, null], vendor, beat = null, focus = null, platesCount = 0, pulse = null, demo = null, letter = null, cloudStage: cloudOver = null, reached = false, lite }: SceneProps) {
  const fz = demo ?? run.fizz
  const bg = lite ? `${ART}/cafe-interior-lite.webp` : `${ART}/cafe-interior.webp`
  const stage = cloudOver ?? cloudStage(step)
  const raining = step === 'pay' || step === 'pay2' || (step === 'rain' && beat !== 'calm')
  const flash = step === 'rain' && beat === 'freeze'
  const cracked = (step === 'rain' && (beat === 'crack' || beat === 'table')) || step === 'pay' || step === 'pay2' || step === 'tally'
  const phoneOff = step === 'rain' && beat !== 'calm' && beat !== null
  const lent = run.lent
  const dim = (k: SceneProps['focus']) => (focus && focus !== k ? 0.35 : 1)
  const glow = (k: SceneProps['focus']) => (focus === k ? 'url(#cafe-glow)' : undefined)
  const showTeja = step === 'teja' || (focus === 'teja' && lent > 0)
  const chachaPose = beat === 'freeze' || beat === 'crack' ? 'shock' : ['predict1', 'predict2', 'worth', 'bignight', 'bignight0'].includes(step) ? 'think' : 'idle'
  const mood = moodFor(step, beat, reached)
  const env = letter
  const clink = (j: 'spend' | 'save' | 'emergency') => (pulse?.jar === j ? 'cafe-clink' : undefined)
  const umbrellaOpen = raining && (run.rainPaid.emergency ?? 0) > 0
  return (
    <svg viewBox="0 0 480 270" className="cafe-svg" role="img" aria-label="Café Meherban">
      <defs>
        <clipPath id="cafe-win"><path d="M17 36 H95 V168 H17 Z M100 70 H117 V166 H100 Z" /></clipPath>
        <clipPath id="cafe-counter"><path d="M357 168 H480 V270 H357 Z" /></clipPath>
        <filter id="cafe-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#FFE9A8" floodOpacity="1" />
        </filter>
        <radialGradient id="cafe-shadow"><stop offset="0" stopColor="#000" stopOpacity=".35" /><stop offset="1" stopColor="#000" stopOpacity="0" /></radialGradient>
      </defs>
      <image href={bg} width="480" height="270" preserveAspectRatio="xMidYMid slice" />

      {/* the window and the street */}
      <g clipPath="url(#cafe-win)">
        {(raining || stage >= 3) && <rect width="120" height="170" fill={raining ? '#40566A' : '#6F8796'} opacity={raining ? 0.3 : 0.22} />}
        <Cloud stage={stage} />
        {raining && !lite && (
          <g className="cafe-rain">
            {[20, 72, 124].map((y) => <image key={y} href={`${C}/rain.webp`} x={-10} y={y} width={150} height={52} preserveAspectRatio="xMidYMid slice" opacity=".9" />)}
          </g>
        )}
        {vendor && VENDOR[vendor] && <image key={vendor} href={VENDOR[vendor]} x={20} y={86} height={84} width={78} preserveAspectRatio="xMidYMax meet" className="cafe-pop" />}
      </g>
      {focus === 'cloud' && (
        <g filter="url(#cafe-glow)" className="cafe-cloudhl">
          <Cloud stage={stage} big />
        </g>
      )}
      {flash && <rect width="480" height="270" fill="#FFFFFF" opacity=".55" className="cafe-flash" />}
      {flash && <image href={`${C}/lightning.webp`} x={34} y={30} width={60} height={90} preserveAspectRatio="xMidYMid meet" className="cafe-flash" />}

      {/* the gullak (Save) on the high shelf */}
      <g opacity={dim('save')} filter={glow('save')}>
        <image href={`${C}/gullak.webp`} x={252} y={18} width={52} height={48} preserveAspectRatio="xMidYMax meet" className={clink('save') ?? (focus === 'save' ? 'cafe-rattle' : undefined)} />
        {pulse?.jar === 'save' && <image key={pulse.n} href={`${C}/coin.webp`} x={272} y={-6} width="11" height="11" className="cafe-drop" />}
      </g>
      {/* the goal pinned to the cork board */}
      <g transform="rotate(-3 378 106)">
        <rect x="361" y="92" width="34" height="30" rx="1.5" fill="#FBF0D2" stroke={INK} strokeWidth="1.2" />
        <circle cx="378" cy="94" r="1.8" fill="#C8604A" />
        <image href={GOAL_ART[run.goal]} x={366} y={94} width={24} height={20} preserveAspectRatio="xMidYMid meet" />
        <text x="378" y="120" textAnchor="middle" fontSize="7.5" fontWeight="800" fill={INK}>₹250</text>
      </g>

      {/* Chacha behind the counter */}
      <image href={`${C}/chacha-${chachaPose}.webp`} x={368} y={52} height={124} width={89} preserveAspectRatio="xMidYMin meet" className={chachaPose === 'shock' ? 'cafe-rattle' : 'cafe-breathe'} />
      <image href={bg} width="480" height="270" preserveAspectRatio="xMidYMid slice" clipPath="url(#cafe-counter)" />

      {/* the umbrella stand by the door (Emergency) */}
      <g opacity={dim('emergency')} filter={glow('emergency')} className={clink('emergency')}>
        {umbrellaOpen
          ? <image href={`${C}/umbrella-open.webp`} x={112} y={158} width={90} height={100} preserveAspectRatio="xMidYMax meet" className="cafe-pop" />
          : <image href={`${C}/umbrella-closed.webp`} x={136} y={166} width={30} height={92} preserveAspectRatio="xMidYMax meet" />}
        {pulse?.jar === 'emergency' && <image key={pulse.n} href={`${C}/coin.webp`} x={146} y={150} width="11" height="11" className="cafe-drop" />}
      </g>

      {/* Teja, while he is here */}
      {showTeja && (
        <g opacity={dim('teja')} filter={glow('teja')} className="cafe-pop">
          <ellipse cx="96" cy="258" rx="24" ry="5" fill="url(#cafe-shadow)" />
          <image href={`${C}/teja-${step === 'teja' ? 'wave' : 'thumbs'}.webp`} x={64} y={150} height={108} width={64} preserveAspectRatio="xMidYMax meet" />
        </g>
      )}

      {/* the player, seated at the table */}
      <ellipse cx="236" cy="260" rx="30" ry="5" fill="url(#cafe-shadow)" />
      <image key={mood} href={seatSprite(player, mood)} x={200} y={158} height={104} width={72} preserveAspectRatio="xMidYMax meet" className="cafe-swap" />

      {/* the bistro table */}
      <image href={`${C}/bistro-table.webp`} x={262} y={174} width={96} height={95} preserveAspectRatio="xMidYMax meet" />
      <image href={`${C}/bistro-chair-r.webp`} x={350} y={188} width={46} height={72} preserveAspectRatio="xMidYMax meet" opacity=".95" />

      {/* on the table: Ammamma's envelope until payday is split */}
      {env === 'counter' && <g transform="translate(386 164) scale(1.15) translate(-18 -2)"><Envelope x={0} y={0} /></g>}
      {/* the tumbler (Spend) */}
      <g opacity={dim('spend')} filter={glow('spend')} className={clink('spend')}>
        <image href={`${C}/tumbler.webp`} x={270} y={166} width={22} height={24} preserveAspectRatio="xMidYMax meet" />
        {pulse?.jar === 'spend' && <image key={pulse.n} href={`${C}/coin.webp`} x={276} y={150} width="11" height="11" className="cafe-drop" />}
      </g>
      {/* two saucers for cooling */}
      {saucers.map((s, i) => (
        <g key={i} transform={`translate(${300 + i * 26} 186)`}>
          {s !== null
            ? <image href={`${C}/chai-saucer.webp`} x={-14} y={-18} width={28} height={25} preserveAspectRatio="xMidYMax meet" />
            : <image href={`${C}/saucer.webp`} x={-13} y={-6} width={26} height={13} preserveAspectRatio="xMidYMax meet" />}
          {s !== null && s > 0 && <path className="cafe-steam" d="M0 -20 q-4 -6 0 -11 q4 -5 0 -10" fill="none" stroke="#fff" strokeWidth={1 + s * 2} opacity={0.3 + s * 0.6} strokeLinecap="round" />}
        </g>
      ))}
      {/* the phone */}
      {!phoneOff || cracked
        ? <image href={`${C}/${cracked ? 'phone-cracked' : 'phone'}.webp`} x={cracked ? 238 : 330} y={cracked ? 248 : 176} width={32} height={22} preserveAspectRatio="xMidYMax meet" className={cracked ? 'cafe-fall' : undefined} />
        : <image href={`${C}/phone.webp`} x={330} y={176} width={32} height={22} className="cafe-slide" />}
      {/* the fizz bottles: they sit at the table's edge so a full one can tip off it */}
      <g opacity={dim('bottle')} filter={glow('bottle')}>
        <Bottle x={340} y={191} v={fz.fun} kind="fun" h={42} lite={lite} />
        <Bottle x={358} y={192} v={fz.friends} kind="friends" h={36} lite={lite} />
      </g>
      {/* the little things: a plate for each */}
      {platesCount > 0 && (
        <g opacity={dim('plates')} filter={glow('plates')}>
          {platesCount >= 7
            ? <image href={`${C}/plates.webp`} x={306} y={150} width={34} height={36} preserveAspectRatio="xMidYMax meet" className="cafe-plate" />
            : Array.from({ length: platesCount }, (_, i) => (
              <image key={i} href={`${C}/plate.webp`} x={310} y={176 - i * 4} width={28} height={11} preserveAspectRatio="xMidYMax meet" className="cafe-plate" style={{ animationDelay: `${i * 0.12}s` }} />
            ))}
        </g>
      )}
      {/* a spinning coin on the table once the money is split */}
      {env !== 'counter' && step !== 'entry' && <image href={`${C}/coin.webp`} x={280} y={194} width="9" height="9" className="cafe-spin" />}

      {/* Yusuf, cart and all: the painted picture already includes the trolley */}
      {step === 'trolley' && (
        <g className="cafe-roll">
          <ellipse cx="96" cy="260" rx="92" ry="7" fill="url(#cafe-shadow)" />
          <image href={`${C}/yusuf-wave.webp`} x={-6} y={84} width={204} height={178} preserveAspectRatio="xMidYMax meet" />
        </g>
      )}
    </svg>
  )
}
