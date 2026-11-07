import { useState } from 'react'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { interestCover } from '../engine/lights'
import type { LightKey, QuarterStats } from '../engine/types'
import { MiniChart } from './Lights'
import { IconLock } from './icons'

export type StatId = 'price' | 'valuation' | 'revenue' | 'profit' | 'runway' | 'debt' | 'customers' | 'retention' | 'net' | 'people' | 'ceo'
type Tag = 'L' | 'G' | 'V'

export const STAT_GROUPS: { id: 'price' | 'money' | 'customers' | 'people'; stats: StatId[] }[] = [
  { id: 'price', stats: ['price', 'valuation'] },
  { id: 'money', stats: ['revenue', 'profit', 'runway', 'debt'] },
  { id: 'customers', stats: ['customers', 'retention', 'net'] },
  { id: 'people', stats: ['people', 'ceo'] },
]

const TAG: Record<StatId, Tag> = { price: 'G', valuation: 'G', revenue: 'G', profit: 'G', runway: 'L', debt: 'L', customers: 'V', retention: 'L', net: 'G', people: 'L', ceo: 'L' }

/** Which statistics each founder question unlocks at a pitch. */
export const ASK_STATS: Record<LightKey, StatId[]> = {
  cash: ['profit', 'runway'],
  customers: ['customers', 'retention', 'net'],
  debt: ['debt'],
  ceo: ['ceo', 'people'],
}

export const ALL_STATS = STAT_GROUPS.flatMap((g) => g.stats)

export interface StatFacts {
  value: string
  series: number[]
  mode: 'signed' | 'level'
  fmt?: (v: number) => string
}

const lakh = (t: TFunction<'dealboard'>, v: number) => t('stats.lakh', { v: v.toFixed(1) })
const indian = (n: number) => Math.round(n).toLocaleString('en-IN')

/** Plain-language value and six-quarter series for one statistic at quarter q. */
export function statFacts(id: StatId, hist: QuarterStats[], q: number, t: TFunction<'dealboard'>, money: (n: number) => string): StatFacts {
  const s = hist[q]
  const slice = hist.slice(Math.max(0, q - 5), q + 1)
  switch (id) {
    case 'price':
      return { value: s.failed ? money(0) : money(s.price), series: slice.map((x) => x.price), mode: 'level', fmt: (v) => money(v) }
    case 'valuation':
      return { value: s.valuationYears === null ? t('stats.noProfit') : t('stats.years', { n: s.valuationYears.toFixed(1) }), series: slice.map((x) => x.valuationYears ?? 0), mode: 'level', fmt: (v) => (v ? t('stats.years', { n: v.toFixed(1) }) : t('stats.noProfit')) }
    case 'revenue':
      return { value: t('stats.lakhQ', { v: s.revenue.toFixed(1) }), series: slice.map((x) => x.revenue), mode: 'level', fmt: (v) => lakh(t, v) }
    case 'profit':
      return { value: `${s.profit >= 0 ? '▲ ' : '▼ '}${lakh(t, Math.abs(s.profit))}`, series: slice.map((x) => x.profit), mode: 'signed', fmt: (v) => `${v >= 0 ? '▲ ' : '▼ '}${lakh(t, Math.abs(v))}` }
    case 'runway':
      return { value: s.profit >= 0 ? t('stats.profitable') : t('stats.months', { n: Math.round(s.runwayMonths ?? 0) }), series: slice.map((x) => Math.min(24, x.runwayMonths ?? 24)), mode: 'level', fmt: (v) => t('stats.months', { n: Math.round(v) }) }
    case 'debt':
      return { value: s.debt <= 0.01 ? lakh(t, 0) : t('stats.debt.cover', { debt: lakh(t, s.debt), x: Math.max(0, interestCover(s)).toFixed(1) }), series: slice.map((x) => x.debt), mode: 'level', fmt: (v) => lakh(t, v) }
    case 'customers':
      return { value: t('stats.customers.value', { paying: indian(s.customers), users: indian(s.users), pct: Math.round((s.customers / Math.max(1, s.users)) * 100) }), series: slice.map((x) => x.customers / Math.max(1, x.users)), mode: 'level', fmt: (v) => `${Math.round(v * 100)}%` }
    case 'retention':
      return { value: `${Math.round(s.retention * 100)}%`, series: slice.map((x) => x.retention * 100), mode: 'level', fmt: (v) => `${Math.round(v)}%` }
    case 'net':
      return { value: `${s.newCust - s.lostCust >= 0 ? '+' : '−'}${indian(Math.abs(s.newCust - s.lostCust))}`, series: slice.map((x) => x.newCust - x.lostCust), mode: 'signed', fmt: (v) => `${v >= 0 ? '+' : '−'}${indian(Math.abs(v))}` }
    case 'people':
      return { value: s.layoffs > 0 ? t('stats.people.layoffs', { n: indian(s.employees), l: indian(s.layoffs) }) : t('stats.people.value', { n: indian(s.employees) }), series: slice.map((x) => x.employees), mode: 'level', fmt: (v) => indian(v) }
    case 'ceo': {
      const sells = hist.slice(Math.max(1, q - 2), q + 1).filter((h) => h.ceoTrade === 'SELL').length
      return { value: sells ? t('stats.ceo.sold', { n: sells }) : s.ceoTrade === 'BUY' ? t('stats.ceo.bought') : t('stats.ceo.none'), series: slice.map((x) => (x.ceoTrade === 'SELL' ? -1 : x.ceoTrade === 'BUY' ? 1 : 0.05)), mode: 'signed' }
    }
  }
}

const TAG_TONE: Record<Tag, string> = { L: '#3F7A3A', G: '#6B5A4A', V: '#B8473A' }

/** One statistic: name, tag, value, six-quarter chart, and a one-line "what this tells you" behind a tap. */
export function StatRow({ id, hist, q, money }: { id: StatId; hist: QuarterStats[]; q: number; money: (n: number) => string }) {
  const { t } = useTranslation('dealboard')
  const [open, setOpen] = useState(false)
  const f = statFacts(id, hist, q, t, money)
  return (
    <div className="rounded-lg border-2 border-ink bg-white/60 px-2.5 py-2">
      <button type="button" className="flex w-full items-start justify-between gap-2 text-left" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="min-w-0">
          <span className="block text-[12px] font-extrabold uppercase tracking-wide opacity-70">{t(`stats.${id}.name`)} <span aria-hidden>ⓘ</span></span>
          <span className="mt-0.5 block text-[15px] font-extrabold leading-tight">{f.value}</span>
        </span>
        <span className="shrink-0 rounded-full border-2 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide" style={{ color: TAG_TONE[TAG[id]], borderColor: TAG_TONE[TAG[id]] }}>{t(`stats.tags.${TAG[id]}`)}</span>
      </button>
      <div className="mt-1"><MiniChart values={f.series} mode={f.mode} height={44} endQ={q} fmt={f.fmt} /></div>
      {open && <p className="m-0 mt-1 text-[13px] leading-snug">{t(`stats.${id}.explain`)}</p>}
    </div>
  )
}

export function StatLocked() {
  const { t } = useTranslation('dealboard')
  return <div className="flex items-center gap-1.5 rounded-lg border-2 border-dashed border-ink/40 px-2.5 py-2 text-[13px] opacity-60"><IconLock /> {t('stats.locked')}</div>
}
