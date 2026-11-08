import type { StateStorage } from 'zustand/middleware'

export const TEACHER_DESK_KEY = 'mm-slots-teacher-v1'

/** Recognize prior classroom desk snapshots without relying on a former product role. */
export function isClassroomSnapshot(raw: string): boolean {
  try {
    const parsed = JSON.parse(raw) as { state?: Record<string, unknown> }
    const state = parsed.state
    if (!state || typeof state !== 'object') return false
    const classes = state.local ?? state.cohorts
    if (!Array.isArray(classes)) return false
    if (!classes.every(c => c && typeof c === 'object' && typeof c.id === 'string' && c.students && typeof c.students === 'object')) return false
    return 'checklist' in state || 'labels' in state || 'rosters' in state
  } catch { return false }
}

/** Preserve local classes during the route/folder migration; game-save slots are ignored. */
export function readTeacherDesk(storage: Storage, name = TEACHER_DESK_KEY): string | null {
  const current = storage.getItem(name)
  if (current !== null) return current
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (!key || key === name || !key.startsWith('mm-slots-')) continue
    const raw = storage.getItem(key)
    if (raw && isClassroomSnapshot(raw)) {
      storage.setItem(name, raw)
      return raw
    }
  }
  return null
}

export const teacherDeskStorage: StateStorage = {
  getItem: name => {
    try { return readTeacherDesk(localStorage, name) } catch { return null }
  },
  setItem: (name, value) => { try { localStorage.setItem(name, value) } catch { /* device storage is optional */ } },
  removeItem: name => { try { localStorage.removeItem(name) } catch { /* device storage is optional */ } },
}
