import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js'
import { cleanCode, parseSummary, type StudentSummary } from './summary'

/**
 * The hosted database behind Minar Insights (Supabase: Postgres + email sign-in + row-level security).
 *
 * Who can do what is enforced by the database, not by this file (see supabase/schema.sql):
 * - facilitators sign in with email and password and only ever see classes they own;
 * - students never sign in. They can only call submit_progress(code, summary), which checks the class exists, accepts only the
 *   anonymous summary fields, and rate-limits. Students cannot read anything back.
 *
 * When VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set, the desk runs in device-only mode (everything stays in this
 * browser) and the student app keeps the copy-a-code flow.
 */
const URL_ = import.meta.env.VITE_SUPABASE_URL as string | undefined
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const cloudEnabled = !!(URL_ && KEY)

let client: SupabaseClient | null = null
export const sb = (): SupabaseClient => {
  if (!cloudEnabled) throw new Error('cloud not configured')
  // the auth session lives under an "mm-slots" key so a student's save slots never capture a facilitator's login
  client ??= createClient(URL_!, KEY!, { auth: { persistSession: true, storageKey: 'mm-slots-insights-auth', autoRefreshToken: true } })
  return client
}

export interface CloudClass { code: string; name: string; created_at: string }
export interface CloudRow { class_code: string; student_id: string; summary: unknown; received_at: string }

/** the rows read back are parsed again, so anything odd in the database never reaches the screen */
export const rowToSummary = (r: CloudRow): StudentSummary | null => {
  const s = parseSummary(r.summary)
  if (!s || s.id !== r.student_id) return null
  // when the student played, not when it reached the database (a teacher may paste an older code); a phone clock that is
  // ahead, or more than 60 days behind, is not trusted
  const got = Date.parse(r.received_at) || Date.now()
  const at = s.at > 0 && s.at <= got && got - s.at < 60 * 86400000 ? s.at : got
  return { ...s, cohort: r.class_code, at }
}

const fail = (e: { message: string } | null) => { if (e) throw new Error(e.message) }

export const cloud = {
  async session(): Promise<Session | null> {
    const { data } = await sb().auth.getSession()
    return data.session
  },
  onAuth(cb: (s: Session | null) => void) {
    // deferred: calling Supabase again inside this callback can deadlock the auth client
    const { data } = sb().auth.onAuthStateChange((_e, s) => { setTimeout(() => cb(s), 0) })
    return () => data.subscription.unsubscribe()
  },
  async signIn(email: string, password: string) {
    const { error } = await sb().auth.signInWithPassword({ email, password })
    fail(error)
  },
  async signUp(email: string, password: string, org: string) {
    // only the organisation name goes into user metadata; no phone, no address
    const { data, error } = await sb().auth.signUp({ email, password, options: { data: { org: org.trim().slice(0, 60) } } })
    fail(error)
    return { needsConfirm: !data.session }
  },
  async resetPassword(email: string) {
    const { error } = await sb().auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/ngo` })
    fail(error)
  },
  async signOut() {
    // local scope: always clears this browser's session, even offline
    await sb().auth.signOut({ scope: 'local' })
  },
  async listClasses(): Promise<CloudClass[]> {
    const { data, error } = await sb().from('classes').select('code,name,created_at').order('created_at')
    fail(error)
    return (data ?? []) as CloudClass[]
  },
  async createClass(code: string, name: string) {
    const { error } = await sb().from('classes').insert({ code, name })
    fail(error)
  },
  async renameClass(code: string, name: string) {
    const { error } = await sb().from('classes').update({ name }).eq('code', code)
    fail(error)
  },
  /** deleting a class deletes every progress record in it (on delete cascade) */
  async deleteClass(code: string) {
    const { error } = await sb().from('classes').delete().eq('code', code)
    fail(error)
  },
  async deleteStudent(code: string, studentId: string) {
    const { error } = await sb().from('progress').delete().eq('class_code', code).eq('student_id', studentId)
    fail(error)
  },
  /** every snapshot in the facilitator's classes (row-level security filters to their own), newest last */
  async listProgress(): Promise<CloudRow[]> {
    const out: CloudRow[] = []
    for (let from = 0; ; from += 1000) {
      const { data, error } = await sb().from('progress').select('class_code,student_id,summary,received_at').order('received_at').range(from, from + 999)
      fail(error)
      out.push(...((data ?? []) as CloudRow[]))
      if (!data || data.length < 1000 || from > 50_000) break
    }
    return out
  },
  /**
   * live updates for the dashboard: called with each new progress row as a student shares. Realtime applies the same row-level
   * security, so a facilitator only ever hears about their own classes.
   */
  onProgress(cb: (row: CloudRow) => void): () => void {
    const ch = sb()
      .channel('minar-progress')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'progress' }, (p) => cb(p.new as CloudRow))
      .subscribe()
    return () => { void sb().removeChannel(ch) }
  },
}

/** the name of the class a code belongs to, or null; so a student can check they typed their teacher's code. No login needed. */
export async function classInfo(code: string): Promise<string | null> {
  const c = cleanCode(code)
  if (!cloudEnabled || !c) return null
  const { data, error } = await sb().rpc('class_name', { p_code: c })
  if (error) throw new Error(error.message)
  return typeof data === 'string' && data ? data : null
}

export type SubmitResult = 'ok' | 'unknown_class' | 'invalid' | 'too_soon' | 'class_full' | 'offline' | 'off'

/** what a student's phone calls: no login, insert-only, and only the anonymous summary */
export async function submitProgress(code: string, summary: StudentSummary): Promise<SubmitResult> {
  if (!cloudEnabled) return 'off'
  const c = cleanCode(code)
  if (!c) return 'unknown_class'
  const clean = parseSummary({ ...summary, cohort: c }) // re-validate: only the known fields, every number range-checked
  if (!clean) return 'invalid'
  try {
    const { data, error } = await sb().rpc('submit_progress', { p_code: c, p_summary: clean })
    if (error) return 'offline'
    return (['ok', 'unknown_class', 'invalid', 'too_soon', 'class_full'] as const).find((x) => x === data) ?? 'invalid'
  } catch {
    return 'offline'
  }
}
