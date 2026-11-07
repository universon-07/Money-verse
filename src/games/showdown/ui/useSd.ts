import { useTranslation } from 'react-i18next'
import { inr } from '../../../content/data'
import { useGame } from '../../../store/game'
import type { Point } from '../engine/types'

/** Strings live in the `showdown` namespace; money is formatted for the player's language. */
export function useSd() {
  const { t } = useTranslation('showdown')
  const lang = useGame((s) => s.language)
  const money = (n: number) => (n < 0 ? '−' : '') + inr(Math.abs(n), lang)
  const when = (p: Point) => t(`dates.${p}`)
  return { t, lang, money, when }
}
