import futures from '../content/futures.json'
import items from '../content/items.json'
import rules from '../content/rules.json'
import type { Cat, Contract, FutureDef, ItemDef } from './types'

/** Content is data: an NGO edits the JSON files, not this code. */
export const ITEMS = items as ItemDef[]
export const FUTURES = futures as FutureDef[]
export const RULES = rules as typeof rules & { extendVendors: string[] }

export const item = (id: string): ItemDef => {
  const d = ITEMS.find((i) => i.id === id)
  if (!d) throw new Error(`unknown item ${id}`)
  return d
}
export const future = (id: string): FutureDef => FUTURES.find((f) => f.id === id)!
export const firstOfCat = (cs: Contract[], ...cats: Cat[]) => cs.find((c) => cats.includes(item(c.id).cat))
