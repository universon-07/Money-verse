import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { COMPANY, SECTOR_COLOUR } from '../engine/companies'
import { knownQuarter, lightsAt, holdingValueAt, type RunState } from '../engine/state'
import type { CompanyId, LightKey, MarketRun } from '../engine/types'
import { InfoHeader } from './InfoTip'
import { LightsPanel } from './Lights'
import { useInr } from './Panels'
import { ALL_STATS, ASK_STATS, STAT_GROUPS, StatLocked, StatRow, type StatId } from './Stats'
import { useState } from 'react'
import type { TradeMode } from './TradeDialog'

/** Which statistics the player can see for a company right now. */
export function visibleStats(run: RunState, id: CompanyId): StatId[] {
  if (run.holdings[id]) return ALL_STATS
  const known = (run.unlocked[id] ?? []) as LightKey[]
  return ['price', ...known.flatMap((k) => ASK_STATS[k])] as StatId[]
}

export const companyStatus = (run: RunState, id: CompanyId): 'own' | 'met' | 'unmet' => (run.holdings[id] ? 'own' : run.pitched.includes(id) ? 'met' : 'unmet')

/** Full study sheet for one company: lights, every statistic with a chart and an explanation, news, and trading. */
export function Dossier({ run, m, id, onClose, onTrade }: { run: RunState; m: MarketRun; id: CompanyId; onClose: () => void; onTrade: (mode: TradeMode) => void }) {
  const { t } = useTranslation('dealboard')
  const money = useInr()
  const ref = useRef<HTMLDivElement>(null)
  const [sel, setSel] = useState<LightKey | null>(null)
  useEffect(() => ref.current?.focus(), [])
  const co = COMPANY[id]
  const status = companyStatus(run, id)
  const q = knownQuarter(run)
  const hist = m.history[id]
  const visible = new Set(visibleStats(run, id))
  const h = run.holdings[id]
  const value = h ? holdingValueAt(run, m, id, q) : 0
  const gain = h ? value - h.cost : 0
  // real company events so far (raising money, a down-round, layoffs, a shutdown), not invented headlines
  const raw = status === 'unmet' ? [] : hist.slice(1, q + 1).flatMap((x) => x.events.map((e) => ({ q: x.q, e })))
  // the same event in several quarters (a hype company raising money again and again) is one line: first quarter, last quarter, how many times
  const events = [...new Set(raw.map((x) => x.e))].map((e) => {
    const qs = raw.filter((x) => x.e === e).map((x) => x.q)
    return { e, first: qs[0], last: qs[qs.length - 1], n: qs.length }
  }).sort((a, b) => a.last - b.last)
  const tradeable = !!h && run.phase === 'desk' && !hist[q].failed
  const known = (run.unlocked[id] ?? []) as LightKey[]
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={t(`companies.${id}.name`)} onKeyDown={(e) => e.key === 'Escape' && onClose()} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} className="paper db-sheet db-in max-h-[94vh] w-full max-w-[520px] overflow-y-auto p-4 outline-none">
        <div className="-mx-4 -mt-4 mb-3 flex items-baseline justify-between gap-2 border-b-[3px] border-ink px-4 py-2" style={{ background: SECTOR_COLOUR[co.sector] }}>
          <h2 className="font-sign lang-fit m-0 truncate text-[20px] text-jasmine" style={{ textShadow: '1.5px 1.5px 0 #2B1A17' }}>{t(`companies.${id}.name`)}</h2>
          <span className="shrink-0 text-[11px] font-extrabold uppercase tracking-wider text-jasmine">{t(`sectors.${co.sector}`)}</span>
        </div>

        <p className="m-0 text-[15px] font-semibold italic">“{t(`companies.${id}.slogan`)}”</p>
        <p className="m-0 mt-1 text-[13px]"><span className="font-extrabold">{t('dossier.claims')}:</span> {t(`claims.${id}`)}</p>
        <p className="m-0 mt-1 text-[12px] opacity-70">{t(`companies.${id}.founder`)}</p>

        {h && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border-2 border-ink bg-[#F6E6BE] px-3 py-2 text-[14px]">
            <span className="font-extrabold">{t('dossier.own', { v: money(value) })}</span>
            <span className="font-extrabold" style={{ color: gain >= 0 ? '#2f6f4a' : '#C8442F' }}>{gain >= 0 ? '▲ ' : '▼ '}{money(Math.abs(gain))}</span>
            {tradeable && (
              <span className="flex gap-2">
                <button type="button" className="ink-btn cream" style={{ minHeight: 44 }} onClick={() => onTrade('buyMore')}>{t('portfolio.buyMore')}</button>
                <button type="button" className="ink-btn" style={{ minHeight: 44 }} onClick={() => onTrade('sell')}>{t('portfolio.sell')}</button>
              </span>
            )}
          </div>
        )}

        {status === 'unmet' && <p className="m-0 mt-3 rounded-lg border-2 border-dashed border-ink/40 px-3 py-2 text-[14px]">{t('dossier.unmet')}</p>}
        {status === 'met' && <p className="m-0 mt-3 text-[13px] opacity-75">{t('dossier.passed')}</p>}

        {status !== 'unmet' && (
          <>
            <div className="mt-3"><LightsPanel hist={hist} q={q} lights={lightsAt(m, id, q)} visible={status === 'own' ? 'all' : known} selected={sel} onSelect={setSel} /></div>
            <div className="mt-3 space-y-3">
              {STAT_GROUPS.map((g) => (
                <section key={g.id}>
                  <div className="db-eyebrow mb-1 text-[#8a5a2b]">{t(`stats.groups.${g.id}`)}</div>
                  <div className="grid grid-cols-1 gap-1.5 min-[460px]:grid-cols-2">
                    {g.stats.map((s) => (visible.has(s) ? <StatRow key={s} id={s} hist={hist} q={q} money={money} /> : <StatLocked key={s} />))}
                  </div>
                </section>
              ))}
            </div>
            <div className="mt-3"><InfoHeader title={t('dossier.legend')} className="text-[12px] font-extrabold opacity-70">{t('stats.tagLegend')}</InfoHeader></div>
          </>
        )}

        <section className="mt-3">
          <div className="db-eyebrow mb-1 text-[#8a5a2b]">{t('dossier.news')}</div>
          {events.length === 0 ? <p className="m-0 text-[13px] opacity-65">{t('dossier.noNews')}</p> : (
            <ul className="m-0 list-none space-y-1.5 p-0">
              {events.slice(-4).map((x) => (
                <li key={x.e} className="rounded-lg border-2 border-ink bg-white/60 px-2.5 py-1.5 text-[13px] leading-snug">
                  <span className="opacity-60">{x.n > 1 ? `${t('quarterShort', { n: x.first })}–${t('quarterShort', { n: x.last })} ×${x.n}` : t('quarterShort', { n: x.last })}</span> {t(`companies.${id}.name`)} {t(`quarterResults.ev.${x.e}`)}
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-4 flex justify-end"><button type="button" className="ink-btn pink" onClick={onClose}>{t('dossier.close')}</button></div>
      </div>
    </div>
  )
}
