import type { ReactNode } from 'react'
import type { AppId, Reason } from '../types.ts'

/** Small line-icon set (24px grid). Original shapes, no emoji, no external assets. */
const P: Record<string, ReactNode> = {
  back: <path d="M15 18l-6-6 6-6" />,
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />,
  message: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  chat: <><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z" /><path d="M8.5 11h7M8.5 14.5h4" /></>,
  camera: <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></>,
  rupee: <path d="M7 5h11M7 9.5h11M7 5c6 0 8 2 8 4.5S12 14 7 14l8 6" />,
  sliders: <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />,
  video: <><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" /></>,
  incoming: <path d="M17 7L7 17M17 17H7V7" />,
  outgoing: <path d="M7 17L17 7M7 7h10v10" />,
  missed: <path d="M17 7L7 17M7 7v10h10" />,
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />,
  comment: <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.6-.8L3 21l1.9-5.4A8.4 8.4 0 1 1 21 11.5z" />,
  send: <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />,
  more: <><circle cx="12" cy="5" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="12" cy="19" r="1.2" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>,
  calc: <><rect x="5" y="2.5" width="14" height="19" rx="2" /><path d="M8.5 6.5h7M8.5 11h1M12 11h1M15.5 11h.1M8.5 14.5h1M12 14.5h1M15.5 14.5h.1M8.5 18h1M12 18h1M15.5 18h.1" /></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></>,
  note: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
  link: <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17v.1" /></>,
  pause: <path d="M8 5v14M16 5v14" />,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  check: <path d="M4.5 12.8l5 5 10-11" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  speaker: <><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M16.5 8.5a5 5 0 0 1 0 7" /></>,
  rotate: <><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.2L3 16M3 21v-5h5" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" /></>,
  shield: <path d="M12 2.5l8 3v6c0 5-3.4 8.7-8 10-4.6-1.3-8-5-8-10v-6z" />,
  flag: <path d="M4 22V4M4 4h13l-2 4 2 4H4" />,
  star: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />,
}

export type IconName = keyof typeof P

export function Icon({ name, size = 22, stroke = 2, className, style }: { name: IconName; size?: number; stroke?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className} style={style}>
      {P[name]}
    </svg>
  )
}

// ---- the manipulation tactics (the six reasons) -------------------------------------------------------------
const R: Record<Reason | 'fine', ReactNode> = {
  too_good: (<><rect x="4" y="11" width="16" height="9" /><rect x="3" y="7.5" width="18" height="3.5" /><path d="M12 7.5V20M12 7.5C9.5 3 6 4.5 8 7.5M12 7.5C14.5 3 18 4.5 16 7.5" /></>),
  rushing: (<><circle cx="12" cy="13" r="8" /><path d="M12 8.5V13l3 2M9 3h6" /></>),
  pretend: (<><path d="M3 8c4-2.4 14-2.4 18 0 0 6.5-3.4 10-9 10S3 14.5 3 8z" /><circle cx="8.6" cy="11.2" r="1.5" /><circle cx="15.4" cy="11.2" r="1.5" /></>),
  secret: (<><path d="M3.5 12.5c3-3.5 5.5-3.5 8.5-1.2 3-2.3 5.5-2.3 8.5 1.2-3 4.5-13 4.5-17 0z" /><path d="M3.5 12.5h17" /></>),
  grab: (<><circle cx="8" cy="12" r="4.5" /><path d="M12.5 12H21M18 12v3.5M15.5 12v2.5" /></>),
  threat: (<><path d="M12 3.5l9.5 16.5h-19z" /><path d="M12 10v4.5M12 17.2v.3" /></>),
  fine: <path d="M4.5 12.8l5 5 10-11" />,
}

export function ReasonIcon({ reason, size = 22 }: { reason: Reason | 'fine'; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {R[reason]}
    </svg>
  )
}

// ---- the five core apps ----------------------------------------------------------------------------------------
export const APP_STYLE: Record<AppId, { bg: string; bar: string; icon: IconName; tab: string }> = {
  messages: { bg: 'linear-gradient(145deg,#19a79d,#0b6f69)', bar: '#0b7f78', icon: 'message', tab: '#0b7f78' },
  phone: { bg: 'linear-gradient(145deg,#37b26a,#1c7a46)', bar: '#1c7a46', icon: 'phone', tab: '#1c7a46' },
  chatup: { bg: 'linear-gradient(145deg,#2dd4a0,#0e8f6e)', bar: '#0e8f6e', icon: 'chat', tab: '#0e8f6e' },
  instaglam: { bg: 'linear-gradient(135deg,#f7b733,#fc4a1a 45%,#b724c9)', bar: '#fff', icon: 'camera', tab: '#c2268f' },
  paynow: { bg: 'linear-gradient(145deg,#3a63e0,#1b2f86)', bar: '#1f3596', icon: 'rupee', tab: '#1f3596' },
  settings: { bg: 'linear-gradient(145deg,#8b97a6,#566170)', bar: '#4a5562', icon: 'sliders', tab: '#4a5562' },
}

/** size 'fluid' scales with the screen width (home screen); a number is a fixed pixel size (cards) */
export function AppIcon({ app, size = 'fluid', glow = false }: { app: AppId; size?: number | 'fluid'; glow?: boolean }) {
  const s = APP_STYLE[app]
  const fixed = typeof size === 'number'
  return (
    <span className={`os-icon ${glow ? 'os-glow' : ''}`} style={{ ...(fixed ? { width: size, height: size } : {}), background: s.bg }}>
      <Icon name={s.icon} size={fixed ? size * 0.5 : 26} stroke={2.1} />
    </span>
  )
}

export function ShieldMark({ pieces, size = 96 }: { pieces: ('protect' | 'verify' | 'pause')[]; size?: number }) {
  const on = (k: 'protect' | 'verify' | 'pause') => pieces.includes(k)
  const c = (k: 'protect' | 'verify' | 'pause', col: string) => (on(k) ? col : '#e2cf9c')
  return (
    <svg width={size} height={size * 1.12} viewBox="0 0 100 112" role="img" aria-label={pieces.join(', ')}>
      <path d="M50 4L8 18v32c0 28 18 46 42 56 24-10 42-28 42-56V18z" fill="#fbf0d2" stroke="#3a2a24" strokeWidth="3" strokeLinejoin="round" />
      <path d="M50 10L14 21v6h36z" fill={c('pause', '#e8ab3a')} />
      <path d="M50 10l36 11v6H50z" fill={c('verify', '#6eb7c9')} />
      <path d="M14 31h72v19c0 23-15 38-36 48-21-10-36-25-36-48z" fill={c('protect', '#86b35f')} />
      {pieces.length === 3 && <path d="M35 54l11 11 19-21" fill="none" stroke="#3a2a24" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  )
}
