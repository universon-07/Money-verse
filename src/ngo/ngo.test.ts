import { describe, expect, it } from 'vitest'
import { PILLAR_IDS } from '../content/data'
import { K_MIN, aggregate, bandOf, toCsv } from './analytics'
import { DEMO_CODE, demoHistory, demoStudents } from './demo'
import { cleanRoll, rollInput } from '../lib/roll'
import { parseRoster } from './roster'
import { toCsvText } from './export'
import { focusAreas, studentInsight, understanding, weeklyTrend } from './insights'
import { labelKey, latestOf, useNgo } from './store'
import { rowToSummary } from './cloud'
import { buildSummary, cleanCode, decodeSummary, encodeSummary, findCodes, parseSummary } from './summary'

const game = (state: object) => ({ 'money-mohalla-v2': JSON.stringify({ state, version: 2 }) })
const played = {
  installId: 'abc-123', classCode: 'hyd-4k7q', language: 'te', persona: 'college', liteMode: true, happy: 72.4, skills: { saving: 0.8, riskSense: 0.2 },
  lifeMomentsUsed: { chai: 2 },
  pillars: { plan: { status: 'complete', bestQuality: 0.9, attempts: 2, brightness: 'bright' }, save: { status: 'in_progress', attempts: 1 } },
}

describe('student summary', () => {
  it('reads a saved game without names or typed text', () => {
    const s = buildSummary({ ...game({ ...played, nickname: 'Priya' }), 'p4.v1': JSON.stringify({ state: { completed: ['C1'], progress: { C1: { wrongTotal: 3, hintUsed: true } } } }) }, 5)
    expect(s).toMatchObject({ cohort: 'HYD-4K7Q', lang: 'te', persona: 'college', lite: true, happy: 72, breaks: 2, p4: { closed: 1, wrong: 3, hints: 1 } })
    expect(s.places.plan).toEqual({ s: 'c', q: 0.9, a: 2, b: 'b' })
    expect(s.places.save.s).toBe('p')
    expect(JSON.stringify(s)).not.toContain('Priya')
    expect(JSON.stringify(s)).not.toContain('abc-123')
  })
  it('survives an empty or broken save', () => {
    expect(buildSummary({}).places.plan.s).toBe('n')
    expect(buildSummary({ 'money-mohalla-v2': '{nope' }).happy).toBe(50)
  })
  it('round-trips through the shareable code, even inside a chat message', () => {
    const s = buildSummary(game(played), 9)
    const code = encodeSummary(s)
    expect(decodeSummary(code)).toEqual(s)
    expect(findCodes(`hi sir, my code is ${code} thanks!`)).toEqual([code])
  })
  it('rejects tampered or foreign codes', () => {
    expect(decodeSummary('MM1.@@@')).toBeNull()
    expect(decodeSummary('hello')).toBeNull()
    expect(parseSummary({ v: 2 })).toBeNull()
    expect(parseSummary({ v: 1, id: 'abcdef', happy: 9999, skills: { saving: 7 } })?.happy).toBe(100)
    expect(parseSummary({ v: 1, id: 'abcdef', skills: { saving: 7 } })?.skills.saving).toBe(1)
  })
  it('cleans class codes so a student typing them loosely still matches the teacher', () => {
    expect(cleanCode(' hyd 4k7q!! ')).toBe('HYD-4K7Q')
    expect(cleanCode('hydk7q2m')).toBe('HYD-K7Q2M')
    expect(cleanCode('HYD-K7Q2M')).toBe('HYD-K7Q2M')
    expect(cleanCode('Hyd - k7q2m')).toBe('HYD-K7Q2M')
    expect(cleanCode('DEMO-CLASS')).toBe('DEMO-CLASS')
    expect(cleanCode('   ')).toBeNull()
  })
})

