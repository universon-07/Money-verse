import { describe, expect, test } from 'vitest'
import en from '../content/en.json'
import hi from '../content/hi.json'
import te from '../content/te.json'
import { TROLLEY_ITEMS, WINDOW_ITEMS, SURPRISES } from '../engine/content'
import { ARCHETYPES_IN_ORDER } from '../ui/text'
import { BILLS, EXPERIMENTS } from '../engine/types'

type Tree = { [k: string]: string | Tree }
const flat = (o: Tree, pre = ''): Record<string, string> =>
  Object.entries(o).reduce((a, [k, v]) => (typeof v === 'string' ? { ...a, [pre + k]: v } : { ...a, ...flat(v, `${pre}${k}.`) }), {} as Record<string, string>)
const vars = (s: string) => [...s.matchAll(/{{(\w+)}}/g)].map((m) => m[1]).sort()
const EN = flat(en as Tree)

describe('cafe strings (content as data, three languages)', () => {
  test.each([['hi', hi], ['te', te]])('%s has every English key with the same {{placeholders}}', (_, file) => {
    const other = flat(file as Tree)
    expect(Object.keys(other).sort()).toEqual(Object.keys(EN).sort())
    for (const k of Object.keys(EN)) expect(vars(other[k]), k).toEqual(vars(EN[k]))
  })

  test('every content id has its strings', () => {
    for (const w of WINDOW_ITEMS) expect(EN[`items.${w.id}.name`], w.id).toBeTruthy()
    for (const t of TROLLEY_ITEMS) expect(EN[`items.${t.id}.line`], t.id).toBeTruthy()
    for (const s of SURPRISES) expect(EN[`rain.bill${s.id}`] && EN[`rain.first${s.id}`] && EN[`ledger.rain.${s.id}`], String(s.id)).toBeTruthy()
    for (const b of BILLS) expect(EN[`bill.${b}`] && EN[`ledger.bill.${b}`], b).toBeTruthy()
    for (const a of ARCHETYPES_IN_ORDER) expect(EN[`arch.${a}.name`], a).toBeTruthy()
    for (const e of EXPERIMENTS) expect(EN[`replay.${e}`], e).toBeTruthy()
  })

  test("Chacha's lines stay short: 18 words or fewer in English", () => {
    const chachaKeys = Object.keys(EN).filter((k) => /^(r0|r1|bill\.chacha|window\.dyn|rain\.(first|o|qc|letter|payLine)|tally\.(settle|sec|reached|almost|notyet)|cb|arch\..*\.line|note)/.test(k))
    for (const k of chachaKeys) expect(EN[k].split(/\s+/).length, `${k}: ${EN[k]}`).toBeLessThanOrEqual(18)
  })

  test('the fizz is never shown as a number', () => {
    for (const k of Object.keys(EN).filter((k) => k.startsWith('fizz.') || k.includes('bottle') || k.includes('Bottle'))) {
      expect(EN[k], k).not.toMatch(/\d/)
    }
  })
})
