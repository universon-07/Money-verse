// Engine tests. Run: npm run p4:test   (Node's built-in runner, no extra dependencies)
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { CaseDef, CaseProgress, Reason } from '../../src/pillar4/types.ts'
import { indexCase, locate, normalizeCase } from '../../src/pillar4/engine/case.ts'
import {
  DIAMOND, activeLead, allRequiredFound, answerFix, closeCase, cycleLead, dropCard, goToFix, idleHint, levelOf,
  maxDiamonds, newProgress, openLeads, reasonOptions, reportZone, requestHint, round5, startCase, titleFor,
  transferScore, tryLink,
} from '../../src/pillar4/engine/progress.ts'

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../src/pillar4/content/cases')
const load = (id: string): CaseDef => normalizeCase(JSON.parse(fs.readFileSync(path.join(dir, `${id}.json`), 'utf8')))
const CASES = Object.fromEntries(['tut', 'c1', 'c2', 'c3', 'ma', 'mb', 'mc'].map((k) => [k.toUpperCase(), load(k)]))

/** play a case perfectly, as a student who never needs help */
function perfect(def: CaseDef, replay = false): CaseProgress {
  const idx = indexCase(def)
  let p = startCase(newProgress(replay))
  for (const c of [...idx.required, ...idx.gold]) {
    p = reportZone(def, p, c.targets[0], c.reason!).prog
  }
  for (const c of idx.connect) {
    const holders = def.items.filter((i) => i.zones.some((z) => z.linkKey === c.linkKey))
    p = tryLink(def, p, holders[0].id, holders[1].id).prog
  }
  for (const c of def.clues) p = dropCard(def, p, c.id, c.step).prog
  p = goToFix(p)
  p = answerFix(def, p, def.fix.options.find((o) => o.correct)!.key).prog
  return closeCase(def, p)
}

const firstTarget = (def: CaseDef, clueId: string) => def.clues.find((c) => c.id === clueId)!.targets[0]
const wrongReason = (def: CaseDef, clueId: string): Reason => {
  const c = def.clues.find((x) => x.id === clueId)!
  return c.distractors![0]
}

test('perfect runs match the diamond table (spec 6.2)', () => {
  const expected: Record<string, number> = { TUT: 25, C1: 125, C2: 115, C3: 115, MA: 100, MB: 100, MC: 100 }
  for (const [id, def] of Object.entries(CASES)) {
    const p = perfect(def)
    assert.equal(maxDiamonds(def), expected[id], `${id} maxDiamonds`)
    assert.equal(p.credited, expected[id], `${id} credited`)
    assert.equal(p.closed, true)
    assert.equal(p.boardDone, true)
  }
})

test('first full playthrough maximum is 530', () => {
  const total = ['TUT', 'C1', 'C2', 'C3', 'MA'].reduce((n, id) => n + perfect(CASES[id]).credited, 0) + DIAMOND.master
  assert.equal(total, 530)
})

test('required clue with correct reason pins and awards 5', () => {
  const def = CASES.C1
  const r = reportZone(def, startCase(newProgress()), firstTarget(def, 'C1-03'), 'rushing')
  assert.equal(r.outcome.kind, 'correct')
  assert.deepEqual(r.prog.pinned, ['C1-03'])
  assert.equal(r.prog.credited, 5)
})

test('gold clue awards 10 and an also-accepted reason is accepted', () => {
  const def = CASES.C1
  const r = reportZone(def, newProgress(), 'C1-CH05c', 'rushing')
  assert.equal(r.outcome.kind, 'correct')
  assert.equal(r.prog.credited, 10)
})

test('wrong reason and "This looks fine" on a clue pin nothing and never cost diamonds', () => {
  const def = CASES.C1
  let p = startCase(newProgress())
  const z = firstTarget(def, 'C1-03')
  const a = reportZone(def, p, z, wrongReason(def, 'C1-03'))
  assert.equal(a.outcome.kind, 'wrong')
  assert.equal(a.prog.pinned.length, 0)
  assert.equal(a.prog.credited, 0)
  p = a.prog
  const b = reportZone(def, p, z, 'fine')
  assert.equal(b.outcome.kind, 'wrong')
  assert.equal(b.prog.wrongTotal, 2)
})

