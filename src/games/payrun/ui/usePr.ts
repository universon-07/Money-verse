import { useTranslation } from 'react-i18next'
import { inr } from '../../../content/data'
import { useGame } from '../../../store/game'

/** Strings live in the `payrun` namespace; money is formatted for the player's language. */
export function usePr() {
  const { t } = useTranslation('payrun')
  const lang = useGame((s) => s.language)
  const money = (n: number) => inr(n, lang)
  /** goal-weeks in halves: "½ week", "1 week", "1½ weeks" */
  const weeks = (n: number) => {
    const label = Number.isInteger(n) ? String(n) : `${Math.floor(n) || ''}½`
    return n === 1 ? t('wk.one') : n < 1 ? t('wk.half') : t('wk.other', { n: label })
  }
  return { t, lang, money, weeks }
}
