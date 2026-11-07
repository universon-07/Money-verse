import { useMemo } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { cloud, cloudEnabled, rowToSummary, submitProgress } from './cloud'
import { DEMO_CODE, demoHistory, demoRoster } from './demo'
import { cleanCode, decodeSummary, findCodes, parseSummary, type StudentSummary } from './summary'

export interface Cohort {
  /** the class code students type in; also this class's id */
  id: string
  name: string
  createdAt: number
  /** the latest summary per student */
  students: Record<string, StudentSummary>
  /** every summary ever received, oldest first (for trends) */
  history: StudentSummary[]
  demo?: boolean
}

export interface ImportReport { added: number; updated: number; skipped: number; found: number; into: string | null }

/** 'device': everything lives in this browser. 'cloud': signed in to the hosted database. */
export type Mode = 'device' | 'cloud'

interface DeskState {
  mode: Mode
  /** classes kept on this device (device mode, and the demo class in either mode) */
  local: Cohort[]
  /** classes loaded from the database (cloud mode only, never persisted) */
  remote: Cohort[]
  user: { email: string; org: string } | null
  loading: boolean
  /** when the database was last read (cloud mode) */
  lastSync: number | null
  error: string
  /** names a facilitator gives anonymous ids ("classId:studentId" -> name). Kept on this device only, never uploaded. */
  labels: Record<string, string>
  /** each class's list of roll number -> student name. Kept on this device only, never uploaded or exported. */
  rosters: Record<string, Record<string, string>>
  setRoster: (classId: string, roster: Record<string, string>) => void
  checklist: Record<string, boolean>
  /** dashboard appearance, remembered on this device */
  theme: 'system' | 'light' | 'dark'
  setTheme: (t: 'system' | 'light' | 'dark') => void

