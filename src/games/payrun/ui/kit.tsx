import { useId } from 'react'
import { ECON } from '../engine/content'
import type { State } from '../engine/types'
import { usePr } from './usePr'

export function GuardrailFooter() {
  const { t } = usePr()
  return (
    <p className="m-0 px-3 py-2 text-center text-[12px] font-extrabold" style={{ color: '#7A2A22' }} role="note">
      ⓘ {t('guardrail')}
    </p>
  )
}

/** The savings jar: coins rise as the jar fills towards the goal. */
export function Pot({ amount, full, color = '#D9A520', size = 44 }: { amount: number; full: number; color?: string; size?: number }) {
  const clip = useId()
  const level = full > 0 ? Math.max(0, Math.min(1, amount / full)) : 0
  const top = 22 + (1 - level) * 48
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 64 74" aria-hidden className="shrink-0">
      <defs><clipPath id={clip}><path d="M12 18 H52 Q58 24 57 44 Q56 70 32 70 Q8 70 7 44 Q6 24 12 18Z" /></clipPath></defs>
      <path d="M12 18 H52 Q58 24 57 44 Q56 70 32 70 Q8 70 7 44 Q6 24 12 18Z" fill="#FFF8E6" />
      <g clipPath={`url(#${clip})`}>
        <rect x="0" y={top} width="64" height="74" fill={color} opacity=".9" style={{ transition: 'y .5s steps(5)' }} />
        {level > 0.05 && [14, 26, 38, 50].map((x, i) => <ellipse key={x} cx={x} cy={top + 3 + (i % 2) * 2} rx="6" ry="2.6" fill="#F0C24A" stroke="#2B1A17" strokeWidth="1.2" />)}
      </g>
      <path d="M12 18 H52 Q58 24 57 44 Q56 70 32 70 Q8 70 7 44 Q6 24 12 18Z" fill="none" stroke="#2B1A17" strokeWidth="3" />
      <rect x="10" y="8" width="44" height="11" rx="3" fill={color} stroke="#2B1A17" strokeWidth="3" />
      <path d="M15 26 Q13 40 16 54" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".7" />
    </svg>
  )
}

/** A small purse for the pocket. */
export function Purse({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden className="shrink-0">
      <path d="M7 14 H33 Q36 14 35 18 L33 33 Q32 36 29 36 H11 Q8 36 7 33 L5 18 Q4 14 7 14Z" fill="#2F6F73" stroke="#2B1A17" strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M12 14 Q12 6 20 6 Q28 6 28 14" fill="none" stroke="#2B1A17" strokeWidth="2.6" />
      <circle cx="20" cy="25" r="4.5" fill="#E8B04A" stroke="#2B1A17" strokeWidth="2" />
    </svg>
  )
}

/** Pocket, jar and goal progress, always in view while playing. A ▼ or ▲ chip shows money moving (never colour alone). */
export function StatsBar({ state, label, delta }: { state: Pick<State, 'pocket' | 'jar'>; label: string; delta?: { pocket: number; jar: number } }) {
  const { t, money } = usePr()
  const chip = (n: number) =>
    n ? (
      <span className="fc-fly rounded-md border-2 border-ink px-1 text-[11px] font-extrabold" style={{ background: n < 0 ? '#F7C9C0' : '#CDE8C4', color: n < 0 ? '#7A2A22' : '#2B4A1E' }}>
        {n < 0 ? '▼' : '▲'}{money(Math.abs(n))}
      </span>
    ) : null
  return (
    <div className="paper px-3 py-2" role="group" aria-label={label}>
      <div className="mb-1 flex items-center justify-between">
        <span className="font-sign lang-fit text-[13px]">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex flex-1 items-center gap-2">
          <Purse />
          <div className="min-w-0">
            <div className="text-[11px] font-extrabold leading-none opacity-80">{t('stats.pocket')}</div>
            <div className="font-display flex items-center gap-1 text-[20px] leading-tight">{money(state.pocket)} {chip(delta?.pocket ?? 0)}</div>
          </div>
        </div>
        <div className="flex flex-1 items-center gap-2">
          <Pot amount={state.jar} full={ECON.goal} size={34} />
          <div className="min-w-0">
            <div className="text-[11px] font-extrabold leading-none opacity-80">{t('stats.jar')}</div>
            <div className="font-display flex items-center gap-1 text-[20px] leading-tight">{money(state.jar)} {chip(delta?.jar ?? 0)}</div>
          </div>
        </div>
      </div>
      <div className="mt-1.5" role="progressbar" aria-valuemin={0} aria-valuemax={ECON.goal} aria-valuenow={state.jar}>
        <div className="h-2.5 overflow-hidden rounded-full border-2 border-ink bg-[#E9D3A6]">
          <div className="h-full" style={{ width: `${Math.min(100, (state.jar / ECON.goal) * 100)}%`, background: 'repeating-linear-gradient(115deg,#E5457A 0 9px,#F28C28 9px 18px)' }} />
        </div>
        <div className="mt-0.5 text-right text-[11px] font-bold opacity-80">{t('stats.goal', { jar: money(state.jar), goal: money(ECON.goal) })}</div>
      </div>
    </div>
  )
}

/** A –/+ stepper in ₹50 steps. */
export function MoneyStepper({ value, max, step = ECON.moveStep, onChange, label }: { value: number; max: number; step?: number; onChange: (n: number) => void; label: string }) {
  const { money } = usePr()
  return (
    <div className="flex items-center justify-center gap-3" role="group" aria-label={label}>
      <button type="button" className="ink-chip font-sign grid h-12 w-12 place-items-center text-[22px] disabled:opacity-40" disabled={value <= 0} aria-label={`− ${money(step)}`} onClick={() => onChange(Math.max(0, value - step))}>−</button>
      <span className="font-display min-w-24 text-center text-[24px]">{money(value)}</span>
      <button type="button" className="ink-chip font-sign grid h-12 w-12 place-items-center text-[22px] disabled:opacity-40" disabled={value + step > max} aria-label={`+ ${money(step)}`} onClick={() => onChange(Math.min(max, value + step))}>+</button>
    </div>
  )
}
