import { useRef, type ReactNode } from 'react'
import { PILLAR_IDS, type PillarId } from '../content/data'
import type { SkillRow } from './analytics'
import { downloadSvgPng } from './export'
import type { TrendPoint } from './insights'
import { GAME_NAME, PLACE_NAME, SKILL_NAME } from './lessons'
import type { StudentSummary } from './summary'
import { C, Card, Icon, ICONS } from './ui'

/**
 * Charts are plain SVG with colours as attributes, so the same drawing shows on screen, prints, and downloads as a PNG.
 * Every chart also writes its numbers out (labels or a table) so colour is never the only signal.
 */

const FONT = 'Noto Sans, Segoe UI, system-ui, sans-serif'

/** a card around a chart with a "Download PNG" button */
export function ChartCard({ title, sub, file, children, extra }: { title: string; sub?: ReactNode; file: string; children: ReactNode; extra?: ReactNode }) {
  const box = useRef<HTMLDivElement>(null)
  const save = () => {
    const svg = box.current?.querySelector('svg')
    if (svg) void downloadSvgPng(svg, file, title)
  }
  return (
    <Card title={title} sub={sub} action={<>{extra}<button type="button" className="mi-btn quiet sm" onClick={save} title="Download this chart as a picture"><Icon d={ICONS.download} size={16} />PNG</button></>}>
      <div ref={box}>{children}</div>
    </Card>
  )
}

