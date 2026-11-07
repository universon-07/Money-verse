// node tools/p4-hub-shot.mjs <out-prefix>: screenshots the hub map and the Pillar 4 entry on a phone screen
import { chromium } from 'playwright'
const out = process.argv[2] ?? 'hub'
const b = await chromium.launch({ channel: process.env.BROWSER ?? 'msedge' })
const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, serviceWorkers: 'block' })).newPage()
page.on('pageerror', (e) => console.log('PAGEERROR', e.message))
await page.addInitScript(() => {
  const k = 'money-mohalla-v1'
  const cur = JSON.parse(localStorage.getItem(k) || 'null')
  if (!cur) localStorage.setItem(k, JSON.stringify({ state: { language: 'en', persona: 'school', gender: 'girl', storySeen: true, completedPillars: [], liteMode: true }, version: 0 }))
})
await page.goto((process.env.URL ?? 'http://localhost:5173') + '/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await page.screenshot({ path: `${out}-map.png` })
await page.goto((process.env.URL ?? 'http://localhost:5173') + '/play/safe', { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
await page.screenshot({ path: `${out}-p4.png` })
await b.close()
