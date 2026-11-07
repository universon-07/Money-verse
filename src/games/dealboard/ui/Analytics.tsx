import { useTranslation } from 'react-i18next'
import { computeAnalytics, type ReasonBucket } from '../engine/analytics'
import { COMPANY, SECTOR_COLOUR } from '../engine/companies'
import { START_CASH, type RunState } from '../engine/state'
import type { MarketRun } from '../engine/types'
import { Mark } from './Companies'
import { useInr } from './Panels'

const KIND_COLOUR: Record<ReasonBucket, string> = { reasoned: '#3F7A3A', headline: '#E8B04A', feeling: '#C8442F', neutral: '#9A8F85' }

function NetWorthChart({ series }: { series: { q: number; networth: number }[] }) {
  const { t } = useTranslation('dealboard')
  const money = useInr()
  const W = 320, H = 130, padL = 8, padR = 8, padT = 14, padB = 22
  const vals = series.map((s) => s.networth)
  const lo = Math.min(START_CASH, ...vals), hi = Math.max(START_CASH, ...vals)
  const span = Math.max(1, hi - lo)
  const x = (i: number) => padL + (series.length <= 1 ? 0 : (i / 12) * (W - padL - padR))
  const y = (v: number) => padT + (1 - (v - lo) / span) * (H - padT - padB)
  const pts = series.map((s, i) => `${x(i).toFixed(1)},${y(s.networth).toFixed(1)}`).join(' ')
  const last = series[series.length - 1]
  const up = last.networth >= START_CASH
  const colour = up ? '#3F7A3A' : '#C8442F'
  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${t('analytics.netWorth')}: ${series.map((s) => money(s.networth)).join(', ')}`} style={{ display: 'block' }}>
        <line x1={padL} x2={W - padR} y1={y(START_CASH)} y2={y(START_CASH)} stroke="#2B1A17" strokeWidth="1.5" strokeDasharray="4 4" opacity=".45" />
        {series.length > 1 && <polygon points={`${x(0)},${y(START_CASH)} ${pts} ${x(series.length - 1)},${y(START_CASH)}`} fill={colour} opacity=".18" />}
        <polyline points={pts} fill="none" stroke="#2B1A17" strokeWidth="4.5" strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={pts} fill="none" stroke={colour} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {series.map((s, i) => <circle key={s.q} cx={x(i)} cy={y(s.networth)} r={i === series.length - 1 ? 4.5 : 3} fill={i === series.length - 1 ? colour : '#FFF3D6'} stroke="#2B1A17" strokeWidth="2" />)}
        <text x={padL} y={H - 6} fontSize="10" fontWeight="800" fill="#2B1A17" opacity=".7">{t('analytics.start')}</text>
        <text x={W - padR} y={H - 6} fontSize="10" fontWeight="800" fill="#2B1A17" opacity=".7" textAnchor="end">{t('quarterShort', { n: last.q })}</text>
      </svg>
      <figcaption className="mt-0.5 text-[12px] opacity-70">{t('analytics.chartHint')}</figcaption>
    </figure>
  )
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border-2 border-ink bg-white/60 px-2.5 py-2">
      <div className="text-[10px] font-extrabold uppercase tracking-wide opacity-60">{label}</div>
      <div className="mt-0.5 text-[15px] font-extrabold leading-tight">{value}</div>
    </div>
  )
}

/** Everything the player has done so far as numbers: net worth, where the money is, habits and why they decide. */
export function AnalyticsView({ run, m }: { run: RunState; m: MarketRun }) {
  const { t } = useTranslation('dealboard')
  const money = useInr()
  const a = computeAnalytics(run, m)
  const sign = a.change >= 0 ? '▲ ' : '▼ '
  const section = (title: string) => <div className="db-eyebrow mb-1.5 mt-4 text-[#8a5a2b]">{title}</div>
  return (
    <div className="text-[14px]">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="font-sign text-[24px] leading-none">{money(a.netWorth)}</div>
        <div className="text-[13px] font-extrabold" style={{ color: a.change >= 0 ? '#2f6f4a' : '#C8442F' }}>{sign}{money(Math.abs(a.change))} {t('analytics.change')}</div>
      </div>
      <div className="mt-2"><NetWorthChart series={a.series} /></div>

      {section(t('analytics.where'))}
      <div className="flex h-5 overflow-hidden rounded-full border-[2.5px] border-ink bg-[#E9D3A6]" role="img" aria-label={a.allocation.map((x) => `${x.id === 'cash' ? t('analytics.cash') : t(`companies.${x.id}.name`)} ${Math.round(x.pct * 100)}%`).join(', ')}>
        {a.allocation.map((x) => <span key={x.id} style={{ width: `${x.pct * 100}%`, background: x.id === 'cash' ? '#B9A98F' : SECTOR_COLOUR[COMPANY[x.id].sector], borderRight: '2px solid #2B1A17' }} />)}
      </div>
      <ul className="m-0 mt-1.5 flex list-none flex-wrap gap-x-3 gap-y-1 p-0 text-[12px] font-bold">
        {a.allocation.map((x) => (
          <li key={x.id} className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full border-2 border-ink" style={{ background: x.id === 'cash' ? '#B9A98F' : SECTOR_COLOUR[COMPANY[x.id].sector] }} />
            {x.id === 'cash' ? t('analytics.cash') : t(`companies.${x.id}.name`)} {Math.round(x.pct * 100)}%
          </li>
        ))}
      </ul>

      {section(t('analytics.holdings'))}
      {a.holdings.length === 0 ? <p className="m-0 opacity-70">{t('analytics.none')}</p> : (
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {a.holdings.map((h) => (
            <li key={h.id} className="rounded-lg border-2 border-ink bg-white/60 px-2.5 py-2">
              <div className="flex items-center gap-2"><Mark id={h.id} size={22} /><span className="min-w-0 flex-1 truncate font-extrabold">{t(`companies.${h.id}.name`)}</span><span className="font-extrabold" style={{ color: h.gainPct >= 0 ? '#2f6f4a' : '#C8442F' }}>{h.gainPct >= 0 ? '▲ ' : '▼ '}{Math.abs(h.gainPct * 100).toFixed(1)}%</span></div>
              <div className="mt-1 grid grid-cols-3 gap-2 text-[12px]">
                <span><span className="block opacity-60">{t('analytics.cost')}</span><b>{money(h.cost)}</b></span>
                <span><span className="block opacity-60">{t('analytics.value')}</span><b>{money(h.value)}</b></span>
                <span><span className="block opacity-60">{t('analytics.quarters')}</span><b>{h.quarters}</b></span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {a.sectors.length > 0 && (
        <>
          {section(t('analytics.sectors'))}
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {a.sectors.map((s) => (
              <li key={s.sector} className="flex items-center gap-2 text-[13px]">
                <span className="w-28 shrink-0 truncate font-bold">{t(`sectors.${s.sector}`)}</span>
                <span className="h-3 flex-1 overflow-hidden rounded-full border-2 border-ink bg-[#E9D3A6]"><span className="block h-full" style={{ width: `${s.pct * 100}%`, background: SECTOR_COLOUR[s.sector] }} /></span>
                <span className="w-9 shrink-0 text-right font-extrabold">{Math.round(s.pct * 100)}%</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {section(t('analytics.habits'))}
      <div className="grid grid-cols-2 gap-1.5">
        <Tile label={t('analytics.fees')} value={money(a.habits.fees)} />
        <Tile label={t('analytics.idleLost')} value={money(a.habits.idleLost)} />
        <Tile label={t('analytics.questions')} value={a.habits.questionsPerBuy.toFixed(1)} />
        <Tile label={t('analytics.idle')} value={`${Math.round(a.habits.idlePct * 100)}%`} />
      </div>

      {section(t('analytics.decisions'))}
      <div className="grid grid-cols-2 gap-1.5 min-[420px]:grid-cols-4">
        <Tile label={t('analytics.invested')} value={String(a.counts.invest)} />
        <Tile label={t('analytics.sold')} value={String(a.counts.sell)} />
        <Tile label={t('analytics.passed')} value={String(a.counts.pass)} />
        <Tile label={t('analytics.held')} value={String(a.counts.hold)} />
      </div>

      {section(t('analytics.reasons'))}
      {a.reasons.length === 0 ? <p className="m-0 opacity-70">{t('analytics.evidenceNone')}</p> : (
        <>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {a.reasons.map((r) => (
              <li key={r.kind} className="flex items-center gap-2 text-[13px]">
                <span className="w-24 shrink-0 truncate font-bold">{t(`analytics.kind.${r.kind}`)}</span>
                <span className="h-3 flex-1 overflow-hidden rounded-full border-2 border-ink bg-[#E9D3A6]"><span className="block h-full" style={{ width: `${(r.count / a.reasons[0].count) * 100}%`, background: KIND_COLOUR[r.kind] }} /></span>
                <span className="w-6 shrink-0 text-right font-extrabold">{r.count}</span>
              </li>
            ))}
          </ul>
          {a.evidencePct !== null && <p className="m-0 mt-1.5 text-[13px] font-semibold">{t('analytics.evidence', { pct: Math.round(a.evidencePct * 100) })}</p>}
        </>
      )}
    </div>
  )
}