  setMode: (m: Mode) => void
  setUser: (u: DeskState['user']) => void
  refresh: () => Promise<void>
  createCohort: (name: string) => Promise<string>
  renameCohort: (id: string, name: string) => Promise<void>
  deleteCohort: (id: string) => Promise<void>
  deleteStudent: (classId: string, studentId: string) => Promise<void>
  importText: (text: string, into: string | null) => Promise<ImportReport>
  loadDemo: () => void
  setLabel: (classId: string, studentId: string, name: string) => void
  tick: (key: string) => void
}

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export const newCode = (): string => 'HYD-' + Array.from({ length: 5 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('')
export const labelKey = (classId: string, studentId: string) => `${classId}:${studentId}`

/** latest summary per student from a list of snapshots */
export const latestOf = (history: StudentSummary[]): Record<string, StudentSummary> => {
  const out: Record<string, StudentSummary> = {}
  for (const s of history) if (!out[s.id] || out[s.id].at <= s.at) out[s.id] = s
  return out
}

const HISTORY_CAP = 5000

/** every summary in a block of text: progress codes (MM1.) or a pasted JSON list */
function parseIncoming(text: string): { list: StudentSummary[]; found: number; bad: number } {
  const list: StudentSummary[] = []
  let bad = 0
  const codes = findCodes(text)
  for (const code of codes) {
    const s = decodeSummary(code)
    if (s) list.push(s)
    else bad++
  }
  let found = codes.length
  try {
    const j = JSON.parse(text)
    for (const item of Array.isArray(j) ? j : []) {
      const s = parseSummary(item)
      if (s) { list.push(s); found++ }
    }
  } catch { /* plain text */ }
  return { list, found, bad }
}

/**
 * The facilitator desk state. Its persisted part lives under an "mm-slots" key so a student's save slots never capture or restore it.
 * Only device data, name labels and the checklist are persisted; database rows are re-read on every visit.
 */
export const useNgo = create<DeskState>()(
  persist(
    (set, get) => ({
      mode: 'device',
      local: [],
      remote: [],
      user: null,
      loading: false,
      lastSync: null,
      error: '',
      labels: {},
      rosters: {},
      setRoster: (classId, roster) => set((s) => {
        const rosters = { ...s.rosters }
        if (Object.keys(roster).length) rosters[classId] = roster
        else delete rosters[classId]
        return { rosters }
      }),
      checklist: {},
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      setMode: (mode) => set({ mode }),
      setUser: (user) => set({ user, ...(user ? {} : { remote: [], lastSync: null }) }),

      refresh: async () => {
        if (get().mode !== 'cloud' || !cloudEnabled) return
        set({ loading: true, error: '' })
        try {
          const [classes, rows] = await Promise.all([cloud.listClasses(), cloud.listProgress()])
          const byClass = new Map<string, StudentSummary[]>()
          for (const r of rows) {
            const s = rowToSummary(r)
            if (s) byClass.set(r.class_code, [...(byClass.get(r.class_code) ?? []), s])
          }
          const remote = classes.map((c) => {
            const history = byClass.get(c.code) ?? []
            return { id: c.code, name: c.name, createdAt: Date.parse(c.created_at), history, students: latestOf(history) }
          })
          set({ remote, loading: false, lastSync: Date.now() })
        } catch (e) {
          set({ loading: false, error: e instanceof Error ? e.message : 'Could not reach the database' })
        }
      },

      createCohort: async (name) => {
        const clean = name.trim().slice(0, 40)
        if (get().mode === 'cloud') {
          // codes are unique across every NGO; on the rare clash, try another
          for (let i = 0; i < 5; i++) {
            const id = newCode()
            try {
              await cloud.createClass(id, clean || id)
              await get().refresh()
              return id
            } catch (e) {
              if (i === 4) { set({ error: e instanceof Error ? e.message : 'Could not create the class' }); throw e }
            }
          }
        }
        const taken = new Set(get().local.map((c) => c.id))
        let id = newCode()
        while (taken.has(id)) id = newCode()
        set((s) => ({ local: [...s.local, { id, name: clean || id, createdAt: Date.now(), students: {}, history: [] }] }))
        return id
      },

      renameCohort: async (id, name) => {
        const clean = name.trim().slice(0, 40)
        if (!clean) return
        if (get().mode === 'cloud' && get().remote.some((c) => c.id === id)) {
          await cloud.renameClass(id, clean)
          return get().refresh()
        }
        set((s) => ({ local: s.local.map((c) => (c.id === id ? { ...c, name: clean } : c)) }))
      },

      deleteCohort: async (id) => {
        if (get().mode === 'cloud' && get().remote.some((c) => c.id === id)) {
          await cloud.deleteClass(id)
          await get().refresh()
        } else set((s) => ({ local: s.local.filter((c) => c.id !== id) }))
        // names given on this device, and the class list, go with the class
        set((s) => {
          const rosters = { ...s.rosters }
          delete rosters[id]
          return { rosters, labels: Object.fromEntries(Object.entries(s.labels).filter(([k]) => !k.startsWith(`${id}:`))) }
        })
      },

      deleteStudent: async (classId, studentId) => {
        if (get().mode === 'cloud' && get().remote.some((c) => c.id === classId)) {
          await cloud.deleteStudent(classId, studentId)
          await get().refresh()
        } else {
          set((s) => ({
            local: s.local.map((c) => {
              if (c.id !== classId) return c
              const students = { ...c.students }
              delete students[studentId]
              return { ...c, students, history: c.history.filter((h) => h.id !== studentId) }
            }),
          }))
        }
        set((s) => {
          const labels = { ...s.labels }
          delete labels[labelKey(classId, studentId)]
          return { labels }
        })
      },

      importText: async (text, into) => {
        const target = cleanCode(into)
        const { list, found, bad } = parseIncoming(text)
        const report: ImportReport = { added: 0, updated: 0, skipped: bad, found, into: target }

        if (get().mode === 'cloud' && target && get().remote.some((c) => c.id === target)) {
          const known = get().remote.find((c) => c.id === target)?.students ?? {}
          for (const s of list) {
            const r = await submitProgress(target, s)
            if (r === 'ok') { if (known[s.id]) report.updated++; else report.added++ }
            else report.skipped++
          }
          await get().refresh()
          return report
        }

        set((st) => {
          const local = st.local.map((c) => ({ ...c, students: { ...c.students }, history: [...c.history] }))
          for (const s of list) {
            const id = target ?? s.cohort ?? 'UNASSIGNED'
            let c = local.find((x) => x.id === id)
            if (!c) {
              c = { id, name: id === 'UNASSIGNED' ? 'No class code' : id, createdAt: Date.now(), students: {}, history: [] }
              local.push(c)
            }
            const old = c.students[s.id]
            if (old && old.at >= s.at) { report.skipped++; continue }
            if (old) report.updated++
            else report.added++
            const kept = { ...s, cohort: id === 'UNASSIGNED' ? null : id }
            c.students[s.id] = kept
            c.history = [...c.history, kept].slice(-HISTORY_CAP)
          }
          return { local }
        })
        return report
      },

      loadDemo: () => {
        const history = demoHistory()
        set((st) => ({
          local: [
            ...st.local.filter((c) => c.id !== DEMO_CODE),
            { id: DEMO_CODE, name: 'Demo class (made-up students)', createdAt: Date.now(), demo: true, history, students: latestOf(history) },
          ],
          rosters: { ...st.rosters, [DEMO_CODE]: demoRoster() },
        }))
      },

      setLabel: (classId, studentId, name) =>
        set((s) => {
          const labels = { ...s.labels }
          const clean = name.trim().replace(/\s+/g, ' ').slice(0, 30)
          if (clean) labels[labelKey(classId, studentId)] = clean
          else delete labels[labelKey(classId, studentId)]
          return { labels }
        }),

      tick: (key) => set((s) => ({ checklist: { ...s.checklist, [key]: !s.checklist[key] } })),
    }),
    {
      name: 'mm-slots-ngo-v1',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      partialize: (s) => ({ local: s.local, labels: s.labels, rosters: s.rosters, checklist: s.checklist, theme: s.theme }),
      // v1 kept classes under "cohorts" with no history
      migrate: (old, version) => {
        const o = (old ?? {}) as { cohorts?: Omit<Cohort, 'history'>[]; local?: Cohort[]; checklist?: Record<string, boolean> }
        if (version < 2) return { local: (o.cohorts ?? []).map((c) => ({ ...c, history: Object.values(c.students) })), labels: {}, checklist: o.checklist ?? {} }
        return o
      },
    },
  ),
)

/** the classes the desk shows right now: the database's in cloud mode (plus the demo class if loaded), else this device's */
export const useClasses = (): Cohort[] => {
  const mode = useNgo((s) => s.mode)
  const local = useNgo((s) => s.local)
  const remote = useNgo((s) => s.remote)
  return useMemo(() => (mode === 'cloud' ? [...remote, ...local.filter((c) => c.demo)] : local), [mode, local, remote])
}

// keep open tabs in step: when another tab saves the desk, reload it here, so a tab left open never writes its older copy over
// newer data (a class list added in another tab, say)
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => { if (e.key === 'mm-slots-ngo-v1') void useNgo.persist.rehydrate() })
}
