import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './ngo.css'
import type { Skill } from '../content/data'
import { PILLAR_IDS, SKILLS } from '../content/data'
import { aggregate } from './analytics'
import { Auth } from './Auth'
import { Classes } from './classes'
import { cloud, cloudEnabled } from './cloud'
import { DEMO_CODE } from './demo'
import { downloadText, toCsvText } from './export'
import { focusAreas, studentInsight, weeklyTrend } from './insights'
import { SKILL_NAME, SKILL_PLACE } from './lessons'
import { Overview, StudentDrawer, Students, Teach, firstSkill, type Page } from './pages'
import { ClassReport, ReportCard, type DeskView } from './reports'
import type { Roster } from './roster'
import { labelKey, useClasses, useNgo, type Cohort } from './store'
import { Avatar, Profile } from './profile'
import { Brand, C, Card, Icon, ICONS, Menu, PrintProvider, usePrint } from './ui'

const PAGES: { id: Page; label: string; icon: keyof typeof ICONS }[] = [
  { id: 'overview', label: 'Overview', icon: 'overview' },
  { id: 'students', label: 'Students', icon: 'students' },
  { id: 'teach', label: 'Teach', icon: 'teach' },
  { id: 'classes', label: 'Classes', icon: 'classes' },
]

function buildView(cohort: Cohort, labels: Record<string, string>, roster: Roster): DeskView {
  const list = Object.values(cohort.students)
  const v = aggregate(list)
  const last = v.lastSeen ?? Date.now()
  const byId = new Map(list.map((s) => [s.id, s]))
  const rollOf = (id: string) => byId.get(id)?.roll ?? null
  const nameSource = (id: string): 'roster' | 'label' | 'none' => {
    const r = rollOf(id)
    return r && roster[r] ? 'roster' : labels[labelKey(cohort.id, id)] ? 'label' : 'none'
  }
  const nameOf = (id: string) => {
    const r = rollOf(id)
    return (r && roster[r]) || labels[labelKey(cohort.id, id)] || (r ? `Roll ${r}` : `Student ${id}`)
  }
  const subOf = (id: string) => {
    const r = rollOf(id)
    if (!r) return `no roll number · student code ${id}`
    return nameSource(id) === 'none' ? `student code ${id}` : `Roll ${r}`
  }
  const count = new Map<string, number>()
  for (const s of list) if (s.roll) count.set(s.roll, (count.get(s.roll) ?? 0) + 1)
  const dupRolls = new Set([...count].filter(([, n]) => n > 1).map(([r]) => r))
  const notShared = Object.entries(roster).filter(([r]) => !count.has(r)).map(([roll, name]) => ({ roll, name })).sort((a, b) => a.roll.localeCompare(b.roll))
  return {
    cohort,
    list,
    v,
    trend: weeklyTrend(cohort.history, 8),
    focus: focusAreas(v),
    insights: list.map((s) => studentInsight(s, last)),
    nameOf,
    subOf,
    nameSource,
    dupRolls,
    notShared,
  }
}

type Gate = 'checking' | 'signed-out' | 'ready'

/** Minar Insights: the dashboard for teachers and NGOs. Signs in when a database is connected; otherwise runs on this device. */
export default function NgoScreen() {
  const nav = useNavigate()
  const { setMode, setUser, refresh, loadDemo } = useNgo()
  const [gate, setGate] = useState<Gate>(cloudEnabled ? 'checking' : 'ready')
  const theme = useNgo((s) => s.theme)

  // light / dark: follows the device unless the facilitator picks one in Profile; removed again when leaving the desk
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => { document.documentElement.dataset.miTheme = theme === 'system' ? (mq.matches ? 'dark' : 'light') : theme }
    apply()
    mq.addEventListener('change', apply)
    return () => { mq.removeEventListener('change', apply); delete document.documentElement.dataset.miTheme }
  }, [theme])

  useEffect(() => {
    if (!cloudEnabled) { setMode('device'); return }
    let live = true
    const apply = (s: Awaited<ReturnType<typeof cloud.session>>) => {
      if (!live) return
      if (s?.user) {
        setMode('cloud')
        setUser({ email: s.user.email ?? '', org: String(s.user.user_metadata?.org ?? '') })
        setGate('ready')
        void refresh()
      } else {
        setUser(null)
        setGate((g) => (g === 'ready' && useNgo.getState().mode === 'device' ? g : 'signed-out'))
      }
    }
    void cloud.session().then(apply)
    const off = cloud.onAuth(apply)
    return () => { live = false; off() }
  }, [setMode, setUser, refresh])

  if (gate === 'checking') return <div className="mi absolute inset-0 grid place-items-center"><Brand /></div>
  if (gate === 'signed-out') return <Auth onBack={() => nav('/')} onDemo={() => { setMode('device'); loadDemo(); setGate('ready') }} />
  return <PrintProvider><Desk onSignedOut={() => setGate('signed-out')} /></PrintProvider>
}

type View = Page | 'profile'

