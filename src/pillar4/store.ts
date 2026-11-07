import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Avatar, CaseProgress, Level, Reason, Shield, Step } from './types.ts'
import { CASES, JOURNEY, MYSTERY_IDS } from './content/index.ts'
import {
  DIAMOND, answerFix as eAnswerFix, closeCase, cycleLead as eCycle, dropCard, goToFix as eGoToFix, goToReplay as eGoToReplay, idleHint,
  newProgress, openBoard as eOpenBoard, reportZone, requestHint as eRequestHint, startCase as eStart, titleFor,
  transferScore, tryLink, type DropResult, type FixResult, type HintResult, type LinkResult, type ReportResult, type TitleId,
} from './engine/progress.ts'
import { shuffle } from './engine/progress.ts'

export interface Profile {
  avatar: Avatar
  level: Level
  nickname: string
  installId: string
  /** present only if an NGO session is active; analytics are queued only then */
  classCode: string | null
  introSeen: boolean
}

export interface AnalyticsEvent { t: string; [k: string]: string | number | boolean | null }

interface P4State {
  profile: Profile
  progress: Record<string, CaseProgress>
  /** case ids closed at least once (replays pay 25 percent) */
  completed: string[]
  mysteryPlayed: string[]
  mysteryCurrent: string | null
  master: { done: boolean; credited: number }
  told: boolean
  settings: { reduceMotion: boolean | null; sound: boolean }
  queue: AnalyticsEvent[]

  setProfile: (p: Partial<Profile>) => void
  setSettings: (p: Partial<P4State['settings']>) => void
  beginCase: (id: string) => string
  start: (id: string) => void
  report: (id: string, zone: string, pick: Reason | 'fine') => ReportResult
  hint: (id: string) => HintResult
  idle: (id: string) => HintResult
  cycleLead: (id: string) => void
  link: (id: string, a: string, b: string) => LinkResult
  openBoard: (id: string) => void
  drop: (id: string, card: string, step: Step) => DropResult
  goToFix: (id: string) => void
  goToReplay: (id: string) => void
  fix: (id: string, optionKey: string) => FixResult
  finishCase: (id: string) => CaseProgress
  resetCase: (id: string) => void
  finishMaster: () => void
  setTold: (v: boolean) => void
  newDetective: () => void
  resetEverything: () => void
}

const uuid = () => {
  try {
    return crypto.randomUUID()
  } catch {
    return 'p4-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
  }
}

const freshProfile = (): Profile => ({ avatar: 'male', level: 'beginner', nickname: '', installId: uuid(), classCode: null, introSeen: false })

const initial = () => ({
  profile: freshProfile(),
  progress: {} as Record<string, CaseProgress>,
  completed: [] as string[],
  mysteryPlayed: [] as string[],
  mysteryCurrent: null as string | null,
  master: { done: false, credited: 0 },
  told: false,
  settings: { reduceMotion: null as boolean | null, sound: true },
  queue: [] as AnalyticsEvent[],
})