describe('cohort analytics', () => {
  const demo = demoStudents(1)
  it('the demo class is stable and anonymous', () => {
    expect(demo).toHaveLength(48)
    expect(demoStudents(1)).toEqual(demo)
    expect(new Set(demo.map((s) => s.id)).size).toBe(48)
  })
  it('counts the funnel and who has started', () => {
    const v = aggregate(demo)
    expect(v.n).toBe(48)
    expect(v.funnel.map((f) => f.id)).toEqual(PILLAR_IDS)
    expect(v.funnel[0].started).toBeGreaterThanOrEqual(v.funnel[0].cleared)
    expect(v.funnel[0].cleared).toBeGreaterThanOrEqual(v.funnel[3].cleared)
    expect(v.active).toBeLessThanOrEqual(48)
  })
  it('finds a weakest skill and ranks mistakes by how common they are', () => {
    const v = aggregate(demo)
    expect(v.weakestSkill).not.toBeNull()
    const shares = v.mistakes.filter((m) => m.reliable).map((m) => m.share)
    expect([...shares].sort((a, b) => b - a)).toEqual(shares)
  })
  it('hides groups smaller than the minimum', () => {
    const few = demo.slice(0, 3)
    const v = aggregate(few)
    expect(v.languages.every((l) => l.n === 0)).toBe(true)
    expect(v.languages.some((l) => l.hidden)).toBe(true)
    expect(K_MIN).toBe(5)
  })
  it('splits the Happy Index into bands', () => {
    expect([bandOf(80), bandOf(40), bandOf(10)]).toEqual(['bright', 'dim', 'flicker'])
    const v = aggregate(demo)
    expect(v.happy.bright + v.happy.dim + v.happy.flicker).toBe(48)
  })
  it('lists only students who still have places to clear, least started first', () => {
    const q = aggregate(demo).quiet
    expect(q.every((r) => r.missing.length > 0)).toBe(true)
    expect(q.map((r) => r.started)).toEqual([...q.map((r) => r.started)].sort((a, b) => a - b))
  })
  it('handles an empty class', () => {
    const v = aggregate([])
    expect(v).toMatchObject({ n: 0, active: 0, weakestSkill: null, lastSeen: null })
    expect(v.happy.avg).toBeNull()
  })
  it('exports one anonymous line per student', () => {
    const csv = toCsv(demo).split('\n')
    expect(csv).toHaveLength(49)
    expect(csv[0].startsWith('id,class_code')).toBe(true)
  })
})

describe('adding students to a class (device mode)', () => {
  const code = encodeSummary(buildSummary(game(played), 9))
  const cls = (id: string) => useNgo.getState().local.find((c) => c.id === id)
  it('puts students in the chosen class, even when their own code is different or missing', async () => {
    const a = await useNgo.getState().createCohort('Class 11 B')
    expect(a).toMatch(/^HYD-[A-Z0-9]{5}$/)
    const noCode = encodeSummary({ ...buildSummary(game(played), 10), cohort: null, id: 'zzzzzz' })
    const r = await useNgo.getState().importText(`from Priya: ${code}\n${noCode}`, a)
    expect(r).toMatchObject({ added: 2, found: 2, skipped: 0 })
    expect(Object.keys(cls(a)!.students)).toHaveLength(2)
    expect(cls(a)!.history).toHaveLength(2)
    expect(cls('UNASSIGNED')).toBeUndefined()
  })
  it('does not double count, keeps newer updates as history, and reports text with no codes', async () => {
    const a = await useNgo.getState().createCohort('Class 12')
    await useNgo.getState().importText(code, a)
    expect(await useNgo.getState().importText(code, a)).toMatchObject({ added: 0, skipped: 1 })
    const later = encodeSummary({ ...buildSummary(game(played), 99) })
    expect(await useNgo.getState().importText(later, a)).toMatchObject({ updated: 1 })
    expect(cls(a)!.history).toHaveLength(2)
    expect(await useNgo.getState().importText('hello', a)).toMatchObject({ found: 0, added: 0 })
  })
  it('sorts by each student own class code when no class is chosen', async () => {
    await useNgo.getState().importText(code, null)
    expect(cls('HYD-4K7Q')).toBeDefined()
  })
  it('keeps names on this device only and drops them with the student', async () => {
    const a = await useNgo.getState().createCohort('Names')
    await useNgo.getState().importText(code, a)
    const id = Object.keys(cls(a)!.students)[0]
    useNgo.getState().setLabel(a, id, '  Ravi   K ')
    expect(useNgo.getState().labels[labelKey(a, id)]).toBe('Ravi K')
    await useNgo.getState().deleteStudent(a, id)
    expect(useNgo.getState().labels[labelKey(a, id)]).toBeUndefined()
    expect(cls(a)!.history).toHaveLength(0)
  })
})

