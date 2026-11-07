import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { COMPANY, SECTOR_COLOUR } from '../engine/companies'
import type { CompanyId } from '../engine/types'
import { IconSearch } from './icons'

/** Painted portraits (background removed). Founders without one fall back to the drawn face below. */
const PHOTO: Partial<Record<CompanyId, string>> = {
  dailyBasket: '/art/founders/dailyBasket.webp',
  solarGrid: '/art/founders/solarGrid.webp',
  payEasy: '/art/founders/payEasy.webp',
  quickRide: '/art/founders/quickRide.webp',
  medLink: '/art/founders/medLink.webp',
}

const LOOKS: Record<CompanyId, { skin: string; hair: string; shirt: string; style: 'bun' | 'short' | 'bald' | 'long'; glasses?: boolean; beard?: boolean }> = {
  dailyBasket: { skin: '#C98B63', hair: '#3a2a24', shirt: '#F28C28', style: 'short', beard: true },
  payEasy: { skin: '#E0AA80', hair: '#1f1a17', shirt: '#7C5BC4', style: 'short', glasses: true },
  solarGrid: { skin: '#B97B55', hair: '#2b2623', shirt: '#E8B04A', style: 'short', beard: true },
  medLink: { skin: '#D69B72', hair: '#2b1a17', shirt: '#2F8F8F', style: 'long' },
  steelWorks: { skin: '#C48A66', hair: '#c9c2b8', shirt: '#6D86A8', style: 'bald', beard: true },
  quickRide: { skin: '#D9A07A', hair: '#241513', shirt: '#D9573F', style: 'long', glasses: true },
}

function DrawnFace({ id }: { id: CompanyId }) {
  const l = LOOKS[id]
  return (
    <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden style={{ display: 'block' }}>
      <path d="M8 64c2-14 12-20 24-20s22 6 24 20Z" fill={l.shirt} stroke="#2B1A17" strokeWidth="2.4" strokeLinejoin="round" />
      {l.style === 'long' && <path d="M14 30c0-14 8-20 18-20s18 6 18 20v18H14Z" fill={l.hair} stroke="#2B1A17" strokeWidth="2.4" />}
      <ellipse cx="32" cy="31" rx="13" ry="15" fill={l.skin} stroke="#2B1A17" strokeWidth="2.4" />
      {l.style === 'short' && <path d="M19 28c0-10 5-15 13-15s13 5 13 15c-4-5-9-6-13-6s-9 1-13 6Z" fill={l.hair} stroke="#2B1A17" strokeWidth="2.2" strokeLinejoin="round" />}
      {l.style === 'bun' && <><circle cx="32" cy="12" r="5.5" fill={l.hair} stroke="#2B1A17" strokeWidth="2.2" /><path d="M19 28c0-9 5-14 13-14s13 5 13 14c-4-4-9-5-13-5s-9 1-13 5Z" fill={l.hair} stroke="#2B1A17" strokeWidth="2.2" strokeLinejoin="round" /></>}
      {l.style === 'long' && <path d="M19 29c0-9 5-14 13-14s13 5 13 14c-4-4-9-5-13-5s-9 1-13 5Z" fill={l.hair} stroke="#2B1A17" strokeWidth="2.2" strokeLinejoin="round" />}
      {l.style === 'bald' && <path d="M19 28c1-3 3-5 4-5M45 28c-1-3-3-5-4-5" stroke={l.hair} strokeWidth="4" strokeLinecap="round" fill="none" />}
      {l.beard && <path d="M20 35c1 9 6 12 12 12s11-3 12-12c-3 4-7 5-12 5s-9-1-12-5Z" fill={l.hair} opacity=".9" />}
      <circle cx="27" cy="31" r="1.8" fill="#2B1A17" />
      <circle cx="37" cy="31" r="1.8" fill="#2B1A17" />
      {l.glasses && <g fill="none" stroke="#2B1A17" strokeWidth="1.8"><circle cx="27" cy="31" r="4.6" /><circle cx="37" cy="31" r="4.6" /><path d="M31.6 31h0.8" /></g>}
      <path d="M28 38c2 2 6 2 8 0" stroke="#2B1A17" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  )
}

/** A founder's portrait in a rounded frame tinted with their company's colour. */
export function FounderFace({ id, size = 44 }: { id: CompanyId; size?: number }) {
  const photo = PHOTO[id]
  return (
    <span className="block overflow-hidden" style={{ width: size, height: size, background: SECTOR_COLOUR[COMPANY[id].sector] }} aria-hidden>
      {photo
        ? <img src={photo} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 12%', display: 'block' }} />
        : <DrawnFace id={id} />}
    </span>
  )
}

const TILT = ['-1.5deg', '1deg', '-0.5deg']

