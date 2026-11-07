import { describe, expect, test } from 'vitest'
import { REFERENCE, payWith, playMonth } from '../engine/bots'
import { quickRepay } from '../engine/content'
import {
  applyPayment, billAmount, buyWindow, chooseBigNight, chooseTeja, confirmPayday, declineWindow, newRun, openBigNight,
  payBill, paydayError, paymentError, rainBill, tejaAvailable, trolleyOk, trolleySkip,
} from '../engine/economy'
import { balance, isPerfect, starCount } from '../engine/balance'
import { moodOf, moodStage } from '../engine/mood'
import { popped, stageOf } from '../engine/pressure'
import { nextMonth, settle, summarize } from '../engine/tally'
import type { Run } from '../engine/types'

const fresh = (split = { save: 250, emergency: 100, spend: 250 }) => confirmPayday(newRun({ seed: 'T', goal: 'earphones' }), split)

describe('payday and the source rule (the doc, section 17 tests 1 to 7, 11, 12)', () => {
  test('1. Confirm is impossible until the jars sum to ₹600', () => {
    expect(paydayError({ spend: 300, save: 200, emergency: 0 })).toBe('notAll')
    expect(paydayError({ spend: 305, save: 295, emergency: 0 })).toBe('coins')
    expect(paydayError({ spend: 300, save: 300, emergency: 0 })).toBeNull()
    expect(() => confirmPayday(newRun({ seed: 'T', goal: 'trip' }), { spend: 100, save: 100, emergency: 100 })).toThrow()
  })

  test('2. taking from Save moves the goal by exactly that amount', () => {
    const r = applyPayment(fresh(), 40, { save: 40 }, 'want')
    expect(r.jars.save).toBe(210)
    expect(r.saveForWants).toBe(1)
  })

  test('3. lending only ever comes out of Spend', () => {
    const r = fresh({ save: 520, emergency: 50, spend: 30 })
    expect(tejaAvailable(r)).toEqual(['gift30', 'no'])
    expect(() => chooseTeja(r, 'lend100')).toThrow()
    expect(chooseTeja(r, 'gift30').jars).toEqual({ save: 520, emergency: 50, spend: 0 })
  })

  test('4. Quick Cash: ₹50 → ₹70, ₹100 → ₹135, ₹150 → ₹200, and never for wants', () => {
    expect([quickRepay(50), quickRepay(100), quickRepay(150)]).toEqual([70, 135, 200])
    expect(paymentError(fresh(), 50, { quick: 50 })).toBe('noQuick')
    expect(paymentError(fresh(), 50, { quick: 50 }, { quick: true })).toBeNull()
  })

  test('4b. a Quick Cash step larger than the gap lands in the tumbler', () => {
    const r0 = fresh({ save: 600, emergency: 0, spend: 0 })
    const r = payBill(r0, 'auto', { quick: 50 })
    expect(r.jars.spend).toBe(30)
    expect(r.loan).toEqual({ borrowed: 50, repay: 70 })
  })

  test('5. repayment order is Spend, Emergency, Save; the rest is owed', () => {
    let r: Run = { ...fresh({ save: 300, emergency: 20, spend: 280 }), loan: { borrowed: 150, repay: 200 } }
    r = { ...r, jars: { spend: 50, emergency: 20, save: 300 } }
    const t = settle(r)
    expect(t.settled.from).toEqual({ spend: 50, emergency: 20, save: 130 })
    expect(t.saved).toBe(170)
    expect(t.owed).toBe(0)
  })

  test('6. endings at the boundaries', () => {
    const at = (save: number) => settle({ ...fresh(), jars: { spend: 0, emergency: 0, save } }).ending
    expect(at(250)).toBe('reached')
    expect(at(249)).toBe('almost')
    expect(at(150)).toBe('almost')
    expect(at(149)).toBe('notyet')
  })

  test('7. the phone cover makes the repair ₹100, only on the cracked phone', () => {
    const r = buyWindow(fresh(), 'cover', { spend: 40 }, 'get')
    expect(rainBill(r)).toBe(100)
    expect(rainBill({ ...r, surprise: { id: 2, bill: 120 } })).toBe(120)
  })

  test('11. a bill can never be skipped: it must be covered exactly', () => {
    const r = fresh()
    expect(() => payBill(r, 'auto', {})).toThrow()
    expect(() => payBill(r, 'auto', { spend: 10 })).toThrow()
    expect(payBill(r, 'auto', { spend: 20 }).jars.spend).toBe(230)
  })

  test('12. all in Save is not a free win: the first bill forces a pull from Save', () => {
    const r = fresh({ save: 600, emergency: 0, spend: 0 })
    expect(payWith(r, 20, ['spend'], false)).toBeNull()
    const after = payBill(r, 'auto', { save: 20 })
    expect(after.jars.save).toBe(580)
    expect(after.saveGoalMoves).toBe(1)
    expect(after.saveForWants).toBe(0) // a bill is not a want
  })
})