describe('insights for teaching', () => {
  const now = Date.UTC(2026, 9, 11)
  const hist = demoHistory(now)
  it('the demo history ends at the demo class and grows week by week', () => {
    const latest = latestOf(hist)
    expect(Object.keys(latest)).toHaveLength(48)
    const t = weeklyTrend(hist, 8, now)
    expect(t.length).toBeGreaterThanOrEqual(5)
    const u = t.map((p) => p.understanding as number)
    expect(u.at(-1)!).toBeGreaterThan(u[0])
    expect(t.at(-1)!.students).toBe(48)
  })
  it('understanding counts only skills a student has had the chance to show', () => {
    const s = buildSummary(game(played), 9)
    // plan and save were played: planning 0, prioritising 0, saving 0.8; invest and safe skills do not count yet
    expect(understanding(s)).toBeCloseTo(0.8 / 3)
    expect(understanding(buildSummary({}))).toBeNull()
  })
  it('flags students who need help, with a reason and a next step', () => {
    const fresh = buildSummary({})
    const i = studentInsight(fresh, Date.now())
    expect(i.flags[0]).toMatch(/not started/i)
    expect(i.next).toMatch(/Festival/)
    const quiet = studentInsight({ ...buildSummary(game(played), 0), at: 0 }, 20 * 86400000)
    expect(quiet.flags.some((f) => /Quiet for 20 days/.test(f))).toBe(true)
  })
  it('ranks focus areas, weakest first, and never more than three', () => {
    const v = aggregate(Object.values(latestOf(hist)))
    const f = focusAreas(v)
    expect(f.length).toBeLessThanOrEqual(3)
    expect(f.length).toBeGreaterThan(0)
    expect(f[0].why).toMatch(/students are still building/)
  })
  it('CSV cells cannot start a spreadsheet formula', () => {
    expect(toCsvText([['=HYPERLINK("x")', 'a,b']])).toBe(`"'=HYPERLINK(""x"")","a,b"`)
  })
})

describe('student to teacher, end to end (device mode)', () => {
  it('a student who types the class code loosely lands in the teacher class, and an update replaces the old one', async () => {
    const code = await useNgo.getState().createCohort('Class 11 C, Amberpet')
    const loose = code.toLowerCase().replace('-', ' ')
    // the student's saved game, as the phone keeps it
    const save = (happy: number) => game({ ...played, installId: 'phone-of-student-a', classCode: loose, happy })
    const first = encodeSummary(buildSummary(save(40), 1_000))
    const report = await useNgo.getState().importText(`Sir my code: ${first}`, null) // teacher lets codes sort themselves
    expect(report).toMatchObject({ added: 1 })
    const cls = useNgo.getState().local.find((c) => c.id === code)!
    const [only] = Object.values(cls.students)
    expect(only.cohort).toBe(code)
    // a week later the same student shares again: same student code, newer progress
    const again = encodeSummary(buildSummary(save(80), 2_000))
    expect(await useNgo.getState().importText(again, null)).toMatchObject({ updated: 1 })
    const after = useNgo.getState().local.find((c) => c.id === code)!
    expect(Object.keys(after.students)).toEqual([only.id])
    expect(after.students[only.id].happy).toBe(80)
    expect(after.history.map((h) => h.happy)).toEqual([40, 80])
  })
  it('two students on one shared phone get different student codes', () => {
    const a = buildSummary(game({ ...played, installId: 'slot-1' }))
    const b = buildSummary(game({ ...played, installId: 'slot-2' }))
    expect(a.id).not.toBe(b.id)
  })
})

