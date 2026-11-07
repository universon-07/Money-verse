import { describe, expect, test } from 'vitest'
import en from '../content/core.json'
import enJudgement from '../content/judgement.json'
import teJudgement from '../content/te/judgement.json'
import enPlay from '../content/play.json'
import enLearn from '../content/learn.json'
import enLessons from '../content/lessons.json'
import teCore from '../content/te/core.json'
import tePlay from '../content/te/play.json'
import teLearn from '../content/te/learn.json'
import teLessons from '../content/te/lessons.json'
import hiCore from '../content/hi/core.json'
import hiPlay from '../content/hi/play.json'
import hiLearn from '../content/hi/learn.json'
import hiJudgement from '../content/hi/judgement.json'
import hiLessons from '../content/hi/lessons.json'

type Json = string | number | boolean | null | Json[] | { [k: string]: Json }

/** key path -> string, arrays flattened by index */
function flatten(v: Json, path = '', out: Record<string, string> = {}): Record<string, string> {
  if (typeof v === 'string') out[path] = v
  else if (Array.isArray(v)) v.forEach((x, i) => flatten(x, `${path}[${i}]`, out))
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) flatten(x, path ? `${path}.${k}` : k, out)
  return out
}

const EN = flatten({ ...en, ...enPlay, ...enLearn, ...enJudgement, ...enLessons } as Json)
const TE = flatten({ ...teCore, ...tePlay, ...teLearn, ...teJudgement, ...teLessons } as Json)
const HI = flatten({ ...hiCore, ...hiPlay, ...hiLearn, ...hiJudgement, ...hiLessons } as Json)
const holes = (s: string) => [...s.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)].map((m) => m[1]).sort()

// strings that exist only in English (retired screens, unused keys) are allowed to be missing
const OPTIONAL = [/^auction\.bidSoon$/, /^done\.soon$/, /^tiles\.bank\.body$/, /^bank\.revealed$/]

describe.each([['Telugu', TE, /[ఀ-౿]/], ['Hindi', HI, /[ऀ-ॿ]/]] as const)('%s content', (_name, TE, script) => {
  test('every English string has a translated string', () => {
    const missing = Object.keys(EN).filter((k) => !(k in TE) && !OPTIONAL.some((r) => r.test(k)))
    expect(missing).toEqual([])
  })

  test('this language has no stray keys that English lacks', () => {
    const extra = Object.keys(TE).filter((k) => !(k in EN))
    expect(extra).toEqual([])
  })

  test('placeholders match exactly, so numbers and names fill in correctly', () => {
    const bad = Object.keys(TE).filter((k) => k in EN && holes(EN[k]).join() !== holes(TE[k]).join())
    expect(bad).toEqual([])
  })

  test('translated strings are not left in English', () => {
    const latin = /[A-Za-z]{4,}/
    const allowed = /(?:Daily Basket|PayEasy|SolarGrid|MedLink|Clinics|SteelWorks|QuickRide|CEO|UPI|PIN|OTP|IMPS)/g
    const english = Object.entries(TE).filter(([k, v]) => !k.startsWith('companies.') && latin.test(v.replace(allowed, '').replace(/\{\{[^}]*\}\}/g, '')))
    expect(english.map(([k]) => k)).toEqual([])
  })

  test('translated text contains translated script', () => {
    const noScript = Object.entries(TE).filter(([k, v]) => !script.test(v) && v.replace(/\{\{[^}]*\}\}|[\d₹%.,: ()/\-+]/g, '').length > 3 && !k.startsWith('companies.'))
    expect(noScript.map(([k]) => k)).toEqual([])
  })

  test('no real brands in any language', () => {
    const real = /(Zerodha|Groww|Paytm|PhonePe|Google ?Pay|Sensex|Nifty|Tata|Reliance|Infosys|HDFC|SBI|ICICI)/i
    expect(Object.values({ ...EN, ...TE, ...HI }).filter((v) => real.test(v))).toEqual([])
  })
})

describe('money placeholders', () => {
  test('r_ placeholders already include the rupee sign, so no text puts one in front', () => {
    const doubled = Object.entries({ ...EN, ...TE, ...HI }).filter(([, v]) => /₹\{\{\s*r_/.test(v))
    expect(doubled.map(([k]) => k)).toEqual([])
  })
})