test('already pinned clue reports duplicate', () => {
  const def = CASES.C1
  const z = firstTarget(def, 'C1-03')
  const p = reportZone(def, newProgress(), z, 'rushing').prog
  assert.equal(reportZone(def, p, z, 'rushing').outcome.kind, 'duplicate')
})

test('herring, context and ordinary outcomes (spec 5.4)', () => {
  const def = CASES.C1
  const p = newProgress()
  assert.equal(reportZone(def, p, 'C1-M04', 'fine').outcome.kind, 'herring_fine')
  assert.equal(reportZone(def, p, 'C1-M04', 'grab').outcome.kind, 'herring_any')
  assert.equal(reportZone(def, p, 'C1-M04', 'grab').prog.pinned.length, 0)
  assert.equal(reportZone(def, p, 'C1-M06', 'grab').outcome.kind, 'context')
  assert.equal(reportZone(def, p, 'C1-M01', 'fine').outcome.kind, 'ordinary')
  assert.equal(reportZone(def, p, 'C1-M04', 'fine').prog.credited, 0)
})

test('reason picker: three reasons plus "This looks fine" last, correct reason included for clues', () => {
  const def = CASES.C1
  for (let i = 0; i < 40; i++) {
    const clueOpts = reasonOptions(def, firstTarget(def, 'C1-02'))
    assert.equal(clueOpts.length, 4)
    assert.equal(clueOpts[3], 'fine')
    assert.ok(clueOpts.includes('pretend'))
    const herringOpts = reasonOptions(def, 'C1-M04')
    assert.equal(herringOpts.length, 4)
    assert.equal(new Set(herringOpts).size, 4)
    assert.equal(herringOpts[3], 'fine')
  }
})

test('hints: two wrong reports on the lead raise it to L2, two more to L3', () => {
  const def = CASES.C1
  let p = startCase(newProgress())
  const lead = activeLead(def, p)!
  assert.equal(levelOf(p, lead.id), 1)
  const z = firstTarget(def, lead.clueId)
  const bad = wrongReason(def, lead.clueId)
  p = reportZone(def, p, z, bad).prog
  assert.equal(levelOf(p, lead.id), 1)
  p = reportZone(def, p, z, bad).prog
  assert.equal(levelOf(p, lead.id), 2)
  assert.equal(p.hintUsed, true)
  p = reportZone(def, p, z, bad).prog
  p = reportZone(def, p, z, bad).prog
  assert.equal(levelOf(p, lead.id), 3)
})

test('three wrong reports in a row anywhere trigger L2', () => {
  const def = CASES.C1
  let p = startCase(newProgress())
  const lead = activeLead(def, p)!
  // wrong on three different clues so no single lead hits its own 2-wrong rule... the streak rule still fires
  const ids = ['C1-03', 'C1-04', 'C1-05']
  for (const id of ids) p = reportZone(def, p, firstTarget(def, id), wrongReason(def, id)).prog
  assert.ok(levelOf(p, lead.id) >= 2)
})

test('Tutorial gives an L2 hint on the first wrong report', () => {
  const def = CASES.TUT
  let p = startCase(newProgress())
  const lead = activeLead(def, p)!
  p = reportZone(def, p, firstTarget(def, lead.clueId), wrongReason(def, lead.clueId)).prog
  assert.equal(levelOf(p, lead.id), 2)
})

test('Need help climbs L2, L3, L4 and stops; hints never block anything', () => {
  const def = CASES.C1
  let p = startCase(newProgress())
  const lead = activeLead(def, p)!
  const levels: number[] = []
  for (let i = 0; i < 5; i++) {
    const r = requestHint(def, p)
    p = r.prog
    levels.push(levelOf(p, lead.id))
  }
  assert.deepEqual(levels, [2, 3, 4, 4, 4])
  const finished = reportZone(def, p, firstTarget(def, lead.clueId), indexCase(def).clues.get(lead.clueId)!.reason!)
  assert.equal(finished.outcome.kind, 'correct')
})

