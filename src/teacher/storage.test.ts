// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { readTeacherDesk, TEACHER_DESK_KEY } from './storage'

beforeEach(() => localStorage.clear())

describe('teacher desk storage migration', () => {
  const snapshot = JSON.stringify({ state: { local: [{ id: 'CLASS-123', students: {}, history: [] }], labels: { 'CLASS-123:student': 'Local name' }, rosters: {}, checklist: {} }, version: 2 })
  it('preserves classroom snapshots and their labels under the teacher key', () => {
    localStorage.setItem('mm-slots-previous-desk-v1', snapshot)
    expect(readTeacherDesk(localStorage)).toBe(snapshot)
    expect(localStorage.getItem(TEACHER_DESK_KEY)).toBe(snapshot)
    expect(localStorage.getItem('mm-slots-previous-desk-v1')).toBe(snapshot)
  })
  it('never replaces an existing teacher snapshot or captures a player slot', () => {
    localStorage.setItem('mm-slots-index', JSON.stringify(['slot-1']))
    localStorage.setItem('mm-slots-player', JSON.stringify({ state: { language: 'en', persona: 'college' } }))
    expect(readTeacherDesk(localStorage)).toBeNull()
    localStorage.setItem(TEACHER_DESK_KEY, snapshot)
    localStorage.setItem('mm-slots-other-desk', JSON.stringify({ state: { local: [], labels: {} } }))
    expect(readTeacherDesk(localStorage)).toBe(snapshot)
  })
  it('ignores damaged or unrelated stored records', () => {
    localStorage.setItem('mm-slots-broken', '{')
    localStorage.setItem('mm-slots-other', JSON.stringify({ state: { local: ['bad'], labels: {} } }))
    expect(readTeacherDesk(localStorage)).toBeNull()
  })
})
