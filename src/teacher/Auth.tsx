import { useState } from 'react'
import { cloud } from './cloud'
import { Brand, C } from './ui'

type View = 'in' | 'up' | 'forgot'

/** teacher sign-in. Only teachers sign in; students never do. */
export function Auth({ onDemo, onBack }: { onDemo: () => void; onBack: () => void }) {
  const [view, setView] = useState<View>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agree, setAgree] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [note, setNote] = useState('')

  const changeView = (next: View) => {
    setShowPassword(false)
    setView(next)
  }

  const submit = async () => {
    setShowPassword(false)
    setErr(''); setNote(''); setBusy(true)
    try {
      if (view === 'in') await cloud.signIn(email.trim(), password)
      else if (view === 'up') {
        const r = await cloud.signUp(email.trim(), password)
        if (r.needsConfirm) { setNote('Check your email to confirm your account, then sign in.'); changeView('in') }
      } else {
        await cloud.resetPassword(email.trim())
        setNote('If that email has an account, a reset link is on its way.')
        changeView('in')
      }
    } catch (e) {
      setErr(e instanceof Error ? friendly(e.message) : 'Something went wrong. Try again.')
    }
    setBusy(false)
  }

  const valid = /\S+@\S+\.\S+/.test(email) && (view === 'forgot' || password.length >= 8) && (view !== 'up' || agree)

  return (
    <div className="mi absolute inset-0 overflow-y-auto">
      <div className="mx-auto grid min-h-full w-full max-w-[420px] content-center gap-5 px-4 py-10">
        <Brand />
        <div className="mi-card p-6">
          <h1 className="text-[22px] font-bold">{view === 'in' ? 'Sign in' : view === 'up' ? 'Create a teacher account' : 'Reset your password'}</h1>
          <p className="mi-muted m-0 mt-1 text-[13.5px] leading-snug">{view === 'up' ? 'For teachers running MONEY VERSE with a class. Students never need an account.' : 'See your classes, who needs help, and what to teach next.'}</p>
          <form className="mt-5 grid gap-3" onSubmit={(e) => { e.preventDefault(); if (valid) void submit() }}>
            <label className="grid gap-1 text-[13px] font-semibold">Email
              <input className="mi-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            </label>
            {view !== 'forgot' && (
              <div className="grid gap-1 text-[13px] font-semibold">
                <label htmlFor="teacher-password">Password</label>
                <div style={{ position: 'relative' }}>
                  <input id="teacher-password" name="password" className="mi-input" style={{ paddingRight: 96 }} type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={view === 'up' ? 'new-password' : 'current-password'} autoCapitalize="none" spellCheck={false} minLength={8} required />
                  <button
                    type="button"
                    data-password-toggle="true"
                    style={{ position: 'absolute', right: 4, top: 1, zIndex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: 84, height: 40, padding: '0 8px', border: 0, borderRadius: 8, background: C.card, color: C.navy, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-controls="teacher-password"
                    title={showPassword ? 'Hide password' : 'Show password'}
                    disabled={busy}
                    onClick={() => setShowPassword((visible) => !visible)}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" style={{ display: 'block', flexShrink: 0 }}>
                      {showPassword ? (
                      <path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A11 11 0 0 1 12 5c7 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.2 6.2A17 17 0 0 0 2 12s3 7 10 7a11 11 0 0 0 5.8-1.8" />
                    ) : (
                      <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>
                      )}
                    </svg>
                    <span>{showPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                {view === 'up' && <span className="mi-muted text-[12px] font-normal">At least 8 characters.</span>}
              </div>
            )}
            {view === 'up' && (
              <label className="flex items-start gap-2 text-[12.5px] leading-snug">
                <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#7A1F2B]" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                <span>I will use MONEY VERSE Insights for teaching only. I understand student names stay on my device (the class list) and are never uploaded; I will not put students' phone numbers or other personal details anywhere in MONEY VERSE; and I will delete a class's data when the programme ends.</span>
              </label>
            )}
            {err && <p className="m-0 text-[13px] font-semibold" role="alert" style={{ color: C.building }}>{err}</p>}
            {note && <p className="m-0 text-[13px] font-semibold" role="status" style={{ color: C.strong }}>{note}</p>}
            <button type="submit" className="mi-btn mt-1 h-11" disabled={!valid || busy}>{busy ? 'Please wait…' : view === 'in' ? 'Sign in' : view === 'up' ? 'Create account' : 'Send reset link'}</button>
          </form>
          <div className="mt-4 flex flex-wrap justify-between gap-2 text-[13px]">
            {view === 'in' ? (
              <>
                <button type="button" className="underline" style={linkBtn} onClick={() => { changeView('up'); setErr('') }}>Create an account</button>
                <button type="button" className="underline" style={linkBtn} onClick={() => { changeView('forgot'); setErr('') }}>Forgot password?</button>
              </>
            ) : <button type="button" className="underline" style={linkBtn} onClick={() => { changeView('in'); setErr('') }}>Back to sign in</button>}
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