test('idle hint lifts L1 to L2 once', () => {
  const def = CASES.C1
  let p = startCase(newProgress())
  p = idleHint(def, p).prog
  const lead = activeLead(def, p)!
  assert.equal(levelOf(p, lead.id), 2)
  p = idleHint(def, p).prog
  assert.equal(levelOf(p, lead.id), 2)
})

test('finding a later lead first marks it found; Ask me something else cycles', () => {
  const def = CASES.C1
  let p = startCase(newProgress())
  assert.equal(activeLead(def, p)!.id, 'C1-L1')
  p = reportZone(def, p, firstTarget(def, 'C1-05'), 'grab').prog
  assert.equal(openLeads(def, p).some((l) => l.id === 'C1-L5'), false)
  p = cycleLead(p)
  assert.equal(activeLead(def, p)!.id, 'C1-L2')
})

test('using L2+ removes only the no-hint bonus', () => {
  const def = CASES.C1
  const clean = perfect(def)
  const idx = indexCase(def)
  let p = startCase(newProgress())
  p = requestHint(def, p).prog
  for (const c of [...idx.required, ...idx.gold]) p = reportZone(def, p, c.targets[0], c.reason!).prog
  for (const c of idx.connect) {
    const h = def.items.filter((i) => i.zones.some((z) => z.linkKey === c.linkKey))
    p = tryLink(def, p, h[0].id, h[1].id).prog
  }
  for (const c of def.clues) p = dropCard(def, p, c.id, c.step).prog
  p = answerFix(def, goToFix(p), def.fix.options.find((o) => o.correct)!.key).prog
  p = closeCase(def, p)
  assert.equal(clean.credited - p.credited, DIAMOND.noHint)
})

test('Board: wrong drop bounces, defs after 2, pulse after 4, bonus lost only for a required card', () => {
  const def = CASES.C1
  const idx = indexCase(def)
  let p = startCase(newProgress())
  for (const c of [...idx.required, ...idx.gold]) p = reportZone(def, p, c.targets[0], c.reason!).prog
  const card = 'C1-01' // correct step is 1
  const r1 = dropCard(def, p, card, 3)
  assert.equal(r1.correct, false)
  assert.equal(r1.showDefs, false)
  const r2 = dropCard(def, r1.prog, card, 3)
  assert.equal(r2.showDefs, true)
  assert.equal(r2.pulse, false)
  const r3 = dropCard(def, r2.prog, card, 5)
  const r4 = dropCard(def, r3.prog, card, 5)
  assert.equal(r4.pulse, true)
  assert.equal(r4.prog.placements[card], undefined)
  p = r4.prog
  for (const c of idx.required) p = dropCard(def, p, c.id, c.step).prog
  assert.equal(p.boardDone, true)
  assert.equal(p.credited, 30 + 30) // required + gold paid; board bonus withheld
})

test('Board: wrong gold drop keeps the board bonus', () => {
  const def = CASES.C1
  const idx = indexCase(def)
  let p = startCase(newProgress())
  for (const c of [...idx.required, ...idx.gold]) p = reportZone(def, p, c.targets[0], c.reason!).prog
  p = dropCard(def, p, 'C1-G1', 5).prog
  for (const c of idx.required) p = dropCard(def, p, c.id, c.step).prog
  assert.equal(p.credited, 30 + 30 + DIAMOND.board)
})

test('Board completes without gold or Connect cards', () => {
  const def = CASES.C1
  const idx = indexCase(def)
  let p = startCase(newProgress())
  for (const c of idx.required) p = reportZone(def, p, c.targets[0], c.reason!).prog
  for (const c of idx.required) p = dropCard(def, p, c.id, c.step).prog
  assert.equal(p.boardDone, true)
  assert.equal(allRequiredFound(def, p), true)
})

