import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHub } from '../../features/hub/hooks'
import { GoalMeter } from './GoalMeter'
import { HappyMeter } from './HappyMeter'
import { MomentsSheet } from './MomentsSheet'
import { CoachTips } from './CoachTips'
import { PillarIntroCard } from './PillarIntroCard'
import { StateGlyph } from './icons'
import type { PillarId } from '../../content/data'

/**
 * Hub screen wireframe.
 * TODO(final-ui): wireframe
 */
export function HubScreen() {
  const { t } = useTranslation()
  const { pillars, enterPillar } = useHub()
  const [momentsOpen, setMomentsOpen] = useState(false)
  const [introPillar, setIntroPillar] = useState<PillarId | null>(null)

  return (
    <div data-testid="hub-screen" className="absolute inset-0 overflow-y-auto bg-jasmine p-4">
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <header style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: 24, marginBottom: 12 }}>{t('hub.title', { defaultValue: 'Minar Hub' })}</h1>
          <div style={{ display: 'grid', gap: 8 }}>
            <GoalMeter />
            <HappyMeter />
          </div>
          <div style={{ marginTop: 12 }}>
            <button 
              type="button" 
              onClick={() => setMomentsOpen(true)} 
              data-testid="hub-open-moments"
              className="ink-btn cream w-full"
            >
              {t('hub.lookAfterYourself', { defaultValue: 'Look after yourself' })}
            </button>
          </div>
        </header>

        <CoachTips />

        {introPillar ? (
          <PillarIntroCard 
            pillarId={introPillar} 
            onStart={() => enterPillar(introPillar)} 
            onClose={() => setIntroPillar(null)} 
          />
        ) : (
          <main style={{ display: 'grid', gap: 12 }}>
            {pillars.map(p => (
              <div key={p.id} data-testid={`hub-pillar-${p.id}`} data-state={p.state} style={{ border: '2px solid var(--color-ink)', borderRadius: 8, padding: 12, background: 'var(--color-jasmine)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{t(p.nameKey)}</h3>
                    <div style={{ fontSize: 13, color: 'var(--color-ink)' }}>{t(p.taglineKey)}</div>
                  </div>
                  <StateGlyph state={p.state} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setIntroPillar(p.id)} data-testid={`hub-cta-${p.id}`} className="ink-btn pink" style={{ padding: '6px 12px', fontSize: 13 }}>
                    {t(p.ctaKey)}
                  </button>
                </div>
              </div>
            ))}
          </main>
        )}
      </div>

      {momentsOpen && <MomentsSheet onClose={() => setMomentsOpen(false)} />}
    </div>
  )
}

export default HubScreen
