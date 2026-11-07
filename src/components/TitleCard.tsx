import type { ReactNode } from 'react'

/** Calm title card: cream paper, one thin ink outline, serif title. No flourishes. */
export function TitleCard({ eyebrow, title, children, className = '', tone = 'cream' }: { eyebrow?: string; title: ReactNode; children?: ReactNode; className?: string; tone?: 'cream' | 'dusk' }) {
  const dark = tone === 'dusk'
  return (
    <div
      className={`text-center ${className}`}
      style={{
        background: dark ? '#35405A' : '#FBF0D2',
        color: dark ? '#FBF0D2' : '#3A2A24',
        border: '1.5px solid #3A2A24',
        borderRadius: 8,
        boxShadow: '0 2px 0 rgba(58,42,36,.35), 0 10px 22px rgba(58,42,36,.18)',
        padding: '18px 22px 16px',
      }}
    >
      {eyebrow && <div className="mb-1 text-[11px] font-bold uppercase tracking-[.22em]" style={{ color: dark ? '#E0C27A' : '#D9573F' }}>{eyebrow}</div>}
      <h1 className="font-display lang-fit m-0 text-[28px] font-normal leading-[1.12] sm:text-[34px]">{title}</h1>
      {children && <div className="mt-2 text-[15px] font-medium leading-snug">{children}</div>}
    </div>
  )
}