/** class understanding week by week: a line with a soft area, and the number of students under each week */
export function TrendChart({ points }: { points: TrendPoint[] }) {
  const W = 640, H = 230, L = 40, R = 16, T = 14, B = 44
  const pts = points.filter((p) => p.understanding !== null)
  if (pts.length < 2) return <p className="mi-muted m-0 text-[14px]">The trend appears after students have shared progress in at least two different weeks.</p>
  const x = (i: number) => L + (i * (W - L - R)) / Math.max(1, points.length - 1)
  const y = (v: number) => T + (1 - v) * (H - T - B)
  const line = points.map((p, i) => (p.understanding === null ? null : [x(i), y(p.understanding)] as const)).filter((p): p is readonly [number, number] => p !== null)
  const path = line.map(([a, b], i) => `${i ? 'L' : 'M'}${a.toFixed(1)} ${b.toFixed(1)}`).join(' ')
  const area = `${path} L${line[line.length - 1][0].toFixed(1)} ${y(0)} L${line[0][0].toFixed(1)} ${y(0)} Z`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Class understanding by week: ${pts.map((p) => `${p.label} ${Math.round((p.understanding as number) * 100)}%`).join(', ')}`} fontFamily={FONT}>
      {[0, 0.25, 0.5, 0.75, 1].map((g) => (
        <g key={g}>
          <line x1={L} x2={W - R} y1={y(g)} y2={y(g)} stroke={C.line} strokeDasharray={g ? '3 4' : undefined} />
          <text x={L - 8} y={y(g) + 4} fontSize="11" fill={C.muted} textAnchor="end">{g * 100}%</text>
        </g>
      ))}
      <path d={area} fill={C.navy} opacity="0.07" />
      <path d={path} fill="none" stroke={C.navy} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={p.at}>
          {p.understanding !== null && (
            <>
              <circle cx={x(i)} cy={y(p.understanding)} r="4" fill={C.card} stroke={C.navy} strokeWidth="2" />
              {i === points.length - 1 && <text x={x(i)} y={y(p.understanding) - 10} fontSize="12" fontWeight="700" fill={C.navy} textAnchor="end">{Math.round(p.understanding * 100)}%</text>}
            </>
          )}
          <text x={x(i)} y={H - 24} fontSize="11" fill={C.muted} textAnchor="middle">{p.label}</text>
          <text x={x(i)} y={H - 9} fontSize="10" fill={C.muted} textAnchor="middle" opacity="0.8">{p.students} st.</text>
        </g>
      ))}
    </svg>
  )
}

/** how far the class is in each of the four places: not started, in progress, cleared, cleared strongly */
export function PlacesChart({ list }: { list: StudentSummary[] }) {
  const W = 640, row = 46, L = 168, R = 10, H = PILLAR_IDS.length * row + 34
  const n = Math.max(1, list.length)
  const seg = (p: PillarId) => {
    const c = { n: 0, p: 0, c: 0, b: 0 }
    for (const s of list) {
      const st = s.places[p]
      if (st.s === 'c') { if (st.b === 'b') c.b++; else c.c++ }
      else if (st.s === 'p' || st.a > 0) c.p++
      else c.n++
    }
    return c
  }
  const cols = [['b', C.strong, 'Cleared strongly'], ['c', C.getting, 'Cleared'], ['p', C.tan, 'In progress'], ['n', C.track, 'Not started']] as const
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Progress in the four places" fontFamily={FONT}>
      {PILLAR_IDS.map((p, i) => {
        const c = seg(p)
        let acc = L
        const top = i * row + 6
        return (
          <g key={p}>
            <text x={0} y={top + 13} fontSize="13" fontWeight="600" fill={C.ink}>{PLACE_NAME[p]}</text>
            <text x={0} y={top + 29} fontSize="11" fill={C.muted}>{GAME_NAME[p]}</text>
            {cols.map(([k, col]) => {
              const w = (c[k] / n) * (W - L - R)
              const el = w > 0 ? <g key={k}><rect x={acc} y={top + 4} width={w} height={24} fill={col} />{w > 26 && <text x={acc + w / 2} y={top + 20} fontSize="11" fontWeight="700" fill={k === 'p' ? '#1F2430' : k === 'n' ? C.ink : '#fff'} textAnchor="middle">{c[k]}</text>}</g> : null
              acc += w
              return el
            })}
          </g>
        )
      })}
      <g transform={`translate(${L} ${H - 14})`}>
        {cols.map(([k, col, label], i) => (
          <g key={k} transform={`translate(${i * 118} 0)`}><rect width="10" height="10" y="-9" rx="2" fill={col} stroke={k === 'n' ? 'var(--flag-empty)' : 'none'} /><text x="15" fontSize="11" fill={C.muted}>{label}</text></g>
        ))}
      </g>
    </svg>
  )
}

/** each skill as a stacked bar of building / getting there / strong, with the class average written at the end */
export function SkillsChart({ skills, onPick }: { skills: SkillRow[]; onPick?: (id: SkillRow['id']) => void }) {
  const W = 640, row = 40, L = 150, R = 64, H = skills.length * row + 4
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Skills across the class" fontFamily={FONT}>
      {skills.map((s, i) => {
        const top = i * row + 4
        const of = Math.max(1, s.of)
        const w = W - L - R
        const parts = [[s.low, C.building], [s.mid, C.getting], [s.high, C.strong]] as const
        let acc = L
        return (
          <g key={s.id} style={onPick ? { cursor: 'pointer' } : undefined} onClick={onPick ? () => onPick(s.id) : undefined}>
            <text x={0} y={top + 18} fontSize="13" fontWeight="600" fill={C.ink}>{SKILL_NAME[s.id]}</text>
            <rect x={L} y={top + 6} width={w} height={18} rx="9" fill={C.track} />
            {s.of > 0 && parts.map(([v, col], k) => {
              const ww = (v / of) * w
              const el = ww > 0 ? <g key={k}><rect x={acc} y={top + 6} width={ww} height={18} fill={col} />{ww > 22 && <text x={acc + ww / 2} y={top + 19} fontSize="10.5" fontWeight="700" fill="#fff" textAnchor="middle">{v}</text>}</g> : null
              acc += ww
              return el
            })}
            <text x={W} y={top + 19} fontSize="13" fontWeight="700" fill={C.navy} textAnchor="end">{s.avg === null ? 'not yet' : `${Math.round(s.avg * 100)}%`}</text>
          </g>
        )
      })}
    </svg>
  )
}

/** a student's understanding over their own snapshots (for report cards) */
export function Sparkline({ points, width = 220, height = 54 }: { points: { at: number; u: number }[]; width?: number; height?: number }) {
  if (points.length < 2) return <span className="mi-muted text-[12.5px]">Trend shows after a second shared update.</span>
  const x = (i: number) => 4 + (i * (width - 8)) / (points.length - 1)
  const y = (v: number) => 4 + (1 - v) * (height - 8)
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.u).toFixed(1)}`).join(' ')
  const last = points[points.length - 1]
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Understanding from ${Math.round(points[0].u * 100)}% to ${Math.round(last.u * 100)}%`}>
      <line x1="4" x2={width - 4} y1={y(0.7)} y2={y(0.7)} stroke={C.strong} strokeDasharray="2 4" opacity=".5" />
      <path d={d} fill="none" stroke={C.navy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(points.length - 1)} cy={y(last.u)} r="3.5" fill={C.navy} />
    </svg>
  )
}

/** share of students in each group (k-anonymity is applied by the caller) */
export function SplitBars({ rows }: { rows: { label: string; n: number; hidden?: boolean }[] }) {
  const total = rows.reduce((a, r) => a + r.n, 0)
  return (
    <ul className="m-0 grid list-none gap-2 p-0 text-[13.5px]">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[110px_1fr_70px] items-center gap-2">
          <span className="font-medium">{r.label}</span>
          <span className="h-2 overflow-hidden rounded-full" style={{ background: C.track }}><span className="block h-full rounded-full" style={{ width: `${total ? (r.n / total) * 100 : 0}%`, background: C.navy }} /></span>
          <span className="mi-muted text-right tabular-nums">{r.hidden ? 'under 5' : `${r.n} · ${total ? Math.round((r.n / total) * 100) : 0}%`}</span>
        </li>
      ))}
    </ul>
  )
}

