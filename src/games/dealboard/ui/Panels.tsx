import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { inr } from '../../../content/data'
import { useGame } from '../../../store/game'
import type { Banner } from '../engine/types'

export const useInr = () => {
  const lang = useGame((s) => s.language)
  return (n: number) => inr(n, lang)
}

/** Cream sheet beside or under the board: one decision area at a time. */
export function Sheet({ eyebrow, title, icon, tone, children, actions }: { eyebrow?: ReactNode; title: ReactNode; icon?: ReactNode; tone?: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <section className="paper db-sheet db-in relative overflow-hidden p-4">
      {tone && <div className="absolute inset-x-0 top-0 h-2 border-b-2 border-ink" style={{ background: tone }} />}
      <div className="mt-1 flex items-center gap-3">
        {icon && <div className="shrink-0">{icon}</div>}
        <div className="min-w-0 flex-1">
          {eyebrow && <div className="db-eyebrow lang-fit text-[#8a5a2b]">{eyebrow}</div>}
          <h2 className="font-sign lang-fit m-0 text-[20px] leading-tight">{title}</h2>
        </div>
      </div>
      {children && <div className="mt-2 text-[15px] leading-snug">{children}</div>}
      {actions && <div className="db-actions mt-3 flex items-stretch justify-center gap-2">{actions}</div>}
    </section>
  )
}

/** One line about what the whole market did, shown only when it was notable (a fall, a recovery, a sector rally). */
export function MarketLine({ banner }: { banner: Banner }) {
  const { t } = useTranslation('dealboard')
  if (banner.key === 'quiet') return null
  const text = banner.key === 'sectorRally' ? t('news.sectorRally', { sector: t(`sectors.${banner.sector}`) }) : t(`news.${banner.key}`)
  const down = banner.marketShock < 0
  return (
    <div className={`flex items-start gap-2 rounded-lg border-2 border-ink px-3 py-2 ${down ? 'db-flash red' : 'db-flash green'}`} style={{ background: down ? '#F5D9CF' : '#E4EDCF' }} role="status">
      <span className="font-sign text-[16px] leading-none" style={{ color: down ? '#C8442F' : '#2f6f4a' }} aria-hidden>{down ? '▼' : '▲'}</span>
      <span className="text-[14px] font-semibold leading-snug"><span className="font-extrabold">{t('desk.market')}: </span>{text}</span>
    </div>
  )
}

export function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col leading-none">
      <span className="text-[10px] font-extrabold uppercase tracking-[.14em] opacity-60">{label}</span>
      <span className={`mt-1 truncate ${strong ? 'font-sign text-[14px] sm:text-[16px]' : 'text-[13px] font-extrabold sm:text-[14px]'}`}>{value}</span>
    </div>
  )
}

/** A short flashing strip for a wildcard: a rival entering, or anything the player did not see coming. */
export function AlertStrip({ children, tag, tone = 'bad' }: { children: React.ReactNode; tag?: string; tone?: 'bad' | 'good' }) {
  const { t } = useTranslation('dealboard')
  return (
    <div className={`db-flash ${tone === 'good' ? 'green' : 'red'} flex items-start gap-2 rounded-lg border-2 border-ink px-3 py-2`} style={{ background: tone === 'good' ? '#E4EDCF' : '#F5D9CF' }} role="status">
      <span className="font-sign mt-0.5 shrink-0 whitespace-nowrap rounded border-2 border-ink px-1.5 text-[10px] leading-5 text-jasmine" style={{ background: tone === 'good' ? '#3F7A3A' : '#C8442F' }}>{tag ?? t('alert.tag')}</span>
      <span className="text-[14px] font-semibold leading-snug">{children}</span>
    </div>
  )
}
