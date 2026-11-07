import { describe, expect, test } from 'vitest'
import en from '../content/en.json'
import hi from '../content/hi.json'
import te from '../content/te.json'

const flat = (o: Record<string, unknown>, p = ''): Record<string, string> =>
  Object.entries(o).reduce((a, [k, v]) => ({ ...a, ...(typeof v === 'object' && v ? flat(v as Record<string, unknown>, `${p}${k}.`) : { [`${p}${k}`]: String(v) }) }), {})
const slots = (s: string) => (s.match(/\{\{\w+\}\}/g) ?? []).sort().join(',')

describe.each([['Hindi', hi], ['Telugu', te]] as const)('%s strings', (_name, file) => {
  const fe = flat(en)
  const f = flat(file)
  test('every English key is translated, and nothing extra', () => {
    expect(Object.keys(f).sort()).toEqual(Object.keys(fe).sort())
  })
  test('every {{placeholder}} is kept', () => {
    for (const k of Object.keys(fe)) expect(slots(f[k]), k).toBe(slots(fe[k]))
  })
  test('no string is left in English or empty (except the ones empty in English)', () => {
    for (const k of Object.keys(fe)) if (fe[k] !== '') expect(f[k].trim(), k).not.toBe('')
  })
})
