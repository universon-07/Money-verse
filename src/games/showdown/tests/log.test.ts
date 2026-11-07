import { describe, expect, test } from 'vitest'
import { runPlan } from '../engine/run'
import { actionsSpent, choicesOf, marketOf, offer, planOf, shortfallOf, signBlock, type Decision } from '../engine/log'
import { nextStep } from '../engine/next'
import { judge, truthOf } from '../engine/predictions'
import { survival } from '../engine/survival'

const sign = (item: string, qty?: number): Decision => ({ k: 'sign', item, qty })
const haggle = (item: string): Decision => ({ k: 'haggle', item })

describe('the market (10 actions: haggle, pay later, read the fine print)', () => {
  test('the hall is always signed; every other item starts unsigned', () => {
    expect(marketOf([]).signed.map((c) => c.id)).toEqual(['hall'])
    expect(marketOf([]).actionsLeft).toBe(10)
  })
  test('each haggle costs one action and lowers the price along the ladder, never below its last step', () => {
    const log: Decision[] = [haggle('big'), haggle('big'), haggle('big'), haggle('big'), haggle('big')]
    const m = marketOf(log)
    expect(m.deals.big.haggles).toBe(3) // the ladder has three steps down
    expect(m.actionsLeft).toBe(7) // the 4th and 5th haggle were refused and cost nothing
    expect(offer(m, 'big').contract.haggles).toBe(3)
  })
  test('Daam Fix never haggles', () => {
    expect(marketOf([haggle('reliable')]).actionsLeft).toBe(10)
  })
  test('no more than 10 actions, ever', () => {
    const log: Decision[] = [...Array(4).fill(0).flatMap(() => ['mini', 'big', 'lightsC', 'plates', 'kids'].map(haggle))]
    expect(actionsSpent(log)).toBe(10)
    expect(marketOf(log).actionsLeft).toBe(0)
  })
  test('pay later is for Chacha items only, costs one action and adds 5%', () => {
    expect(marketOf([{ k: 'payLater', item: 'reliable' }]).actionsLeft).toBe(10)
    const m = marketOf([{ k: 'payLater', item: 'kids' }, { k: 'payLater', item: 'kids' }])
    expect(m.actionsLeft).toBe(9) // the second tap does nothing
    expect(offer(m, 'kids').total).toBeCloseTo(3300 * 1.05, 6)
  })
  test('reading the Basic fine print costs one action and does not change the total', () => {
    const m = marketOf([{ k: 'read', item: 'basic' }])
    expect(m.readBasic).toBe(true)
    expect(m.actionsLeft).toBe(9)
    expect(offer(m, 'basic').total).toBe(8500) // ₹5,500 plus the ₹3,000 required extra, read or not
  })
  test('signing keeps the negotiated price; one sound, one lights; the Combo excludes sound, lights and safety', () => {
    const m = marketOf([haggle('big'), sign('big'), sign('mini'), sign('lightsC'), sign('combo'), sign('p1'), sign('p2')])
    expect(m.signed.map((c) => [c.id, c.haggles])).toEqual([['hall', 0], ['big', 1], ['lightsC', 0], ['p1', 0]])
    expect(signBlock(m, 'mini')).toBe('sameKind')
    expect(signBlock(m, 'combo')).toBe('combo')
    expect(signBlock(marketOf([sign('combo')]), 'safety')).toBe('combo')
  })
  test('plates: 300 to 600 in steps of 10', () => {
    expect(marketOf([sign('plates', 455)]).signed.find((c) => c.id === 'plates')!.qty).toBe(460)
    expect(marketOf([sign('plates', 100)]).signed.find((c) => c.id === 'plates')!.qty).toBe(300)
    expect(marketOf([sign('plates'), { k: 'plateQty', qty: 9999 }]).signed.find((c) => c.id === 'plates')!.qty).toBe(600)
  })
  test('after "Lock plan" nothing in the market can change', () => {
    const m = marketOf([sign('mini'), { k: 'lock' }, sign('lightsC'), haggle('kids'), { k: 'drop', item: 'mini' }])
    expect(m.signed.map((c) => c.id)).toEqual(['hall', 'mini'])
    expect(m.locked).toBe(true)
  })
  test('the plan comes from the log: the same decisions twice give the same plan, and it runs', () => {
    const log: Decision[] = [{ k: 'goals', ranked: ['G3', 'G2', 'G1'] }, haggle('big'), haggle('big'), sign('big'), haggle('lightsC'), sign('lightsC'), sign('plates', 450), sign('kids'), sign('p1')]
    expect(planOf(log)).toEqual(planOf([...log]))
    expect(planOf(log).ranks).toEqual(['G3', 'G2', 'G1'])
    expect(runPlan(planOf(log), 'F2').crowd).toBe(448)
    expect(survival(planOf(log))).toBeGreaterThanOrEqual(0)
  })
  test('event and shortfall decisions are read from the log', () => {
    const log: Decision[] = [{ k: 'event', id: 'E2', choice: 'stage' }, { k: 'event', id: 'E4', choice: 'cash' }, { k: 'shortfall', point: 'W3', item: 'reliable', action: 'cancel' }]
    expect(choicesOf(log)).toEqual({ e2: 'stage', e4: 'cash' })
    expect(shortfallOf(log)).toEqual({ W3: [{ item: 'reliable', action: 'cancel' }] })
  })
})

