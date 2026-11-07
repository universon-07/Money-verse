/**
 * Save slots, built over the game without touching it: a slot is a snapshot of everything the game keeps in localStorage
 * (the shell store, Case Files, Pay Run, ...). Loading a slot swaps the snapshot back in and the page reloads, so every store
 * rehydrates from it as if it had always been there. Keys starting with "mm-slot" belong to this module and are never snapshotted.
 */
export interface KV {
  readonly length: number
  key(i: number): string | null
  getItem(k: string): string | null
  setItem(k: string, v: string): void
  removeItem(k: string): void
}

export interface SlotMeta {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  persona: string | null
  gender: string | null
  placesDone: number
}

const RESERVED = 'mm-slot'
const INDEX = 'mm-slots-index'
const ACTIVE = 'mm-slots-active'
const DATA = 'mm-slot-data:'
const GAME_KEY = 'money-mohalla-v2'
export const NAME_MAX = 24

export const cleanName = (name: string, fallback: string): string => name.trim().replace(/\s+/g, ' ').slice(0, NAME_MAX) || fallback

const liveKeys = (s: KV): string[] => {
  const out: string[] = []
  for (let i = 0; i < s.length; i++) {
    const k = s.key(i)
    if (k && !k.startsWith(RESERVED)) out.push(k)
  }
  return out
}

/** everything the game currently keeps */
export function captureLive(s: KV): Record<string, string> {
  const out: Record<string, string> = {}
  for (const k of liveKeys(s)) {
    const v = s.getItem(k)
    if (v !== null) out[k] = v
  }
  return out
}

export function clearLive(s: KV): void {
  for (const k of liveKeys(s)) s.removeItem(k)
}

/** what a card needs to show, read from a snapshot (never throws) */
export function summarize(data: Record<string, string>): Pick<SlotMeta, 'persona' | 'gender' | 'placesDone'> {
  try {
    const st = JSON.parse(data[GAME_KEY] ?? '{}').state ?? {}
    const pillars = st.pillars && typeof st.pillars === 'object' ? Object.values(st.pillars as Record<string, { status?: string }>) : []
    return {
      persona: typeof st.persona === 'string' ? st.persona : null,
      gender: typeof st.gender === 'string' ? st.gender : null,
      placesDone: pillars.filter((p) => p?.status === 'complete').length,
    }
  } catch {
    return { persona: null, gender: null, placesDone: 0 }
  }
}

export function listSlots(s: KV): SlotMeta[] {
  try {
    const arr = JSON.parse(s.getItem(INDEX) ?? '[]')
    return (Array.isArray(arr) ? (arr as SlotMeta[]) : []).slice().sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}
const writeIndex = (s: KV, list: SlotMeta[]) => s.setItem(INDEX, JSON.stringify(list))

export const getActive = (s: KV): string | null => s.getItem(ACTIVE)
const setActive = (s: KV, id: string | null) => (id ? s.setItem(ACTIVE, id) : s.removeItem(ACTIVE))

export const newId = (): string => `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

/** adds a slot holding `data` (not made active) */
export function createSlot(s: KV, name: string, data: Record<string, string>, now = Date.now(), id = newId()): SlotMeta {
  const meta: SlotMeta = { id, name: cleanName(name, 'Game'), createdAt: now, updatedAt: now, ...summarize(data) }
  s.setItem(DATA + id, JSON.stringify(data))
  writeIndex(s, [...listSlots(s).filter((m) => m.id !== id), meta])
  return meta
}

/** writes what the game keeps right now into the slot */
export function saveSlot(s: KV, id: string, now = Date.now()): void {
  const list = listSlots(s)
  const meta = list.find((m) => m.id === id)
  if (!meta) return
  const data = captureLive(s)
  s.setItem(DATA + id, JSON.stringify(data))
  writeIndex(s, list.map((m) => (m.id === id ? { ...m, updatedAt: now, ...summarize(data) } : m)))
}

/** swaps the slot's snapshot in as the live game and makes it the active slot; the caller reloads the page */
export function loadSlot(s: KV, id: string): boolean {
  let data: Record<string, string>
  try {
    data = JSON.parse(s.getItem(DATA + id) ?? 'null')
  } catch {
    return false
  }
  if (!data || typeof data !== 'object') return false
  clearLive(s)
  for (const [k, v] of Object.entries(data)) if (typeof v === 'string') s.setItem(k, v)
  setActive(s, id)
  return true
}

export function renameSlot(s: KV, id: string, name: string): void {
  writeIndex(s, listSlots(s).map((m) => (m.id === id ? { ...m, name: cleanName(name, m.name) } : m)))
}

export function deleteSlot(s: KV, id: string): void {
  s.removeItem(DATA + id)
  writeIndex(s, listSlots(s).filter((m) => m.id !== id))
  if (getActive(s) === id) setActive(s, null)
}

/**
 * a brand-new slot with an empty game, made active; the caller reloads the page. Only the chosen language carries over, plus the
 * class code and roll number the student typed on the new-game form (their name is the slot's name and never leaves the phone).
 */
export function startNewGame(s: KV, name: string, now = Date.now(), join: { classCode?: string | null; rollNo?: string | null } = {}): SlotMeta {
  let language: unknown
  try {
    language = JSON.parse(s.getItem(GAME_KEY) ?? '{}').state?.language
  } catch {
    language = undefined
  }
  clearLive(s)
  const state = { ...(language ? { language } : {}), ...(join.classCode ? { classCode: join.classCode } : {}), ...(join.rollNo ? { rollNo: join.rollNo } : {}) }
  const data: Record<string, string> = Object.keys(state).length ? { [GAME_KEY]: JSON.stringify({ state, version: 2 }) } : {}
  const meta = createSlot(s, name, data, now)
  for (const [k, v] of Object.entries(data)) s.setItem(k, v)
  setActive(s, meta.id)
  return meta
}

/** the store writes its defaults on first load; only a game with a chosen avatar or a finished story counts as progress */
function hasProgress(raw: string | null): boolean {
  try {
    const st = JSON.parse(raw ?? 'null')?.state
    return !!(st && (st.persona || st.storySeen))
  } catch {
    return false
  }
}

/** a player who already has progress but no slots (from before this screen existed) keeps it as the first slot */
export function adoptLiveIfNeeded(s: KV, fallbackName: string, now = Date.now()): void {
  if (listSlots(s).length > 0 || !hasProgress(s.getItem(GAME_KEY))) return
  setActive(s, createSlot(s, fallbackName, captureLive(s), now).id)
}
