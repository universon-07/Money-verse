import { describe, expect, it } from 'vitest'
import { applyBurnout, applyHappyDelta } from './apply'
import { brightnessFor } from './brightness'
import { HAPPY } from './config'
import { LIFE_MOMENTS, applyLifeMoment, canAffordLifeMoment, lifeMomentById, lifeMomentGain } from './moments'
import { joyFromSignals } from './signals'
import { deepFreeze, player, result, SHARE, START } from '../test/factories'
import { applyGameResult } from '../progress/applyGameResult'
import { savedAmountFor } from '../progress/saved'

describe('brightnessFor', () => {
  it.each([
    [100, 'bright'],
    [70, 'bright'],
    [60, 'bright'],
    [59.99, 'dim'],
    [50, 'dim'],
    [35, 'dim'],
    [34.99, 'flicker'],
    [10, 'flicker'],
    [0, 'flicker'],
  ])('happy %s is %s', (happy, expected) => {
    expect(brightnessFor(happy)).toBe(expected)
  })
})

describe('applyHappyDelta', () => {
  it('adds and subtracts', () => {
    expect(applyHappyDelta(player({ happy: 50 }), 8).happy).toBe(58)
    expect(applyHappyDelta(player({ happy: 50 }), -8).happy).toBe(42)
  })
  it('clamps at the maximum', () => {
    expect(applyHappyDelta(player({ happy: 95 }), 50).happy).toBe(HAPPY.max)
  })
  it('clamps at the minimum', () => {
    expect(applyHappyDelta(player({ happy: 15 }), -50).happy).toBe(HAPPY.min)
  })
  it('ignores a non-finite delta and returns the same object', () => {
    const s = player()
    expect(applyHappyDelta(s, NaN)).toBe(s)
    expect(applyHappyDelta(s, Infinity)).toBe(s)
  })
  it('returns the same object when nothing changes', () => {
    const s = player({ happy: HAPPY.max })
    expect(applyHappyDelta(s, 5)).toBe(s)
  })
  it('does not mutate its input', () => {
    const s = deepFreeze(player())
    expect(() => applyHappyDelta(s, 5)).not.toThrow()
  })
})

describe('applyBurnout', () => {
  it('drains exactly the configured amount', () => {
    expect(applyBurnout(player({ happy: 70 })).happy).toBe(70 - HAPPY.burnoutDrain)
  })
  it('never goes below the minimum', () => {
    expect(applyBurnout(player({ happy: HAPPY.min + 2 })).happy).toBe(HAPPY.min)
    expect(applyBurnout(player({ happy: HAPPY.min })).happy).toBe(HAPPY.min)
  })
  it('is not applied by applyGameResult (the host calls it once per session)', () => {
    const after = applyGameResult(player({ happy: 70 }), result('plan'))
    expect(after.happy).toBe(70)
  })
  it('repeated sessions lower the lamp state over time', () => {
    let s = player({ happy: 70 })
    for (let i = 0; i < 4; i++) s = applyBurnout(s)
    expect(s.happy).toBe(50)
    expect(brightnessFor(s.happy)).toBe('dim')
  })
})

describe('joyFromSignals', () => {
  it('is zero for no signals', () => {
    expect(joyFromSignals(undefined)).toBe(0)
    expect(joyFromSignals({})).toBe(0)
  })
  it('friendship is neutral at 60, up above and down below', () => {
    expect(joyFromSignals({ friendship: 60 })).toBe(0)
    expect(joyFromSignals({ friendship: 100 })).toBe(4)
    expect(joyFromSignals({ friendship: 0 })).toBe(-6)
  })
  it('buying treats helps, up to a cap', () => {
    expect(joyFromSignals({ treatsBought: 2 })).toBe(4)
    expect(joyFromSignals({ treatsBought: 50 })).toBe(HAPPY.signals.treatBoughtCap)
  })
  it('skipping a few treats is free; skipping many while buying none hurts, up to a cap', () => {
    expect(joyFromSignals({ treatsSkipped: 2 })).toBe(0)
    expect(joyFromSignals({ treatsSkipped: 5 })).toBe(-4.5)
    expect(joyFromSignals({ treatsSkipped: 99 })).toBe(HAPPY.signals.treatSkipCap)
  })
  it('skipping is not punished when the player also bought something', () => {
    expect(joyFromSignals({ treatsSkipped: 20, treatsBought: 1 })).toBe(2)
  })
  it('lending to friends is a small positive with a cap', () => {
    expect(joyFromSignals({ lentToFriends: 1 })).toBe(1)
    expect(joyFromSignals({ lentToFriends: 9 })).toBe(HAPPY.signals.lentCap)
  })
  it('falling for scams hurts, up to a cap', () => {
    expect(joyFromSignals({ scammed: 1 })).toBe(-5)
    expect(joyFromSignals({ scammed: 9 })).toBe(HAPPY.signals.scammedCap)
  })
  it('balanced or restful choices help, up to a cap', () => {
    expect(joyFromSignals({ restedOrBalanced: 1 })).toBe(4)
    expect(joyFromSignals({ restedOrBalanced: 9 })).toBe(HAPPY.signals.balancedCap)
  })
  it('one result can move Happy by at most the per-result cap, either way', () => {
    expect(joyFromSignals({ scammed: 5, friendship: 0 })).toBe(-HAPPY.signals.perResultCap)
    expect(joyFromSignals({ treatsBought: 9, restedOrBalanced: 9, friendship: 100, lentToFriends: 9 })).toBe(HAPPY.signals.perResultCap)
  })
  it('ignores bad numbers', () => {
    expect(joyFromSignals({ friendship: NaN, treatsBought: -4, scammed: Infinity })).toBe(0)
    expect(joyFromSignals({ treatsBought: -4, treatsSkipped: -9 })).toBe(0)
  })
  it('clamps friendship to 0..100 before scoring', () => {
    expect(joyFromSignals({ friendship: 500 })).toBe(4)
    expect(joyFromSignals({ friendship: -500 })).toBe(-6)
  })
})

