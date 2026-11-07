// Rigorous audit tests: content correctness for every zone, plus invariants under random play.
// Run: npm run p4:test
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { CaseDef } from '../../src/pillar4/types.ts'
import { REASONS } from '../../src/pillar4/types.ts'
import { indexCase, normalizeCase, zoneTextKey } from '../../src/pillar4/engine/case.ts'
import {
  DIAMOND, activeLead, allRequiredFound, answerFix, closeCase, cycleLead, dropCard, goToFix, goldRemaining, levelOf,
  maxDiamonds, newProgress, openBoard, reasonOptions, reportZone, requestHint, requiredFound, startCase, tryLink,
} from '../../src/pillar4/engine/progress.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const content = path.join(here, '../../src/pillar4/content')
const load = (id: string): CaseDef => normalizeCase(JSON.parse(fs.readFileSync(path.join(content, 'cases', `${id}.json`), 'utf8')))
const CASES = Object.fromEntries(['tut', 'c1', 'c2', 'c3', 'ma', 'mb', 'mc'].map((k) => [k.toUpperCase(), load(k)]))
const EN: Record<string, string> = Object.assign(
  {},
  ...fs.readdirSync(path.join(content, 'strings/en')).map((f) => JSON.parse(fs.readFileSync(path.join(content, 'strings/en', f), 'utf8'))),
)

test('every zone behaves exactly as authored (clue, distractor, herring, context, ordinary)', () => {
  for (const [id, def] of Object.entries(CASES)) {
    const idx = indexCase(def)
    for (const item of def.items) for (const z of item.zones) {
      const clue = idx.zoneClue.get(z.id)
      const base = startCase(newProgress())
      if (clue) {
        assert.equal(reportZone(def, base, z.id, clue.reason!).outcome.kind, 'correct', `${id} ${z.id} correct reason`)
        for (const d of clue.distractors!) assert.equal(reportZone(def, base, z.id, d).outcome.kind, 'wrong', `${id} ${z.id} distractor ${d}`)
        assert.equal(reportZone(def, base, z.id, 'fine').outcome.kind, 'wrong', `${id} ${z.id} "fine" on a clue`)
        const opts = reasonOptions(def, z.id)
        assert.equal(opts.length, 4)
        assert.ok(opts.includes(clue.reason!))
        assert.equal(opts[3], 'fine')
        const allowed: string[] = [clue.reason!, ...clue.distractors!]
        assert.ok(opts.slice(0, 3).every((o) => allowed.includes(o)))
      } else if (z.role === 'herring') {
        assert.equal(reportZone(def, base, z.id, 'fine').outcome.kind, 'herring_fine', `${id} ${z.id}`)
        assert.equal(reportZone(def, base, z.id, 'grab').outcome.kind, 'herring_any', `${id} ${z.id}`)
        assert.ok(EN[`${z.id}.explain`] || z.explainKey, `${id} ${z.id} has an explanation`)
      } else if (z.role === 'context') {
        assert.equal(reportZone(def, base, z.id, 'fine').outcome.kind, 'context', `${id} ${z.id}`)
        assert.ok(EN[z.explainKey ?? `${z.id}.explain`], `${id} ${z.id} has an explanation`)
      } else {
        assert.equal(reportZone(def, base, z.id, 'grab').outcome.kind, 'ordinary', `${id} ${z.id}`)
      }
    }
  }
})

test('no ordinary zone contains attack language (mislabelled evidence)', () => {
  const RX = /\b(otp|pin|password|code|deposit|fee|tax|urgent|hurry|quick(ly)?|expires?|cancel(l)?ed|do not tell|confidential|arrest|warrant|install|screen|safe account|selected|shortlisted|free|per day|guaranteed|limited|only \d+|seats|verify|verification|congratulations|reward|officer|inspector|official|blocked|switched off|deleted|unavailable|no longer)\b/i
  const bad: string[] = []
  for (const [id, def] of Object.entries(CASES)) {
    const idx = indexCase(def)
    for (const item of def.items) for (const z of item.zones) {
      if (idx.zoneClue.has(z.id) || (z.role ?? 'ordinary') !== 'ordinary') continue
      if (RX.test(EN[zoneTextKey(z)] ?? '')) bad.push(`${id} ${z.id}: ${EN[zoneTextKey(z)]}`)
    }
  }
  assert.deepEqual(bad, [])
})

test('every clue is explained and every distractor is a different reason from the answer', () => {
  for (const def of Object.values(CASES)) for (const c of def.clues) {
    assert.ok(EN[`${c.id}.explain`], `${c.id} explanation`)
    if (c.kind === 'connect') continue
    assert.equal(c.distractors!.length, 2)
    for (const d of c.distractors!) {
      assert.ok(REASONS.includes(d))
      assert.notEqual(d, c.reason)
      assert.ok(!(c.alsoAccepted ?? []).includes(d))
    }
  }
})

test('openBoard places hidden items and links automatically; only required evidence is left to place', () => {
  const def = CASES.C1
  const idx = indexCase(def)
  let p = startCase(newProgress())
  for (const c of [...idx.required, ...idx.gold]) p = reportZone(def, p, c.targets[0], c.reason!).prog
  p = tryLink(def, p, 'C1-P03', 'C1-IG06').prog
  const b = openBoard(def, p)
  assert.equal(b.phase, 'board')
  for (const c of idx.gold) assert.equal(b.placements[c.id], c.step)
  for (const c of idx.connect) assert.equal(b.placements[c.id], c.step)
  for (const c of idx.required) assert.equal(b.placements[c.id], undefined)
  let q = b
  for (const c of idx.required) q = dropCard(def, q, c.id, c.step).prog
  assert.equal(q.boardDone, true)
  assert.equal(q.credited, 30 + 30 + 10 + DIAMOND.board)
})

