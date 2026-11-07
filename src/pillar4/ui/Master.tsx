import { useMemo, useState } from 'react'
import type { Step } from '../types.ts'
import { CASES } from '../content/index.ts'
import { indexCase } from '../engine/case.ts'
import { shuffle } from '../engine/progress.ts'
import { usePillar4 } from '../store.ts'
import { useT } from './useT.ts'
import { AppIcon, Icon, ReasonIcon, ShieldMark } from './icons.tsx'
import { HelpCard } from './FixReplay.tsx'
import { AnalystMark } from './Analyst.tsx'
import { sfx } from './feedback.ts'

const STEPS: Step[] = [1, 2, 3, 4, 5]
const OPTIONS: Record<Step, { key: string; correct: boolean }[]> = {
  1: [{ key: 'ui.master.q1.a', correct: true }, { key: 'ui.master.q1.b', correct: false }, { key: 'ui.master.q1.c', correct: false }],
  2: [{ key: 'ui.master.q2.a', correct: false }, { key: 'ui.master.q2.b', correct: true }, { key: 'ui.master.q2.c', correct: false }],
  3: [{ key: 'ui.master.q3.a', correct: true }, { key: 'ui.master.q3.b', correct: false }, { key: 'ui.master.q3.c', correct: false }],
  4: [{ key: 'ui.master.q4.a', correct: true }, { key: 'ui.master.q4.b', correct: false }, { key: 'ui.master.q4.c', correct: false }],
  5: [{ key: 'ui.master.q5.a', correct: false }, { key: 'ui.master.q5.b', correct: true }, { key: 'ui.master.q5.c', correct: false }],
}

/** Pattern analysis: lay the closed cases side by side and name what they share, one stage at a time. */
export default function MasterBoard({ onDone }: { onDone: () => void }) {
  const t = useT()
  const mystery = usePillar4((s) => s.mysteryCurrent)
  const progress = usePillar4((s) => s.progress)
  const [col, setCol] = useState<Step | null>(null)
  const [answered, setAnswered] = useState<Set<Step>>(new Set())
  const [wrong, setWrong] = useState<string | null>(null)
  const rows = ['C1', 'C2', 'C3', ...(mystery ? [mystery] : [])]
  const order = useMemo(() => Object.fromEntries(STEPS.map((s) => [s, shuffle(OPTIONS[s])])) as Record<Step, typeof OPTIONS[Step]>, [])
  const revealed = answered.size === 5

  const pick = (s: Step, o: { key: string; correct: boolean }) => {
    if (o.correct) { sfx.success(); setAnswered((a) => new Set(a).add(s)); setWrong(null); setCol(null) }
    else { sfx.soft(); setWrong(o.key) }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
      <div className="flex items-start gap-3">
        <AnalystMark mood={revealed ? 'pleased' : 'thinking'} />
        <div>
          <div className="p4-eyebrow">{t('ui.master.eyebrow')}</div>
          <h2 className="p4-h1">{t('ui.master.title')}</h2>
          <p className="m-0 mt-1 text-[15px] p4-muted">{t(revealed ? 'ui.master.reveal' : 'ui.master.intro')}</p>
        </div>
      </div>

      <div className="p4-panel overflow-x-auto !p-3">
        <div className="grid min-w-[300px] items-center gap-1.5" style={{ gridTemplateColumns: '44px repeat(5, minmax(0,1fr))' }}>
          <span />
          {STEPS.map((s) => (
            <button key={s} type="button" disabled={revealed || answered.has(s)} onClick={() => { setCol(s); setWrong(null) }} aria-label={t(`ui.step.${s}.name`)}
              className={`p4-btn !px-0 ${col === s ? 'is-on' : ''}`} style={answered.has(s) ? { color: 'var(--p4-ok)', borderColor: 'var(--p4-ok)' } : undefined}>
              {answered.has(s) ? <Icon name="check" size={18} /> : s}
            </button>
          ))}
          {rows.map((r) => {
            const idx = indexCase(CASES[r])
            const p = progress[r]
            return (
              <div key={r} className="contents">
                <span className="text-[11.5px] font-bold p4-muted" title={t(`${r}.title`)}>{r.startsWith('M') ? t('ui.master.row.mystery') : r}</span>
                {STEPS.map((s) => (
                  <div key={s} className="flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-lg p-1" style={{ background: col === s ? 'color-mix(in srgb, var(--p4-accent) 14%, var(--p4-surface))' : 'var(--p4-surface2)' }}>
                    {idx.required.filter((c) => c.step === s && p?.pinned.includes(c.id)).map((c) => (
                      <span key={c.id} className="flex items-center gap-1" title={c.id}>
                        <AppIcon app={idx.zones.get(c.targets[0])?.item.app ?? 'messages'} size={18} />
                        {c.reason && <span style={{ color: 'var(--p4-accent)' }}><ReasonIcon reason={c.reason} size={14} /></span>}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {!revealed && !col && <p className="m-0 text-center text-[14px] p4-muted">{t('ui.master.tap')}</p>}

      {col && !revealed && (
        <div className="p4-panel">
          <div className="p4-eyebrow mb-1">{t(`ui.step.${col}.name`)}</div>
          <p className="m-0 mb-3 text-[16.5px] font-semibold leading-snug">{t(`ui.master.q${col}`)}</p>
          <div className="flex flex-col gap-2">
            {order[col].map((o) => (
              <button key={o.key} type="button" className={`p4-option ${wrong === o.key ? 'is-wrong' : ''}`} onClick={() => pick(col, o)} data-correct={o.correct}>
                <span className="text-[15px]">{t(o.key)}</span>
              </button>
            ))}
          </div>
          {wrong && <p className="m-0 mt-2 text-[14px]" style={{ color: 'var(--p4-danger)' }}>{t('ui.master.hint')}</p>}
        </div>
      )}

      {revealed && (
        <>
          <div className="p4-panel">
            <div className="p4-eyebrow mb-2">{t('ui.master.chain')}</div>
            <ol className="m-0 flex list-none flex-wrap items-center gap-2 p-0">
              {STEPS.map((s, i) => (
                <li key={s} className="flex items-center gap-2">
                  <span className="p4-chip is-accent">{s}. {t(`ui.step.${s}.name`)}</span>
                  {i < 4 && <span className="p4-muted">→</span>}
                </li>
              ))}
            </ol>
          </div>
          <div className="p4-panel flex flex-col items-center gap-2 text-center">
            <ShieldMark pieces={['protect', 'verify', 'pause']} size={96} />
            <div className="p4-h2">{t('ui.master.rules')}</div>
            <ul className="m-0 flex list-none flex-col gap-2 p-0 text-left text-[15px] leading-snug">
              {(['pause', 'verify', 'protect'] as const).map((r) => <li key={r}>{t(`ui.rule.${r}`)}</li>)}
            </ul>
            <p className="m-0 mt-1 text-[15px] font-bold" style={{ color: 'var(--p4-ok)' }}>{t('ui.master.rewards')}</p>
          </div>
          <HelpCard t={t} />
          <p className="m-0 text-center text-[15px]">{t('analyst.finalPrompt')}</p>
          <button type="button" className="p4-btn primary self-center" onClick={onDone}>{t('ui.master.finish')}</button>
        </>
      )}
    </div>
  )
}