describe('the fizz (doc section 3; tests 13, 14, 18)', () => {
  test('13. arithmetic and margin: refusing every FUN item pops with room to spare', () => {
    let r = fresh()
    expect(r.fizz.fun).toBe(25)
    r = declineWindow(r, 'gamepack', 'pass')
    expect(r.fizz.fun).toBe(65)
    for (const id of ['cold', 'tiffin', 'ice']) r = trolleySkip(r, id)
    expect(r.fizz.fun).toBe(110)
    expect(r.fizz.fun - 100).toBeGreaterThanOrEqual(10)
    expect(popped(r)).toEqual(['fun'])
  })

  test('13b. any single FUN purchase keeps the bottle from popping (hackathon build)', () => {
    const allSkip = (r: Run) => ['cold', 'tiffin', 'ice'].reduce((a, id) => trolleySkip(a, id), r)
    expect(allSkip(buyWindow(fresh(), 'gamepack', { spend: 50 }, 'get')).fizz.fun).toBeLessThan(100)
    let r = declineWindow(fresh(), 'gamepack', 'pass')
    r = trolleyOk(r, 'ice', { spend: 30 })
    r = trolleySkip(trolleySkip(r, 'cold'), 'tiffin')
    expect(r.fizz.fun).toBeLessThan(100)
  })

  test('13c. buying releases 1.5 times the pull, never below 0, and there is no drift', () => {
    const r = buyWindow(fresh(), 'gamepack', { spend: 50 }, 'get')
    expect(r.fizz.fun).toBe(0)
    const r2 = payBill(r, 'data', { spend: 30 }) // a phase passing changes nothing
    expect(r2.fizz).toEqual(r.fizz)
  })

  test('14. Big Night: only when popped, names what was refused, stay carries a bigger one into Month 2', () => {
    let r = fresh()
    expect(openBigNight(r).bigNight).toBeNull()
    r = declineWindow(r, 'gamepack', 'pass')
    for (const id of ['cold', 'tiffin', 'ice']) r = trolleySkip(r, id)
    expect(r.refused.slice(0, 2)).toEqual(['ice', 'tiffin'])
    r = openBigNight(r)
    expect(r.bigNight?.cost).toBe(60)
    const stayed = chooseBigNight(r, 'stay')
    expect(stayed.fizz.fun).toBeGreaterThanOrEqual(100)
    const t = settle({ ...stayed, payday: stayed.payday })
    const m2 = nextMonth(stayed, summarize(stayed, t), 'T2')
    expect(m2.fizz.fun).toBe(100)
    expect(openBigNight(confirmPayday(m2, { save: 250, emergency: 100, spend: 250 })).bigNight?.cost).toBe(100)
    expect(chooseBigNight(r, 'go', { spend: 60 }).fizz.fun).toBe(0)
    expect(chooseBigNight(r, 'half', { spend: 30 }).fizz.fun).toBe(50)
  })

  test('18. the player only ever sees stages', () => {
    expect([0, 24, 25, 50, 75, 99, 100].map(stageOf)).toEqual([0, 0, 1, 2, 3, 3, 4])
  })
})

