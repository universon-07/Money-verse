import { describe, expect, test } from 'vitest'
import { newRun, act } from '../engine/run'
import { usableRun } from '../state/store'

describe('saved game compatibility', () => {
  test('a run saved by the step-2 build is rejected instead of crashing the page', () => {
    const old = { seed: 'old', turn: 2, phase: 'manage', cash: 90000, holdings: {}, feesPaid: 0, cashDragLost: 0, lastDrag: 0, pitched: [], log: [] }
    expect(usableRun(old)).toBe(false)
  })

  test('junk is rejected', () => {
    for (const bad of [null, undefined, 5, 'x', {}, { seed: 'x', turn: 1 }]) expect(usableRun(bad)).toBe(false)
  })

  test('current runs are accepted, including after a JSON round trip and some play', () => {
    const run = act(newRun('keep'), { type: 'brief' })
    expect(usableRun(run)).toBe(true)
    expect(usableRun(JSON.parse(JSON.stringify(run)))).toBe(true)
  })
})
