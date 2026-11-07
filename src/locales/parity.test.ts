import { describe, expect, it } from 'vitest'
import en from './en.json'
import hi from './hi.json'
import te from './te.json'

const keys = (o: object, p = ''): string[] =>
  Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? keys(v, `${p}${k}.`) : [`${p}${k}`]))

describe('locale parity', () => {
  const base = keys(en)
  it.each([['hi', hi], ['te', te]] as const)('%s has every English key', (_l, d) => {
    const have = new Set(keys(d))
    expect(base.filter((k) => !have.has(k))).toEqual([])
  })
})
