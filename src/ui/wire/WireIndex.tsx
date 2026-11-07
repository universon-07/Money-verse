import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PILLAR_IDS } from '../../content/data'
import { isDevMode } from '../../lib/dev'
import { BalanceCard } from './BalanceCard'
import { GoalMeter } from './GoalMeter'
import { HappyMeter } from './HappyMeter'
import { MomentsSheet } from './MomentsSheet'
import { TiredNote } from './TiredNote'

/**
 * Developer index of every wireframe screen and component, so each can be opened (and watched live while you change Happy
 * or force-clear pillars in the DEV panel) without the final navigation. Only reachable with ?dev=1.
 * TODO(final-ui): developer tool, not part of the product UI.
 */
export function WireIndex() {
  const { t } = useTranslation()
  if (!isDevMode()) return <Navigate to="/" replace />
  return (
    <div data-testid="wire-index" className="absolute inset-0 overflow-y-auto bg-jasmine text-ink">
      <main style={{ width: '100%', maxWidth: 'min(100%, 40rem)', margin: '0 auto', padding: 12, display: 'grid', gap: 12 }}>
        <h1 style={{ margin: 0 }}>{t('wire.title')}</h1>
        <p style={{ margin: 0 }}>{t('wire.intro')}</p>

        <h2 style={{ margin: 0 }}>{t('wire.screens')}</h2>
        <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
          <li><Link to="/progress" data-testid="wire-link-progress">/progress</Link></li>
          {PILLAR_IDS.map((id) => (
            <li key={id}><Link to={`/play/${id}`} data-testid={`wire-link-play-${id}`}>/play/{id}</Link></li>
          ))}
          <li><Link to="/" data-testid="wire-link-home">/ ({t('wire.legacy')})</Link></li>
        </ul>

        <h2 style={{ margin: 0 }}>{t('wire.live')}</h2>
        <GoalMeter />
        <HappyMeter />
        <TiredNote />
        <BalanceCard />
        <MomentsSheet />
      </main>
    </div>
  )
}

export default WireIndex
