import { chromium } from 'playwright'
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
await p.addInitScript(() => localStorage.setItem('money-mohalla-v1', JSON.stringify({ state: { language: 'en', persona: 'college', startAmount: 4000, goalAmount: 30000, savedAmount: 4000, completedPillars: [], storySeen: true, celebrated: false, liteMode: false }, version: 0 })))
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500)
const t = () => p.evaluate(() => [...document.querySelectorAll('.anim-float')].map((e) => getComputedStyle(e).transform))
const a = await t(); await p.waitForTimeout(700); const c = await t()
console.log('animated keepers:', a.length, 'moving:', a.filter((v, i) => v !== c[i]).length)
await b.close()
