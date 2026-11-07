// A player who makes mistakes: wrong tactic, reload mid-case, wrong board stages, wrong decision. Nothing may get stuck,
// progress must survive the reload, and mistakes must never cost points.
//   node --experimental-strip-types --no-warnings tools/p4-e2e-mistakes.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { indexCase, locate, normalizeCase } from '../src/pillar4/engine/case.ts'

const base = process.env.URL ?? 'http://localhost:5173'
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/pillar4/content')
const def = normalizeCase(JSON.parse(fs.readFileSync(path.join(dir, 'cases/c1.json'), 'utf8')))
const idx = indexCase(def)
const TAB = { inbox: 'Inbox', recents: 'Recents', chats: 'Chats', calls: 'Calls', feed: 'Feed', saved: 'Saved', dm: 'Messages', page: 'Pages', summary: 'Account', history: 'History', request: 'Requests', payees: 'Payees', apps: 'Apps' }
const browser = await chromium.launch({ channel: process.env.BROWSER ?? 'msedge' })
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, serviceWorkers: 'block' })).newPage()
const problems = []
page.on('pageerror', (e) => problems.push('PAGEERROR ' + e.message))
page.on('console', (m) => { if (m.type() === 'error') problems.push('CONSOLE ' + m.text()) })
await page.addInitScript(() => {
  if (!localStorage.getItem('p4.v1')) localStorage.setItem('p4.v1', JSON.stringify({ state: { profile: { avatar: 'male', level: 'confident', nickname: '', installId: 't', classCode: null, introSeen: true }, completed: ['TUT'] }, version: 1 }))
  if (!localStorage.getItem('money-mohalla-v1')) localStorage.setItem('money-mohalla-v1', JSON.stringify({ state: { language: 'en', persona: 'school', gender: 'girl', storySeen: true, completedPillars: [], liteMode: true }, version: 0 }))
})
const expect = (c, m) => { if (!c) { console.log('FAIL', m); problems.push(m) } else console.log('ok  ', m) }
const btn = (name, exact = false) => page.getByRole('button', { name, exact }).first()
const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('p4.v1')).state)

async function goTo(zoneId) {
  const loc = locate(idx, zoneId)
  await btn('Home', true).click()
  await page.locator(`[data-app="${loc.app}"]`).click()
  const tab = page.getByRole('tab', { name: TAB[loc.tab] })
  if (await tab.count()) await tab.first().click()
  if (loc.thread) await page.getByRole('button', { name: loc.thread }).first().click()
  if (loc.profile) await btn(/Profile/).click()
  if (loc.expand) await page.locator(`[data-item="${loc.expand}"]`).getByRole('button', { name: /recording|call highlights/i }).first().click()
}
async function report(zoneId, reason) {
  await goTo(zoneId)
  await page.locator(`[data-zone="${zoneId}"]`).first().click()
  await page.locator(`[data-reason="${reason}"]`).click()
  const text = await page.locator('.p4-sheet').innerText()
  await btn('OK', true).click()
  return text
}

try {
  await page.goto(`${base}/play/safe`, { waitUntil: 'networkidle' })
  await page.locator('[data-case="C1"]').click()
  await btn('Open the device').click()

  // wrong tactics: no penalty, evidence does not move
  let t = await report('C1-M05.deadline', 'secret')
  expect(/Not that tactic/.test(t), 'wrong tactic gives a kind nudge')
  t = await report('C1-M05.deadline', 'fine')
  expect(/Look again/.test(t), '"Nothing suspicious" on real evidence is wrong, kindly')
  expect((await state()).progress.C1.pinned.length === 0 && (await state()).progress.C1.credited === 0, 'wrong answers pin nothing and cost nothing')

  // a correct alias zone (the caller line) counts for the same clue
  t = await report('C1-P04-R2', 'rushing')
  expect(/Correct\. That goes/.test(t), 'a different zone of the same clue is accepted')
  t = await report('C1-M05.deadline', 'rushing')
  expect(/Already logged/.test(t), 'the same clue again says already logged')

  // reload mid-case: progress restored exactly
  await page.reload({ waitUntil: 'networkidle' })
  await page.locator('[data-case="C1"]').click()
  expect((await page.getByText(/Evidence\s*1 \/ 6|1 \/ 6/).count()) > 0, 'reload mid-case restores the logged evidence')
  expect((await state()).progress.C1.pinned.includes('C1-03'), 'saved state has the pinned clue')

  // finish required evidence
  for (const c of idx.required) if (c.id !== 'C1-03') await report(c.targets[0], c.reason)
  await btn(/Rebuild the attack/).click()

  // wrong stages first: nothing is lost, definitions open after two misses
  const card = '[data-card="C1-01"]'
  await page.locator(`${card} [data-place="5"]`).click()
  await page.locator(`${card} [data-place="3"]`).click()
  expect((await page.getByText(/Reconsider|Correct stage/).count()) > 0, 'wrong stage gets the analyst nudge')
  for (const c of idx.required) await page.locator(`[data-card="${c.id}"] [data-place="${c.step}"]`).click()
  await btn('Next: decision').click()
  await page.locator('[data-fix="wrong"]').first().click()
  expect((await page.getByText(/Reconsider|could make things worse|would not stop it/).count()) > 0, 'wrong decision explains why and allows another try')
  await page.locator('[data-fix="correct"]').click()
  await btn('Review the attack').click()
  expect((await page.getByText('How it worked').count()) > 0, 'single-page debrief appears (no extra steps)')
  const s0 = await state()
  expect(s0.progress.C1.fixAttempts === 2, 'decision recorded as two attempts')
  await btn('Close the case').click()
  const s1 = await state()
  expect(s1.completed.includes('C1') && s1.progress.C1.closed, 'case closed and saved')
  // 30 required + 5 (decision on the 2nd try) + 20 close. No board bonus (wrong stages) and no no-hint bonus (two wrong tags
  // auto-triggered a hint). Nothing is ever deducted.
  expect(s1.progress.C1.credited === 30 + 5 + 20, `mistakes cost only the bonuses (credited ${s1.progress.C1.credited}, expected 55)`)

  // replaying a closed case pays 25 percent
  await page.locator('[data-case="C1"]').click()
  expect((await state()).progress.C1.replay === true, 'replay run starts at 25 percent rewards')
} catch (e) {
  problems.push('SCRIPT ' + e.message)
  console.log('SCRIPT ERROR', e.message)
}
await browser.close()
console.log(problems.length ? `\n${problems.length} problem(s):\n` + problems.join('\n') : '\nAll good.')
process.exit(problems.length ? 1 : 0)
