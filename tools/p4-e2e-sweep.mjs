// Sweep: opens every case in a real browser, navigates to EVERY zone through the phone UI (so every item is
// reachable), taps it, picks an answer, and checks the feedback matches how the zone was authored.
//   node --experimental-strip-types --no-warnings tools/p4-e2e-sweep.mjs     (dev server on URL, default :5173)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { indexCase, locate, normalizeCase } from '../src/pillar4/engine/case.ts'

const base = process.env.URL ?? 'http://localhost:5173'
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/pillar4/content')
const load = (id) => normalizeCase(JSON.parse(fs.readFileSync(path.join(dir, 'cases', `${id}.json`), 'utf8')))
const TAB = { inbox: 'Inbox', recents: 'Recents', chats: 'Chats', calls: 'Calls', feed: 'Feed', saved: 'Saved', dm: 'Messages', page: 'Pages', summary: 'Account', history: 'History', request: 'Requests', payees: 'Payees', apps: 'Apps' }

const browser = await chromium.launch({ channel: process.env.BROWSER ?? 'msedge' })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, serviceWorkers: 'block' })
const page = await ctx.newPage()
const problems = []
page.on('pageerror', (e) => problems.push('PAGEERROR ' + e.message))
page.on('console', (m) => { if (m.type() === 'error') problems.push('CONSOLE ' + m.text()) })
await page.addInitScript(() => {
  localStorage.setItem('money-mohalla-v1', JSON.stringify({ state: { language: 'en', persona: 'school', gender: 'girl', storySeen: true, completedPillars: [], liteMode: true }, version: 0 }))
  localStorage.setItem('p4.v1', JSON.stringify({ state: { profile: { avatar: 'male', level: 'confident', nickname: '', installId: 't', classCode: null, introSeen: true }, completed: ['TUT', 'C1', 'C2', 'C3'] }, version: 1 }))
  const v = sessionStorage.getItem('p4variant')
  if (v) { const s = JSON.parse(localStorage.getItem('p4.v1')); s.state.mysteryCurrent = v; s.state.mysteryPlayed = [v]; localStorage.setItem('p4.v1', JSON.stringify(s)) }
})

async function goTo(def, zoneId) {
  const loc = locate(indexCase(def), zoneId)
  await page.getByRole('button', { name: 'Home', exact: true }).click()
  await page.locator(`[data-app="${loc.app}"]`).click()
  const tab = page.getByRole('tab', { name: TAB[loc.tab] })
  if (await tab.count()) await tab.first().click()
  if (loc.thread) await page.getByRole('button', { name: loc.thread }).first().click()
  if (loc.profile) await page.getByRole('button', { name: /Profile/ }).click()
  if (loc.expand) await page.locator(`[data-item="${loc.expand}"]`).getByRole('button', { name: /recording|call highlights/i }).first().click()
}

let checked = 0
for (const key of (process.env.ONLY ?? 'tut,c1,c2,c3,ma,mb,mc').split(',')) {
  const def = load(key)
  const idx = indexCase(def)
  await page.goto(`${base}/play/safe`, { waitUntil: 'networkidle' })
  // open the case: the map button for a case id; mystery variants are opened by seeding the current variant
  if (def.kind === 'mystery') await page.evaluate((v) => sessionStorage.setItem('p4variant', v), def.id)
  await page.reload({ waitUntil: 'networkidle' })
  await page.locator(`[data-case="${def.kind === 'mystery' ? 'MYSTERY' : def.id}"]`).click()
  await page.getByRole('button', { name: 'Open the device' }).click()
  if (def.kind === 'tutorial') await page.getByRole('button', { name: 'Understood' }).click()
  console.log(`--- ${def.id}: ${[...idx.zones.keys()].length} zones`)
  for (const [zoneId, { zone }] of idx.zones) {
    const clue = idx.zoneClue.get(zoneId)
    try {
      await goTo(def, zoneId)
      const el = page.locator(`[data-zone="${zoneId}"]`).first()
      await el.scrollIntoViewIfNeeded()
      await el.click()
      const answer = clue ? clue.reason : 'fine'
      await page.locator(`[data-reason="${answer}"]`).click()
      const text = await page.locator('.p4-sheet').innerText()
      let want
      if (clue) want = /Correct\. That goes|Already logged/
      else if (zone.role === 'herring') want = /Good judgement/
      else if (zone.role === 'context') want = /genuine part of the story/
      else want = /Nothing unusual/
      if (!want.test(text)) problems.push(`${def.id} ${zoneId}: expected ${want}, got "${text.slice(0, 80).replace(/\n/g, ' ')}"`)
      await page.getByRole('button', { name: 'OK', exact: true }).click()
      checked++
    } catch (e) {
      problems.push(`${def.id} ${zoneId}: ${e.message.split('\n')[0]}`)
      await page.keyboard.press('Escape').catch(() => undefined)
      await page.reload({ waitUntil: 'networkidle' }).catch(() => undefined)
      await page.locator(`[data-case="${def.kind === 'mystery' ? 'MYSTERY' : def.id}"]`).click().catch(() => undefined)
      await page.getByRole('button', { name: /Open the device|Resume/ }).first().click().catch(() => undefined)
    }
  }
}
await browser.close()
console.log(`${checked} zones tapped through the UI`)
console.log(problems.length ? `\n${problems.length} problem(s):\n` + problems.join('\n') : 'All good.')
process.exit(problems.length ? 1 : 0)
