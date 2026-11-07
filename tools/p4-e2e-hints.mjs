// Pillar 4 behaviour checks: hint ladder, wrong reason, red herring, zoom, Mystery help, lock rules.
//   node --experimental-strip-types --no-warnings tools/p4-e2e-hints.mjs   (dev server on URL, default :5173)
import path from 'node:path'
import { chromium } from 'playwright'

const base = process.env.URL ?? 'http://localhost:5173'
const shotDir = process.env.SHOT_DIR
const browser = await chromium.launch({ channel: process.env.BROWSER ?? 'msedge' })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, serviceWorkers: 'block' })
const page = await ctx.newPage()
const problems = []
page.on('pageerror', (e) => problems.push('PAGEERROR ' + e.message))
page.on('console', (m) => { if (m.type() === 'error') problems.push('CONSOLE ' + m.text()) })
await page.addInitScript(() => {
  localStorage.setItem('money-mohalla-v1', JSON.stringify({ state: { language: 'en', persona: 'school', startAmount: 1500, goalAmount: 12000, savedAmount: 1500, completedPillars: [], storySeen: true, celebrated: false, liteMode: true }, version: 0 }))
  if (!localStorage.getItem('p4.v1')) localStorage.setItem('p4.v1', JSON.stringify({ state: { profile: { avatar: 'female', level: 'confident', nickname: '', installId: 'test', classCode: null, introSeen: true }, completed: ['TUT', 'C1', 'C2', 'C3'] }, version: 1 }))
})
const btn = (name, exact = false) => page.getByRole('button', { name, exact }).first()
const expect = (cond, msg) => { if (!cond) { console.log('FAIL', msg); problems.push(msg) } else console.log('ok  ', msg) }
let n = 0
const shot = async (name) => { if (shotDir) await page.screenshot({ path: path.join(shotDir, `h${String(++n).padStart(2, '0')}-${name}.png`) }) }
const dock = () => page.locator('[aria-label="Case analyst"]').innerText()

try {
  await page.goto(`${base}/play/safe`, { waitUntil: 'networkidle' })
  // locks: Master Board is locked until the Mystery is closed
  expect(await page.locator('[data-case="MASTER"]').isDisabled(), 'Master Board locked until all four cases are closed')
  await page.locator('[data-case="C1"]').click()
  await btn('Open the device').click()
  expect((await dock()).includes('Which app holds the original offer'), 'L1: analyst asks the indirect question')

  // wrong reason on a clue
  await page.locator('[data-app="messages"]').click()
  await page.getByRole('button', { name: 'VM-DRMSCH' }).first().click()
  await page.locator('[data-zone="C1-M05.deadline"]').click()
  const opts = await page.locator('[data-reason]').count()
  expect(opts === 4, 'picker shows 3 reasons plus This looks fine')
  expect((await page.locator('[data-reason]').last().getAttribute('data-reason')) === 'fine', 'This looks fine is always last')
  await page.locator('[data-reason="pretend"]').click() // distractor, wrong
  expect((await page.locator('.p4-sheet').innerText()).includes('Not that tactic'), 'wrong reason: kind nudge, no penalty')
  await btn('OK', true).click()
  expect((await page.getByText('Evidence 0 / 6').count()) > 0, 'wrong reason pins nothing')

  // red herring
  await btn('Home', true).click()
  await page.locator('[data-app="messages"]').click()
  await page.getByRole('button', { name: 'Tulasi Aunty' }).first().click()
  await page.locator('[data-zone="C1-M04"]').click()
  await page.locator('[data-reason="fine"]').click()
  const t = await page.locator('.p4-sheet').innerText()
  expect(t.includes('Good judgement') && t.includes('Safe.'), 'red herring + This looks fine: positive text and why it is safe')
  await btn('OK', true).click()

  // hint ladder: L2 text, L3 glow, L4 pulse + navigation
  await btn('Home', true).click()
  await btn('Hint', true).click()
  expect((await dock()).includes('Check what she saved for later'), 'L2: text nudge')
  await btn('Hint', true).click()
  expect((await page.locator('[data-app="instaglam"] .os-glow').count()) > 0, 'L3: the right app icon glows')
  await shot('l3-glow')
  await btn('Hint', true).click()
  await page.waitForTimeout(400)
  expect((await page.locator('[data-zone="C1-IG04a.noexam"].is-pulse').count()) > 0, 'L4: the target pulses inside the app')
  await shot('l4-pulse')

  // zoom
  await page.getByRole('button', { name: 'Magnify text' }).click()
  expect((await page.locator('.app.is-zoom').count()) > 0, 'zoom switches to the slashed-zero monospace face')
  await shot('zoom')

} catch (e) {
  problems.push('SCRIPT ' + e.message)
  console.log('SCRIPT ERROR', e.message)
  await shot('error')
}
await browser.close()
console.log(problems.length ? `\n${problems.length} problem(s):\n` + problems.join('\n') : '\nAll good.')
process.exit(problems.length ? 1 : 0)
