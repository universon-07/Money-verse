import { PILLAR_IDS, SKILLS } from '../content/data'
import { K_MIN, type CohortView } from './analytics'
import { PlacesChart, SkillsChart, Sparkline, SplitBars, TrendChart } from './charts'
import { LEVEL_NAME, levelOf, studentTrend, type Focus, type StudentInsight, type TrendPoint } from './insights'
import { GAME_NAME, LESSONS, PLACE_NAME, SKILL_NAME, SKILL_PLACE } from './lessons'
import type { Cohort } from './store'
import type { StudentSummary } from './summary'
import { C, Chip, Flag, LEVEL_COLOR, Meter, pct } from './ui'

/** everything the desk knows about the class being viewed */
export interface DeskView {
  cohort: Cohort
  list: StudentSummary[]
  v: CohortView
  trend: TrendPoint[]
  focus: Focus[]
  insights: StudentInsight[]
  /** the name to show: from the class list (by roll number), else a name given on this device, else "Roll 0023" or the student code */
  nameOf: (id: string) => string
  /** the line under the name: roll number and / or student code */
  subOf: (id: string) => string
  /** where the shown name came from */
  nameSource: (id: string) => 'roster' | 'label' | 'none'
  /** roll numbers used by more than one student code (two phones, or a typo) */
  dupRolls: Set<string>
  /** students on the class list who have not shared any progress yet */
  notShared: { roll: string; name: string }[]
}

const LANG: Record<string, string> = { en: 'English', hi: 'Hindi', te: 'Telugu' }
const PERSONA: Record<string, string> = { school: 'School student', college: 'College student', earner: 'Earning youth' }
const SHORT = { building: 'Building', getting: 'Getting there', strong: 'Strong' } as const
const PLACE_STATE = { n: 'Not started', p: 'In progress', c: 'Cleared' }
const today = () => new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })

const DISCLAIMER = 'Minar is an educational game. All money in it is made up; it teaches how to think about money and never recommends a product or an investment. This card describes in-game choices, not a grade or a judgement of the student.'