describe('no dominant strategy (test 15): the reference playstyles', () => {
  const res = Object.fromEntries(Object.entries(REFERENCE).map(([k, s]) => [k, playMonth(s)]))

  test('A, C and D reach the goal; B and E do not', () => {
    expect(res.A_shelfFirst.tally.ending).toBe('reached')
    expect(res.C_vault.tally.ending).toBe('reached')
    expect(res.D_cushionLight.tally.ending).toBe('reached')
    expect(res.B_spendsEarly.tally.ending).toBe('almost')
    expect(res.E_quickCash.tally.ending).toBe('notyet')
  })

  test('the numbers match the doc', () => {
    expect(res.A_shelfFirst.tally.saved).toBe(250)
    expect(res.B_spendsEarly.tally.saved).toBe(170)
    expect(res.C_vault.tally.saved).toBe(370)
    expect(res.D_cushionLight.tally.saved).toBe(290)
    expect(res.E_quickCash.tally.saved).toBe(50)
    expect(res.E_quickCash.tally.borrowCost).toBe(50)
  })

  test('the Vault wins the goal but visibly differs: popped bottle, stayed in, carried', () => {
    const c = res.C_vault
    expect(c.run.bigNight?.choice).toBe('stay')
    expect(c.tally.wants).toBe(0)
    expect(c.tally.archetype).toBe('quietholder')
    expect(summarize(c.run, c.tally).carry.fun).toBe(true)
  })

  test('D bought one fizz item early and never saw a Big Night', () => {
    expect(res.D_cushionLight.run.bigNight).toBeNull()
  })

  test('17. the archetype picker gives exactly one reading for each', () => {
    const readings = Object.values(res).map((r) => r.tally.archetype)
    expect(readings).toHaveLength(5)
    expect(res.E_quickCash.tally.archetype).toBe('fastmover')
  })
})

describe('months', () => {
  test('8. Month 2 never repeats the surprise', () => {
    const m1 = playMonth(REFERENCE.A_shelfFirst)
    for (const seed of ['a', 'b', 'c', 'd', 'e', 'f']) {
      const m2 = nextMonth(m1.run, summarize(m1.run, m1.tally), seed)
      expect(m2.surprise.id).not.toBe(m1.run.surprise.id)
      expect(m2.surprise.id).not.toBe(5) // the medical surprise needs a classroom check first
    }
  })

  test('Month 2 moves one bill by ₹10 and reshuffles deterministically', () => {
    const m2 = newRun({ seed: 'S', goal: 'trip', month: 2, lastSurprise: 1 })
    expect(billAmount(m2, 'auto')).toBe(30)
    expect(newRun({ seed: 'S', goal: 'trip', month: 2, lastSurprise: 1 }).waves).toEqual(m2.waves)
  })
})

describe('mood (display only)', () => {
  test('treats, friends and kindness lift it; refusing wants and staying in wear it down; it never touches the money', () => {
    const base = fresh()
    expect(moodOf(base)).toBe(50)
    const treat = buyWindow(base, 'gamepack', { spend: 50 }, 'get')
    expect(moodOf(treat)).toBeGreaterThan(moodOf(base))
    const refused = declineWindow(base, 'gamepack', 'pass')
    expect(moodOf(refused)).toBeLessThan(moodOf(base))
    const kind = chooseTeja(base, 'gift30')
    expect(moodOf(kind)).toBeGreaterThan(moodOf(base))
    expect(kind.jars.save).toBe(base.jars.save)
    expect(moodStage(0)).toBe(0)
    expect(moodStage(100)).toBe(4)
  })
})

describe('balance stars (the stakes)', () => {
  test('a calm bottle, a calm bottle and a good mood earn three stars; a popped bottle loses its star', () => {
    const base = fresh()
    expect(starCount(balance(base))).toBe(2) // both calm, mood 50 is not yet good
    const happy = chooseTeja(buyWindow(base, 'gamepack', { spend: 50 }, 'get'), 'gift30')
    expect(balance(happy).mood).toBe(true)
    const popped = { ...base, fizz: { fun: 100, friends: 0 } }
    expect(balance(popped).wants).toBe(false)
    expect(isPerfect(happy, true)).toBe(true)
    expect(isPerfect(happy, false)).toBe(false)
  })
})
