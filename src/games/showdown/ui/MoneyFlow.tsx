import { useSd } from './useSd'

export interface Flow { label: string; amount: number }

/** One date as a picture: what the fund had, what came in (big and green), what went out (red), what is left. Bars grow and shrink with the balance. */
export function MoneyFlow({ ins, outs, end }: { ins: Flow[]; outs: Flow[]; end: number }) {
  const { t, money } = useSd()
  const inSum = ins.reduce((a, l) => a + l.amount, 0)
  const outSum = outs.reduce((a, l) => a + l.amount, 0)
  const start = end - inSum + outSum
  // running balance after each line
  let run = start
  const rows = [
    ...ins.map((l) => ({ ...l, sign: 1 as const, after: (run += l.amount) })),
    ...outs.map((l) => ({ ...l, sign: -1 as const, after: (run -= l.amount) })),
  ]
  const top = Math.max(1, start, ...rows.map((r) => r.after), ...rows.map((r) => r.after - r.sign * r.amount))
  const w = (n: number) => `${Math.max(0, Math.min(100, (n / top) * 100))}%`
  const Bar = ({ before, after, sign }: { before: number; after: number; sign: 1 | -1 }) => (
    <div className="relative h-4 overflow-hidden rounded-md border-2 border-ink" style={{ background: '#FFF8E6' }} aria-hidden>
      <div className="absolute inset-y-0 left-0" style={{ width: w(Math.max(before, after)), background: sign > 0 ? '#3F7A3A' : '#D8503A' }} />
      <div className="absolute inset-y-0 left-0" style={{ width: w(Math.min(before, after)), background: '#E8B04A' }} />
    </div>
  )
  return (
    <section className="paper p-3">
      <div className="flex items-baseline justify-between text-[14px] font-extrabold"><span>{t('flow.start')}</span><span className="font-display text-[18px]">{money(start)}</span></div>
      <div className="mt-0.5"><Bar before={start} after={start} sign={1} /></div>

      {ins.length > 0 && (
        <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
          {rows.filter((r) => r.sign > 0).map((r) => (
            <li key={r.label} className="anim-squash rounded-xl border-[3px] border-ink px-3 py-2" style={{ background: '#CDE8C4' }}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[15px] font-extrabold leading-tight"><span aria-hidden>💰 </span>{r.label}</span>
                <span className="font-display text-[24px] leading-none" style={{ color: '#2B4A1E' }}>+{money(r.amount)}</span>
              </div>
              <div className="mt-1"><Bar before={r.after - r.amount} after={r.after} sign={1} /></div>
            </li>
          ))}
        </ul>
      )}
      {ins.length === 0 && <p className="m-0 mt-3 text-[13px] font-bold opacity-80">{t('date.nothingIn')}</p>}

      <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
        {rows.filter((r) => r.sign < 0).map((r) => (
          <li key={r.label} className="rounded-xl border-[3px] border-ink px-3 py-1.5" style={{ background: '#FBE0D8' }}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[14px] font-extrabold leading-tight"><span aria-hidden>🧾 </span>{r.label}</span>
              <span className="font-display text-[20px] leading-none" style={{ color: '#7A2A22' }}>−{money(r.amount)}</span>
            </div>
            <div className="mt-1"><Bar before={r.after + r.amount} after={r.after} sign={-1} /></div>
          </li>
        ))}
        {outs.length === 0 && <li className="text-[13px] font-bold opacity-80">{t('date.nothingOut')}</li>}
      </ul>

      <div className="mt-3 flex items-baseline justify-between border-t-[3px] border-dashed border-ink pt-2 text-[16px] font-extrabold">
        <span>{t('flow.end')}</span><span className="font-display text-[24px]">{money(end)}</span>
      </div>
      <div className="mt-0.5"><Bar before={end} after={end} sign={1} /></div>
    </section>
  )
}
