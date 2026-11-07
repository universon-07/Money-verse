import { useState } from 'react'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { LIGHT_KEYS, interestCover } from '../engine/lights'
import type { Light, LightKey, Lights, QuarterStats } from '../engine/types'

const TONE: Record<Light, { bg: string; fg: string }> = {
  G: { bg: '#3F7A3A', fg: '#FFF3D6' },
  A: { bg: '#E8B04A', fg: '#2B1A17' },
  R: { bg: '#C8442F', fg: '#FFF3D6' },
  X: { bg: '#9A8F85', fg: '#FFF3D6' },
}

/** Icon plus label as well as colour, so the lights never rely on colour alone. */
function Glyph({ state }: { state: Light | null }) {
  const common = { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
  if (state === 'G') return <svg {...common}><path d="m3.5 8.5 3 3 6-7" /></svg>
  if (state === 'A') return <svg {...common}><path d="M8 3v6.5" /><circle cx="8" cy="12.6" r=".6" fill="currentColor" /></svg>
  if (state === 'R') return <svg {...common}><path d="m4 4 8 8M12 4l-8 8" /></svg>
  if (state === 'X') return <svg {...common}><path d="M5.8 6.2a2.3 2.3 0 1 1 3.3 2c-.7.4-1.1.8-1.1 1.6" /><circle cx="8" cy="12.6" r=".6" fill="currentColor" /></svg>
  return <svg {...common}><circle cx="8" cy="8" r="4" strokeDasharray="2 2.4" /></svg>
}

export function LightChip({ k, state, active, onTap }: { k: LightKey; state: Light | null; active?: boolean; onTap?: () => void }) {
  const { t } = useTranslation('dealboard')
  const tone = state ? TONE[state] : { bg: '#E6D8B6', fg: '#6B5A4A' }
  const label = state ? t(`lights.state.${state}`) : t('lights.grey')
  return (
    <button
      type="button"
      onClick={onTap}
      aria-pressed={active}
      aria-label={`${t(`lights.${k}.name`)}: ${label}`}
      className="flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg border-[2.5px] border-ink px-1 py-1"
      style={{ background: tone.bg, color: tone.fg, boxShadow: active ? '0 0 0 3px #E8B04A, 2px 2px 0 3px #2B1A17' : '2px 2px 0 #2B1A17' }}
    >
      <span className="flex max-w-full items-center gap-1">
        <Glyph state={state} />
        <span className="lang-fit text-[12px] font-extrabold leading-none">{t(`lights.${k}.name`)}</span>
      </span>
      <span className="text-[10px] font-extrabold uppercase leading-none tracking-wide opacity-90">{label}</span>
    </button>
  )
}

/** Six-quarter line plot: soft area, ink line, dots; hover or touch a point for that quarter's value and its change. */
export function MiniChart({ values, mode, height = 52, endQ, fmt }: { values: number[]; mode: 'signed' | 'level'; height?: number; endQ?: number; fmt?: (v: number) => string }) {
  const [hi, setHi] = useState<number | null>(null)
  const W = 168, H = height, padX = 6, padY = 6
  const n = values.length
  const lo = mode === 'signed' ? Math.min(0, ...values) : Math.min(...values)
  const top = mode === 'signed' ? Math.max(0, ...values) : Math.max(...values)
  const span = Math.max(1e-6, top - lo)
  const x = (i: number) => (n === 1 ? W / 2 : padX + (i * (W - padX * 2)) / (n - 1))
  const y = (v: number) => padY + (1 - (v - lo) / span) * (H - padY * 2)
  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`)
  const base = mode === 'signed' ? y(0) : H - padY
  const area = `M${x(0).toFixed(1)},${base.toFixed(1)} L${pts.join(' L')} L${x(n - 1).toFixed(1)},${base.toFixed(1)} Z`
  const label = (i: number) => (endQ === undefined ? '' : endQ - (n - 1 - i) <= 0 ? '0' : `Q${endQ - (n - 1 - i)}`)
  const show = (v: number) => (fmt ? fmt(v) : Number.isInteger(v) ? String(v) : v.toFixed(1))
  const move = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    let best = 0
    for (let i = 1; i < n; i++) if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i
    setHi(best)
  }
  const cur = hi === null ? null : values[hi]
  const prev = hi === null || hi === 0 ? null : values[hi - 1]
  const change = cur === null || prev === null || prev === 0 ? null : ((cur - prev) / Math.abs(prev)) * 100
  const col = (v: number) => (mode === 'signed' ? (v >= 0 ? '#3F7A3A' : '#C8442F') : '#8A6D3B')
  return (
    <div className="relative" style={{ touchAction: 'pan-y' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={values.map((v) => show(v)).join(', ')} style={{ display: 'block', maxHeight: H * 1.4, cursor: 'crosshair' }} onPointerMove={move} onPointerDown={move} onPointerLeave={() => setHi(null)}>
        {mode === 'signed' && <line x1={padX} x2={W - padX} y1={y(0)} y2={y(0)} stroke="#2B1A17" strokeWidth="1" strokeDasharray="3 3" opacity=".45" />}
        <path d={area} fill="#8A6D3B" opacity=".14" />
        <polyline points={pts.join(' ')} fill="none" stroke="#2B1A17" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {values.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r={hi === i ? 4.2 : i === n - 1 ? 3.4 : 2.2} fill={hi === i || i === n - 1 ? col(v) : '#FFF3D6'} stroke="#2B1A17" strokeWidth="1.5" />)}
        {hi !== null && <line x1={x(hi)} x2={x(hi)} y1={padY} y2={H - padY} stroke="#2B1A17" strokeWidth="1" opacity=".25" />}
      </svg>
      {hi !== null && cur !== null && (
        <div className="pointer-events-none absolute -top-8 z-10 whitespace-nowrap rounded-md border-2 border-ink bg-[#FFF3D6] px-1.5 py-0.5 text-[11px] font-extrabold leading-tight shadow-[2px_2px_0_#2B1A17]" style={{ left: `${(x(hi) / W) * 100}%`, transform: `translateX(${hi === 0 ? '0' : hi === n - 1 ? '-100%' : '-50%'})` }}>
          {label(hi) && <span className="opacity-60">{label(hi)} · </span>}{show(cur)}
          {change !== null && Math.abs(change) >= 0.5 && <span style={{ color: change >= 0 ? '#3F7A3A' : '#C8442F' }}> {change >= 0 ? '▲' : '▼'}{Math.abs(change).toFixed(0)}%</span>}
        </div>
      )}
    </div>
  )
}

const sales = (hist: QuarterStats[], q: number) => hist.slice(Math.max(1, q - 2), q + 1).filter((h) => h.ceoTrade === 'SELL').length

/** One plain sentence and the six-quarter series behind a light (used by the lights panel and founder answers). */
export function lightFacts(hist: QuarterStats[], q: number, k: LightKey, t: TFunction<'dealboard'>): { detail: string; series: number[]; mode: 'signed' | 'level' } {
  const slice = hist.slice(Math.max(0, q - 5), q + 1)
  const s = hist[q]
  if (k === 'cash') return { detail: s.profit >= 0 ? t('lights.detail.cashProfit') : t('lights.detail.cashRunway', { n: Math.round(s.runwayMonths ?? 0) }), series: slice.map((x) => x.profit), mode: 'signed' }
  if (k === 'customers') return { detail: t('lights.detail.customers', { pct: Math.round(s.retention * 100), net: (s.newCust - s.lostCust).toLocaleString('en-IN') }), series: slice.map((x) => x.newCust - x.lostCust), mode: 'signed' }
  if (k === 'debt') return { detail: s.debt <= 0.01 ? t('lights.detail.debtNone') : t('lights.detail.debtCover', { x: Math.max(0, interestCover(s)).toFixed(1) }), series: slice.map((x) => x.debt), mode: 'level' }
  const n = sales(hist, q)
  return { detail: n ? t('lights.detail.ceoSales', { n }) : t('lights.detail.ceoNone'), series: slice.map((x) => (x.ceoTrade === 'SELL' ? -1 : x.ceoTrade === 'BUY' ? 1 : 0.05)), mode: 'signed' }
}

/** Four lights for one company. `visible` says which are turned over; a tap explains one light. */
export function LightsPanel({ hist, q, lights, visible, selected, onSelect }: {
  hist: QuarterStats[]; q: number; lights: Lights; visible: LightKey[] | 'all'; selected: LightKey | null; onSelect: (k: LightKey | null) => void
}) {
  const { t } = useTranslation('dealboard')
  const shown = (k: LightKey) => visible === 'all' || visible.includes(k)
  const facts = selected ? lightFacts(hist, q, selected, t) : null
  const state = selected && shown(selected) ? lights[selected] : null
  return (
    <div>
      <div className="grid grid-cols-2 gap-1.5 min-[470px]:grid-cols-4" role="group" aria-label={t('lights.title')}>
        {LIGHT_KEYS.map((k) => (
          <LightChip key={k} k={k} state={shown(k) ? lights[k] : null} active={selected === k} onTap={() => onSelect(selected === k ? null : k)} />
        ))}
      </div>
      {!selected && <p className="m-0 mt-1.5 text-[12px] opacity-65">{t('lights.tapHint')}</p>}
      {selected && (
        <div className="mt-2 rounded-lg border-2 border-ink bg-white/60 p-2.5 text-[13px] leading-snug">
          <div className="font-extrabold">{t(`lights.${selected}.explain`)}</div>
          {state ? (
            <>
              <div className="mt-1">{t(`lights.${selected}.${state === 'X' ? 'G' : state}`)} <span className="opacity-70">{facts!.detail}</span></div>
              <div className="mt-1.5"><div className="text-[10px] font-extrabold uppercase tracking-wider opacity-60">{t('lights.chartTitle')}</div><MiniChart values={facts!.series} mode={facts!.mode} /></div>
            </>
          ) : (
            <div className="mt-1 opacity-75">{t('lights.grey')}</div>
          )}
        </div>
      )}
    </div>
  )
}
