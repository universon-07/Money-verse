import cards from '../content/cards.json'
import economy from '../content/economy.json'
import script from '../content/script.json'

export type WantCard = { id: string; kind: 'want'; price: number; returnPrice: number | null; listable: boolean; hook: string }
export type BillCard = { id: string; kind: 'surprise'; amount: number; big: boolean } | { id: string; kind: 'planned'; amount: number }
export type FriendCard = { id: string; kind: 'friend'; who: string; ask: number; repayChance: number; scriptedRepay: boolean | null }
export type LostCard = { id: string; kind: 'lost' }
export type WindfallCard = { id: string; kind: 'windfall'; amount: number }
export type Card = WantCard | BillCard | FriendCard | LostCard | WindfallCard

/** Content is data: an NGO edits the JSON files, not this code. */
export const ECON = economy as typeof economy
export const CARDS = cards as Card[]
export const SCRIPT = script as { weeks: Record<string, (string | null)[]>; stillWant: Record<string, Record<string, boolean>>; unlocks: { lunch: number; save: number; waitlist: number } }

export const card = (id: string) => {
  const c = CARDS.find((x) => x.id === id)
  if (!c) throw new Error(`unknown card ${id}`)
  return c
}
export const cardsOfKind = <K extends Card['kind']>(k: K) => CARDS.filter((c): c is Extract<Card, { kind: K }> => c.kind === k)
