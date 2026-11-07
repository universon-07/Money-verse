import { GOAL, trolleyItem, windowItem } from './content'
import { guessBand, littleTotal, newRun, paid, rainBill } from './economy'
import { stageOf } from './pressure'
import type { Archetype, CardPick, Concept, Ending, Experiment, MonthSummary, Run, Tally } from './types'

/**
 * Round 6, the Tally: settle debts, decide the ending, and write everything from the player's own numbers.
 * Nothing here judges: every line describes what happened.
 */

const sumPaid = (r: Run, pick: (p: Run['rainPaid']) => number) =>
  Object.values(r.bills).reduce((a, b) => a + pick(b!.paid), 0)

export function settle(run: Run, prev?: MonthSummary): Tally {
  // Quick Cash is collected from Spend, then Emergency, then Save; anything left is still owed
  let due = run.loan.repay
  const jars = { ...run.jars }
  const from = { spend: 0, emergency: 0, save: 0 }
  for (const s of ['spend', 'emergency', 'save'] as const) {
    const t = Math.min(jars[s], due)
    jars[s] -= t
    from[s] += t
    due -= t
  }
  const owed = due
  const saved = jars.save
  const ending: Ending =
    saved >= GOAL && owed === 0 ? (run.loan.borrowed > 0 ? 'reachedCost' : 'reached') : GOAL - saved <= 100 ? 'almost' : 'notyet'

  const windowBuys = run.window.filter((w) => w.bought).map((w) => windowItem(w.itemId).price)
  const bnPaid = run.bigNight?.choice && run.bigNight.choice !== 'stay' ? (run.bigNight.choice === 'go' ? run.bigNight.cost : run.bigNight.cost / 2) : 0
  const wantsBig = windowBuys.filter((x) => x >= 100).reduce((a, x) => a + x, 0) + (bnPaid >= 100 ? bnPaid : 0)
  const wantsSmall = windowBuys.filter((x) => x < 100).reduce((a, x) => a + x, 0) + (bnPaid < 100 ? bnPaid : 0)
  const little = littleTotal(run)
  const payday = run.payday ?? { spend: 0, save: 0, emergency: 0 }
  const worthItems = [
    ...run.window.map((w, i) => (w.bought ? { key: `w${i}`, price: windowItem(w.itemId).price } : null)),
    ...run.trolley.map((t, i) => (t.action === 'ok' ? { key: `t${i}`, price: trolleyItem(t.itemId).price } : null)),
  ].filter(Boolean) as { key: string; price: number }[]
  const glad = worthItems.filter((w) => run.worth[w.key] === 'glad')
  const meh = worthItems.filter((w) => run.worth[w.key] === 'meh')

  const base = {
    ending,
    saved,
    goalGap: Math.max(0, GOAL - saved),
    billsTotal: Object.values(run.bills).reduce((a, b) => a + b!.amount, 0),
    billsBySource: {
      spend: sumPaid(run, (p) => paid(p, 'spend')),
      save: sumPaid(run, (p) => paid(p, 'save')),
      emergency: sumPaid(run, (p) => paid(p, 'emergency')),
      quick: sumPaid(run, (p) => paid(p, 'quick')),
    },
    wantsBig,
    wantsSmall,
    wants: wantsBig + wantsSmall,
    little,
    littleGuess: run.predict2,
    cushionUsed: Math.max(0, payday.emergency - jars.emergency),
    cushionKept: jars.emergency,
    lentOut: run.lent,
    borrowCost: run.loan.repay - run.loan.borrowed,
    extra: run.loan.repay - run.loan.borrowed,
    owed,
    glad: glad.reduce((a, w) => a + w.price, 0),
    meh: meh.length,
    mehTotal: meh.reduce((a, w) => a + w.price, 0),
    settled: { repaidQuick: run.loan.repay - owed, from },
  }
  const evidence = observe(run, base.saved, prev)
  return {
    ...base,
    archetype: archetype(run, base.saved, ending),
    evidence,
    cards: cards(run, base),
    chit: chit(run, little),
    marginNotes: run.ledger.map((l, i) => (l.note ? { lineIndex: i, note: l.note } : null)).filter(Boolean).slice(0, 8) as Tally['marginNotes'],
    callbacks: callbacks(run, little),
  }
}

/* ------------------------------------------------------------------ the reading: what kind of money manager */