export const usePillar4 = create<P4State>()(
  persist(
    (set, get) => {
      const put = (id: string, p: CaseProgress) => set((s) => ({ progress: { ...s.progress, [id]: p } }))
      const cur = (id: string) => get().progress[id] ?? newProgress(get().completed.includes(id))
      const track = (e: AnalyticsEvent) => {
        if (!get().profile.classCode) return
        set((s) => ({ queue: [...s.queue, e].slice(-500) }))
      }
      return {
        ...initial(),
        setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
        setSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),

        beginCase: (requested) => {
          let id = requested
          if (requested === 'MYSTERY') {
            const s = get()
            const unplayed = MYSTERY_IDS.filter((m) => !s.mysteryPlayed.includes(m))
            // resume an unfinished variant; otherwise pick among unplayed, or among all on replay
            const resume = s.mysteryCurrent && !s.progress[s.mysteryCurrent]?.closed ? s.mysteryCurrent : null
            id = resume ?? shuffle(unplayed.length ? unplayed : MYSTERY_IDS)[0]
            set({ mysteryCurrent: id, mysteryPlayed: s.mysteryPlayed.includes(id) ? s.mysteryPlayed : [...s.mysteryPlayed, id] })
            if (s.progress[id]?.closed) put(id, newProgress(true))
          }
          const p = cur(id)
          put(id, p)
          track({ t: 'case_started', caseId: id, level: get().profile.level })
          return id
        },

        start: (id) => put(id, eStart(cur(id))),

        report: (id, zone, pick) => {
          const r = reportZone(CASES[id], cur(id), zone, pick)
          put(id, r.prog)
          track({ t: 'clue_reported', caseId: id, ref: r.outcome.clueId ?? zone, reasonChosen: pick, outcome: r.outcome.kind })
          if (r.autoHint) track({ t: 'hint_used', caseId: id, leadId: r.autoHint.leadId, level: r.autoHint.level })
          return r
        },
        hint: (id) => {
          const r = eRequestHint(CASES[id], cur(id))
          put(id, r.prog)
          if (r.leadId) track({ t: 'hint_used', caseId: id, leadId: r.leadId, level: r.level ?? 0 })
          return r
        },
        idle: (id) => {
          const r = idleHint(CASES[id], cur(id))
          put(id, r.prog)
          return r
        },
        cycleLead: (id) => put(id, eCycle(cur(id))),
        link: (id, a, b) => {
          const r = tryLink(CASES[id], cur(id), a, b)
          put(id, r.prog)
          return r
        },
        openBoard: (id) => put(id, eOpenBoard(CASES[id], eStart(cur(id)))),
        drop: (id, card, step) => {
          const r = dropCard(CASES[id], cur(id), card, step)
          put(id, r.prog)
          if (r.prog.boardDone && !cur(id).boardDone) track({ t: 'board_result', caseId: id, wrongDrops: Object.values(r.prog.dropWrong).reduce((a, b) => a + b, 0) })
          return r
        },
        goToFix: (id) => put(id, eGoToFix(cur(id))),
        goToReplay: (id) => put(id, eGoToReplay(cur(id))),
        fix: (id, key) => {
          const r = eAnswerFix(CASES[id], cur(id), key)
          put(id, r.prog)
          track({ t: 'fix_answered', caseId: id, optionKey: key, correct: r.correct, attempt: r.prog.fixAttempts })
          return r
        },
        finishCase: (id) => {
          const def = CASES[id]
          const closed = closeCase(def, cur(id))
          put(id, closed)
          set((s) => ({ completed: s.completed.includes(id) ? s.completed : [...s.completed, id] }))
          track({ t: 'case_closed', caseId: id, diamondsEarned: closed.credited, hintsUsed: closed.hintUsed || closed.helpUsed })
          if (def.kind === 'mystery') track({ t: 'mystery_result', variant: id, cluesBeforeHelp: transferScore(def, closed) })
          return closed
        },
        resetCase: (id) => set((s) => ({ progress: { ...s.progress, [id]: newProgress(s.completed.includes(id)) } })),

        finishMaster: () => {
          if (get().master.done) return
          set({ master: { done: true, credited: DIAMOND.master } })
          track({ t: 'master_completed' })
        },
        setTold: (told) => set({ told }),

        newDetective: () => {
          // the previous profile is kept on the device under an archive key, not deleted
          try {
            const { profile, progress, completed, master } = get()
            localStorage.setItem(`p4.archive.${Date.now()}`, JSON.stringify({ profile, progress, completed, master }))
          } catch { /* storage unavailable: still reset */ }
          set({ ...initial(), profile: { ...freshProfile(), introSeen: true } })
        },
        resetEverything: () => set((s) => ({ ...initial(), profile: { ...s.profile, introSeen: true } })),
      }
    },
    { name: 'p4.v1', version: 1 },
  ),
)

// ---- derived values ---------------------------------------------------------------------------
export const diamondsOf = (s: Pick<P4State, 'progress' | 'master'>): number =>
  Object.values(s.progress).reduce((n, p) => n + p.credited, 0) + s.master.credited

export const useDiamonds = () => usePillar4(diamondsOf)

export const titleOf = (s: Pick<P4State, 'completed' | 'master'>): TitleId => titleFor(s.completed, s.master.done)

export function shieldPiecesOf(s: Pick<P4State, 'progress'>): Shield[] {
  const out: Shield[] = []
  for (const id of JOURNEY) {
    const piece = CASES[id]?.fix.shield
    if (piece && s.progress[id]?.fixDone) out.push(piece)
  }
  return out
}

/** is a step of the journey playable yet */
export function unlocked(s: Pick<P4State, 'completed'>, key: string): boolean {
  const done = (id: string) => s.completed.includes(id)
  const mysteryDone = MYSTERY_IDS.some(done)
  switch (key) {
    case 'TUT': return true
    case 'C1': return done('TUT')
    case 'C2': return done('C1')
    case 'C3': return done('C2')
    case 'MYSTERY': return done('C3')
    case 'MASTER': return done('C1') && done('C2') && done('C3') && mysteryDone
    default: return false
  }
}