describe('which screen comes next (a reload resumes at the exact screen)', () => {
  test('the spec order, from the log alone', () => {
    const seen = (s: string): Decision => ({ k: 'seen', screen: s })
    let log: Decision[] = []
    const steps = () => nextStep(log)
    expect(steps().screen).toBe('start')
    log = [seen('start')]; expect(steps().screen).toBe('brief')
    log = [...log, seen('brief')]; expect(steps().screen).toBe('goals')
    log = [...log, { k: 'goals', ranked: ['G1', 'G2', 'G3'] }]; expect(steps().screen).toBe('p1')
    log = [...log, { k: 'predict', id: 'P1', answer: '12' }]; expect(steps().screen).toBe('market')
    log = [...log, seen('market')]; expect(steps().screen).toBe('plancheck')
    log = [...log, { k: 'lock' }]; expect(steps()).toEqual({ screen: 'date', point: 'W1' })
    log = [...log, seen('date:W1')]; expect(steps()).toEqual({ screen: 'date', point: 'W2' })
    log = [...log, seen('date:W2')]; expect(steps()).toEqual({ screen: 'date', point: 'W2' }) // the stage choice is still to make
    log = [...log, { k: 'event', id: 'E2', choice: 'hold' }]; expect(steps()).toEqual({ screen: 'date', point: 'W3' })
    log = [...log, { k: 'event', id: 'E4', choice: 'refuse' }, seen('date:W3'), seen('date:FD')]; expect(steps().screen).toBe('festival')
    log = [...log, seen('festival')]; expect(steps().screen).toBe('futures')
    log = [...log, seen('futures')]; expect(steps().screen).toBe('report')
  })
})

describe('predictions', () => {
  const planA = { contracts: marketOf([sign('reliable'), sign('lights'), sign('plates', 450), sign('kids'), sign('p1')]).signed, ranks: ['G1', 'G2', 'G3'] as const }
  const planB = { contracts: marketOf([haggle('big'), haggle('big'), sign('big'), haggle('lightsC'), sign('lightsC'), sign('plates', 450), sign('kids'), sign('p1')]).signed }
  test('fixed answers: prices rise ~12% a year; Reliable costs less than Basic in total; the same parts cost less than the Combo', () => {
    expect(truthOf('P1', planA as never)).toBe('12')
    expect(truthOf('P2', planA as never)).toBe('reliable')
    expect(truthOf('P4', planA as never)).toBe('parts')
  })
  test('P3 ("can we still pay the Week 3 bills?") comes from the player\'s own plan: a thin plan says no, a cushioned one says yes', () => {
    expect(truthOf('P3', planA as never)).toBe('no')
    expect(truthOf('P3', { ...planB, ranks: undefined } as never)).toBe('yes')
  })
  test('"not sure" is never right and is logged as unsure', () => {
    expect(judge('P2', 'unsure', planA as never)).toMatchObject({ correct: false, unsure: true, truth: 'reliable' })
    expect(judge('P2', 'reliable', planA as never)).toMatchObject({ correct: true, unsure: false })
  })
})
