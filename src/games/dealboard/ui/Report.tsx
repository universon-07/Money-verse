import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PASS_MARK, type Score } from '../engine/scoring'
import { Stars } from '../../../ui/kit/Icons'
import '../../../ui/kit/minar.css'
import { starsFor } from '../../../progress/points'
import type { RunState } from '../engine/state'
import { marketFor } from '../engine/state'
import { reviewDecisions, type Verdict } from '../engine/review'
import { AnalyticsView } from './Analytics'
import { ReviewRow } from './Review'
import { InfoHeader } from './InfoTip'
import { useInr } from './Panels'

const SKILLS = ['research', 'skepticism', 'spread', 'calm', 'habits'] as const
const INK = '#2B1A17'
const VERDICTS: { v: Verdict; colour: string; icon: string }[] = [
  { v: 'good', colour: '#3F7A3A', icon: '✓' },
  { v: 'ok', colour: '#E8B04A', icon: '△' },
  { v: 'risky', colour: '#C8442F', icon: '✕' },
]
type Tab = 'overview' | Verdict | 'analytics'

/** Five-axis radar, each axis out of 20. */
function Radar({ score }: { score: Score }) {
  const { t } = useTranslation('dealboard')
  const size = 220, c = size / 2, R = 78
  const pt = (i: number, f: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / SKILLS.length
    return [c + Math.cos(a) * R * f, c + Math.sin(a) * R * f] as const
  }
  const poly = (f: (i: number) => number) => SKILLS.map((_, i) => pt(i, f(i)).join(',')).join(' ')
  return (
    <svg viewBox={`-50 -12 ${size + 100} ${size + 24}`} width="100%" style={{ maxWidth: 300 }} role="img" aria-label={SKILLS.map((k) => `${t(`report.skills.${k}.name`)} ${score[k]} of 20`).join(', ')}>
      {[0.25, 0.5, 0.75, 1].map((f) => <polygon key={f} points={poly(() => f)} fill="none" stroke={INK} strokeOpacity={f === 1 ? 0.7 : 0.25} strokeWidth="1.5" />)}
      {SKILLS.map((_, i) => <line key={i} x1={c} y1={c} x2={pt(i, 1)[0]} y2={pt(i, 1)[1]} stroke={INK} strokeOpacity=".25" />)}
      <polygon points={poly((i) => Math.max(0.04, score[SKILLS[i]] / 20))} fill="#E5457A" fillOpacity=".4" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      {SKILLS.map((k, i) => {
        const [x, y] = pt(i, 1.32)
        return <text key={k} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="9.5" fontWeight="800" fill={INK}>{t(`report.skills.${k}.name`)}</text>
      })}
    </svg>
  )
}