// ---- fuzz --------------------------------------------------------------------------------------------
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

test('fuzz: random players never break an invariant', () => {
  const STEPS = [1, 2, 3, 4, 5] as const
  const PICKS = [...REASONS, 'fine'] as const
  let runs = 0
  for (const [id, def] of Object.entries(CASES)) {
    const idx = indexCase(def)
    const zones = [...idx.zones.keys()]
    const items = def.items.map((i) => i.id)
    const max = maxDiamonds(def)
    for (let seed = 1; seed <= 150; seed++) {
      const r = rng(seed * 7919 + id.charCodeAt(0))
      const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(r() * xs.length)]
      let p = startCase(newProgress())
      let lastCredited = 0
      let lastWrong = 0
      runs++
      for (let step = 0; step < 140 && !p.closed; step++) {
        const roll = r()
        if (p.phase === 'investigating' || p.phase === 'briefing') {
          if (roll < 0.5) p = reportZone(def, p, pick(zones), pick(PICKS)).prog
          else if (roll < 0.6) p = requestHint(def, p).prog
          else if (roll < 0.65) p = cycleLead(p)
          else if (roll < 0.72) p = tryLink(def, p, pick(items), pick(items)).prog
          else {
            const c = idx.required.find((x) => !p.pinned.includes(x.id))
            if (c) p = reportZone(def, p, pick(c.targets), c.reason!).prog
          }
          if (allRequiredFound(def, p) && p.phase === 'investigating' && r() < 0.5) p = openBoard(def, p)
        } else if (p.phase === 'board') {
          p = dropCard(def, p, pick(idx.required).id, pick(STEPS)).prog
          if (p.boardDone && r() < 0.5) p = goToFix(p)
        } else if (p.phase === 'fix') {
          p = answerFix(def, p, pick(def.fix.options).key).prog
          if (p.fixDone) p = { ...p, phase: 'replay' }
        } else if (p.phase === 'replay') {
          p = closeCase(def, p)
        }
        assert.equal(new Set(p.pinned).size, p.pinned.length, `${id}/${seed} duplicate pins`)
        for (const c of p.pinned) assert.ok(idx.clues.get(c) && idx.clues.get(c)!.kind !== 'connect', `${id}/${seed} unknown pin ${c}`)
        assert.ok(p.credited >= lastCredited, `${id}/${seed} points never decrease`)
        assert.ok(p.credited <= max, `${id}/${seed} credited ${p.credited} > max ${max}`)
        assert.ok(p.wrongTotal >= lastWrong)
        for (const v of Object.values(p.hintLevel)) assert.ok(v >= 1 && v <= 4)
        for (const [cid, st] of Object.entries(p.placements)) assert.equal(idx.clues.get(cid)!.step, st, `${id}/${seed} wrong placement stored`)
        if (p.boardDone) assert.ok(idx.required.every((c) => p.placements[c.id] === c.step))
        if (p.closed) assert.ok(p.fixDone, `${id}/${seed} closed before the decision was made`)
        assert.deepEqual(JSON.parse(JSON.stringify(p)), p)
        assert.ok(requiredFound(def, p) <= idx.required.length && goldRemaining(def, p) >= 0)
        lastCredited = p.credited
        lastWrong = p.wrongTotal
      }
    }
  }
  assert.ok(runs >= 1000)
})

test('a player who guesses blindly can still finish every case (no dead ends)', () => {
  for (const [id, def] of Object.entries(CASES)) {
    const idx = indexCase(def)
    const r = rng(42 + id.length)
    let p = startCase(newProgress())
    for (const c of idx.required) {
      for (let tries = 0; tries < 60 && !p.pinned.includes(c.id); tries++) {
        p = reportZone(def, p, c.targets[0], [...REASONS, 'fine' as const][Math.floor(r() * 7)]).prog
      }
      assert.ok(p.pinned.includes(c.id), `${id} ${c.id} findable by guessing`)
    }
    p = openBoard(def, p)
    for (const c of idx.required) for (const s of [1, 2, 3, 4, 5] as const) if (p.placements[c.id] === undefined) p = dropCard(def, p, c.id, s).prog
    assert.equal(p.boardDone, true, `${id} board completes by trying every stage`)
    for (const o of def.fix.options) { if (!p.fixDone) p = answerFix(def, p, o.key).prog }
    assert.equal(p.fixDone, true, `${id} decision completes by trying every option`)
    p = closeCase(def, p)
    assert.equal(p.closed, true)
    assert.ok(p.credited > 0)
  }
})

test('hint ladder: Ask me something else visits every open lead; levels never skip or exceed 4', () => {
  const def = CASES.C2
  let p = startCase(newProgress())
  const seen = new Set<string>()
  for (let i = 0; i < 20; i++) { seen.add(activeLead(def, p)!.id); p = cycleLead(p) }
  assert.equal(seen.size, 6)
  const lead = activeLead(def, p)!
  const levels: number[] = []
  for (let i = 0; i < 6; i++) { p = requestHint(def, p).prog; levels.push(levelOf(p, lead.id)) }
  assert.deepEqual(levels, [2, 3, 4, 4, 4, 4])
})
