import { describe, expect, it } from 'vitest'
import { cleanRoll, rollInput } from './roll'
import { draw, rngFor } from './rng'
import { stepped } from './stepped'

describe('restored shared helpers', () => {
  it('validates rolls without accepting names or truncating saved identifiers', () => {
    expect(cleanRoll('23')).toBe('0023')
    expect(cleanRoll('12345')).toBeNull()
    expect(cleanRoll('0')).toBeNull()
    expect(cleanRoll('Ravi')).toBeNull()
    expect(rollInput('2a3b45')).toBe('2345')
  })
  it('keeps seeded events independent of other draws', () => {
    const before = draw('run-1', 'surprise')
    draw('run-1', 'other-event')
    expect(draw('run-1', 'surprise')).toBe(before)
    const a = rngFor('run-1'), b = rngFor('run-1')
    expect(Array.from({ length: 20 }, a)).toEqual(Array.from({ length: 20 }, b))
  })
  it('finishes stepped counters at their exact target', () => {
    expect(stepped(12)(0)).toBe(0)
    expect(stepped(12)(1)).toBe(1)
    expect(stepped(0)(1)).toBe(1)
  })
})
