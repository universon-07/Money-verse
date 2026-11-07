import { describe, expect, it } from 'vitest'
import { adoptLiveIfNeeded, captureLive, cleanName, createSlot, deleteSlot, getActive, listSlots, loadSlot, renameSlot, saveSlot, startNewGame, summarize, type KV } from './slots'

const fake = (init: Record<string, string> = {}): KV & { map: Map<string, string> } => {
  const map = new Map(Object.entries(init))
  return {
    map,
    get length() { return map.size },
    key: (i) => [...map.keys()][i] ?? null,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  }
}
const game = (state: object) => JSON.stringify({ state, version: 2 })

describe('save slots', () => {
  it('snapshots only game keys, never its own', () => {
    const s = fake({ 'money-mohalla-v2': game({}), 'p4.v1': '{}', 'mm-slots-index': '[]' })
    expect(Object.keys(captureLive(s)).sort()).toEqual(['money-mohalla-v2', 'p4.v1'])
  })
  it('loading a slot swaps its snapshot in and makes it active', () => {
    const s = fake({ 'money-mohalla-v2': game({ persona: 'earner' }), other: 'x' })
    const a = createSlot(s, 'Mine', captureLive(s), 1)
    s.setItem('money-mohalla-v2', game({ persona: 'school' }))
    expect(loadSlot(s, a.id)).toBe(true)
    expect(JSON.parse(s.getItem('money-mohalla-v2')!).state.persona).toBe('earner')
    expect(getActive(s)).toBe(a.id)
  })
  it('a new game starts empty, keeps only the language and is active', () => {
    const s = fake({ 'money-mohalla-v2': game({ language: 'te', persona: 'earner' }), 'p4.v1': '{}' })
    const m = startNewGame(s, '  Round   two ', 5)
    expect(m.name).toBe('Round two')
    expect(s.getItem('p4.v1')).toBeNull()
    expect(JSON.parse(s.getItem('money-mohalla-v2')!).state).toEqual({ language: 'te' })
    expect(getActive(s)).toBe(m.id)
  })
  it('a new game can start already in a class, with the roll number; the name stays the slot name only', () => {
    const s = fake({ 'money-mohalla-v2': game({ language: 'hi' }) })
    const m = startNewGame(s, 'Ravi Kumar', 5, { classCode: 'HYD-K7Q2M', rollNo: '23' })
    const state = JSON.parse(s.getItem('money-mohalla-v2')!).state
    expect(state).toEqual({ language: 'hi', classCode: 'HYD-K7Q2M', rollNo: '23' })
    expect(JSON.stringify(state)).not.toContain('Ravi')
    expect(m.name).toBe('Ravi Kumar')
  })
  it('saving updates the slot and its card summary', () => {
    const s = fake({ 'money-mohalla-v2': game({ persona: 'college', gender: 'girl', pillars: { plan: { status: 'complete' }, save: { status: 'in_progress' } } }) })
    const a = createSlot(s, 'A', {}, 1)
    saveSlot(s, a.id, 9)
    expect(listSlots(s)[0]).toMatchObject({ updatedAt: 9, persona: 'college', gender: 'girl', placesDone: 1 })
  })
  it('lists any number of slots, newest first, and renames and deletes them', () => {
    const s = fake()
    const ids = [1, 2, 3, 4, 5].map((n) => createSlot(s, `G${n}`, {}, n).id)
    expect(listSlots(s).map((m) => m.name)).toEqual(['G5', 'G4', 'G3', 'G2', 'G1'])
    renameSlot(s, ids[0], 'Priya')
    deleteSlot(s, ids[4])
    expect(listSlots(s).map((m) => m.name)).toEqual(['G4', 'G3', 'G2', 'Priya'])
    expect(s.getItem(`mm-slot-data:${ids[4]}`)).toBeNull()
  })
  it('keeps existing progress as the first slot, once', () => {
    const s = fake({ 'money-mohalla-v2': game({ persona: 'earner' }) })
    adoptLiveIfNeeded(s, 'My game', 1)
    adoptLiveIfNeeded(s, 'My game', 2)
    expect(listSlots(s)).toHaveLength(1)
    expect(getActive(s)).toBe(listSlots(s)[0].id)
  })
  it('does not adopt an untouched default game', () => {
    const s = fake({ 'money-mohalla-v2': game({ persona: null, storySeen: false }) })
    adoptLiveIfNeeded(s, 'My game', 1)
    expect(listSlots(s)).toHaveLength(0)
  })
  it('survives broken data', () => {
    expect(summarize({ 'money-mohalla-v2': '{nope' })).toEqual({ persona: null, gender: null, placesDone: 0 })
    expect(loadSlot(fake(), 'missing')).toBe(false)
    expect(cleanName('   ', 'Game')).toBe('Game')
  })
})