export function archetype(run: Run, saved: number, ending: Ending): Archetype {
  const payday = run.payday ?? { spend: 0, save: 0, emergency: 0 }
  const cooled = run.window.filter((w) => w.action === 'cool').length
  const wants = run.window.some((w) => w.bought) || (run.bigNight?.choice && run.bigNight.choice !== 'stay')
  if (run.loan.borrowed > 0) return 'fastmover'
  if (run.lent + run.gift >= 50) return 'openhand'
  if (cooled >= 2) return 'windowwaiter'
  // before Shelf First, so a run that refused everything is described honestly
  if (run.bigNight?.choice === 'stay' || !wants) return 'quietholder'
  if (payday.save >= 150 && (ending === 'reached' || ending === 'reachedCost') && saved >= GOAL) return 'shelffirst'
  if (payday.emergency >= 100 && paid(run.rainPaid, 'emergency') >= rainBill(run)) return 'doorwatcher'
  return 'evenkeeper'
}

/* ------------------------------------------------------------------ observed behaviour (not mastery) */

export function observe(run: Run, saved: number, prev?: MonthSummary): Record<Concept, boolean> {
  const payday = run.payday ?? { spend: 0, save: 0, emergency: 0 }
  const little = littleTotal(run)
  const guessOk = run.predict2 !== undefined && Math.abs(guessBand(little) - run.predict2) <= 1
  const cooled = run.window.filter((w) => w.action === 'cool').length
  const bigOnTheSpot = run.window.some((w) => w.bought && w.action === 'get' && windowItem(w.itemId).price >= 100)
  return {
    payFirst: payday.save >= 100 && saved >= 100,
    track: run.ledgerOpened >= 2 || guessOk,
    small: guessOk || (prev !== undefined && little < prev.little),
    emergency: payday.emergency >= 100 || (paid(run.rainPaid, 'save') === 0 && paid(run.rainPaid, 'quick') === 0),
    plan: payday.emergency > 0,
    wait: cooled >= 1 || !bigOnTheSpot,
    goals: run.saveForWants <= 1,
    borrow: !run.borrowedWithoutReading,
    lend: run.tejaChoice === 'gift30' || run.tejaChoice === 'no' || run.tejaChoice === undefined || run.lent <= (run.spendBeforeTeja ?? 0) / 2,
  }
}

/* ------------------------------------------------------------------ recap cards (What happened / Why it matters / Try this) */

function cards(run: Run, t: Pick<Tally, 'little' | 'wants' | 'ending' | 'goalGap' | 'saved' | 'cushionKept' | 'borrowCost'>): CardPick[] {
  const out: CardPick[] = []
  const bill = rainBill(run)
  const e = paid(run.rainPaid, 'emergency')
  const payday = run.payday ?? { spend: 0, save: 0, emergency: 0 }
  if (run.loan.borrowed > 0) {
    out.push({ id: 'borrow', variant: 'quick', vars: { b: run.loan.borrowed, r: run.loan.repay, e: t.borrowCost, pct: Math.round((t.borrowCost / run.loan.borrowed) * 100) } })
  }
  out.push(e >= bill ? { id: 'emergency', variant: 'covered', vars: { c: e, b: bill } } : { id: 'emergency', variant: 'notCovered', vars: { b: bill } })
  const bn = run.bigNight?.choice
  out.push(bn === 'go' || bn === 'half' ? { id: 'needs', variant: 'went', vars: {} } : bn === 'stay' ? { id: 'needs', variant: 'stayed', vars: {} } : { id: 'needs', variant: 'none', vars: { w: t.wants } })
  const low = run.predict2 !== undefined && guessBand(t.little) > run.predict2
  out.push({ id: 'small', variant: low ? 'low' : 'ok', vars: { x: t.little } })
  const cooled = run.window.filter((w) => w.action === 'cool')
  const dropped = cooled.filter((w) => !w.bought)
  if (dropped.length) out.push({ id: 'wait', variant: 'dropped', vars: { m: cooled.length, d: dropped.length, x: dropped.reduce((a, w) => a + windowItem(w.itemId).price, 0) } })
  else if (cooled.length) out.push({ id: 'wait', variant: 'still', vars: { m: cooled.length, y: cooled.filter((w) => w.bought).length } })
  else out.push({ id: 'wait', variant: 'never', vars: {} })
  out.push(run.lent ? { id: 'lend', variant: 'lent', vars: { l: run.lent } } : run.gift ? { id: 'lend', variant: 'gift', vars: {} } : { id: 'lend', variant: 'no', vars: {} })
  out.push(t.ending === 'reached' || t.ending === 'reachedCost' ? { id: 'goals', variant: 'reached', vars: { x: t.wants + t.little, y: t.cushionKept } } : { id: 'goals', variant: 'short', vars: { x: t.goalGap } })
  out.push({ id: 'payFirst', variant: payday.save >= 150 ? 'big' : 'small', vars: { s: payday.save } })
  return out.slice(0, 4)
}

