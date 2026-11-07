import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { reviewDecisions } from '../engine/review'
import { PASS_MARK, computeScore, liveScore, type Score } from '../engine/scoring'
import type { RunState } from '../engine/state'
import type { MarketRun } from '../engine/types'
import { AnalyticsView } from './Analytics'
import { ReviewCard } from './Review'

export const SKILL_KEYS = ['research', 'skepticism', 'spread', 'calm', 'habits'] as const

/** Skill bars: a skill only counts once it has come up, and says how to improve it. */
export function SkillBars({ score }: { score: Score }) {
  const { t } = useTranslation('dealboard')
  return (
    <div>
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {SKILL_KEYS.map((k) => {
          const on = score.measured[k]
          const v = score[k]
          return (
            <li key={k} style={{ opacity: on ? 1 : 0.6 }}>
              <div className="flex items-baseline justify-between gap-2 text-[14px]"><span className="font-extrabold">{t(`report.skills.${k}.name`)}</span><span className="font-sign text-[13px]">{on ? `${v} / 20` : '—'}</span></div>
              <div className="h-2.5 overflow-hidden rounded-full border-2 border-ink bg-[#E9D3A6]"><div className="h-full" style={{ width: on ? `${(v / 20) * 100}%` : 0, background: v >= 14 ? '#3F7A3A' : v >= 8 ? '#E8B04A' : '#C8442F' }} /></div>
              <div className="text-[12px] opacity-75">{on ? t(`judgement.tips.${k}`) : t('judgement.notMeasured')}</div>
            </li>
          )
        })}
      </ul>
      <p className="m-0 mt-2 text-[12px] opacity-65">{t('judgement.skillsHint')}</p>
    </div>
  )
}

/** Big score with how much of the game it is based on. */
export function ScoreBadge({ score, big }: { score: Score; big?: boolean }) {
  const { t } = useTranslation('dealboard')
  const live = liveScore(score)
  return (
    <div className="flex items-center gap-3">
      <div className="text-center">
        <div className={`font-sign leading-none ${big ? 'text-[44px]' : 'text-[30px]'}`} style={{ color: live.value === null ? '#8a7a6a' : live.value >= PASS_MARK ? '#2f6f4a' : '#C8442F' }}>{live.value ?? '—'}</div>
        <div className="text-[10px] font-extrabold uppercase tracking-wider opacity-65">{t('judgement.outOf')}</div>
      </div>
      <div className="text-[12px] leading-snug opacity-80">
        <div className="font-extrabold">{live.value === null ? t('judgement.soFar') : t('judgement.basedOn', { n: live.skills })}</div>
        <div>{t('judgement.passMark', { n: PASS_MARK })}</div>
      </div>
    </div>
  )
}

type Tab = 'decisions' | 'skills' | 'analytics'

/** Your judgement so far: every decision with pointers, the five skills, and the analytics. Opens any time. */
export function JudgementDialog({ run, m, onClose }: { run: RunState; m: MarketRun; onClose: () => void }) {
  const { t } = useTranslation('dealboard')
  const [tab, setTab] = useState<Tab>('decisions')
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => ref.current?.focus(), [])
  const score = computeScore(run, m)
  const entries = reviewDecisions(run, m).reverse()
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={t('judgement.title')} onKeyDown={(e) => e.key === 'Escape' && onClose()} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} className="paper db-sheet db-in flex max-h-[94vh] w-full max-w-[520px] flex-col overflow-hidden outline-none">
        <div className="border-b-[3px] border-ink bg-[#F6E6BE] px-4 pb-2.5 pt-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="font-sign lang-fit m-0 text-[20px] leading-tight">{t('judgement.title')}</h2>
              <p className="m-0 mt-0.5 text-[12px] leading-snug opacity-75">{t('judgement.sub')}</p>
            </div>
            <button type="button" className="ink-chip h-11 shrink-0 px-3 text-[13px] font-extrabold" onClick={onClose} aria-label={t('judgement.close')}>✕</button>
          </div>
          <div className="mt-2"><ScoreBadge score={score} /></div>
          <div className="mt-2.5 grid grid-cols-3 gap-1.5" role="tablist">
            {(['decisions', 'skills', 'analytics'] as const).map((k) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className="min-h-11 rounded-lg border-2 border-ink px-1 text-[13px] font-extrabold" style={{ background: tab === k ? '#E5457A' : '#FFF3D6', color: tab === k ? '#FFF3D6' : '#2B1A17' }}>
                {t(`judgement.tabs.${k}`)}{k === 'decisions' && entries.length ? ` (${entries.length})` : ''}
              </button>
            ))}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3" role="tabpanel">
          {tab === 'decisions' && (entries.length === 0 ? <p className="m-0 text-[14px] opacity-75">{t('judgement.empty')}</p> : (
            <div className="flex flex-col gap-2.5">{entries.map((e, i) => <ReviewCard key={e.id} entry={e} defaultOpen={i === 0} />)}</div>
          ))}
          {tab === 'skills' && <SkillBars score={score} />}
          {tab === 'analytics' && <AnalyticsView run={run} m={m} />}
        </div>
      </div>
    </div>
  )
}
