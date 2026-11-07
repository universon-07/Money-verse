import type { AppId, CaseDef, Clue, ItemKind, Lead, PhoneItem, RawCase, Zone } from '../types.ts'

/** Expand single-zone shorthand items into full PhoneItems. */
export function normalizeCase(raw: RawCase): CaseDef {
  const items: PhoneItem[] = raw.items.map((it) => {
    const zones: Zone[] = it.zones
      ? it.zones.map((z) => ({ role: 'ordinary', part: 'body', ...z }))
      : [{ id: it.id, role: it.role ?? 'ordinary', explainKey: it.explainKey, linkKey: it.linkKey, part: 'body' }]
    return { id: it.id, app: it.app, kind: it.kind, thread: it.thread, time: it.time, dir: it.dir ?? 'in', zones }
  })
  return { ...raw, items }
}

export interface ZoneRef { item: PhoneItem; zone: Zone }

export interface CaseIndex {
  def: CaseDef
  zones: Map<string, ZoneRef>
  items: Map<string, PhoneItem>
  clues: Map<string, Clue>
  zoneClue: Map<string, Clue>
  required: Clue[]
  gold: Clue[]
  connect: Clue[]
}

const cache = new WeakMap<CaseDef, CaseIndex>()

export function indexCase(def: CaseDef): CaseIndex {
  const hit = cache.get(def)
  if (hit) return hit
  const zones = new Map<string, ZoneRef>()
  const items = new Map<string, PhoneItem>()
  for (const item of def.items) {
    items.set(item.id, item)
    for (const zone of item.zones) zones.set(zone.id, { item, zone })
  }
  const clues = new Map(def.clues.map((c) => [c.id, c]))
  const zoneClue = new Map<string, Clue>()
  for (const c of def.clues) if (c.kind !== 'connect') for (const t of c.targets) zoneClue.set(t, c)
  const idx: CaseIndex = {
    def, zones, items, clues, zoneClue,
    required: def.clues.filter((c) => c.kind === 'required'),
    gold: def.clues.filter((c) => c.kind === 'gold'),
    connect: def.clues.filter((c) => c.kind === 'connect'),
  }
  cache.set(def, idx)
  return idx
}

export const explainKeyOf = (c: Clue) => c.explainKey ?? `${c.id}.explain`
export const zoneTextKey = (z: Zone) => z.textKey ?? z.id
export const zoneExplainKey = (z: Zone) => z.explainKey ?? `${z.id}.explain`
export const leadQKey = (l: Lead) => l.q ?? `${l.id}.q`
export const leadNudgeKey = (l: Lead) => l.nudge ?? `${l.id}.nudge`

// ---- where an item lives on the phone ------------------------------------------------------

export type TabId =
  | 'inbox' | 'recents' | 'chats' | 'calls' | 'feed' | 'saved' | 'dm' | 'page'
  | 'summary' | 'history' | 'request' | 'payees' | 'apps'

const TAB_OF: Record<ItemKind, TabId> = {
  sms: 'inbox', call: 'recents', caption: 'recents', chat: 'chats', profile: 'chats',
  videocall: 'calls', highlight: 'calls', feed: 'feed', saved: 'saved', dm: 'dm', page: 'page',
  summary: 'summary', history: 'history', request: 'request', payees: 'payees', perm: 'apps',
}
export const tabOf = (item: PhoneItem): TabId => TAB_OF[item.kind]

export const TABS_OF_APP: Record<AppId, TabId[]> = {
  messages: ['inbox'],
  phone: ['recents'],
  chatup: ['chats', 'calls'],
  instaglam: ['feed', 'saved', 'dm', 'page'],
  paynow: ['summary', 'history', 'request', 'payees'],
  settings: ['apps'],
}

/** tabs that list conversations (thread list, then a thread view) */
export const THREAD_TABS: TabId[] = ['inbox', 'chats', 'dm']

/** captions and call highlights live inside their parent call item */
export const isChild = (item: PhoneItem) => item.kind === 'caption' || item.kind === 'highlight'

export interface Location {
  app: AppId
  tab: TabId
  /** open thread in a thread tab */
  thread?: string
  /** parent call item to expand (recording / highlights) */
  expand?: string
  /** chat profile panel */
  profile?: boolean
}

export function locate(idx: CaseIndex, zoneId: string): Location | null {
  const ref = idx.zones.get(zoneId)
  if (!ref) return null
  const { item } = ref
  const tab = tabOf(item)
  const loc: Location = { app: item.app, tab }
  if (THREAD_TABS.includes(tab)) loc.thread = item.thread
  if (isChild(item)) loc.expand = item.thread
  if (item.kind === 'profile') loc.profile = true
  return loc
}

/** all link keys carried by an item's zones */
export const itemLinkKeys = (item: PhoneItem): string[] =>
  item.zones.map((z) => z.linkKey).filter((k): k is string => !!k)
