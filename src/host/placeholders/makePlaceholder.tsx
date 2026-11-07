import type { ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import type { PillarId } from '../../content/data'
import type { GameProps } from '../types'
import { RUN_KINDS, type PayloadBase, type RunKind } from './payloads'

/**
 * A plain stand-in for a real pillar game. It honours the real GameProps contract and answers with a payload in that
 * game's real spec shape, so the host, adapters and progress code are exercised for real until the teammate's game lands.
 * TODO(final-ui): wireframe only; it is never shown once src/games/<folder>/index.tsx exists.
 */
export function makePlaceholder(pillar: PillarId, build: (kind: RunKind, base: PayloadBase) => Record<string, unknown>): ComponentType<GameProps> {
  function Placeholder(props: GameProps) {
    const { t } = useTranslation()
    const base: PayloadBase = { seed: props.seed, cohortCode: props.cohortCode, festival: props.festival }
    return (
      <section data-testid={`placeholder-${pillar}`} style={{ padding: 16, display: 'grid', gap: 12 }}>
        <p data-testid="placeholder-label" style={{ margin: 0, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em' }}>
          {t('host.placeholder.label')}
        </p>
        <h2 style={{ margin: 0 }}>{t(`pillars.${pillar}.name`)}</h2>
        <p style={{ margin: 0 }}>{t(`pillars.${pillar}.hook`)}</p>
        <p style={{ margin: 0, fontSize: 13 }}>
          {t('host.placeholder.seed')}: <code>{props.seed}</code>
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {RUN_KINDS.map((kind) => (
            <button key={kind} type="button" className="ink-btn" data-testid={`placeholder-${kind}`} onClick={() => props.onComplete(build(kind, base))}>
              {t(`host.placeholder.${kind}`)}
            </button>
          ))}
        </div>
      </section>
    )
  }
  Placeholder.displayName = `Placeholder(${pillar})`
  return Placeholder
}
