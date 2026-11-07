import { draw } from '../../../lib/rng'
import { ECON, SCRIPT, card, type FriendCard, type WantCard } from './content'
import { NO_RULES, type Day, type Decision, type Event, type Rules, type State, type WeekScript } from './types'

export class EngineError extends Error {}
export type Out = { state: State; events: Event[] }

export const initialState = (): State => ({
  week: 0, pocket: 0, jar: 0, loans: [], lateDue: 0, list: [], returning: [], rules: { ...NO_RULES }, lent: [],
  phase: { at: 'done' }, open: { pocket: 0, jar: 0 }, events: [], history: [],
})

const ceilTo = (x: number, step: number) => Math.ceil(x / step) * step
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x))

/** Rupees of surprise bills in a week's events (planned costs are not surprises). */
export const surpriseTotal = (events: Event[]) => events.reduce((a, e) => (e.t === 'bill' && card(e.id).kind === 'surprise' ? a + e.amount : a), 0)

// ---------- the numbers a screen needs before the student decides ----------

/** A day's treat price; with Packed Lunch, food treats cost half, rounded up to the next ₹5. */
export function treatPrice(day: Day, lunch: boolean): number {
  const t = ECON.treats[day - 1]
  return lunch && t.food ? ceilTo(t.price / 2, ECON.packedLunchStep) : t.price
}

/** Lost cash: 30% of the pocket, at least ₹30, at most ₹150, never more than the pocket (0 if the pocket is empty). */
export function lostCashAmount(pocket: number): number {
  if (pocket <= 0) return 0
  return Math.min(pocket, clamp(Math.round((pocket * ECON.lostCash.pct) / 100), ECON.lostCash.min, ECON.lostCash.max))
}

/** The three ways to cover a bill, each with its true cost. None is marked as better. */
export function shortfallOptions(state: Pick<State, 'jar'>, shortfall: number) {
  const jarAmount = Math.min(state.jar, Math.max(ECON.breakJar.min, ceilTo(shortfall, ECON.breakJar.step)))
  const qc = Math.max(ECON.quickCash.min, ceilTo(shortfall, ECON.quickCash.step))
  const owed = qc * ECON.quickCash.repayMultiplier
  return {
    jar: { enabled: state.jar >= shortfall, amount: jarAmount },
    quickcash: { amount: qc, owed, extra: owed - qc, instalment: owed / ECON.quickCash.instalments },
    late: { fee: ECON.lateFee },
  }
}

export const isUnlocked = (rule: 'lunch' | 'save' | 'waitlist', week: number) => week >= SCRIPT.unlocks[rule]

/** Rules the student can't use yet stay off, so an old save or a bad call can't skip the syllabus. */
export function sanitizeRules(r: Rules, week: number): Rules {
  return {
    savePct: isUnlocked('save', week) ? r.savePct : 0,
    lunch: isUnlocked('lunch', week) && r.lunch,
    waitlist: isUnlocked('waitlist', week) && r.waitlist,
  }
}

/** The price a want will cost now: a returning Wait List item costs its return price. */
export const wantPrice = (state: State, id: string) => state.returning.find((r) => r.id === id)?.price ?? (card(id) as WantCard).price

/** The card shown on a day ('@listed' becomes the first Wait List item that came back, or a quiet day). */
export function cardOnDay(script: WeekScript, state: State, day: Day): string | null {
  const id = script.days[day]
  return id === '@listed' ? (state.returning[0]?.id ?? null) : id
}

/** Scripted urge for weeks 6-8, else a seeded 70% drop, so "Still want it?" can prefill or run in a bot. */
export function stillWantSuggestion(seed: string, week: number, id: string): boolean {
  const scripted = SCRIPT.stillWant[String(week)]?.[id]
  if (scripted != null) return scripted
  return draw(seed, `stillwant:${week}:${id}`) >= ECON.waitListDropChance
}

// ---------- state changes ----------

/** What each event does to the pocket and the jar. The ledger identity is built on this. */
export function effect(e: Event): { pocket: number; jar: number } {
  switch (e.t) {
    case 'wage': case 'repaid': case 'windfall': return { pocket: e.amount, jar: 0 }
    case 'musthave': case 'instalment': case 'late': case 'treat': case 'want': case 'lost': case 'lend': return { pocket: -e.amount, jar: 0 }
    case 'bill': return { pocket: -e.fromPocket, jar: 0 }
    case 'save': return { pocket: -e.amount, jar: e.amount }
    case 'quickcash': return { pocket: e.amount - e.shortfall, jar: 0 }
    case 'breakjar': return { pocket: e.amount - e.shortfall, jar: -e.amount }
    default: return { pocket: 0, jar: 0 }
  }
}

