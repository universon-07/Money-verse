import { useSd } from './useSd'

const OUT_KEY: Record<string, string> = { permits: 'permits', electrical: 'electrical', 'rush plates': 'rush', stage: 'stage', 'sunny cash': 'sunnycash', 'speakers (bill)': 'speakers' }

/** The name of a payment line (a signed item, permits, a surprise bill or an event choice) in the player's language. */
export function useLabel() {
  const { t } = useSd()
  return (key: string, plates?: number) =>
    OUT_KEY[key] ? t(`date.outs.${OUT_KEY[key]}`) : t(`items.${key}.name`) + (key === 'plates' && plates ? ` × ${plates}` : '')
}
