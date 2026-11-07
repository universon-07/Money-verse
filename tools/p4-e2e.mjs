// Pillar 4 end-to-end: plays Tutorial, Cases 1-3, a Mystery variant and the Master Board through the real UI,
// perfectly, then checks the 530-diamond total and that the hub's fourth lamp lit.
//   npm run dev (port 5173)  then:  node --experimental-strip-types --no-warnings tools/p4-e2e.mjs
//   env: URL (default http://localhost:5173), SHOT_DIR (save screenshots), LANGUAGE (en|te), BROWSER (msedge|chrome|chromium)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { indexCase, locate, normalizeCase } from '../src/pillar4/engine/case.ts'

const base = process.env.URL ?? 'http://localhost:5173'
const shotDir = process.env.SHOT_DIR
const lang = process.env.LANGUAGE ?? 'en'
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/pillar4/content')
const load = (id) => normalizeCase(JSON.parse(fs.readFileSync(path.join(dir, 'cases', `${id}.json`), 'utf8')))
const en = Object.assign({}, ...fs.readdirSync(path.join(dir, 'strings/en')).map((f) => JSON.parse(fs.readFileSync(path.join(dir, 'strings/en', f), 'utf8'))))

const TAB = { inbox: 'Inbox', recents: 'Recents', chats: 'Chats', calls: 'Calls', feed: 'Feed', saved: 'Saved', dm: 'Messages', page: 'Pages', summary: 'Account', history: 'History', request: 'Requests', payees: 'Payees', apps: 'Apps' }
const REASON = { too_good: 'Unrealistic reward', rushing: 'Rushing you', pretend: 'Pretending to be someone trustworthy', secret: 'Hiding or secrecy', grab: 'Asking for private info or money', threat: 'Scary threats' }

const browser = await chromium.launch({ channel: process.env.BROWSER ?? 'msedge' })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, serviceWorkers: 'block' })
const page = await ctx.newPage()
const problems = []
page.on('pageerror', (e) => problems.push('PAGEERROR ' + e.message))
page.on('console', (m) => { if (m.type() === 'error') problems.push('CONSOLE ' + m.text()) })
await page.addInitScript((l) => {
  localStorage.setItem('money-mohalla-v1', JSON.stringify({ state: { language: l, persona: 'school', startAmount: 1500, goalAmount: 12000, savedAmount: 1500, completedPillars: [], storySeen: true, celebrated: false, liteMode: true }, version: 0 }))
}, lang)

let n = 0
const shot = async (name) => { if (shotDir) await page.screenshot({ path: path.join(shotDir, `${String(++n).padStart(2, '0')}-${name}.png`) }) }
const click = (sel, opts) => page.locator(sel).first().click({ timeout: 8000, ...opts })
const btn = (name, exact = false) => page.getByRole('button', { name, exact }).first()
const expect = (cond, msg) => { if (!cond) { console.log('FAIL', msg); problems.push(msg) } else console.log('ok  ', msg) }

async function goTo(def, zoneId) {
  const loc = locate(indexCase(def), zoneId)
  await btn('Home', true).click()
  await click(`[data-app="${loc.app}"]`)
  const tabBtn = page.getByRole('tab', { name: TAB[loc.tab] })
  if (await tabBtn.count()) await tabBtn.first().click()
  if (loc.thread) await page.getByRole('button', { name: loc.thread, exact: false }).first().click()
  if (loc.profile) await btn(/Profile/).click()
  if (loc.expand) {
    const row = page.locator(`[data-item="${loc.expand}"]`)
    const b = row.getByRole('button', { name: /recording|call highlights/i }).first()
    if (!(await row.locator('[data-zone]').nth(1).isVisible().catch(() => false)) || true) await b.click()
  }
}

async function report(def, zoneId, reason) {
  await goTo(def, zoneId)
  await page.locator(`[data-zone="${zoneId}"]`).first().click()
  await page.locator(`[data-reason="${reason}"]`).click()
  await btn('OK', true).click()
}

