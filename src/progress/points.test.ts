import { describe, expect, it } from 'vitest'
import { HAPPY_FACE, starsFor } from './points'

describe('points: one language for every game', () => {
  it('stars come from quality, and need a clear', () => {
    expect(starsFor(1, true)).toBe(3)
    expect(starsFor(0.85, true)).toBe(3)
    expect(starsFor(0.7, true)).toBe(2)
    expect(starsFor(0.2, true)).toBe(1)
    expect(starsFor(0.99, false)).toBe(0)
    expect(starsFor(NaN, true)).toBe(1)
  })
  it('every Happy band has a face', () => {
    expect(Object.keys(HAPPY_FACE).sort()).toEqual(['glowing', 'ok', 'tired'])
  })
})
