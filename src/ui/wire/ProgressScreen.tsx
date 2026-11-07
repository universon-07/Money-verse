import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { inr, type PillarId } from '../../content/data'
import { useProgressView } from '../../features/progress/hooks'
import { useGame } from '../../store/game'
import { GoalMeter } from './GoalMeter'
import { HappyMeter } from './HappyMeter'
import { MomentsOpener } from './MomentsOpener'
import { TiredNote } from './TiredNote'
import { StateGlyph } from './icons'

/**
 * "How am I doing?": the goal meter, a card per pillar (state as an icon AND a text label, never colour alone), details on
 * select with a Play/Replay link, and a plain explanation when the Happy Index is holding progress back.
 * No maths here: everything comes from the progress view-model. TODO(final-ui): wireframe, replaced by the real design.
 */
export function ProgressScreen() {
  const { t } = useTranslation()
  const lang = useGame((s) => s.language)
  const view = useProgressView()
  const [selected, setSelected] = useState<PillarId | null>(null)
  const { happyPenalty } = view
  return (
    <div data-testid="progress-screen" className="absolute inset-0 overflow-y-auto bg-jasmine text-ink">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b-[3px] border-ink bg-paper-tan px-2 py-1" style={{ paddingTop: 'max(4px, env(safe-area-inset-top))' }}>
        <Link to="/" className="ink-btn" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 48 }} data-testid="progress-back">← {t('progress.back')}</Link>
        <strong style={{ flex: 1 }}>{t('progress.title')}</strong>
      </header>

      <main style={{ width: '100%', maxWidth: 'min(100%, 40rem)', margin: '0 auto', padding: 12, display: 'grid', gap: 12 }}>
        <GoalMeter />
        <p data-testid="progress-summary" aria-live="polite" style={{ margin: 0, fontWeight: 700 }}>{t(view.summary.key, view.summary.params)}</p>
        <HappyMeter />
        <TiredNote />

        {happyPenalty.active && (
          <section data-testid="happy-penalty" style={{ display: 'grid', gap: 4, padding: 10, border: '2px solid var(--color-ink)', borderRadius: 8, background: 'var(--color-paper-tan)' }}>
            <strong>{t('progress.penalty.title')}</strong>
            <span>{t('progress.penalty.body', { count: happyPenalty.pillarCount, amount: inr(happyPenalty.lostAmount, lang) })}</span>
            <span>{t('progress.penalty.how')}</span>
          </section>
        )}

        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
          {view.pillars.map((p) => {
            const open = selected === p.id
            return (
              <li key={p.id} data-testid={`pillar-card-${p.id}`} data-state={p.state} style={{ border: '3px solid var(--color-ink)', borderRadius: 8, padding: 10, display: 'grid', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <StateGlyph icon={p.icon} />
                  <strong style={{ flex: 1 }}>{t(p.nameKey)}</strong>
                  <span data-testid={`pillar-state-${p.id}`}>{t(p.stateLabelKey)}</span>
                </div>
                {p.state === 'partial' && <span data-testid={`pillar-partial-${p.id}`}>{t('progress.partial', { percent: p.partialPercent })}</span>}
                <div>
                  <button type="button" className="ink-btn cream" data-testid={`pillar-details-toggle-${p.id}`} aria-expanded={open} onClick={() => setSelected(open ? null : p.id)}>
                    {open ? t('progress.hideDetails') : t('progress.details')}
                  </button>
                </div>
                {open && (
                  <div data-testid={`pillar-detail-${p.id}`} style={{ display: 'grid', gap: 4 }}>
                    <span>{t('progress.quality')}: <strong>{p.attempts > 0 ? `${p.qualityPercent}%` : t('progress.none')}</strong></span>
                    <span>{t('progress.attempts')}: <strong>{p.attempts}</strong></span>
                    <span>
                      {t('progress.lessons')}:{' '}
                      {p.lessonsSeen.length === 0 ? t('progress.none') : p.lessonsSeen.map((l) => t(`lessons.${l}`, { defaultValue: l.replace(/-/g, ' ') })).join(', ')}
                    </span>
                    <span>
                      {t('progress.skills')}: {p.skillsTouched.length === 0 ? t('progress.none') : p.skillsTouched.map((s) => t(`skills.${s}`)).join(', ')}
                    </span>
                    <div>
                      <Link to={`/play/${p.id}`} className="ink-btn pink" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 48 }} data-testid={`pillar-play-${p.id}`}>
                        {t(`progress.action.${p.actionKey}`)}
                      </Link>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>

        <MomentsOpener />
      </main>
    </div>
  )
}

export default ProgressScreen