/* ------------------------------------------------------------------ Chacha's chit: one thing to try this week */

function chit(run: Run, little: number): string {
  const payday = run.payday ?? { spend: 0, save: 0, emergency: 0 }
  if (run.loan.borrowed > 0) return 'quick'
  if (payday.emergency === 0) return 'emergency'
  if (run.bigNight?.choice === 'stay') return 'stayed'
  if (little > 100) return 'little'
  if (!run.window.some((w) => w.action === 'cool')) return 'cool'
  if (run.lent >= 100) return 'lend'
  return 'goal'
}

/* ------------------------------------------------------------------ callbacks (at most two, all built from real data) */

function callbacks(run: Run, little: number): Tally['callbacks'] {
  const payday = run.payday ?? { spend: 0, save: 0, emergency: 0 }
  const dropped = run.window.filter((w) => w.action === 'cool' && !w.bought)
  const fizzBoughtEarly = run.window.filter((w) => w.bought && windowItem(w.itemId).kind === 'fizz')
  const all: [boolean, string, Record<string, string | number>][] = [
    [run.borrowedWithoutReading, 'flip', {}],
    [run.lent >= 100 && (paid(run.rainPaid, 'save') > 0 || paid(run.rainPaid, 'quick') > 0), 'teja', { l: run.lent }],
    [run.bigNight?.choice === 'stay', 'stayed', {}],
    [payday.emergency === 0, 'brave', {}],
    [run.predict1 === 'none', 'saidNone', {}],
    [run.predict1 === 'one' && !run.extra, 'saidOne', {}],
    [run.predict1 === 'one' && !!run.extra, 'oneButTwo', {}],
    [run.predict1 === 'two' && !!run.extra, 'saidTwo', {}],
    [run.predict1 === 'two' && !run.extra, 'twoButOne', {}],
    [run.predict2 !== undefined && guessBand(little) > run.predict2, 'yusuf', { x: little, band: run.predict2 ?? 0 }],
    [dropped.length > 0, 'walkedAway', { x: dropped.reduce((a, w) => a + windowItem(w.itemId).price, 0) }],
    [!run.bigNight && fizzBoughtEarly.length > 0, 'marble', { x: fizzBoughtEarly.reduce((a, w) => a + windowItem(w.itemId).price, 0) }],
    [run.predict1 === 'idk', 'saidIdk', {}],
  ]
  return all.filter(([ok]) => ok).slice(0, 2).map(([, key, vars]) => ({ key, vars }))
}

/* ------------------------------------------------------------------ month summaries and the next month */

export function summarize(run: Run, t: Tally, experiment?: string): MonthSummary {
  const cooled = run.window.filter((w) => w.action === 'cool')
  const bn = run.bigNight
  return {
    month: run.month,
    seed: run.seed,
    experiment,
    saved: t.saved,
    emergencyAtPayday: run.payday?.emergency ?? 0,
    little: t.little,
    coolCount: cooled.length,
    coolDropped: cooled.filter((w) => !w.bought).length,
    borrowed: run.loan.borrowed,
    lent: run.lent,
    billsFromSave: t.billsBySource.save,
    bigNight: bn?.choice,
    fizzStageAtBigNight: bn ? 4 : stageOf(Math.max(run.fizz.fun, run.fizz.friends)),
    ending: t.ending,
    archetype: t.archetype,
    evidence: t.evidence,
    carry: { fun: !!(bn?.choice === 'stay' && bn.bottles.includes('fun')), friends: !!(bn?.choice === 'stay' && bn.bottles.includes('friends')) },
    surpriseId: run.surprise.id,
  }
}

/** same table, new month: same income and goal, a different surprise, reshuffled offers, carried fizz */
export function nextMonth(prev: Run, summary: MonthSummary, seed: string): Run {
  return newRun({ seed, goal: prev.goal, month: prev.month + 1, carry: summary.carry, lastSurprise: prev.surprise.id })
}

/** how many of the nine behaviours flipped from no to yes between two months */
export const flips = (a: MonthSummary, b: MonthSummary): Concept[] =>
  (Object.keys(b.evidence) as Concept[]).filter((c) => !a.evidence[c] && b.evidence[c])

export type { Experiment }