/** a one-page report card for one student, shown in the drawer and printed (one per page when printing a whole class) */
export function ReportCard({ d, ins }: { d: DeskView; ins: StudentInsight }) {
  const s = ins.s
  const trend = studentTrend(d.cohort.history, s.id)
  const classAvg = new Map(d.v.skills.map((k) => [k.id, k.avg]))
  return (
    <article className="mi-page grid gap-4 text-[14px]" style={{ color: C.ink }}>
      <header className="flex items-start justify-between gap-3 border-b pb-3" style={{ borderColor: C.line }}>
        <div>
          <div className="mi-eyebrow">Minar · Student progress card</div>
          <h1 className="mt-1 text-[22px] font-bold" style={{ color: C.navy }}>{d.nameOf(s.id)}</h1>
          <div className="mi-muted mt-0.5 text-[12.5px]">{d.cohort.name} · {d.subOf(s.id)} · last update {new Date(s.at).toLocaleDateString()}</div>
        </div>
        <div className="text-right">
          <div className="mi-eyebrow">Understanding</div>
          <div className="text-[30px] font-bold leading-none" style={{ color: ins.understanding === null ? C.muted : LEVEL_COLOR[levelOf(ins.understanding)] }}>{pct(ins.understanding)}</div>
          {ins.understanding !== null && <div className="text-[12px] font-semibold" style={{ color: LEVEL_COLOR[levelOf(ins.understanding)] }}>{LEVEL_NAME[levelOf(ins.understanding)]}</div>}
        </div>
      </header>

      <section>
        <h3 className="mb-2 text-[13px] font-semibold">The four places</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PILLAR_IDS.map((p) => (
            <div key={p} className="rounded-xl border p-2.5" style={{ borderColor: C.line }}>
              <div className="flex items-center gap-1.5"><Flag state={s.places[p].s} glow={s.places[p].b} size={18} /><span className="text-[12.5px] font-semibold">{PLACE_NAME[p]}</span></div>
              <div className="mi-muted mt-1 text-[12px]">{GAME_NAME[p]} · {PLACE_STATE[s.places[p].s]}{s.places[p].s === 'c' ? ` · best ${pct(s.places[p].q)}` : ''}{s.places[p].a > 1 ? ` · ${s.places[p].a} tries` : ''}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-[13px] font-semibold">Skills <span className="mi-muted font-normal">(the mark on each bar is the class average)</span></h3>
        <div className="grid gap-2">
          {SKILLS.map((k) => {
            const played = s.places[SKILL_PLACE[k]].a > 0
            const v = s.skills[k]
            const avg = classAvg.get(k)
            return (
              <div key={k} className="grid grid-cols-[130px_1fr_118px] items-center gap-2">
                <span className="text-[13px]">{SKILL_NAME[k]}</span>
                <div className="relative h-2.5 rounded-full" style={{ background: C.track }}>
                  {played && <div className="h-full rounded-full" style={{ width: `${v * 100}%`, background: LEVEL_COLOR[levelOf(v)] }} />}
                  {avg !== null && avg !== undefined && <div className="absolute -top-1 h-[18px] w-[2px]" style={{ left: `${avg * 100}%`, background: C.navy }} title="class average" />}
                </div>
                <span className="text-right text-[12.5px] tabular-nums">{played ? `${pct(v)} · ${SHORT[levelOf(v)]}` : 'not played'}</span>
              </div>
            )
          })}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl p-3" style={{ background: 'var(--soft-strong)' }}>
          <h3 className="text-[13px] font-semibold" style={{ color: C.strong }}>Doing well</h3>
          <p className="m-0 mt-1 text-[13.5px] leading-snug">{ins.strengths.length ? ins.strengths.map((k) => SKILL_NAME[k]).join(', ') : ins.started ? 'Keep playing: strengths show after a few more choices.' : 'Not started yet.'}</p>
        </div>
        <div className="rounded-xl p-3" style={{ background: 'var(--soft-building)' }}>
          <h3 className="text-[13px] font-semibold" style={{ color: C.building }}>To work on</h3>
          <p className="m-0 mt-1 text-[13.5px] leading-snug">{ins.toWork.length ? ins.toWork.map((k) => SKILL_NAME[k]).join(', ') : 'Nothing stands out.'}</p>
          {ins.slips.length > 0 && <ul className="m-0 mt-1.5 grid gap-0.5 pl-4 text-[12.5px] leading-snug">{ins.slips.slice(0, 3).map((x) => <li key={x}>{x}</li>)}</ul>}
        </div>
      </section>

      <section className="grid items-center gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <h3 className="text-[13px] font-semibold">Suggested next step</h3>
          <p className="m-0 mt-1 text-[13.5px] leading-snug">{ins.next}</p>
        </div>
        <div><div className="mi-eyebrow mb-1">Understanding over time</div><Sparkline points={trend} /></div>
      </section>

      <footer className="mi-muted border-t pt-2 text-[11px] leading-snug" style={{ borderColor: C.line }}>{DISCLAIMER}</footer>
    </article>
  )
}

/** the class report for the NGO or funder: one or two printed pages */
export function ClassReport({ d }: { d: DeskView }) {
  const { v, cohort } = d
  const langs = v.languages.filter((l) => !l.hidden && l.n > 0).length
  const measures: [string, string][] = [
    ['Simple', `${pct(v.n ? v.active / v.n : null)} of students started a place on their own.`],
    ['Relatable', `${v.funnel.reduce((a, f) => a + f.cleared, 0)} everyday-money places cleared across ${v.n} students.`],
    ['Persona-led', v.personas.every((p) => p.hidden || p.n === 0) ? 'Too few students per group to show a split.' : v.personas.filter((p) => !p.hidden && p.n > 0).map((p) => `${p.n} ${PERSONA[p.key].toLowerCase()}s`).join(', ') + '.'],
    ['Language-ready', `${langs} of 3 languages (English, Hindi, Telugu) in use.`],
    ['Game-based', 'Understanding is measured from choices made in the games, not from a quiz.'],
    ['Intuitive', `${pct(v.liteShare)} play on Lite mode for older phones.`],
    ['NGO-integrated', `${v.n} students shared progress; class codes, report cards and lesson plans used.`],
    ['Privacy-conscious', `No student accounts, names, phone numbers or emails. Groups under ${K_MIN} students are never broken down.`],
  ]
  return (
    <article className="grid gap-5 text-[13.5px]" style={{ color: C.ink }}>
      <header className="border-b pb-3" style={{ borderColor: C.line }}>
        <div className="mi-eyebrow">Minar Insights · Class report</div>
        <h1 className="mt-1 text-[24px] font-bold" style={{ color: C.navy }}>{cohort.name}</h1>
        <div className="mi-muted text-[12.5px]">Class code {cohort.id} · {today()}</div>
      </header>
      <div className="grid grid-cols-4 gap-3">
        {[[v.n, 'students'], [v.active, 'started'], [v.finishedAll, 'finished all four'], [pct(d.trend.at(-1)?.understanding ?? null), 'class understanding']].map(([a, b]) => (
          <div key={String(b)} className="rounded-xl border p-3" style={{ borderColor: C.line }}><div className="text-[22px] font-bold" style={{ color: C.navy }}>{a}</div><div className="mi-muted text-[12px]">{b}</div></div>
        ))}
      </div>
      <section><h2 className="mb-2 text-[15px] font-semibold">Where to focus next</h2>
        {d.focus.length ? <ol className="m-0 grid gap-1.5 pl-5">{d.focus.map((f) => <li key={f.skill}><b>{SKILL_NAME[f.skill]}</b>: {f.why}{f.slip ? ` Common slip: ${f.slip}.` : ''} Activity: “{LESSONS[f.skill].title}”.</li>)}</ol> : <p className="m-0">Not enough play yet.</p>}
      </section>
      <section><h2 className="mb-2 text-[15px] font-semibold">Understanding over time</h2><TrendChart points={d.trend} /></section>
      <section><h2 className="mb-2 text-[15px] font-semibold">Progress in the four places</h2><PlacesChart list={d.list} /></section>
      <section className="mi-page"><h2 className="mb-2 text-[15px] font-semibold">Skills across the class</h2><SkillsChart skills={v.skills} /></section>
      <section className="grid grid-cols-2 gap-4">
        <div><h2 className="mb-2 text-[15px] font-semibold">Languages</h2><SplitBars rows={v.languages.map((r) => ({ label: LANG[r.key], n: r.n, hidden: r.hidden }))} /></div>
        <div><h2 className="mb-2 text-[15px] font-semibold">Who is playing</h2><SplitBars rows={v.personas.map((r) => ({ label: PERSONA[r.key], n: r.n, hidden: r.hidden }))} /></div>
      </section>
      <section><h2 className="mb-2 text-[15px] font-semibold">Against Vanguard's success measures</h2>
        <table className="w-full border-collapse text-[13px]"><tbody>{measures.map(([k, t]) => <tr key={k}><td className="w-[150px] border-b py-1.5 pr-3 font-semibold" style={{ borderColor: C.line }}>{k}</td><td className="border-b py-1.5" style={{ borderColor: C.line }}>{t}</td></tr>)}</tbody></table>
      </section>
      <footer className="mi-muted text-[11px] leading-snug">{DISCLAIMER.replace('This card', 'This report')}</footer>
    </article>
  )
}

export function StatusChips({ ins }: { ins: StudentInsight }) {
  if (!ins.flags.length) return <Chip tone="strong">On track</Chip>
  return <Chip tone="building">{ins.flags[0]}{ins.flags.length > 1 ? ` +${ins.flags.length - 1}` : ''}</Chip>
}

export const Understanding = ({ u }: { u: number | null }) => <Meter value={u} color={u === null ? C.muted : LEVEL_COLOR[levelOf(u)]} width={90} />