function emit(s: State, ...es: Event[]): State {
  let { pocket, jar } = s
  for (const e of es) {
    const d = effect(e)
    pocket += d.pocket
    jar += d.jar
  }
  if (pocket < 0 || jar < 0) throw new EngineError(`pocket or jar went negative on ${es.map((e) => e.t).join(',')}`)
  return { ...s, pocket, jar, events: [...s.events, ...es] }
}
const out = (before: State, after: State): Out => ({ state: after, events: after.events.slice(before.events.length) })

/** Payday, steps 1-4 of section 5: wage in, must-haves out, Quick Cash instalments out, late bills and fees out. */
export function startWeek(state: State, script: WeekScript): Out {
  let s: State = { ...state, week: script.week, open: { pocket: state.pocket, jar: state.jar }, events: [], phase: { at: 'plan' } }
  s = emit(s, { t: 'wage', amount: script.wage }, { t: 'musthave', amount: ECON.mustHaves })

  let unpaid = 0
  const loans = []
  for (const loan of s.loans) {
    const pay = Math.min(loan.instalment, s.pocket)
    if (pay > 0) s = emit(s, { t: 'instalment', amount: pay })
    unpaid += loan.instalment - pay
    if (loan.left - 1 > 0) loans.push({ ...loan, left: loan.left - 1 })
  }
  const paidLate = Math.min(s.lateDue, s.pocket)
  unpaid += s.lateDue - paidLate
  const fee = unpaid > 0 ? ECON.lateFee : 0
  s = { ...s, loans, lateDue: unpaid + fee }
  if (paidLate > 0 || fee > 0) s = emit(s, { t: 'late', amount: paidLate, fee, carried: unpaid + fee })
  return out(state, s)
}

function finishDay(s: State, script: WeekScript, day: Day): State {
  return day < 6 ? { ...s, phase: { at: 'treat', day: (day + 1) as Day } } : endWeek(s, script).state
}

/** After the treat: bills and lost cash happen by themselves; wants, friends and windfalls ask the student. */
function openCard(s: State, script: WeekScript, day: Day): State {
  const id = cardOnDay(script, s, day)
  if (!id) return finishDay(s, script, day)
  const c = card(id)
  if (c.kind === 'surprise' || c.kind === 'planned') {
    const fromPocket = Math.min(s.pocket, c.amount)
    const next = emit(s, { t: 'bill', day, id, amount: c.amount, fromPocket })
    const shortfall = c.amount - fromPocket
    return shortfall > 0 ? { ...next, phase: { at: 'shortfall', day, id, amount: c.amount, shortfall } } : finishDay(next, script, day)
  }
  if (c.kind === 'lost') return finishDay(emit(s, { t: 'lost', day, amount: lostCashAmount(s.pocket) }), script, day)
  return { ...s, phase: { at: 'card', day, id } }
}

/** Resolves friend repayments and opens the Week Review. Scripted weeks use the script; bonus weeks draw from the seed. */
export function endWeek(state: State, script: WeekScript): Out {
  let s = state
  for (const l of state.lent.filter((x) => x.week === script.week)) {
    const c = card(l.id) as FriendCard
    const repays = script.scripted && c.scriptedRepay != null ? c.scriptedRepay : draw(script.seed, `friend:${script.week}:${l.id}`) < c.repayChance
    if (repays) s = emit(s, { t: 'repaid', id: l.id, amount: l.amount })
  }
  s = { ...s, lent: s.lent.filter((x) => x.week !== script.week), phase: { at: 'review' } }
  return out(state, s)
}

