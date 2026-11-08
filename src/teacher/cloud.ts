import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js'
import { cleanCode, parseSummary, type StudentSummary } from '../ngo/summary'

/**
 * Money-verse teacher backend adapter.
 * All requests target ONLY the Supabase project configured with VITE_SUPABASE_URL.
 * No organisation or NGO metadata is sent or stored by this module.
 *
 * The existing progress-summary helper remains in the legacy frontend folder
 * during the UI team's migration; it does not persist organisation data.
 */
const PROJECT_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
export const cloudEnabled = Boolean(PROJECT_URL && PUBLISHABLE_KEY)

let client: SupabaseClient | null = null
export function sb(): SupabaseClient {
  if (!cloudEnabled) throw new Error('Money-verse Supabase backend is not configured')
  client ??= createClient(PROJECT_URL!, PUBLISHABLE_KEY!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'moneyverse-teacher-auth',
    },
  })
  return client
}

export interface CloudClass {
  code: string
  name: string
  created_at: string
}
export interface CloudRow {
  class_code: string
  student_id: string
  summary: unknown
  received_at: string
}

function fail(error: { message: string } | null): void {
  if (error) throw new Error(error.message)
}

export function rowToSummary(row: CloudRow): StudentSummary | null {
  const summary = parseSummary(row.summary)
  if (!summary || summary.id !== row.student_id) return null
  const received = Date.parse(row.received_at) || Date.now()
  const at = summary.at > 0 && summary.at <= received && received - summary.at < 60 * 86400000
    ? summary.at
    : received
  return { ...summary, cohort: row.class_code, at }
}

async function authorizeRealtime(session: Session | null): Promise<void> {
  if (session?.access_token) await sb().realtime.setAuth(session.access_token)
}

export const cloud = {
  async session(): Promise<Session | null> {
    const { data, error } = await sb().auth.getSession()
    fail(error)
    void authorizeRealtime(data.session).catch(() => undefined)
    return data.session
  },
  onAuth(cb: (session: Session | null) => void) {
    const { data } = sb().auth.onAuthStateChange((_event, session) => {
      // Supabase recommends deferring follow-up API calls outside this callback.
      setTimeout(() => {
        void authorizeRealtime(session).catch(() => undefined)
        cb(session)
      }, 0)
    })
    return () => data.subscription.unsubscribe()
  },
  async signIn(email: string, password: string) {
    const { data, error } = await sb().auth.signInWithPassword({ email, password })
    fail(error)
    await authorizeRealtime(data.session).catch(() => undefined)
  },
  async signUp(email: string, password: string, _legacyOrganisation?: string) {
    // A third argument can still be passed by the unfinished frontend; it is ignored.
    // Only Supabase Auth email/password fields are sent; no organisation metadata.
    const { data, error } = await sb().auth.signUp({ email, password })
    fail(error)
    return { needsConfirm: !data.session }
  },
  async resetPassword(email: string) {
    // /ngo is a temporary UI route until the frontend team switches to /teacher.
    const { error } = await sb().auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/ngo`,
    })
    fail(error)
  },
  async signOut() {
    const { error } = await sb().auth.signOut({ scope: 'local' })
    fail(error)
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
  async deleteClass(code: string) {
    const { error } = await sb().from('classes').delete().eq('code', code)
    fail(error)
  },
  async deleteStudent(code: string, studentId: string) {
    const { error } = await sb().from('progress').delete().eq('class_code', code).eq('student_id', studentId)
    fail(error)
  },
  async listProgress(): Promise<CloudRow[]> {
    const output: CloudRow[] = []
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await sb().from('progress')
        .select('class_code,student_id,summary,received_at')
        .order('received_at')
        .range(offset, offset + 999)
      fail(error)
      output.push(...((data ?? []) as CloudRow[]))
      if (!data || data.length < 1000 || offset >= 50000) break
    }
    return output
  },
  onProgress(cb: (row: CloudRow) => void): () => void {
    // Wait for teacher authentication before subscribing to protected progress rows.
    let stopped = false
    let channel: ReturnType<SupabaseClient['channel']> | null = null
    void (async () => {
      const client = sb()
      const { data, error } = await client.auth.getSession()
      if (error || !data.session || stopped) return
      await client.realtime.setAuth(data.session.access_token)
      if (stopped) return
      channel = client.channel('moneyverse-teacher-progress')
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'progress',
        }, payload => cb(payload.new as CloudRow))
        .subscribe()
    })().catch(() => undefined)
    return () => {
      stopped = true
      if (channel) void sb().removeChannel(channel)
    }
  },
}

export async function classInfo(code: string): Promise<string | null> {
  const normalized = cleanCode(code)
  if (!cloudEnabled || !normalized) return null
  const { data, error } = await sb().rpc('class_name', { p_code: normalized })
  fail(error)
  return typeof data === 'string' && data ? data : null
}

export type SubmitResult = 'ok' | 'unknown_class' | 'invalid' | 'too_soon' | 'class_full' | 'offline' | 'off'

export async function submitProgress(code: string, summary: StudentSummary): Promise<SubmitResult> {
  if (!cloudEnabled) return 'off'
  const normalized = cleanCode(code)
  if (!normalized) return 'unknown_class'
  const validated = parseSummary({ ...summary, cohort: normalized })
  if (!validated) return 'invalid'
  try {
    const { data, error } = await sb().rpc('submit_progress', {
      p_code: normalized,
      p_summary: validated,
    })
    if (error) return 'offline'
    return (['ok', 'unknown_class', 'invalid', 'too_soon', 'class_full'] as const)
      .find(value => value === data) ?? 'invalid'
  } catch {
    return 'offline'
  }
}