/** The founder's story: a portrait, three sticker facts, a career timeline and one clue to spot. */
export function FounderProfile({ id, onClose }: { id: CompanyId; onClose: () => void }) {
  const { t } = useTranslation('dealboard')
  const [look, setLook] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { ref.current?.focus() }, [])
  const colour = SECTOR_COLOUR[COMPANY[id].sector]
  const jobs = (['j0', 'j1', 'j2'] as const).map((j) => {
    const [when, ...rest] = t(`founders.${id}.${j}`).split(' · ')
    return { when, what: rest.join(' · ') }
  })
  const facts = [
    { k: 'age', v: t(`founders.${id}.age`), l: t('pitch3.ageL') },
    { k: 'yrs', v: t(`founders.${id}.yrs`), l: t('pitch3.yrsL') },
    { k: 'starts', v: t(`founders.${id}.starts`), l: t('pitch3.startsL') },
  ]
  const host = typeof document === 'undefined' ? null : document.querySelector<HTMLElement>('.db-root')
  const node = (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={t(`founders.${id}.name`)} onKeyDown={(e) => e.key === 'Escape' && onClose()} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} className="paper db-sheet db-in max-h-[92vh] w-full max-w-[440px] overflow-y-auto outline-none">
        <div className="relative flex items-end gap-3 border-b-[3px] border-ink px-4 pt-4" style={{ background: `linear-gradient(135deg, ${colour}, ${colour}CC)` }}>
          <div className="-mb-px h-[132px] w-[118px] shrink-0 overflow-hidden" style={{ filter: 'drop-shadow(3px 3px 0 rgba(43,26,23,.55))' }}>
            {PHOTO[id]
              ? <img src={PHOTO[id]} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 8%' }} />
              : <FounderFace id={id} size={118} />}
          </div>
          <div className="min-w-0 flex-1 pb-3">
            <div className="text-[10px] font-extrabold uppercase tracking-[.16em] text-jasmine/90">{t('pitch3.founder')} · {t(`companies.${id}.name`)}</div>
            <h2 className="font-sign lang-fit m-0 mt-0.5 text-[22px] leading-tight text-jasmine" style={{ textShadow: '1.5px 1.5px 0 #2B1A17' }}>{t(`founders.${id}.name`)}</h2>
            <span className="mt-1.5 inline-block rounded-full border-2 border-ink bg-jasmine px-2.5 py-0.5 text-[12px] font-extrabold">{t(`founders.${id}.role`)}</span>
          </div>
        </div>

        <div className="px-4 pb-4 pt-3">
          <div className="grid grid-cols-3 gap-2">
            {facts.map((f, i) => (
              <div key={f.k} className="rounded-lg border-2 border-ink bg-white/70 px-1 py-1.5 text-center" style={{ transform: `rotate(${TILT[i]})`, boxShadow: '2px 2px 0 rgba(43,26,23,.5)' }}>
                <div className="font-sign text-[22px] leading-none">{f.v}</div>
                <div className="mt-1 text-[10px] font-extrabold uppercase tracking-wider opacity-65">{f.l}</div>
              </div>
            ))}
          </div>

          <div className="db-eyebrow mt-4 text-[#8a5a2b]">{t('pitch3.career')}</div>
          <ol className="m-0 mt-2 list-none p-0">
            {jobs.map((j, i) => (
              <li key={i} className="relative flex gap-3 pb-3 last:pb-0">
                {i < 2 && <span className="absolute left-[6px] top-5 h-[calc(100%-8px)] w-[3px] rounded bg-ink/35" aria-hidden />}
                <span className="relative z-[1] mt-1 h-[15px] w-[15px] shrink-0 rounded-full border-[2.5px] border-ink" style={{ background: i === 2 ? '#E5457A' : '#E8B04A' }} aria-hidden />
                <span className="min-w-0">
                  <span className="mb-0.5 inline-block rounded border-2 border-ink px-1.5 text-[11px] font-extrabold leading-5" style={{ background: i === 2 ? '#F9C9D8' : '#F6E6BE' }}>{j.when}</span>
                  <span className="block text-[14px] font-semibold leading-snug">{j.what}</span>
                </span>
              </li>
            ))}
          </ol>

          {look ? (
            <div className="db-in mt-3 flex items-start gap-2.5 rounded-lg border-2 border-ink px-3 py-2.5" style={{ background: '#FBE7A1', transform: 'rotate(-0.6deg)', boxShadow: '3px 3px 0 #2B1A17' }}>
              <span className="mt-0.5 shrink-0" aria-hidden><IconSearch size={20} /></span>
              <span>
                <span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-[#8a5a2b]">{t('pitch3.clue')}</span>
                <span className="block text-[14px] font-extrabold leading-snug">{t(`founders.${id}.notice`)}</span>
              </span>
            </div>
          ) : (
            <button type="button" className="ink-btn pink mt-3 flex w-full items-center justify-center gap-2" aria-expanded={false} onClick={() => setLook(true)}>
              <IconSearch size={20} /> {t('pitch3.look')}
            </button>
          )}
          <div className="mt-3 flex justify-end"><button type="button" className="ink-btn cream" onClick={onClose}>{t('pitch3.close')}</button></div>
        </div>
      </div>
    </div>
  )
  return host ? createPortal(node, host) : node
}