function Desk({ onSignedOut }: { onSignedOut: () => void }) {
  const nav = useNavigate()
  const classes = useClasses()
  const { mode, labels, rosters, refresh, loadDemo, setUser } = useNgo()
  const [page, setPage] = useState<View>('overview')
  const [pick, setPick] = useState<string | null>(null)
  const [student, setStudent] = useState<string | null>(null)
  const [skill, setSkill] = useState<Skill | null>(null)
  const print = usePrint()

  const cohort = classes.find((c) => c.id === pick) ?? classes[0] ?? null
  const d = useMemo(() => (cohort ? buildView(cohort, labels, rosters[cohort.id] ?? {}) : null), [cohort, labels, rosters])
  const ins = d && student ? d.insights.find((i) => i.s.id === student) ?? null : null
  const teach = useCallback((s: Skill) => { setSkill(s); setPage('teach') }, [])

  // new student updates arrive on their own: on return to the tab, and every minute while it is open
  useEffect(() => {
    if (mode !== 'cloud') return
    const tick = () => { if (document.visibilityState === 'visible') void refresh() }
    document.addEventListener('visibilitychange', tick)
    const t = window.setInterval(tick, 60_000)
    return () => { document.removeEventListener('visibilitychange', tick); window.clearInterval(t) }
  }, [mode, refresh])

  // live: the moment a student shares, the database pushes the row here; reload the class and say who it was
  const [news, setNews] = useState<{ id: number; text: string }[]>([])
  useEffect(() => {
    if (mode !== 'cloud') return
    return cloud.onProgress((row) => {
      void refresh()
      const st = useNgo.getState()
      const roll = (row.summary as { roll?: unknown } | null)?.roll
      const r = typeof roll === 'string' ? roll : null
      const who = (r && st.rosters[row.class_code]?.[r]) || (r ? `Roll ${r}` : 'A student')
      const cls = st.remote.find((c) => c.id === row.class_code)?.name ?? row.class_code
      const id = Date.now() + Math.random()
      setNews((n) => [...n.slice(-2), { id, text: `${who} just shared progress · ${cls}` }])
      window.setTimeout(() => setNews((n) => n.filter((x) => x.id !== id)), 6000)
    })
  }, [mode, refresh])

  const signOut = async () => {
    try { await cloud.signOut() } finally { setUser(null); onSignedOut() }
  }
  const showDemo = () => { loadDemo(); setPick(DEMO_CODE); setPage('overview') }
  const title = page === 'profile' ? 'Profile' : PAGES.find((p) => p.id === page)?.label
  const dataPage = page === 'overview' || page === 'students' || page === 'teach'

  const exportMenu = d && (
    <Menu label={<><Icon d={ICONS.download} size={16} /><span className="hidden sm:inline">Export</span></>}>
      {(close) => (
        <>
          <button type="button" role="menuitem" onClick={() => { close(); print(<ClassReport d={d} />, `${d.cohort.id}-class-report`) }}>Class report<small>Charts, focus areas and success measures. Print or save as PDF.</small></button>
          <button type="button" role="menuitem" disabled={!d.insights.length} onClick={() => { close(); print(<>{d.insights.map((i) => <ReportCard key={i.s.id} d={d} ins={i} />)}</>, `${d.cohort.id}-report-cards`) }}>All student report cards<small>One page per student. Print or save as PDF.</small></button>
          <button type="button" role="menuitem" onClick={() => { close(); downloadText(`${d.cohort.id}-students.csv`, studentsCsv(d), 'text/csv') }}>Student data (CSV)<small>One row per student, with roll numbers. Names are never exported.</small></button>
          <button type="button" role="menuitem" onClick={() => { close(); downloadText(`${d.cohort.id}-trend.csv`, trendCsv(d), 'text/csv') }}>Weekly trend (CSV)<small>Understanding and places cleared per week.</small></button>
        </>
      )}
    </Menu>
  )

  const picker = (cls: string, style?: React.CSSProperties) => (
    <select className={`mi-input ${cls}`} style={{ height: 38, ...style }} value={cohort?.id ?? ''} onChange={(e) => setPick(e.target.value)} aria-label="Class">
      {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select>
  )

  return (
    <div className="mi absolute inset-0 flex overflow-hidden">
      <aside className="hidden w-[236px] shrink-0 flex-col border-r px-3 py-5 lg:flex" style={{ borderColor: C.line, background: 'var(--side)' }}>
        <div className="px-2"><Brand /></div>
        <nav className="mt-8 grid gap-1" aria-label="Sections">
          {PAGES.map((p) => <button key={p.id} type="button" className="mi-nav" aria-current={page === p.id ? 'page' : undefined} onClick={() => setPage(p.id)}><Icon d={ICONS[p.icon]} />{p.label}</button>)}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 overflow-y-auto pb-24 lg:pb-10">
        <header className="sticky top-0 z-20 border-b" style={{ borderColor: C.line, background: 'var(--header)', backdropFilter: 'blur(8px)' }}>
          <div className="mx-auto flex h-16 max-w-[1180px] items-center gap-3 px-4 sm:px-6">
            <div className="lg:hidden"><Brand compact /></div>
            <h1 className="mr-auto truncate text-[19px] font-bold sm:text-[21px]">{title}</h1>
            {dataPage && classes.length > 0 && <div className="hidden sm:block">{picker('', { width: 'auto', maxWidth: 240 })}</div>}
            {dataPage && exportMenu}
            <span className="mx-1 hidden h-6 w-px sm:block" style={{ background: C.line }} aria-hidden />
            <Avatar onClick={() => setPage('profile')} active={page === 'profile'} />
          </div>
          {dataPage && classes.length > 1 && <div className="px-4 pb-3 sm:hidden">{picker('')}</div>}
        </header>

        <main className="mx-auto grid max-w-[1180px] gap-4 px-4 py-5 sm:px-6">
          {mode === 'device' && cloudEnabled && page !== 'profile' && <DemoBanner onSignIn={onSignedOut} />}
          {page === 'profile' ? (
            <Profile onSignOut={signOut} onSignIn={onSignedOut} onExit={() => nav('/')} onDemo={showDemo} />
          ) : page === 'classes' ? (
            <Classes current={cohort} pick={(id) => { setPick(id); setPage('overview') }} />
          ) : !d ? (
            <Card title="Welcome to Minar Insights" sub="See how each class is learning, who needs help, and what to teach next.">
              <div className="flex flex-wrap gap-2">
                <button type="button" className="mi-btn" onClick={() => setPage('classes')}>Create your first class</button>
                <button type="button" className="mi-btn ghost" onClick={showDemo}>Show a demo class</button>
              </div>
            </Card>
          ) : (
            <>
              {page === 'overview' && <Overview d={d} go={setPage} openStudent={setStudent} teach={teach} />}
              {page === 'students' && <Students d={d} openStudent={setStudent} />}
              {page === 'teach' && <Teach d={d} skill={skill ?? firstSkill(d)} setSkill={setSkill} openStudent={setStudent} />}
            </>
          )}
          <p className="mi-muted m-0 mt-2 text-center text-[12px] leading-snug">Educational only: every amount in Minar is made up, and nothing here recommends an investment. Student data is anonymous.</p>
        </main>
      </div>

      <nav className="mi-tabbar lg:hidden" aria-label="Sections">
        {PAGES.map((p) => <button key={p.id} type="button" aria-current={page === p.id ? 'page' : undefined} onClick={() => setPage(p.id)}><Icon d={ICONS[p.icon]} size={20} />{p.label}</button>)}
      </nav>

      {d && ins && <StudentDrawer key={ins.s.id} d={d} ins={ins} onClose={() => setStudent(null)} />}

      <div className="pointer-events-none fixed bottom-20 right-4 z-40 grid gap-2 lg:bottom-6" aria-live="polite">
        {news.map((n) => (
          <div key={n.id} className="mi-card pointer-events-auto flex items-center gap-2.5 px-4 py-3 text-[14px] font-semibold" style={{ boxShadow: 'var(--pop)', animation: 'mi-in .2s ease-out' }}>
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: 'var(--strong)' }} aria-hidden />{n.text}
          </div>
        ))}
      </div>
    </div>
  )
}

