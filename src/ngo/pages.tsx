import { useMemo, useState } from 'react'
import { SKILLS, type Skill } from '../content/data'
import { PlacesChart, SkillsChart, TrendChart, ChartCard } from './charts'
import { cloudEnabled } from './cloud'
import { levelOf, trendDelta, type StudentInsight } from './insights'
import { DECKS, deckFor } from './decks'
import { LESSONS, PLACE_NAME, GAME_NAME, SKILL_NAME, SKILL_PLACE } from './lessons'
import { downloadPptx, Presenter, PrintDeck, SlideView } from './Slides'
import { ReportCard, StatusChips, Understanding, type DeskView } from './reports'
import { labelKey, useNgo, type Cohort } from './store'
import { C, Card, Chip, Drawer, Flag, Icon, ICONS, LevelBar, Legend, Stat, day, pct, usePrint } from './ui'
import { PILLAR_IDS } from '../content/data'

export type Page = 'overview' | 'students' | 'teach' | 'classes'

/* ------------------------------------------------------------------ Overview */

export function Overview({ d, go, openStudent, teach }: { d: DeskView; go: (p: Page) => void; openStudent: (id: string) => void; teach: (s: Skill) => void }) {
  const { v, trend, focus, insights } = d
  const now = trend.at(-1)?.understanding ?? null
  const delta = trendDelta(trend)
  const attention = insights.filter((i) => i.flags.length > 0)
  const activeWeek = d.list.filter((s) => (v.lastSeen ?? 0) - s.at < 7 * 86400000).length

  if (v.n === 0) return <EmptyClass cohort={d.cohort} go={go} />

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Class understanding" value={pct(now)} note={delta === null ? 'from in-game choices' : `${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)} points since last week`} tone={delta === null ? undefined : delta >= 0 ? 'up' : 'down'} />
        <Stat label="Students" value={v.n} note={`${activeWeek} active this week`} />
        <Stat label="Finished all four" value={v.finishedAll} note={`${pct(v.n ? v.finishedAll / v.n : null)} of the class`} />
        <Stat label="Need attention" value={attention.length} note={attention.length ? 'see who and why' : 'everyone is on track'} tone={attention.length ? 'warn' : 'up'} />
      </div>

      <Card title="Where to focus next" sub="The ideas most students are still building, with a ready 15-minute activity for each.">
        {focus.length === 0 ? <p className="mi-muted m-0 text-[14px]">Not enough play yet. Focus areas appear once a few students have played.</p> : (
          <div className="grid gap-3 md:grid-cols-3">
            {focus.map((f, i) => (
              <div key={f.skill} className="flex flex-col gap-2 rounded-xl border p-4" style={{ borderColor: C.line, background: i === 0 ? 'var(--soft-brand)' : C.card }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[15px] font-semibold">{SKILL_NAME[f.skill]}</span>
                  <Chip tone={levelOf(f.avg)}>{pct(f.avg)}</Chip>
                </div>
                <p className="mi-muted m-0 text-[13px] leading-snug">{f.why}</p>
                {f.slip && <p className="m-0 text-[13px] leading-snug"><b>Common slip:</b> {f.slip}</p>}
                <button type="button" className="mi-btn ghost sm mt-auto self-start" onClick={() => teach(f.skill)}>Teach “{LESSONS[f.skill].title}” →</button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <ChartCard title="Understanding over time" sub="Average of every student's latest skills, week by week." file={`${d.cohort.id}-trend`}>
          <TrendChart points={trend} />
        </ChartCard>
        <Card title="Needs attention" sub="Students with something to follow up." action={<button type="button" className="mi-btn quiet sm" onClick={() => go('students')}>All students</button>}>
          {attention.length === 0 ? <p className="mi-muted m-0 text-[14px]">Nobody right now.</p> : (
            <ul className="m-0 grid list-none gap-1 p-0">
              {attention.slice(0, 6).map((i) => (
                <li key={i.s.id}>
                  <button type="button" className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left hover:bg-[var(--soft)]" style={{ border: 0, background: 'none', cursor: 'pointer' }} onClick={() => openStudent(i.s.id)}>
                    <span className="min-w-0"><span className="block truncate text-[14px] font-semibold">{d.nameOf(i.s.id)}</span><span className="mi-muted block truncate text-[12.5px]">{i.flags.join(' · ')}</span></span>
                    <Understanding u={i.understanding} />
                  </button>
                </li>
              ))}
              {attention.length > 6 && <li className="mi-muted px-2 pt-1 text-[12.5px]">and {attention.length - 6} more</li>}
              {d.notShared.length > 0 && <li className="mi-muted px-2 pt-1 text-[12.5px]">{d.notShared.length} on your class list have not shared progress yet.</li>}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Progress in the four places" file={`${d.cohort.id}-places`}><PlacesChart list={d.list} /></ChartCard>
        <ChartCard title="Skills across the class" sub="Click a skill to plan a lesson for it." file={`${d.cohort.id}-skills`}>
          <SkillsChart skills={v.skills} onPick={teach} />
          <div className="mt-3"><Legend /></div>
        </ChartCard>
      </div>
    </div>
  )
}

function EmptyClass({ cohort, go }: { cohort: Cohort; go: (p: Page) => void }) {
  return (
    <Card title={`No progress in ${cohort.name} yet`} sub="Students join with the class code and send progress from the game.">
      <ol className="m-0 grid gap-2 pl-5 text-[14.5px] leading-snug">
        <li>Write the class code <b className="tracking-wider" style={{ color: C.navy }}>{cohort.id}</b> on the board.</li>
        <li>Students open Minar, tap the gear, and type it under <b>Class code</b>.</li>
        <li>After playing, they tap <b>Share progress</b> on their saved game{cloudEnabled ? ' and press Send to my teacher. It appears here on its own.' : ', then send you the code. Paste the codes in Classes.'}</li>
      </ol>
      <button type="button" className="mi-btn ghost mt-4" onClick={() => go('classes')}>Open Classes</button>
    </Card>
  )
}

/* ------------------------------------------------------------------ Students */

type Filter = 'all' | 'attention' | 'strong'

export function Students({ d, openStudent }: { d: DeskView; openStudent: (id: string) => void }) {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<'name' | 'u' | 'recent'>('u')
  const print = usePrint()
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase()
    return d.insights
      .filter((i) => (filter === 'attention' ? i.flags.length > 0 : filter === 'strong' ? (i.understanding ?? 0) >= 0.7 : true))
      .filter((i) => !t || d.nameOf(i.s.id).toLowerCase().includes(t) || i.s.id.includes(t) || (!!i.s.roll && (i.s.roll.includes(t) || String(Number(i.s.roll)) === t)))
      .sort((a, b) => (sort === 'name' ? d.nameOf(a.s.id).localeCompare(d.nameOf(b.s.id)) : sort === 'recent' ? b.s.at - a.s.at : (a.understanding ?? -1) - (b.understanding ?? -1)))
  }, [d, q, filter, sort])
  const counts = { all: d.insights.length, attention: d.insights.filter((i) => i.flags.length).length, strong: d.insights.filter((i) => (i.understanding ?? 0) >= 0.7).length }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <span className="mi-muted absolute left-3 top-1/2 -translate-y-1/2"><Icon d={ICONS.search} size={16} /></span>
          <input className="mi-input" style={{ paddingLeft: 34 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, roll number or student code" aria-label="Search students" />
        </div>
        <div className="flex gap-1 rounded-xl border p-1" style={{ borderColor: C.line, background: C.card }} role="tablist">
          {(['all', 'attention', 'strong'] as const).map((f) => (
            <button key={f} type="button" role="tab" aria-selected={filter === f} onClick={() => setFilter(f)} className="mi-btn sm" style={filter === f ? undefined : { background: 'transparent', color: C.ink, borderColor: 'transparent' }}>
              {f === 'all' ? 'All' : f === 'attention' ? 'Need attention' : 'Strong'} <span className="opacity-70">{counts[f]}</span>
            </button>
          ))}
        </div>
        <button type="button" className="mi-btn ghost" onClick={() => print(<>{rows.map((i) => <ReportCard key={i.s.id} d={d} ins={i} />)}</>, `${d.cohort.id}-report-cards`)} disabled={!rows.length}>
          <Icon d={ICONS.print} size={16} />Print {rows.length === d.insights.length ? 'all' : rows.length} report cards
        </button>
      </div>

      <Card pad={false}>
        <div className="overflow-x-auto">
          <table className="mi-table">
            <thead>
              <tr>
                <th><SortBtn on={sort === 'name'} onClick={() => setSort('name')}>Student</SortBtn></th>
                <th>Places</th>
                <th><SortBtn on={sort === 'u'} onClick={() => setSort('u')}>Understanding</SortBtn></th>
                <th>Status</th>
                <th><SortBtn on={sort === 'recent'} onClick={() => setSort('recent')}>Last update</SortBtn></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => (
                <tr key={i.s.id} onClick={() => openStudent(i.s.id)} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') openStudent(i.s.id) }}>
                  <td><div className="font-semibold">{d.nameOf(i.s.id)}</div><div className="mi-muted text-[12px]">{d.subOf(i.s.id)}{i.s.roll && d.dupRolls.has(i.s.roll) && <Chip tone="getting" style={{ marginLeft: 6 }}>roll used twice</Chip>}</div></td>
                  <td><div className="flex gap-1">{PILLAR_IDS.map((p) => <Flag key={p} state={i.s.places[p].s} glow={i.s.places[p].b} />)}</div></td>
                  <td><Understanding u={i.understanding} /></td>
                  <td><StatusChips ins={i} /></td>
                  <td className="mi-muted whitespace-nowrap">{day(i.s.at)}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={5} className="mi-muted py-8 text-center">No students match.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
      {d.notShared.length > 0 && (
        <Card title={`On your class list, not shared yet (${d.notShared.length})`} sub="These students have not sent any progress with their roll number. Remind them to type it in Settings or Share progress.">
          <div className="flex flex-wrap gap-1.5">{d.notShared.map((n) => <Chip key={n.roll}>{n.name} · {n.roll}</Chip>)}</div>
        </Card>
      )}
      <p className="mi-muted m-0 text-[12.5px]">Names come from your class list (Classes → Class list), matched by roll number. The list stays on this device: it is never uploaded or exported. Students only ever send their roll number.</p>
    </div>
  )
}

const SortBtn = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button type="button" onClick={onClick} style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', font: 'inherit', color: on ? C.ink : 'inherit' }}>{children}{on ? ' ↓' : ''}</button>
)

export function StudentDrawer({ d, ins, onClose }: { d: DeskView; ins: StudentInsight; onClose: () => void }) {
  const { labels, setLabel, deleteStudent } = useNgo()
  const key = labelKey(d.cohort.id, ins.s.id)
  const [name, setName] = useState(labels[key] ?? '')
  const [confirm, setConfirm] = useState(false)
  const print = usePrint()
  return (
    <Drawer title={d.nameOf(ins.s.id)} onClose={onClose}>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="mi-btn" onClick={() => print(<ReportCard d={d} ins={ins} />, `report-card-${ins.s.id}`)}><Icon d={ICONS.print} size={16} />Print or save as PDF</button>
      </div>
      {d.nameSource(ins.s.id) === 'roster' ? (
        <Card>
          <div className="flex items-center gap-2 text-[13.5px]">
            <Icon d={ICONS.lock} size={15} />
            <span><b>{d.nameOf(ins.s.id)}</b>, roll {ins.s.roll}, from your class list. The name is only on this device.</span>
          </div>
        </Card>
      ) : (
        <Card>
          <form className="grid gap-2" onSubmit={(e) => { e.preventDefault(); setLabel(d.cohort.id, ins.s.id, name) }}>
            <label className="text-[13px] font-semibold" htmlFor="mi-label">{ins.s.roll ? `Roll ${ins.s.roll} is not on your class list` : 'No roll number shared'}: name on this device (optional)</label>
            <div className="flex gap-2">
              <input id="mi-label" className="mi-input" value={name} maxLength={30} onChange={(e) => setName(e.target.value)} placeholder="e.g. first name" autoComplete="off" />
              <button type="submit" className="mi-btn ghost">Save</button>
            </div>
            <p className="mi-muted m-0 text-[12px] leading-snug">{ins.s.roll ? 'Tip: add this roll number to the class list in Classes. ' : 'Ask the student to add their roll number in Settings, then share again. '}Names stay on this device only: never uploaded, never exported.</p>
          </form>
        </Card>
      )}
      <Card><ReportCard d={d} ins={ins} /></Card>
      <Card title="Remove this student's data" sub={d.cohort.demo ? 'Made-up student.' : 'Deletes every progress update from this student in this class. They keep their own game and can share again.'}>
        {confirm ? (
          <div className="flex flex-wrap gap-2"><button type="button" className="mi-btn danger" onClick={() => { void deleteStudent(d.cohort.id, ins.s.id); onClose() }}>Yes, delete</button><button type="button" className="mi-btn ghost" autoFocus onClick={() => setConfirm(false)}>Keep</button></div>
        ) : <button type="button" className="mi-btn danger" onClick={() => setConfirm(true)}>Delete student data</button>}
      </Card>
    </Drawer>
  )
}

/* ------------------------------------------------------------------ Teach */

export function Teach({ d, skill, setSkill, openStudent }: { d: DeskView; skill: Skill; setSkill: (s: Skill) => void; openStudent: (id: string) => void }) {
  const print = usePrint()
  const row = d.v.skills.find((s) => s.id === skill)!
  const l = LESSONS[skill]
  const place = SKILL_PLACE[skill]
  const slips = d.v.mistakes.filter((m) => m.pillar === place).slice(0, 4)
  const building = d.insights.filter((i) => i.s.places[place].a > 0 && i.s.skills[skill] < 0.4)
  const [presenting, setPresenting] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const deck = useMemo(() => deckFor(skill, slips.filter((m) => m.reliable).map((m) => m.text)), [skill, slips])
  const ordered = [...d.v.skills].sort((a, b) => (a.avg ?? 2) - (b.avg ?? 2))

  const plan = (
    <article className="grid gap-3 text-[14px]">
      <div className="mi-eyebrow">Minar · 15-minute class activity · {SKILL_NAME[skill]}</div>
      <h1 className="text-[22px] font-bold" style={{ color: C.navy }}>{l.title}</h1>
      <p className="mi-muted m-0">{l.minutes} minutes · no devices needed · afterwards, replay {PLACE_NAME[l.replay]} ({GAME_NAME[l.replay]})</p>
      <h3 className="text-[14px] font-semibold">Do this</h3>
      <ol className="m-0 grid gap-1.5 pl-5 leading-snug">{l.steps.map((s) => <li key={s}>{s}</li>)}</ol>
      <h3 className="text-[14px] font-semibold">Talk about it</h3>
      <ul className="m-0 grid gap-1.5 pl-5 leading-snug">{l.questions.map((s) => <li key={s}>{s}</li>)}</ul>
      {slips.length > 0 && <><h3 className="text-[14px] font-semibold">What this class got wrong</h3><ul className="m-0 grid gap-1 pl-5 leading-snug">{slips.map((m) => <li key={m.id}>{m.text} ({Math.round(m.share * 100)}% of {m.of})</li>)}</ul></>}
      <p className="mi-muted m-0 text-[12px]">Every example is made up. This teaches how to think about money; it never tells anyone what to buy or invest in.</p>
    </article>
  )

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      <Card title="Skills, weakest first" pad>
        <ul className="m-0 grid list-none gap-1 p-0">
          {ordered.map((s) => (
            <li key={s.id}>
              <button type="button" onClick={() => setSkill(s.id)} aria-pressed={skill === s.id} className="grid w-full gap-1.5 rounded-lg px-3 py-2.5 text-left" style={{ border: 0, cursor: 'pointer', background: skill === s.id ? 'var(--t-brand)' : 'transparent' }}>
                <span className="flex items-center justify-between"><span className="text-[14px] font-semibold" style={{ color: skill === s.id ? 'var(--t-brand-ink)' : C.ink }}>{SKILL_NAME[s.id]}</span><span className="text-[13px] font-semibold tabular-nums">{s.avg === null ? '–' : pct(s.avg)}</span></span>
                <LevelBar low={s.low} mid={s.mid} high={s.high} height={6} />
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-3"><Legend /></div>
      </Card>

      <div className="grid content-start gap-4">
        <Card title={SKILL_NAME[skill]} sub={`Shown in ${PLACE_NAME[place]} (${GAME_NAME[place]}). ${row.of ? `${row.of} students have played it.` : 'Nobody has played it yet.'}`}>
          <div className="grid grid-cols-3 gap-3 text-center">
            {([['building', row.low], ['getting', row.mid], ['strong', row.high]] as const).map(([lv, n]) => (
              <div key={lv} className="rounded-xl p-3" style={{ background: `var(--soft-${lv})` }}>
                <div className="text-[22px] font-bold" style={{ color: C[lv] }}>{n}</div>
                <div className="mi-muted text-[12px]">{lv === 'building' ? 'still building' : lv === 'getting' ? 'getting there' : 'strong'}</div>
              </div>
            ))}
          </div>
          {slips.length > 0 && (
            <div className="mt-4"><div className="mb-1.5 text-[13px] font-semibold">Common slips in {PLACE_NAME[place]}</div>
              <ul className="m-0 grid gap-1.5 pl-5 text-[13.5px] leading-snug">{slips.map((m) => <li key={m.id}>{m.text} <span className="mi-muted">({Math.round(m.share * 100)}% of {m.of}{m.reliable ? '' : ', few students so far'})</span></li>)}</ul>
            </div>
          )}
          {building.length > 0 && (
            <div className="mt-4"><div className="mb-1.5 text-[13px] font-semibold">Pair these students up, or check in with them</div>
              <div className="flex flex-wrap gap-1.5">{building.slice(0, 24).map((i) => <button key={i.s.id} type="button" onClick={() => openStudent(i.s.id)} className="mi-chip" style={{ background: 'var(--t-building)', color: 'var(--t-building-ink)', border: 0, cursor: 'pointer' }}>{d.nameOf(i.s.id)}</button>)}</div>
            </div>
          )}
        </Card>
        <Card title="Flashcard deck" sub={`${deck.length} slides: the big idea, ${DECKS[skill].cards.length} flashcards, the activity and a takeaway. Present in class or download.`} action={<span className="mi-chip" style={{ background: 'var(--t-brand)', color: 'var(--t-brand-ink)' }}>{SKILL_NAME[skill]}</span>}>
          <div className="mi-deckstrip">
            {deck.map((s, k) => (
              <button key={k} type="button" className="mi-thumb" onClick={() => setPresenting(k)} aria-label={`Present from slide ${k + 1}`}><SlideView slide={s} revealed={false} /></button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="mi-btn" onClick={() => setPresenting(0)}><Icon d={ICONS.play} size={16} />Present</button>
            <button type="button" className="mi-btn ghost" disabled={saving} onClick={async () => { setSaving(true); try { await downloadPptx(deck, `minar-${skill}-flashcards`, l.title) } finally { setSaving(false) } }}><Icon d={ICONS.download} size={16} />{saving ? 'Preparing…' : 'PowerPoint (.pptx)'}</button>
            <button type="button" className="mi-btn ghost" onClick={() => print(<PrintDeck slides={deck} />, `minar-${skill}-flashcards`)}><Icon d={ICONS.print} size={16} />PDF handout</button>
          </div>
          <p className="mi-muted m-0 mt-3 text-[12px]">The PowerPoint opens in PowerPoint, Google Slides or Keynote; answers are also in the speaker notes. Made-up amounts only.</p>
        </Card>
        <Card title={`Activity: ${l.title}`} sub={`${l.minutes} minutes, no devices. Then replay ${GAME_NAME[l.replay]}.`} action={<button type="button" className="mi-btn ghost sm" onClick={() => print(plan, `lesson-${skill}`)}><Icon d={ICONS.print} size={15} />Print</button>}>
          <div className="grid gap-3 text-[14.5px] leading-snug md:grid-cols-2">
            <div><div className="mb-1 text-[13px] font-semibold">Do this</div><ol className="m-0 grid gap-1.5 pl-5">{l.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
            <div><div className="mb-1 text-[13px] font-semibold">Talk about it</div><ul className="m-0 grid gap-1.5 pl-5">{l.questions.map((s) => <li key={s}>{s}</li>)}</ul></div>
          </div>
          <p className="mi-muted m-0 mt-3 text-[12px]">Made-up examples only. It teaches how to think about money and never recommends a product or investment.</p>
        </Card>
      </div>
      {presenting !== null && <Presenter slides={deck} start={presenting} title={l.title} onClose={() => setPresenting(null)} />}
    </div>
  )
}

export const firstSkill = (d: DeskView | null): Skill => d?.focus[0]?.skill ?? d?.v.weakestSkill ?? SKILLS[0]
