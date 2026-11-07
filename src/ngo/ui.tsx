import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { Level } from './insights'
import type { Glow } from './summary'

/** theme colours as CSS variables (light and dark are defined in ngo.css); PNG export resolves them to real colours */
export const C = {
  ink: 'var(--ink)', muted: 'var(--muted)', line: 'var(--line)', track: 'var(--track)', brand: 'var(--brand)', navy: 'var(--navy)', tan: 'var(--tan)',
  building: 'var(--building)', getting: 'var(--getting)', strong: 'var(--strong)', card: 'var(--card)', bg: 'var(--bg)', soft: 'var(--soft)',
}
export const LEVEL_COLOR: Record<Level, string> = { building: C.building, getting: C.getting, strong: C.strong }

export const pct = (v: number | null | undefined) => (v === null || v === undefined ? '–' : `${Math.round(v * 100)}%`)
export const day = (t: number | null) => (t ? new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '–')

export function Card({ title, sub, action, children, className = '', pad = true }: { title?: ReactNode; sub?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={`mi-card ${pad ? 'p-5' : ''} ${className}`}>
      {(title || action) && (
        <div className={`flex items-start justify-between gap-3 ${pad ? '' : 'px-5 pt-5'}`}>
          <div className="min-w-0">
            {title && <h2 className="text-[16px] font-semibold leading-tight">{title}</h2>}
            {sub && <p className="mi-muted m-0 mt-1 text-[13px] leading-snug">{sub}</p>}
          </div>
          {action && <div className="flex shrink-0 items-center gap-1">{action}</div>}
        </div>
      )}
      <div className={title || action ? 'mt-4' : ''}>{children}</div>
    </section>
  )
}

export function Stat({ label, value, note, tone }: { label: string; value: ReactNode; note?: ReactNode; tone?: 'up' | 'down' | 'warn' }) {
  const color = tone === 'up' ? C.strong : tone === 'down' ? C.building : tone === 'warn' ? 'var(--warn)' : C.muted
  return (
    <div className="mi-card flex min-w-0 flex-col gap-1.5 p-4">
      <div className="mi-eyebrow">{label}</div>
      <div className="text-[28px] font-bold leading-none tracking-tight" style={{ color: C.navy }}>{value}</div>
      {note && <div className="text-[12.5px] font-medium leading-snug" style={{ color }}>{note}</div>}
    </div>
  )
}

export function Chip({ children, tone = 'plain', style }: { children: ReactNode; tone?: 'plain' | Level | 'brand'; style?: CSSProperties }) {
  const k = tone === 'plain' ? 'plain' : tone
  const t = [`var(--t-${k})`, `var(--t-${k}-ink)`]
  return <span className="mi-chip" style={{ background: t[0], color: t[1], ...style }}>{children}</span>
}

/** a thin progress bar with the value written next to it (colour is never the only signal) */
export function Meter({ value, color = C.navy, width = 120, label }: { value: number | null; color?: string; width?: number | string; label?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 overflow-hidden rounded-full" style={{ width, background: C.track }} role="img" aria-label={pct(value)}>
        {value !== null && <div className="h-full rounded-full" style={{ width: `${Math.round(value * 100)}%`, background: color }} />}
      </div>
      {label !== false && <span className="w-9 text-right text-[13px] font-semibold tabular-nums">{pct(value)}</span>}
    </div>
  )
}

/** one horizontal bar split into building / getting there / strong */
export function LevelBar({ low, mid, high, height = 10 }: { low: number; mid: number; high: number; height?: number }) {
  const of = low + mid + high
  return (
    <div className="flex overflow-hidden rounded-full" style={{ height, background: C.track }} role="img" aria-label={`${low} still building, ${mid} getting there, ${high} strong`}>
      {of > 0 && <><div style={{ width: `${(low / of) * 100}%`, background: C.building }} /><div style={{ width: `${(mid / of) * 100}%`, background: C.getting }} /><div style={{ width: `${(high / of) * 100}%`, background: C.strong }} /></>}
    </div>
  )
}

export function Legend() {
  return (
    <div className="mi-muted flex flex-wrap gap-x-4 gap-y-1 text-[12px]">
      {(['building', 'getting', 'strong'] as const).map((l) => (
        <span key={l} className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: LEVEL_COLOR[l] }} />{l === 'building' ? 'Still building (under 40%)' : l === 'getting' ? 'Getting there (40 to 69%)' : 'Strong (70% and up)'}</span>
      ))}
    </div>
  )
}