/** Applies one student decision (including "Not enough on you", the Shortfall trigger and Wait List listing). */
export function applyDecision(state: State, script: WeekScript, d: Decision): Out {
  const ph = state.phase
  let s = state
  switch (d.k) {
    case 'stillwant': {
      if (ph.at !== 'plan') throw new EngineError('Still want it? is asked at Plan')
      const item = s.list.find((x) => x.id === d.id)
      if (!item) throw new EngineError(`${d.id} is not on the list`)
      s = { ...s, list: s.list.filter((x) => x.id !== d.id) }
      s = d.yes ? { ...s, returning: [...s.returning, { id: d.id, price: item.returnPrice }] } : emit(s, { t: 'saved', id: d.id, amount: (card(d.id) as WantCard).price })
      break
    }
    case 'rules': {
      if (ph.at !== 'plan') throw new EngineError('rules are set at Plan')
      const rules = sanitizeRules(d.rules, script.week)
      s = { ...s, rules }
      const share = Math.min(Math.round((script.wage * rules.savePct) / 100), s.pocket)
      if (share > 0) s = emit(s, { t: 'save', amount: share, via: 'share' })
      const extra = Math.min(Math.floor(d.extra / ECON.moveStep) * ECON.moveStep, Math.floor(s.pocket / ECON.moveStep) * ECON.moveStep)
      if (extra > 0) s = emit(s, { t: 'save', amount: extra, via: 'extra' })
      s = { ...s, phase: { at: 'treat', day: 1 } }
      break
    }
    case 'treat': {
      if (ph.at !== 'treat' || ph.day !== d.day) throw new EngineError(`expected the Day ${ph.at === 'treat' ? ph.day : '?'} treat`)
      const price = treatPrice(d.day, s.rules.lunch)
      if (d.yes) s = s.pocket >= price ? emit(s, { t: 'treat', day: d.day, amount: price }) : emit(s, { t: 'blocked', day: d.day, id: 'treat' })
      s = openCard(s, script, d.day)
      break
    }
    case 'want': {
      if (ph.at !== 'card' || ph.day !== d.day || ph.id !== d.id) throw new EngineError('not this want')
      const c = card(d.id) as WantCard
      const price = wantPrice(s, d.id)
      const wasReturning = s.returning.some((r) => r.id === d.id)
      if (wasReturning) s = { ...s, returning: s.returning.filter((r) => r.id !== d.id) }
      if (d.choice === 'buy') s = s.pocket >= price ? emit(s, { t: 'want', day: d.day, id: d.id, amount: price }) : emit(s, { t: 'blocked', day: d.day, id: d.id })
      else if (d.choice === 'list' && s.rules.waitlist && c.listable) s = { ...s, list: [...s.list, { id: d.id, returnPrice: c.returnPrice ?? c.price, fromWeek: script.week }] }
      s = finishDay(s, script, d.day)
      break
    }
    case 'friend': {
      if (ph.at !== 'card' || ph.day !== d.day || ph.id !== d.id) throw new EngineError('not this friend')
      const c = card(d.id) as FriendCard
      const amount = d.choice === 'lend200' ? c.ask : d.choice === 'lend50' ? 50 : 0
      if (amount > 0) {
        if (s.pocket >= amount) s = { ...emit(s, { t: 'lend', day: d.day, id: d.id, amount }), lent: [...s.lent, { id: d.id, amount, week: script.week }] }
        else s = emit(s, { t: 'blocked', day: d.day, id: d.id })
      }
      s = finishDay(s, script, d.day)
      break
    }
    case 'windfall': {
      if (ph.at !== 'card' || ph.day !== d.day) throw new EngineError('not a windfall')
      s = emit(s, { t: 'windfall', amount: ECON.windfall })
      if (d.choice === 'jar') s = emit(s, { t: 'save', amount: ECON.windfall, via: 'windfall' })
      if (d.choice === 'split') s = emit(s, { t: 'save', amount: ECON.windfall / 2, via: 'windfall' })
      s = finishDay(s, script, d.day)
      break
    }
    case 'shortfall': {
      if (ph.at !== 'shortfall' || ph.day !== d.day) throw new EngineError('no shortfall to cover')
      const o = shortfallOptions(s, ph.shortfall)
      if (d.choice === 'jar') {
        if (!o.jar.enabled) throw new EngineError('Break the jar is disabled: the jar holds less than the shortfall')
        s = emit(s, { t: 'breakjar', shortfall: ph.shortfall, amount: o.jar.amount })
      } else if (d.choice === 'quickcash') {
        const loan = { id: `${script.week}:${ph.id}`, amount: o.quickcash.amount, instalment: o.quickcash.instalment, left: ECON.quickCash.instalments }
        s = { ...emit(s, { t: 'quickcash', shortfall: ph.shortfall, amount: o.quickcash.amount, owed: o.quickcash.owed }), loans: [...s.loans, loan] }
      } else {
        s = { ...emit(s, { t: 'paylate', shortfall: ph.shortfall, fee: ECON.lateFee }), lateDue: s.lateDue + ph.shortfall + ECON.lateFee }
      }
      s = finishDay(s, script, d.day)
      break
    }
    case 'sweep': {
      if (ph.at !== 'review') throw new EngineError('the leftover move happens at the Week Review')
      const amount = Math.min(Math.floor(d.amount / ECON.moveStep) * ECON.moveStep, Math.floor(s.pocket / ECON.moveStep) * ECON.moveStep)
      if (amount > 0) s = emit(s, { t: 'save', amount, via: 'sweep' })
      s = {
        ...s,
        phase: { at: 'done' },
        history: [...s.history, { week: script.week, openPocket: s.open.pocket, openJar: s.open.jar, closePocket: s.pocket, closeJar: s.jar, jarGain: s.jar - s.open.jar, surprises: surpriseTotal(s.events) }],
      }
      break
    }
  }
  return out(state, s)
}