test('Fix: retries allowed, 10 first try, 5 later, wrong answers explain why', () => {
  const def = CASES.C1
  const wrong = def.fix.options.find((o) => !o.correct)!
  const right = def.fix.options.find((o) => o.correct)!
  const a = answerFix(def, newProgress(), wrong.key)
  assert.equal(a.correct, false)
  assert.equal(a.whyKey, wrong.whyKey)
  const b = answerFix(def, a.prog, right.key)
  assert.equal(b.correct, true)
  assert.equal(b.prog.credited, DIAMOND.fixLater)
  assert.equal(answerFix(def, newProgress(), right.key).prog.credited, DIAMOND.fixFirst)
})

test('replay of a closed case pays 25 percent rounded to the nearest 5', () => {
  const def = CASES.C1
  const p = perfect(def, true)
  assert.equal(p.earned, 125)
  assert.equal(p.credited, round5(125 * 0.25))
  assert.equal(p.credited, 30)
})

test('Connect: shared key links once for 10 diamonds, wrong pair fails kindly', () => {
  const def = CASES.C1
  const p = startCase(newProgress())
  const ok = tryLink(def, p, 'C1-P03', 'C1-IG06')
  assert.equal(ok.result, 'ok')
  assert.equal(ok.prog.credited, 10)
  assert.equal(tryLink(def, ok.prog, 'C1-P04', 'C1-CH05p').result, 'already')
  assert.equal(tryLink(def, ok.prog, 'C1-P04', 'C1-P05').result, 'fail')
  assert.equal(tryLink(def, p, 'C1-P03', 'C1-P03').result, 'fail')
})

test('Mystery: one generic help, removes no-help bonus, transfer score counts clues before help', () => {
  const def = CASES.MA
  const idx = indexCase(def)
  let p = startCase(newProgress())
  for (const c of idx.required.slice(0, 2)) p = reportZone(def, p, c.targets[0], c.reason!).prog
  const h = requestHint(def, p)
  assert.equal(h.generic, true)
  p = h.prog
  for (const c of idx.required.slice(2)) p = reportZone(def, p, c.targets[0], c.reason!).prog
  assert.equal(transferScore(def, p), 2)
  assert.equal(def.leads.length, 0)
  assert.equal(perfect(def).credited - 10, 90)
})

test('Mystery solved with no help scores 5', () => {
  assert.equal(transferScore(CASES.MB, perfect(CASES.MB)), 5)
})

test('locate finds app, tab, thread and expanded parent for any zone', () => {
  const idx = indexCase(CASES.C1)
  assert.deepEqual(locate(idx, 'C1-IG04a.noexam'), { app: 'instaglam', tab: 'saved' })
  assert.deepEqual(locate(idx, 'C1-M05.deadline'), { app: 'messages', tab: 'inbox', thread: 'VM-DRMSCH' })
  assert.deepEqual(locate(idx, 'C1-P04-R3'), { app: 'phone', tab: 'recents', expand: 'C1-P04' })
  const c3 = locate(indexCase(CASES.C3), 'C3-V1')
  assert.deepEqual(c3, { app: 'chatup', tab: 'calls', expand: 'C3-CH01' })
})

test('save and restore: progress survives a JSON round trip', () => {
  const def = CASES.C2
  const idx = indexCase(def)
  let p = startCase(newProgress())
  for (const c of idx.required.slice(0, 3)) p = reportZone(def, p, c.targets[0], c.reason!).prog
  p = requestHint(def, p).prog
  const restored = JSON.parse(JSON.stringify(p)) as CaseProgress
  assert.deepEqual(restored, p)
  assert.equal(activeLead(def, restored)?.id, activeLead(def, p)?.id)
})

test('titles follow progress (spec 6.3)', () => {
  assert.equal(titleFor([], false), 'trainee')
  assert.equal(titleFor(['TUT', 'C1'], false), 'junior')
  assert.equal(titleFor(['TUT', 'C1', 'C2'], false), 'detective')
  assert.equal(titleFor(['TUT', 'C1', 'C2', 'C3'], false), 'senior')
  assert.equal(titleFor(['TUT', 'C1', 'C2', 'C3', 'MA'], true), 'chief')
})
