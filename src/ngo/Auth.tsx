import { useState } from 'react'
import { cloud } from './cloud'
import { Brand, C } from './ui'

type View = 'in' | 'up' | 'forgot'

/** facilitator sign-in. Only teachers and NGO staff sign in; students never do. */
export function Auth({ onDemo, onBack }: { onDemo: () => void; onBack: () => void }) {
  const [view, setView] = useState<View>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [org, setOrg] = useState('')
  const [agree, setAgree] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [note, setNote] = useState('')

  const submit = async () => {
    setErr(''); setNote(''); setBusy(true)
    try {
      if (view === 'in') await cloud.signIn(email.trim(), password)
      else if (view === 'up') {
        const r = await cloud.signUp(email.trim(), password, org)
        if (r.needsConfirm) { setNote('Check your email to confirm your account, then sign in.'); setView('in') }
      } else {
        await cloud.resetPassword(email.trim())
        setNote('If that email has an account, a reset link is on its way.')
        setView('in')
      }
    } catch (e) {
      setErr(e instanceof Error ? friendly(e.message) : 'Something went wrong. Try again.')
    }
    setBusy(false)
  }

  const valid = /\S+@\S+\.\S+/.test(email) && (view === 'forgot' || password.length >= 8) && (view !== 'up' || (org.trim().length > 1 && agree))

  return (
    <div className="mi absolute inset-0 overflow-y-auto">
      <div className="mx-auto grid min-h-full w-full max-w-[420px] content-center gap-5 px-4 py-10">
        <Brand />
        <div className="mi-card p-6">
          <h1 className="text-[22px] font-bold">{view === 'in' ? 'Sign in' : view === 'up' ? 'Create a facilitator account' : 'Reset your password'}</h1>
          <p className="mi-muted m-0 mt-1 text-[13.5px] leading-snug">{view === 'up' ? 'For teachers and NGO staff running Minar with a class. Students never need an account.' : 'See your classes, who needs help, and what to teach next.'}</p>
          <form className="mt-5 grid gap-3" onSubmit={(e) => { e.preventDefault(); if (valid) void submit() }}>
            {view === 'up' && (
              <label className="grid gap-1 text-[13px] font-semibold">Organisation or school
                <input className="mi-input" value={org} onChange={(e) => setOrg(e.target.value)} maxLength={60} autoComplete="organization" placeholder="e.g. Teach for Hyderabad, Amberpet centre" />
              </label>
            )}
            <label className="grid gap-1 text-[13px] font-semibold">Work email
              <input className="mi-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            </label>
            {view !== 'forgot' && (
              <label className="grid gap-1 text-[13px] font-semibold">Password
                <input className="mi-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={view === 'up' ? 'new-password' : 'current-password'} minLength={8} required />
                {view === 'up' && <span className="mi-muted text-[12px] font-normal">At least 8 characters.</span>}
              </label>
            )}
            {view === 'up' && (
              <label className="flex items-start gap-2 text-[12.5px] leading-snug">
                <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#7A1F2B]" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                <span>I will use Minar Insights for teaching only. I understand student names stay on my device (the class list) and are never uploaded; I will not put students' phone numbers or other personal details anywhere in Minar; and I will delete a class's data when the programme ends.</span>
              </label>
            )}
            {err && <p className="m-0 text-[13px] font-semibold" role="alert" style={{ color: C.building }}>{err}</p>}
            {note && <p className="m-0 text-[13px] font-semibold" role="status" style={{ color: C.strong }}>{note}</p>}
            <button type="submit" className="mi-btn mt-1 h-11" disabled={!valid || busy}>{busy ? 'Please wait…' : view === 'in' ? 'Sign in' : view === 'up' ? 'Create account' : 'Send reset link'}</button>
          </form>
          <div className="mt-4 flex flex-wrap justify-between gap-2 text-[13px]">
            {view === 'in' ? (
              <>
                <button type="button" className="underline" style={linkBtn} onClick={() => { setView('up'); setErr('') }}>Create an account</button>
                <button type="button" className="underline" style={linkBtn} onClick={() => { setView('forgot'); setErr('') }}>Forgot password?</button>
              </>
            ) : <button type="button" className="underline" style={linkBtn} onClick={() => { setView('in'); setErr('') }}>Back to sign in</button>}
          </div>
        </div>
        <div className="grid gap-2 text-center">
          <button type="button" className="mi-btn ghost" onClick={onDemo}>Explore with a made-up demo class</button>
          <span className="mi-muted text-[12px]">The demo stays in this browser. Nothing is saved online.</span>
          <button type="button" className="mi-btn quiet sm justify-self-center" onClick={onBack}>← Back to the game</button>
        </div>
      </div>
    </div>
  )
}

const linkBtn = { background: 'none', border: 0, padding: 0, cursor: 'pointer', color: C.navy, font: 'inherit' } as const

const friendly = (m: string) =>
  /invalid login/i.test(m) ? 'That email and password do not match.'
  : /already registered|already exists/i.test(m) ? 'That email already has an account. Sign in instead.'
  : /email not confirmed/i.test(m) ? 'Please confirm your email first (check your inbox).'
  : /fetch|network/i.test(m) ? 'Cannot reach the server. Check the internet connection.'
  : m