/** a place's status: filled when cleared (shade = how strong), half when in progress, empty when not started */
export function Flag({ state, glow, size = 20 }: { state: 'n' | 'p' | 'c'; glow: Glow; size?: number }) {
  const word = state === 'c' ? (glow === 'b' ? 'cleared strongly' : glow === 'd' ? 'cleared' : 'cleared, weakly') : state === 'p' ? 'in progress' : 'not started'
  const fill = glow === 'b' ? C.strong : glow === 'd' ? C.getting : C.building
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" role="img" aria-label={word}>
      <title>{word}</title>
      <circle cx="13" cy="13" r="10.5" fill={state === 'c' ? fill : C.card} stroke={state === 'n' ? 'var(--flag-empty)' : state === 'p' ? C.tan : fill} strokeWidth="2" />
      {state === 'p' && <path d="M13 2.5a10.5 10.5 0 0 1 0 21z" fill={C.tan} />}
      {state === 'c' && <path d="M8 13.4l3.4 3.3L18.2 9.8" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  )
}

export const Icon = ({ d, size = 18 }: { d: ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
)
export const ICONS = {
  overview: <path d="M4 13h6V4H4zM14 20h6v-9h-6zM14 4v3h6V4zM4 20h6v-3H4z" />,
  students: <path d="M16 20v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM20 20v-1a3 3 0 0 0-2-2.8M16 4.3a3.5 3.5 0 0 1 0 6.4" />,
  teach: <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M9 8h6M9 12h4" />,
  classes: <path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6" />,
  download: <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />,
  print: <path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v7H7z" />,
  back: <path d="M15 6l-6 6 6 6" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  copy: <path d="M9 9h11v11H9zM5 15H4V4h11v1" />,
  edit: <path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4" />,
  search: <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4" />,
  logout: <path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />,
  lock: <path d="M6 11h12v10H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3" />,
  chevron: <path d="M6 9l6 6 6-6" />,
  play: <path d="M7 4.5v15l12-7.5z" />,
  sun: <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />,
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />,
  system: <path d="M3 5h18v11H3zM8 20h8M12 16v4" />,
}

/** the Minar mark: the painted monument from the game */
export function Brand({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <img src="/art/monument.webp" alt="" aria-hidden className="h-9 w-9 shrink-0 object-contain" draggable={false} />
      {!compact && (
        <div className="leading-tight">
          <div className="text-[16px] font-bold" style={{ color: C.navy }}>Minar Insights</div>
          <div className="mi-muted text-[11.5px]">For teachers and NGOs</div>
        </div>
      )}
    </div>
  )
}

/** a small popover menu that closes on outside click or Escape */
export function Menu({ label, children }: { label: ReactNode; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const off = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', off)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', off); document.removeEventListener('keydown', esc) }
  }, [open])
  return (
    <div ref={ref} className="relative">
      <button type="button" className="mi-btn" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((o) => !o)}>{label}<Icon d={ICONS.chevron} size={16} /></button>
      {open && <div className="mi-menu" role="menu">{children(() => setOpen(false))}</div>}
    </div>
  )
}

export function Drawer({ title, onClose, children }: { title: ReactNode; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [onClose])
  return (
    <div className="mi-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <aside className="mi-drawer" role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : 'Details'}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b px-5 py-3" style={{ background: C.bg, borderColor: C.line }}>
          <div className="min-w-0 truncate text-[16px] font-semibold">{title}</div>
          <button type="button" className="mi-btn quiet" onClick={onClose} aria-label="Close"><Icon d={ICONS.close} /></button>
        </div>
        <div className="grid gap-4 p-5">{children}</div>
      </aside>
    </div>
  )
}

/* ---------- printing: anything handed to print() is rendered into <body> and printed alone (Save as PDF works too) ---------- */

const PrintCtx = createContext<(node: ReactNode, title?: string) => void>(() => {})
export const usePrint = () => useContext(PrintCtx)

export function PrintProvider({ children }: { children: ReactNode }) {
  const [job, setJob] = useState<{ node: ReactNode; title?: string } | null>(null)
  useEffect(() => {
    if (!job) return
    const prev = document.title
    if (job.title) document.title = job.title // becomes the PDF file name
    const done = () => { setJob(null); document.title = prev }
    window.addEventListener('afterprint', done, { once: true })
    const t = window.setTimeout(() => window.print(), 60)
    return () => { window.clearTimeout(t); window.removeEventListener('afterprint', done) }
  }, [job])
  return (
    <PrintCtx.Provider value={(node, title) => setJob({ node, title })}>
      {children}
      {job && createPortal(<div className="mi mi-print">{job.node}</div>, document.body)}
    </PrintCtx.Provider>
  )
}