describe('life moments', () => {
  const earned = () => applyGameResult(player(), result('plan')) // saved = START + SHARE, plenty to spend

  it('has data for each moment', () => {
    expect(LIFE_MOMENTS.length).toBeGreaterThan(0)
    expect(lifeMomentById('chai')).toMatchObject({ cost: 100, joy: 8 })
    expect(lifeMomentById('nope')).toBeUndefined()
  })
  it('spends the cost, gains Happy and counts the use', () => {
    const before = player({ happy: 50 })
    const after = applyLifeMoment(before, 'chai')
    expect(after.happy).toBe(58)
    expect(after.lifeMomentSpend).toBe(100)
    expect(after.lifeMomentsUsed.chai).toBe(1)
    expect(savedAmountFor(after)).toBe(START - 100)
  })
  it('pays less each time it is repeated, fading to nothing', () => {
    let s = player({ happy: 20 })
    const gains: number[] = []
    for (let i = 0; i < 6; i++) {
      gains.push(lifeMomentGain(s, 'chai'))
      s = applyLifeMoment(s, 'chai')
    }
    expect(gains).toEqual([8, 4, 2, 1, 1, 0])
  })
  it('a repeated moment still costs the full price', () => {
    let s = player({ happy: 20 })
    s = applyLifeMoment(applyLifeMoment(s, 'chai'), 'chai')
    expect(s.lifeMomentSpend).toBe(200)
  })
  it('does nothing for an unknown id (same object back)', () => {
    const s = player()
    expect(applyLifeMoment(s, 'nope')).toBe(s)
  })
  it('does nothing when the player cannot afford it (same object back)', () => {
    const broke = player({ startAmount: 50, goalAmount: 30000 })
    expect(canAffordLifeMoment(broke, 'chai')).toBe(false)
    expect(applyLifeMoment(broke, 'chai')).toBe(broke)
  })
  it('affordability is exact at the boundary', () => {
    expect(canAffordLifeMoment(player({ startAmount: 100 }), 'chai')).toBe(true)
    expect(canAffordLifeMoment(player({ startAmount: 99 }), 'chai')).toBe(false)
  })
  it('a free moment is affordable even with nothing saved', () => {
    const nothing = player({ startAmount: 0 })
    expect(canAffordLifeMoment(nothing, 'restAtHome')).toBe(true)
    expect(applyLifeMoment(nothing, 'restAtHome').happy).toBe(70 + 5)
  })
  it('Happy never exceeds the maximum', () => {
    expect(applyLifeMoment(player({ happy: 99 }), 'festivalTreat').happy).toBe(HAPPY.max)
  })
  it('spending on yourself lowers what the goal bar shows (the trade-off)', () => {
    const s = earned()
    expect(savedAmountFor(s)).toBe(START + SHARE)
    expect(savedAmountFor(applyLifeMoment(s, 'festivalTreat'))).toBe(START + SHARE - 150)
  })
  it('does not mutate its input', () => {
    const s = deepFreeze(player({ happy: 50 }))
    expect(() => applyLifeMoment(s, 'chai')).not.toThrow()
  })
  it('lifeMomentGain is 0 for an unknown id', () => {
    expect(lifeMomentGain(player(), 'nope')).toBe(0)
  })
})