/** Final report: one card that fills the screen, with tabs. The headline is judgement, never profit. */
export function Report({ run, score, onComplete, onAgain, onExit }: { run: RunState; score: Score; onComplete: (s: Score) => void; onAgain: () => void; onExit: () => void }) {
  const { t } = useTranslation('dealboard')
  const money = useInr()
  const sent = useRef(false)
  const [tab, setTab] = useState<Tab>('overview')
  useEffect(() => {
    if (sent.current) return
    sent.current = true
    onComplete(score)
  }, [onComplete, score])

  const m = marketFor(run.seed)
  const entries = reviewDecisions(run, m)
  const toolkit = run.seen.filter((id) => id < 100).map((id) => ({ id, term: t(`lite.${id}.term`), title: t(`lite.${id}.title`) }))
  const ahead = score.profit > 0 && score.total < 75
  const behind = score.profit < 0 && score.total >= PASS_MARK
  const tone = score.cleared ? '#3F7A3A' : '#C8442F'
  const count = (v: Verdict) => entries.filter((e) => e.verdict === v).length
  const tabs: { id: Tab; label: string; badge?: string; colour: string }[] = [
    { id: 'overview', label: t('report2.overview'), colour: '#E5457A' },
    ...VERDICTS.map((x) => ({ id: x.v as Tab, label: t(`judgement.verdict.${x.v}`), badge: `${x.icon} ${count(x.v)}`, colour: x.colour })),
    { id: 'analytics', label: t('judgement.tabs.analytics'), colour: '#5BB5D6' },
  ]
  return (
    <div className="fixed inset-x-0 top-0 bottom-10 z-30 flex justify-center p-2 sm:p-4" aria-live="polite">
      <section className="paper flex h-full w-full max-w-[860px] flex-col overflow-hidden">
        <div className="h-2 shrink-0 border-b-2 border-ink" style={{ background: score.cleared ? '#3F7A3A' : '#E8B04A' }} />
        <header className="flex shrink-0 items-center gap-3 px-4 pt-2.5">
          <div className="min-w-0 flex-1">
            <div className="db-eyebrow flex items-center gap-2 text-[#8a5a2b]"><Stars n={starsFor(score.total / 100, score.cleared)} size={16} /> {t('report.eyebrow')}</div>
            <h2 className="font-sign lang-fit m-0 text-[20px] leading-tight sm:text-[24px]">{t('report.title')}</h2>
          </div>
          <div className="shrink-0 text-right">
            <div className="font-sign text-[40px] leading-none sm:text-[48px]" style={{ color: tone }}>{score.total}</div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider opacity-70">{t('report.of100')}</div>
          </div>
        </header>

        <div role="tablist" aria-label={t('report.title')} className="mt-2 grid shrink-0 grid-cols-5 gap-1 px-2 pb-1 pt-1 sm:gap-1.5 sm:px-3">
          {tabs.map((x) => {
            const on = tab === x.id
            return (
              <button key={x.id} type="button" role="tab" aria-selected={on} onClick={() => setTab(x.id)} className="flex min-h-12 min-w-0 flex-col items-center justify-center rounded-xl border-[2.5px] border-ink px-0.5 text-[11px] font-extrabold leading-tight sm:text-[13px]" style={{ background: on ? x.colour : '#FFF3D6', color: on && x.id !== 'ok' && x.id !== 'analytics' ? '#FFF3D6' : INK, boxShadow: on ? '2px 3px 0 #2B1A17' : 'none' }}>
                <span className="max-w-full truncate">{x.label}</span>{x.badge && <span className="opacity-90">{x.badge}</span>}
              </button>
            )
          })}
        </div>

        <div role="tabpanel" className="min-h-0 flex-1 overflow-y-auto border-t-2 border-ink/20 px-4 pb-4 pt-3">
          {tab === 'overview' && (
            <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
              <div className="flex flex-col items-center gap-2">
                <div className="rounded-full border-2 px-3 py-1 text-[13px] font-extrabold" style={{ borderColor: tone, color: tone }}>{score.cleared ? '✓ ' + t('report.cleared') : t('report.notCleared')} · {t('report.passMark', { n: PASS_MARK })}</div>
                <Radar score={score} />
              </div>
              <div>
                <InfoHeader title={t('report.skillsTitle')}>
                  <ul className="m-0 list-none space-y-1 p-0">{SKILLS.map((k) => <li key={k}><b>{t(`report.skills.${k}.name`)}</b>: {t(`report.skills.${k}.body`)}</li>)}</ul>
                </InfoHeader>
                <ul className="m-0 mt-1 flex list-none flex-col gap-2 p-0">
                  {SKILLS.map((k) => (
                    <li key={k}>
                      <div className="flex items-baseline justify-between gap-2 text-[14px]"><span className="font-extrabold">{t(`report.skills.${k}.name`)}</span><span className="font-sign text-[13px]">{score[k]} / 20</span></div>
                      <div className="h-2.5 overflow-hidden rounded-full border-2 border-ink bg-[#E9D3A6]"><div className="h-full" style={{ width: `${(score[k] / 20) * 100}%`, background: score[k] >= 14 ? '#3F7A3A' : score[k] >= 8 ? '#E8B04A' : '#C8442F' }} /></div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="sm:col-span-2">
                {score.traps.length > 0 && (
                  <ul className="m-0 list-none p-0 text-[14px]">
                    {score.traps.map((x) => (
                      <li key={x.companyId} className="flex justify-between gap-2 border-b border-dashed border-ink/25 py-1">
                        <span className="font-bold">{t(`companies.${x.companyId}.name`)}</span>
                        <span>{x.points >= 1 ? '✓ ' : x.points > 0 ? '△ ' : '✕ '}{t(`report.trap.${x.result}`)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 text-[13px] leading-snug">
                  <InfoHeader title={<span><span className="font-extrabold">{t('report.netWorth')}:</span> {money(score.netWorth)} · {score.profit >= 0 ? '▲ ' : '▼ '}{money(Math.abs(score.profit))}</span>} className="text-[13px]">{t('report.profitNote')}</InfoHeader>
                  {ahead && <div className="mt-1 font-bold">{t('report.luck')}</div>}
                  {behind && <div className="mt-1 font-bold">{t('report.unlucky')}</div>}
                </div>
                {toolkit.length > 0 && (
                  <ul className="m-0 mt-3 flex list-none flex-wrap gap-1.5 p-0">
                    {toolkit.map((x) => <li key={x.id} title={x.title} className="rounded-full border-2 border-ink bg-mustard px-2 py-0.5 text-[12px] font-extrabold">{x.term}</li>)}
                  </ul>
                )}
                <p className="m-0 mt-3 text-[13px] font-semibold italic opacity-80">{t('report.closing')}</p>
              </div>
            </div>
          )}

          {VERDICTS.map((x) => tab === x.v && (
            <div key={x.v}>
              {count(x.v) === 0
                ? <p className="m-0 py-6 text-center text-[14px] opacity-65">{t('judgement.empty')}</p>
                : <div className="divide-y divide-ink/15">{entries.filter((e) => e.verdict === x.v).map((e) => <ReviewRow key={e.id} entry={e} colour={x.colour} />)}</div>}
            </div>
          ))}

          {tab === 'analytics' && <AnalyticsView run={run} m={m} />}
        </div>

        <footer className="flex shrink-0 justify-end gap-2 sm:gap-3 border-t-2 border-ink/20 px-3 py-2">
          <button type="button" className="ink-btn cream min-w-0 flex-1 sm:flex-none" style={{ minHeight: 48, fontSize: 13, padding: '4px 10px', lineHeight: 1.15 }} onClick={onExit}>◀ {t('report.back')}</button>
          <button type="button" className="ink-btn pink min-w-0 flex-1 sm:flex-none" style={{ minHeight: 48, fontSize: 13, padding: '4px 10px', lineHeight: 1.15 }} onClick={onAgain}>{t('report.again')}</button>
        </footer>
      </section>
    </div>
  )
}
