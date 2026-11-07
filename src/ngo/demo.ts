import { PILLAR_IDS, SKILLS } from '../content/data'
import { CONCEPTS, type Concept, type StudentSummary } from './summary'

export const DEMO_CODE = 'DEMO-CLASS'

/** made-up first names for the demo roster; like a real roster, kept only on the teacher's device. Two have not shared yet. */
const DEMO_NAMES = ['Aarav', 'Ananya', 'Arjun', 'Bhavya', 'Charan', 'Deepika', 'Farhan', 'Gayatri', 'Harsha', 'Ishita', 'Imran', 'Jahnavi', 'Karthik', 'Lakshmi', 'Manoj', 'Meena', 'Nikhil', 'Nandini', 'Omkar', 'Pooja', 'Pranav', 'Rehana', 'Rohit', 'Sahithi', 'Sameer', 'Sanjana', 'Shreya', 'Siddharth', 'Sravani', 'Tanvi', 'Tarun', 'Uday', 'Vaishnavi', 'Varun', 'Yamini', 'Zoya', 'Abhinav', 'Bhargavi', 'Chaitanya', 'Divya', 'Ganesh', 'Haritha', 'Kavya', 'Mahesh', 'Navya', 'Pavan', 'Ritika', 'Sai', 'Teja', 'Vikram']
export const demoRoster = (): Record<string, string> => Object.fromEntries(DEMO_NAMES.map((n, i) => [String(i + 1).padStart(4, '0'), `${n} (made-up)`]))

/** small seeded random numbers so the demo class looks the same every time */
function rng(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** a made-up class of 48 students with a realistic spread (some stuck, some thriving), for showing the dashboard without real data */
export function demoStudents(now = Date.now()): StudentSummary[] {
  const r = rng(26)
  const out: StudentSummary[] = []
  for (let i = 0; i < 48; i++) {
    const ability = Math.min(1, Math.max(0, 0.35 + r() * 0.5 + (i % 7 === 0 ? 0.15 : 0) - (i % 9 === 0 ? 0.25 : 0)))
    const reach = r() < 0.12 ? 0 : r() < 0.3 ? 1 : r() < 0.55 ? 2 : r() < 0.8 ? 3 : 4
    const places = {} as StudentSummary['places']
    PILLAR_IDS.forEach((id, k) => {
      if (k < reach) {
        const q = Math.min(1, Math.max(0.2, ability + (r() - 0.5) * 0.35))
        const a = 1 + (r() < 0.3 ? 1 + Math.floor(r() * 2) : 0)
        places[id] = { s: 'c', q: Math.round(q * 100) / 100, a, b: q > 0.7 ? 'b' : q > 0.45 ? 'd' : 'f' }
      } else if (k === reach && r() < 0.5) places[id] = { s: 'p', q: 0, a: 1, b: null }
      else places[id] = { s: 'n', q: 0, a: 0, b: null }
    })
    const skills = {} as StudentSummary['skills']
    for (const s of SKILLS) skills[s] = Math.round(Math.min(1, Math.max(0, ability + (r() - 0.5) * 0.5 - (s === 'riskSense' ? 0.18 : 0) - (s === 'patience' ? 0.1 : 0))) * 100) / 100
    const played = places.save.a > 0
    const habits = played ? (Object.fromEntries(CONCEPTS.map((c) => [c, r() < ability + (c === 'emergency' ? -0.2 : c === 'payFirst' ? 0.1 : 0)])) as Record<Concept, boolean>) : null
    const closed = places.safe.s === 'c' ? 2 + Math.floor(r() * 3) : 0
    const cleared = PILLAR_IDS.filter((p) => places[p].s === 'c').length
    out.push({
      v: 1,
      id: `demo${i.toString(36).padStart(3, '0')}`,
      cohort: DEMO_CODE,
      // most students give a roll number; a few forget (the desk shows them by student code)
      roll: i % 11 === 10 ? null : String(i + 1).padStart(4, '0'),
      at: now - Math.floor(r() * 5 * 86400000),
      lang: r() < 0.45 ? 'te' : r() < 0.64 ? 'hi' : 'en',
      persona: r() < 0.4 ? 'school' : r() < 0.78 ? 'college' : 'earner',
      lite: r() < 0.38,
      places,
      skills,
      happy: Math.round(Math.min(100, Math.max(10, 70 - cleared * 4 + (r() - 0.4) * 40))),
      breaks: cleared >= 2 && r() < 0.35 ? 0 : Math.floor(r() * 3),
      habits,
      p4: closed ? { closed, wrong: Math.floor(closed * (1 + r() * 4)), hints: Math.floor(closed * r()) } : null,
    })
  }
  return out
}

const WEEK = 7 * 86400000

/**
 * Six weekly snapshots per demo student, ending at the student's latest summary, so trends have something to show: places open
 * up week by week and skills grow as students replay. Some students join a week or two late. Made-up data, stable every time.
 */
export function demoHistory(now = Date.now()): StudentSummary[] {
  const out: StudentSummary[] = []
  demoStudents(now).forEach((fin, i) => {
    const order = PILLAR_IDS.filter((p) => fin.places[p].s !== 'n')
    const cleared = PILLAR_IDS.filter((p) => fin.places[p].s === 'c').length
    const join = i % 5 === 0 ? 2 : i % 7 === 0 ? 1 : 0
    for (let w = join; w < 6; w++) {
      const f = (w + 1) / 6
      const allowed = Math.round(cleared * f)
      const places = {} as StudentSummary['places']
      PILLAR_IDS.forEach((p) => {
        const k = order.indexOf(p)
        if (w === 5 || (k >= 0 && k < allowed)) places[p] = fin.places[p]
        else if (k === allowed && k >= 0) places[p] = { s: 'p', q: 0, a: 1, b: null }
        else places[p] = { s: 'n', q: 0, a: 0, b: null }
      })
      const skills = {} as StudentSummary['skills']
      for (const s of SKILLS) skills[s] = w === 5 ? fin.skills[s] : Math.round(fin.skills[s] * (0.55 + 0.45 * f) * 100) / 100
      out.push({
        ...fin,
        at: fin.at - (5 - w) * WEEK,
        places,
        skills,
        habits: places.save.a > 0 ? fin.habits : null,
        p4: places.safe.s === 'c' ? fin.p4 : null,
      })
    }
  })
  return out.sort((a, b) => a.at - b.at)
}
