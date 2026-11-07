import { useTranslation } from 'react-i18next'
import type { Pointer, ReviewEntry, Verdict } from '../engine/review'
import type { CompanyId } from '../engine/types'
import { Mark } from './Companies'
import { useInr } from './Panels'
import { useReasonFromParams } from './Reasons'

const TONE: Record<Verdict, { bg: string; fg: string; icon: string }> = {
  good: { bg: '#3F7A3A', fg: '#FFF3D6', icon: '✓' },
  ok: { bg: '#E8B04A', fg: '#2B1A17', icon: '△' },
  risky: { bg: '#C8442F', fg: '#FFF3D6', icon: '✕' },
}

const KIND_COLOUR: Record<Pointer['kind'], string> = { good: '#2f6f4a', bad: '#C8442F', note: '#6B5A4A' }
const KIND_MARK: Record<Pointer['kind'], string> = { good: '✓', bad: '✕', note: 'ⓘ' }

/** Turns a pointer into a sentence: names, sectors, reasons and rupee amounts are filled in and translated. */
export function usePointerText() {
  const { t } = useTranslation('dealboard')
  const money = useInr()
  const reasonFrom = useReasonFromParams()
  return (p: Pointer, companyId: CompanyId): string => {
    const params: Record<string, string | number> = { ...p.params }
    if (typeof params.checks === 'string') params.checks = params.checks.split(',').map((k) => t(`lights.${k}.name`)).join(', ')
    if (typeof params.sector === 'string') params.sector = t(`sectors.${params.sector}`)
    const reason = reasonFrom(p.params, companyId)
    if (reason) params.reason = reason
    for (const [k, v] of Object.entries(p.params)) if (k.startsWith('r_')) params[k] = money(Number(v))
    return t(`review.${p.key}`, params)
  }
}

export function useEntryTitle() {
  const { t } = useTranslation('dealboard')
  const money = useInr()
  return (e: ReviewEntry): string => t(`judgement.types.${e.type}`, { name: t(`companies.${e.companyId}.name`), amt: money(e.amount) })
}

/** The pointers of one decision, grouped into what went well, what to improve and good-to-know. */
export function Pointers({ entry }: { entry: ReviewEntry }) {
  const { t } = useTranslation('dealboard')
  const text = usePointerText()
  const groups = (['good', 'bad', 'note'] as const).map((k) => ({ k, items: entry.pointers.filter((p) => p.kind === k) })).filter((g) => g.items.length)
  return (
    <div className="space-y-2.5 text-[14px] leading-snug">
      {groups.map((g) => (
        <div key={g.k}>
          <div className="db-eyebrow" style={{ color: KIND_COLOUR[g.k] }}>{t(`judgement.sections.${g.k}`)}</div>
          <ul className="m-0 mt-1 list-none space-y-1.5 p-0">
            {g.items.map((p) => (
              <li key={p.key} className="flex items-start gap-2">
                <span className="mt-[1px] w-4 shrink-0 text-center font-extrabold" style={{ color: KIND_COLOUR[g.k] }} aria-hidden>{KIND_MARK[g.k]}</span>
                <span>{text(p, entry.companyId)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

/** One decision: a verdict at a glance, and an expandable list of what went right and what to improve. */
export function ReviewCard({ entry, defaultOpen = false }: { entry: ReviewEntry; defaultOpen?: boolean }) {
  const { t } = useTranslation('dealboard')
  const title = useEntryTitle()
  const tone = TONE[entry.verdict]
  return (
    <details className="group overflow-hidden rounded-xl border-[3px] border-ink bg-jasmine" style={{ boxShadow: '2px 3px 0 #2B1A17' }} open={defaultOpen}>
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-2.5 px-3 py-2 [&::-webkit-details-marker]:hidden">
        <span className="font-sign grid h-8 w-8 shrink-0 place-items-center rounded-full border-[2.5px] border-ink text-[15px]" style={{ background: tone.bg, color: tone.fg }} aria-hidden>{tone.icon}</span>
        <Mark id={entry.companyId} size={24} />
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block text-[11px] font-extrabold uppercase tracking-wider opacity-60">{t('quarterShort', { n: entry.q })} · {t(`judgement.verdict.${entry.verdict}`)}</span>
          <span className="block text-[14px] font-extrabold">{title(entry)}</span>
        </span>
        <span className="shrink-0 text-[13px] font-extrabold transition-transform group-open:rotate-180" aria-hidden>▾</span>
      </summary>
      <div className="border-t-2 border-dashed border-ink/30 px-3 py-3"><Pointers entry={entry} /></div>
    </details>
  )
}

/** A flat, borderless decision row for the final report: coloured edge, one line, tap for the pointers. */
export function ReviewRow({ entry, colour }: { entry: ReviewEntry; colour: string }) {
  const { t } = useTranslation('dealboard')
  const title = useEntryTitle()
  return (
    <details className="group">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2.5 py-1.5 pl-3 [&::-webkit-details-marker]:hidden" style={{ borderLeft: `4px solid ${colour}` }}>
        <Mark id={entry.companyId} size={24} />
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block text-[11px] font-extrabold uppercase tracking-wider opacity-55">{t('quarterShort', { n: entry.q })}</span>
          <span className="block text-[14px] font-extrabold">{title(entry)}</span>
        </span>
        <span className="shrink-0 text-[13px] font-extrabold transition-transform group-open:rotate-180" aria-hidden>▾</span>
      </summary>
      <div className="mb-2 ml-3 border-l-4 py-1 pl-3" style={{ borderColor: colour, opacity: 0.95 }}><Pointers entry={entry} /></div>
    </details>
  )
}
