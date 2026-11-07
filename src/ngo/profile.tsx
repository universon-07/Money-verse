import { useState } from 'react'
import { cloudEnabled } from './cloud'
import { DEMO_CODE } from './demo'
import { useClasses, useNgo } from './store'
import { C, Card, Icon, ICONS } from './ui'

export const initials = (user: { email: string; org: string } | null) => {
  const src = (user?.org || user?.email.split('@')[0] || '').trim()
  const parts = src.split(/[\s._-]+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? parts[0]?.[1] ?? '')).toUpperCase() || 'MI'
}

/** the round button at the top right that opens Profile */
export function Avatar({ size = 36, onClick, active }: { size?: number; onClick?: () => void; active?: boolean }) {
  const { user, mode } = useNgo()
  const signedIn = mode === 'cloud' && !!user
  const face = (
    <span className="grid shrink-0 place-items-center rounded-full font-semibold text-white" style={{ width: size, height: size, fontSize: size * 0.38, background: signedIn ? 'var(--avatar)' : 'var(--avatar-off)', boxShadow: active ? `0 0 0 3px ${C.bg}, 0 0 0 5px ${C.brand}` : undefined }}>
      {signedIn ? initials(user) : <Icon d={ICONS.lock} size={size * 0.45} />}
    </span>
  )
  if (!onClick) return face
  return <button type="button" onClick={onClick} aria-label="Profile" title="Profile" className="rounded-full" style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}>{face}</button>
}

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-4 border-b py-3 text-[14px] last:border-b-0" style={{ borderColor: C.line }}>
    <span className="mi-muted">{label}</span>
    <span className="min-w-0 truncate text-right font-medium">{children}</span>
  </div>
)

/** Profile: who is signed in, sync status, demo data, privacy, and the two ways out (sign out, exit to the game) */
export function Profile({ onSignOut, onSignIn, onExit, onDemo }: { onSignOut: () => Promise<void>; onSignIn: () => void; onExit: () => void; onDemo: () => void }) {
  const { user, mode, lastSync, loading, refresh, deleteCohort, theme, setTheme } = useNgo()
  const classes = useClasses()
  const [busy, setBusy] = useState(false)
  const signedIn = mode === 'cloud' && !!user
  const real = classes.filter((c) => !c.demo)
  const students = real.reduce((a, c) => a + Object.keys(c.students).length, 0)
  const hasDemo = classes.some((c) => c.demo)

  return (
    <div className="mx-auto grid w-full max-w-[720px] gap-4">
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar size={64} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[20px] font-bold">{signedIn ? user!.org || 'Facilitator' : 'Not signed in'}</div>
            <div className="mi-muted truncate text-[14px]">{signedIn ? user!.email : cloudEnabled ? 'Exploring with demo data on this device' : 'Device-only mode: data stays in this browser'}</div>
          </div>
          <span className="mi-chip" style={{ background: signedIn ? 'var(--t-strong)' : 'var(--t-plain)', color: signedIn ? 'var(--t-strong-ink)' : 'var(--t-plain-ink)' }}>{signedIn ? 'Signed in' : 'Offline desk'}</span>
        </div>
      </Card>

      <Card title="Your data">
        <Row label="Classes">{real.length}</Row>
        <Row label="Students who shared progress">{students}</Row>
        <Row label="Stored in">{signedIn ? 'Minar database (Supabase, row-level security)' : 'This browser only'}</Row>
        {signedIn && (
          <Row label="Last synced">
            <span className="inline-flex items-center gap-2">
              {lastSync ? new Date(lastSync).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : '–'}
              <button type="button" className="mi-btn ghost sm" disabled={loading} onClick={() => void refresh()}>{loading ? 'Syncing…' : 'Sync now'}</button>
            </span>
          </Row>
        )}
        <Row label="Demo class">
          {hasDemo
            ? <button type="button" className="mi-btn ghost sm" onClick={() => void deleteCohort(DEMO_CODE)}>Remove demo class</button>
            : <button type="button" className="mi-btn ghost sm" onClick={onDemo}>Add demo class</button>}
        </Row>
      </Card>

      <Card title="Appearance" sub="Printouts and slides always use the light look.">
        <div className="mi-seg" role="group" aria-label="Theme">
          {([['system', 'System', ICONS.system], ['light', 'Light', ICONS.sun], ['dark', 'Dark', ICONS.moon]] as const).map(([k, label, icon]) => (
            <button key={k} type="button" aria-pressed={theme === k} onClick={() => setTheme(k)}><Icon d={icon} size={15} />{label}</button>
          ))}
        </div>
      </Card>

      <Card title="Privacy" sub="Built for students under 18: no personal data about them is collected.">
        <ul className="m-0 grid gap-1.5 pl-5 text-[13.5px] leading-snug">
          <li>Students never sign in. They send a random student code, your class code, their 4-digit roll number and game results; never a name, phone, email, photo or location.</li>
          <li>Your class list (roll number to name) and any names you add stay in this browser. They are never uploaded to the database and never exported.</li>
          <li>The database only accepts the known game fields; a roll number must be exactly 4 digits, so free text cannot get in.</li>
          <li>Groups under 5 students are never broken down in charts or reports.</li>
          <li>Deleting a student or class removes their progress straight away; old progress is deleted after 400 days.</li>
        </ul>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" className="mi-btn ghost" onClick={onExit}><Icon d={ICONS.back} size={16} />Exit to the game</button>
          {signedIn ? (
            <button type="button" className="mi-btn danger" disabled={busy} onClick={async () => { setBusy(true); await onSignOut() }}><Icon d={ICONS.logout} size={16} />{busy ? 'Signing out…' : 'Sign out'}</button>
          ) : cloudEnabled ? (
            <button type="button" className="mi-btn" onClick={onSignIn}>Sign in</button>
          ) : null}
        </div>
      </Card>
    </div>
  )
}
