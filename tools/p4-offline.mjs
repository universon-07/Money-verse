// Offline check: needs `npm run build && npm run preview` (port 4173). Loads Pillar 4 online once so the service
// worker caches it, then goes offline, reloads, and plays the first clue.
import { chromium } from 'playwright'
const base = process.env.URL ?? 'http://localhost:4173'
const browser = await chromium.launch({ channel: process.env.BROWSER ?? 'msedge' })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
await page.addInitScript(() => {
  if (!localStorage.getItem('money-mohalla-v1')) localStorage.setItem('money-mohalla-v1', JSON.stringify({ state: { language: 'en', persona: 'school', startAmount: 1500, goalAmount: 12000, savedAmount: 1500, completedPillars: [], storySeen: true, celebrated: false, liteMode: true }, version: 0 }))
})
await page.goto(`${base}/play/safe`, { waitUntil: 'networkidle' })
await page.getByRole('button', { name: 'Open the case desk' }).click()
await page.waitForFunction(() => navigator.serviceWorker.controller || navigator.serviceWorker.ready.then(() => true), null, { timeout: 15000 })
await page.reload({ waitUntil: 'networkidle' }) // controlled by the worker now; this load fills the cache
await page.waitForTimeout(1500)
await ctx.setOffline(true)
await page.reload({ waitUntil: 'domcontentloaded' })
await page.locator('[data-case="TUT"]').click({ timeout: 10000 })
await page.getByRole('button', { name: 'Open the device' }).click()
const ok = await page.getByRole('button', { name: 'Understood' }).isVisible()
console.log(ok && !errors.length ? 'ok   Pillar 4 loads and plays offline' : `FAIL offline ${errors.join(' | ')}`)
await browser.close()
process.exit(ok && !errors.length ? 0 : 1)
