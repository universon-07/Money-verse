import { type PillarId } from '../../content/data'

export const HUB_CONFIG = {
  order: ['plan', 'save', 'invest', 'safe'] as PillarId[],
  pillars: {
    plan: {
      taglineKey: 'hub.plan.tagline',
      teachesKey: 'hub.plan.teaches',
      estimatedMinutes: 5,
    },
    save: {
      taglineKey: 'hub.save.tagline',
      teachesKey: 'hub.save.teaches',
      estimatedMinutes: 6,
    },
    invest: {
      taglineKey: 'hub.invest.tagline',
      teachesKey: 'hub.invest.teaches',
      estimatedMinutes: 8,
    },
    safe: {
      taglineKey: 'hub.safe.tagline',
      teachesKey: 'hub.safe.teaches',
      estimatedMinutes: 4,
    },
  },
}