function DemoBanner({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-2.5 text-[13.5px]" style={{ background: 'var(--t-brand)', color: 'var(--t-brand-ink)' }}>
      <span><b>Demo mode.</b> You are exploring made-up students; nothing is saved online.</span>
      <button type="button" className="mi-btn sm" onClick={onSignIn}>Sign in for real classes</button>
    </div>
  )
}

function studentsCsv(d: DeskView): string {
  const head = ['student_code', 'roll_no', 'class_code', 'understanding', 'places_cleared', ...PILLAR_IDS.map((p) => `${p}_status`), ...SKILLS.map((k) => SKILL_NAME[k]), 'needs_attention', 'language', 'last_update']
  const rows = d.insights.map((i) => [
    i.s.id, i.s.roll ?? '', d.cohort.id, i.understanding === null ? '' : Math.round(i.understanding * 100), i.cleared,
    ...PILLAR_IDS.map((p) => ({ n: 'not started', p: 'in progress', c: 'cleared' })[i.s.places[p].s]),
    ...SKILLS.map((k) => (i.s.places[SKILL_PLACE[k]].a > 0 ? Math.round(i.s.skills[k] * 100) : '')),
    i.flags.join('; '), i.s.lang, new Date(i.s.at).toISOString().slice(0, 10),
  ])
  return toCsvText([head, ...rows])
}

function trendCsv(d: DeskView): string {
  return toCsvText([['week_ending', 'students', 'class_understanding_pct', 'avg_places_cleared'], ...d.trend.map((t) => [new Date(t.at).toISOString().slice(0, 10), t.students, t.understanding === null ? '' : Math.round(t.understanding * 100), t.cleared.toFixed(2)])])
}