async function link(def, clue) {
  const holders = def.items.filter((i) => i.zones.some((z) => z.linkKey === clue.linkKey))
  await btn(/Case file/).click()
  await btn(/Link two pieces of evidence/).click()
  for (const h of holders.slice(0, 2)) {
    await goTo(def, h.zones.find((z) => z.part !== 'head').id)
    await page.locator(`[data-item="${h.id}"]`).first().click({ position: { x: 4, y: 4 } })
  }
}

async function playCase(id, { open }) {
  const def = load(id)
  const idx = indexCase(def)
  console.log(`--- ${id}`)
  await open()
  await btn('Open the device').click()
  await shot(`${id}-phone-home`)
  if (def.kind === 'tutorial') { await btn('Understood').click(); }
  let first = true
  for (const c of [...idx.required, ...idx.gold]) {
    await report(def, c.targets[0], c.reason)
    if (first) { await shot(`${id}-first-pin`); first = false }
    if (def.kind === 'tutorial') { const g = page.getByRole('button', { name: 'Understood' }); if (await g.count()) await g.first().click() }
  }
  await shot(`${id}-all-found`)
  for (const c of idx.connect) await link(def, c)
  await btn(/Rebuild the attack/).click()
  for (const c of idx.required) await page.locator(`[data-card="${c.id}"] [data-place="${c.step}"]`).click()
  await shot(`${id}-board`)
  await btn('Next: decision').click()
  await page.locator('[data-fix="correct"]').click()
  await shot(`${id}-fix`)
  await btn('Review the attack').click()
  await shot(`${id}-replay-end`)
  await btn('Close the case').click()
}

try {
  await page.goto(`${base}/play/safe`, { waitUntil: 'networkidle' })
  await shot('intro')
  await btn('Open the case desk').click()
  const openMap = (key) => async () => { await page.locator(`[data-case="${key}"]`).click() }
  await playCase('TUT', { open: openMap('TUT') })
  await shot('map-after-tutorial')
  await playCase('C1', { open: openMap('C1') })
  await playCase('C2', { open: openMap('C2') })
  await playCase('C3', { open: openMap('C3') })
  const played = await page.evaluate(() => 'x')
  void played
  // Mystery: whichever variant was assigned
  await page.locator('[data-case="MYSTERY"]').click()
  const variantTitle = await page.locator('.font-sign').first().innerText().catch(() => '')
  void variantTitle
  const variant = await page.evaluate(() => JSON.parse(localStorage.getItem('p4.v1')).state.mysteryCurrent)
  console.log('--- mystery variant', variant)
  const mdef = load(variant)
  const midx = indexCase(mdef)
  await btn('Open the device').click()
  for (const c of [...midx.required, ...midx.gold]) await report(mdef, c.targets[0], c.reason)
  await btn(/Rebuild the attack/).click()
  for (const c of midx.required) await page.locator(`[data-card="${c.id}"] [data-place="${c.step}"]`).click()
  await btn('Next: decision').click()
  await page.locator('[data-fix="correct"]').click()
  await btn('Review the attack').click()
  await btn('Close the case').click()
  await shot('map-before-master')
  // Master Board
  await page.locator('[data-case="MASTER"]').click()
  for (const name of ['Bait', 'Pretext', 'Pressure', 'Extraction', 'Exit']) {
    await page.getByRole('button', { name, exact: true }).first().click()
    await page.locator('[data-correct="true"]').click()
  }
  await shot('master-reveal')
  await btn('Complete the module').click()
  await shot('playbook')

  const state = await page.evaluate(() => ({ p4: JSON.parse(localStorage.getItem('p4.v1')).state, hub: JSON.parse(localStorage.getItem('money-mohalla-v1')).state }))
  const total = Object.values(state.p4.progress).reduce((a, p) => a + p.credited, 0) + state.p4.master.credited
  expect(total === 530, `perfect playthrough earns 530 diamonds (got ${total})`)
  expect(state.hub.completedPillars.includes('safe'), 'hub lamp for pillar 4 lit (completePillar called)')
  expect(state.p4.master.done, 'master board done')
  void en
} catch (e) {
  problems.push('SCRIPT ' + e.message)
  console.log('SCRIPT ERROR', e.message)
  await shot('error')
}
await browser.close()
console.log(problems.length ? `\n${problems.length} problem(s):\n` + problems.join('\n') : '\nAll good.')
process.exit(problems.length ? 1 : 0)
