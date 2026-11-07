import { describe, expect, test } from 'vitest'
import core from '../content/core.json'
import play from '../content/play.json'
import learn from '../content/learn.json'
import judgement from '../content/judgement.json'
import lessons from '../content/lessons.json'
import { reasonOptions, type ReasonCtx } from '../engine/reasons'
import { act, marketFor, newRun, pitchFor, type RunState } from '../engine/run'
import { COMPANY_IDS } from '../engine/companies'
import { LIGHT_KEYS } from '../engine/lights'
import type { LightKey } from '../engine/types'

type Tree = { [k: string]: unknown }
const EN: Tree = { ...core, ...play, ...learn, ...judgement, ...lessons }
const has = (path: string): boolean => {
  let cur: unknown = EN
  for (const k of path.split('.')) {
    if (cur === null || typeof cur !== 'object' || !(k in (cur as Tree))) return false
    cur = (cur as Tree)[k]
  }
  return cur !== undefined
}

const raw = import.meta.glob('../ui/*.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const sources = Object.entries(raw).map(([f, src]) => ({ f: f.split('/').pop()!, src }))
import explainSource from '../engine/explain.ts?raw'

describe('every text the screens ask for exists', () => {
  test('static t("key") calls in the UI all resolve in the English content', () => {
    const missing: string[] = []
    for (const { f, src } of sources) {
      for (const m of src.matchAll(/\bt\(\s*(['"`])([A-Za-z0-9_.]+)\1/g)) if (!has(m[2])) missing.push(`${f}: ${m[2]}`)
    }
    expect(missing).toEqual([])
  })

  test('families of keys built at run time exist for every company, check, sector and explanation', () => {
    const missing: string[] = []
    const need = (p: string) => { if (!has(p)) missing.push(p) }
    for (const id of COMPANY_IDS) { need(`companies.${id}.name`); need(`companies.${id}.slogan`); need(`companies.${id}.founder`); need(`claims.${id}`) }
    for (const k of LIGHT_KEYS) for (const part of ['name', 'ask', 'explain', 'G', 'A', 'R', 'deflect']) need(`lights.${k}.${part}`)
    for (const s of ['food', 'fintech', 'energy', 'health', 'industrial', 'mobility']) need(`sectors.${s}`)
    for (const s of ['G', 'A', 'R', 'X']) need(`lights.state.${s}`)
    for (const s of ['price', 'valuation', 'revenue', 'profit', 'runway', 'debt', 'customers', 'retention', 'net', 'people', 'ceo']) { need(`stats.${s}.name`); need(`stats.${s}.explain`) }
    for (const m of explainSource.matchAll(/add\('([\w.]+)'/g)) need(`why.${m[1]}`)
    for (const e of ['raised', 'downRound', 'failed', 'restated', 'layoffNews', 'rumourSpike']) need(`quarterResults.ev.${e}`)
    for (const b of ['slowdown', 'shaky', 'optimism', 'sectorRally']) need(`news.${b}`)
    for (const t of ['INVEST', 'SELL', 'REJECT', 'HOLD']) need(`judgement.types.${t}`)
    for (const v of ['good', 'ok', 'risky']) need(`judgement.verdict.${v}`)
    for (const k of ['reasoned', 'headline', 'feeling', 'neutral']) need(`analytics.kind.${k}`)
    expect(missing).toEqual([])
  })

  test('every reason the generator can offer has wording', () => {
    const keys = new Set<string>()
    const ctxs: ReasonCtx[] = ['invest', 'buyMore', 'pass', 'sell']
    const asks: LightKey[][] = [[], ['cash'], ['customers'], ['debt', 'ceo'], ['cash', 'customers', 'debt', 'ceo']]
    for (let i = 0; i < 60; i++) {
      const seed = `words-${i}`
      const m = marketFor(seed)
      for (let turn = 1; turn <= 8; turn++) {
        for (const id of COMPANY_IDS) {
          const base = { ...act(newRun(seed), { type: 'brief' }), turn, holdings: { [id]: { units: 20, cost: 1500 + (turn % 3) * 1500, since: 1 } } } as RunState
          for (const asked of asks) for (const ctx of ctxs) for (const o of reasonOptions(ctx, { ...base, asked: { [id]: asked } }, m, id)) keys.add(o.key)
        }
        const run = { ...act(newRun(seed), { type: 'brief' }), turn } as RunState
        const pitch = pitchFor(run, m)
        if (pitch) for (const o of reasonOptions('sell', { ...run, phase: 'emergency' }, m, pitch)) keys.add(o.key)
      }
    }
    expect(keys.size).toBeGreaterThan(25)
    const missing = [...keys].filter((k) => !has(`pick.${k}`))
    expect(missing).toEqual([])
  })
})