describe('reading rows back from the database', () => {
  const row = (at: number, received: string) => ({ class_code: 'HYD-K7Q2M', student_id: 'abc1234', received_at: received, summary: { ...buildSummary(game(played), at), id: 'abc1234' } })
  it('keeps when the student played for a code pasted later, but not a phone clock that is off', () => {
    const got = Date.parse('2026-10-11T10:00:00Z')
    expect(rowToSummary(row(got - 3 * 86400000, '2026-10-11T10:00:00Z'))!.at).toBe(got - 3 * 86400000)
    expect(rowToSummary(row(got + 86400000, '2026-10-11T10:00:00Z'))!.at).toBe(got)
    expect(rowToSummary(row(got - 90 * 86400000, '2026-10-11T10:00:00Z'))!.at).toBe(got)
  })
  it('drops a row whose summary does not belong to its student', () => {
    expect(rowToSummary({ ...row(1, '2026-10-11T10:00:00Z'), student_id: 'other99' })).toBeNull()
  })
})

describe('roll numbers', () => {
  it('are always 4 digits, however the student types them', () => {
    expect(cleanRoll('23')).toBe('0023')
    expect(cleanRoll('0023')).toBe('0023')
    expect(cleanRoll(' 1234 ')).toBe('1234')
    expect(cleanRoll(7)).toBe('0007')
    expect(cleanRoll('12345')).toBeNull()
    expect(cleanRoll('0')).toBeNull()
    expect(cleanRoll('Ravi')).toBeNull()
    expect(cleanRoll('')).toBeNull()
    expect(rollInput('2a3b45')).toBe('2345')
  })
  it('travel in the progress code with the class code, and never a name', () => {
    const s = buildSummary(game({ ...played, rollNo: '23', nickname: 'Ravi Kumar' }), 5)
    expect(s.roll).toBe('0023')
    const back = decodeSummary(encodeSummary(s))!
    expect(back).toMatchObject({ roll: '0023', cohort: 'HYD-4K7Q' })
    expect(JSON.stringify(back)).not.toContain('Ravi')
  })
  it('a code from before roll numbers still reads, with no roll', () => {
    const { roll: _roll, ...old } = buildSummary(game(played), 5)
    expect(parseSummary(old)?.roll).toBeNull()
  })
  it('free text in the roll field is dropped', () => {
    expect(parseSummary({ ...buildSummary(game(played), 5), roll: 'Ravi Kumar' })?.roll).toBeNull()
  })
})

describe('class list (on the teacher device)', () => {
  it('reads the shapes registers and spreadsheets give', () => {
    const r = parseRoster('Roll, Name\n0001, Ananya Reddy\n2\tMohammed Imran\n3. Sravani K\nPavan Kalyan - 4\n\n5) Teja\n12345, Too long\nno number here')
    expect(r.roster).toEqual({ '0001': 'Ananya Reddy', '0002': 'Mohammed Imran', '0003': 'Sravani K', '0004': 'Pavan Kalyan', '0005': 'Teja' })
    expect(r.skipped).toEqual(['Roll, Name', '12345, Too long', 'no number here'])
  })
  it('keeps the last name when a roll number repeats, and says so', () => {
    const r = parseRoster('7, A\n0007, B')
    expect(r.roster).toEqual({ '0007': 'B' })
    expect(r.repeated).toEqual(['0007'])
  })
  it('is never part of what is stored as progress or exported', async () => {
    const id = await useNgo.getState().createCohort('Roster class')
    useNgo.getState().setRoster(id, { '0023': 'Ravi Kumar' })
    await useNgo.getState().importText(encodeSummary(buildSummary(game({ ...played, installId: 'r1', rollNo: '23' }), 9)), id)
    const cls = useNgo.getState().local.find((c) => c.id === id)!
    expect(JSON.stringify(cls)).not.toContain('Ravi')
    expect(toCsv(Object.values(cls.students))).not.toContain('Ravi')
    expect(Object.values(cls.students)[0].roll).toBe('0023')
    // the class list goes when the class goes
    await useNgo.getState().deleteCohort(id)
    expect(useNgo.getState().rosters[id]).toBeUndefined()
  })
  it('the demo class comes with a made-up class list that matches most students', () => {
    useNgo.getState().loadDemo()
    const roster = useNgo.getState().rosters[DEMO_CODE]
    const students = Object.values(useNgo.getState().local.find((c) => c.id === DEMO_CODE)!.students)
    const named = students.filter((s) => s.roll && roster[s.roll])
    expect(named.length).toBeGreaterThan(40)
    expect(Object.values(roster).every((n) => n.endsWith('(made-up)'))).toBe(true)
  })
})
