import { useTranslation } from 'react-i18next'
import { stageOf } from '../engine/pressure'
import type { Archetype, LedgerLine, Source } from '../engine/types'

export const ARCHETYPES_IN_ORDER: Archetype[] = ['fastmover', 'openhand', 'windowwaiter', 'quietholder', 'shelffirst', 'doorwatcher', 'evenkeeper']

/** strings for the café, in the `cafe` namespace. Money keeps ₹ and Western numerals in every language. */
export function useCt() {
  const { t } = useTranslation('cafe')
  const money = (n: number) => `₹${n}`
  const item = (id: string) => t(`items.${id}.name`)
  const place = (s: Source) => t(`jars.${s}Place`)
  /** "emergency:100,spend:50" -> "the umbrella stand ₹100, the tumbler ₹50" */
  const fromList = (list: string) =>
    list
      .split(',')
      .filter(Boolean)
      .map((p) => {
        const [s, v] = p.split(':')
        return `${place(s as Source)} ₹${v}`
      })
      .join(', ')
  const stage = (v: number) => t(`fizz.s${stageOf(v)}`)
  const band = (b: number) => t(`trolley.b${b}`)
  const ledgerText = (l: LedgerLine) => {
    const vars: Record<string, string | number> = { ...l.vars }
    if (typeof vars.item === 'string') vars.item = item(vars.item)
    if (typeof vars.from === 'string') vars.from = fromList(vars.from)
    return t(`ledger.${l.key}`, vars)
  }
  return { t, money, item, place, fromList, stage, band, ledgerText }
}
