import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { COMPANY } from '../engine/companies'
import type { ReasonKind, ReasonOption } from '../engine/reasons'
import type { CompanyId } from '../engine/types'
import { Mark } from './Companies'

const KIND_DOT: Record<ReasonKind, string> = { evidence: '#3F7A3A', caution: '#3F7A3A', headline: '#E8B04A', feeling: '#C8442F', neutral: '#9A8F85' }

const LEGACY: Record<string, string> = { looksHyped: 'fe.hype0', friendTold: 'fe.hype1', trustFounder: 'hl.claim0', strongGrowth: 'hl.claim0', dataSays: 'ev.cashProfit', other: 'ne.curious' }

/**
 * Turns a reason into its sentence, filled with the company's own name, founder, sector and pitch headline
 * (so the same reason reads differently for every company).
 */
export function useReasonText() {
  const { t, i18n } = useTranslation('dealboard')
  return (rawKey: string, params: Record<string, string | number>, companyId: CompanyId): string => {
    // saves from older builds carry retired reason ids; map them rather than showing a raw key
    const key = i18n.exists(`dealboard:pick.${rawKey}`) ? rawKey : (LEGACY[rawKey] ?? 'ne.curious')
    return t(`pick.${key}`, {
      ...params,
      name: t(`companies.${companyId}.name`),
      founder: t(`companies.${companyId}.founder`).split(',')[0],
      sector: t(`sectors.${COMPANY[companyId].sector}`),
      claim: t(`claims.${companyId}`).replace(/[.!]+$/, ''),
    })
  }
}

/** Rebuilds a reason from the flat `reasonKey` + `rp_*` params that pointers and lesson cards carry. */
export function useReasonFromParams() {
  const text = useReasonText()
  return (params: Record<string, string | number>, companyId: CompanyId): string | null => {
    if (typeof params.reasonKey !== 'string') return null
    const rp: Record<string, string | number> = {}
    for (const [k, v] of Object.entries(params)) if (k.startsWith('rp_')) rp[k.slice(3)] = v
    return text(params.reasonKey, rp, companyId)
  }
}

/** The reasons to pick from: one line each, tailored to this company and this moment. */
export function ReasonList({ options, companyId, value, onPick }: { options: ReasonOption[]; companyId: CompanyId; value: string | null; onPick: (o: ReasonOption) => void }) {
  const { t } = useTranslation('dealboard')
  const text = useReasonText()
  return (
    <div className="grid grid-cols-1 gap-1.5" role="radiogroup" aria-label={t('trade.why')}>
      {options.map((o) => {
        const on = value === o.id
        return (
          <button key={o.id} type="button" role="radio" aria-checked={on} onClick={() => onPick(o)} className="flex min-h-12 items-center gap-2.5 rounded-lg border-2 border-ink px-2.5 py-1.5 text-left text-[14px] font-bold leading-snug" style={{ background: on ? '#E8B04A' : '#FFF3D6', boxShadow: on ? '2px 2px 0 #2B1A17' : 'none' }}>
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-ink" aria-hidden>{on && <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#2B1A17' }} />}</span>
            <span className="min-w-0 flex-1">{text(o.key, o.params, companyId)}</span>
            <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-ink/60" style={{ background: KIND_DOT[o.kind], opacity: 0 }} aria-hidden />
          </button>
        )
      })}
    </div>
  )
}

/** Why pass? One tap on a reason confirms the pass. */
export function PassDialog({ companyId, options, onPick, onCancel }: { companyId: CompanyId; options: ReasonOption[]; onPick: (o: ReasonOption) => void; onCancel: () => void }) {
  const { t } = useTranslation('dealboard')
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => ref.current?.focus(), [])
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={t('pitch.whyPass')} onKeyDown={(e) => e.key === 'Escape' && onCancel()} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div ref={ref} tabIndex={-1} className="paper db-sheet db-in max-h-[92vh] w-full max-w-[460px] overflow-y-auto p-4 outline-none">
        <div className="mb-3 flex items-center gap-2">
          <Mark id={companyId} size={28} />
          <h2 className="font-sign lang-fit m-0 text-[18px] leading-tight">{t('pitch.whyPass')}</h2>
        </div>
        <ReasonList options={options} companyId={companyId} value={null} onPick={onPick} />
        <div className="mt-3 flex justify-end"><button type="button" className="ink-btn cream" onClick={onCancel}>{t('trade.cancel')}</button></div>
      </div>
    </div>
  )
}
